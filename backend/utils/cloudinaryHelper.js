const cloudinary = require('cloudinary').v2;

const extractPublicId = (imageUrl) => {
  if (!imageUrl) return null;
  const parts = imageUrl.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  let startIdx = uploadIndex + 1;
  // Cloudinary URLs usually have a version segment like v1234567890 right after upload/
  if (parts[startIdx] && (parts[startIdx].startsWith('v') || /^\d+$/.test(parts[startIdx]))) {
    startIdx++;
  }
  
  const remainingPath = parts.slice(startIdx).join('/');
  const publicId = remainingPath.substring(0, remainingPath.lastIndexOf('.')) || remainingPath;
  return publicId;
};

const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`Cloudinary deletion for publicId "${publicId}" result:`, result);
      return result;
    } catch (err) {
      console.error(`Failed to delete "${publicId}" from Cloudinary:`, err);
    }
  }
};

module.exports = {
  extractPublicId,
  deleteFromCloudinary
};
