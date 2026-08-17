import React, { useState, useEffect } from 'react';
import { adminManagementApi } from '../services/api';
import { Search, ShieldAlert, Loader2 } from 'lucide-react';

export const AdminPatients: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await adminManagementApi.getPatients({ search });
      if (res.success) {
        setPatients(res.patients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by ID, name, mobile..."
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
      </div>

      {/* List Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading && patients.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Loader2 className="animate-spin text-sky-600" size={32} />
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
            <ShieldAlert size={36} style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No patient records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Patient ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Age / Gender</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Mobile</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>City</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Emergency Contact</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0284c7' }}>{p.patientId}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                    <td style={{ padding: '12px 8px' }}>{p.age} Years / {p.gender}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.mobile}</td>
                    <td style={{ padding: '12px 8px' }}>{p.email || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{p.city || '-'}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.emergencyContact || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
