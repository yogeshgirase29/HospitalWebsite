import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  doctorsApi, 
  departmentsApi, 
  appointmentsApi,
  newsApi,
  testimonialsApi,
  galleryApi,
  statsApi,
  contactsApi
} from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Calendar, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Image as ImageIcon, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Menu,
  Download,
  Newspaper,
  Star,
  MessageSquare,
  BarChart3,
  Eye,
  Loader2
} from 'lucide-react';
import { 
  Heart, 
  Camera, 
  FlaskConical, 
  Baby, 
  Bone, 
  Activity, 
  Stethoscope, 
  Brain, 
  Shield, 
  Droplet, 
  Ear, 
  Scissors, 
  Syringe, 
  Sparkles, 
  HeartPulse 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getISTDateString, formatISTDate } from '../utils/dateUtils';
import { AdminEmployees } from '../components/AdminEmployees';
import { AdminAttendance } from '../components/AdminAttendance';
import { AdminCompounders } from '../components/AdminCompounders';
import { AdminPatients } from '../components/AdminPatients';
import { AdminBilling } from '../components/AdminBilling';
import { CreditCard, User } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  Heart,
  Camera,
  FlaskConical,
  Baby,
  Bone,
  Activity,
  Stethoscope,
  Brain,
  Shield,
  Droplet,
  Ear,
  Scissors,
  Syringe,
  Sparkles,
  HeartPulse
};

const getDeptIcon = (iconName: string) => {
  return iconMap[iconName] || Stethoscope;
};

type Tab = 'overview' | 'appointments' | 'schedule' | 'doctors' | 'departments' | 'news' | 'gallery' | 'testimonials' | 'enquiries' | 'stats' | 'employees' | 'attendance' | 'compounders' | 'patients' | 'billing';

interface DoctorType {
  _id: string;
  doctorName: { en: string; mr: string };
  specialization: { en: string; mr: string };
  qualification: { en: string; mr: string };
  experience: { en: string; mr: string };
  department: string;
  image: string;
  available: boolean;
  leaveSchedule?: {
    _id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Active' | 'Cancelled';
    createdAt: string;
  }[];
}

interface DepartmentType {
  _id: string;
  departmentName: { en: string; mr: string };
  description: { en: string; mr: string };
  icon: string;
  image: string;
}

