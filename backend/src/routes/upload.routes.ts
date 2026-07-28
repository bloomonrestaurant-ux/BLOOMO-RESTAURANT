import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import upload from '../config/multer';

const router = Router();

router.post('/image', upload.single('image'), uploadImage);

export default router;
