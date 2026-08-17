const News = require('../models/News');
const { newsJoiSchema } = require('../validations/schemas');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// Get all news posts (Public/Admin)
const getAllNews = async (req, res, next) => {
  try {
    const news = await News.find({}).sort({ date: -1 });
    return res.status(200).json({
      success: true,
      count: news.length,
      news
    });
  } catch (error) {
    next(error);
  }
};

// Create a news post (Admin)
const createNews = async (req, res, next) => {
  try {
    // Parse nested objects from string if sent as FormData
    ['title', 'description'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep string and let Joi catch errors
        }
      }
    });

    const { error } = newsJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'News image is required' });
    }

    const { title, description, date } = req.body;

    const newPost = new News({
      title,
      description,
      image: req.file.path,
      date: date || new Date()
    });

    await newPost.save();
    return res.status(201).json({
      success: true,
      message: 'News post created successfully',
      news: newPost
    });
  } catch (error) {
    next(error);
  }
};

// Update a news post (Admin)
const updateNews = async (req, res, next) => {
  try {
    // Parse nested objects from string if sent as FormData
    ['title', 'description'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep string and let Joi catch errors
        }
      }
    });

    const { error } = newsJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const post = await News.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'News post not found' });
    }

    const { title, description, date } = req.body;

    post.title = title;
    post.description = description;
    if (date) post.date = date;

    if (req.file) {
      if (post.image) {
        await deleteFromCloudinary(post.image);
      }
      post.image = req.file.path;
    }

    await post.save();
    return res.status(200).json({
      success: true,
      message: 'News post updated successfully',
      news: post
    });
  } catch (error) {
    next(error);
  }
};

// Delete a news post (Admin)
const deleteNews = async (req, res, next) => {
  try {
    const post = await News.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'News post not found' });
    }

    if (post.image) {
      await deleteFromCloudinary(post.image);
    }

    await News.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'News post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNews,
  createNews,
  updateNews,
  deleteNews
};
