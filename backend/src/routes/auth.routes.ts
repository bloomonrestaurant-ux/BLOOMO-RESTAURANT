import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resendOTP,
  sendOTP,
  resetPassword,
  googleLogin,
  getProfile,
  addAddress,
  deleteAddress,
  sendProfileOTP,
  updateProfileWithOTP,
} from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/send-otp', sendOTP);
router.post('/reset-password', resetPassword);
router.post('/google-login', googleLogin);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/profile/send-otp', protect, sendProfileOTP);
router.put('/profile/update-with-otp', protect, updateProfileWithOTP);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);

export default router;

