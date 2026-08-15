import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { supabase } from '../config/supabase';

/* ============================================================
   VALIDATION
============================================================ */

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

/* ============================================================
   JWT
============================================================ */

const generateToken = (payload: {
  id: string;
  email: string;
  role: Role;
}) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    }
  );
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
const sendSupabaseOTP = async (
  email: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } =
    await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

  if (error) {
    console.error(
      'Supabase OTP error:',
      error
    );

    throw new Error(
      error.message ||
      'Unable to send OTP'
    );
  }

  console.log('========================================');
  console.log('SUPABASE OTP SENT');
  console.log('To:', normalizedEmail);
  console.log('========================================');
};

/* ============================================================
   VERIFY SUPABASE OTP
============================================================ */

const verifySupabaseOTP = async (
  email: string,
  otp: string
) => {
  const normalizedEmail =
    email.trim().toLowerCase();

  const trimmedOtp =
    otp.toString().trim();

  const {
    data,
    error,
  } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: trimmedOtp,
    type: 'email',
  });

  if (error) {
    console.error(
      'Supabase OTP verification error:',
      error
    );

    throw new Error(
      error.message ||
      'Invalid or expired OTP'
    );
  }

  return data;
};

/* ============================================================
   REGISTER
============================================================ */

export const register = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const validation =
      signupSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        errors:
          validation.error.format(),
      });
    }

    const {
      name,
      email,
      password,
      phone,
    } = validation.data;

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await prisma.user.findUnique({
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
          message:
            'User with this email already exists',
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      await prisma.user.update({
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
        await sendSupabaseOTP(
          normalizedEmail
        );
      } catch (err: any) {
        return res.status(429).json({
          message: err.message,
        });
      }

      return res.status(200).json({
        message:
          'Registration updated. A verification OTP has been sent to your email.',
        email: normalizedEmail,
      });
    }

    /* ----------------------------------------------------------
       NEW USER
    ---------------------------------------------------------- */

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const user =
      await prisma.user.create({
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
      await sendSupabaseOTP(
        normalizedEmail
      );
    } catch (err: any) {
      return res.status(429).json({
        message: err.message,
      });
    }

    return res.status(201).json({
      message:
        'Registration successful. A verification OTP has been sent to your email.',
      email: user.email,
    });

  } catch (error) {

    console.error(
      'Registration error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during registration',
      error,
    });
  }
};

/* ============================================================
   LOGIN
============================================================ */

export const login = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const validation =
      loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        errors:
          validation.error.format(),
      });
    }

    const {
      email,
      password,
    } = validation.data;

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(401).json({
        message:
          'Invalid email or password',
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          'Please verify your email first.',
        email: user.email,
      });
    }

    /* ----------------------------------------------------------
       ADMIN ROLE
    ---------------------------------------------------------- */

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      'bloomonrestaurant@gmail.com';

    if (
      user.email === adminEmail &&
      user.role !== Role.ADMIN
    ) {

      await prisma.user.update({
        where: {
          email: user.email,
        },

        data: {
          role: Role.ADMIN,
        },
      });

      user.role = Role.ADMIN;

    } else if (
      user.email !== adminEmail &&
      user.role === Role.ADMIN
    ) {

      await prisma.user.update({
        where: {
          email: user.email,
        },

        data: {
          role: Role.CUSTOMER,
        },
      });

      user.role = Role.CUSTOMER;
    }

    const token =
      generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

    return res.status(200).json({
      message:
        'Login successful',

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        walletBalance:
          user.walletBalance,
        loyaltyPoints:
          user.loyaltyPoints,
      },
    });

  } catch (error) {

    console.error(
      'Login error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during login',
      error,
    });
  }
};

/* ============================================================
   FORGOT PASSWORD
============================================================ */

export const forgotPassword = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const { email } =
      req.body;

    if (!email) {
      return res.status(400).json({
        message:
          'Email is required',
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    try {
      await sendSupabaseOTP(
        normalizedEmail
      );
    } catch (err: any) {
      return res.status(429).json({
        message: err.message,
      });
    }

    return res.status(200).json({
      message:
        'OTP sent to your email.',
    });

  } catch (error) {

    console.error(
      'Forgot password error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during OTP dispatch',
      error,
    });
  }
};

/* ============================================================
   VERIFY OTP
============================================================ */

