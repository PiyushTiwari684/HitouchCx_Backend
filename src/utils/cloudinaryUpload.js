import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

const uploadToCloudinary = async function (photoUrl,photoId) {

    // Configuration
    cloudinary.config({
        cloud_name: 'dvgiafjxp',
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


    // Upload an image
    const uploadResult = await cloudinary.uploader
        .upload(
            photoUrl, {
            public_id: photoId,
        }
        )
        .catch((error) => {
            console.log(error);
        });


    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url(photoId, {
        fetch_format: 'auto',
        quality: 'auto'
    });


    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url(photoId, {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });


    return {uploadResult,optimizeUrl,autoCropUrl}
};

const deleteFromCloudinary = async function (publicId) {
  return cloudinary.uploader.destroy(publicId, { invalidate: true });
}
export {uploadToCloudinary,deleteFromCloudinary}