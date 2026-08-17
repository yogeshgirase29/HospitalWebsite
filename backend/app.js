const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStoreObj = require('connect-mongo');
const MongoStore = MongoStoreObj.default || MongoStoreObj.MongoStore;
const passport = require('passport');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsRoutes = require('./routes/newsRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const statsRoutes = require('./routes/statsRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const compounderRoutes = require('./routes/compounderRoutes');

// Import models for passport
const Admin = require('./models/Admin');
const Employee = require('./models/Employee');
const Compounder = require('./models/Compounder');

const app = express();

// Enable CORS
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Flash messages (often used for server-side views, but initialized as requested)
app.use(flash());

const isProd = process.env.NODE_ENV === 'production';

// Trust proxy for secure cookies behind reverse proxies (Render, Heroku, etc.)
if (isProd) {
  app.set('trust proxy', 1);
}

// Express Session configuration with MongoDB storage
app.use(session({
  secret: process.env.SESSION_SECRET || 'hospitalSessionSecret123!',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospitalDB',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: isProd, // Set to true if using HTTPS in production
    sameSite: isProd ? 'none' : 'lax' // Required for cross-domain cookies in production
  }
}));

// Initialize Passport and Session
app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy Configuration using passport-local-mongoose
passport.use('admin-local', Admin.createStrategy());
passport.use('employee-local', Employee.createStrategy());
passport.use('compounder-local', Compounder.createStrategy());
passport.use('local', Admin.createStrategy()); // default local strategy alias for admin

passport.serializeUser((user, done) => {
  let userType = 'Admin';
  if (user.constructor.modelName === 'Employee') userType = 'Employee';
  else if (user.constructor.modelName === 'Compounder') userType = 'Compounder';
  done(null, { id: user.id, type: userType });
});

passport.deserializeUser(async (key, done) => {
  try {
    if (key.type === 'Admin') {
      const user = await Admin.findById(key.id);
      done(null, user);
    } else if (key.type === 'Employee') {
      const user = await Employee.findById(key.id);
      done(null, user);
    } else if (key.type === 'Compounder') {
      const user = await Compounder.findById(key.id);
      done(null, user);
    } else {
      done(new Error('Unknown user type'));
    }
  } catch (err) {
    done(err);
  }
});

// Mount API Routes
app.use('/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/compounders', compounderRoutes);

// Custom 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
