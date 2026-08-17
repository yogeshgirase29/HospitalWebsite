const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day'],
    default: 'Present'
  },
  checkInNotes: {
    type: String,
    trim: true
  },
  checkOutNotes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Ensure unique index so an employee cannot have multiple records for the same date
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
