import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appointmentsApi } from '../services/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  ShieldCheck, 
  Hospital, 
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ValidateAppointment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await appointmentsApi.getStatus(id);
        if (data.success && data.appointment) {
          setAppointment(data.appointment);
          setError(null);
        } else {
          setError(data.message || 'Appointment not found / अपॉइंटमेंट आढळली नाही');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Verification failed / पडताळणी अयशस्वी');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [id]);

  // Mask patient name for safety (e.g. "John Doe" -> "J*** D**")
  const maskName = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => {
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(part.length - 1);
      })
      .join(' ');
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return {
          icon: <CheckCircle className="text-emerald-500" size={48} />,
          textEn: 'VALID & CONFIRMED',
          textMr: 'निश्चित (व्हॅलिड)',
          bgColor: 'rgba(16, 185, 129, 0.08)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
          color: 'text-emerald-700'
        };
      case 'Completed':
        return {
          icon: <CheckCircle className="text-blue-500" size={48} />,
          textEn: 'COMPLETED & ARCHIVED',
          textMr: 'पूर्ण झालेली',
          bgColor: 'rgba(59, 130, 246, 0.08)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
          color: 'text-blue-700'
        };
      case 'Cancelled':
        return {
          icon: <XCircle className="text-rose-500" size={48} />,
          textEn: 'CANCELLED',
          textMr: 'रद्द केलेली',
          bgColor: 'rgba(239, 68, 68, 0.08)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: 'text-rose-700'
        };
      default:
        return {
          icon: <Clock className="text-amber-500" size={48} />,
          textEn: 'PENDING APPROVAL',
          textMr: 'प्रलंबित (पेंडिंग)',
          bgColor: 'rgba(245, 158, 11, 0.08)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          color: 'text-amber-700'
        };
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          padding: '32px',
          boxSizing: 'border-box'
        }}
      >
        {/* Hospital Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            padding: '12px',
            borderRadius: '16px',
            marginBottom: '12px'
          }}>
            <Hospital size={28} />
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            YUG'S AAROGYASETU HOSPITAL
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1', fontWeight: 700 }}>
            युगचे आरोग्यसेतू रुग्णालय
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin text-sky-600" size={36} />
            <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
              Verifying Appointment Status... / हजेरी पडताळत आहे...
            </p>
          </div>
        ) : error || !appointment ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <XCircle className="text-rose-500 mx-auto" size={56} style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.15rem', color: '#1e293b', margin: '0 0 8px 0', fontWeight: 700 }}>
              Verification Failed / पडताळणी अयशस्वी
            </h3>
            <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0 0 24px 0', fontWeight: 600 }}>
              {error || 'Invalid QR code or booking reference'}
            </p>
            <Link 
              to="/" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#0284c7',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none'
              }}
            >
              <ChevronLeft size={16} /> Go to Homepage / मुख्यपृष्ठ
            </Link>
          </div>
        ) : (
          <div>
            {/* Status Indicator */}
            {(() => {
              const statusInfo = getStatusDisplay(appointment.status);
              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px',
                  borderRadius: '16px',
                  background: statusInfo.bgColor,
                  border: `1px solid ${statusInfo.borderColor}`,
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  {statusInfo.icon}
                  <h4 style={{ margin: '12px 0 2px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                    {statusInfo.textEn}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    {statusInfo.textMr}
                  </p>
                </div>
              );
            })()}

            {/* Info Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9'
              }}>
                <FileText className="text-sky-600" size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Appointment Reference
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>
                    {appointment.appointmentId}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9'
              }}>
                <User className="text-sky-600" size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Patient Name / रुग्णाचे नाव
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    {maskName(appointment.patientName || `${appointment.firstName} ${appointment.lastName}`)}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9'
              }}>
                <Calendar className="text-sky-600" size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Date & Slot / तारीख आणि वेळ
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    {new Date(appointment.appointmentDate).toLocaleDateString('en-IN')} | {appointment.appointmentSlot}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9'
              }}>
                <ShieldCheck className="text-sky-600" size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Consulting Doctor / डॉक्टर
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    {appointment.doctor} ({appointment.department})
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link 
                to="/" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                Back to Home / मागे जा
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ValidateAppointment;
