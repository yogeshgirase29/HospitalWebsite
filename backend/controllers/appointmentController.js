const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const { appointmentJoiSchema } = require('../validations/schemas');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

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

// Helper to calculate age accurately in India Standard Time
const calculateAge = (dobString) => {
  const todayIST = getISTDateString(); // "YYYY-MM-DD"
  const [todayYear, todayMonth, todayDay] = todayIST.split('-').map(Number);
  const [birthYear, birthMonth, birthDay] = dobString.split('-').map(Number);

  let age = todayYear - birthYear;
  const m = todayMonth - birthMonth;
  if (m < 0 || (m === 0 && todayDay < birthDay)) {
    age--;
  }
  return age;
};

// Helper to parse slot time (e.g. "08:30 AM" -> hour=8, minute=30)
const parseSlotTime = (slotStr) => {
  const [time, modifier] = slotStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
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

// Get all appointments (Admin search and filtering)
const getAllAppointments = async (req, res, next) => {
  try {
    const { search, status, department, doctor, date } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { appointmentId: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (doctor && doctor !== 'All') {
      query.doctor = doctor;
    }

    if (date) {
      const start = getISTMidnightDate(date);
      const end = new Date(start);
      end.setUTCHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

// Get a single appointment details
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// Create a new appointment (Public or Admin booking)
const createAppointment = async (req, res, next) => {
  try {
    const { error } = appointmentJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    let {
      title,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      mobile,
      email,
      department,
      departmentMr,
      doctor,
      doctorMr,
      appointmentDate,
      appointmentSlot,
      message,
      status
    } = req.body;

    // Fetch Marathi translations directly from DB to prevent client-side encoding or missing translation issues
    let dbDoc = null;
    try {
      const dbDept = await Department.findOne({ "departmentName.en": department });
      if (dbDept && dbDept.departmentName && dbDept.departmentName.mr) {
        departmentMr = dbDept.departmentName.mr;
      }
      dbDoc = await Doctor.findOne({ "doctorName.en": doctor });
      if (dbDoc && dbDoc.doctorName && dbDoc.doctorName.mr) {
        doctorMr = dbDoc.doctorName.mr;
      }
    } catch (lookupErr) {
      console.error('Failed to look up Marathi translations during appointment creation:', lookupErr);
    }

    if (!dbDoc) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    if (!dbDoc.available) {
      return res.status(400).json({ success: false, message: 'Doctor is currently unavailable.' });
    }

    const calculatedAge = calculateAge(dateOfBirth);

    // Prevent double booking for the same doctor, date, and slot
    const selectedDate = getISTMidnightDate(appointmentDate);

    // Check leaves
    if (dbDoc.leaveSchedule && dbDoc.leaveSchedule.length > 0) {
      const activeLeaves = dbDoc.leaveSchedule.filter(l => l.status === 'Active');
      for (const leave of activeLeaves) {
        const start = getISTMidnightDate(leave.startDate);
        const end = getISTMidnightDate(leave.endDate);
        if (selectedDate >= start && selectedDate <= end) {
          return res.status(400).json({
            success: false,
            message: 'Doctor is unavailable on selected date.'
          });
        }
      }
    }

    // If booking for today, check that the slot time has not already passed in IST
    const selectedDateStr = getISTDateString(selectedDate);
    const istToday = getISTDateString();
    if (selectedDateStr === istToday) {
      const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const currentHour = nowIST.getHours();
      const currentMinute = nowIST.getMinutes();
      const { hours: slotHour, minutes: slotMin } = parseSlotTime(appointmentSlot);
      if (slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMinute)) {
        return res.status(400).json({
          success: false,
          message: 'The selected slot time has already passed for today. Please select a future slot.'
        });
      }
    }

    const doubleBooked = await Appointment.findOne({
      doctor,
      appointmentDate: selectedDate,
      appointmentSlot,
      status: { $ne: 'Cancelled' }
    });

    if (doubleBooked) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked for this doctor on this day. Please select a different slot.'
      });
    }

    const newAppointment = new Appointment({
      title,
      firstName,
      middleName: middleName || '',
      lastName,
      dateOfBirth,
      age: calculatedAge,
      mobile,
      email: email || undefined,
      department,
      departmentMr,
      doctor,
      doctorMr,
      appointmentDate: selectedDate,
      appointmentSlot,
      message: message || '',
      status: status || 'Pending'
    });

    try {
      await newAppointment.save();
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This slot is already booked for this doctor on this day. Please select a different slot.'
        });
      }
      throw dbErr;
    }

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    next(error);
  }
};

