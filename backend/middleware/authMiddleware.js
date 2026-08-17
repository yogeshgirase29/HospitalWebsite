const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Compounder = require('../models/Compounder');

const isAdminAuthenticated = async (req, res, next) => {
  // Session authentication check
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Admin') {
    return next();
  }

  // JWT authentication
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospitalSessionSecret123!');
      
      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.id);
        if (admin) {
          req.user = admin;
          return next();
        }
      }
    }
  } catch (error) {
    console.error('JWT admin authentication error:', error);
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. Unauthorized. Please log in as Admin.'
  });
};

const isEmployeeAuthenticated = async (req, res, next) => {
  // Session authentication check
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Employee') {
    return next();
  }

  // JWT authentication
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospitalSessionSecret123!');
      
      if (decoded.role === 'employee') {
        const employee = await Employee.findById(decoded.id);
        if (employee && employee.status === 'Active') {
          req.user = employee;
          return next();
        }
      }
    }
  } catch (error) {
    console.error('JWT employee authentication error:', error);
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. Unauthorized. Please log in as Employee.'
  });
};

const isCompounderAuthenticated = async (req, res, next) => {
  // Session authentication check
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Compounder') {
    return next();
  }

  // JWT authentication
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospitalSessionSecret123!');
      
      if (decoded.role === 'compounder') {
        const compounder = await Compounder.findById(decoded.id);
        if (compounder && compounder.status === 'Active') {
          req.user = compounder;
          return next();
        }
      }
    }
  } catch (error) {
    console.error('JWT compounder authentication error:', error);
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. Unauthorized. Please log in as Compounder.'
  });
};

module.exports = {
  isAdminAuthenticated,
  isEmployeeAuthenticated,
  isCompounderAuthenticated
};
