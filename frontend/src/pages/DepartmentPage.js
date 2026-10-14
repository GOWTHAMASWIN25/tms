import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { departmentService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const DepartmentPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortName: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll();
      setDepartments(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch departments');
      addToast('Failed to load departments', 'error');
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
        await departmentService.update(editingId, formData);
        addToast('Department updated successfully', 'success');
      } else {
        await departmentService.create(formData);
        addToast('Department created successfully', 'success');
      }
      setFormData({ name: '', shortName: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      setError('Failed to save department');
      addToast('Failed to save department', 'error');
    }
  };

  const handleEdit = (department) => {
    setFormData(department);
    setEditingId(department._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.delete(id);
        addToast('Department deleted', 'info');
        fetchDepartments();
      } catch (err) {
        setError('Failed to delete department');
        addToast('Failed to delete department', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(term) ||
        (d.shortName || '').toLowerCase().includes(term) ||
        (d.description || '').toLowerCase().includes(term)
    );
  }, [departments, searchTerm]);

  if (loading) {
    return (
      <div className="master-screen">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Department Management</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Configure academic and administrative infrastructure divisions
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({ name: '', shortName: '', description: '' });
              }
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Department'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Add / Edit Form Panel */}
      {showForm && user?.role === 'SuperAdmin' && (
        <div className="action-panel glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Department' : 'Create New Department'}
          </h3>
          <form onSubmit={handleSubmit} className="master-form">
            <div className="form-group">
              <label>Department Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                required
              />
            </div>

            <div className="form-group">
              <label>Short Code / Acronym (2-8 chars) *</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                required
                minLength="2"
                maxLength="8"
                placeholder="e.g. CSE"
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of department facilities..."
                rows="3"
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create Department'}
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
          placeholder="🔍 Search departments..."
          className="master-search-input"
        />
        <span className="item-count-badge">
          Showing {filtered.length} of {departments.length} Departments
        </span>
      </div>

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Short Code</th>
              <th>Description</th>
              {user?.role === 'SuperAdmin' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No departments found.</div>
                </td>
              </tr>
            ) : (
              filtered.map((dept) => (
                <tr key={dept._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white' }}>{dept.name}</div>
                  </td>
                  <td>
                    <span className="table-code-badge">{dept.shortName}</span>
                  </td>
                  <td>{dept.description || '-'}</td>
                  {user?.role === 'SuperAdmin' && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button onClick={() => handleEdit(dept)} className="btn-outline btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(dept._id)} className="btn-danger btn-sm">
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

export default DepartmentPage;
