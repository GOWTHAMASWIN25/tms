import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { userService, departmentService, programmeService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const UserPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'User',
    department: '',
    programme: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const roles = [
    'SuperAdmin',
    'User',
    'Networking Staff',
    'Plumber',
    'Electrician',
    'Software Developer',
    'Application',
    'PC Hardware',
  ];

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, deptRes, progRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setUsers(userRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!editingId) {
        if (!submitData.password) {
          setError('Password is required for new users');
          addToast('Password is required for new users', 'warning');
          return;
        }
      } else {
        if (!submitData.password) {
          delete submitData.password;
        }
      }

      if (submitData.department === '') delete submitData.department;
      if (submitData.programme === '') delete submitData.programme;

      if (editingId) {
        await userService.update(editingId, submitData);
        addToast('User updated successfully', 'success');
      } else {
        await userService.create(submitData);
        addToast('User created successfully', 'success');
      }
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'User',
        department: '',
        programme: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
      addToast('Failed to save user', 'error');
    }
  };

  const handleEdit = (userData) => {
    setFormData({
      username: userData.username,
      email: userData.email,
      phone: userData.phone || '',
      password: '',
      role: userData.role || 'User',
      department: userData.department?._id || userData.department || '',
      programme: userData.programme?._id || userData.programme || '',
    });
    setEditingId(userData._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.delete(id);
        addToast('User deleted', 'info');
        fetchData();
      } catch (err) {
        setError('Failed to delete user');
        addToast('Failed to delete user', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term) ||
        (u.department?.name || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="master-screen">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>User Account Management</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Manage campus administrators, dispatch technicians, staff, and student accounts
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({
                  username: '',
                  email: '',
                  phone: '',
                  password: '',
                  role: 'User',
                  department: '',
                  programme: '',
                });
              }
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add User'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <div className="action-panel glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit User Account' : 'Create New User Account'}
          </h3>
          <form onSubmit={handleSubmit} className="master-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. user@campus.edu"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone / Mobile</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label>
                  Password {editingId && '(Leave blank to retain current)'} {!editingId && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editingId}
                />
              </div>

              <div className="form-group">
                <label>Role Assignment *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">-- No Department Assigned --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create User'}
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
          placeholder="🔍 Search users by name, email, role..."
          className="master-search-input"
        />
        <span className="item-count-badge">
          Showing {filtered.length} of {users.length} Users
        </span>
      </div>

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Department</th>
              {user?.role === 'SuperAdmin' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No users found matching query.</div>
                </td>
              </tr>
            ) : (
              filtered.map((userData) => (
                <tr key={userData._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white' }}>{userData.username}</div>
                  </td>
                  <td>{userData.email}</td>
                  <td>{userData.phone || '-'}</td>
                  <td>
                    <span className="table-code-badge" style={{ color: 'var(--primary-light)' }}>
                      {userData.role}
                    </span>
                  </td>
                  <td>{userData.department?.name || '-'}</td>
                  {user?.role === 'SuperAdmin' && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button onClick={() => handleEdit(userData)} className="btn-outline btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(userData._id)} className="btn-danger btn-sm">
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

export default UserPage;
