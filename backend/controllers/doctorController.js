const Doctor = require('../models/Doctor');
const { doctorJoiSchema } = require('../validations/schemas');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// Get all doctors.
// Public users get only available doctors (?available=true).
const getAllDoctors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.available === 'true') {
      filter.available = true;
    }
    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
};

// Get a single doctor details
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    next(error);
  }
};

// Add a new doctor
const createDoctor = async (req, res, next) => {
  try {
    // Parse nested objects from string if sent as FormData
    ['doctorName', 'specialization', 'qualification', 'experience'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep as string and let Joi validation catch issues
        }
      }
    });

    // Validate Joi schema (exclude image from Joi validation if it is sent as file)
    const { error } = doctorJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Verify image file upload
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Doctor image is required' });
    }

    const { doctorName, specialization, qualification, experience, department, available } = req.body;

    const newDoctor = new Doctor({
      doctorName,
      specialization,
      qualification,
      experience,
      department,
      image: req.file.path, // Cloudinary secure URL
      available: available === undefined ? true : available === 'true' || available === true
    });

    await newDoctor.save();

    return res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      doctor: newDoctor
    });
  } catch (error) {
    next(error);
  }
};

// Update existing doctor
const updateDoctor = async (req, res, next) => {
  try {
    // Parse nested objects from string if sent as FormData
    ['doctorName', 'specialization', 'qualification', 'experience'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep as string and let Joi validation catch issues
        }
      }
    });

    const { error } = doctorJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const { doctorName, specialization, qualification, experience, department, available } = req.body;

    doctor.doctorName = doctorName;
    doctor.specialization = specialization;
    doctor.qualification = qualification;
    doctor.experience = experience;
    doctor.department = department;
    
    if (available !== undefined) {
      doctor.available = available === 'true' || available === true;
    }

    // If new image is uploaded, update URL and optionally delete old image from Cloudinary
    if (req.file) {
      if (doctor.image) {
        await deleteFromCloudinary(doctor.image);
      }
      doctor.image = req.file.path;
    }

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// Delete a doctor
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (doctor.image) {
      await deleteFromCloudinary(doctor.image);
    }

    await Doctor.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle availability status (PATCH /api/doctors/:id/status)
const toggleDoctorStatus = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    doctor.available = !doctor.available;
    await doctor.save();

    return res.status(200).json({
      success: true,
      message: `Doctor status updated to ${doctor.available ? 'Available' : 'Unavailable'}`,
      available: doctor.available,
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// Helper to get Indian Standard Time (IST) midnight date
const getISTMidnightDate = (dateInput) => {
  const d = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const mm = parts.find(p => p.type === 'month').value;
  const dd = parts.find(p => p.type === 'day').value;
  const yyyy = parts.find(p => p.type === 'year').value;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
};

// Helper to get Indian Standard Time (IST) date string in YYYY-MM-DD
const getISTDateString = (dateInput = new Date()) => {
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
  return `${yyyy}-${mm}-${dd}`;
};

// Get leave schedules of a doctor
const getDoctorLeaves = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.status(200).json({
      success: true,
      leaves: doctor.leaveSchedule || []
    });
  } catch (error) {
    next(error);
  }
};

// Add a leave schedule to a doctor
const addDoctorLeave = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const { leaveType, startDate, endDate, reason, status } = req.body;
    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Leave type, start date, and end date are required' });
    }

    const normalizedStart = getISTMidnightDate(startDate);
    const normalizedEnd = getISTMidnightDate(endDate);
    const normalizedToday = getISTMidnightDate(getISTDateString());

    if (normalizedStart < normalizedToday) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }

    if (normalizedEnd < normalizedStart) {
      return res.status(400).json({ success: false, message: 'End date must be greater than or equal to start date' });
    }

    if (reason && reason.length > 250) {
      return res.status(400).json({ success: false, message: 'Reason cannot exceed 250 characters' });
    }

    doctor.leaveSchedule.push({
      leaveType,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      reason: reason || '',
      status: status || 'Active'
    });

    await doctor.save();

    return res.status(201).json({
      success: true,
      message: 'Leave scheduled successfully',
      leaves: doctor.leaveSchedule
    });
  } catch (error) {
    next(error);
  }
};

