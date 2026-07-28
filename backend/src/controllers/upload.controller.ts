import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

export const uploadImage = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'bloomon_restaurant' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
        }
        
        if (!result) {
          return res.status(500).json({ success: false, message: 'Image upload failed: No result from Cloudinary' });
        }

        return res.status(200).json({
          success: true,
          imageUrl: result.secure_url
        });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error: any) {
    console.error('Unexpected error during image upload:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred during upload', error: error.message });
  }
};
