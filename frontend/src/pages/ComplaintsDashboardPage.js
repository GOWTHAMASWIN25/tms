import React, { useEffect, useState, useContext } from 'react';
import { complaintService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const ComplaintsDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignTarget, setAssignTarget] = useState({ complaintId: null, assignee: '' });
  const [statusTarget, setStatusTarget] = useState({ complaintId: null, status: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setListLoading(true);
        const res = await complaintService.getAll();
        setComplaints(res.data || []);
        // fetch stats too
        try {
          const s = await complaintService.getStats();
          setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
        } catch (e) { }
      } catch (err) {
        setError('Failed to load complaints');
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      userService.getAll().then((res) => setUsers(res.data || [])).catch(() => { });
    }
  }, [user]);

  const refresh = async () => {
    try {
      const res = await complaintService.getAll();
      setComplaints(res.data || []);
      try {
        const s = await complaintService.getStats();
        setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
      } catch (e) { }
    } catch (e) { }
  };

  const handleAssignClick = (id) => setAssignTarget({ complaintId: id, assignee: '' });
  const handleAssignSubmit = async () => {
    if (!assignTarget.assignee) return setError('Select an assignee');
    try {
      await complaintService.assign(assignTarget.complaintId, assignTarget.assignee);
      setAssignTarget({ complaintId: null, assignee: '' });
      refresh();
    } catch (err) { setError('Failed to assign'); }
  };

  const handleStatusClick = (id) => setStatusTarget({ complaintId: id, status: '' });
  const handleStatusSubmit = async () => {
    if (!statusTarget.status) return setError('Select a status');
    try {
      await complaintService.updateStatus(statusTarget.complaintId, statusTarget.status);
      setStatusTarget({ complaintId: null, status: '' });
      refresh();
    } catch (err) { setError('Failed to update status'); }
  };

  const handleClose = async (id) => {
    try {
      await complaintService.updateStatus(id, 'Closed');
      refresh();
    } catch (err) { setError('Failed to close'); }
  };

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>All Complaints</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline" onClick={refresh}>Refresh Data</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-container">
        <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#3b82f6' }}>
          <div className="stat-value">{stats.assigned}</div>
          <div className="stat-label">Assigned</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
          <div className="stat-value">{stats.closed}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {listLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading database...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th>Date Reported</th>
                <th>Location</th>
                <th>Category</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Assigned To</th>
                <th style={{ textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const isAssignee = c.assignedTo && String(c.assignedTo._id || c.assignedTo) === String(user?.id || user?._id);
                return (
                  <tr key={c._id}>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>{c.blockName} - {c.roomNumber}</td>
                    <td>{c.complaintType}</td>
                    <td>
                      <span className={`status-badge status-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-muted">{c.createdBy?.username || 'Guest'}</td>
                    <td className="text-muted">{c.assignedTo?.username || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        {user?.role === 'SuperAdmin' && (
                          assignTarget.complaintId === c._id ? (
                            <div className="assign-overlay glass-card">
                              <select
                                value={assignTarget.assignee}
                                onChange={(e) => setAssignTarget({ ...assignTarget, assignee: e.target.value })}
                              >
                                <option value="">Select Staff</option>
                                {users.filter(u => u.role !== 'SuperAdmin').map(u => (
                                  <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
                                ))}
                              </select>
                              <button onClick={handleAssignSubmit} className="btn-primary">Assign</button>
                              <button onClick={() => setAssignTarget({ complaintId: null, assignee: '' })} className="btn-outline">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => handleAssignClick(c._id)} className="btn-outline" style={{ fontSize: '11px' }}>
                              Assign Staff
                            </button>
                          )
                        )}

                        {(isAssignee || user?.role === 'SuperAdmin') && (
                          statusTarget.complaintId === c._id ? (
                            <div className="assign-overlay glass-card">
                              <select value={statusTarget.status} onChange={(e) => setStatusTarget({ ...statusTarget, status: e.target.value })}>
                                <option value="">Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In-Progress">In-Progress</option>
                                <option value="Onhold">Onhold</option>
                                <option value="Closed">Resolved</option>
                              </select>
                              <button onClick={handleStatusSubmit} className="btn-primary">Save</button>
                              <button onClick={() => setStatusTarget({ complaintId: null, status: '' })} className="btn-outline">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => handleStatusClick(c._id)} className="btn-primary" style={{ fontSize: '11px' }}>
                              Update
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComplaintsDashboardPage;
