import { supabase } from './supabase';

export const sendOTPEmail = async (
  email: string,
  _name: string,
  _otp?: string
) => {
  const normalizedEmail =
    email.trim().toLowerCase();

  const { error } =
    await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

  if (error) {
    console.error(
      'Supabase OTP email error:',
      error
    );

    throw new Error(
      error.message ||
      'Failed to send OTP email'
    );
  }

  console.log(
    'Supabase OTP email sent to:',
    normalizedEmail
  );

  return {
    id: 'supabase-auth-otp',
  };
};