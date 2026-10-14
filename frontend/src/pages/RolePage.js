import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { roleService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const RolePage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAll();
      setRoles(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch roles');
      addToast('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const permissions = formData.permissions
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const data = { ...formData, permissions };

      if (editingId) {
        await roleService.update(editingId, data);
        addToast('Role updated successfully', 'success');
      } else {
        await roleService.create(data);
        addToast('Role created successfully', 'success');
      }
      setFormData({ name: '', description: '', permissions: '' });
      setEditingId(null);
      setShowForm(false);
      fetchRoles();
    } catch (err) {
      setError('Failed to save role');
      addToast('Failed to save role', 'error');
    }
  };

  const handleEdit = (role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.join(', ') || '',
    });
    setEditingId(role._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await roleService.delete(id);
        addToast('Role deleted', 'info');
        fetchRoles();
      } catch (err) {
        setError('Failed to delete role');
        addToast('Failed to delete role', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  if (loading) {
    return (
      <div className="master-screen">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>User Roles & Access Control</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Define privileges for administrators, technicians, faculty, and students
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({ name: '', description: '', permissions: '' });
              }
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Role'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <div className="action-panel glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Role' : 'Create New Role'}
          </h3>
          <form onSubmit={handleSubmit} className="master-form">
            <div className="form-group">
              <label>Role Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Technician, Faculty, Lab In-charge"
                required
              />
            </div>

            <div className="form-group">
              <label>Permissions (Comma-separated)</label>
              <input
                type="text"
                value={formData.permissions}
                onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                placeholder="e.g. complaints:read, complaints:update, rooms:read"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the scope of this role..."
                rows="3"
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create Role'}
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
          placeholder="🔍 Search roles..."
          className="master-search-input"
        />
        <span className="item-count-badge">
          Showing {filtered.length} of {roles.length} Roles
        </span>
      </div>

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Permissions</th>
              <th>Description</th>
              {user?.role === 'SuperAdmin' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No roles found.</div>
                </td>
              </tr>
            ) : (
              filtered.map((role) => (
                <tr key={role._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white' }}>{role.name}</div>
                  </td>
                  <td>
                    {role.permissions && role.permissions.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {role.permissions.map((p, idx) => (
                          <span key={idx} className="table-code-badge" style={{ fontSize: '0.75rem' }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">Standard</span>
                    )}
                  </td>
                  <td>{role.description || '-'}</td>
                  {user?.role === 'SuperAdmin' && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button onClick={() => handleEdit(role)} className="btn-outline btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(role._id)} className="btn-danger btn-sm">
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

export default RolePage;