export const verifyOTP = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const {
      email,
      otp,
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message:
          'Email and OTP are required',
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    try {
      await verifySupabaseOTP(
        normalizedEmail,
        otp
      );
    } catch (err: any) {

      return res.status(400).json({
        message:
          err.message ||
          'Invalid or expired OTP',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    /* ----------------------------------------------------------
       REGISTRATION VERIFICATION
    ---------------------------------------------------------- */

    if (!user.isVerified) {

      const adminEmail =
        process.env.ADMIN_EMAIL ||
        'bloomonrestaurant@gmail.com';

      const roleToAssign =
        normalizedEmail ===
          adminEmail
          ? Role.ADMIN
          : Role.CUSTOMER;

      const activatedUser =
        await prisma.user.update({
          where: {
            email: normalizedEmail,
          },

          data: {
            isVerified: true,
            role: roleToAssign,
          },
        });

      const token =
        generateToken({
          id: activatedUser.id,
          email:
            activatedUser.email,
          role:
            activatedUser.role,
        });

      return res.status(200).json({

        message:
          'Email verified and account activated successfully.',

        token,

        user: {
          id: activatedUser.id,
          name: activatedUser.name,
          email:
            activatedUser.email,
          role:
            activatedUser.role,
          phone:
            activatedUser.phone,
          walletBalance:
            activatedUser.walletBalance,
          loyaltyPoints:
            activatedUser.loyaltyPoints,
        },
      });
    }

    /* ----------------------------------------------------------
       PASSWORD RESET
    ---------------------------------------------------------- */

    const resetToken =
      jwt.sign(
        {
          id: user.id,
          email: user.email,
          purpose: 'PASSWORD_RESET',
        },

        process.env.JWT_SECRET ||
        'fallback_secret',

        {
          expiresIn: '15m',
        }
      );

    return res.status(200).json({

      message:
        'OTP verified successfully',

      resetToken,
    });

  } catch (error) {

    console.error(
      'OTP verification error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during OTP verification',
      error,
    });
  }
};

/* ============================================================
   RESEND OTP
============================================================ */

export const resendOTP = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const { email } =
      req.body;

    if (!email) {
      return res.status(400).json({
        message:
          'Email is required',
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    try {

      await sendSupabaseOTP(
        normalizedEmail
      );

    } catch (err: any) {

      return res.status(429).json({
        message:
          err.message,
      });
    }

    return res.status(200).json({
      message:
        'A new OTP has been sent to your email.',
    });

  } catch (error) {

    console.error(
      'Resend OTP error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during OTP resend',
      error,
    });
  }
};

/* ============================================================
   SEND OTP
============================================================ */

export const sendOTP = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const { email } =
      req.body;

    if (!email) {
      return res.status(400).json({
        message:
          'Email is required',
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message:
          'Email is already verified.',
      });
    }

    try {

      await sendSupabaseOTP(
        normalizedEmail
      );

    } catch (err: any) {

      return res.status(429).json({
        message:
          err.message,
      });
    }

    return res.status(200).json({
      message:
        'OTP sent successfully.',
    });

  } catch (error) {

    console.error(
      'Send OTP error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during OTP dispatch',
      error,
    });
  }
};

/* ============================================================
   RESET PASSWORD
============================================================ */

export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const {
      resetToken,
      newPassword,
    } = req.body;

    if (
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          'Reset token and new password are required',
      });
    }

    if (
      newPassword.length < 6
    ) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters',
      });
    }

    const decoded =
      jwt.verify(
        resetToken,
        process.env.JWT_SECRET ||
        'fallback_secret'
      ) as {
        id: string;
        email?: string;
        purpose?: string;
      };

    if (
      decoded.purpose !==
      'PASSWORD_RESET'
    ) {
      return res.status(400).json({
        message:
          'Invalid reset token',
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await prisma.user.update({
      where: {
        id: decoded.id,
      },

      data: {
        password:
          hashedPassword,
      },
    });

    return res.status(200).json({
      message:
        'Password reset successful',
    });

  } catch (error) {

    console.error(
      'Reset password error:',
      error
    );

    return res.status(400).json({
      message:
        'Invalid or expired reset token',
    });
  }
};

/* ============================================================
   GOOGLE LOGIN
============================================================ */

export const googleLogin = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const {
      email,
      name,
      googleId,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        message:
          'Email and name are required for Google Auth',
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    let user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {

      const mockPassword =
        await bcrypt.hash(
          googleId ||
          Math.random()
            .toString(36),
          10
        );

      user =
        await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            password:
              mockPassword,
            role:
              Role.CUSTOMER,
            walletBalance:
              100.00,
            isVerified: true,
          },
        });
    }

    const token =
      generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

    return res.status(200).json({

      message:
        'Google login successful',

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        walletBalance:
          user.walletBalance,
        loyaltyPoints:
          user.loyaltyPoints,
      },
    });

  } catch (error) {

    console.error(
      'Google login error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error during Google login',
      error,
    });
  }
};

/* ============================================================
   GET PROFILE
============================================================ */

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message:
          'Unauthorized',
      });
    }

    const user =
      await prisma.user.findUnique({
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
        message:
          'User not found',
      });
    }

    const {
      password,
      ...safeUser
    } = user;

    return res.status(200).json({
      user: safeUser,
    });

  } catch (error) {

    console.error(
      'Profile fetching error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error fetching profile',
      error,
    });
  }
};

/* ============================================================
   ADD ADDRESS
============================================================ */

