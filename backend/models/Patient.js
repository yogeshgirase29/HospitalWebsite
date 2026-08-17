const mongoose = require('mongoose');
const Counter = require('./Counter');

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  }
}, { timestamps: true });

PatientSchema.pre('save', async function () {
  if (!this.patientId) {
    const prefix = 'PT';
    let counter = await Counter.findById(prefix);
    if (!counter) {
      const count = await mongoose.model('Patient').countDocuments();
      await Counter.findByIdAndUpdate(
        prefix,
        { $setOnInsert: { seq: count } },
        { returnDocument: 'after', upsert: true }
      );
    }

    counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );

    const sequence = String(counter.seq).padStart(4, '0');
    this.patientId = `${prefix}${sequence}`;
  }
});

module.exports = mongoose.model('Patient', PatientSchema);