// Update appointment details (Admin editing / rescheduling)
const updateAppointment = async (req, res, next) => {
  try {
    let {
      title,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      status,
      doctor,
      doctorMr,
      department,
      departmentMr,
      appointmentDate,
      appointmentSlot,
      message,
      mobile,
      email
    } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Fetch Marathi translations directly from DB to prevent client-side encoding or missing translation issues
    try {
      const targetDept = department || appointment.department;
      if (targetDept) {
        const dbDept = await Department.findOne({ "departmentName.en": targetDept });
        if (dbDept && dbDept.departmentName && dbDept.departmentName.mr) {
          departmentMr = dbDept.departmentName.mr;
        }
      }
      const targetDoc = doctor || appointment.doctor;
      if (targetDoc) {
        const dbDoc = await Doctor.findOne({ "doctorName.en": targetDoc });
        if (dbDoc && dbDoc.doctorName && dbDoc.doctorName.mr) {
          doctorMr = dbDoc.doctorName.mr;
        }
      }
    } catch (lookupErr) {
      console.error('Failed to look up Marathi translations during appointment update:', lookupErr);
    }

    // Double booking protection if rescheduling slot, doctor or date
    const checkDoctor = doctor || appointment.doctor;
    const checkDate = getISTMidnightDate(appointmentDate || appointment.appointmentDate);
    const checkSlot = appointmentSlot || appointment.appointmentSlot;

    if (appointmentDate || appointmentSlot || doctor) {
      const dbDoc = await Doctor.findOne({ "doctorName.en": checkDoctor });
      if (!dbDoc) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }

      if (!dbDoc.available) {
        return res.status(400).json({ success: false, message: 'Selected doctor is currently unavailable.' });
      }

      // Check leaves
      if (dbDoc.leaveSchedule && dbDoc.leaveSchedule.length > 0) {
        const activeLeaves = dbDoc.leaveSchedule.filter(l => l.status === 'Active');
        for (const leave of activeLeaves) {
          const start = getISTMidnightDate(leave.startDate);
          const end = getISTMidnightDate(leave.endDate);
          if (checkDate >= start && checkDate <= end) {
            return res.status(400).json({
              success: false,
              message: 'Doctor is unavailable on selected date.'
            });
          }
        }
      }

      const doubleBooked = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: checkDoctor,
        appointmentDate: checkDate,
        appointmentSlot: checkSlot,
        status: { $ne: 'Cancelled' }
      });

      if (doubleBooked) {
        return res.status(400).json({
          success: false,
          message: 'This slot is already booked for this doctor on this day. Rescheduling failed.'
        });
      }
    }

    if (title) appointment.title = title;
    if (firstName) appointment.firstName = firstName;
    if (middleName !== undefined) appointment.middleName = middleName || '';
    if (lastName) appointment.lastName = lastName;
    if (dateOfBirth) {
      appointment.dateOfBirth = dateOfBirth;
      appointment.age = calculateAge(dateOfBirth);
    }
    if (status) appointment.status = status;
    if (doctor) appointment.doctor = doctor;
    if (doctorMr) appointment.doctorMr = doctorMr;
    if (department) appointment.department = department;
    if (departmentMr) appointment.departmentMr = departmentMr;
    if (appointmentDate) appointment.appointmentDate = checkDate;
    if (appointmentSlot) appointment.appointmentSlot = appointmentSlot;
    if (message !== undefined) appointment.message = message;
    if (mobile) appointment.mobile = mobile;
    if (email !== undefined) appointment.email = email || undefined;

    try {
      await appointment.save();
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This slot is already booked for this doctor on this day. Rescheduling failed.'
        });
      }
      throw dbErr;
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// Delete an appointment
const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get appointment status by appointment ID (Public status tracking)
const getAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findOne({ appointmentId: appointmentId.trim().toUpperCase() });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found with this ID' });
    }
    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// Search appointment status by query parameter (e.g. GET /api/appointments/search?appointmentId=XYZ)
const searchAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.query;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }
    const appointment = await Appointment.findOne({ appointmentId: appointmentId.trim().toUpperCase() });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found with this ID' });
    }
    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// Update status only (e.g. PATCH /api/appointments/:id/status)
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// Get available slots for a doctor on a specific date (India timezone aware)
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Doctor ID and Date are required.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
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

    if (onLeave) {
      const allSlots = [
        '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
      ];
      const slotsData = allSlots.map(slot => ({
        slot,
        status: 'Unavailable',
        selectable: false
      }));
      return res.status(200).json({
        success: true,
        doctorId,
        date,
        onLeave: true,
        leaveDetails: {
          leaveType: leaveDetails.leaveType,
          startDate: getISTDateString(leaveDetails.startDate),
          endDate: getISTDateString(leaveDetails.endDate),
          reason: leaveDetails.reason
        },
        slots: [],
        slotsData
      });
    }

    const selectedDateStr = date; // "YYYY-MM-DD"
    const istToday = getISTDateString(); // "YYYY-MM-DD" in Asia/Kolkata
    const isToday = (selectedDateStr === istToday);

    const start = getISTMidnightDate(selectedDate);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: doctor.doctorName.en,
      appointmentDate: { $gte: start, $lte: end },
      status: { $ne: 'Cancelled' }
    });

    const bookedSlots = appointments.map(app => app.appointmentSlot);

    const allSlots = [
      '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
      '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
      '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
    ];

    // Filter available slots
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentHour = nowIST.getHours();
    const currentMinute = nowIST.getMinutes();

    const slotsData = allSlots.map(slot => {
      let isBooked = bookedSlots.includes(slot);
      let isPast = false;

      if (isToday) {
        const { hours: slotHour, minutes: slotMin } = parseSlotTime(slot);
        if (slotHour < currentHour) {
          isPast = true;
        } else if (slotHour === currentHour && slotMin <= currentMinute) {
          isPast = true;
        }
      }

      let status = 'Available';
      if (isBooked) status = 'Booked';
      else if (isPast) status = 'Past';

      return {
        slot,
        status,
        selectable: !isBooked && !isPast
      };
    });

    // Backwards compatible returned slots array (only active available)
    const availableSlots = slotsData.filter(s => s.selectable).map(s => s.slot);

    return res.status(200).json({
      success: true,
      doctorId,
      date,
      slots: availableSlots,       // array of available slots strings
      slotsData                    // detailed layout for frontend grid rendering (green/red/gray)
    });
  } catch (error) {
    next(error);
  }
};

