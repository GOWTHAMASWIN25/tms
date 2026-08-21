import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { roleService } from '../services/api';
import './MasterScreen.css';

const RolePage = () => {
  const { user } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchRoles();
    }
  }, [user]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAll();
      setRoles(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch roles');
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
      } else {
        await roleService.create(data);
      }
      setFormData({ name: '', description: '', permissions: '' });
      setEditingId(null);
      setShowForm(false);
      fetchRoles();
    } catch (err) {
      setError('Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.join(', ') || ''
    });
    setEditingId(role._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await roleService.delete(id);
        fetchRoles();
      } catch (err) {
        setError('Failed to delete role');
      }
    }
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Role Management</h1>
        {user?.role === 'SuperAdmin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Role'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <form onSubmit={handleSubmit} className="master-form">
          <div className="form-group">
            <label>Role Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Electrician"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label>Permissions (comma separated)</label>
            <textarea
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
              rows="3"
              placeholder="e.g., view_complaints, assign_tasks, approve_work"
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>Permissions</th>
              {user?.role === 'SuperAdmin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role._id}>
                <td>{role.name}</td>
                <td>{role.description || '-'}</td>
                <td>{role.permissions?.join(', ') || '-'}</td>
                {user?.role === 'SuperAdmin' && (
                  <td>
                    <button onClick={() => handleEdit(role)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(role._id)} className="btn-delete">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolePage;
