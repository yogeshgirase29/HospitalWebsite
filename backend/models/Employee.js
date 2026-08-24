const mongoose = require('mongoose');
const passportLocalMongooseObj = require('passport-local-mongoose');
const passportLocalMongoose = passportLocalMongooseObj.default || passportLocalMongooseObj;

const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
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
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  mustChangePassword: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

EmployeeSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  findByUsername: function(model, queryParameters) {
    const makeCaseInsensitive = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(makeCaseInsensitive);
      } else {
        for (const key in obj) {
          if ((key === 'username' || key === 'email') && typeof obj[key] === 'string') {
            const safeUsername = obj[key].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            obj[key] = new RegExp('^' + safeUsername + '$', 'i');
          } else if (typeof obj[key] === 'object') {
            makeCaseInsensitive(obj[key]);
          }
        }
      }
    };
    makeCaseInsensitive(queryParameters);
    return model.findOne(queryParameters);
  }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
