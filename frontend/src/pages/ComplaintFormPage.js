import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { complaintService, blockService, roomService, departmentService } from '../services/api';
import './MasterScreen.css';

const complaintTypes = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

const ComplaintFormPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const resp = await departmentService.getAll();
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setDepartments(list);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load departments');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch blocks when department is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!departmentId) {
        setBlocks([]);
        setBlockId('');
        return;
      }
      setLoadingData(true);
      try {
        const resp = await blockService.getAll({ departmentId });
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setBlocks(list);
      } catch (err) {
        console.error('Failed to fetch blocks:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load blocks');
      } finally {
        setLoadingData(false);
      }
    };
    fetchBlocks();
    setBlockId('');
    setRoomId('');
    setFilteredRooms([]);
  }, [departmentId]);

  // Fetch rooms when block is selected
  useEffect(() => {
    const fetchRooms = async () => {
      if (!blockId) {
        setFilteredRooms([]);
        setRoomId('');
        return;
      }
      setLoadingData(true);
      try {
        const resp = await roomService.getAll({ blockId });
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setFilteredRooms(list);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load rooms');
      } finally {
        setLoadingData(false);
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);
  const [type, setType] = useState(complaintTypes[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only allow SuperAdmin and regular Users to create complaints
  if (user && !['SuperAdmin', 'User'].includes(user.role)) {
    return (
      <div className="master-screen">
        <div className="card">
          <h2>Raise Complaint</h2>
          <div className="error-message">You do not have permission to raise complaints.</div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedDepartment = departments.find((d) => d._id === departmentId);
      const selectedBlock = blocks.find((b) => b._id === blockId);
      const selectedRoom = filteredRooms.find((r) => r._id === roomId);

      // validate room or custom room number
      const finalRoomNumber = roomId === '__manual__' ? customRoomNumber : (selectedRoom?.roomNumber || '');
      if (!finalRoomNumber) {
        setError('Please select a room or enter a room number');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('departmentName', selectedDepartment?.name || '');
      formData.append('blockName', selectedBlock?.name || '');
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks);
      if (attachment) formData.append('attachment', attachment);
      // user details come from token (backend should use req.user)
      // but include user id here as convenience
      if (user?.id) formData.append('userId', user.id);

      await complaintService.create(formData);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Raise Ticket</h1>
        <button className="btn-outline" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="action-panel glass-card">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="detail-item">
            <label>Infrastructure Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required disabled={loadingData}>
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-item">
            <label>Block / Building</label>
            <select value={blockId} onChange={(e) => setBlockId(e.target.value)} required disabled={!departmentId || loadingData}>
              <option value="">-- Select Block --</option>
              {blocks.map((block) => (
                <option key={block._id} value={block._id}>
                  {block.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-item">
            <label>Specific Location / Room</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!blockId || loadingData}>
              <option value="">-- Select Room --</option>
              {filteredRooms.map((room) => {
                const blockName = room.block?.name || (blocks.find(b => String(b._id) === String(room.block))?.name) || '';
                const label = blockName ? `${blockName} - ${room.roomNumber}` : room.roomNumber;
                return (
                  <option key={room._id} value={room._id}>
                    {label}
                  </option>
                );
              })}
              <option value="__manual__">Other (enter manually)</option>
            </select>
          </div>

          {(roomId === '__manual__' || filteredRooms.length === 0) && (
            <div className="detail-item">
              <label>Manual Room Entry</label>
              <input value={customRoomNumber} onChange={(e) => setCustomRoomNumber(e.target.value)} placeholder="e.g. R-101" required />
            </div>
          )}

          <div className="detail-item">
            <label>Problem Category</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {complaintTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <label>Description of Issue</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Please describe the problem in detail..."
              style={{ minHeight: '120px' }}
            />
          </div>

          <div className="detail-item">
            <label>Evidence / Photo (Optional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="btn-outline" />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '16px 40px' }}>
              {loading ? 'Processing...' : 'Submit Resolution Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintFormPage;
