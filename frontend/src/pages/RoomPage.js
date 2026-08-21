import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { roomService, departmentService, programmeService, blockService } from '../services/api';
import './MasterScreen.css';

const RoomPage = () => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    roomNumber: '', department: '', programme: '', block: '', floor: '', capacity: '', description: '' 
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomRes, deptRes, progRes, blockRes] = await Promise.all([
        roomService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
        blockService.getAll()
      ]);
      setRooms(roomRes.data);
      setDepartments(deptRes.data);
      setProgrammes(progRes.data);
      setBlocks(blockRes.data);
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
        await roomService.update(editingId, formData);
      } else {
        await roomService.create(formData);
      }
      setFormData({ roomNumber: '', department: '', programme: '', block: '', floor: '', capacity: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to save room');
    }
  };

  const handleEdit = (room) => {
    setFormData({
      ...room,
      department: room.department?._id || room.department,
      programme: room.programme?._id || room.programme,
      block: room.block?._id || room.block
    });
    setEditingId(room._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await roomService.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete room');
      }
    }
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Room Management</h1>
        {user?.role === 'SuperAdmin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Room'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <form onSubmit={handleSubmit} className="master-form">
          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              required
              placeholder="e.g., 123"
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
            <label>Block</label>
            <select
              value={formData.block}
              onChange={(e) => setFormData({ ...formData, block: e.target.value })}
              required
            >
              <option value="">Select Block</option>
              {blocks.map((block) => (
                <option key={block._id} value={block._id}>{block.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Floor</label>
            <input
              type="number"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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
              <th>Room Number</th>
              <th>Department</th>
              <th>Programme</th>
              <th>Block</th>
              <th>Floor</th>
              <th>Capacity</th>
              {user?.role === 'SuperAdmin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room._id}>
                <td>{room.roomNumber}</td>
                <td>{room.department?.name || '-'}</td>
                <td>{room.programme?.name || '-'}</td>
                <td>{room.block?.name || '-'}</td>
                <td>{room.floor || '-'}</td>
                <td>{room.capacity || '-'}</td>
                {user?.role === 'SuperAdmin' && (
                  <td>
                    <button onClick={() => handleEdit(room)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(room._id)} className="btn-delete">Delete</button>
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

export default RoomPage;
