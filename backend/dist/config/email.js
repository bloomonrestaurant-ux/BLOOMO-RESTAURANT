"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const supabase_1 = require("./supabase");
const sendOTPEmail = async (email, _name, _otp) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase_1.supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
            shouldCreateUser: true,
        },
    });
    if (error) {
        console.error('Supabase OTP email error:', error);
        throw new Error(error.message ||
            'Failed to send OTP email');
    }
    console.log('Supabase OTP email sent to:', normalizedEmail);
    return {
        id: 'supabase-auth-otp',
    };
};
exports.sendOTPEmail = sendOTPEmail;
