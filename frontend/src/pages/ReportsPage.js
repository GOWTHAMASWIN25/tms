import React, { useContext, useEffect, useState, useMemo } from 'react';
import { complaintService, departmentService, programmeService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const categories = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    programme: '',
    complaintType: '',
    priority: '',
    status: '',
    assignee: '',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'SuperAdmin') return;
    departmentService.getAll().then((r) => setDepartments(r.data || [])).catch(() => {});
    programmeService.getAll().then((r) => setProgrammes(r.data || [])).catch(() => {});
    userService.getAll().then((r) => setUsers(r.data || [])).catch(() => {});

    // Initial load
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchReport = async () => {
    setError('');
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await complaintService.report(params);
      setResults(res.data || []);
      addToast(`Report loaded (${(res.data || []).length} records)`, 'info');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
      addToast('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      department: '',
      programme: '',
      complaintType: '',
      priority: '',
      status: '',
      assignee: '',
    });
  };

  // Analytics Metrics
  const analytics = useMemo(() => {
    const total = results.length;
    if (!total) {
      return {
        total: 0,
        resolved: 0,
        rate: 0,
        avgRating: '5.0',
        catBreakdown: {},
        prioBreakdown: {},
      };
    }

    const resolved = results.filter((r) => r.status === 'Closed').length;
    const rate = ((resolved / total) * 100).toFixed(1);
    const rated = results.filter((r) => r.rating);
    const avgRating = rated.length
      ? (rated.reduce((acc, r) => acc + r.rating, 0) / rated.length).toFixed(1)
      : '5.0';

    // Category breakdown
    const catBreakdown = {};
    results.forEach((r) => {
      const cat = r.complaintType || 'Other';
      catBreakdown[cat] = (catBreakdown[cat] || 0) + 1;
    });

    // Priority breakdown
    const prioBreakdown = {
      Urgent: results.filter((r) => r.priority === 'Urgent').length,
      High: results.filter((r) => r.priority === 'High').length,
      Medium: results.filter((r) => (r.priority || 'Medium') === 'Medium').length,
      Low: results.filter((r) => r.priority === 'Low').length,
    };

    return { total, resolved, rate, avgRating, catBreakdown, prioBreakdown };
  }, [results]);

  const exportCSV = () => {
    if (!results.length) return;
    const headers = [
      'Date',
      'Ticket Title',
      'Priority',
      'Department',
      'Block',
      'Room',
      'Category',
      'Status',
      'Reported By',
      'Assigned Staff',
      'Rating',
      'Resolution Notes',
    ];

    const rows = results.map((r) => [
      new Date(r.createdAt).toLocaleString(),
      r.title || '',
      r.priority || 'Medium',
      r.departmentName || r.createdBy?.department?.name || '',
      r.blockName,
      r.roomNumber,
      r.complaintType,
      r.status,
      r.createdBy?.username || r.createdBy?.email || '',
      r.assignedTo?.username || r.assignedTo?.email || '',
      r.rating ? `${r.rating}/5` : 'N/A',
      (r.resolutionNotes || '').replace(/\n/g, ' '),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${('' + cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TMS_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report exported successfully', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <div className="master-screen">
        <div className="action-panel glass-card">
          <h2>Access Restricted</h2>
          <div className="error-message">Only SuperAdmin can generate campus reports.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Advanced Analytics & Audit Reports</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Comprehensive compliance reporting, category breakdown, and SLA resolution tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handlePrint}>
            <span>🖨</span> Print Report
          </button>
          <button className="btn-primary" onClick={exportCSV} disabled={results.length === 0}>
            <span>📥</span> Export CSV Dataset
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* KPI Analytics Strip */}
      <div className="stats-container">
        <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
          <div className="stat-value">{analytics.total}</div>
          <div className="stat-label">Filtered Dataset</div>
          <div className="stat-sub">Tickets matching criteria</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--status-closed)' }}>
          <div className="stat-value">{analytics.rate}%</div>
          <div className="stat-label">Resolution SLA Rate</div>
          <div className="stat-sub">{analytics.resolved} of {analytics.total} resolved</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#fbbf24' }}>
          <div className="stat-value">{analytics.avgRating} ★</div>
          <div className="stat-label">Quality Score</div>
          <div className="stat-sub">User satisfaction rating</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--prio-urgent)' }}>
          <div className="stat-value">{analytics.prioBreakdown.Urgent || 0}</div>
          <div className="stat-label">Urgent Priority</div>
          <div className="stat-sub">High-severity escalations</div>
        </div>
      </div>

      {/* Visual Analytics Breakdowns */}
      {results.length > 0 && (
        <div className="analytics-visual-grid">
          {/* Category Breakdown */}
          <div className="analytics-card glass-card">
            <h3>Distribution by Category</h3>
            <div className="breakdown-list">
              {Object.entries(analytics.catBreakdown).map(([cat, count]) => {
                const pct = ((count / analytics.total) * 100).toFixed(0);
                return (
                  <div key={cat} className="breakdown-row">
                    <div className="bdr-head">
                      <span className="bdr-label">{cat}</span>
                      <span className="bdr-count">{count} tickets ({pct}%)</span>
                    </div>
                    <div className="bdr-bar-track">
                      <div className="bdr-bar-fill" style={{ width: `${pct}%`, background: 'var(--primary-gradient)' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="analytics-card glass-card">
            <h3>Urgency & Priority Breakdown</h3>
            <div className="breakdown-list">
              {[
                { name: 'Urgent', count: analytics.prioBreakdown.Urgent || 0, color: 'var(--prio-urgent)' },
                { name: 'High', count: analytics.prioBreakdown.High || 0, color: 'var(--prio-high)' },
                { name: 'Medium', count: analytics.prioBreakdown.Medium || 0, color: 'var(--prio-med)' },
                { name: 'Low', count: analytics.prioBreakdown.Low || 0, color: 'var(--prio-low)' },
              ].map((p) => {
                const pct = analytics.total ? ((p.count / analytics.total) * 100).toFixed(0) : 0;
                return (
                  <div key={p.name} className="breakdown-row">
                    <div className="bdr-head">
                      <span className="bdr-label">
                        <span className={`priority-badge priority-${p.name.toLowerCase()}`}>{p.name}</span>
                      </span>
                      <span className="bdr-count">{p.count} tickets ({pct}%)</span>
                    </div>
                    <div className="bdr-bar-track">
                      <div className="bdr-bar-fill" style={{ width: `${pct}%`, background: p.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Parameters Form */}
      <div className="action-panel glass-card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700 }}>Filter Dataset & Query Builder</h3>
          <button className="btn-outline btn-sm" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>

        <div className="form-grid">
          <div className="detail-item">
            <label>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Campus Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-item">
            <label>Programme</label>
            <select
              value={filters.programme}
              onChange={(e) => setFilters({ ...filters, programme: e.target.value })}
            >
              <option value="">All Programmes</option>
              {programmes.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-item">
            <label>Problem Category</label>
            <select
              value={filters.complaintType}
              onChange={(e) => setFilters({ ...filters, complaintType: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-item">
            <label>Priority SLA</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priority Levels</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="detail-item">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Onhold">Onhold</option>
              <option value="Closed">Resolved</option>
            </select>
          </div>

          <div className="detail-item">
            <label>Technician Assigned</label>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            >
              <option value="">All Technicians</option>
              {users
                .filter((u) => u.role !== 'SuperAdmin')
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username} ({u.role})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={fetchReport} disabled={loading}>
            {loading ? 'Analyzing Dataset...' : '🔍 Apply Filters & Query Report'}
          </button>
        </div>
      </div>

      {/* Dataset Results Table */}
      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ticket Summary</th>
              <th>Priority</th>
              <th>Department / Location</th>
              <th>Category</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Technician</th>
              <th>Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No records match the selected filter query.</div>
                </td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white' }}>{r.title || r.complaintType}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      #TMS-{r._id ? r._id.slice(-6).toUpperCase() : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${(r.priority || 'Medium').toLowerCase()}`}>
                      {r.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <div>{r.blockName} — Room {r.roomNumber}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {r.departmentName || r.createdBy?.department?.name || ''}
                    </div>
                  </td>
                  <td>{r.complaintType}</td>
                  <td>
                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-muted">{r.createdBy?.username || 'Guest'}</td>
                  <td className="text-muted">{r.assignedTo?.username || 'Unassigned'}</td>
                  <td>
                    {r.rating ? (
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                        {'★'.repeat(r.rating)} ({r.rating})
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .analytics-visual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .analytics-card {
          padding: 2rem;
        }

        .analytics-card h3 {
          font-size: 1.15rem;
          margin-bottom: 1.5rem;
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .breakdown-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bdr-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bdr-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: white;
        }

        .bdr-count {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .bdr-bar-track {
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .bdr-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease;
        }

        @media (max-width: 900px) {
          .analytics-visual-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
};

export default ReportsPage;
