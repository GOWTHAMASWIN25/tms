import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const StatCard = ({ label, value, color, onClick }) => (
  <div
    className="stat-card"
    style={{ borderTop: `4px solid ${color}`, cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
  >
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const UserComplaintDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [myStats, setMyStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusTarget, setStatusTarget] = useState({ complaintId: null, status: '' });
  const [selectedStatus, setSelectedStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAll();
      const allComplaints = res.data || [];

      // Filter complaints for current user: either created by them or assigned to them
      const userId = user?.id || user?._id;
      const userComplaints = allComplaints.filter((c) => {
        const createdById = c.createdBy?._id || c.createdBy;
        const assignedToId = c.assignedTo?._id || c.assignedTo;
        return (
          String(createdById) === String(userId) ||
          String(assignedToId) === String(userId)
        );
      });
      setComplaints(userComplaints);

      // Calculate stats
      const stats = {
        total: userComplaints.length,
        pending: userComplaints.filter(c => c.status === 'Pending').length,
        assigned: userComplaints.filter(c => c.status === 'Assigned').length,
        closed: userComplaints.filter(c => c.status === 'Closed').length,
      };
      setMyStats(stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredComplaints = filterStatus === 'All'
    ? complaints
    : complaints.filter(c => c.status === filterStatus);

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedStatus(complaint.status || '');
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Dashboard</h1>
        <Link to="/complaints/new">
          <button className="btn-primary">New Ticket</button>
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Section */}
      <div className="stats-container">
        <StatCard
          label="All Tickets"
          value={myStats.total}
          color="var(--primary)"
          onClick={() => setFilterStatus('All')}
        />
        <StatCard
          label="Pending"
          value={myStats.pending}
          color="#f59e0b"
          onClick={() => setFilterStatus('Pending')}
        />
        <StatCard
          label="Assigned"
          value={myStats.assigned}
          color="#3b82f6"
          onClick={() => setFilterStatus('Assigned')}
        />
        <StatCard
          label="Resolved"
          value={myStats.closed}
          color="#10b981"
          onClick={() => setFilterStatus('Closed')}
        />
      </div>

      {/* Selected Complaint - Redesigned Panel */}
      {selectedComplaint && (
        <div className="action-panel glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Ticket Details</h3>
              <p className="text-muted">ID: #{selectedComplaint._id.substring(18)}</p>
            </div>
            <button onClick={() => setSelectedComplaint(null)} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px' }}>
              ✕
            </button>
          </div>

          <div className="form-grid">
            <div className="detail-item">
              <label>Location</label>
              <p>{selectedComplaint.blockName} - {selectedComplaint.roomNumber}</p>
            </div>
            <div className="detail-item">
              <label>Category</label>
              <p>{selectedComplaint.complaintType}</p>
            </div>
            <div className="detail-item">
              <label>Current Status</label>
              <div style={{ padding: '0.75rem 1rem' }} className={`status-badge status-${selectedComplaint.status.toLowerCase()}`}>
                {selectedComplaint.status}
              </div>
            </div>
            <div className="detail-item">
              <label>Reported On</label>
              <p>{new Date(selectedComplaint.createdAt).toLocaleDateString()} at {new Date(selectedComplaint.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="detail-item" style={{ marginTop: '2rem' }}>
            <label>Issue Description / Remarks</label>
            <p style={{ minHeight: '80px' }}>{selectedComplaint.remarks || "No description provided."}</p>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {selectedComplaint.attachment && (
              <a href={`http://localhost:5000/${selectedComplaint.attachment}`} target="_blank" rel="noopener noreferrer">
                <button className="btn-outline">
                  📎 View Attachment
                </button>
              </a>
            )}

            {(user?.role === 'SuperAdmin' || 
              String(selectedComplaint.createdBy?._id || selectedComplaint.createdBy) === String(user?.id) ||
              String(selectedComplaint.assignedTo?._id || selectedComplaint.assignedTo) === String(user?.id)) && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
                {selectedComplaint.status !== 'In-Progress' && (
                  <button 
                    className="btn-process" 
                    onClick={async () => {
                      try {
                        await complaintService.updateStatus(selectedComplaint._id, 'In-Progress');
                        await loadData();
                        try {
                          const refreshed = (await complaintService.getById(selectedComplaint._id)).data;
                          setSelectedComplaint(refreshed);
                        } catch (e) {
                          setSelectedComplaint(null);
                        }
                        setError('');
                      } catch (err) { setError('Update failed'); }
                    }}
                  >
                    Process
                  </button>
                )}
                {selectedComplaint.status !== 'Onhold' && (
                  <button 
                    className="btn-hold" 
                    onClick={async () => {
                      try {
                        await complaintService.updateStatus(selectedComplaint._id, 'Onhold');
                        await loadData();
                        try {
                          const refreshed = (await complaintService.getById(selectedComplaint._id)).data;
                          setSelectedComplaint(refreshed);
                        } catch (e) {
                          setSelectedComplaint(null);
                        }
                        setError('');
                      } catch (err) { setError('Update failed'); }
                    }}
                  >
                    Hold
                  </button>
                )}
                {selectedComplaint.status !== 'Closed' && (
                  <button 
                    className="btn-complete" 
                    onClick={async () => {
                      try {
                        await complaintService.updateStatus(selectedComplaint._id, 'Closed');
                        await loadData();
                        try {
                          const refreshed = (await complaintService.getById(selectedComplaint._id)).data;
                          setSelectedComplaint(refreshed);
                        } catch (e) {
                          setSelectedComplaint(null);
                        }
                        setError('');
                      } catch (err) { setError('Update failed'); }
                    }}
                  >
                    Complete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="table-container">
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>
          {filterStatus === 'All' ? 'Recent Activity' : `${filterStatus} Tickets`}
        </h3>

        <table className="master-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date</th>
              <th>Summary</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((c) => (
                <tr key={c._id} onClick={() => viewComplaintDetails(c)}>
                  <td>{c.blockName} - {c.roomNumber}</td>
                  <td>{c.complaintType}</td>
                  <td>
                    <span className={`status-badge status-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="text-muted">{c.remarks?.substring(0, 40)}...</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  No tickets found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserComplaintDashboardPage;
