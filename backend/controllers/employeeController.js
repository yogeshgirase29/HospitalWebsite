const passport = require('passport');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

const loginEmployee = (req, res) => {
  const token = jwt.sign(
    { id: req.user._id, email: req.user.email, role: 'employee' },
    process.env.JWT_SECRET || 'hospitalSessionSecret123!',
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Employee logged in successfully',
    token,
    employee: {
      id: req.user._id,
      employeeId: req.user.employeeId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      designation: req.user.designation
    }
  });
};

const logoutEmployee = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Employee logged out successfully'
      });
    });
  });
};

const checkEmployeeAuth = async (req, res) => {
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Employee') {
    return res.status(200).json({
      success: true,
      authenticated: true,
      employee: {
        id: req.user._id,
        employeeId: req.user.employeeId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        designation: req.user.designation
      }
    });
  }

  // Fallback to checking JWT auth header
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospitalSessionSecret123!');
      if (decoded.role === 'employee') {
        const employee = await Employee.findById(decoded.id);
        if (employee && employee.status === 'Active') {
          return res.status(200).json({
            success: true,
            authenticated: true,
            employee: {
              id: employee._id,
              employeeId: employee.employeeId,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              designation: employee.designation
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('JWT checkEmployeeAuth error:', error);
  }

  return res.status(200).json({
    success: false,
    authenticated: false,
    message: 'Not authenticated'
  });
};

// Helper to get Indian Standard Time (IST) midnight date
const getISTMidnightDate = (dateInput = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(dateInput);
  const mm = parts.find(p => p.type === 'month').value;
  const dd = parts.find(p => p.type === 'day').value;
  const yyyy = parts.find(p => p.type === 'year').value;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
};

// Attendance Check-in
const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const today = getISTMidnightDate();

    // Check if record already exists for today
    const existing = await Attendance.findOne({ employee: employeeId, date: today });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today.'
      });
    }

    const attendance = new Attendance({
      employee: employeeId,
      date: today,
      checkIn: new Date(),
      status: req.body.status || 'Present',
      checkInNotes: req.body.notes || ''
    });

    await attendance.save();

    return res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// Attendance Check-out
const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const today = getISTMidnightDate();

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'You must check in first before checking out.'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out for today.'
      });
    }

    attendance.checkOut = new Date();
    attendance.checkOutNotes = req.body.notes || '';
    
    await attendance.save();

    return res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// Get Employee Attendance History
const getAttendanceHistory = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const history = await Attendance.find({ employee: employeeId }).sort({ date: -1 });
    
    // Check today's check-in status to send back to UI
    const today = getISTMidnightDate();
    const todayRecord = await Attendance.findOne({ employee: employeeId, date: today });

    return res.status(200).json({
      success: true,
      count: history.length,
      todayRecord,
      history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginEmployee,
  logoutEmployee,
  checkEmployeeAuth,
  checkIn,
  checkOut,
  getAttendanceHistory
};
