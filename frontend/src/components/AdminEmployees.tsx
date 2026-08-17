import React, { useState, useEffect } from 'react';
import { adminManagementApi } from '../services/api';
import { Plus, Search, Edit2, ShieldAlert, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const AdminEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    designation: '',
    status: 'Active',
    password: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await adminManagementApi.getEmployees({ search });
      if (res.success) {
        setEmployees(res.employees || []);
      }
    } catch (e) {
      console.error(e);
      showNotification('error', 'Failed to fetch employees list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      designation: '',
      status: 'Active',
      password: ''
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingId(emp._id);
    setForm({
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      mobile: emp.mobile,
      designation: emp.designation,
      status: emp.status,
      password: '' // Don't prefill password
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        // Update
        const res = await adminManagementApi.updateEmployee(editingId, form);
        if (res.success) {
          showNotification('success', 'Employee updated successfully');
          setIsOpen(false);
          fetchEmployees();
        }
      } else {
        // Create
        if (!form.password) {
          showNotification('error', 'Password is required for new employees');
          return;
        }
        const res = await adminManagementApi.createEmployee(form);
        if (res.success) {
          showNotification('success', 'Employee created successfully');
          setIsOpen(false);
          fetchEmployees();
        }
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await adminManagementApi.toggleEmployeeStatus(id);
      if (res.success) {
        showNotification('success', res.message);
        fetchEmployees();
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Failed to toggle status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '12px 24px',
          borderRadius: '8px',
          background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: notification.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '260px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            background: 'var(--gradient-primary, linear-gradient(135deg, #0284c7 0%, #0369a1 100%))',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* List Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading && employees.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Loader2 className="animate-spin text-sky-600" size={32} />
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
            <ShieldAlert size={36} style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No employee records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Employee ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Designation</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0284c7' }}>{emp.employeeId}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{emp.firstName} {emp.lastName}</td>
                    <td style={{ padding: '12px 8px' }}>{emp.email}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{emp.designation}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: emp.status === 'Active' ? '#d1fae5' : '#fee2e2',
                        color: emp.status === 'Active' ? '#065f46' : '#991b1b'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        style={{
                          background: 'none',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#475569'
                        }}
                        title="Edit Details"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp._id)}
                        style={{
                          background: emp.status === 'Active' ? '#fee2e2' : '#d1fae5',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: emp.status === 'Active' ? '#b91c1c' : '#059669'
                        }}
                      >
                        {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT DIALOG */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 900
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {editingId ? 'Edit Employee Account' : 'Register Employee Account'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>EMPLOYEE ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    value={form.employeeId}
                    onChange={e => setForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>DESIGNATION</label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>FIRST NAME</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>LAST NAME</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>EMAIL</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>MOBILE</label>
                  <input
                    type="text"
                    required
                    value={form.mobile}
                    onChange={e => setForm(prev => ({ ...prev, mobile: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                  PASSWORD {editingId && '(Leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--gradient-primary, linear-gradient(135deg, #0284c7 0%, #0369a1 100%))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
