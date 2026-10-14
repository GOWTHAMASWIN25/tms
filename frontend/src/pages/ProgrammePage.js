import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { programmeService, departmentService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const ProgrammePage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortName: '', department: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, deptRes] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
      ]);
      setProgrammes(progRes.data || []);
      setDepartments(deptRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      addToast('Failed to load programmes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const shortLen = (formData.shortName || '').trim().length;
    if (shortLen < 2 || shortLen > 8) {
      setError('Short Name must be between 2 and 8 characters');
      addToast('Short Name must be between 2 and 8 characters', 'warning');
      return;
    }

    try {
      if (editingId) {
        await programmeService.update(editingId, formData);
        addToast('Programme updated successfully', 'success');
      } else {
        await programmeService.create(formData);
        addToast('Programme created successfully', 'success');
      }
      setFormData({ name: '', shortName: '', department: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to save programme');
      addToast('Failed to save programme', 'error');
    }
  };

  const handleEdit = (programme) => {
    setFormData({
      name: programme.name,
      shortName: programme.shortName,
      department: programme.department?._id || programme.department || '',
      description: programme.description || '',
    });
    setEditingId(programme._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this programme?')) {
      try {
        await programmeService.delete(id);
        addToast('Programme deleted', 'info');
        fetchData();
      } catch (err) {
        setError('Failed to delete programme');
        addToast('Failed to delete programme', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return programmes;
    const term = searchTerm.toLowerCase();
    return programmes.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.shortName || '').toLowerCase().includes(term) ||
        (p.department?.name || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
    );
  }, [programmes, searchTerm]);

  if (loading) {
    return (
      <div className="master-screen">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Academic Programmes</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Manage degree courses, disciplines, and study programs
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({ name: '', shortName: '', department: '', description: '' });
              }
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Programme'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <div className="action-panel glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Programme' : 'Create New Programme'}
          </h3>
          <form onSubmit={handleSubmit} className="master-form">
            <div className="form-group">
              <label>Programme Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. B.Tech Computer Science"
                required
              />
            </div>

            <div className="form-group">
              <label>Short Code (2-8 chars) *</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                required
                minLength="2"
                maxLength="8"
                placeholder="e.g. BT-CS"
              />
            </div>

            <div className="form-group">
              <label>Department (Optional)</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course details or duration..."
                rows="3"
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create Programme'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Item Count */}
      <div className="master-filter-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Search programmes..."
          className="master-search-input"
        />
        <span className="item-count-badge">
          Showing {filtered.length} of {programmes.length} Programmes
        </span>
      </div>

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Programme Name</th>
              <th>Short Code</th>
              <th>Department</th>
              <th>Description</th>
              {user?.role === 'SuperAdmin' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No programmes found.</div>
                </td>
              </tr>
            ) : (
              filtered.map((prog) => (
                <tr key={prog._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white' }}>{prog.name}</div>
                  </td>
                  <td>
                    <span className="table-code-badge">{prog.shortName}</span>
                  </td>
                  <td>{prog.department?.name || '-'}</td>
                  <td>{prog.description || '-'}</td>
                  {user?.role === 'SuperAdmin' && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button onClick={() => handleEdit(prog)} className="btn-outline btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(prog._id)} className="btn-danger btn-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgrammePage;
