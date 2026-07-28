import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { sendOTPEmail } from '../config/email';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const generateToken = (payload: { id: string; email: string; role: Role }) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

/**
 * Helper to generate, store, and email OTP with a 60s rate limit check
 */
const sendAndStoreOTP = async (email: string, name: string) => {
  const existingOTP = await prisma.oTP.findUnique({ where: { email } });
  if (existingOTP) {
    const secondsPassed = (Date.now() - new Date(existingOTP.createdAt).getTime()) / 1000;
    if (secondsPassed < 60) {
      const waitTime = Math.ceil(60 - secondsPassed);
      throw new Error(`Please wait ${waitTime} seconds before requesting a new OTP.`);
    }
  }

  // Generate a secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  // Hash the OTP using bcrypt for security
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Store or update OTP in DB
  await prisma.oTP.upsert({
    where: { email },
    update: {
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    },
    create: {
      email,
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
    },
  });

  // Dispatch email using Resend SDK
  try {
    await sendOTPEmail(email, name, otp);
  } catch (emailError: any) {
    console.error('Failed to send OTP email:', emailError);
    // If email dispatch fails, we should delete the OTP record we just created to keep DB clean
    await prisma.oTP.delete({ where: { email } }).catch(() => {});
    throw new Error(`Failed to send verification email: ${emailError.message || 'Check your Resend domain/address setup'}`);
  }
};

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { name, email, password, phone } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // If user exists but is unverified, update details and trigger a new OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          phone,
        },
      });

      try {
        await sendAndStoreOTP(email, name);
      } catch (err: any) {
        return res.status(429).json({ message: err.message });
      }

      return res.status(200).json({
        message: 'Registration updated. A verification OTP has been sent to your email.',
        email,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        walletBalance: 0.00,
        loyaltyPoints: 0,
        isVerified: false, // Inactive account by default
      },
    });

    try {
      await sendAndStoreOTP(email, name);
    } catch (err: any) {
      return res.status(429).json({ message: err.message });
    }

    return res.status(201).json({
      message: 'Registration successful. A verification OTP has been sent to your email.',
      email: user.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration', error });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first.', email: user.email });
    }

    if (user.email === process.env.ADMIN_EMAIL && user.role !== 'ADMIN') {
      await prisma.user.update({ where: { email: user.email }, data: { role: 'ADMIN' } });
      user.role = 'ADMIN' as any;
    } else if (user.email !== process.env.ADMIN_EMAIL && user.role === 'ADMIN') {
      await prisma.user.update({ where: { email: user.email }, data: { role: 'CUSTOMER' } });
      user.role = 'CUSTOMER' as any;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

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
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login', error });
  }
};

export const forgotPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    try {
      await sendAndStoreOTP(email, user.name);
    } catch (err: any) {
      return res.status(429).json({ message: err.message });
    }

    return res.status(200).json({
      message: 'OTP sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP dispatch', error });
  }
};

export const verifyOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpRecord = await prisma.oTP.findUnique({ where: { email } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP requested for this email' });
    }

    // Check expiration
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await prisma.oTP.delete({ where: { email } });
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      await prisma.oTP.delete({ where: { email } });
      return res.status(400).json({ message: 'Maximum verification attempts reached. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      const updatedRecord = await prisma.oTP.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });

      const attemptsRemaining = 5 - updatedRecord.attempts;
      if (attemptsRemaining <= 0) {
        await prisma.oTP.delete({ where: { email } });
        return res.status(400).json({ message: 'Maximum verification attempts reached. Please request a new OTP.' });
      }

      return res.status(400).json({ message: `Invalid OTP. ${attemptsRemaining} attempts remaining.` });
    }

    // OTP verified successfully - Invalidate the OTP
    await prisma.oTP.delete({ where: { email } });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      // Flow 1: Registration Verification -> activate user and log them in
      let roleToAssign: any = 'CUSTOMER';
      if (user.email === process.env.ADMIN_EMAIL) {
        roleToAssign = 'ADMIN';
      }

      const activatedUser = await prisma.user.update({
        where: { email },
        data: { isVerified: true, role: roleToAssign },
      });

      const token = generateToken({ id: activatedUser.id, email: activatedUser.email, role: activatedUser.role });

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
    } else {
      // Flow 2: Password Reset Verification -> generate short-lived reset token
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '15m',
      });

      return res.status(200).json({
        message: 'OTP verified successfully',
        resetToken,
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP verification', error });
  }
};

export const resendOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    try {
      await sendAndStoreOTP(email, user.name);
    } catch (err: any) {
      return res.status(429).json({ message: err.message });
    }

    return res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP resend', error });
  }
};

export const sendOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    try {
      await sendAndStoreOTP(email, user.name);
    } catch (err: any) {
      return res.status(429).json({ message: err.message });
    }

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP dispatch', error });
  }
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string;
    };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(400).json({ message: 'Invalid or expired reset token', error });
  }
};

export const googleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required for Google Auth' });
    }

    // Mock Google sign-in: upsert user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const mockPassword = await bcrypt.hash(googleId || Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: mockPassword,
          role: Role.CUSTOMER,
          walletBalance: 100.00, // Gift for google sign up
        },
      });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

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
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Internal server error during Google login', error });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Profile fetching error:', error);
    return res.status(500).json({ message: 'Internal server error fetching profile', error });
  }
};

export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const addressSchema = z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postalCode: z.string().min(1, 'Postal Code is required'),
      country: z.string().default('India'),
      isDefault: z.boolean().default(false),
    });

    const validation = addressSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const data = validation.data;

    if (data.isDefault) {
      // Unset previous defaults
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        ...data,
        userId: req.user.id,
      },
    });

    return res.status(201).json({ message: 'Address added successfully', address: newAddress });
  } catch (error) {
    console.error('Address create error:', error);
    return res.status(500).json({ message: 'Internal server error adding address', error });
  }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { addressId } = req.params;
    if (!addressId) return res.status(400).json({ message: 'Address ID is required' });

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Not authorized to delete this address' });
    }

    await prisma.address.delete({ where: { id: addressId } });
    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Address delete error:', error);
    return res.status(500).json({ message: 'Internal server error deleting address', error });
  }
};
