const mongoose = require('mongoose');
const Counter = require('./Counter');

const BillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  departmentName: {
    type: String,
    required: true
  },
  services: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partially Paid'],
    default: 'Paid'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Online'],
    default: 'Cash'
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

const getISTDateParts = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const mm = parts.find(p => p.type === 'month').value;
  const dd = parts.find(p => p.type === 'day').value;
  const yyyy = parts.find(p => p.type === 'year').value;
  const yy = yyyy.slice(-2);
  return `${yy}${mm}${dd}`;
};

const getISTDayBoundaries = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const mm = Number(parts.find(p => p.type === 'month').value);
  const dd = Number(parts.find(p => p.type === 'day').value);
  const yyyy = Number(parts.find(p => p.type === 'year').value);

  const startOfISTDay = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  const endOfISTDay = new Date(Date.UTC(yyyy, mm - 1, dd, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
  return { startOfISTDay, endOfISTDay };
};

BillSchema.pre('save', async function () {
  if (!this.billNumber) {
    const dateStr = getISTDateParts();
    const prefix = `BILL${dateStr}`;

    let counter = await Counter.findById(prefix);
    if (!counter) {
      const { startOfISTDay, endOfISTDay } = getISTDayBoundaries();
      const count = await mongoose.model('Bill').countDocuments({
        createdAt: { $gte: startOfISTDay, $lte: endOfISTDay }
      });

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
    this.billNumber = `${prefix}${sequence}`;
  }
});

module.exports = mongoose.model('Bill', BillSchema);
