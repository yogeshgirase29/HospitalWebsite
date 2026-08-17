const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginAdmin, logoutAdmin, checkAuth } = require('../controllers/adminController');

// Admin Login route using Passport Local Strategy
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({
        success: false,
        message: info ? info.message : 'Invalid username or password'
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return loginAdmin(req, res);
    });
  })(req, res, next);
});

// Admin Logout route
router.post('/logout', logoutAdmin);

// Fetch current admin authentication status
router.get('/current-admin', checkAuth);

// Admin-level management routes (protected)
const { isAdminAuthenticated } = require('../middleware/authMiddleware');
const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  getAllAttendance,
  getAllCompounders,
  createCompounder,
  updateCompounder,
  toggleCompounderStatus,
  getAllPatientsForAdmin,
  getAllBillsForAdmin
} = require('../controllers/adminManagementController');

router.get('/employees', isAdminAuthenticated, getAllEmployees);
router.post('/employees', isAdminAuthenticated, createEmployee);
router.put('/employees/:id', isAdminAuthenticated, updateEmployee);
router.patch('/employees/:id/status', isAdminAuthenticated, toggleEmployeeStatus);

router.get('/attendance', isAdminAuthenticated, getAllAttendance);

router.get('/compounders', isAdminAuthenticated, getAllCompounders);
router.post('/compounders', isAdminAuthenticated, createCompounder);
router.put('/compounders/:id', isAdminAuthenticated, updateCompounder);
router.patch('/compounders/:id/status', isAdminAuthenticated, toggleCompounderStatus);

router.get('/patients', isAdminAuthenticated, getAllPatientsForAdmin);
router.get('/bills', isAdminAuthenticated, getAllBillsForAdmin);

module.exports = router;
