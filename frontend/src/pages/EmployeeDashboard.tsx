import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../services/api';
import { 
  LogOut, 
  Clock, 
  CheckCircle, 
  Calendar, 
  AlertCircle,
  FileText,
  Loader2,
  Check,
  Play,
  Square
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Time clock state
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = sessionStorage.getItem('employeeToken');
      if (!token) {
        navigate('/employee/login');
        return;
      }

      // Check current employee details
      const session = await employeesApi.checkSession();
      if (session.success && session.authenticated) {
        setEmployee(session.employee);
      } else {
        sessionStorage.removeItem('employeeToken');
        sessionStorage.removeItem('employeeUser');
        navigate('/employee/login');
        return;
      }

      // Fetch history & today's record
      const data = await employeesApi.getHistory();
      if (data.success) {
        setHistory(data.history || []);
        setTodayRecord(data.todayRecord || null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleCheckIn = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const res = await employeesApi.checkIn({ notes });
      if (res.success) {
        setSuccess('Checked in successfully / आजची उपस्थिती नोंदवली गेली!');
        setNotes('');
        // Refresh dashboard data
        const data = await employeesApi.getHistory();
        if (data.success) {
          setHistory(data.history || []);
          setTodayRecord(data.todayRecord || null);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Check-in failed / हजेरी नोंदवणे अयशस्वी.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const res = await employeesApi.checkOut({ notes });
      if (res.success) {
        setSuccess('Checked out successfully / चेक-आउट यशस्वी झाले!');
        setNotes('');
        const data = await employeesApi.getHistory();
        if (data.success) {
          setHistory(data.history || []);
          setTodayRecord(data.todayRecord || null);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Check-out failed / चेक-आउट अयशस्वी.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await employeesApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      sessionStorage.removeItem('employeeToken');
      sessionStorage.removeItem('employeeUser');
      navigate('/employee/login');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <Loader2 className="animate-spin text-sky-600" size={40} />
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
          Loading your attendance panel...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'Inter', sans-serif",
      paddingBottom: '40px'
    }}>
      {/* Top Header Bar */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            padding: '8px',
            borderRadius: '10px'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Employee Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              AarogyaSetu HR Portal
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }} className="hidden-mobile">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              {employee?.firstName} {employee?.lastName}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {employee?.designation}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="container" style={{
        maxWidth: '1200px',
        margin: '32px auto 0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 2fr',
        gap: '32px',
        boxSizing: 'border-box'
      }} id="employee-dashboard-grid">
        
        {/* Left Side: Clock & Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Time & Attendance Clock Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Current Local Time
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '4px'
            }}>
              <Clock className="text-sky-600" size={28} />
              <span>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Punch Actions Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
              Punch Attendance / आजची नोंदणी
            </h3>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            {/* Notes Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                REMARKS / NOTES (OPTIONAL)
              </label>
              <textarea
                rows={2}
                placeholder="Write any check-in/out notes here..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            {/* Trigger buttons */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleCheckIn}
                disabled={submitting || (todayRecord && todayRecord.checkIn !== undefined)}
                style={{
                  flex: 1,
                  background: (todayRecord && todayRecord.checkIn) ? '#f1f5f9' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: (todayRecord && todayRecord.checkIn) ? '#94a3b8' : 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: (todayRecord && todayRecord.checkIn) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (todayRecord && todayRecord.checkIn) ? 'none' : '0 4px 10px rgba(16, 185, 129, 0.2)'
                }}
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Play size={14} />}
                Check In
              </button>

              <button
                onClick={handleCheckOut}
                disabled={submitting || !todayRecord || (todayRecord && todayRecord.checkOut !== undefined)}
                style={{
                  flex: 1,
                  background: (!todayRecord || (todayRecord && todayRecord.checkOut)) ? '#f1f5f9' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: (!todayRecord || (todayRecord && todayRecord.checkOut)) ? '#94a3b8' : 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: (!todayRecord || (todayRecord && todayRecord.checkOut)) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (!todayRecord || (todayRecord && todayRecord.checkOut)) ? 'none' : '0 4px 10px rgba(239, 68, 68, 0.2)'
                }}
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Square size={12} />}
                Check Out
              </button>
            </div>

            {/* Current Day status indicators */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Check-in logged:</span>
                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700 }}>
                  {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Check-out logged:</span>
                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700 }}>
                  {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: History Logs */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Attendance Log History / हजेरीचा इतिहास
            </h3>
            <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
              {history.length} Logs
            </span>
          </div>

          <div style={{ flex: 1, overflowX: 'auto' }}>
            {history.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '40px 0' }}>
                <FileText size={48} style={{ marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No attendance records found.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>Punch in using the sidebar to create your first log.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '12px 8px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 8px', fontWeight: 700 }}>Check In</th>
                    <th style={{ padding: '12px 8px', fontWeight: 700 }}>Check Out</th>
                    <th style={{ padding: '12px 8px', fontWeight: 700 }} className="hidden-mobile">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                        {new Date(record.date).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: record.status === 'Present' ? '#d1fae5' : record.status === 'Half Day' ? '#fef3c7' : '#fee2e2',
                          color: record.status === 'Present' ? '#065f46' : record.status === 'Half Day' ? '#92400e' : '#991b1b'
                        }}>
                          {record.status === 'Present' && <Check size={10} />}
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#64748b' }} className="hidden-mobile">
                        {record.checkInNotes || record.checkOutNotes ? (
                          <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.checkInNotes || record.checkOutNotes}>
                            {record.checkInNotes || record.checkOutNotes}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .hidden-mobile {
          display: flex;
        }
        @media (max-width: 991px) {
          #employee-dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 576px) {
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;
