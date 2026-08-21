import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { blockService, departmentService, programmeService } from '../services/api';
import './MasterScreen.css';

const BlockPage = () => {
  const { user } = useContext(AuthContext);
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: '', programme: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [blockRes, deptRes, progRes] = await Promise.all([
        blockService.getAll(),
        departmentService.getAll(),
        programmeService.getAll()
      ]);
      setBlocks(blockRes.data);
      setDepartments(deptRes.data);
      setProgrammes(progRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await blockService.update(editingId, formData);
      } else {
        await blockService.create(formData);
      }
      setFormData({ name: '', department: '', programme: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to save block');
    }
  };

  const handleEdit = (block) => {
    setFormData({...block, department: block.department?._id || block.department, programme: block.programme?._id || block.programme});
    setEditingId(block._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await blockService.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete block');
      }
    }
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Block Management</h1>
        {user?.role === 'SuperAdmin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Block'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <form onSubmit={handleSubmit} className="master-form">
          <div className="form-group">
            <label>Block Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Programme</label>
            <select
              value={formData.programme}
              onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
              required
            >
              <option value="">Select Programme</option>
              {programmes.map((prog) => (
                <option key={prog._id} value={prog._id}>{prog.name}</option>
              ))}
            </select>
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
              <th>Block Name</th>
              <th>Department</th>
              <th>Programme</th>
              <th>Description</th>
              {user?.role === 'SuperAdmin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block._id}>
                <td>{block.name}</td>
                <td>{block.department?.name || '-'}</td>
                <td>{block.programme?.name || '-'}</td>
                <td>{block.description || '-'}</td>
                {user?.role === 'SuperAdmin' && (
                  <td>
                    <button onClick={() => handleEdit(block)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(block._id)} className="btn-delete">Delete</button>
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

export default BlockPage;
