import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { blockService, departmentService, programmeService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const BlockPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: '', programme: '', description: '' });
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
      const [blockRes, deptRes, progRes] = await Promise.all([
        blockService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setBlocks(blockRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      addToast('Failed to load blocks data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await blockService.update(editingId, formData);
        addToast('Block updated successfully', 'success');
      } else {
        await blockService.create(formData);
        addToast('Block created successfully', 'success');
      }
      setFormData({ name: '', department: '', programme: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to save block');
      addToast('Failed to save block', 'error');
    }
  };

  const handleEdit = (block) => {
    setFormData({
      name: block.name,
      department: block.department?._id || block.department || '',
      programme: block.programme?._id || block.programme || '',
      description: block.description || '',
    });
    setEditingId(block._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this block?')) {
      try {
        await blockService.delete(id);
        addToast('Block deleted', 'info');
        fetchData();
      } catch (err) {
        setError('Failed to delete block');
        addToast('Failed to delete block', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return blocks;
    const term = searchTerm.toLowerCase();
    return blocks.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(term) ||
        (b.department?.name || '').toLowerCase().includes(term) ||
        (b.programme?.name || '').toLowerCase().includes(term) ||
        (b.description || '').toLowerCase().includes(term)
    );
  }, [blocks, searchTerm]);

  if (loading) {
    return (
      <div className="master-screen">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading blocks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Block / Building Directory</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Manage campus academic towers, complexes, and facilities
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({ name: '', department: '', programme: '', description: '' });
              }
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Block'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <div className="action-panel glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Block' : 'Create New Block'}
          </h3>
          <form onSubmit={handleSubmit} className="master-form">
            <div className="form-group">
              <label>Block / Building Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Science Block A"
                required
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
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
              <label>Programme (Optional)</label>
              <select
                value={formData.programme}
                onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
              >
                <option value="">-- Select Programme --</option>
                {programmes.map((prog) => (
                  <option key={prog._id} value={prog._id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details such as floors, labs, or wing notes..."
                rows="3"
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create Block'}
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
          placeholder="🔍 Search blocks by name, department..."
          className="master-search-input"
        />
        <span className="item-count-badge">
          Showing {filtered.length} of {blocks.length} Blocks
        </span>
      </div>

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Block Name</th>
              <th>Department</th>
              <th>Programme</th>
              <th>Description</th>
              {user?.role === 'SuperAdmin' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No campus blocks found.</div>
                </td>
              </tr>
            ) : (
              filtered.map((block) => (
                <tr key={block._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white' }}>{block.name}</div>
                  </td>
                  <td>{block.department?.name || '-'}</td>
                  <td>{block.programme?.name || '-'}</td>
                  <td>{block.description || '-'}</td>
                  {user?.role === 'SuperAdmin' && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button onClick={() => handleEdit(block)} className="btn-outline btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(block._id)} className="btn-danger btn-sm">
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

export default BlockPage;
