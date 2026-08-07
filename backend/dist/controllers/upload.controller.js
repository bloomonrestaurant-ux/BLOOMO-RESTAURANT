"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: 'bloomon_restaurant' }, (error, result) => {
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
        });
        uploadStream.end(req.file.buffer);
    }
    catch (error) {
        console.error('Unexpected error during image upload:', error);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred during upload', error: error.message });
    }
};
exports.uploadImage = uploadImage;
