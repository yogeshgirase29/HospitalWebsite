const Gallery = require('../models/Gallery');
const { galleryJoiSchema } = require('../validations/schemas');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// Get all gallery items (Public/Admin)
const getAllGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: gallery.length,
      gallery
    });
  } catch (error) {
    next(error);
  }
};

// Create a gallery item (Admin)
const createGallery = async (req, res, next) => {
  try {
    const { error } = galleryJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Gallery image is required' });
    }

    const { title, category } = req.body;

    const newImage = new Gallery({
      title,
      image: req.file.path,
      category
    });

    await newImage.save();
    return res.status(201).json({
      success: true,
      message: 'Image added to gallery successfully',
      gallery: newImage
    });
  } catch (error) {
    next(error);
  }
};

// Delete a gallery item (Admin)
const deleteGallery = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    if (item.image) {
      await deleteFromCloudinary(item.image);
    }

    await Gallery.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update a gallery item (Admin)
const updateGallery = async (req, res, next) => {
  try {
    const { error } = galleryJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    const { title, category } = req.body;
    item.title = title;
    item.category = category;

    if (req.file) {
      if (item.image) {
        await deleteFromCloudinary(item.image);
      }
      item.image = req.file.path;
    }

    await item.save();
    return res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      gallery: item
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGallery,
  createGallery,
  deleteGallery,
  updateGallery
};
