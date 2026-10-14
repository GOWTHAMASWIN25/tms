import React, { useEffect, useState, useContext, useMemo } from 'react';
import { complaintService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import TicketDetailModal from '../components/TicketDetailModal';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const ComplaintsDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    closed: 0,
    urgent: 0,
    avgRating: '5.0',
  });
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadData = async () => {
    try {
      setListLoading(true);
      const res = await complaintService.getAll();
      setComplaints(res.data || []);

      try {
        const s = await complaintService.getStats();
        setStats(s.data || {});
      } catch (e) {}
    } catch (err) {
      setError('Failed to load complaints');
      addToast('Failed to load complaints data', 'error');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      userService.getAll().then((res) => setUsers(res.data || [])).catch(() => {});
    }
  }, [user]);

  // Filtered & Searched complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const code = `#TMS-${c._id ? c._id.slice(-6).toUpperCase() : ''}`.toLowerCase();
        const title = (c.title || '').toLowerCase();
        const category = (c.complaintType || '').toLowerCase();
        const block = (c.blockName || '').toLowerCase();
        const room = (c.roomNumber || '').toLowerCase();
        const reporter = (c.createdBy?.username || '').toLowerCase();
        const assignee = (c.assignedTo?.username || '').toLowerCase();
        const remarks = (c.remarks || '').toLowerCase();

        return (
          code.includes(term) ||
          title.includes(term) ||
          category.includes(term) ||
          block.includes(term) ||
          room.includes(term) ||
          reporter.includes(term) ||
          assignee.includes(term) ||
          remarks.includes(term)
        );
      }

      return true;
    });
  }, [complaints, statusFilter, priorityFilter, searchTerm]);

  // Export CSV
  const exportCSV = () => {
    if (!filteredComplaints.length) return addToast('No records to export', 'warning');
    const headers = ['Ticket ID', 'Date', 'Title', 'Priority', 'Category', 'Location', 'Status', 'Reporter', 'Technician', 'Rating'];
    const rows = filteredComplaints.map((c) => [
      `TMS-${c._id ? c._id.slice(-6).toUpperCase() : ''}`,
      new Date(c.createdAt).toLocaleDateString(),
      c.title || '',
      c.priority || 'Medium',
      c.complaintType || '',
      `${c.blockName} - Room ${c.roomNumber}`,
      c.status || '',
      c.createdBy?.username || 'Guest',
      c.assignedTo?.username || 'Unassigned',
      c.rating ? `${c.rating}/5` : 'N/A',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${('' + cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TMS_Complaints_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Complaints exported to CSV', 'success');
  };

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Campus Ticket Dashboard</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Centralized dispatch queue, live status management, and SLA tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={exportCSV}>
            <span>📥</span> Export CSV
          </button>
          <button className="btn-primary" onClick={loadData}>
            <span>🔄</span> Refresh Queue
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* KPI Metric Cards */}
      <div className="stats-container">
        <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
          <div className="stat-value">{stats.total || 0}</div>
          <div className="stat-label">Total Work Orders</div>
          <div className="stat-sub">Recorded across all blocks</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--status-pending)' }}>
          <div className="stat-value">{stats.pending || 0}</div>
          <div className="stat-label">Pending Triage</div>
          <div className="stat-sub">Awaiting technician assignment</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--status-progress)' }}>
          <div className="stat-value">{(stats.assigned || 0) + (stats.inProgress || 0)}</div>
          <div className="stat-label">In Progress</div>
          <div className="stat-sub">Active technical repairs</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--status-closed)' }}>
          <div className="stat-value">{stats.closed || 0}</div>
          <div className="stat-label">Resolved / Closed</div>
          <div className="stat-sub">Successfully repaired</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--prio-urgent)' }}>
          <div className="stat-value">{stats.urgent || 0}</div>
          <div className="stat-label">Urgent Priority</div>
          <div className="stat-sub">High-impact escalations</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#fbbf24' }}>
          <div className="stat-value">{stats.avgRating || '5.0'} ★</div>
          <div className="stat-label">User Satisfaction</div>
          <div className="stat-sub">Average resolution score</div>
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
            placeholder="Search by ticket #TMS-..., title, room, block, technician, or reporter..."
            className="dashboard-search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-group-row">
          {/* Status Tabs */}
          <div className="filter-pill-list">
            {['All', 'Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'].map((st) => (
              <button
                key={st}
                className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'Closed' ? 'Resolved' : st}
              </button>
            ))}
          </div>

          {/* Priority Select */}
          <div className="priority-filter-select-wrapper">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="priority-select"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">🔥 Urgent Only</option>
              <option value="High">⚡ High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      {listLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading dispatch queue...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state-box glass-card">
          <div className="empty-state-icon">📂</div>
          <h3>No matching complaints found</h3>
          <p className="text-muted">
            {searchTerm || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'Try modifying your search query or filter criteria.'
              : 'There are currently no tickets logged in the database.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title / Category</th>
                <th>Priority</th>
                <th>Campus Location</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Assigned Staff</th>
                <th>Feedback</th>
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
                        Category: {c.complaintType}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${(c.priority || 'Medium').toLowerCase()}`}>
                        {c.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'white' }}>
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
                      <div style={{ color: 'white' }}>{c.createdBy?.username || 'User'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {c.createdBy?.department?.name || 'Campus'}
                      </div>
                    </td>
                    <td>
                      {c.assignedTo ? (
                        <div style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                          👤 {c.assignedTo.username}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      {c.rating ? (
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                          {'★'.repeat(c.rating)} ({c.rating})
                        </span>
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
          allUsers={users}
          onClose={() => setSelectedTicket(null)}
          onRefresh={loadData}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .dashboard-toolbar {
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: #64748b;
          font-size: 1rem;
          pointer-events: none;
        }

        .dashboard-search-input {
          padding-left: 46px;
          padding-right: 40px;
          font-size: 0.95rem;
          background: rgba(13, 20, 36, 0.9);
        }

        .clear-search-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 4px;
          box-shadow: none;
        }

        .filter-group-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-pill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .filter-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 0.84rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          box-shadow: none;
        }

        .filter-pill:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: none;
        }

        .filter-pill.active {
          background: var(--primary);
          border-color: #818cf8;
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        }

        .priority-select {
          min-width: 170px;
          padding: 7px 12px;
          font-size: 0.85rem;
        }

        .table-code-badge {
          font-family: monospace;
          font-size: 0.82rem;
          font-weight: 700;
          color: #c7d2fe;
          background: rgba(99, 102, 241, 0.15);
          padding: 3px 6px;
          border-radius: 6px;
        }

        .ticket-title-text {
          font-weight: 600;
          color: white;
          max-width: 240px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ticket-row {
          cursor: pointer;
          transition: var(--transition);
        }

        .empty-state-box {
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
      `}} />
    </div>
  );
};

export default ComplaintsDashboardPage;
