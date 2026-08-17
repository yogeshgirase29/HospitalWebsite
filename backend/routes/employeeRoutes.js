const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isEmployeeAuthenticated } = require('../middleware/authMiddleware');
const {
  loginEmployee,
  logoutEmployee,
  checkEmployeeAuth,
  checkIn,
  checkOut,
  getAttendanceHistory
} = require('../controllers/employeeController');

// Employee Login
router.post('/login', (req, res, next) => {
  passport.authenticate('employee-local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({
        success: false,
        message: info ? info.message : 'Invalid email or password'
      });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administration.'
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return loginEmployee(req, res);
    });
  })(req, res, next);
});

// Employee Logout
router.post('/logout', logoutEmployee);

// Get current Employee
router.get('/current-employee', checkEmployeeAuth);

// Attendance Actions
router.post('/attendance/check-in', isEmployeeAuthenticated, checkIn);
router.post('/attendance/check-out', isEmployeeAuthenticated, checkOut);
router.get('/attendance/history', isEmployeeAuthenticated, getAttendanceHistory);

module.exports = router;
