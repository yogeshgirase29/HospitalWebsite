const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Gallery = require('../models/Gallery');
const News = require('../models/News');
const Testimonial = require('../models/Testimonial');
const Stats = require('../models/Stats');
const Contact = require('../models/Contact');
const Appointment = require('../models/Appointment');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospitalDB';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Admin.deleteMany({});
    await Doctor.deleteMany({});
    await Department.deleteMany({});
    await Gallery.deleteMany({});
    await News.deleteMany({});
    await Testimonial.deleteMany({});
    await Stats.deleteMany({});
    await Contact.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Cleared all existing database collections.');

    // Seed Admin (credentials: username=admin, password=admin123)
    const adminUser = new Admin({
      username: 'admin',
      email: 'admin@tmpmhospital.com'
    });
    await Admin.register(adminUser, 'admin123');
    console.log('Admin user seeded: username="admin", password="admin123"');

    // Seed Departments
    const depts = [
      {
        departmentName: { en: 'Cardiology', mr: 'कार्डिओलॉजी' },
        description: { 
          en: 'Comprehensive heart care and diagnostic services.', 
          mr: 'सर्वसमावेशक हृदयरोग काळजी आणि निदान सेवा.' 
        },
        icon: 'Heart',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600'
      },
      {
        departmentName: { en: 'Radiology', mr: 'रेडिओलॉजी' },
        description: { 
          en: 'Advanced imaging, MRI, CT scans, and X-ray services.', 
          mr: 'प्रगत इमेजिंग, एमआरआय (MRI), सीटी स्कॅन आणि एक्स-रे सेवा.' 
        },
        icon: 'Camera',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600'
      },
      {
        departmentName: { en: 'Pathology', mr: 'पॅथॉलॉजी' },
        description: { 
          en: 'Comprehensive laboratory diagnostic services.', 
          mr: 'सर्वसमावेशक प्रयोगशाळा निदान सेवा.' 
        },
        icon: 'FlaskConical',
        image: 'https://images.unsplash.com/photo-1579165466521-35b8c47568b1?auto=format&fit=crop&q=80&w=600'
      },
      {
        departmentName: { en: 'Pediatrics', mr: 'बालरोगशास्त्र' },
        description: { 
          en: 'Dedicated healthcare services for children and infants.', 
          mr: 'बालके आणि अर्भकांसाठी समर्पित आरोग्य सेवा.' 
        },
        icon: 'Baby',
        image: 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&q=80&w=600'
      },
      {
        departmentName: { en: 'Orthopedics', mr: 'अस्थिव्यंगशास्त्र' },
        description: { 
          en: 'Bone, joint, and musculoskeletal disorder treatments.', 
          mr: 'हाडे, सांधे आणि स्नायूंच्या आजारांचे उपचार.' 
        },
        icon: 'Bone',
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600'
      },
      {
        departmentName: { en: 'General Medicine', mr: 'जनरल मेडिसिन' },
        description: { 
          en: 'Primary healthcare and internal medicine services.', 
          mr: 'प्राथमिक आरोग्य सेवा आणि अंतर्गत औषधोपचार सेवा.' 
        },
        icon: 'Activity',
        image: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=600'
      }
    ];
    await Department.insertMany(depts);
    console.log('Departments seeded.');

    // Seed Doctors
    const docs = [
      {
        doctorName: { en: 'Dr. Sarah Jenkins', mr: 'डॉ. सारा जेन्किन्स' },
        specialization: { en: 'Cardiologist', mr: 'हृदयरोग तज्ज्ञ' },
        qualification: { en: 'MD, DM (Cardiology)', mr: 'एम.डी., डी.एम. (हृदयरोगशास्त्र)' },
        experience: { en: '16 Years', mr: '१६ वर्षे' },
        department: 'Cardiology',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
        available: true
      },
      {
        doctorName: { en: 'Dr. Robert Chen', mr: 'डॉ. रॉबर्ट चेन' },
        specialization: { en: 'Radiologist', mr: 'क्ष-किरण तज्ज्ञ' },
        qualification: { en: 'MD (Radiodiagnosis)', mr: 'एम.डी. (रेडिओडायग्नोसिस)' },
        experience: { en: '14 Years', mr: '१४ वर्षे' },
        department: 'Radiology',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
        available: true
      },
      {
        doctorName: { en: 'Dr. Emily Taylor', mr: 'डॉ. एमिली टेलर' },
        specialization: { en: 'Pathologist', mr: 'रोगनिदान तज्ज्ञ (पॅथॉलॉजिस्ट)' },
        qualification: { en: 'MD, PhD (Pathology)', mr: 'एम.डी., पी.एचडी. (पॅथॉलॉजी)' },
        experience: { en: '12 Years', mr: '१२ वर्षे' },
        department: 'Pathology',
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        available: true
      },
      {
        doctorName: { en: 'Dr. Michael Stone', mr: 'डॉ. मायकेल स्टोन' },
        specialization: { en: 'Internal Medicine Specialist', mr: 'अंतर्गत औषधशास्त्र तज्ज्ञ (फिजिशियन)' },
        qualification: { en: 'MD (General Medicine)', mr: 'एम.डी. (जनरल मेडिसिन)' },
        experience: { en: '15 Years', mr: '१५ वर्षे' },
        department: 'General Medicine',
        image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
        available: true
      }
    ];
    await Doctor.insertMany(docs);
    console.log('Doctors seeded.');

    // Seed Stats
    const defaultStats = new Stats({
      beds: 1200,
      doctors: 150,
      campusArea: '7 Lakh+ Sq.Ft.',
      emergencyStatus: 'Active'
    });
    await defaultStats.save();
    console.log('Hospital Statistics seeded.');

    // Seed News (Bilingual)
    const newsData = [
      {
        title: {
          en: 'Inauguration of Advanced MRI Center',
          mr: 'प्रगत एमआरआय केंद्राचे उद्घाटन'
        },
        description: {
          en: 'Our hospital has launched a next-generation 3T MRI diagnostic system to provide high-precision neuro and cardiac imaging.',
          mr: 'आमच्या रुग्णालयाने उच्च-अचूक न्यूरो आणि कार्डियाक इमेजिंग प्रदान करण्यासाठी नवीन ३टी एमआरआय डायग्नोस्टिक सिस्टम सुरू केली आहे.'
        },
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
        date: new Date('2026-06-10')
      },
      {
        title: {
          en: 'Free Pediatric Health Camp This Sunday',
          mr: 'या रविवारी मोफत बालरोग आरोग्य शिबिर'
        },
        description: {
          en: 'A free clinical health screening and pediatric consultancy camp will be held at our Dahiwad campus from 9:00 AM to 4:00 PM.',
          mr: 'आमच्या दहीवड कॅम्पसमध्ये सकाळी ९:०० ते दुपारी ४:०० या वेळेत मोफत क्लिनिकल आरोग्य तपासणी आणि बालरोग सल्ला शिबिर आयोजित केले जाईल.'
        },
        image: 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&q=80&w=600',
        date: new Date('2026-06-15')
      }
    ];
    await News.insertMany(newsData);
    console.log('News posts seeded.');

    // Seed Testimonials
    const testimonialData = [
      {
        patientName: 'Eleanor Vance',
        feedback: 'The clinical services and ICU team were incredibly professional during my treatment. The staff provided exceptional care and constant support.',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
      },
      {
        patientName: 'Marcus Brody',
        feedback: 'Clean facilities, state-of-the-art diagnostic labs, and very polite support staff. The reports delivery was swift and seamless.',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
      },
      {
        patientName: 'Clara Sterling',
        feedback: 'Best tertiary hospital in the region. PMJAY cashless schemes coordination was smooth, ensuring my father got treatment with zero hassle.',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'
      }
    ];
    await Testimonial.insertMany(testimonialData);
    console.log('Testimonials seeded.');

    // Seed Gallery
    const galleryData = [
      {
        title: 'Main Tertiary Campus',
        category: 'Hospital',
        image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: 'Cardiac OPD Wing',
        category: 'Facilities',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: 'Multi-slice CT Scanner',
        category: 'Equipment',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: 'Community Health Awareness Drive',
        category: 'Events',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800'
      }
    ];
    await Gallery.insertMany(galleryData);
    console.log('Gallery images seeded.');

    console.log('Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
};

seedData();
