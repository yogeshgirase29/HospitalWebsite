import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Phone, Mail, FileText, CheckCircle2, Download, Search, Lock, AlertCircle, Printer, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { type Language, translations } from '../utils/translations';
import { doctorsApi, departmentsApi, appointmentsApi } from '../services/api';
import { getISTDateString, formatISTDate } from '../utils/dateUtils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface AppointmentFormInput {
  title: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  mobile: string;
  email?: string;
  department: string;
  doctor: string;
  appointmentDate: string;
  appointmentSlot: string;
  message?: string;
}

const localT = {
  en: {
    title: "Patient Title *",
    selectTitle: "Select Title",
    firstName: "First Name *",
    middleName: "Middle Name",
    lastName: "Last Name *",
    dob: "Date of Birth *",
    age: "Age",
    mobile: "Mobile Number *",
    email: "Email Address (Optional)",
    department: "Service Department *",
    doctor: "Preferred Specialist *",
    date: "Preferred Date *",
    slot: "Preferred Time Slot *",
    symptoms: "Symptoms / Special Instructions (Optional)",
    symptomsPlaceholder: "Describe your symptoms or special requirements.",
    downloadPdf: "Download PDF",
    close: "Close",
    slotBooked: "Booked",
    slotPast: "Unavailable"
  },
  mr: {
    title: "रुग्णाचे शीर्षक *",
    selectTitle: "शीर्षक निवडा",
    firstName: "पहिले नाव *",
    middleName: "मधले नाव",
    lastName: "आडनाव *",
    dob: "जन्मतारीख *",
    age: "वय",
    mobile: "मोबाईल नंबर *",
    email: "ईमेल पत्ता (पर्यायी)",
    department: "वैद्यकीय विभाग *",
    doctor: "पसंतीचे डॉक्टर *",
    date: "पसंतीची तारीख *",
    slot: "पसंतीची वेळ स्लॉट *",
    symptoms: "लक्षणे / विशेष सूचना (पर्यायी)",
    symptomsPlaceholder: "तुमची लक्षणे किंवा विशेष आवश्यकतांचे वर्णन करा.",
    downloadPdf: "पीडीएफ डाउनलोड करा",
    close: "बंद करा",
    slotBooked: "आरक्षित",
    slotPast: "अनुपलब्ध"
  }
};

const calculateAge = (dobVal: string) => {
  if (!dobVal) return 0;
  const todayIST = getISTDateString();
  const [todayYear, todayMonth, todayDay] = todayIST.split('-').map(Number);
  const [birthYear, birthMonth, birthDay] = dobVal.split('-').map(Number);
  
  let computedAge = todayYear - birthYear;
  const m = todayMonth - birthMonth;
  if (m < 0 || (m === 0 && todayDay < birthDay)) {
    computedAge--;
  }
  return computedAge;
};