export const addAddress = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message:
          'Unauthorized',
      });
    }

    const addressSchema =
      z.object({

        street:
          z.string().min(
            1,
            'Street is required'
          ),

        city:
          z.string().min(
            1,
            'City is required'
          ),

        state:
          z.string().min(
            1,
            'State is required'
          ),

        postalCode:
          z.string().min(
            1,
            'Postal Code is required'
          ),

        country:
          z.string()
            .default('India'),

        isDefault:
          z.boolean()
            .default(false),
      });

    const validation =
      addressSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        errors:
          validation.error.format(),
      });
    }

    const data =
      validation.data;

    if (data.isDefault) {

      await prisma.address.updateMany({
        where: {
          userId:
            req.user.id,
          isDefault:
            true,
        },

        data: {
          isDefault:
            false,
        },
      });
    }

    const newAddress =
      await prisma.address.create({
        data: {
          ...data,
          userId:
            req.user.id,
        },
      });

    return res.status(201).json({
      message:
        'Address added successfully',

      address:
        newAddress,
    });

  } catch (error) {

    console.error(
      'Address create error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error adding address',
      error,
    });
  }
};

/* ============================================================
   DELETE ADDRESS
============================================================ */

export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const {
      addressId,
    } = req.params;

    if (!addressId) {
      return res.status(400).json({
        message:
          'Address ID is required',
      });
    }

    const address =
      await prisma.address.findUnique({
        where: {
          id: addressId,
        },
      });

    if (
      !address ||
      address.userId !==
      req.user?.id
    ) {
      return res.status(403).json({
        message:
          'Not authorized to delete this address',
      });
    }

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    return res.status(200).json({
      message:
        'Address deleted successfully',
    });

  } catch (error) {

    console.error(
      'Address delete error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error deleting address',
      error,
    });
  }
};

/* ============================================================
   SEND PROFILE OTP
============================================================ */

export const sendProfileOTP = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message:
          'Unauthorized',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    try {

      await sendSupabaseOTP(
        user.email
      );

    } catch (err: any) {

      return res.status(429).json({
        message:
          err.message,
      });
    }

    return res.status(200).json({
      message:
        `Security OTP sent to ${user.email}`,
    });

  } catch (error) {

    console.error(
      'Send profile OTP error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error sending OTP',
      error,
    });
  }
};

/* ============================================================
   UPDATE PROFILE WITH OTP
============================================================ */

export const updateProfileWithOTP = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message:
          'Unauthorized',
      });
    }

    const {
      type,
      otp,
      newEmail,
      newPassword,
      newPhone,
    } = req.body;

    if (!type || !otp) {
      return res.status(400).json({
        message:
          'Verification OTP and update type are required',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    /* ----------------------------------------------------------
       VERIFY SUPABASE OTP
    ---------------------------------------------------------- */

    try {

      await verifySupabaseOTP(
        user.email,
        otp
      );

    } catch (err: any) {

      return res.status(400).json({
        message:
          err.message ||
          'Invalid or expired OTP',
      });
    }

    let updateData: any = {};

    /* ----------------------------------------------------------
       EMAIL
    ---------------------------------------------------------- */

    if (type === 'EMAIL') {

      if (
        !newEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          newEmail
        )
      ) {
        return res.status(400).json({
          message:
            'Please provide a valid new email address.',
        });
      }

      const normalizedEmail =
        newEmail
          .trim()
          .toLowerCase();

      const existing =
        await prisma.user.findUnique({
          where: {
            email:
              normalizedEmail,
          },
        });

      if (
        existing &&
        existing.id !== user.id
      ) {
        return res.status(400).json({
          message:
            'This email address is already registered to another account.',
        });
      }

      updateData.email =
        normalizedEmail;
    }

    /* ----------------------------------------------------------
       PASSWORD
    ---------------------------------------------------------- */

    else if (
      type === 'PASSWORD'
    ) {

      if (
        !newPassword ||
        newPassword.length < 6
      ) {
        return res.status(400).json({
          message:
            'New password must be at least 6 characters long.',
        });
      }

      updateData.password =
        await bcrypt.hash(
          newPassword,
          10
        );
    }

    /* ----------------------------------------------------------
       PHONE
    ---------------------------------------------------------- */

    else if (
      type === 'PHONE'
    ) {

      if (
        !newPhone ||
        newPhone.trim()
          .length < 8
      ) {
        return res.status(400).json({
          message:
            'Please provide a valid phone number.',
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
        message:
          'Invalid update type',
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data:
          updateData,
      });

    const token =
      generateToken({
        id:
          updatedUser.id,
        email:
          updatedUser.email,
        role:
          updatedUser.role,
      });

    return res.status(200).json({

      message:
        `${type === 'EMAIL'
          ? 'Email'
          : type === 'PASSWORD'
            ? 'Password'
            : 'Phone'
        } updated successfully!`,

      token,

      user: {
        id:
          updatedUser.id,
        name:
          updatedUser.name,
        email:
          updatedUser.email,
        role:
          updatedUser.role,
        phone:
          updatedUser.phone,
        walletBalance:
          updatedUser.walletBalance,
        loyaltyPoints:
          updatedUser.loyaltyPoints,
      },
    });

  } catch (error) {

    console.error(
      'Update profile with OTP error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error updating credentials',
      error,
    });
  }
};