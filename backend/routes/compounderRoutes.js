const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isCompounderAuthenticated } = require('../middleware/authMiddleware');
const {
  loginCompounder,
  logoutCompounder,
  checkCompounderAuth,
  addPatient,
  getPatients,
  getPatientById,
  getAppointmentsForCompounder,
  generateBill,
  getBills,
  getBillById,
  getBillPdf
} = require('../controllers/compounderController');

// Compounder Login
router.post('/login', (req, res, next) => {
  passport.authenticate('compounder-local', (err, user, info) => {
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
      return loginCompounder(req, res);
    });
  })(req, res, next);
});

// Compounder Logout
router.post('/logout', logoutCompounder);

// Get current Compounder
router.get('/current-compounder', checkCompounderAuth);

// Patient Management (Protected)
router.post('/patients', isCompounderAuthenticated, addPatient);
router.get('/patients', isCompounderAuthenticated, getPatients);
router.get('/patients/:id', isCompounderAuthenticated, getPatientById);

// Appointment Feeds (Protected)
router.get('/appointments', isCompounderAuthenticated, getAppointmentsForCompounder);

// Billing Actions (Protected)
router.post('/bills', isCompounderAuthenticated, generateBill);
router.get('/bills', isCompounderAuthenticated, getBills);
router.get('/bills/:id', isCompounderAuthenticated, getBillById);

// Billing Invoice PDF Print (No strict authentication for window.open print compatibility, but targets valid IDs)
router.get('/bills/:id/pdf', getBillPdf);

module.exports = router;
