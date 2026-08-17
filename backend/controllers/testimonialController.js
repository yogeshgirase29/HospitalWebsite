const Testimonial = require('../models/Testimonial');
const { testimonialJoiSchema } = require('../validations/schemas');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// Get all testimonials (Public/Admin)
const getAllTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: testimonials.length,
      testimonials
    });
  } catch (error) {
    next(error);
  }
};

// Create a testimonial (Admin)
const createTestimonial = async (req, res, next) => {
  try {
    // Parse rating as number if it came from FormData as string
    if (typeof req.body.rating === 'string') {
      req.body.rating = Number(req.body.rating);
    }

    const { error } = testimonialJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { patientName, feedback, rating } = req.body;
    
    let imagePath = '';
    if (req.file) {
      imagePath = req.file.path;
    }

    const newTestimonial = new Testimonial({
      patientName,
      feedback,
      rating,
      image: imagePath || undefined
    });

    await newTestimonial.save();
    return res.status(201).json({
      success: true,
      message: 'Testimonial added successfully',
      testimonial: newTestimonial
    });
  } catch (error) {
    next(error);
  }
};

// Update a testimonial (Admin)
const updateTestimonial = async (req, res, next) => {
  try {
    if (typeof req.body.rating === 'string') {
      req.body.rating = Number(req.body.rating);
    }

    const { error } = testimonialJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    const { patientName, feedback, rating } = req.body;

    testimonial.patientName = patientName;
    testimonial.feedback = feedback;
    testimonial.rating = rating;

    if (req.file) {
      if (testimonial.image) {
        await deleteFromCloudinary(testimonial.image);
      }
      testimonial.image = req.file.path;
    }

    await testimonial.save();
    return res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Delete a testimonial (Admin)
const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    if (testimonial.image) {
      await deleteFromCloudinary(testimonial.image);
    }

    await Testimonial.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
