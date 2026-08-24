import React, { useState, useEffect } from 'react';
import { adminManagementApi } from '../services/api';
import { Search, ShieldAlert, Loader2 } from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await adminManagementApi.getAttendance({
        date: dateFilter,
        status: statusFilter,
        employeeName: employeeSearch
      });
      if (res.success) {
        setRecords(res.attendance || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAttendance();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [dateFilter, statusFilter, employeeSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search & Filter Controls */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', justifySelf: 'start' }}>
          
          {/* Employee name search */}
          <div style={{ position: 'relative', width: '240px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search employee name..."
              value={employeeSearch}
              onChange={e => setEmployeeSearch(e.target.value)}
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

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>DATE:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Status selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>STATUS:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              <option value="All">All / सर्व</option>
              <option value="Present">Present / उपस्थित</option>
              <option value="Half Day">Half Day / अर्ध दिवस</option>
              <option value="Absent">Absent / अनुपस्थित</option>
            </select>
          </div>

        </div>
      </div>

      {/* List Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading && records.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Loader2 className="spin-animation" size={32} style={{ color: 'var(--med-blue)' }} />
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
            <ShieldAlert size={36} style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No attendance records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Employee ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Designation</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Check In</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Check Out</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700 }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec._id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{new Date(rec.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0284c7' }}>{rec.employee?.employeeId || '-'}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'Deleted Employee'}</td>
                    <td style={{ padding: '12px 8px' }}>{rec.employee?.designation || '-'}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: rec.status === 'Present' ? '#d1fae5' : rec.status === 'Half Day' ? '#fef3c7' : '#fee2e2',
                        color: rec.status === 'Present' ? '#065f46' : rec.status === 'Half Day' ? '#92400e' : '#991b1b'
                      }}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#64748b' }}>
                      {rec.checkInNotes || rec.checkOutNotes ? (
                        <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.checkInNotes || rec.checkOutNotes}>
                          {rec.checkInNotes || rec.checkOutNotes}
                        </div>
                      ) : '-'}
                    </td>
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
