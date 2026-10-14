import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { roomService, departmentService, programmeService, blockService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const RoomPage = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    department: '',
    programme: '',
    block: '',
    floor: '',
    capacity: '',
    description: '',
  });
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
      const [roomRes, deptRes, progRes, blockRes] = await Promise.all([
        roomService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
        blockService.getAll(),
      ]);
      setRooms(roomRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
      setBlocks(blockRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      addToast('Failed to load rooms data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await roomService.update(editingId, formData);
        addToast('Room updated successfully', 'success');
      } else {
        await roomService.create(formData);
        addToast('Room created successfully', 'success');
      }
      setFormData({
        roomNumber: '',
        department: '',
        programme: '',
        block: '',
        floor: '',
        capacity: '',
        description: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to save room');
      addToast('Failed to save room', 'error');
    }
  };

  const handleEdit = (room) => {
    setFormData({
      roomNumber: room.roomNumber,
      department: room.department?._id || room.department || '',
      programme: room.programme?._id || room.programme || '',
      block: room.block?._id || room.block || '',
      floor: room.floor || '',
      capacity: room.capacity || '',
      description: room.description || '',
    });
    setEditingId(room._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.delete(id);
        addToast('Room deleted', 'info');
        fetchData();
      } catch (err) {
        setError('Failed to delete room');
        addToast('Failed to delete room', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return rooms;
    const term = searchTerm.toLowerCase();
    return rooms.filter(
      (r) =>
        (r.roomNumber || '').toLowerCase().includes(term) ||
        (r.block?.name || '').toLowerCase().includes(term) ||
        (r.department?.name || '').toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term)
    );
  }, [rooms, searchTerm]);

  if (loading) {
    return (
      <div className="master-screen">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Classroom & Lab Directory</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Manage classrooms, computer laboratories, seminar halls, and faculty rooms
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({
                  roomNumber: '',
                  department: '',
                  programme: '',
                  block: '',
                  floor: '',
                  capacity: '',
                  description: '',
                });
              }
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Room'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <div className="action-panel glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Room' : 'Create New Room / Lab'}
          </h3>
          <form onSubmit={handleSubmit} className="master-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Room Number / Code *</label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. 302 or Lab-B"
                  required
                />
              </div>

              <div className="form-group">
                <label>Block / Building *</label>
                <select
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  required
                >
                  <option value="">-- Select Block --</option>
                  {blocks.map((block) => (
                    <option key={block._id} value={block._id}>
                      {block.name}
                    </option>
                  ))}
                </select>
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
                <label>Floor / Level</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g. 3rd Floor"
                />
              </div>

              <div className="form-group">
                <label>Seating Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g. 60"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description (Equipment & Facilities)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Smart projector, 45 Dell Core i7 terminals, 2 AC units..."
                rows="3"
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create Room'}
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
          placeholder="🔍 Search rooms by number, block..."
          className="master-search-input"
        />
        <span className="item-count-badge">
          Showing {filtered.length} of {rooms.length} Rooms
        </span>
      </div>

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Block</th>
              <th>Department</th>
              <th>Floor</th>
              <th>Capacity</th>
              {user?.role === 'SuperAdmin' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No rooms found.</div>
                </td>
              </tr>
            ) : (
              filtered.map((room) => (
                <tr key={room._id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'white' }}>Room {room.roomNumber}</div>
                  </td>
                  <td>{room.block?.name || '-'}</td>
                  <td>{room.department?.name || '-'}</td>
                  <td>{room.floor || 'Ground'}</td>
                  <td>{room.capacity ? `${room.capacity} seats` : '-'}</td>
                  {user?.role === 'SuperAdmin' && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button onClick={() => handleEdit(room)} className="btn-outline btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(room._id)} className="btn-danger btn-sm">
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

export default RoomPage;