interface AppointmentType {
  _id: string;
  appointmentId?: string;
  patientName: string;
  mobile: string;
  email?: string;
  department: string;
  departmentMr?: string;
  doctor: string;
  doctorMr?: string;
  appointmentDate: string;
  appointmentSlot: string;
  message?: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { logout, adminUser, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('adminActiveTab') as Tab;
    const validTabs: Tab[] = ['overview', 'appointments', 'schedule', 'doctors', 'departments', 'news', 'gallery', 'testimonials', 'enquiries', 'stats', 'employees', 'attendance', 'compounders', 'patients', 'billing'];
    if (saved && validTabs.includes(saved)) {
      return saved;
    }
    return 'overview';
  });

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      const tab = (location.state as any).activeTab;
      setActiveTab(tab);
      localStorage.setItem('adminActiveTab', tab);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [updatingAppAction, setUpdatingAppAction] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Data States
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [, setStats] = useState({
    beds: 1200,
    doctors: 150,
    campusArea: '7 Lakh+ Sq.Ft.',
    emergencyStatus: 'Active'
  });

  // Search & Filter States
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appDeptFilter, setAppDeptFilter] = useState('All');
  const [appDoctorFilter, setAppDoctorFilter] = useState('All');
  const [appDateFilter, setAppDateFilter] = useState('');

  // Daily Slots Schedule monitor states
  const [scheduleDept, setScheduleDept] = useState('All');
  const [scheduleDoctor, setScheduleDoctor] = useState('');
  const [scheduleDate, setScheduleDate] = useState(getISTDateString());
  const [scheduleSlotsList, setScheduleSlotsList] = useState<any[]>([]);
  const [scheduleSlotsLoading, setScheduleSlotsLoading] = useState(false);
  const [scheduleOnLeave, setScheduleOnLeave] = useState(false);
  const [scheduleLeaveDetails, setScheduleLeaveDetails] = useState<any>(null);
  const [calendarMap, setCalendarMap] = useState<any>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(getISTDateString().substring(0, 7)); // YYYY-MM
  const [togglingDoctorId, setTogglingDoctorId] = useState<string | null>(null);

  // Modal / Form States
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  
  // Doctor Form State
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    doctorNameEn: '',
    doctorNameMr: '',
    specializationEn: '',
    specializationMr: '',
    qualificationEn: '',
    qualificationMr: '',
    experienceEn: '',
    experienceMr: '',
    department: '',
    available: true
  });
  const [doctorImageFile, setDoctorImageFile] = useState<File | null>(null);
  const [doctorImagePreview, setDoctorImagePreview] = useState<string>('');

  // Department Form State
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({
    departmentNameEn: '',
    departmentNameMr: '',
    descriptionEn: '',
    descriptionMr: '',
    icon: 'Activity'
  });
  const [deptImageFile, setDeptImageFile] = useState<File | null>(null);
  const [deptImagePreview, setDeptImagePreview] = useState<string>('');

  // News Form State
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    titleEn: '',
    titleMr: '',
    descriptionEn: '',
    descriptionMr: '',
    date: getISTDateString()
  });
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
  const [newsImagePreview, setNewsImagePreview] = useState<string>('');

  // Testimonial Form State
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    patientName: '',
    feedback: '',
    rating: 5
  });
  const [testimonialImageFile, setTestimonialImageFile] = useState<File | null>(null);
  const [testimonialImagePreview, setTestimonialImagePreview] = useState<string>('');

  // Gallery Form State
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Hospital'
  });
  const [galleryImageFile, setGalleryImageFile] = useState<File | null>(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState<string>('');

  // Stats Form State
  const [statsForm, setStatsForm] = useState({
    beds: 1200,
    doctors: 150,
    campusArea: '7 Lakh+ Sq.Ft.',
    emergencyStatus: 'Active'
  });

  // Check Auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load Data
  const loadDashboardData = async () => {
    setFetchingData(true);
    try {
      const [docsRes, deptsRes, appsRes, newsRes, testimonialsRes, galleryRes, contactsRes, statsRes] = await Promise.all([
        doctorsApi.getAll(false),
        departmentsApi.getAll(),
        appointmentsApi.getAll(),
        newsApi.getAll(),
        testimonialsApi.getAll(),
        galleryApi.getAll(),
        contactsApi.getAll(),
        statsApi.get()
      ]);
      if (docsRes.success) {
        setDoctors(docsRes.doctors);
        if (docsRes.doctors.length > 0) {
          setScheduleDoctor(docsRes.doctors[0].doctorName.en);
        }
      }
      if (deptsRes.success) setDepartments(deptsRes.departments);
      if (appsRes.success) setAppointments(appsRes.appointments);
      if (newsRes.success) setNews(newsRes.news);
      if (testimonialsRes.success) setTestimonials(testimonialsRes.testimonials);
      if (galleryRes.success) setGallery(galleryRes.gallery);
      if (contactsRes.success) setContacts(contactsRes.contacts);
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
        setStatsForm({
          beds: statsRes.stats.beds,
          doctors: statsRes.stats.doctors,
          campusArea: statsRes.stats.campusArea,
          emergencyStatus: statsRes.stats.emergencyStatus
        });
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
      showNotification('error', 'Failed to fetch latest records.');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, activeTab]);

  // Search & Filter Appointments
  const loadFilteredAppointments = async () => {
    try {
      const res = await appointmentsApi.getAll({
        search: appSearch,
        status: appStatusFilter,
        department: appDeptFilter,
        doctor: appDoctorFilter,
        date: appDateFilter
      });
      if (res.success) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        loadFilteredAppointments();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appSearch, appStatusFilter, appDeptFilter, appDoctorFilter, appDateFilter]);

  // Monitor Schedule Slots loading
  useEffect(() => {
    const loadScheduleSlots = async () => {
      if (!scheduleDate || !scheduleDoctor || doctors.length === 0) {
        setScheduleSlotsList([]);
        setScheduleOnLeave(false);
        setScheduleLeaveDetails(null);
        return;
      }
      setScheduleSlotsLoading(true);
      try {
        const doc = doctors.find(d => d.doctorName.en === scheduleDoctor);
        if (doc) {
          const res = await appointmentsApi.getAvailableSlots(doc._id, scheduleDate);
          if (res.success) {
            if (res.onLeave) {
              setScheduleOnLeave(true);
              setScheduleLeaveDetails(res.leaveDetails);
              setScheduleSlotsList(res.slotsData || []);
            } else {
              setScheduleOnLeave(false);
              setScheduleLeaveDetails(null);
              setScheduleSlotsList(res.slotsData || []);
            }
          }
        }
      } catch (err) {
        console.error('Error loading schedule slots:', err);
      } finally {
        setScheduleSlotsLoading(false);
      }
    };
    loadScheduleSlots();
  }, [scheduleDoctor, scheduleDate, doctors]);

  // Load Calendar map status for monthly view
  useEffect(() => {
    const loadCalendarMap = async () => {
      if (!scheduleDoctor || !calendarMonth || doctors.length === 0) {
        setCalendarMap({});
        return;
      }
      const doc = doctors.find(d => d.doctorName.en === scheduleDoctor);
      if (doc) {
        setCalendarLoading(true);
        try {
          const res = await doctorsApi.getCalendarStatus(doc._id, calendarMonth);
          if (res.success) {
            setCalendarMap(res.calendar || {});
          }
        } catch (err) {
          console.error('Failed to load calendar status map:', err);
        } finally {
          setCalendarLoading(false);
        }
      }
    };
    loadCalendarMap();
  }, [scheduleDoctor, calendarMonth, doctors]);

  // Filtered doctors list for the schedule monitor
  const filteredScheduleDoctors = doctors.filter(d => 
    scheduleDept === 'All' || d.department.toLowerCase() === scheduleDept.toLowerCase()
  );

  // Sync selected schedule doctor when filtered list changes or initial load
  useEffect(() => {
    if (filteredScheduleDoctors.length > 0) {
      const isStillAvailable = filteredScheduleDoctors.some(d => d.doctorName.en === scheduleDoctor);
      if (!isStillAvailable) {
        setScheduleDoctor(filteredScheduleDoctors[0].doctorName.en);
      }
    } else {
      setScheduleDoctor('');
    }
  }, [scheduleDept, doctors]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      showNotification('error', 'Logout failed');
    }
  };

  // Appointment Actions
  const handleUpdateAppStatus = async (id: string, status: 'Confirmed' | 'Completed' | 'Cancelled') => {
    setUpdatingAppId(id);
    const actionMap = {
      Confirmed: 'confirm',
      Completed: 'complete',
      Cancelled: 'cancel'
    };
    setUpdatingAppAction(actionMap[status] || null);
    try {
      const res = await appointmentsApi.updateStatus(id, status);
      if (res.success) {
        setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: res.appointment.status } : a));
        showNotification('success', `Appointment status updated to ${status}`);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingAppId(null);
      setUpdatingAppAction(null);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Appointment',
      message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
      onConfirm: async () => {
        setDeleteLoading(true);
        setUpdatingAppId(id);
        setUpdatingAppAction('delete');
        try {
          const res = await appointmentsApi.delete(id);
          if (res.success) {
            setAppointments(prev => prev.filter(app => app._id !== id));
            showNotification('success', 'Appointment deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete appointment');
        } finally {
          setUpdatingAppId(null);
          setUpdatingAppAction(null);
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Doctor Actions
  const handleDoctorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDoctorImageFile(file);
      setDoctorImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddDoctor = () => {
    setEditingDoctorId(null);
    setDoctorForm({
      doctorNameEn: '',
      doctorNameMr: '',
      specializationEn: '',
      specializationMr: '',
      qualificationEn: '',
      qualificationMr: '',
      experienceEn: '',
      experienceMr: '',
      department: departments[0]?.departmentName.en || '',
      available: true
    });
    setDoctorImageFile(null);
    setDoctorImagePreview('');
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: DoctorType) => {
    setEditingDoctorId(doc._id);
    setDoctorForm({
      doctorNameEn: doc.doctorName.en,
      doctorNameMr: doc.doctorName.mr,
      specializationEn: doc.specialization.en,
      specializationMr: doc.specialization.mr,
      qualificationEn: doc.qualification.en,
      qualificationMr: doc.qualification.mr,
      experienceEn: doc.experience.en,
      experienceMr: doc.experience.mr,
      department: doc.department,
      available: doc.available
    });
    setDoctorImageFile(null);
    setDoctorImagePreview(doc.image);
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !doctorForm.doctorNameEn || !doctorForm.doctorNameMr ||
      !doctorForm.specializationEn || !doctorForm.specializationMr ||
      !doctorForm.qualificationEn || !doctorForm.qualificationMr ||
      !doctorForm.experienceEn || !doctorForm.experienceMr ||
      !doctorForm.department
    ) {
      showNotification('error', 'All fields are required.');
      return;
    }

    if (!editingDoctorId && !doctorImageFile) {
      showNotification('error', 'Doctor image is required.');
      return;
    }

    const formData = new FormData();
    formData.append('doctorName', JSON.stringify({ en: doctorForm.doctorNameEn, mr: doctorForm.doctorNameMr }));
    formData.append('specialization', JSON.stringify({ en: doctorForm.specializationEn, mr: doctorForm.specializationMr }));
    formData.append('qualification', JSON.stringify({ en: doctorForm.qualificationEn, mr: doctorForm.qualificationMr }));
    formData.append('experience', JSON.stringify({ en: doctorForm.experienceEn, mr: doctorForm.experienceMr }));
    formData.append('department', doctorForm.department);
    formData.append('available', String(doctorForm.available));
    if (doctorImageFile) {
      formData.append('image', doctorImageFile);
    }

    setLoading(true);
    try {
      let res: any;
      if (editingDoctorId) {
        res = await doctorsApi.update(editingDoctorId, formData);
        if (res.success) {
          setDoctors(prev => prev.map(d => d._id === editingDoctorId ? res.doctor : d));
          showNotification('success', 'Doctor updated successfully');
        }
      } else {
        res = await doctorsApi.create(formData);
        if (res.success) {
          setDoctors(prev => [res.doctor, ...prev]);
          showNotification('success', 'Doctor added successfully');
        }
      }
      setIsDoctorModalOpen(false);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Doctor Record',
      message: 'Are you sure you want to delete this doctor? This action cannot be undone and will remove all their details from the database.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          const res = await doctorsApi.delete(id);
          if (res.success) {
            setDoctors(prev => prev.filter(d => d._id !== id));
            showNotification('success', 'Doctor deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete doctor');
        } finally {
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleToggleDoctorAvailability = async (id: string) => {
    setTogglingDoctorId(id);
    try {
      const res = await doctorsApi.toggleStatus(id);
      if (res.success) {
        setDoctors(prev => prev.map(d => d._id === id ? { ...d, available: res.available } : d));
        showNotification('success', res.message);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update availability status');
    } finally {
      setTogglingDoctorId(null);
    }
  };

  // Department Actions
  const handleDeptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDeptImageFile(file);
      setDeptImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddDept = () => {
    setEditingDeptId(null);
    setDeptForm({
      departmentNameEn: '',
      departmentNameMr: '',
      descriptionEn: '',
      descriptionMr: '',
      icon: 'Activity'
    });
    setDeptImageFile(null);
    setDeptImagePreview('');
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: DepartmentType) => {
    setEditingDeptId(dept._id);
    setDeptForm({
      departmentNameEn: dept.departmentName.en,
      departmentNameMr: dept.departmentName.mr,
      descriptionEn: dept.description?.en || '',
      descriptionMr: dept.description?.mr || '',
      icon: dept.icon || 'Activity'
    });
    setDeptImageFile(null);
    setDeptImagePreview(dept.image || '');
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.departmentNameEn || !deptForm.departmentNameMr) {
      showNotification('error', 'Department Name is required for both English and Marathi.');
      return;
    }

    if (!editingDeptId && !deptImageFile) {
      showNotification('error', 'Department image is required.');
      return;
    }

    const formData = new FormData();
    formData.append('departmentName', JSON.stringify({ en: deptForm.departmentNameEn, mr: deptForm.departmentNameMr }));
    formData.append('description', JSON.stringify({ en: deptForm.descriptionEn, mr: deptForm.descriptionMr }));
    formData.append('icon', deptForm.icon);
    if (deptImageFile) {
      formData.append('image', deptImageFile);
    }

    setLoading(true);
    try {
      let res: any;
      if (editingDeptId) {
        res = await departmentsApi.update(editingDeptId, formData);
        if (res.success) {
          setDepartments(prev => prev.map(d => d._id === editingDeptId ? res.department : d));
          showNotification('success', 'Department updated successfully');
        }
      } else {
        res = await departmentsApi.create(formData);
        if (res.success) {
          setDepartments(prev => [...prev, res.department]);
          showNotification('success', 'Department created successfully');
        }
      }
      setIsDeptModalOpen(false);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Department',
      message: 'Are you sure you want to delete this department? This will also remove the department reference from associated services.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          const res = await departmentsApi.delete(id);
          if (res.success) {
            setDepartments(prev => prev.filter(d => d._id !== id));
            showNotification('success', 'Department deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete department');
        } finally {
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // News Actions
  const handleNewsImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewsImageFile(file);
      setNewsImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddNews = () => {
    setEditingNewsId(null);
    setNewsForm({
      titleEn: '',
      titleMr: '',
      descriptionEn: '',
      descriptionMr: '',
      date: getISTDateString()
    });
    setNewsImageFile(null);
    setNewsImagePreview('');
    setIsNewsModalOpen(true);
  };

  const handleOpenEditNews = (post: any) => {
    setEditingNewsId(post._id);
    setNewsForm({
      titleEn: post.title.en,
      titleMr: post.title.mr,
      descriptionEn: post.description.en,
      descriptionMr: post.description.mr,
      date: post.date ? getISTDateString(new Date(post.date)) : getISTDateString()
    });
    setNewsImageFile(null);
    setNewsImagePreview(post.image || '');
    setIsNewsModalOpen(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.titleEn || !newsForm.titleMr || !newsForm.descriptionEn || !newsForm.descriptionMr) {
      showNotification('error', 'Title and description are required for both English and Marathi.');
      return;
    }

    if (!editingNewsId && !newsImageFile) {
      showNotification('error', 'News cover image is required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', JSON.stringify({ en: newsForm.titleEn, mr: newsForm.titleMr }));
    formData.append('description', JSON.stringify({ en: newsForm.descriptionEn, mr: newsForm.descriptionMr }));
    formData.append('date', newsForm.date);
    if (newsImageFile) {
      formData.append('image', newsImageFile);
    }

    setLoading(true);
    try {
      let res: any;
      if (editingNewsId) {
        res = await newsApi.update(editingNewsId, formData);
        if (res.success) {
          setNews(prev => prev.map(n => n._id === editingNewsId ? res.news : n));
          showNotification('success', 'News post updated successfully');
        }
      } else {
        res = await newsApi.create(formData);
        if (res.success) {
          setNews(prev => [res.news, ...prev]);
          showNotification('success', 'News post added successfully');
        }
      }
      setIsNewsModalOpen(false);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save news post');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete News Announcement',
      message: 'Are you sure you want to delete this news post? It will immediately be removed from the public website.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          const res = await newsApi.delete(id);
          if (res.success) {
            setNews(prev => prev.filter(n => n._id !== id));
            showNotification('success', 'News post deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete news post');
        } finally {
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Testimonial Actions
  const handleTestimonialImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTestimonialImageFile(file);
      setTestimonialImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddTestimonial = () => {
    setEditingTestimonialId(null);
    setTestimonialForm({
      patientName: '',
      feedback: '',
      rating: 5
    });
    setTestimonialImageFile(null);
    setTestimonialImagePreview('');
    setIsTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (item: any) => {
    setEditingTestimonialId(item._id);
    setTestimonialForm({
      patientName: item.patientName,
      feedback: item.feedback,
      rating: item.rating || 5
    });
    setTestimonialImageFile(null);
    setTestimonialImagePreview(item.image || '');
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.patientName || !testimonialForm.feedback) {
      showNotification('error', 'Patient name and feedback are required.');
      return;
    }

    const formData = new FormData();
    formData.append('patientName', testimonialForm.patientName);
    formData.append('feedback', testimonialForm.feedback);
    formData.append('rating', String(testimonialForm.rating));
    if (testimonialImageFile) {
      formData.append('image', testimonialImageFile);
    }

    setLoading(true);
    try {
      let res: any;
      if (editingTestimonialId) {
        res = await testimonialsApi.update(editingTestimonialId, formData);
        if (res.success) {
          setTestimonials(prev => prev.map(t => t._id === editingTestimonialId ? res.testimonial : t));
          showNotification('success', 'Testimonial updated successfully');
        }
      } else {
        res = await testimonialsApi.create(formData);
        if (res.success) {
          setTestimonials(prev => [res.testimonial, ...prev]);
          showNotification('success', 'Testimonial created successfully');
        }
      }
      setIsTestimonialModalOpen(false);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save testimonial');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestimonial = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Testimonial',
      message: 'Are you sure you want to delete this testimonial? It will no longer display in the feedback carousel.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          const res = await testimonialsApi.delete(id);
          if (res.success) {
            setTestimonials(prev => prev.filter(t => t._id !== id));
            showNotification('success', 'Testimonial deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete testimonial');
        } finally {
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Gallery Actions
  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGalleryImageFile(file);
      setGalleryImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddGallery = () => {
    setEditingGalleryId(null);
    setGalleryForm({
      title: '',
      category: 'Hospital'
    });
    setGalleryImageFile(null);
    setGalleryImagePreview('');
    setIsGalleryModalOpen(true);
  };

  const handleOpenEditGallery = (item: any) => {
    setEditingGalleryId(item._id);
    setGalleryForm({
      title: item.title,
      category: item.category
    });
    setGalleryImageFile(null);
    setGalleryImagePreview(item.image || '');
    setIsGalleryModalOpen(true);
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.title || !galleryForm.category) {
      showNotification('error', 'Title and category are required.');
      return;
    }

    if (!editingGalleryId && !galleryImageFile) {
      showNotification('error', 'Gallery image is required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', galleryForm.title);
    formData.append('category', galleryForm.category);
    if (galleryImageFile) {
      formData.append('image', galleryImageFile);
    }

    setLoading(true);
    try {
      let res: any;
      if (editingGalleryId) {
        res = await galleryApi.update(editingGalleryId, formData);
        if (res.success) {
          setGallery(prev => prev.map(g => g._id === editingGalleryId ? res.gallery : g));
          showNotification('success', 'Gallery item updated successfully');
          setIsGalleryModalOpen(false);
        }
      } else {
        res = await galleryApi.create(formData);
        if (res.success) {
          setGallery(prev => [res.gallery, ...prev]);
          showNotification('success', 'Image added to gallery successfully');
          setIsGalleryModalOpen(false);
        }
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Gallery Image',
      message: 'Are you sure you want to delete this gallery item? This action removes the image resource permanently.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          const res = await galleryApi.delete(id);
          if (res.success) {
            setGallery(prev => prev.filter(g => g._id !== id));
            showNotification('success', 'Gallery item deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete gallery item');
        } finally {
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteEnquiry = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Enquiry',
      message: 'Are you sure you want to delete this contact enquiry? This action cannot be undone.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          const res = await contactsApi.delete(id);
          if (res.success) {
            setContacts(prev => prev.filter(c => c._id !== id));
            showNotification('success', 'Enquiry deleted successfully');
          }
        } catch (err: any) {
          showNotification('error', err.response?.data?.message || 'Failed to delete enquiry');
        } finally {
          setDeleteLoading(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Stats Actions
  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await statsApi.update(statsForm);
      if (res.success) {
        setStats(res.stats);
        showNotification('success', 'Hospital statistics updated dynamically');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update statistics');
    } finally {
      setLoading(false);
    }
  };

  // Calculated Stats
  const totalDocs = doctors.length;
  const totalDepts = departments.length;
  const pendingApps = appointments.filter(app => app.status === 'Pending').length;
  const totalApps = appointments.length;
  const totalContacts = contacts.length;
  const totalNews = news.length;

  // Group appointments slot-wise for the slot view on the overview tab
  const getSlotwiseAppointments = () => {
    const sorted = [...appointments].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    return sorted;
  };

  const slotwiseApps = getSlotwiseAppointments();

  // Helper to compute Doctor Leave Analytics
  const getLeaveAnalytics = () => {
    const todayStr = getISTDateString();
    const todayMidnight = new Date(todayStr);
    const sevenDaysLater = new Date(todayMidnight.getTime() + 7 * 24 * 60 * 60 * 1000);

    const onLeaveToday: string[] = [];
    const upcomingLeaves: { docName: string; leaveType: string; start: string; end: string }[] = [];
    const returningThisWeek: { docName: string; end: string }[] = [];

    doctors.forEach(doc => {
      if (doc.leaveSchedule && doc.leaveSchedule.length > 0) {
        doc.leaveSchedule.forEach((leave: any) => {
          if (leave.status === 'Active') {
            const startStr = getISTDateString(new Date(leave.startDate));
            const endStr = getISTDateString(new Date(leave.endDate));
            const endMidnight = new Date(endStr);

            // On leave today
            if (todayStr >= startStr && todayStr <= endStr) {
              onLeaveToday.push(doc.doctorName.en);
            }

            // Upcoming leaves
            if (startStr > todayStr) {
              upcomingLeaves.push({
                docName: doc.doctorName.en,
                leaveType: leave.leaveType,
                start: startStr,
                end: endStr
              });
            }

            // Returning this week (leave ends between today and 7 days later)
            if (endMidnight >= todayMidnight && endMidnight <= sevenDaysLater) {
              returningThisWeek.push({
                docName: doc.doctorName.en,
                end: endStr
              });
            }
          }
        });
      }
    });

    return {
      onLeaveToday,
      upcomingLeaves,
      returningThisWeek
    };
  };

  const leaveAnalytics = getLeaveAnalytics();

  if (authLoading || (!isAuthenticated && authLoading)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(2, 132, 199, 0.15)', borderTopColor: 'var(--med-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Dynamic Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              zIndex: 9999,
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: notification.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.92rem'
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <aside 
        style={{
          width: isSidebarOpen ? '240px' : '0px',
          minWidth: isSidebarOpen ? '240px' : '0px',
          flexShrink: 0,
          background: 'var(--primary)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all var(--transition-normal)',
          overflow: 'hidden',
          zIndex: 850,
          position: 'sticky',
          top: 0,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
        className="admin-sidebar"
      >
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: 'var(--gradient-primary)', color: 'white', padding: '6px', borderRadius: '8px' }}>
            <Users size={20} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
            TMPM Admin
          </span>
        </div>

        {/* Sidebar Nav links */}
        <nav style={{ flexGrow: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <button onClick={() => setActiveTab('overview')} className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}>
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </button>
          
          <button onClick={() => setActiveTab('appointments')} className={`sidebar-nav-btn ${activeTab === 'appointments' ? 'active' : ''}`}>
            <Calendar size={16} />
            <span>Appointments</span>
          </button>

          <button onClick={() => setActiveTab('schedule')} className={`sidebar-nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}>
            <Clock size={16} />
            <span>Daily Schedule</span>
          </button>

          <button onClick={() => setActiveTab('doctors')} className={`sidebar-nav-btn ${activeTab === 'doctors' ? 'active' : ''}`}>
            <Users size={16} />
            <span>Doctors</span>
          </button>

          <button onClick={() => setActiveTab('departments')} className={`sidebar-nav-btn ${activeTab === 'departments' ? 'active' : ''}`}>
            <Layers size={16} />
            <span>Departments</span>
          </button>

          <button onClick={() => setActiveTab('news')} className={`sidebar-nav-btn ${activeTab === 'news' ? 'active' : ''}`}>
            <Newspaper size={16} />
            <span>News Posts</span>
          </button>

          <button onClick={() => setActiveTab('gallery')} className={`sidebar-nav-btn ${activeTab === 'gallery' ? 'active' : ''}`}>
            <ImageIcon size={16} />
            <span>Gallery</span>
          </button>

          <button onClick={() => setActiveTab('testimonials')} className={`sidebar-nav-btn ${activeTab === 'testimonials' ? 'active' : ''}`}>
            <Star size={16} />
            <span>Testimonials</span>
          </button>

          <button onClick={() => setActiveTab('enquiries')} className={`sidebar-nav-btn ${activeTab === 'enquiries' ? 'active' : ''}`}>
            <MessageSquare size={16} />
            <span>Enquiries</span>
          </button>

          <button onClick={() => setActiveTab('stats')} className={`sidebar-nav-btn ${activeTab === 'stats' ? 'active' : ''}`}>
            <BarChart3 size={16} />
            <span>Hospital Stats</span>
          </button>

          <button onClick={() => setActiveTab('employees')} className={`sidebar-nav-btn ${activeTab === 'employees' ? 'active' : ''}`}>
            <Users size={16} />
            <span>Employees</span>
          </button>

          <button onClick={() => setActiveTab('attendance')} className={`sidebar-nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}>
            <Clock size={16} />
            <span>Attendance Logs</span>
          </button>

          <button onClick={() => setActiveTab('compounders')} className={`sidebar-nav-btn ${activeTab === 'compounders' ? 'active' : ''}`}>
            <User size={16} />
            <span>Compounders</span>
          </button>

          <button onClick={() => setActiveTab('patients')} className={`sidebar-nav-btn ${activeTab === 'patients' ? 'active' : ''}`}>
            <Users size={16} />
            <span>Patients Registry</span>
          </button>

          <button onClick={() => setActiveTab('billing')} className={`sidebar-nav-btn ${activeTab === 'billing' ? 'active' : ''}`}>
            <CreditCard size={16} />
            <span>Billing Register</span>
          </button>
        </nav>

        {/* User Footer info in Sidebar */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
            Logged in as: <strong style={{ color: 'white', display: 'block' }}>{adminUser?.username}</strong>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              width: '100%',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
            className="hover-red-btn"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        
        {/* Workspace Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid var(--border-muted)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 800
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', padding: '4px' }}
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontSize: '1.25rem', color: 'var(--primary)', textTransform: 'capitalize' }}>
              {activeTab === 'overview' 
                ? 'Dashboard Summary' 
                : activeTab === 'schedule' 
                  ? 'Daily Slot Schedule Monitor' 
                  : `${activeTab} management`}
            </h1>
          </div>

          <a href="/" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: 'var(--med-blue)',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            <span>Visit Public Website</span>
            <ExternalLink size={14} />
          </a>
        </header>

        {/* Tab Contents */}
        <main style={{ padding: '32px 24px', flexGrow: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>


          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  {/* Stat Cards Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px'
                  }}>
                    <div className="glass-panel stat-card-hover" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Doctors</span>
                        <h3 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--primary)', fontWeight: 800 }}>{totalDocs}</h3>
                      </div>
                      <div style={{ background: 'var(--med-blue-light)', color: 'var(--med-blue)', padding: '10px', borderRadius: '10px' }}>
                        <Users size={20} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card-hover" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Departments</span>
                        <h3 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--cyan-hover)', fontWeight: 800 }}>{totalDepts}</h3>
                      </div>
                      <div style={{ background: 'var(--cyan-light)', color: 'var(--cyan-hover)', padding: '10px', borderRadius: '10px' }}>
                        <Layers size={20} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card-hover" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Appointments</span>
                        <h3 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--med-blue)', fontWeight: 800 }}>{totalApps}</h3>
                      </div>
                      <div style={{ background: 'var(--med-blue-light)', color: 'var(--med-blue)', padding: '10px', borderRadius: '10px' }}>
                        <Calendar size={20} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card-hover" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Appts</span>
                        <h3 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'orange', fontWeight: 800 }}>{pendingApps}</h3>
                      </div>
                      <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}>
                        <Clock size={20} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card-hover" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Enquiries</span>
                        <h3 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--med-blue)', fontWeight: 800 }}>{totalContacts}</h3>
                      </div>
                      <div style={{ background: 'rgba(2, 132, 199, 0.05)', color: 'var(--med-blue)', padding: '10px', borderRadius: '10px' }}>
                        <MessageSquare size={20} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card-hover" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>News Announcements</span>
                        <h3 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--primary)', fontWeight: 800 }}>{totalNews}</h3>
                      </div>
                      <div style={{ background: 'rgba(2, 132, 199, 0.05)', color: 'var(--med-blue)', padding: '10px', borderRadius: '10px' }}>
                        <Newspaper size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Doctor Leave Status Analytics Panel */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} color="#d97706" />
                        <span>Doctors On Leave Today ({leaveAnalytics.onLeaveToday.length})</span>
                      </h4>
                      {leaveAnalytics.onLeaveToday.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>All doctors are available today.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {leaveAnalytics.onLeaveToday.map((name, i) => (
                            <div key={i} style={{ fontSize: '0.82rem', fontWeight: 600, padding: '6px 10px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '6px', color: '#c2410c' }}>
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="glass-panel" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="var(--med-blue)" />
                        <span>Upcoming Doctor Leaves ({leaveAnalytics.upcomingLeaves.length})</span>
                      </h4>
                      {leaveAnalytics.upcomingLeaves.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No upcoming leaves scheduled.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                          {leaveAnalytics.upcomingLeaves.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-muted)', borderRadius: '6px' }}>
                              <strong>{item.docName}</strong>: {item.leaveType} ({formatISTDate(item.start)} - {formatISTDate(item.end)})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="glass-panel" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#15803d" />
                        <span>Doctors Returning This Week ({leaveAnalytics.returningThisWeek.length})</span>
                      </h4>
                      {leaveAnalytics.returningThisWeek.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No doctors returning from leaves this week.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {leaveAnalytics.returningThisWeek.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px', color: '#166534' }}>
                              <strong>{item.docName}</strong> (Returning {formatISTDate(item.end)})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slot-wise Appointment View */}
                  <div className="glass-panel" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-muted)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--primary)' }}>Slot-wise Schedule View</h3>
                    {slotwiseApps.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No slots booked yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {slotwiseApps.slice(0, 8).map(app => (
                          <div key={app._id} style={{
                            padding: '14px',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--med-blue)' }}>{app.appointmentId}</span>
                              <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'white', fontWeight: 700, border: '1px solid var(--border-muted)' }}>
                                {app.appointmentSlot}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>{app.patientName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <strong>Doctor:</strong> {app.doctor}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <strong>Date:</strong> {formatISTDate(app.appointmentDate)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Appointments Preview */}
                  <div className="glass-panel" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Bookings</h3>
                      <button onClick={() => setActiveTab('appointments')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Manage All</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      {appointments.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No appointments booked yet.
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-muted)' }}>
                              <th style={{ padding: '12px' }}>Appt ID</th>
                              <th style={{ padding: '12px' }}>Patient</th>
                              <th style={{ padding: '12px' }}>Contact</th>
                              <th style={{ padding: '12px' }}>Department</th>
                              <th style={{ padding: '12px' }}>Doctor</th>
                              <th style={{ padding: '12px' }}>Date/Slot</th>
                              <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.slice(0, 5).map(app => (
                              <tr key={app._id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--med-blue)' }}>{app.appointmentId || '-'}</td>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{app.patientName}</td>
                                <td style={{ padding: '12px' }}>{app.mobile}</td>
                                <td style={{ padding: '12px' }}>{app.department}</td>
                                <td style={{ padding: '12px' }}>{app.doctor}</td>
                                <td style={{ padding: '12px' }}>
                                  <div>{formatISTDate(app.appointmentDate)}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{app.appointmentSlot}</div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`status-pill ${app.status.toLowerCase()}`}>
                                    {app.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  {/* Search & Filters */}
                  <div className="glass-panel" style={{ padding: '20px', background: 'white', border: '1px solid var(--border-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '12px' }}>
                    <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="Search by Patient name, phone, email, or Appt ID..."
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 10px 10px 36px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-muted)',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    {/* Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status:</span>
                      <select 
                        value={appStatusFilter} 
                        onChange={(e) => setAppStatusFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem', backgroundColor: 'white' }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Department Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dept:</span>
                      <select 
                        value={appDeptFilter} 
                        onChange={(e) => setAppDeptFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem', backgroundColor: 'white', maxWidth: '180px' }}
                      >
                        <option value="All">All Departments</option>
                        {departments.map(d => (
                          <option key={d._id} value={d.departmentName.en}>{d.departmentName.en}</option>
                        ))}
                      </select>
                    </div>

                    {/* Doctor Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Doctor:</span>
                      <select 
                        value={appDoctorFilter} 
                        onChange={(e) => setAppDoctorFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem', backgroundColor: 'white', maxWidth: '180px' }}
                      >
                        <option value="All">All Doctors</option>
                        {doctors.map(d => (
                          <option key={d._id} value={d.doctorName.en}>{d.doctorName.en}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date:</span>
                      <input 
                        type="date" 
                        value={appDateFilter} 
                        onChange={(e) => setAppDateFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem' }}
                      />
                      {appDateFilter && (
                        <button onClick={() => setAppDateFilter('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Clear</button>
                      )}
                    </div>
                  </div>

                  {/* Appointments Table */}
                  <div className="glass-panel" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-muted)', borderRadius: '12px' }}>
                    <div style={{ overflowX: 'auto' }}>
                      {appointments.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No appointments matching filters.
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-muted)' }}>
                              <th style={{ padding: '12px' }}>Appt ID</th>
                              <th style={{ padding: '12px' }}>Patient Info</th>
                              <th style={{ padding: '12px' }}>Date / Slot</th>
                              <th style={{ padding: '12px' }}>Department</th>
                              <th style={{ padding: '12px' }}>Doctor</th>
                              <th style={{ padding: '12px' }}>Message</th>
                              <th style={{ padding: '12px' }}>Status</th>
                              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map(app => (
                              <tr key={app._id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--med-blue)' }}>{app.appointmentId || '-'}</td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{app.patientName}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Mob: {app.mobile}</div>
                                  {app.email && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{app.email}</div>}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: 500 }}>{formatISTDate(app.appointmentDate)}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{app.appointmentSlot}</div>
                                </td>
                                <td style={{ padding: '12px' }}>{app.department}</td>
                                <td style={{ padding: '12px' }}>{app.doctor}</td>
                                <td style={{ padding: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.message}>
                                  {app.message || '-'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`status-pill ${app.status.toLowerCase()}`}>
                                    {app.status}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    <button 
                                      onClick={() => navigate(`/admin/appointments/${app._id}`)}
                                      title="View Details"
                                      className="action-icon-btn view"
                                      style={{ color: 'var(--med-blue)', background: 'rgba(2,132,199,0.05)', border: '1px solid rgba(2,132,199,0.15)', borderRadius: '4px', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button 
                                      onClick={() => appointmentsApi.downloadPdf(app._id, app.appointmentId || '')}
                                      title="Download Confirmation PDF"
                                      className="action-icon-btn print"
                                    >
                                      <Download size={14} />
                                    </button>
                                    {app.status === 'Pending' && (
                                      <button 
                                        onClick={() => handleUpdateAppStatus(app._id, 'Confirmed')}
                                        disabled={updatingAppId !== null}
                                        title="Confirm Appointment"
                                        className="action-icon-btn confirm"
                                      >
                                        {updatingAppId === app._id && updatingAppAction === 'confirm' ? <Loader2 size={14} className="spin-animation" /> : <Check size={14} />}
                                      </button>
                                    )}
                                    {app.status === 'Confirmed' && (
                                      <button 
                                        onClick={() => handleUpdateAppStatus(app._id, 'Completed')}
                                        disabled={updatingAppId !== null}
                                        title="Mark Completed"
                                        className="action-icon-btn complete"
                                      >
                                        {updatingAppId === app._id && updatingAppAction === 'complete' ? <Loader2 size={14} className="spin-animation" /> : <CheckCircle size={14} />}
                                      </button>
                                    )}
                                    {app.status !== 'Completed' && app.status !== 'Cancelled' && (
                                      <button 
                                        onClick={() => handleUpdateAppStatus(app._id, 'Cancelled')}
                                        disabled={updatingAppId !== null}
                                        title="Cancel Appointment"
                                        className="action-icon-btn cancel"
                                      >
                                        {updatingAppId === app._id && updatingAppAction === 'cancel' ? <Loader2 size={14} className="spin-animation" /> : <X size={14} />}
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleDeleteAppointment(app._id)}
                                      disabled={updatingAppId !== null}
                                      title="Delete Appointment"
                                      className="action-icon-btn delete"
                                    >
                                      {updatingAppId === app._id && updatingAppAction === 'delete' ? <Loader2 size={14} className="spin-animation" /> : <Trash2 size={14} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-muted)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Daily Slot Schedule Monitor</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Identify booked (Red) and available (Green) time slots for each specialist doctor</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                    
                    {/* Department Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Department</span>
                      <select 
                        value={scheduleDept} 
                        onChange={(e) => setScheduleDept(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem', backgroundColor: 'white', minWidth: '220px' }}
                      >
                        <option value="All">All Departments</option>
                        {departments.map(d => (
                          <option key={d._id} value={d.departmentName.en}>{d.departmentName.en}</option>
                        ))}
                      </select>
                    </div>

                    {/* Specialist Doctor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Specialist Doctor</span>
                      <select 
                        value={scheduleDoctor} 
                        onChange={(e) => setScheduleDoctor(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem', backgroundColor: 'white', minWidth: '220px' }}
                      >
                        {filteredScheduleDoctors.map(d => (
                          <option key={d._id} value={d.doctorName.en}>{d.doctorName.en}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Grid Container for Monthly Calendar and Daily Slot details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '20px' }} className="schedule-layout-grid">
                    
                    {/* Left Column: Monthly Calendar View */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Monthly Occupancy Calendar</h4>
                        <input 
                          type="month" 
                          value={calendarMonth} 
                          onChange={(e) => setCalendarMonth(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '0.88rem' }}
                        />
                      </div>

                      {calendarLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px', border: '1px solid var(--border-muted)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
                          <Loader2 size={24} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                        </div>
                      ) : !scheduleDoctor ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-muted)', borderRadius: '12px', fontSize: '0.88rem' }}>
                          Select a specialist doctor to visualize monthly calendar.
                        </div>
                      ) : (
                        <div style={{
                          border: '1px solid var(--border-muted)',
                          borderRadius: '12px',
                          padding: '16px',
                          background: 'var(--bg-primary)'
                        }}>
                          {(() => {
                            const [year, monthNum] = calendarMonth.split('-').map(Number);
                            const firstDayIndex = new Date(year, monthNum - 1, 1).getDay();
                            const totalDays = new Date(year, monthNum, 0).getDate();
                            
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const cells = [];
                            for (let i = 0; i < firstDayIndex; i++) cells.push(null);
                            for (let d = 1; d <= totalDays; d++) cells.push(d);

                            return (
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                  {dayNames.map(d => <div key={d}>{d}</div>)}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                                  {cells.map((day, idx) => {
                                    if (day === null) return <div key={`empty-${idx}`} />;
                                    
                                    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayStatus = calendarMap[dateStr] || { status: 'Available', label: 'Available' };
                                    
                                    let cellBg = '#f0fdf4';
                                    let cellBorder = '1px solid #bbf7d0';
                                    let cellColor = '#166534';

                                    if (dayStatus.status === 'Past') {
                                      cellBg = '#f1f5f9';
                                      cellBorder = '1px solid #cbd5e1';
                                      cellColor = '#64748b';
                                    } else if (dayStatus.status === 'OnLeave') {
                                      cellBg = '#fff7ed';
                                      cellBorder = '1px solid #fed7aa';
                                      cellColor = '#c2410c';
                                    } else if (dayStatus.status === 'FullyBooked') {
                                      cellBg = '#fef2f2';
                                      cellBorder = '1px solid #fecaca';
                                      cellColor = '#991b1b';
                                    } else if (dayStatus.status === 'Booked') {
                                      cellBg = '#eff6ff';
                                      cellBorder = '1px solid #bfdbfe';
                                      cellColor = '#1d4ed8';
                                    }

                                    const isSelected = scheduleDate === dateStr;

                                    return (
                                      <button
                                        key={`day-${day}`}
                                        type="button"
                                        disabled={dayStatus.status === 'Past'}
                                        onClick={() => setScheduleDate(dateStr)}
                                        style={{
                                          aspectRatio: '1',
                                          borderRadius: '8px',
                                          border: isSelected ? '2px solid var(--med-blue)' : cellBorder,
                                          background: cellBg,
                                          color: cellColor,
                                          fontWeight: isSelected ? 800 : 600,
                                          fontSize: '0.85rem',
                                          cursor: dayStatus.status === 'Past' ? 'not-allowed' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          position: 'relative',
                                          transition: 'all 0.15s ease',
                                          opacity: dayStatus.status === 'Past' ? 0.65 : 1
                                        }}
                                        title={`${dayStatus.label}${dayStatus.reason ? ' - ' + dayStatus.reason : ''}`}
                                      >
                                        <span>{day}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', borderTop: '1px solid var(--border-muted)', paddingTop: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#bbf7d0', border: '1px solid #166534' }} />
                                    <span>Available</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#bfdbfe', border: '1px solid #1d4ed8' }} />
                                    <span>Booked</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fecaca', border: '1px solid #991b1b' }} />
                                    <span>Fully Booked</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fed7aa', border: '1px solid #c2410c' }} />
                                    <span>On Leave</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', border: '1px solid #64748b' }} />
                                    <span>Past</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Daily Slots Schedule Monitor list details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                        Slot Details for {formatISTDate(scheduleDate)}
                      </h4>

                      {scheduleSlotsLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                          <Loader2 size={24} className="spin-animation" style={{ color: 'var(--med-blue)', marginRight: '8px' }} />
                          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Loading slots...</span>
                        </div>
                      ) : scheduleOnLeave && scheduleLeaveDetails ? (
                        <div style={{
                          background: '#fff7ed',
                          border: '1px solid #ffedd5',
                          borderRadius: '12px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px',
                          textAlign: 'center',
                          color: '#c2410c'
                        }}>
                          <AlertTriangle size={32} />
                          <div>
                            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>
                              Doctor On Leave
                            </strong>
                            <span style={{ fontSize: '0.85rem', color: '#9a3412' }}>
                              Dr. {scheduleDoctor} is on leave ({scheduleLeaveDetails.leaveType}) from {formatISTDate(scheduleLeaveDetails.startDate)} to {formatISTDate(scheduleLeaveDetails.endDate)}.
                            </span>
                            {scheduleLeaveDetails.reason && (
                              <p style={{ fontStyle: 'italic', fontSize: '0.82rem', marginTop: '8px', background: '#ffebd5', padding: '6px 10px', borderRadius: '6px' }}>
                                Reason: {scheduleLeaveDetails.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : !scheduleDoctor ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-muted)', borderRadius: '12px', fontSize: '0.88rem' }}>
                          No specialist doctor selected.
                        </div>
                      ) : scheduleSlotsList.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-muted)', borderRadius: '12px', fontSize: '0.88rem' }}>
                          No slots available for this date.
                        </div>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                          gap: '10px'
                        }}>
                          {scheduleSlotsList.map(item => {
                            let statusBg = 'white';
                            let statusColor = '#0f172a';
                            let statusBorder = '1px solid var(--border-muted)';
                            let statusLabel = 'Available';

                            if (item.status === 'Booked') {
                              statusColor = '#ef4444';
                              statusBg = '#fef2f2';
                              statusBorder = '1px solid #fca5a5';
                              statusLabel = 'Booked';
                            } else if (item.status === 'Past') {
                              statusColor = '#475569';
                              statusBg = '#f1f5f9';
                              statusBorder = '1px solid #cbd5e1';
                              statusLabel = 'Unavailable';
                            } else if (item.status === 'Unavailable') {
                              statusColor = '#d97706';
                              statusBg = '#fff7ed';
                              statusBorder = '1px solid #fed7aa';
                              statusLabel = 'On Leave';
                            }

                            return (
                              <div key={item.slot} style={{
                                padding: '10px 8px',
                                borderRadius: '8px',
                                background: statusBg,
                                border: statusBorder,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.slot}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: statusColor, textTransform: 'uppercase' }}>{statusLabel}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'doctors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Hospital Doctors List</h3>
                    <button onClick={handleOpenAddDoctor} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      <span>Add New Doctor</span>
                    </button>
                  </div>

                  {/* Grid of Doctor Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                  }}>
                    {doctors.map(doc => (
                      <div key={doc._id} className="glass-panel" style={{
                        padding: '20px',
                        background: 'white',
                        border: '1px solid var(--border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}>
                        {/* Header Action Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-muted)', paddingBottom: '10px' }}>
                          <span className={`status-pill ${doc.available ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>
                            {doc.available ? 'Active' : 'Inactive'}
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenEditDoctor(doc)} className="action-icon-btn edit" title="Edit Doctor" style={{ width: '28px', height: '28px', borderRadius: '6px' }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDeleteDoctor(doc._id)} className="action-icon-btn delete" title="Delete Doctor" style={{ width: '28px', height: '28px', borderRadius: '6px' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Profile Section */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                          <img 
                            src={doc.image} 
                            alt={doc.doctorName.en} 
                            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px', background: 'var(--bg-primary)' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: 0, fontWeight: 800 }}>{doc.doctorName.en}</h4>
                            <div style={{ fontSize: '0.85rem', color: 'var(--med-blue)', fontWeight: 600, marginTop: '2px' }}>{doc.specialization.en}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Dept: {doc.department}</div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '12px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div><strong>Qualification:</strong> {doc.qualification.en}</div>
                          <div><strong>Experience:</strong> {doc.experience.en}</div>
                        </div>

                        {/* Leave Status Summary & Manage Leave Button */}
                        {(() => {
                          const todayStr = getISTDateString();
                          let leaveStatusText = 'Current Status: Available';
                          let leavePeriodText = '';
                          let leaveReasonText = '';
                          let activeLeave = null;

                          if (doc.leaveSchedule && doc.leaveSchedule.length > 0) {
                            activeLeave = doc.leaveSchedule.find((l: any) => {
                              if (l.status !== 'Active') return false;
                              const startStr = getISTDateString(new Date(l.startDate));
                              const endStr = getISTDateString(new Date(l.endDate));
                              return todayStr >= startStr && todayStr <= endStr;
                            });
                            
                            if (activeLeave) {
                              const startFormatted = formatISTDate(new Date(activeLeave.startDate));
                              const endFormatted = formatISTDate(new Date(activeLeave.endDate));
                              leaveStatusText = `Unavailable Until ${endFormatted}`;
                              leavePeriodText = `Leave Period: ${startFormatted} - ${endFormatted}`;
                              leaveReasonText = `Reason: ${activeLeave.reason || 'Not specified'}`;
                            }
                          }

                          return (
                            <div style={{ borderTop: '1px solid var(--border-muted)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: activeLeave ? '#d97706' : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeLeave ? '#d97706' : '#166534' }} />
                                <span>{leaveStatusText}</span>
                              </div>
                              {activeLeave && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#fff7ed', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                                  <div>{leavePeriodText}</div>
                                  <div style={{ fontStyle: 'italic', marginTop: '2px' }}>{leaveReasonText}</div>
                                </div>
                              )}
                              <button 
                                onClick={() => navigate(`/admin/doctors/${doc._id}/leave`)}
                                className="btn btn-secondary" 
                                style={{ width: '100%', fontSize: '0.8rem', padding: '6px', height: '34px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '6px' }}
                              >
                                <Calendar size={14} />
                                <span>Manage Leave</span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* Toggle Switch Availability */}
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Available for Bookings:</span>
                          <button 
                            disabled={togglingDoctorId === doc._id}
                            onClick={() => handleToggleDoctorAvailability(doc._id)}
                            className={`toggle-switch-btn ${doc.available ? 'on' : 'off'}`}
                            style={{ 
                              opacity: togglingDoctorId === doc._id ? 0.8 : 1,
                              cursor: togglingDoctorId === doc._id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <div className="toggle-knob" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {togglingDoctorId === doc._id && (
                                <Loader2 size={10} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Hospital Departments</h3>
                    <button onClick={handleOpenAddDept} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      <span>Add Department</span>
                    </button>
                  </div>

                  {/* Departments Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    {departments.map(dept => (
                      <div key={dept._id} className="glass-panel" style={{
                        padding: '20px',
                        background: 'white',
                        border: '1px solid var(--border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '200px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {dept.image && (
                                <img 
                                  src={dept.image} 
                                  alt={dept.departmentName.en} 
                                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-muted)' }}
                                />
                              )}
                              <div style={{ background: 'rgba(2, 132, 199, 0.08)', color: 'var(--med-blue)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={dept.icon}>
                                {(() => {
                                  const IconComponent = getDeptIcon(dept.icon);
                                  return <IconComponent size={20} />;
                                })()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleOpenEditDept(dept)} className="action-icon-btn edit" title="Edit Department">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDeleteDept(dept._id)} className="action-icon-btn delete" title="Delete Department">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <h4 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 700 }}>{dept.departmentName.en}</h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {dept.description?.en || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'news' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>News & Updates Posts</h3>
                    <button onClick={handleOpenAddNews} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      <span>Add News Post</span>
                    </button>
                  </div>

                  {/* News Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '24px'
                  }}>
                    {news.map(post => (
                      <div key={post._id} className="glass-panel" style={{
                        padding: '20px',
                        background: 'white',
                        border: '1px solid var(--border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: 10 }}>
                          <button onClick={() => handleOpenEditNews(post)} className="action-icon-btn edit" title="Edit News">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteNews(post._id)} className="action-icon-btn delete" title="Delete News">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div style={{ height: '160px', overflow: 'hidden', borderRadius: '10px', marginBottom: '14px', background: 'var(--bg-primary)' }}>
                          <img src={post.image} alt={post.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--med-blue)', marginBottom: '6px', display: 'block' }}>
                          {formatISTDate(post.date)}
                        </span>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 700 }}>{post.title.en}</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.description.en}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Hospital Media Gallery</h3>
                    <button onClick={handleOpenAddGallery} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      <span>Upload Image</span>
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '20px'
                  }}>
                    {gallery.map(item => (
                      <div key={item._id} className="glass-panel" style={{
                        padding: '12px',
                        background: 'white',
                        border: '1px solid var(--border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}>
                        {/* Action Overlay */}
                        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleOpenEditGallery(item)} 
                            style={{ background: 'rgba(2, 132, 199, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGallery(item._id)} 
                            style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ height: '140px', overflow: 'hidden', borderRadius: '8px', marginBottom: '8px', background: '#f1f5f9' }}>
                          <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
                          {item.title}
                        </div>
                        <span style={{ alignSelf: 'flex-start', fontSize: '0.7rem', fontWeight: 800, background: 'var(--med-blue-light)', color: 'var(--med-blue)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', textTransform: 'uppercase' }}>
                          {item.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Patient Testimonials</h3>
                    <button onClick={handleOpenAddTestimonial} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      <span>Add Testimonial</span>
                    </button>
                  </div>

                  {/* Testimonials List */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '24px'
                  }}>
                    {testimonials.map(item => (
                      <div key={item._id} className="glass-panel" style={{
                        padding: '20px',
                        background: 'white',
                        border: '1px solid var(--border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleOpenEditTestimonial(item)} className="action-icon-btn edit" title="Edit Testimonial">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteTestimonial(item._id)} className="action-icon-btn delete" title="Delete Testimonial">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '10px' }}>
                          {[...Array(item.rating)].map((_, i) => (
                            <Star key={i} size={16} fill="#fbbf24" stroke="none" />
                          ))}
                        </div>

                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '14px', flexGrow: 1 }}>
                          "{item.feedback}"
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={item.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} alt={item.patientName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.patientName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'enquiries' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Patient Contact Enquiries</h3>

              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-muted)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    {contacts.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No enquiries received yet.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-muted)' }}>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Mobile</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Message</th>
                            <th style={{ padding: '12px' }}>Submitted At</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map(c => (
                            <tr key={c._id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                              <td style={{ padding: '12px', fontWeight: 700 }}>{c.name}</td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{c.mobile}</td>
                              <td style={{ padding: '12px' }}>{c.email || '-'}</td>
                              <td style={{ padding: '12px', maxWidth: '300px', wordBreak: 'break-word' }}>{c.message}</td>
                              <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatISTDate(c.createdAt, true)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button 
                                  onClick={() => handleDeleteEnquiry(c._id)}
                                  disabled={deleteLoading}
                                  title="Delete Enquiry"
                                  className="action-icon-btn delete"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Dynamic Hospital Statistics</h3>

              {fetchingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-muted)' }}>
                  <form onSubmit={handleSaveStats} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Beds Setup</label>
                      <input 
                        type="number" 
                        required
                        value={statsForm.beds}
                        onChange={e => setStatsForm({ ...statsForm, beds: parseInt(e.target.value) || 0 })}
                        style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Specialists & Doctors</label>
                      <input 
                        type="number" 
                        required
                        value={statsForm.doctors}
                        onChange={e => setStatsForm({ ...statsForm, doctors: parseInt(e.target.value) || 0 })}
                        style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Campus Area Description</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 7 Lakh+ Sq.Ft."
                        value={statsForm.campusArea}
                        onChange={e => setStatsForm({ ...statsForm, campusArea: e.target.value })}
                        style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Trauma / Emergency Status</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Active or Inactive"
                        value={statsForm.emergencyStatus}
                        onChange={e => setStatsForm({ ...statsForm, emergencyStatus: e.target.value })}
                        style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      {loading && <Loader2 size={16} className="spin-animation" />}
                      <span>Save Dynamic Stats Settings</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <AdminEmployees />
          )}

          {activeTab === 'attendance' && (
            <AdminAttendance />
          )}

          {activeTab === 'compounders' && (
            <AdminCompounders />
          )}

          {activeTab === 'patients' && (
            <AdminPatients />
          )}

          {activeTab === 'billing' && (
            <AdminBilling />
          )}
        </main>
      </div>

      {/* Doctor Create/Edit Modal */}
      {isDoctorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-blue" style={{ maxWidth: '650px', background: 'white' }}>
            <div style={{ background: 'var(--gradient-primary)', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>{editingDoctorId ? 'Edit Doctor Record' : 'Add New Doctor'}</h3>
              <button onClick={() => setIsDoctorModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveDoctor} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              {/* Doctor Name (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Doctor Name (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={doctorForm.doctorNameEn}
                    onChange={e => setDoctorForm({ ...doctorForm, doctorNameEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Doctor Name (Marathi)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. डॉ. सारा जेन्किन्स"
                    value={doctorForm.doctorNameMr}
                    onChange={e => setDoctorForm({ ...doctorForm, doctorNameMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Specialization (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Specialization (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cardiologist"
                    value={doctorForm.specializationEn}
                    onChange={e => setDoctorForm({ ...doctorForm, specializationEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Specialization (Marathi)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. हृदयरोग तज्ज्ञ"
                    value={doctorForm.specializationMr}
                    onChange={e => setDoctorForm({ ...doctorForm, specializationMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Qualification (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Qualification (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. MD, DM (Cardiology)"
                    value={doctorForm.qualificationEn}
                    onChange={e => setDoctorForm({ ...doctorForm, qualificationEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Qualification (Marathi)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. एम.डी., डी.एम."
                    value={doctorForm.qualificationMr}
                    onChange={e => setDoctorForm({ ...doctorForm, qualificationMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Experience (EN & MR) & Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Experience (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 14 Years"
                    value={doctorForm.experienceEn}
                    onChange={e => setDoctorForm({ ...doctorForm, experienceEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Experience (Marathi)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. १४ वर्षे"
                    value={doctorForm.experienceMr}
                    onChange={e => setDoctorForm({ ...doctorForm, experienceMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Department</label>
                <select 
                  value={doctorForm.department}
                  onChange={e => setDoctorForm({ ...doctorForm, department: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  {departments.map(d => (
                    <option key={d._id} value={d.departmentName.en}>{d.departmentName.en}</option>
                  ))}
                </select>
              </div>

              {/* Image Upload File Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Doctor Profile Image</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {doctorImagePreview ? (
                    <img 
                      src={doctorImagePreview} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-muted)' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleDoctorImageChange}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading && <Loader2 size={16} className="spin-animation" />}
                <span>{editingDoctorId ? 'Save Updates' : 'Create Record'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Department Create/Edit Modal */}
      {isDeptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-blue" style={{ maxWidth: '600px', background: 'white' }}>
            <div style={{ background: 'var(--gradient-primary)', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>{editingDeptId ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setIsDeptModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDept} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Department Name (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Department Name (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cardiology"
                    value={deptForm.departmentNameEn}
                    onChange={e => setDeptForm({ ...deptForm, departmentNameEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Department Name (Marathi)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. कार्डिओलॉजी"
                    value={deptForm.departmentNameMr}
                    onChange={e => setDeptForm({ ...deptForm, departmentNameMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Icon Identifier */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Icon Identifier</label>
                <select 
                  value={deptForm.icon}
                  onChange={e => setDeptForm({ ...deptForm, icon: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="Activity">Activity (General Medicine)</option>
                  <option value="Baby">Baby (Pediatrics)</option>
                  <option value="Bone">Bone (Orthopedics)</option>
                  <option value="Brain">Brain (Neurology)</option>
                  <option value="Camera">Camera (Radiology / Imaging)</option>
                  <option value="Droplet">Droplet (Hematology / Blood Bank)</option>
                  <option value="Ear">Ear (ENT / Otolaryngology)</option>
                  <option value="Eye">Eye (Ophthalmology)</option>
                  <option value="FlaskConical">FlaskConical (Pathology / Laboratory)</option>
                  <option value="Heart">Heart (Cardiology)</option>
                  <option value="HeartPulse">HeartPulse (Emergency & ICU)</option>
                  <option value="Scissors">Scissors (Surgery)</option>
                  <option value="Shield">Shield (Preventative Medicine)</option>
                  <option value="Sparkles">Sparkles (Dermatology / Cosmetology)</option>
                  <option value="Stethoscope">Stethoscope (General OPD / Consultant)</option>
                  <option value="Syringe">Syringe (Anaesthesia / Vaccination)</option>
                </select>
              </div>

              {/* Description (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description (English)</label>
                  <textarea 
                    rows={3}
                    placeholder="Brief description of department..."
                    value={deptForm.descriptionEn}
                    onChange={e => setDeptForm({ ...deptForm, descriptionEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description (Marathi)</label>
                  <textarea 
                    rows={3}
                    placeholder="उदा. सर्वसमावेशक हृदय आरोग्य..."
                    value={deptForm.descriptionMr}
                    onChange={e => setDeptForm({ ...deptForm, descriptionMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', resize: 'none' }}
                  />
                </div>
              </div>

              {/* Image Upload File Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Department Cover Image</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {deptImagePreview ? (
                    <img 
                      src={deptImagePreview} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-muted)' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleDeptImageChange}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading && <Loader2 size={16} className="spin-animation" />}
                <span>{editingDeptId ? 'Save Changes' : 'Add Department'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* News Create/Edit Modal */}
      {isNewsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-blue" style={{ maxWidth: '600px', background: 'white' }}>
            <div style={{ background: 'var(--gradient-primary)', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>{editingNewsId ? 'Edit News Post' : 'Add News Announcement'}</h3>
              <button onClick={() => setIsNewsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNews} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Title (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. New Equipment Launch"
                    value={newsForm.titleEn}
                    onChange={e => setNewsForm({ ...newsForm, titleEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Title (Marathi)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. नवीन उपकरणे लॉंच"
                    value={newsForm.titleMr}
                    onChange={e => setNewsForm({ ...newsForm, titleMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Description (EN & MR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description (English)</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="English content..."
                    value={newsForm.descriptionEn}
                    onChange={e => setNewsForm({ ...newsForm, descriptionEn: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description (Marathi)</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="मराठी मजकूर..."
                    value={newsForm.descriptionMr}
                    onChange={e => setNewsForm({ ...newsForm, descriptionMr: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', resize: 'none' }}
                  />
                </div>
              </div>

              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Post Date</label>
                <input 
                  type="date"
                  required
                  value={newsForm.date}
                  onChange={e => setNewsForm({ ...newsForm, date: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>

              {/* Image Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>News Cover Image</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {newsImagePreview ? (
                    <img 
                      src={newsImagePreview} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-muted)' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleNewsImageChange}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading && <Loader2 size={16} className="spin-animation" />}
                <span>{editingNewsId ? 'Save News Updates' : 'Publish Announcement'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Testimonial Create/Edit Modal */}
      {isTestimonialModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-blue" style={{ maxWidth: '600px', background: 'white' }}>
            <div style={{ background: 'var(--gradient-primary)', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>{editingTestimonialId ? 'Edit Testimonial' : 'Add Patient Feedback'}</h3>
              <button onClick={() => setIsTestimonialModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Patient Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Yogesh Udesing Girase"
                  value={testimonialForm.patientName}
                  onChange={e => setTestimonialForm({ ...testimonialForm, patientName: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rating Score (1-5 Stars)</label>
                <select 
                  value={testimonialForm.rating}
                  onChange={e => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) || 5 })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Feedback Comment</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="How was the patient's experience?"
                  value={testimonialForm.feedback}
                  onChange={e => setTestimonialForm({ ...testimonialForm, feedback: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', resize: 'none' }}
                />
              </div>

              {/* Patient Image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Patient Profile Image (Optional)</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {testimonialImagePreview ? (
                    <img 
                      src={testimonialImagePreview} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-muted)' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleTestimonialImageChange}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading && <Loader2 size={16} className="spin-animation" />}
                <span>{editingTestimonialId ? 'Save Testimonial' : 'Publish Testimonial'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Image Upload Modal */}
      {isGalleryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-blue" style={{ maxWidth: '500px', background: 'white' }}>
            <div style={{ background: 'var(--gradient-primary)', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>{editingGalleryId ? 'Edit Gallery Image Details' : 'Upload Image to Gallery'}</h3>
              <button onClick={() => setIsGalleryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGallery} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Image Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Modern CT Scanner Room"
                  value={galleryForm.title}
                  onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                <select 
                  value={galleryForm.category}
                  onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Events">Events</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Facilities">Facilities</option>
                </select>
              </div>

              {/* Image Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Image File {editingGalleryId && '(Optional)'}</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {galleryImagePreview ? (
                    <img 
                      src={galleryImagePreview} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-muted)' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    required={!editingGalleryId}
                    onChange={handleGalleryImageChange}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading && <Loader2 size={16} className="spin-animation" />}
                <span>{editingGalleryId ? 'Save Changes' : 'Add to Gallery'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Popup Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: '420px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                border: '1px solid var(--border-muted)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <AlertTriangle size={20} color="white" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
                  {deleteConfirm.title}
                </h3>
              </div>
              
              {/* Message */}
              <div style={{ padding: '24px', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {deleteConfirm.message}
              </div>
              
              {/* Actions Footer */}
              <div style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#f8fafc',
                borderTop: '1px solid var(--border-muted)'
              }}>
                <button
                  onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                  disabled={deleteLoading}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteConfirm.onConfirm}
                  disabled={deleteLoading}
                  className="btn btn-primary delete-confirm-btn"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    background: '#ef4444',
                    borderColor: '#ef4444',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {deleteLoading && <Loader2 size={16} className="spin-animation" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dashboard Styling Override */}
      <style>{`
        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
        }
        .sidebar-nav-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .sidebar-nav-btn.active {
          background: var(--gradient-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
        }
        .action-icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid var(--border-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          background: white;
        }
        .action-icon-btn.confirm { color: #0d9488; border-color: rgba(13, 148, 136, 0.15); background: #f0fdfa; }
        .action-icon-btn.confirm:hover { background: #0d9488; color: white; }
        .action-icon-btn.print { color: #0284c7; border-color: rgba(2, 132, 199, 0.15); background: #f0f9ff; }
        .action-icon-btn.print:hover { background: #0284c7; color: white; }
        .action-icon-btn.complete { color: #2563eb; border-color: rgba(37, 99, 235, 0.15); background: #eff6ff; }
        .action-icon-btn.complete:hover { background: #2563eb; color: white; }
        .action-icon-btn.cancel { color: #ea580c; border-color: rgba(234, 88, 12, 0.15); background: #fff7ed; }
        .action-icon-btn.cancel:hover { background: #ea580c; color: white; }
        .action-icon-btn.delete { color: #dc2626; border-color: rgba(220, 38, 38, 0.15); background: #fef2f2; }
        .action-icon-btn.delete:hover { background: #dc2626; color: white; }
        .action-icon-btn.edit { color: #4b5563; border-color: var(--border-muted); }
        .action-icon-btn.edit:hover { background: var(--primary); color: white; }
        
        .status-pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-pill.pending { background: #fef3c7; color: #b45309; }
        .status-pill.confirmed { background: #ccfbf1; color: #0f766e; }
        .status-pill.completed { background: #dbeafe; color: #1d4ed8; }
        .status-pill.cancelled { background: #fee2e2; color: #b91c1c; }

        .toggle-switch-btn {
          width: 44px;
          height: 24px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 2px;
          transition: background-color var(--transition-fast);
        }
        .toggle-switch-btn.on { background-color: #0d9488; }
        .toggle-switch-btn.off { background-color: #cbd5e1; }
        .toggle-knob {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform var(--transition-fast);
        }
        .toggle-switch-btn.on .toggle-knob { transform: translateX(20px); }
        .toggle-switch-btn.off .toggle-knob { transform: translateX(0px); }

        .hover-red-btn:hover {
          background: #ef4444 !important;
          color: white !important;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            position: absolute !important;
            height: calc(100vh - 64px);
            top: 64px;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
