const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Compounder = require('../models/Compounder');
const Patient = require('../models/Patient');
const Bill = require('../models/Bill');
const { employeeJoiSchema, compounderJoiSchema } = require('../validations/schemas');

// Employee Management
const getAllEmployees = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const employees = await Employee.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: employees.length, employees });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { error } = employeeJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { employeeId, firstName, lastName, email, mobile, designation, status, password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to create employee' });
    }

    const existingEmployee = await Employee.findOne({ $or: [{ employeeId }, { email }] });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Employee ID or email already registered' });
    }

    const newEmployee = new Employee({
      employeeId,
      firstName,
      lastName,
      email,
      mobile,
      designation,
      status: status || 'Active'
    });

    await Employee.register(newEmployee, password);

    return res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      employee: {
        id: newEmployee._id,
        employeeId: newEmployee.employeeId,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        designation: newEmployee.designation
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { error } = employeeJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const { firstName, lastName, email, mobile, designation, status, password } = req.body;

    employee.firstName = firstName;
    employee.lastName = lastName;
    employee.email = email;
    employee.mobile = mobile;
    employee.designation = designation;
    employee.status = status || employee.status;

    if (password && password.trim() !== '') {
      await employee.setPassword(password);
    }

    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'Employee details updated successfully',
      employee
    });
  } catch (error) {
    next(error);
  }
};

const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.status = employee.status === 'Active' ? 'Inactive' : 'Active';
    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Employee account is now ${employee.status}`,
      employee
    });
  } catch (error) {
    next(error);
  }
};

// Consolidated Attendance Logs
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, status, employeeName } = req.query;
    const query = {};

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
      query.date = { $gte: start, $lte: end };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let employeeFilter = {};
    if (employeeName) {
      employeeFilter.$or = [
        { firstName: { $regex: employeeName, $options: 'i' } },
        { lastName: { $regex: employeeName, $options: 'i' } }
      ];
    }

    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'employee',
        match: employeeFilter
      })
      .sort({ date: -1 });

    // Filter out records where employee doesn't match name filter
    const filtered = attendanceRecords.filter(record => record.employee !== null);

    return res.status(200).json({
      success: true,
      count: filtered.length,
      attendance: filtered
    });
  } catch (error) {
    next(error);
  }
};

// Compounder Management
const getAllCompounders = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { compounderId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const compounders = await Compounder.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: compounders.length, compounders });
  } catch (error) {
    next(error);
  }
};

const createCompounder = async (req, res, next) => {
  try {
    const { error } = compounderJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { compounderId, firstName, lastName, email, mobile, status, password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to create compounder' });
    }

    const existingCompounder = await Compounder.findOne({ $or: [{ compounderId }, { email }] });
    if (existingCompounder) {
      return res.status(400).json({ success: false, message: 'Compounder ID or email already registered' });
    }

    const newCompounder = new Compounder({
      compounderId,
      firstName,
      lastName,
      email,
      mobile,
      status: status || 'Active'
    });

    await Compounder.register(newCompounder, password);

    return res.status(201).json({
      success: true,
      message: 'Compounder account created successfully',
      compounder: {
        id: newCompounder._id,
        compounderId: newCompounder.compounderId,
        firstName: newCompounder.firstName,
        lastName: newCompounder.lastName,
        email: newCompounder.email
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateCompounder = async (req, res, next) => {
  try {
    const { error } = compounderJoiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const compounder = await Compounder.findById(req.params.id);
    if (!compounder) {
      return res.status(404).json({ success: false, message: 'Compounder not found' });
    }

    const { firstName, lastName, email, mobile, status, password } = req.body;

    compounder.firstName = firstName;
    compounder.lastName = lastName;
    compounder.email = email;
    compounder.mobile = mobile;
    compounder.status = status || compounder.status;

    if (password && password.trim() !== '') {
      await compounder.setPassword(password);
    }

    await compounder.save();

    return res.status(200).json({
      success: true,
      message: 'Compounder details updated successfully',
      compounder
    });
  } catch (error) {
    next(error);
  }
};

const toggleCompounderStatus = async (req, res, next) => {
  try {
    const compounder = await Compounder.findById(req.params.id);
    if (!compounder) {
      return res.status(404).json({ success: false, message: 'Compounder not found' });
    }

    compounder.status = compounder.status === 'Active' ? 'Inactive' : 'Active';
    await compounder.save();

    return res.status(200).json({
      success: true,
      message: `Compounder account is now ${compounder.status}`,
      compounder
    });
  } catch (error) {
    next(error);
  }
};

// Patients List for Admin
const getAllPatientsForAdmin = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { patientId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: patients.length, patients });
  } catch (error) {
    next(error);
  }
};

// Billing Register for Admin
const getAllBillsForAdmin = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }
    const bills = await Bill.find(filter).populate('appointment').populate('patient').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: bills.length, bills });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
