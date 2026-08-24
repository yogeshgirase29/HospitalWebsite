import React, { useState, useEffect } from 'react';
import { adminManagementApi } from '../services/api';
import { Plus, Search, Edit2, ShieldAlert, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const AdminCompounders: React.FC = () => {
  const [compounders, setCompounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    compounderId: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    status: 'Active',
    password: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchCompounders = async () => {
    try {
      setLoading(true);
      const res = await adminManagementApi.getCompounders({ search });
      if (res.success) {
        setCompounders(res.compounders || []);
      }
    } catch (e) {
      console.error(e);
      showNotification('error', 'Failed to fetch compounders list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompounders();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      compounderId: '',
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      status: 'Active',
      password: ''
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (comp: any) => {
    setEditingId(comp._id);
    setForm({
      compounderId: comp.compounderId,
      firstName: comp.firstName,
      lastName: comp.lastName,
      email: comp.email,
      mobile: comp.mobile,
      status: comp.status,
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
        const res = await adminManagementApi.updateCompounder(editingId, form);
        if (res.success) {
          showNotification('success', 'Compounder updated successfully');
          setIsOpen(false);
          fetchCompounders();
        }
      } else {
        // Create
        if (!form.password) {
          showNotification('error', 'Password is required for new compounders');
          return;
        }
        const res = await adminManagementApi.createCompounder(form);
        if (res.success) {
          showNotification('success', 'Compounder created successfully');
          setIsOpen(false);
          fetchCompounders();
        }
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.response?.data?.message || 'Failed to save compounder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await adminManagementApi.toggleCompounderStatus(id);
      if (res.success) {
        showNotification('success', res.message);
        fetchCompounders();
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm('Are you sure you want to reset this compounder\'s password to the default "y$1"?')) {
      return;
    }
    try {
      setLoading(true);
      const res = await adminManagementApi.resetCompounderPassword(id);
      if (res.success) {
        showNotification('success', 'Compounder password reset successfully to default: y$1');
      } else {
        showNotification('error', res.message || 'Failed to reset password');
      }
    } catch (e: any) {
      console.error(e);
      showNotification('error', e.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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

      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Compounders Directory</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Manage compounder access, details, and status</p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
          }}
        >
          <Plus size={16} /> Add Compounder
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* COMPOUNDERS TABLE */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {loading && compounders.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spin-animation" size={24} style={{ color: 'var(--med-blue)' }} />
          </div>
        ) : compounders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            No compounder records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Compounder ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Mobile</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {compounders.map(comp => (
                  <tr key={comp._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>{comp.compounderId}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{comp.firstName} {comp.lastName}</td>
                    <td style={{ padding: '12px 8px' }}>{comp.email}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{comp.mobile}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: comp.status === 'Active' ? '#d1fae5' : '#fee2e2',
                        color: comp.status === 'Active' ? '#065f46' : '#991b1b'
                      }}>
                        {comp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(comp)}
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
                        onClick={() => handleResetPassword(comp._id)}
                        style={{
                          background: 'none',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Reset password to default (y$1)"
                      >
                        <ShieldAlert size={12} /> Reset PW
                      </button>
                      <button
                        onClick={() => handleToggleStatus(comp._id)}
                        style={{
                          background: comp.status === 'Active' ? '#fee2e2' : '#d1fae5',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: comp.status === 'Active' ? '#b91c1c' : '#059669'
                        }}
                      >
                        {comp.status === 'Active' ? 'Deactivate' : 'Activate'}
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
        <div className="modal-overlay">
          <div className="modal-content glass-panel-blue" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '28px',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {editingId ? 'Edit Compounder Account' : 'Register Compounder Account'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>COMPOUNDER ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    value={form.compounderId}
                    onChange={e => setForm(prev => ({ ...prev, compounderId: e.target.value }))}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
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
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {submitting && <Loader2 className="spin-animation" size={14} />}
                  Save Compounder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
