import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import TicketDetailModal from '../components/TicketDetailModal';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const UserComplaintDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAll();
      const all = res.data || [];

      // Filter for current user: either created by them or assigned to them
      const userId = user?.id || user?._id;
      const userComplaints = all.filter((c) => {
        const createdById = c.createdBy?._id || c.createdBy;
        const assignedToId = c.assignedTo?._id || c.assignedTo;
        return (
          String(createdById) === String(userId) ||
          String(assignedToId) === String(userId)
        );
      });

      setComplaints(userComplaints);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
      addToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived user statistics
  const myStats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'Pending').length,
      assigned: complaints.filter((c) => c.status === 'Assigned').length,
      inProgress: complaints.filter((c) => c.status === 'In-Progress').length,
      closed: complaints.filter((c) => c.status === 'Closed').length,
    };
  }, [complaints]);

  // Filtered and searched complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const code = `#TMS-${c._id ? c._id.slice(-6).toUpperCase() : ''}`.toLowerCase();
        const title = (c.title || '').toLowerCase();
        const category = (c.complaintType || '').toLowerCase();
        const block = (c.blockName || '').toLowerCase();
        const room = (c.roomNumber || '').toLowerCase();
        const remarks = (c.remarks || '').toLowerCase();

        return (
          code.includes(term) ||
          title.includes(term) ||
          category.includes(term) ||
          block.includes(term) ||
          room.includes(term) ||
          remarks.includes(term)
        );
      }
      return true;
    });
  }, [complaints, filterStatus, searchTerm]);

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>{user?.role === 'User' ? 'My Support Tickets' : 'My Assigned Work Orders'}</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Monitor real-time progress, dispatch stages, and rate completed resolutions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={loadData}>
            <span>🔄</span> Refresh
          </button>
          {(!user?.role || ['SuperAdmin', 'User'].includes(user?.role)) && (
            <Link to="/complaints/new" className="btn btn-primary">
              <span>+</span> Raise New Ticket
            </Link>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-container">
        <div
          className={`stat-card ${filterStatus === 'All' ? 'active-filter' : ''}`}
          style={{ '--card-accent': 'var(--primary)', cursor: 'pointer' }}
          onClick={() => setFilterStatus('All')}
        >
          <div className="stat-value">{myStats.total}</div>
          <div className="stat-label">Total Tickets</div>
          <div className="stat-sub">All logged requests</div>
        </div>

        <div
          className={`stat-card ${filterStatus === 'Pending' ? 'active-filter' : ''}`}
          style={{ '--card-accent': 'var(--status-pending)', cursor: 'pointer' }}
          onClick={() => setFilterStatus('Pending')}
        >
          <div className="stat-value">{myStats.pending}</div>
          <div className="stat-label">Pending Triage</div>
          <div className="stat-sub">Waiting for dispatch</div>
        </div>

        <div
          className={`stat-card ${filterStatus === 'In-Progress' ? 'active-filter' : ''}`}
          style={{ '--card-accent': 'var(--status-progress)', cursor: 'pointer' }}
          onClick={() => setFilterStatus('In-Progress')}
        >
          <div className="stat-value">{myStats.inProgress + myStats.assigned}</div>
          <div className="stat-label">In Progress</div>
          <div className="stat-sub">Technician working on issue</div>
        </div>

        <div
          className={`stat-card ${filterStatus === 'Closed' ? 'active-filter' : ''}`}
          style={{ '--card-accent': 'var(--status-closed)', cursor: 'pointer' }}
          onClick={() => setFilterStatus('Closed')}
        >
          <div className="stat-value">{myStats.closed}</div>
          <div className="stat-label">Resolved</div>
          <div className="stat-sub">Completed work orders</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="dashboard-toolbar glass-card">
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket #TMS-..., summary, room, or issue notes..."
            className="dashboard-search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-pill-list">
          {['All', 'Pending', 'Assigned', 'In-Progress', 'Closed'].map((st) => (
            <button
              key={st}
              className={`filter-pill ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'Closed' ? 'Resolved' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table / List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading your tickets...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state-box glass-card">
          <div className="empty-state-icon">📋</div>
          <h3>No tickets found in this view</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            {searchTerm || filterStatus !== 'All'
              ? 'Try adjusting your filters or search keyword.'
              : "You haven't submitted any tickets yet."}
          </p>
          <Link to="/complaints/new" className="btn btn-primary">
            + Raise Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title / Summary</th>
                <th>Priority</th>
                <th>Location</th>
                <th>Status</th>
                <th>Assigned Technician</th>
                <th>Rating & Review</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => {
                const code = `#TMS-${c._id ? c._id.slice(-6).toUpperCase() : '0000'}`;
                return (
                  <tr key={c._id} className="ticket-row" onClick={() => setSelectedTicket(c)}>
                    <td>
                      <span className="table-code-badge">{code}</span>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '3px' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="ticket-title-text">{c.title || c.complaintType}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {c.complaintType}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${(c.priority || 'Medium').toLowerCase()}`}>
                        {c.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: 'white', fontWeight: 600 }}>
                        {c.blockName} — Room {c.roomNumber}
                      </div>
                      {c.departmentName && (
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {c.departmentName}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.assignedTo ? (
                        <div style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                          👤 {c.assignedTo.username}
                        </div>
                      ) : (
                        <span className="text-muted">Assigned upon triage</span>
                      )}
                    </td>
                    <td>
                      {c.status === 'Closed' ? (
                        c.rating ? (
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                            {'★'.repeat(c.rating)} ({c.rating}/5)
                          </span>
                        ) : (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: '#fbbf24', color: '#fbbf24' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(c);
                            }}
                          >
                            ⭐ Rate Resolution
                          </button>
                        )
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(c);
                        }}
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailModal
          complaint={selectedTicket}
          currentUser={user}
          allUsers={[]}
          onClose={() => setSelectedTicket(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default UserComplaintDashboardPage;
