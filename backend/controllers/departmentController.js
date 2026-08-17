const Department = require('../models/Department');
const { departmentJoiSchema } = require('../validations/schemas');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// Get all departments
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({}).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    next(error);
  }
};

// Create a new department
const createDepartment = async (req, res, next) => {
  try {
    // Parse nested objects from string if sent as FormData
    ['departmentName', 'description'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep string and let Joi catch errors
        }
      }
    });

    const { error } = departmentJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Department image is required' });
    }

    const { departmentName, description, icon } = req.body;

    // Check if department name already exists
    const existingDept = await Department.findOne({
      $or: [
        { 'departmentName.en': departmentName.en },
        { 'departmentName.mr': departmentName.mr }
      ]
    });
    if (existingDept) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const newDept = new Department({
      departmentName,
      description,
      icon: icon || 'Activity',
      image: req.file.path // Cloudinary secure URL
    });

    await newDept.save();

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: newDept
    });
  } catch (error) {
    next(error);
  }
};

// Update department details
const updateDepartment = async (req, res, next) => {
  try {
    // Parse nested objects from string if sent as FormData
    ['departmentName', 'description'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep string and let Joi catch errors
        }
      }
    });

    const { error } = departmentJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { departmentName, description, icon } = req.body;
    
    // Check if another department has the same name
    const conflictingDept = await Department.findOne({ 
      _id: { $ne: req.params.id },
      $or: [
        { 'departmentName.en': departmentName.en },
        { 'departmentName.mr': departmentName.mr }
      ]
    });
    if (conflictingDept) {
      return res.status(400).json({ success: false, message: 'Another department with this name already exists' });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    department.departmentName = departmentName;
    department.description = description;
    department.icon = icon || 'Activity';

    // If new image is uploaded, update URL and delete old image from Cloudinary
    if (req.file) {
      if (department.image) {
        await deleteFromCloudinary(department.image);
      }
      department.image = req.file.path;
    }

    await department.save();

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    next(error);
  }
};

// Delete a department
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Delete image from Cloudinary
    if (department.image) {
      await deleteFromCloudinary(department.image);
    }

    await Department.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
