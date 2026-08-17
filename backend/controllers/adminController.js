const passport = require('passport');
const jwt = require('jsonwebtoken');

// Admin Login is typically handled directly in the route via passport.authenticate,
// but we will expose a controller method to check auth and handle logout.
const loginAdmin = (req, res) => {
  const token = jwt.sign(
    { id: req.user._id, username: req.user.username, email: req.user.email, role: 'admin' },
    process.env.JWT_SECRET || 'hospitalSessionSecret123!',
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Admin logged in successfully',
    token,
    admin: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
};

const logoutAdmin = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      return res.status(200).json({
        success: true,
        message: 'Admin logged out successfully'
      });
    });
  });
};

const checkAuth = async (req, res) => {
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Admin') {
    return res.status(200).json({
      success: true,
      authenticated: true,
      admin: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  }

  // Fallback to checking JWT auth header
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospitalSessionSecret123!');
      const Admin = require('../models/Admin');
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        return res.status(200).json({
          success: true,
          authenticated: true,
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email
          }
        });
      }
    }
  } catch (error) {
    console.error('JWT checkAuth error:', error);
  }

  return res.status(200).json({
    success: false,
    authenticated: false,
    message: 'Not authenticated'
  });
};

module.exports = {
  loginAdmin,
  logoutAdmin,
  checkAuth
};
