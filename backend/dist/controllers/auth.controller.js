"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileWithOTP = exports.sendProfileOTP = exports.deleteAddress = exports.addAddress = exports.getProfile = exports.googleLogin = exports.resetPassword = exports.sendOTP = exports.resendOTP = exports.verifyOTP = exports.forgotPassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
const supabase_1 = require("../config/supabase");
/* ============================================================
   VALIDATION
============================================================ */
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
/* ============================================================
   JWT
============================================================ */
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d'),
    });
};
/* ============================================================
   SUPABASE OTP
============================================================ */
/**
 * Send OTP through Supabase Auth.
 *
 * This replaces Resend.
 * Supabase handles the actual email delivery.
 */
const sendSupabaseOTP = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase_1.supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
            shouldCreateUser: true,
        },
    });
    if (error) {
        console.error('Supabase OTP error:', error);
        throw new Error(error.message ||
            'Unable to send OTP');
    }
    console.log('========================================');
    console.log('SUPABASE OTP SENT');
    console.log('To:', normalizedEmail);
    console.log('========================================');
};
/* ============================================================
   VERIFY SUPABASE OTP
============================================================ */
const verifySupabaseOTP = async (email, otp) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.toString().trim();
    const { data, error, } = await supabase_1.supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: trimmedOtp,
        type: 'email',
    });
    if (error) {
        console.error('Supabase OTP verification error:', error);
        throw new Error(error.message ||
            'Invalid or expired OTP');
    }
    return data;
};
/* ============================================================
   REGISTER
============================================================ */
const register = async (req, res) => {
    try {
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.format(),
            });
        }
        const { name, email, password, phone, } = validation.data;
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        /* ----------------------------------------------------------
           EXISTING USER
        ---------------------------------------------------------- */
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({
                    message: 'User with this email already exists',
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            await db_1.default.user.update({
                where: {
                    email: normalizedEmail,
                },
                data: {
                    name,
                    password: hashedPassword,
                    phone,
                },
            });
            try {
                await sendSupabaseOTP(normalizedEmail);
            }
            catch (err) {
                return res.status(429).json({
                    message: err.message,
                });
            }
            return res.status(200).json({
                message: 'Registration updated. A verification OTP has been sent to your email.',
                email: normalizedEmail,
            });
        }
        /* ----------------------------------------------------------
           NEW USER
        ---------------------------------------------------------- */
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.default.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                phone,
                walletBalance: 0.00,
                loyaltyPoints: 0,
                isVerified: false,
            },
        });
        try {
            await sendSupabaseOTP(normalizedEmail);
        }
        catch (err) {
            return res.status(429).json({
                message: err.message,
            });
        }
        return res.status(201).json({
            message: 'Registration successful. A verification OTP has been sent to your email.',
            email: user.email,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: 'Internal server error during registration',
            error,
        });
    }
};
exports.register = register;
/* ============================================================
   LOGIN
============================================================ */
const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.format(),
            });
        }
        const { email, password, } = validation.data;
        const normalizedEmail = email.trim().toLowerCase();
        const user = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password',
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password',
            });
        }
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Please verify your email first.',
                email: user.email,
            });
        }
        /* ----------------------------------------------------------
           ADMIN ROLE
        ---------------------------------------------------------- */
        const adminEmail = process.env.ADMIN_EMAIL ||
            'bloomonrestaurant@gmail.com';
        if (user.email === adminEmail &&
            user.role !== client_1.Role.ADMIN) {
            await db_1.default.user.update({
                where: {
                    email: user.email,
                },
                data: {
                    role: client_1.Role.ADMIN,
                },
            });
            user.role = client_1.Role.ADMIN;
        }
        else if (user.email !== adminEmail &&
            user.role === client_1.Role.ADMIN) {
            await db_1.default.user.update({
                where: {
                    email: user.email,
                },
                data: {
                    role: client_1.Role.CUSTOMER,
                },
            });
            user.role = client_1.Role.CUSTOMER;
        }
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                walletBalance: user.walletBalance,
                loyaltyPoints: user.loyaltyPoints,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: 'Internal server error during login',
            error,
        });
    }
};
exports.login = login;
/* ============================================================
   FORGOT PASSWORD
============================================================ */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        try {
            await sendSupabaseOTP(normalizedEmail);
        }
        catch (err) {
            return res.status(429).json({
                message: err.message,
            });
        }
        return res.status(200).json({
            message: 'OTP sent to your email.',
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            message: 'Internal server error during OTP dispatch',
            error,
        });
    }
};
exports.forgotPassword = forgotPassword;
/* ============================================================
   VERIFY OTP
============================================================ */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp, } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                message: 'Email and OTP are required',
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        try {
            await verifySupabaseOTP(normalizedEmail, otp);
        }
        catch (err) {
            return res.status(400).json({
                message: err.message ||
                    'Invalid or expired OTP',
            });
        }
        const user = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        /* ----------------------------------------------------------
           REGISTRATION VERIFICATION
        ---------------------------------------------------------- */
        if (!user.isVerified) {
            const adminEmail = process.env.ADMIN_EMAIL ||
                'bloomonrestaurant@gmail.com';
            const roleToAssign = normalizedEmail ===
                adminEmail
                ? client_1.Role.ADMIN
                : client_1.Role.CUSTOMER;
            const activatedUser = await db_1.default.user.update({
                where: {
                    email: normalizedEmail,
                },
                data: {
                    isVerified: true,
                    role: roleToAssign,
                },
            });
            const token = generateToken({
                id: activatedUser.id,
                email: activatedUser.email,
                role: activatedUser.role,
            });
            return res.status(200).json({
                message: 'Email verified and account activated successfully.',
                token,
                user: {
                    id: activatedUser.id,
                    name: activatedUser.name,
                    email: activatedUser.email,
                    role: activatedUser.role,
                    phone: activatedUser.phone,
                    walletBalance: activatedUser.walletBalance,
                    loyaltyPoints: activatedUser.loyaltyPoints,
                },
            });
        }
        /* ----------------------------------------------------------
           PASSWORD RESET
        ---------------------------------------------------------- */
        const resetToken = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            purpose: 'PASSWORD_RESET',
        }, process.env.JWT_SECRET ||
            'fallback_secret', {
            expiresIn: '15m',
        });
        return res.status(200).json({
            message: 'OTP verified successfully',
            resetToken,
        });
    }
    catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
            message: 'Internal server error during OTP verification',
            error,
        });
    }
};
exports.verifyOTP = verifyOTP;
/* ============================================================
   RESEND OTP
============================================================ */
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        try {
            await sendSupabaseOTP(normalizedEmail);
        }
        catch (err) {
            return res.status(429).json({
                message: err.message,
            });
        }
        return res.status(200).json({
            message: 'A new OTP has been sent to your email.',
        });
    }
    catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({
            message: 'Internal server error during OTP resend',
            error,
        });
    }
};
exports.resendOTP = resendOTP;
/* ============================================================
   SEND OTP
============================================================ */
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        if (user.isVerified) {
            return res.status(400).json({
                message: 'Email is already verified.',
            });
        }
        try {
            await sendSupabaseOTP(normalizedEmail);
        }
        catch (err) {
            return res.status(429).json({
                message: err.message,
            });
        }
        return res.status(200).json({
            message: 'OTP sent successfully.',
        });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({
            message: 'Internal server error during OTP dispatch',
            error,
        });
    }
};
exports.sendOTP = sendOTP;
/* ============================================================
   RESET PASSWORD
============================================================ */
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword, } = req.body;
        if (!resetToken ||
            !newPassword) {
            return res.status(400).json({
                message: 'Reset token and new password are required',
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters',
            });
        }
        const decoded = jsonwebtoken_1.default.verify(resetToken, process.env.JWT_SECRET ||
            'fallback_secret');
        if (decoded.purpose !==
            'PASSWORD_RESET') {
            return res.status(400).json({
                message: 'Invalid reset token',
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await db_1.default.user.update({
            where: {
                id: decoded.id,
            },
            data: {
                password: hashedPassword,
            },
        });
        return res.status(200).json({
            message: 'Password reset successful',
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        return res.status(400).json({
            message: 'Invalid or expired reset token',
        });
    }
};
exports.resetPassword = resetPassword;
/* ============================================================
   GOOGLE LOGIN
============================================================ */
const googleLogin = async (req, res) => {
    try {
        const { email, name, googleId, } = req.body;
        if (!email || !name) {
            return res.status(400).json({
                message: 'Email and name are required for Google Auth',
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        let user = await db_1.default.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });
        if (!user) {
            const mockPassword = await bcryptjs_1.default.hash(googleId ||
                Math.random()
                    .toString(36), 10);
            user =
                await db_1.default.user.create({
                    data: {
                        name,
                        email: normalizedEmail,
                        password: mockPassword,
                        role: client_1.Role.CUSTOMER,
                        walletBalance: 100.00,
                        isVerified: true,
                    },
                });
        }
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return res.status(200).json({
            message: 'Google login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                walletBalance: user.walletBalance,
                loyaltyPoints: user.loyaltyPoints,
            },
        });
    }
    catch (error) {
        console.error('Google login error:', error);
        return res.status(500).json({
            message: 'Internal server error during Google login',
            error,
        });
    }
};
exports.googleLogin = googleLogin;
/* ============================================================
   GET PROFILE
============================================================ */
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
            });
        }
        const user = await db_1.default.user.findUnique({
            where: {
                id: req.user.id,
            },
            include: {
                addresses: true,
                orders: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 20,
                    include: {
                        items: {
                            include: {
                                menuItem: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        const { password, ...safeUser } = user;
        return res.status(200).json({
            user: safeUser,
        });
    }
    catch (error) {
        console.error('Profile fetching error:', error);
        return res.status(500).json({
            message: 'Internal server error fetching profile',
            error,
        });
    }
};
exports.getProfile = getProfile;
/* ============================================================
   ADD ADDRESS
============================================================ */
const addAddress = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
            });
        }
        const addressSchema = zod_1.z.object({
            street: zod_1.z.string().min(1, 'Street is required'),
            city: zod_1.z.string().min(1, 'City is required'),
            state: zod_1.z.string().min(1, 'State is required'),
            postalCode: zod_1.z.string().min(1, 'Postal Code is required'),
            country: zod_1.z.string()
                .default('India'),
            isDefault: zod_1.z.boolean()
                .default(false),
        });
        const validation = addressSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.format(),
            });
        }
        const data = validation.data;
        if (data.isDefault) {
            await db_1.default.address.updateMany({
                where: {
                    userId: req.user.id,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
        }
        const newAddress = await db_1.default.address.create({
            data: {
                ...data,
                userId: req.user.id,
            },
        });
        return res.status(201).json({
            message: 'Address added successfully',
            address: newAddress,
        });
    }
    catch (error) {
        console.error('Address create error:', error);
        return res.status(500).json({
            message: 'Internal server error adding address',
            error,
        });
    }
};
exports.addAddress = addAddress;
/* ============================================================
   DELETE ADDRESS
============================================================ */
const deleteAddress = async (req, res) => {
    try {
        const { addressId, } = req.params;
        if (!addressId) {
            return res.status(400).json({
                message: 'Address ID is required',
            });
        }
        const address = await db_1.default.address.findUnique({
            where: {
                id: addressId,
            },
        });
        if (!address ||
            address.userId !==
                req.user?.id) {
            return res.status(403).json({
                message: 'Not authorized to delete this address',
            });
        }
        await db_1.default.address.delete({
            where: {
                id: addressId,
            },
        });
        return res.status(200).json({
            message: 'Address deleted successfully',
        });
    }
    catch (error) {
        console.error('Address delete error:', error);
        return res.status(500).json({
            message: 'Internal server error deleting address',
            error,
        });
    }
};
exports.deleteAddress = deleteAddress;
/* ============================================================
   SEND PROFILE OTP
============================================================ */
const sendProfileOTP = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
            });
        }
        const user = await db_1.default.user.findUnique({
            where: {
                id: req.user.id,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        try {
            await sendSupabaseOTP(user.email);
        }
        catch (err) {
            return res.status(429).json({
                message: err.message,
            });
        }
        return res.status(200).json({
            message: `Security OTP sent to ${user.email}`,
        });
    }
    catch (error) {
        console.error('Send profile OTP error:', error);
        return res.status(500).json({
            message: 'Internal server error sending OTP',
            error,
        });
    }
};
exports.sendProfileOTP = sendProfileOTP;
/* ============================================================
   UPDATE PROFILE WITH OTP
============================================================ */
const updateProfileWithOTP = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
            });
        }
        const { type, otp, newEmail, newPassword, newPhone, } = req.body;
        if (!type || !otp) {
            return res.status(400).json({
                message: 'Verification OTP and update type are required',
            });
        }
        const user = await db_1.default.user.findUnique({
            where: {
                id: req.user.id,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        /* ----------------------------------------------------------
           VERIFY SUPABASE OTP
        ---------------------------------------------------------- */
        try {
            await verifySupabaseOTP(user.email, otp);
        }
        catch (err) {
            return res.status(400).json({
                message: err.message ||
                    'Invalid or expired OTP',
            });
        }
        let updateData = {};
        /* ----------------------------------------------------------
           EMAIL
        ---------------------------------------------------------- */
        if (type === 'EMAIL') {
            if (!newEmail ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                return res.status(400).json({
                    message: 'Please provide a valid new email address.',
                });
            }
            const normalizedEmail = newEmail
                .trim()
                .toLowerCase();
            const existing = await db_1.default.user.findUnique({
                where: {
                    email: normalizedEmail,
                },
            });
            if (existing &&
                existing.id !== user.id) {
                return res.status(400).json({
                    message: 'This email address is already registered to another account.',
                });
            }
            updateData.email =
                normalizedEmail;
        }
        /* ----------------------------------------------------------
           PASSWORD
        ---------------------------------------------------------- */
        else if (type === 'PASSWORD') {
            if (!newPassword ||
                newPassword.length < 6) {
                return res.status(400).json({
                    message: 'New password must be at least 6 characters long.',
                });
            }
            updateData.password =
                await bcryptjs_1.default.hash(newPassword, 10);
        }
        /* ----------------------------------------------------------
           PHONE
        ---------------------------------------------------------- */
        else if (type === 'PHONE') {
            if (!newPhone ||
                newPhone.trim()
                    .length < 8) {
                return res.status(400).json({
                    message: 'Please provide a valid phone number.',
                });
            }
            updateData.phone =
                newPhone.trim();
        }
        /* ----------------------------------------------------------
           INVALID TYPE
        ---------------------------------------------------------- */
        else {
            return res.status(400).json({
                message: 'Invalid update type',
            });
        }
        const updatedUser = await db_1.default.user.update({
            where: {
                id: user.id,
            },
            data: updateData,
        });
        const token = generateToken({
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
        });
        return res.status(200).json({
            message: `${type === 'EMAIL'
                ? 'Email'
                : type === 'PASSWORD'
                    ? 'Password'
                    : 'Phone'} updated successfully!`,
            token,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                walletBalance: updatedUser.walletBalance,
                loyaltyPoints: updatedUser.loyaltyPoints,
            },
        });
    }
    catch (error) {
        console.error('Update profile with OTP error:', error);
        return res.status(500).json({
            message: 'Internal server error updating credentials',
            error,
        });
    }
};
exports.updateProfileWithOTP = updateProfileWithOTP;
