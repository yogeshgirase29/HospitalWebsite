import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { compoundersApi } from '../services/api';
import { 
  LogOut, 
  Users, 
  Calendar, 
  CreditCard, 
  Plus, 
  Search, 
  FileText, 
  Printer, 
  Loader2, 
  AlertCircle,
  Eye,
  Trash2,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'patients' | 'appointments' | 'billing';

export const CompounderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [compounder, setCompounder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<SubTab>('patients');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data States
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  // Search/Filters
  const [patientSearch, setPatientSearch] = useState('');
  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('All');
  const [billSearch, setBillSearch] = useState('');

  // Add Patient Form State
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: 0,
    gender: 'Male',
    mobile: '',
    email: '',
    address: '',
    city: '',
    emergencyContact: ''
  });

  // Billing Modal State
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [billingItems, setBillingItems] = useState<{ name: string; price: number }[]>([
    { name: 'Consultation Fee', price: 300 }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('Cash');

  // View Bill Modal State
  const [isViewBillOpen, setIsViewBillOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem('compounderToken');
      if (!token) {
        navigate('/compounder/login');
        return;
      }

      // Check current compounder session
      const session = await compoundersApi.checkSession();
      if (session.success && session.authenticated) {
        setCompounder(session.compounder);
      } else {
        sessionStorage.removeItem('compounderToken');
        sessionStorage.removeItem('compounderUser');
        navigate('/compounder/login');
        return;
      }

      // Load data depending on active tab
      await refreshTabData(activeTab);

    } catch (err: any) {
      console.error(err);
      setError('Failed to load portal statistics.');
    } finally {
      setLoading(false);
    }
  };

  const refreshTabData = async (tab: SubTab) => {
    try {
      if (tab === 'patients') {
        const data = await compoundersApi.getPatients({ search: patientSearch });
        if (data.success) setPatients(data.patients || []);
      } else if (tab === 'appointments') {
        const data = await compoundersApi.getAppointments({ search: appSearch, status: appStatus });
        if (data.success) setAppointments(data.appointments || []);
      } else if (tab === 'billing') {
        const data = await compoundersApi.getBills({ search: billSearch });
        if (data.success) setBills(data.bills || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab, navigate]);

  // Handle tab specific search refreshes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      refreshTabData(activeTab);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [patientSearch, appSearch, appStatus, billSearch]);

  const handleLogout = async () => {
    try {
      await compoundersApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      sessionStorage.removeItem('compounderToken');
      sessionStorage.removeItem('compounderUser');
      navigate('/compounder/login');
    }
  };

  // Calculate age on DOB change
  useEffect(() => {
    if (patientForm.dateOfBirth) {
      const dob = new Date(patientForm.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setPatientForm(prev => ({ ...prev, age: age < 0 ? 0 : age }));
    }
  }, [patientForm.dateOfBirth]);

  // Handle Patient Add
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await compoundersApi.addPatient(patientForm);
      if (res.success) {
        setSuccess(`Patient ${res.patient.firstName} ${res.patient.lastName} registered successfully! (ID: ${res.patient.patientId})`);
        setPatientForm({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: 0,
          gender: 'Male',
          mobile: '',
          email: '',
          address: '',
          city: '',
          emergencyContact: ''
        });
        refreshTabData('patients');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to register patient details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Billing calculation logic
  const subtotal = billingItems.reduce((acc, curr) => acc + curr.price, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const addBillingItem = () => {
    if (!newItemName.trim() || newItemPrice <= 0) return;
    setBillingItems(prev => [...prev, { name: newItemName, price: newItemPrice }]);
    setNewItemName('');
    setNewItemPrice(0);
  };

  const removeBillingItem = (index: number) => {
    setBillingItems(prev => prev.filter((_, i) => i !== index));
  };

  // Generate Bill Submission
  const handleGenerateBill = async () => {
    if (!selectedApp) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        appointmentId: selectedApp._id,
        patientName: selectedApp.patientName || `${selectedApp.firstName} ${selectedApp.lastName}`,
        doctorName: selectedApp.doctor,
        departmentName: selectedApp.department,
        services: billingItems,
        subtotal,
        discount,
        tax,
        total,
        paymentStatus: 'Paid',
        paymentMode
      };

      const res = await compoundersApi.generateBill(payload);
      if (res.success) {
        setIsBillingModalOpen(false);
        setSuccess(`Invoice ${res.bill.billNumber} created successfully! / बिल तयार झाले!`);
        // Reset states
        setBillingItems([{ name: 'Consultation Fee', price: 300 }]);
        setDiscount(0);
        setTax(0);
        setSelectedApp(null);
        refreshTabData('appointments');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Billing invoice generation failed.');
    } finally {
      setSubmitting(false);
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
        background: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
      }}>
        <Loader2 className="animate-spin text-sky-600" size={40} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
          Loading clinic desk portal...
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
            <Users size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Compounder Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              AarogyaSetu Clinic Management
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }} className="hidden-mobile">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              {compounder?.firstName} {compounder?.lastName}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
              Clinic Desk
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
              gap: '6px'
            }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div style={{
        maxWidth: '1200px',
        margin: '24px auto 0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          background: 'white',
          padding: '6px',
          borderRadius: '14px',
          display: 'inline-flex',
          gap: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setActiveTab('patients')}
            style={{
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'patients' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'patients' ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} /> Patients Registry
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'appointments' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'appointments' ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={16} /> Appointments Feed
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            style={{
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'billing' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'billing' ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            <CreditCard size={16} /> Bills Registry
          </button>
        </div>

        {/* Dynamic Alerts */}
        <div style={{ marginTop: '20px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '16px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '16px'
            }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div style={{ marginTop: '24px' }}>
          {/* TAB 1: Patients registry */}
          {activeTab === 'patients' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 2fr',
              gap: '32px'
            }} id="compounder-patient-grid">
              {/* Patient add form */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Register Patient / नवीन रुग्ण नोंदणी
                </h3>
                <form onSubmit={handleAddPatient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>FIRST NAME</label>
                      <input
                        type="text"
                        required
                        value={patientForm.firstName}
                        onChange={e => setPatientForm(prev => ({ ...prev, firstName: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>LAST NAME</label>
                      <input
                        type="text"
                        required
                        value={patientForm.lastName}
                        onChange={e => setPatientForm(prev => ({ ...prev, lastName: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>DATE OF BIRTH</label>
                      <input
                        type="date"
                        required
                        value={patientForm.dateOfBirth}
                        onChange={e => setPatientForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>AGE</label>
                      <input
                        type="number"
                        readOnly
                        value={patientForm.age}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', background: '#f8fafc' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>GENDER</label>
                      <select
                        value={patientForm.gender}
                        onChange={e => setPatientForm(prev => ({ ...prev, gender: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      >
                        <option value="Male">Male / पुरुष</option>
                        <option value="Female">Female / स्त्री</option>
                        <option value="Other">Other / इतर</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>MOBILE NUMBER</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210"
                        value={patientForm.mobile}
                        onChange={e => setPatientForm(prev => ({ ...prev, mobile: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>EMAIL (OPTIONAL)</label>
                    <input
                      type="email"
                      value={patientForm.email}
                      onChange={e => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>CITY</label>
                      <input
                        type="text"
                        value={patientForm.city}
                        onChange={e => setPatientForm(prev => ({ ...prev, city: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>EMERGENCY CONTACT</label>
                      <input
                        type="text"
                        value={patientForm.emergencyContact}
                        onChange={e => setPatientForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>FULL ADDRESS</label>
                    <input
                      type="text"
                      value={patientForm.address}
                      onChange={e => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                      style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '8px'
                    }}
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={16} />}
                    Register Patient
                  </button>
                </form>
              </div>

              {/* Patient List */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Registered Patients Registry
                  </h3>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search ID, mobile, name..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px' }}>
                  {patients.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8' }}>
                      <Users size={36} style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No patient records found.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Patient ID</th>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Name</th>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Age/Gender</th>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Mobile</th>
                          <th style={{ padding: '8px', fontWeight: 700 }}>City</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map(p => (
                          <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                            <td style={{ padding: '8px', fontWeight: 700, color: '#0284c7' }}>{p.patientId}</td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                            <td style={{ padding: '8px' }}>{p.age} Y / {p.gender}</td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{p.mobile}</td>
                            <td style={{ padding: '8px' }}>{p.city || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appointments Feed */}
          {activeTab === 'appointments' && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Online Bookings & Billing Control
                </h3>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search ID, name, mobile..."
                      value={appSearch}
                      onChange={e => setAppSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={appStatus}
                    onChange={e => setAppStatus(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.8rem' }}
                  >
                    <option value="All">All Statuses / सर्व</option>
                    <option value="Pending">Pending / प्रलंबित</option>
                    <option value="Confirmed">Confirmed / निश्चित</option>
                    <option value="Completed">Completed / पूर्ण</option>
                    <option value="Cancelled">Cancelled / रद्द</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {appointments.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    <Calendar size={40} style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No appointments found.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Ref ID</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Patient Name</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Doctor (Dept)</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Date & Slot</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(app => (
                        <tr key={app._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0284c7' }}>{app.appointmentId}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{app.patientName || `${app.firstName} ${app.lastName}`}</td>
                          <td style={{ padding: '12px 8px' }}>{app.doctor} <span style={{ color: '#64748b' }}>({app.department})</span></td>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                            {new Date(app.appointmentDate).toLocaleDateString('en-IN')} | {app.appointmentSlot}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: app.status === 'Confirmed' ? '#d1fae5' : app.status === 'Completed' ? '#dbeafe' : app.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                              color: app.status === 'Confirmed' ? '#065f46' : app.status === 'Completed' ? '#1e40af' : app.status === 'Cancelled' ? '#991b1b' : '#854d0e'
                            }}>
                              {app.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {app.status !== 'Completed' && app.status !== 'Cancelled' ? (
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setIsBillingModalOpen(true);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <DollarSign size={12} /> Generate Bill
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No action available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Bills registry */}
          {activeTab === 'billing' && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Billing Registry & Invoices
                </h3>

                <div style={{ position: 'relative', width: '220px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search bill, patient..."
                    value={billSearch}
                    onChange={e => setBillSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {bills.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    <CreditCard size={40} style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No bills generated yet.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Bill Number</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Patient Name</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Doctor (Dept)</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Total Amount</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Payment Info</th>
                        <th style={{ padding: '12px 8px', fontWeight: 700 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map(bill => (
                        <tr key={bill._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0284c7' }}>{bill.billNumber}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{bill.patientName}</td>
                          <td style={{ padding: '12px 8px' }}>{bill.doctorName} <span style={{ color: '#64748b' }}>({bill.departmentName})</span></td>
                          <td style={{ padding: '12px 8px', fontWeight: 700 }}>₹ {bill.total.toFixed(2)}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: bill.paymentStatus === 'Paid' ? '#d1fae5' : '#fee2e2',
                              color: bill.paymentStatus === 'Paid' ? '#065f46' : '#991b1b'
                            }}>
                              {bill.paymentStatus} ({bill.paymentMode})
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setIsViewBillOpen(true);
                              }}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => compoundersApi.printBillPdf(bill._id)}
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              <Printer size={12} /> Print PDF
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
      </div>

      {/* BILL GENERATION MODAL */}
      <AnimatePresence>
        {isBillingModalOpen && selectedApp && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '600px',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Generate Billing Invoice / बिल तयार करा
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                Generating invoice linked to Appointment reference {selectedApp.appointmentId}
              </p>

              {/* Patient brief */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '0.82rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Patient Name:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>
                    {selectedApp.patientName || `${selectedApp.firstName} ${selectedApp.lastName}`}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Doctor Consulting:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{selectedApp.doctor}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Department:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{selectedApp.department}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Scheduled Slot:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>
                    {new Date(selectedApp.appointmentDate).toLocaleDateString('en-IN')} | {selectedApp.appointmentSlot}
                  </span>
                </div>
              </div>

              {/* Services items list editor */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  Billing Services / सल्ला शुल्क
                </h4>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="e.g. ECG Test, Lab Report"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    style={{ flex: 2, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newItemPrice || ''}
                    onChange={e => setNewItemPrice(Number(e.target.value))}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={addBillingItem}
                    style={{
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Items render list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', background: '#ffffff', maxHeight: '150px', overflowY: 'auto' }}>
                  {billingItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹ {item.price.toFixed(2)}</span>
                        {billingItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBillingItem(index)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount / tax details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>DISCOUNT / सवलत (₹)</label>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={e => setDiscount(Number(e.target.value))}
                    style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>TAX / कर (₹)</label>
                  <input
                    type="number"
                    value={tax || ''}
                    onChange={e => setTax(Number(e.target.value))}
                    style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>PAYMENT MODE / पेमेंट मोड</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  <option value="Cash">Cash / रोख</option>
                  <option value="Card">Card / कार्ड</option>
                  <option value="UPI">UPI / डिजिटल</option>
                  <option value="Online">Online / ऑनलाइन</option>
                </select>
              </div>

              {/* Totals Summary */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>₹ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Discount:</span>
                    <span style={{ color: '#b91c1c', fontWeight: 600 }}>- ₹ {discount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tax:</span>
                    <span style={{ color: '#1e293b', fontWeight: 600 }}>+ ₹ {tax.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '0.95rem', fontWeight: 800, color: '#0284c7' }}>
                  <span>Total Payable:</span>
                  <span>₹ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Modal footer controls */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'end' }}>
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Cancel / रद्द करा
                </button>
                <button
                  type="button"
                  onClick={handleGenerateBill}
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  Generate Bill & Complete Book
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW BILL DETAILS MODAL */}
      <AnimatePresence>
        {isViewBillOpen && selectedBill && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '540px',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                boxSizing: 'border-box'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', display: 'flex', justifySelf: 'center', gap: '8px', alignItems: 'center' }}>
                <FileText size={22} /> Invoice {selectedBill.billNumber}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem', marginBottom: '24px' }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Patient Name / नाव:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{selectedBill.patientName}</span>
                </div>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Consulting Doctor:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{selectedBill.doctorName} ({selectedBill.departmentName})</span>
                </div>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Payment Method:</span>{' '}
                  <span style={{ color: '#065f46', fontWeight: 700 }}>{selectedBill.paymentStatus} ({selectedBill.paymentMode})</span>
                </div>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Generated Date:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{new Date(selectedBill.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Generated By:</span>{' '}
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{selectedBill.createdBy}</span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span>Service Item</span>
                  <span>Price</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#334155' }}>
                  {selectedBill.services.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: 600 }}>₹ {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.88rem', color: '#0284c7' }}>
                  <span>Total Amount Paid:</span>
                  <span>₹ {selectedBill.total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'end' }}>
                <button
                  onClick={() => setIsViewBillOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close / बंद करा
                </button>
                <button
                  onClick={() => {
                    setIsViewBillOpen(false);
                    compoundersApi.printBillPdf(selectedBill._id);
                  }}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Printer size={12} /> Print Bill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile {
          display: flex;
        }
        @media (max-width: 991px) {
          #compounder-patient-grid {
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

export default CompounderDashboard;