// Generate appointment confirmation PDF with QR Code
const getAppointmentPdf = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Stream PDF buffer directly to Express response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="appointment_${appointment.appointmentId}.pdf"`);
    doc.pipe(res);

    // Register Marathi/English compatible Poppins font from the backend fonts directory
    const path = require('path');
    const regularFontPath = path.join(__dirname, '..', 'fonts', 'Poppins-Regular.ttf');
    const boldFontPath = path.join(__dirname, '..', 'fonts', 'Poppins-Bold.ttf');

    doc.registerFont('Poppins-Regular', regularFontPath);
    doc.registerFont('Poppins-Bold', boldFontPath);

    // Styling constants
    const primaryColor = '#0284c7';
    const textColor = '#0f172a';
    const secondaryTextColor = '#64748b';
    const borderColor = '#cbd5e1';

    // 1. Hospital Header Block (Bilingual)
    doc.fillColor(primaryColor)
      .font('Poppins-Bold')
      .fontSize(17)
      .text("YUG'S AAROGYASETU HOSPITAL", { align: 'center' });

    doc.fillColor('#0369a1')
      .font('Poppins-Bold')
      .fontSize(11)
      .text("युगचे आरोग्यसेतू रुग्णालय", { align: 'center' });

    doc.fillColor(secondaryTextColor)
      .font('Poppins-Regular')
      .fontSize(8)
      .text("Dahiwad, Tal. Shirpur, Dist. Dhule, Maharashtra - 425405", { align: 'center' })
      .text("Phone: +91 99693 79023 / +91 2563 295550  |  Email: info@aarogyasetuhospital.com", { align: 'center' });

    doc.moveDown(0.3);

    // Divider line
    doc.strokeColor(primaryColor)
      .lineWidth(1.5)
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // 2. Voucher Title (No character spacing for clean Devanagari rendering)
    doc.fillColor(textColor)
      .font('Poppins-Bold')
      .fontSize(11)
      .text("APPOINTMENT CONFIRMATION VOUCHER / अपॉइंटमेंट व्हाउचर", { align: 'center' });

    doc.moveDown(0.6);

    // 3. Info Columns Grid (Left: Reference Card, Right: QR Code Card)
    const startY = doc.y;

    // Left Reference Card
    doc.roundedRect(45, startY, 270, 120, 6)
      .fill('#f8fafc');
    doc.roundedRect(45, startY, 270, 120, 6)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    // Add blue left border accent
    doc.strokeColor(primaryColor)
      .lineWidth(3)
      .moveTo(45, startY + 4)
      .lineTo(45, startY + 116)
      .stroke();

    // Reference Card Content
    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Appointment Reference / संदर्भ", 60, startY + 10);
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(60, startY + 23).lineTo(300, startY + 23).stroke();

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("APPOINTMENT ID / संदर्भ आयडी", 60, startY + 29);
    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(11).text(appointment.appointmentId, 60, startY + 38);

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("BOOKING DATE & TIME / बुकिंग वेळ", 60, startY + 59);
    doc.fillColor(textColor).font('Poppins-Regular').fontSize(8).text(
      new Date(appointment.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + " IST",
      60,
      startY + 68
    );

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("STATUS / स्थिती", 60, startY + 86);
    let statusCol = '#d97706';
    let statusMr = 'Pending (प्रलंबित)';
    if (appointment.status === 'Confirmed') {
      statusCol = '#15803d';
      statusMr = 'Confirmed (निश्चित)';
    } else if (appointment.status === 'Completed') {
      statusCol = '#1d4ed8';
      statusMr = 'Completed (पूर्ण)';
    } else if (appointment.status === 'Cancelled') {
      statusCol = '#b91c1c';
      statusMr = 'Cancelled (रद्द)';
    }
    doc.fillColor(statusCol).font('Poppins-Bold').fontSize(8.5).text(statusMr, 60, startY + 95);

    // Right QR Card
    doc.roundedRect(330, startY, 220, 120, 6)
      .fill('#f8fafc');
    doc.roundedRect(330, startY, 220, 120, 6)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    // Add blue left border accent
    doc.strokeColor(primaryColor)
      .lineWidth(3)
      .moveTo(330, startY + 4)
      .lineTo(330, startY + 116)
      .stroke();

    // Determine frontend base URL dynamically from request header (referer) or env
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (req.headers.referer) {
      try {
        const refUrl = new URL(req.headers.referer);
        frontendUrl = `${refUrl.protocol}//${refUrl.host}`;
      } catch (e) {
        // Fallback
      }
    } else if (req.headers.origin) {
      frontendUrl = req.headers.origin;
    }
    const qrContent = `${frontendUrl}/appointment/validate/${appointment.appointmentId}`;

    // QR Code generation (on the right column)
    const qrBuffer = await QRCode.toBuffer(qrContent, { type: 'png', margin: 1, width: 80 });
    doc.image(qrBuffer, 400, startY + 10, { width: 80 });
    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("Scan to verify booking / पडताळणी करा", 330, startY + 98, { align: 'center', width: 220 });

    // 4. Patient Information Grid Card
    const patientY = startY + 132;

    doc.roundedRect(45, patientY, 505, 100, 6)
      .fill('#f8fafc');
    doc.roundedRect(45, patientY, 505, 100, 6)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    // Add blue left border accent
    doc.strokeColor(primaryColor)
      .lineWidth(3)
      .moveTo(45, patientY + 4)
      .lineTo(45, patientY + 96)
      .stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Patient Information / रुग्णाची माहिती", 60, patientY + 10);
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(60, patientY + 23).lineTo(535, patientY + 23).stroke();

    // Details Grid Layout
    const labelFont = 'Poppins-Regular';
    const valFont = 'Poppins-Bold';
    const labelSize = 7;
    const valSize = 8;

    // Row 1
    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("FULL NAME / नाव", 60, patientY + 29);
    const fullName = appointment.fullName || `${appointment.title} ${appointment.firstName} ${appointment.lastName}`;
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(fullName, 60, patientY + 38);

    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("DATE OF BIRTH / जन्म तारीख", 300, patientY + 29);
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(
      new Date(appointment.dateOfBirth).toLocaleDateString('en-IN'),
      300,
      patientY + 38
    );

    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("AGE / वय", 440, patientY + 29);
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(`${appointment.age} Years / वर्षे`, 440, patientY + 38);

    // Row 2
    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("MOBILE / मोबाईल", 60, patientY + 62);
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(appointment.mobile, 60, patientY + 71);

    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("EMAIL / ई-मेल", 300, patientY + 62);
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(appointment.email || '-', 300, patientY + 71);

    // 5. Clinical Schedule Details Card
    const clinicalY = patientY + 112;

    doc.roundedRect(45, clinicalY, 505, 100, 6)
      .fill('#f8fafc');
    doc.roundedRect(45, clinicalY, 505, 100, 6)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    // Add blue left border accent
    doc.strokeColor(primaryColor)
      .lineWidth(3)
      .moveTo(45, clinicalY + 4)
      .lineTo(45, clinicalY + 96)
      .stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Appointment Details / तपशील", 60, clinicalY + 10);
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(60, clinicalY + 23).lineTo(535, clinicalY + 23).stroke();

    // Details Grid Row 1
    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("DEPARTMENT / विभाग", 60, clinicalY + 29);
    const deptDisplay = `${appointment.department} (${appointment.departmentMr})`;
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(deptDisplay, 60, clinicalY + 38);

    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("SPECIALIST DOCTOR / डॉक्टर", 300, clinicalY + 29);
    const doctorDisplay = `${appointment.doctor} (${appointment.doctorMr})`;
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(doctorDisplay, 300, clinicalY + 38);

    // Details Grid Row 2
    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("DATE / तारीख", 60, clinicalY + 62);
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(
      new Date(appointment.appointmentDate).toLocaleDateString('en-IN'),
      60,
      clinicalY + 71
    );

    doc.fillColor(secondaryTextColor).font(labelFont).fontSize(labelSize).text("TIME SLOT / वेळ", 300, clinicalY + 62);
    doc.fillColor(textColor).font(valFont).fontSize(valSize).text(appointment.appointmentSlot, 300, clinicalY + 71);

    // 6. Symptoms / Notes Card (Dynamic height calculation)
    const notesY = clinicalY + 112;
    const messageText = appointment.message || 'No special requirements or symptoms specified. / कोणतेही लक्षण किंवा विशेष सूचना दिलेल्या नाहीत.';
    const textHeight = doc.heightOfString(messageText, { width: 475 });
    const notesCardHeight = Math.max(65, 10 + 13 + 6 + textHeight + 10); // padding, title, spacing, text, padding

    doc.roundedRect(45, notesY, 505, notesCardHeight, 6)
      .fill('#f8fafc');
    doc.roundedRect(45, notesY, 505, notesCardHeight, 6)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    // Add blue left border accent
    doc.strokeColor(primaryColor)
      .lineWidth(3)
      .moveTo(45, notesY + 4)
      .lineTo(45, notesY + notesCardHeight - 4)
      .stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Symptoms / Instructions (लक्षणे / सूचना)", 60, notesY + 10);
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(60, notesY + 23).lineTo(535, notesY + 23).stroke();

    doc.fillColor(textColor).font('Poppins-Regular').fontSize(8).text(
      messageText,
      60,
      notesY + 29,
      { width: 475, align: 'left' }
    );

    // 7. Important Visitation Instructions Box (Dynamic height calculations to prevent layout overflow)
    const instY = notesY + notesCardHeight + 12;

    const text1 = "1. Please present this document at the reception desk to obtain your patient entry token. / कृपया टोकन मिळवण्यासाठी हे कागदपत्र काउंटरवर दाखवा.";
    const text2 = "2. Please carry valid government identification matching the name on this voucher. / कृपया ओळख पडताळणीसाठी शासकीय ओळखपत्र सोबत ठेवा.";
    const text3 = "3. Please arrive 15 minutes before your scheduled slot. / कृपया निवडलेल्या वेळेच्या १५ मिनिटे आधी रुग्णालयात उपस्थित रहा.";
    const genText = `PDF generated at / जनरेट वेळ: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST. (QR Verified)`;

    const h1 = doc.heightOfString(text1, { width: 475 });
    const h2 = doc.heightOfString(text2, { width: 475 });
    const h3 = doc.heightOfString(text3, { width: 475 });
    const hGen = doc.heightOfString(genText, { width: 475 });

    // padding + title + gap + heights + spacing + padding
    const instBoxHeight = 10 + 13 + 5 + h1 + 5 + h2 + 5 + h3 + 6 + hGen + 10;

    doc.roundedRect(45, instY, 505, instBoxHeight, 6)
      .fill('#fffbeb');
    doc.roundedRect(45, instY, 505, instBoxHeight, 6)
      .strokeColor('#fde68a')
      .lineWidth(1)
      .stroke();
    // Add amber left border accent
    doc.strokeColor('#d97706')
      .lineWidth(3)
      .moveTo(45, instY + 4)
      .lineTo(45, instY + instBoxHeight - 4)
      .stroke();

    doc.fillColor('#78350f').font('Poppins-Bold').fontSize(8.5).text("VISITATION INSTRUCTIONS / भेट देण्याबाबत मार्गदर्शक सूचना:", 60, instY + 10);

    doc.font('Poppins-Regular').fontSize(7.5).fillColor('#92400e');
    doc.text(text1, 60, instY + 26, { width: 475 });
    doc.text(text2, 60, doc.y + 5, { width: 475 });
    doc.text(text3, 60, doc.y + 5, { width: 475 });

    doc.font('Poppins-Regular').fontSize(7).fillColor('#b45309');
    doc.text(genText, 60, doc.y + 6, { width: 475 });

    // 8. Footer Disclaimer
    const footerY = instY + instBoxHeight + 12;
    doc.strokeColor(borderColor).lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9.5).text(
      "YUG'S AAROGYASETU HOSPITAL - Caring for Your Health, Always! / आपल्या आरोग्याची काळजी, सदैव!",
      40,
      footerY + 10,
      { align: 'center', width: 515 }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStatus,
  searchAppointment,
  updateAppointmentStatus,
  getAvailableSlots,
  getAppointmentPdf
};
