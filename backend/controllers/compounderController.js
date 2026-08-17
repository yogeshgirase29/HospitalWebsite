const passport = require('passport');
const jwt = require('jsonwebtoken');
const Compounder = require('../models/Compounder');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const { patientJoiSchema, billJoiSchema } = require('../validations/schemas');
const PDFDocument = require('pdfkit');

const loginCompounder = (req, res) => {
  const token = jwt.sign(
    { id: req.user._id, email: req.user.email, role: 'compounder' },
    process.env.JWT_SECRET || 'hospitalSessionSecret123!',
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Compounder logged in successfully',
    token,
    compounder: {
      id: req.user._id,
      compounderId: req.user.compounderId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email
    }
  });
};

const logoutCompounder = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Compounder logged out successfully'
      });
    });
  });
};

const checkCompounderAuth = async (req, res) => {
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Compounder') {
    return res.status(200).json({
      success: true,
      authenticated: true,
      compounder: {
        id: req.user._id,
        compounderId: req.user.compounderId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      }
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospitalSessionSecret123!');
      if (decoded.role === 'compounder') {
        const compounder = await Compounder.findById(decoded.id);
        if (compounder && compounder.status === 'Active') {
          return res.status(200).json({
            success: true,
            authenticated: true,
            compounder: {
              id: compounder._id,
              compounderId: compounder.compounderId,
              firstName: compounder.firstName,
              lastName: compounder.lastName,
              email: compounder.email
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('JWT checkCompounderAuth error:', error);
  }

  return res.status(200).json({
    success: false,
    authenticated: false,
    message: 'Not authenticated'
  });
};

// Patient Management by Compounder
const addPatient = async (req, res, next) => {
  try {
    const { error } = patientJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { firstName, lastName, dateOfBirth, age, gender, mobile, email, address, city, emergencyContact } = req.body;

    const patient = new Patient({
      firstName,
      lastName,
      dateOfBirth,
      age,
      gender,
      mobile,
      email,
      address,
      city,
      emergencyContact
    });

    await patient.save();

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient
    });
  } catch (error) {
    next(error);
  }
};

const getPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { patientId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    return res.status(200).json({ success: true, patient });
  } catch (error) {
    next(error);
  }
};

// Appointment Management by Compounder
const getAppointmentsForCompounder = async (req, res, next) => {
  try {
    const { search, status, date } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { appointmentId: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (date) {
      const d = new Date(date);
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
      const start = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
      const end = new Date(start);
      end.setUTCHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(query).sort({ appointmentDate: -1, appointmentSlot: 1 });
    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

// Appointment-based Billing
const generateBill = async (req, res, next) => {
  try {
    const { error } = billJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const {
      appointmentId,
      patientId,
      patientName,
      doctorName,
      departmentName,
      services,
      subtotal,
      discount,
      tax,
      total,
      paymentStatus,
      paymentMode
    } = req.body;

    // Verify appointment exists
    const appointmentObj = await Appointment.findById(appointmentId);
    if (!appointmentObj) {
      return res.status(404).json({ success: false, message: 'Reference appointment not found.' });
    }

    if (appointmentObj.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: `Billing invoice can only be generated for confirmed appointments. Current status: ${appointmentObj.status}`
      });
    }

    // Check if a bill is already generated for this appointment
    const preExisting = await Bill.findOne({ appointment: appointmentId });
    if (preExisting) {
      return res.status(400).json({
        success: false,
        message: `An invoice has already been generated for this appointment: ${preExisting.billNumber}`,
        bill: preExisting
      });
    }

    const createdBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Compounder';

    const bill = new Bill({
      appointment: appointmentId,
      patient: patientId || null,
      patientName,
      doctorName,
      departmentName,
      services,
      subtotal,
      discount,
      tax,
      total,
      paymentStatus,
      paymentMode,
      createdBy
    });

    await bill.save();

    // Auto update appointment status to Completed when bill is generated
    appointmentObj.status = 'Completed';
    await appointmentObj.save();

    return res.status(201).json({
      success: true,
      message: 'Billing invoice generated successfully',
      bill
    });
  } catch (error) {
    next(error);
  }
};

const getBills = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }
    const bills = await Bill.find(query).populate('appointment').populate('patient').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: bills.length,
      bills
    });
  } catch (error) {
    next(error);
  }
};

const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('appointment').populate('patient');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.status(200).json({ success: true, bill });
  } catch (error) {
    next(error);
  }
};

