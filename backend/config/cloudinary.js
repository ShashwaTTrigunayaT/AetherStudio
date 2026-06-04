import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadAvatar(buffer, userId) {
  try {
    const b64 = buffer.toString('base64');
    const dataUri = `data:image/png;base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `avatars/${userId}`,
      public_id: 'profile',
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return result.secure_url;
  } catch (err) {
    logger.error('[Cloudinary] Upload failed:', err.message);
    throw err;
  }
}

export async function deleteAvatar(userId) {
  try {
    await cloudinary.uploader.destroy(`avatars/${userId}/profile`);
  } catch (err) {
    logger.warn('[Cloudinary] Delete failed (may not exist):', err.message);
  }
}