export const AppointmentModal: React.FC<ModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];
  const lt = localT[language];

  const { register, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm<AppointmentFormInput>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      mobile: '',
      email: '',
      department: 'General Medicine',
      doctor: '',
      appointmentDate: '',
      appointmentSlot: '',
      message: ''
    }
  });

  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbDoctors, setDbDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [slotsList, setSlotsList] = useState<{ slot: string; status: 'Available' | 'Booked' | 'Past'; selectable: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [ageWarning, setAgeWarning] = useState('');
  const [leaveMessage, setLeaveMessage] = useState('');

  const watchDoctor = watch('doctor');
  const watchDate = watch('appointmentDate');
  const watchTitle = watch('title');
  const watchDOB = watch('dateOfBirth');

  // Load departments and doctors
  useEffect(() => {
    if (isOpen) {
      const loadFields = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
          const [deptRes, docRes] = await Promise.all([
            departmentsApi.getAll(),
            doctorsApi.getAll(true) // Available only
          ]);

          if (deptRes.success && deptRes.departments.length > 0) {
            setDbDepartments(deptRes.departments);
            const initialDept = deptRes.departments[0].departmentName.en;

            if (docRes.success && docRes.doctors.length > 0) {
              setDbDoctors(docRes.doctors);
              const matchedDoc = docRes.doctors.find((d: any) => d.department.toLowerCase() === initialDept.toLowerCase());
              const selectedDoc = matchedDoc ? matchedDoc.doctorName.en : docRes.doctors[0].doctorName.en;

              reset({
                title: '',
                firstName: '',
                middleName: '',
                lastName: '',
                dateOfBirth: '',
                age: 0,
                mobile: '',
                email: '',
                department: initialDept,
                doctor: selectedDoc,
                appointmentDate: '',
                appointmentSlot: '',
                message: ''
              });
            } else {
              reset({
                title: '',
                firstName: '',
                middleName: '',
                lastName: '',
                dateOfBirth: '',
                age: 0,
                mobile: '',
                email: '',
                department: initialDept,
                doctor: '',
                appointmentDate: '',
                appointmentSlot: '',
                message: ''
              });
            }
          }
        } catch (err) {
          console.error('Failed to load form parameters:', err);
          setErrorMsg(language === 'en' ? 'Failed to connect to clinic server.' : 'वैद्यकीय सर्व्हरशी कनेक्ट करण्यात अयशस्वी.');
        } finally {
          setLoading(false);
        }
      };
      loadFields();
    }
  }, [isOpen, language, reset]);

  // Reset form status when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitted(false);
      setSuccessData(null);
      setErrorMsg('');
      setSlotsList([]);
      setAgeWarning('');
      setLeaveMessage('');
    }
  }, [isOpen]);

  // Load slots when doctor or date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!watchDate || !watchDoctor || dbDoctors.length === 0) {
        setSlotsList([]);
        return;
      }

      setSlotsLoading(true);
      try {
        const doc = dbDoctors.find((d: any) => d.doctorName.en.toLowerCase() === watchDoctor.toLowerCase());
        if (doc) {
          const res = await appointmentsApi.getAvailableSlots(doc._id, watchDate);
          if (res.success) {
            if (res.onLeave) {
              setSlotsList([]);
              const formatSimpleDate = (dStr: string) => {
                const dateObj = new Date(dStr);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                return `${day}/${month}/${year}`;
              };
              const startFormatted = res.leaveDetails ? formatSimpleDate(res.leaveDetails.startDate) : '';
              const endFormatted = res.leaveDetails ? formatSimpleDate(res.leaveDetails.endDate) : '';
              const cleanDocNameEn = doc.doctorName.en.startsWith('Dr.') ? doc.doctorName.en : `Dr. ${doc.doctorName.en}`;
              const docNameLang = doc.doctorName[language] || doc.doctorName.en;
              const cleanDocNameLang = docNameLang.startsWith('Dr.') || docNameLang.startsWith('डॉ.')
                ? docNameLang
                : language === 'en'
                  ? `Dr. ${docNameLang}`
                  : `डॉ. ${docNameLang}`;

              setLeaveMessage(
                language === 'en'
                  ? `${cleanDocNameEn} is unavailable from ${startFormatted} to ${endFormatted}.`
                  : `${cleanDocNameLang} ${startFormatted} ते ${endFormatted} दरम्यान अनुपलब्ध आहेत.`
              );
            } else {
              setLeaveMessage('');
              if (res.slotsData) {
                setSlotsList(res.slotsData);
                const currentSlot = getValues('appointmentSlot');
                const foundSlot = res.slotsData.find((s: any) => s.slot === currentSlot);
                if (!foundSlot || !foundSlot.selectable) {
                  setValue('appointmentSlot', '', { shouldValidate: true });
                }
              } else {
                // Fallback
                const allSlots = [
                  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
                  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
                  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
                  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
                ];
              const activeSlots = res.slots || [];
              const reconstructed = allSlots.map(slot => {
                const isAvailable = activeSlots.includes(slot);
                return {
                  slot,
                  status: isAvailable ? ('Available' as const) : ('Booked' as const),
                  selectable: isAvailable
                };
              });
              setSlotsList(reconstructed);
              const currentSlot = getValues('appointmentSlot');
              if (!activeSlots.includes(currentSlot)) {
                setValue('appointmentSlot', '', { shouldValidate: true });
              }
            }
          }
        }
      }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [watchDate, watchDoctor, dbDoctors, setValue, getValues]);

  // Sync Age and title age recommendations warning
  useEffect(() => {
    if (!watchDOB || !watchTitle) {
      setAgeWarning('');
      return;
    }
    const computedAge = calculateAge(watchDOB);
    setValue('age', computedAge, { shouldValidate: true });

    let warning = '';
    if (watchTitle === 'Baby' && computedAge >= 5) {
      warning = language === 'en'
        ? "Title 'Baby' is typically recommended for children under 5 years."
        : "५ वर्षांखालील मुलांसाठी 'Baby' शीर्षक वापरणे शिफारसित आहे.";
    } else if (watchTitle === 'Master' && computedAge >= 18) {
      warning = language === 'en'
        ? "Title 'Master' is typically recommended for male children under 18 years."
        : "१८ वर्षांखालील मुलांसाठी 'Master' शीर्षक वापरणे शिफारसित आहे.";
    } else if (watchTitle === 'Mr.' && computedAge < 18) {
      warning = language === 'en'
        ? "Title 'Mr.' is recommended for male patients aged 18 years or above."
        : "१८ वर्षे किंवा त्यावरील पुरुषांसाठी 'Mr.' शीर्षक वापरणे शिफारसित आहे.";
    }
    setAgeWarning(warning);
  }, [watchTitle, watchDOB, language, setValue]);

  // Handle department change
  const handleDepartmentChange = (deptName: string) => {
    const matchedDoc = dbDoctors.find((d: any) => d.department.toLowerCase() === deptName.toLowerCase());
    setValue('department', deptName);
    setValue('doctor', matchedDoc ? matchedDoc.doctorName.en : (dbDoctors[0]?.doctorName.en || ''), { shouldValidate: true });
    setValue('appointmentSlot', '', { shouldValidate: true });
  };

  const onSubmit = async (data: AppointmentFormInput) => {
    setSubmitLoading(true);
    setErrorMsg('');

    try {
      const selectedDept = dbDepartments.find(
        (d: any) => d.departmentName.en.toLowerCase() === data.department.toLowerCase()
      );
      const selectedDoc = dbDoctors.find(
        (d: any) => d.doctorName.en.toLowerCase() === data.doctor.toLowerCase()
      );

      const payload = {
        title: data.title,
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        age: Number(data.age),
        mobile: data.mobile,
        email: data.email || undefined,
        department: data.department,
        departmentMr: selectedDept ? selectedDept.departmentName.mr : data.department,
        doctor: data.doctor,
        doctorMr: selectedDoc ? selectedDoc.doctorName.mr : data.doctor,
        appointmentDate: data.appointmentDate,
        appointmentSlot: data.appointmentSlot,
        message: data.message
      };

      const res = await appointmentsApi.create(payload);
      if (res.success) {
        setSuccessData(res.appointment);
        setIsSubmitted(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message ||
        (language === 'en' ? 'Failed to submit appointment. Check connection.' : 'अपॉइंटमेंट पाठवण्यात अयशस्वी. कनेक्शन तपासा.')
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    reset({
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      mobile: '',
      email: '',
      department: dbDepartments[0]?.departmentName.en || 'General Medicine',
      doctor: dbDoctors[0]?.doctorName.en || '',
      appointmentDate: '',
      appointmentSlot: '',
      message: ''
    });
    setIsSubmitted(false);
    setSuccessData(null);
    setErrorMsg('');
    setSlotsList([]);
    setAgeWarning('');
    setLeaveMessage('');
    onClose();
  };

  const watchDept = watch('department');
  const filteredDoctors = dbDoctors.filter(
    (doc: any) => doc.department.toLowerCase() === watchDept.toLowerCase()
  );
  const displayDoctors = filteredDoctors.length > 0 ? filteredDoctors : dbDoctors;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-content glass-panel-blue"
            style={{ padding: 0 }}
          >
            {/* Header */}
            <div style={{
              background: 'var(--gradient-primary)',
              padding: '24px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '1.4rem' }}>{t.modalAppTitle}</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '4px' }}>{t.modalAppSubtitle}</p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition-fast)'
                }}
                className="hover-bright"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                </div>
              ) : errorMsg && !submitLoading && !isSubmitted ? (
                <div style={{ padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <AlertCircle size={36} style={{ color: '#ef4444' }} />
                  <p style={{ fontWeight: 600 }}>{errorMsg}</p>
                  <button onClick={onClose} className="btn btn-secondary">{t.modalClose}</button>
                </div>
              ) : !isSubmitted ? (
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Title & Name Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: '12px' }} className="name-input-grid">
                    {/* Patient Title */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.title}</label>
                      <select
                        {...register('title', { required: "Title is required" })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.title ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                          fontSize: '0.95rem',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">{lt.selectTitle}</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Master">Master</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                        <option value="Baby">Baby</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* First Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.firstName}</label>
                      <input
                        type="text"
                        placeholder="Yogesh"
                        {...register('firstName', {
                          required: "First name is required",
                          minLength: { value: 2, message: "Min 2 chars" },
                          maxLength: { value: 50, message: "Max 50 chars" },
                          pattern: { value: /^[a-zA-Z\s]+$/, message: "Alphabets only" }
                        })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.firstName ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    {/* Middle Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.middleName}</label>
                      <input
                        type="text"
                        placeholder="Udesing"
                        {...register('middleName', {
                          maxLength: { value: 50, message: "Max 50 chars" },
                          pattern: { value: /^[a-zA-Z\s]*$/, message: "Alphabets only" }
                        })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.middleName ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    {/* Last Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.lastName}</label>
                      <input
                        type="text"
                        placeholder="Girase"
                        {...register('lastName', {
                          required: "Last name is required",
                          minLength: { value: 2, message: "Min 2 chars" },
                          maxLength: { value: 50, message: "Max 50 chars" },
                          pattern: { value: /^[a-zA-Z\s]+$/, message: "Alphabets only" }
                        })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.lastName ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Errors Row for Names */}
                  {(errors.title || errors.firstName || errors.middleName || errors.lastName) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                      {errors.title && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>• {errors.title.message}</span>}
                      {errors.firstName && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>• First Name: {errors.firstName.message}</span>}
                      {errors.middleName && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>• Middle Name: {errors.middleName.message}</span>}
                      {errors.lastName && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>• Last Name: {errors.lastName.message}</span>}
                    </div>
                  )}

                  {/* DOB & Age Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                    {/* DOB */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.dob}</label>
                      <input
                        type="date"
                        max={getISTDateString()}
                        {...register('dateOfBirth', {
                          required: "Date of birth is required",
                          validate: {
                            notInFuture: (val) => val <= getISTDateString() || "DOB cannot be in the future",
                            ageRange: (val) => {
                              const age = calculateAge(val);
                              return (age >= 0 && age <= 120) || "Age must be between 0 and 120 years";
                            }
                          }
                        })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.dateOfBirth ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                          fontSize: '0.95rem'
                        }}
                      />
                      {errors.dateOfBirth && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '2px' }}>{errors.dateOfBirth.message}</span>}
                    </div>

                    {/* Calculated Age */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.age}</label>
                      <input
                        type="number"
                        readOnly
                        {...register('age')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-muted)',
                          fontSize: '0.95rem',
                          backgroundColor: '#f8fafc',
                          textAlign: 'center',
                          color: 'var(--text-secondary)',
                          fontWeight: 700
                        }}
                      />
                    </div>
                  </div>

                  {/* Title Recommended Age Warnings */}
                  {ageWarning && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      color: '#d97706',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}>
                      <AlertCircle size={15} />
                      <span>{ageWarning}</span>
                    </div>
                  )}

                  {/* Contact Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.mobile}</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          {...register('mobile', {
                            required: "Mobile number is required",
                            pattern: { value: /^[6-9]\d{9}$/, message: "Must be a valid 10-digit Indian number" }
                          })}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 38px',
                            borderRadius: 'var(--radius-md)',
                            border: errors.mobile ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                      {errors.mobile && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '2px' }}>{errors.mobile.message}</span>}
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.email}</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="yogesh.girase@example.com"
                          {...register('email', {
                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email format" }
                          })}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 38px',
                            borderRadius: 'var(--radius-md)',
                            border: errors.email ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                      {errors.email && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '2px' }}>{errors.email.message}</span>}
                    </div>
                  </div>

                  {/* Service Department & Specialist */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.department}</label>
                      <select
                        value={watchDept}
                        onChange={e => handleDepartmentChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-muted)',
                          fontSize: '0.95rem',
                          backgroundColor: 'white'
                        }}
                      >
                        {dbDepartments.map(dept => (
                          <option key={dept._id} value={dept.departmentName.en}>
                            {dept.departmentName[language] || dept.departmentName.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.doctor}</label>
                      <select
                        {...register('doctor', { required: "Specialist is required" })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.doctor ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                          fontSize: '0.95rem',
                          backgroundColor: 'white'
                        }}
                      >
                        {displayDoctors.map(doc => (
                          <option key={doc._id} value={doc.doctorName.en}>
                            {doc.doctorName[language] || doc.doctorName.en} ({doc.specialization[language] || doc.specialization.en}) - {doc.qualification[language] || doc.qualification.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preferred Date & Available Slots */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Preferred Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.date}</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="date"
                          min={getISTDateString()}
                          max={getISTDateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))}
                          {...register('appointmentDate', {
                            required: "Date is required",
                            validate: {
                              notPast: (val) => val >= getISTDateString() || "Past dates are not allowed",
                              next90Days: (val) => {
                                const maxDateStr = getISTDateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
                                return val <= maxDateStr || "Booking allowed up to 90 days in advance";
                              }
                            }
                          })}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 38px',
                            borderRadius: 'var(--radius-md)',
                            border: errors.appointmentDate ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                      {errors.appointmentDate && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '2px' }}>{errors.appointmentDate.message}</span>}
                    </div>

                    {/* Slots Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.slot}</label>

                      {leaveMessage ? (
                        <div style={{
                          fontSize: '0.88rem',
                          color: '#ea580c',
                          fontWeight: 600,
                          padding: '12px',
                          border: '1px solid #ffedd5',
                          borderRadius: '8px',
                          textAlign: 'center',
                          background: '#fff7ed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <AlertCircle size={16} />
                          <span>{leaveMessage}</span>
                        </div>
                      ) : !watchDate ? (
                        <div style={{
                          fontSize: '0.88rem',
                          color: 'var(--text-muted)',
                          padding: '12px',
                          border: '1px dashed var(--border-muted)',
                          borderRadius: '8px',
                          textAlign: 'center',
                          background: 'rgba(0,0,0,0.02)'
                        }}>
                          {language === 'en' ? 'Please select an appointment date first.' : 'कृपया आधी अपॉइंटमेंटची तारीख निवडा.'}
                        </div>
                      ) : slotsLoading ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '16px',
                          border: '1px solid var(--border-muted)',
                          borderRadius: '8px',
                          background: 'white'
                        }}>
                          <Loader2 size={18} className="spin-animation" style={{ color: 'var(--med-blue)' }} />
                          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            {language === 'en' ? 'Fetching available slots...' : 'उपलब्ध वेळा शोधत आहे...'}
                          </span>
                        </div>
                      ) : slotsList.length === 0 ? (
                        <div style={{
                          fontSize: '0.88rem',
                          color: '#ef4444',
                          fontWeight: 600,
                          padding: '12px',
                          border: '1px solid #fee2e2',
                          borderRadius: '8px',
                          textAlign: 'center',
                          background: '#fef2f2'
                        }}>
                          {language === 'en' ? 'No slots available for this date. Please choose another date.' : 'या तारखेसाठी एकही वेळ उपलब्ध नाही. कृपया दुसरी तारीख निवडा.'}
                        </div>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                          gap: '8px',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          padding: '6px',
                          border: '1px solid var(--border-muted)',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.01)'
                        }} className="slots-scroll-grid">
                          {slotsList.map(item => {
                            const isSelected = watch('appointmentSlot') === item.slot;
                            let btnBg = 'white';
                            let btnBorder = '1px solid var(--border-muted)';
                            let btnColor = 'var(--text-secondary)';
                            let btnCursor = 'pointer';

                            if (isSelected) {
                              btnBg = '#15803d';
                              btnBorder = '1px solid #15803d';
                              btnColor = 'white';
                            } else if (item.status === 'Booked') {
                              btnBg = '#fef2f2';
                              btnBorder = '1px solid #fca5a5';
                              btnColor = '#991b1b';
                              btnCursor = 'not-allowed';
                            } else if (item.status === 'Past') {
                              btnBg = '#f8fafc';
                              btnBorder = '1px solid #e2e8f0';
                              btnColor = '#94a3b8';
                              btnCursor = 'not-allowed';
                            } else {
                              // Available Slot (Green Background standard)
                              btnBg = '#f0fdf4';
                              btnBorder = '1px solid #bbf7d0';
                              btnColor = '#166534';
                            }

                            return (
                              <button
                                key={item.slot}
                                type="button"
                                disabled={!item.selectable}
                                onClick={() => setValue('appointmentSlot', item.slot, { shouldValidate: true })}
                                style={{
                                  padding: '8px 4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: btnBorder,
                                  background: btnBg,
                                  color: btnColor,
                                  cursor: btnCursor,
                                  transition: 'all 0.15s ease',
                                  textAlign: 'center',
                                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                                }}
                              >
                                {item.slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <input type="hidden" {...register('appointmentSlot', { required: "Time slot is required" })} />
                      {errors.appointmentSlot && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '2px' }}>{errors.appointmentSlot.message}</span>}
                    </div>
                  </div>

                  {/* Message / Symptoms */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lt.symptoms}</label>
                    <textarea
                      rows={3}
                      placeholder={lt.symptomsPlaceholder}
                      {...register('message', {
                        maxLength: { value: 500, message: "Special instructions cannot exceed 500 characters" }
                      })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: errors.message ? '1px solid #ef4444' : '1px solid var(--border-muted)',
                        fontSize: '0.95rem',
                        resize: 'none'
                      }}
                    />
                    {errors.message && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '2px' }}>{errors.message.message}</span>}
                  </div>

                  {/* Error Prompt */}
                  {errorMsg && (
                    <div style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <AlertCircle size={14} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitLoading}
                    style={{ width: '100%', marginTop: '10px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    {submitLoading && <Loader2 size={16} className="spin-animation" />}
                    {t.modalAppSubmit}
                  </button>
                </form>
              ) : (
                /* Success Layout */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px 10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: 'var(--med-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{t.modalAppSuccess}</h4>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '380px' }}>
                    {language === 'en' ? (
                      <>
                        Thank you, <strong>{getValues('firstName')} {getValues('lastName')}</strong>. Your appointment has been booked for <strong>{formatISTDate(successData?.appointmentDate)}</strong> at <strong>{successData?.appointmentSlot}</strong> with <strong>{successData?.doctor}</strong>. {t.modalAppSuccessDesc}
                      </>
                    ) : (
                      <>
                        धन्यवाद, <strong>{getValues('firstName')} {getValues('lastName')}</strong>. आपली अपॉइंटमेंट <strong>{formatISTDate(successData?.appointmentDate)}</strong> रोजी <strong>{successData?.appointmentSlot}</strong> वाजता <strong>{successData?.doctor}</strong> यांच्यासोबत बुक झाली आहे. {t.modalAppSuccessDesc}
                      </>
                    )}
                  </p>

                  <div className="glass-panel" style={{
                    width: '100%',
                    padding: '16px',
                    background: 'rgba(2, 132, 199, 0.03)',
                    border: '1px dashed rgba(2, 132, 199, 0.2)',
                    textAlign: 'left',
                    marginBottom: '30px'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t.modalReceipt}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.9rem' }}>
                      <div><strong>{t.modalBookingRef}:</strong> <span style={{ color: 'var(--med-blue)', fontWeight: 700 }}>{successData?.appointmentId}</span></div>
                      <div><strong>{language === 'en' ? 'Dept' : 'विभाग'}:</strong> {successData?.departmentMr && language === 'mr' ? successData.departmentMr : successData?.department}</div>
                      <div><strong>{language === 'en' ? 'Phone' : 'फोन'}:</strong> {successData?.mobile}</div>
                      <div><strong>{t.modalStatus}:</strong> <span style={{ color: '#0d9488', fontWeight: 600 }}>{successData?.status || t.modalConfirmed}</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                    <button
                      onClick={handleReset}
                      className="btn btn-secondary"
                      style={{ width: '100px' }}
                    >
                      {lt.close}
                    </button>
                    <button
                      onClick={() => appointmentsApi.printPdf(successData?._id)}
                      className="btn btn-secondary"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '140px' }}
                    >
                      <Printer size={16} />
                      {language === 'en' ? 'Print Receipt' : 'पावती प्रिंट करा'}
                    </button>
                    <button
                      onClick={() => appointmentsApi.downloadPdf(successData._id, successData.appointmentId)}
                      className="btn btn-primary"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '160px' }}
                    >
                      <Download size={16} />
                      {lt.downloadPdf}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ReportModal: React.FC<ModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  const [reportCode, setReportCode] = useState('');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'success' | 'failed'>('idle');
  const [retrievedReport, setRetrievedReport] = useState<any>(null);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchStatus('idle');
      setReportCode('');
      setRetrievedReport(null);
    }
  }, [isOpen]);

  const getMetricName = (name: string, lang: Language) => {
    if (lang === 'en') return name;
    const dict: Record<string, string> = {
      'Hemoglobin': 'हिमोग्लोबिन',
      'Total Cholesterol': 'एकूण कोलेस्ट्रॉल',
      'Blood Glucose (Fasting)': 'रक्त शर्करा (उपाशी पोटी)',
      'Vitamin D (25-OH)': 'व्हिटॅमिन डी (25-OH)',
      'White Blood Cell Count': 'पांढऱ्या रक्त पेशींची संख्या',
      'Thyroid Stimulating Hormone (TSH)': 'थायरॉईड उत्तेजक संप्रेरक (TSH)',
      'Triglycerides': 'ट्रायग्लिसराईड्स',
      'Creatinine': 'क्रिएटिनिन'
    };
    return dict[name] || name;
  };

  const getMetricStatus = (status: string, lang: Language) => {
    if (lang === 'en') return status;
    const dict: Record<string, string> = {
      'Normal': 'सामान्य',
      'High border': 'उच्च सीमा',
      'Deficient': 'कमतरता'
    };
    return dict[status] || status;
  };

  const getSummaryTranslation = (summary: string, lang: Language) => {
    if (lang === 'en') return summary;
    if (summary.includes('All vital systems functional')) {
      return 'सर्व महत्वाची कार्ये सुरळीत आहेत. व्हिटॅमिन डी पातळी थोडी कमी आहे. कोलेस्ट्रॉल पातळी सीमेजवळ आहे.';
    }
    if (summary.includes('Excellent overall cardio-metabolic')) {
      return 'एकूण हृदय आणि चयापचय आरोग्य उत्कृष्ट आहे. शारीरिक कार्यक्षमता चांगली आहे. हायड्रेशन पातळी योग्य आहे.';
    }
    return summary;
  };

  const getTestTypeTranslation = (testType: string, lang: Language) => {
    if (lang === 'en') return testType;
    if (testType.includes('Comprehensive Blood Panel')) {
      return 'सर्वसमावेशक रक्त तपासणी आणि चयापचय चाचणी';
    }
    if (testType.includes('Executive Health')) {
      return 'कार्यकारी आरोग्य आणि तंदुरुस्ती चाचणी';
    }
    return testType;
  };

  const getTechnicianName = (techName: string, lang: Language) => {
    if (lang === 'en') return techName;
    if (techName.includes('Robert Chen')) {
      return 'डॉ. रॉबर्ट चेन, एमडी';
    }
    if (techName.includes('Emily Taylor')) {
      return 'डॉ. एमिली टेलर, पीएचडी';
    }
    return techName;
  };

  const mockReports: Record<string, any> = {
    'REP-2026': {
      code: 'REP-2026',
      patientName: language === 'en' ? 'Sarah Jenkins' : 'डॉ. सारा जेन्किन्स (Sarah Jenkins)',
      age: 34,
      gender: language === 'en' ? 'Female' : 'महिला',
      date: language === 'en' ? 'June 02, 2026' : '०२ जून, २०२६',
      testType: 'Comprehensive Blood Panel & Metabolic Test',
      labTechnician: 'Robert Chen, MD',
      status: language === 'en' ? 'Verified & Approved' : 'सत्यापित आणि मंजूर',
      summary: 'All vital systems functional. Slight low levels of Vitamin D. Cholesterol values are near boundary ranges.',
      metrics: [
        { name: 'Hemoglobin', value: 13.8, min: 12.0, max: 15.5, unit: 'g/dL', status: 'Normal' },
        { name: 'Total Cholesterol', value: 215, min: 100, max: 200, unit: 'mg/dL', status: 'High border' },
        { name: 'Blood Glucose (Fasting)', value: 88, min: 70, max: 100, unit: 'mg/dL', status: 'Normal' },
        { name: 'Vitamin D (25-OH)', value: 24, min: 30, max: 100, unit: 'ng/mL', status: 'Deficient' },
        { name: 'White Blood Cell Count', value: 6.4, min: 4.5, max: 11.0, unit: 'x10^3/µL', status: 'Normal' },
        { name: 'Thyroid Stimulating Hormone (TSH)', value: 2.1, min: 0.4, max: 4.0, unit: 'µIU/mL', status: 'Normal' }
      ]
    },
    'FIT-99': {
      code: 'FIT-99',
      patientName: language === 'en' ? 'Alex Mercer' : 'अॅलेक्स मर्सर (Alex Mercer)',
      age: 29,
      gender: language === 'en' ? 'Male' : 'पुरुष',
      date: language === 'en' ? 'May 28, 2026' : '२८ मे, २०२६',
      testType: 'Executive Health & Fitness Assay',
      labTechnician: 'Emily Taylor, PhD',
      status: language === 'en' ? 'Verified & Approved' : 'सत्यापित आणि मंजूर',
      summary: 'Excellent overall cardio-metabolic health. High physical performance values. Hydration index optimal.',
      metrics: [
        { name: 'Hemoglobin', value: 15.4, min: 13.5, max: 17.5, unit: 'g/dL', status: 'Normal' },
        { name: 'Total Cholesterol', value: 165, min: 100, max: 200, unit: 'mg/dL', status: 'Normal' },
        { name: 'Blood Glucose (Fasting)', value: 82, min: 70, max: 100, unit: 'mg/dL', status: 'Normal' },
        { name: 'Triglycerides', value: 110, min: 0, max: 150, unit: 'mg/dL', status: 'Normal' },
        { name: 'Creatinine', value: 0.95, min: 0.6, max: 1.2, unit: 'mg/dL', status: 'Normal' }
      ]
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportCode.trim()) return;

    setSearchStatus('searching');

    setTimeout(() => {
      const code = reportCode.trim().toUpperCase();
      if (mockReports[code]) {
        setRetrievedReport(mockReports[code]);
        setSearchStatus('success');
      } else {
        setSearchStatus('failed');
      }
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setSearchStatus('idle');
    setReportCode('');
    setRetrievedReport(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-content glass-panel-blue"
            style={{
              maxWidth: searchStatus === 'success' ? '720px' : '480px',
              padding: 0,
              maxHeight: '92vh'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'var(--gradient-secondary)',
              padding: '20px 24px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} style={{ color: 'var(--cyan)' }} />
                <h3 style={{ color: 'white', fontSize: '1.25rem' }}>{t.modalPortalTitle}</h3>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition-fast)'
                }}
                className="hover-bright"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }} className="no-print">
              {searchStatus === 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(2, 132, 199, 0.05)',
                      color: 'var(--med-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto'
                    }}>
                      <FileText size={28} />
                    </div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t.modalPortalSubtitle}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                      {t.modalPortalDesc}
                    </p>
                  </div>

                  <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.modalPortalCodeLabel}</label>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          required
                          placeholder={t.modalPortalPlaceholder}
                          value={reportCode}
                          onChange={e => setReportCode(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 38px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-muted)',
                            fontSize: '0.98rem',
                            letterSpacing: '0.5px'
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: '46px', gap: '10px' }}
                    >
                      <Lock size={16} /> {t.modalPortalBtn}
                    </button>
                  </form>

                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    border: '1px solid var(--border-muted)'
                  }}>
                    <AlertCircle size={16} style={{ color: 'var(--med-blue)', flexShrink: 0 }} />
                    <span>{t.modalPortalHint}</span>
                  </div>
                </div>
              )}

              {searchStatus === 'searching' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(2, 132, 199, 0.15)',
                    borderTopColor: 'var(--med-blue)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                  }} />
                  <p style={{ fontWeight: 600 }}>{t.modalPortalSearching}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.modalPortalDecrypting}</p>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}

              {searchStatus === 'failed' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#fef2f2',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{t.modalPortalFailedTitle}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '320px' }}>
                      {language === 'en' ? (
                        <>We couldn't locate reports for the code "{reportCode}". Please check your code and try again.</>
                      ) : (
                        <>आम्हाला "{reportCode}" या कोडसाठी रिपोर्ट आढळले नाहीत. कृपया तुमचा कोड तपासून पुन्हा प्रयत्न करा.</>
                      )}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {language === 'en' ? 'Hint: Use standard codes REP-2026 or FIT-99.' : 'संकेत: REP-2026 किंवा FIT-99 कोड वापरा.'}
                  </div>
                  <button onClick={handleReset} className="btn btn-secondary" style={{ width: '140px' }}>
                    {t.modalPortalFailedBtn}
                  </button>
                </div>
              )}

              {searchStatus === 'success' && retrievedReport && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Patient Info Card */}
                  <div className="glass-panel" style={{
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-muted)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t.modalReportPatient}</span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>{retrievedReport.patientName}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t.modalReportAge}</span>
                      <div style={{ fontWeight: 600 }}>{retrievedReport.age} / {retrievedReport.gender}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t.modalReportCode}</span>
                      <div style={{ fontWeight: 600, color: 'var(--med-blue)' }}>{retrievedReport.code}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t.modalReportDate}</span>
                      <div style={{ fontWeight: 600 }}>{retrievedReport.date}</div>
                    </div>
                  </div>

                  {/* Diagnosis type */}
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '4px' }}>
                      {getTestTypeTranslation(retrievedReport.testType, language)}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: '#e0f2fe',
                        color: 'var(--med-blue)',
                        fontWeight: 700,
                        borderRadius: '4px'
                      }}>
                        {retrievedReport.status}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {t.modalReportProcessed}: {getTechnicianName(retrievedReport.labTechnician, language)}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div style={{
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.9rem',
                      textAlign: 'left'
                    }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-muted)' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 600 }}>{t.modalReportMetric}</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600 }}>{t.modalReportLevel}</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600 }}>{t.modalReportRange}</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>{t.modalReportStatus}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {retrievedReport.metrics.map((metric: any, index: number) => {
                          const isNormal = metric.status.toLowerCase() === 'normal';
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                                {getMetricName(metric.name, language)}
                              </td>
                              <td style={{ padding: '12px 14px', color: isNormal ? 'var(--text-primary)' : '#b91c1c', fontWeight: 700 }}>
                                {metric.value} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{metric.unit}</span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {metric.min} - {metric.max} {metric.unit}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: isNormal ? '#f0fdf4' : '#fef2f2',
                                  color: isNormal ? '#166534' : '#991b1b'
                                }}>
                                  {getMetricStatus(metric.status, language)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary/Notes */}
                  <div style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(6, 182, 212, 0.03)',
                    border: '1px solid rgba(6, 182, 212, 0.1)',
                    fontSize: '0.85rem'
                  }}>
                    <strong style={{ color: 'var(--cyan-hover)', display: 'block', marginBottom: '4px' }}>{t.modalReportNotes}:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{getSummaryTranslation(retrievedReport.summary, language)}"
                    </p>
                  </div>

                  {/* Action row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    gap: '12px'
                  }}>
                    <button onClick={handleReset} className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
                      {t.modalReportAnother}
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '0.9rem', display: 'flex', gap: '6px' }}>
                        <Printer size={16} /> {t.modalReportPrint}
                      </button>
                      <button
                        onClick={() => alert(t.modalReportDownloaded)}
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', fontSize: '0.9rem', display: 'flex', gap: '6px' }}
                      >
                        <Download size={16} /> {t.modalReportPdf}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Print layout style overrides (only targets screen prints) */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .modal-overlay, .modal-content, .modal-content * {
                  visibility: visible;
                }
                .modal-overlay {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white !important;
                }
                .no-print {
                  padding: 10px !important;
                }
                .btn, button, .no-print .btn {
                  display: none !important;
                }
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AppointmentStatusModal: React.FC<ModalProps> = ({ isOpen, onClose, language }) => {
  const location = useLocation();

  const [appointmentNo, setAppointmentNo] = useState('');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'success' | 'failed'>('idle');
  const [retrievedAppointment, setRetrievedAppointment] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasAutoRun, setHasAutoRun] = useState(false);

  // Handle automatic status lookup if query parameter statusId is in URL
  useEffect(() => {
    if (isOpen) {
      if (!hasAutoRun) {
        const params = new URLSearchParams(location.search);
        const statusId = params.get('statusId');
        if (statusId) {
          setHasAutoRun(true);
          setAppointmentNo(statusId);
          
          const autoSearch = async () => {
            setSearchStatus('searching');
            setErrorMsg('');
            try {
              const res = await appointmentsApi.getStatus(statusId.trim());
              if (res.success) {
                setRetrievedAppointment(res.appointment);
                setSearchStatus('success');
              }
            } catch (err: any) {
              console.error('Auto status search error:', err);
              setErrorMsg(err.response?.data?.message || 'Failed to find appointment.');
              setSearchStatus('failed');
            }
          };
          autoSearch();
        }
      }
    } else {
      setHasAutoRun(false); // Reset when modal is closed
      setSearchStatus('idle');
      setAppointmentNo('');
      setRetrievedAppointment(null);
      setErrorMsg('');
    }
  }, [isOpen, location, hasAutoRun]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentNo.trim()) return;

    setSearchStatus('searching');
    setErrorMsg('');
    try {
      const res = await appointmentsApi.getStatus(appointmentNo.trim());
      if (res.success) {
        setRetrievedAppointment(res.appointment);
        setSearchStatus('success');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to find appointment.');
      setSearchStatus('failed');
    }
  };

  const handleReset = () => {
    setSearchStatus('idle');
    setAppointmentNo('');
    setRetrievedAppointment(null);
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-content glass-panel-blue"
            style={{
              maxWidth: searchStatus === 'success' ? '540px' : '440px',
              padding: 0,
              maxHeight: '92vh'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'var(--gradient-primary)',
              padding: '20px 24px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={18} style={{ color: 'white' }} />
                <h3 style={{ color: 'white', fontSize: '1.25rem' }}>
                  {language === 'en' ? 'Check Appointment Status' : 'अपॉइंटमेंट स्थिती तपासा'}
                </h3>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition-fast)'
                }}
                className="hover-bright"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {searchStatus === 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                      {language === 'en' ? 'Track Your Appointment' : 'तुमची अपॉइंटमेंट ट्रॅक करा'}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                      {language === 'en'
                        ? 'Enter the appointment reference number (e.g. AP2606070001) to verify your schedule status.'
                        : 'तुमच्या अपॉइंटमेंटचे वेळापत्रक तपासण्यासाठी अपॉइंटमेंट संदर्भ क्रमांक प्रविष्ट करा (उदा. AP2606070001).'}
                    </p>
                  </div>

                  <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {language === 'en' ? 'Appointment ID' : 'अपॉइंटमेंट संदर्भ क्रमांक'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AP2606070001"
                        value={appointmentNo}
                        onChange={e => setAppointmentNo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-muted)',
                          fontSize: '0.98rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: '46px' }}
                    >
                      {language === 'en' ? 'Check Status' : 'स्थिती तपासा'}
                    </button>
                  </form>
                </div>
              )}

              {searchStatus === 'searching' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0' }}>
                  <Loader2 size={36} className="spin-animation" style={{ color: 'var(--med-blue)', marginBottom: '16px' }} />
                  <p style={{ fontWeight: 600 }}>
                    {language === 'en' ? 'Retrieving appointment details...' : 'अपॉइंटमेंट तपशील शोधत आहे...'}
                  </p>
                </div>
              )}

              {searchStatus === 'failed' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center', gap: '16px' }}>
                  <AlertCircle size={28} style={{ color: '#ef4444' }} />
                  <div>
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
                      {language === 'en' ? 'No Appointment Found' : 'अपॉइंटमेंट आढळली नाही'}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {errorMsg}
                    </p>
                  </div>
                  <button onClick={handleReset} className="btn btn-secondary" style={{ width: '140px' }}>
                    {language === 'en' ? 'Try Again' : 'पुन्हा प्रयत्न करा'}
                  </button>
                </div>
              )}

              {searchStatus === 'success' && retrievedAppointment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Voucher Preview */}
                  <div className="glass-panel" style={{
                    padding: '20px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {language === 'en' ? 'APPOINTMENT NO' : 'अपॉइंटमेंट संदर्भ क्रमांक'}
                        </span>
                        <div style={{ fontWeight: 800, color: 'var(--med-blue)', fontSize: '1.1rem' }}>{retrievedAppointment.appointmentId}</div>
                      </div>
                      <span className={`status-pill ${retrievedAppointment.status.toLowerCase()}`}>
                        {retrievedAppointment.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Patient Name' : 'रुग्णाचे नाव'}
                        </span>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>{retrievedAppointment.patientName}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Mobile Number' : 'मोबाईल नंबर'}
                        </span>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>{retrievedAppointment.mobile}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Department' : 'वैद्यकीय विभाग'}
                        </span>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>
                          {language === 'mr' ? (retrievedAppointment.departmentMr || retrievedAppointment.department) : retrievedAppointment.department}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Specialist Doctor' : 'पसंतीचे डॉक्टर'}
                        </span>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>
                          {language === 'mr' ? (retrievedAppointment.doctorMr || retrievedAppointment.doctor) : retrievedAppointment.doctor}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Appointment Date & Slot' : 'अपॉइंटमेंट तारीख आणि वेळ'}
                        </span>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                          {formatISTDate(retrievedAppointment.appointmentDate)} - {retrievedAppointment.appointmentSlot}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Booked On' : 'बुकिंग तारीख आणि वेळ'}
                        </span>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>
                          {new Date(retrievedAppointment.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button onClick={handleReset} className="btn btn-secondary">
                      {language === 'en' ? 'Back' : 'मागे'}
                    </button>
                    <button
                      onClick={() => appointmentsApi.printPdf(retrievedAppointment?._id)}
                      className="btn btn-secondary"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                    >
                      <Printer size={16} />
                      {language === 'en' ? 'Print Receipt' : 'पावती प्रिंट करा'}
                    </button>
                    <button
                      onClick={() => appointmentsApi.downloadPdf(retrievedAppointment._id, retrievedAppointment.appointmentId)}
                      className="btn btn-primary"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                    >
                      <Download size={16} />
                      {language === 'en' ? 'Download PDF' : 'पीडीएफ डाउनलोड करा'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