const getBillPdf = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${bill.billNumber}.pdf"`);
    doc.pipe(res);

    // Register Marathi/English compatible Poppins font
    const path = require('path');
    const regularFontPath = path.join(__dirname, '..', 'fonts', 'Poppins-Regular.ttf');
    const boldFontPath = path.join(__dirname, '..', 'fonts', 'Poppins-Bold.ttf');

    doc.registerFont('Poppins-Regular', regularFontPath);
    doc.registerFont('Poppins-Bold', boldFontPath);

    const primaryColor = '#0284c7';
    const textColor = '#0f172a';
    const secondaryTextColor = '#64748b';
    const borderColor = '#cbd5e1';

    // Hospital Header Block (Bilingual)
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

    // Voucher Title
    doc.fillColor(textColor)
      .font('Poppins-Bold')
      .fontSize(11)
      .text("INVOICE / बिल पावती", { align: 'center' });

    doc.moveDown(0.6);

    const startY = doc.y;

    // Left Invoice Details Card
    doc.roundedRect(45, startY, 270, 110, 6).fill('#f8fafc');
    doc.roundedRect(45, startY, 270, 110, 6).strokeColor(borderColor).lineWidth(1).stroke();
    doc.strokeColor(primaryColor).lineWidth(3).moveTo(45, startY + 4).lineTo(45, startY + 106).stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Invoice Information / बिल तपशील", 60, startY + 10);
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(60, startY + 23).lineTo(300, startY + 23).stroke();

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("BILL NUMBER / बिल नंबर", 60, startY + 29);
    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(11).text(bill.billNumber, 60, startY + 38);

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("DATE GENERATED / तारीख", 60, startY + 59);
    doc.fillColor(textColor).font('Poppins-Regular').fontSize(8).text(
      new Date(bill.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + " IST",
      60,
      startY + 68
    );

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("PAYMENT STATUS / स्थिती", 60, startY + 82);
    let statusCol = '#15803d'; // Green for Paid
    if (bill.paymentStatus === 'Unpaid') statusCol = '#b91c1c';
    else if (bill.paymentStatus === 'Partially Paid') statusCol = '#d97706';
    doc.fillColor(statusCol).font('Poppins-Bold').fontSize(8.5).text(`${bill.paymentStatus} (${bill.paymentMode})`, 60, startY + 91);

    // Right Patient Details Card
    doc.roundedRect(330, startY, 220, 110, 6).fill('#f8fafc');
    doc.roundedRect(330, startY, 220, 110, 6).strokeColor(borderColor).lineWidth(1).stroke();
    doc.strokeColor(primaryColor).lineWidth(3).moveTo(330, startY + 4).lineTo(330, startY + 106).stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Patient & Doctor Details", 345, startY + 10);
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(345, startY + 23).lineTo(535, startY + 23).stroke();

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("PATIENT NAME / रुग्णाचे नाव", 345, startY + 29);
    doc.fillColor(textColor).font('Poppins-Bold').fontSize(8.5).text(bill.patientName, 345, startY + 38);

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("CONSULTING DOCTOR / डॉक्टर", 345, startY + 56);
    doc.fillColor(textColor).font('Poppins-Regular').fontSize(8).text(`${bill.doctorName} (${bill.departmentName})`, 345, startY + 65);

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7).text("BILL GENERATED BY / बनवणारे", 345, startY + 82);
    doc.fillColor(textColor).font('Poppins-Regular').fontSize(8).text(bill.createdBy, 345, startY + 91);

    // Services billing table below
    const tableY = startY + 130;
    doc.roundedRect(45, tableY, 505, 180, 6).fill('#ffffff');
    doc.roundedRect(45, tableY, 505, 180, 6).strokeColor(borderColor).lineWidth(1).stroke();

    // Table Header
    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Billing Items / शुल्क विवरण", 60, tableY + 10);
    doc.strokeColor(borderColor).lineWidth(1).moveTo(45, tableY + 25).lineTo(550, tableY + 25).stroke();

    // Headers
    doc.fillColor(secondaryTextColor).font('Poppins-Bold').fontSize(8).text("SR. #", 60, tableY + 32);
    doc.text("SERVICE / CONSULTATION NAME", 100, tableY + 32);
    doc.text("PRICE / दर (₹)", 460, tableY + 32, { align: 'right', width: 80 });

    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(45, tableY + 45).lineTo(550, tableY + 45).stroke();

    // Render items
    let itemY = tableY + 52;
    bill.services.forEach((service, index) => {
      doc.fillColor(textColor).font('Poppins-Regular').fontSize(8);
      doc.text(String(index + 1), 60, itemY);
      doc.text(service.name, 100, itemY);
      doc.text(service.price.toFixed(2), 460, itemY, { align: 'right', width: 80 });
      itemY += 16;
    });

    // Totals grid
    const totalBlockY = tableY + 120;
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(330, totalBlockY).lineTo(550, totalBlockY).stroke();

    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(8).text("Subtotal / उपएकूण:", 330, totalBlockY + 8);
    doc.fillColor(textColor).font('Poppins-Regular').fontSize(8).text(`₹ ${bill.subtotal.toFixed(2)}`, 460, totalBlockY + 8, { align: 'right', width: 80 });

    doc.fillColor(secondaryTextColor).text("Discount / सवलत:", 330, totalBlockY + 22);
    doc.fillColor(textColor).text(`- ₹ ${bill.discount.toFixed(2)}`, 460, totalBlockY + 22, { align: 'right', width: 80 });

    doc.fillColor(secondaryTextColor).text("Tax (GST) / कर:", 330, totalBlockY + 36);
    doc.fillColor(textColor).text(`+ ₹ ${bill.tax.toFixed(2)}`, 460, totalBlockY + 36, { align: 'right', width: 80 });

    doc.strokeColor(primaryColor).lineWidth(1).moveTo(330, totalBlockY + 48).lineTo(550, totalBlockY + 48).stroke();

    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9).text("Total Payable / एकूण देय:", 330, totalBlockY + 54);
    doc.text(`₹ ${bill.total.toFixed(2)}`, 460, totalBlockY + 54, { align: 'right', width: 80 });

    // Footer signature / validation stamp
    const footerY = 740;
    doc.strokeColor(borderColor).lineWidth(0.8).moveTo(40, footerY).lineTo(555, footerY).stroke();
    
    doc.fillColor(secondaryTextColor).font('Poppins-Regular').fontSize(7.5)
      .text(`Invoice generated at / जनरेट वेळ: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST. Authorized Invoice stamp.`, 40, footerY + 8, { align: 'center', width: 515 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