// Update a leave schedule of a doctor
const updateDoctorLeave = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const leave = doctor.leaveSchedule.id(req.params.leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found' });
    }

    const { leaveType, startDate, endDate, reason, status } = req.body;
    
    if (startDate) {
      const normalizedStart = getISTMidnightDate(startDate);
      const normalizedToday = getISTMidnightDate(getISTDateString());
      if (normalizedStart.getTime() !== leave.startDate.getTime() && normalizedStart < normalizedToday) {
        return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
      }
      leave.startDate = normalizedStart;
    }

    if (endDate) {
      leave.endDate = getISTMidnightDate(endDate);
    }

    if (leave.endDate < leave.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be greater than or equal to start date' });
    }

    if (leaveType) leave.leaveType = leaveType;
    if (reason !== undefined) {
      if (reason.length > 250) {
        return res.status(400).json({ success: false, message: 'Reason cannot exceed 250 characters' });
      }
      leave.reason = reason;
    }
    if (status) leave.status = status;

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: 'Leave schedule updated successfully',
      leaves: doctor.leaveSchedule
    });
  } catch (error) {
    next(error);
  }
};

// Delete a leave schedule of a doctor
const deleteDoctorLeave = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const leave = doctor.leaveSchedule.id(req.params.leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found' });
    }
    
    leave.deleteOne();
    await doctor.save();

    return res.status(200).json({
      success: true,
      message: 'Leave schedule deleted successfully',
      leaves: doctor.leaveSchedule
    });
  } catch (error) {
    next(error);
  }
};

// Get availability of a doctor on a specific date (and leave checks)
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const selectedDate = getISTMidnightDate(date);
    let onLeave = false;
    let leaveDetails = null;

    if (doctor.leaveSchedule && doctor.leaveSchedule.length > 0) {
      const activeLeaves = doctor.leaveSchedule.filter(l => l.status === 'Active');
      for (const leave of activeLeaves) {
        const start = getISTMidnightDate(leave.startDate);
        const end = getISTMidnightDate(leave.endDate);
        if (selectedDate >= start && selectedDate <= end) {
          onLeave = true;
          leaveDetails = leave;
          break;
        }
      }
    }

    return res.status(200).json({
      success: true,
      available: doctor.available && !onLeave,
      onLeave,
      leaveDetails
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly status map for a doctor (visualizing Available/Booked/On Leave/Past)
const getDoctorCalendarStatus = async (req, res, next) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month parameter (YYYY-MM) is required.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const Appointment = require('../models/Appointment');
    const [year, monthNum] = month.split('-').map(Number);
    
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, monthNum - 1, daysInMonth, 23, 59, 59, 999));

    const appointments = await Appointment.find({
      doctor: doctor.doctorName.en,
      appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $ne: 'Cancelled' }
    });

    const activeLeaves = (doctor.leaveSchedule || []).filter(l => l.status === 'Active');
    const todayStr = getISTDateString();

    const calendarStatus = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = getISTMidnightDate(dateStr);

      if (dateStr < todayStr) {
        calendarStatus[dateStr] = { status: 'Past', label: 'Past Date' };
        continue;
      }

      let isOnLeave = false;
      let matchingLeave = null;
      for (const leave of activeLeaves) {
        const start = getISTMidnightDate(leave.startDate);
        const end = getISTMidnightDate(leave.endDate);
        if (dayDate >= start && dayDate <= end) {
          isOnLeave = true;
          matchingLeave = leave;
          break;
        }
      }

      if (isOnLeave) {
        calendarStatus[dateStr] = {
          status: 'OnLeave',
          label: `On Leave: ${matchingLeave.leaveType}`,
          reason: matchingLeave.reason
        };
        continue;
      }

      const dayAppointments = appointments.filter(app => {
        const appDateStr = getISTDateString(app.appointmentDate);
        return appDateStr === dateStr;
      });

      const bookedCount = dayAppointments.length;
      if (bookedCount >= 20) {
        calendarStatus[dateStr] = { status: 'FullyBooked', label: 'Fully Booked' };
      } else if (bookedCount > 0) {
        calendarStatus[dateStr] = { status: 'Booked', label: `${bookedCount} Booked` };
      } else {
        calendarStatus[dateStr] = { status: 'Available', label: 'Available' };
      }
    }

    return res.status(200).json({
      success: true,
      doctorId: doctor._id,
      month,
      calendar: calendarStatus
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  getDoctorLeaves,
  addDoctorLeave,
  updateDoctorLeave,
  deleteDoctorLeave,
  getDoctorAvailability,
  getDoctorCalendarStatus
};
