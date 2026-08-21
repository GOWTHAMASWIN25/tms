import React, { useContext, useEffect, useState } from 'react';
import { complaintService, departmentService, programmeService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ department: '', programme: '', complaintType: '', status: '', assignee: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'SuperAdmin') return;
    departmentService.getAll().then(r => setDepartments(r.data || [])).catch(() => { });
    programmeService.getAll().then(r => setProgrammes(r.data || [])).catch(() => { });
    userService.getAll().then(r => setUsers(r.data || [])).catch(() => { });
  }, [user]);

  const fetchReport = async () => {
    setError('');
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await complaintService.report(params);
      setResults(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Date', 'Block', 'Room', 'Type', 'Remarks', 'Status', 'CreatedBy', 'Assignee'];
    const rows = results.map(r => [new Date(r.createdAt).toLocaleString(), r.blockName, r.roomNumber, r.complaintType, (r.remarks || '').replace(/\n/g, ' '), r.status, r.createdBy?.username || r.createdBy?.email || '', r.assignedTo?.username || r.assignedTo?.email || '']);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${('' + cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'complaints_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'SuperAdmin') {
    return <div className="master-screen"><div className="action-panel glass-card"><h2>Reports</h2><div className="error-message">Only SuperAdmin can generate reports.</div></div></div>;
  }

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Advanced Analytics</h1>
        <button className="btn-primary" onClick={exportCSV} disabled={results.length === 0}>Export Selection</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-panel glass-card">
        <h3 style={{ marginBottom: '2rem', fontWeight: 700 }}>Filter Dataset</h3>
        <div className="form-grid">
          <div className="detail-item">
            <label>Department</label>
            <select value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="detail-item">
            <label>Programme</label>
            <select value={filters.programme} onChange={e => setFilters({ ...filters, programme: e.target.value })}>
              <option value="">All Programmes</option>
              {programmes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="detail-item">
            <label>Status</label>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Closed">Resolved</option>
            </select>
          </div>
          <div className="detail-item">
            <label>Staff Assignee</label>
            <select value={filters.assignee} onChange={e => setFilters({ ...filters, assignee: e.target.value })}>
              <option value="">Any Staff</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.username} ({u.role})</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={fetchReport} disabled={loading}>
            {loading ? 'Crunching Data...' : 'Generate Intelligent Report'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Data Visualization Table</h3>
        {results.length > 0 ? (
          <table className="master-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r._id}>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{r.blockName} - {r.roomNumber}</td>
                  <td>{r.complaintType}</td>
                  <td>
                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-muted">{r.createdBy?.username || '-'}</td>
                  <td className="text-muted">{r.assignedTo?.username || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">No data points matching selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
