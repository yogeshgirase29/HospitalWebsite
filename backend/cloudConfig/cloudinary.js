const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || 'hospital-management';

const doctorStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${baseFolder}/doctors`,
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
    transformation: [{ width: 400, height: 435, crop: 'fill' }] // Optimizing doctor profile image sizing
  }
});

const departmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${baseFolder}/departments`,
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp']
  }
});

const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${baseFolder}/gallery`,
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp']
  }
});

const newsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${baseFolder}/news`,
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp']
  }
});

const testimonialStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${baseFolder}/testimonials`,
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp']
  }
});

module.exports = {
  cloudinary,
  storage: doctorStorage, // For backward compatibility with existing routes
  doctorStorage,
  departmentStorage,
  galleryStorage,
  newsStorage,
  testimonialStorage
};
