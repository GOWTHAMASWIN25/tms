import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { departmentService } from '../services/api';
import './MasterScreen.css';

const DepartmentPage = () => {
  const { user } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortName: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchDepartments();
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll();
      setDepartments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // client-side validation for shortName length (2-8 chars)
    const shortLen = (formData.shortName || '').trim().length;
    if (shortLen < 2 || shortLen > 8) {
      setError('Short Name must be between 2 and 8 characters');
      return;
    }

    try {
      if (editingId) {
        await departmentService.update(editingId, formData);
      } else {
        await departmentService.create(formData);
      }
      setFormData({ name: '', shortName: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      setError('Failed to save department');
    }
  };

  const handleEdit = (department) => {
    setFormData(department);
    setEditingId(department._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await departmentService.delete(id);
        fetchDepartments();
      } catch (err) {
        setError('Failed to delete department');
      }
    }
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Department Management</h1>
        {user?.role === 'SuperAdmin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Department'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <form onSubmit={handleSubmit} className="master-form">
          <div className="form-group">
            <label>Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Short Name</label>
            <input
              type="text"
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              required
              minLength="2"
              maxLength="8"
              placeholder="2-8 chars"
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
          <button type="submit" className="btn-primary">
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Short Name</th>
              <th>Description</th>
              {user?.role === 'SuperAdmin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept._id}>
                <td>{dept.name}</td>
                <td>{dept.shortName}</td>
                <td>{dept.description || '-'}</td>
                {user?.role === 'SuperAdmin' && (
                  <td>
                    <button onClick={() => handleEdit(dept)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(dept._id)} className="btn-delete">Delete</button>
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

export default DepartmentPage;
