import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { complaintService, blockService, roomService, departmentService } from '../services/api';
import { useToast } from '../components/Toast';
import './MasterScreen.css';

const complaintTypes = [
  { label: 'PC Hardware', icon: '💻' },
  { label: 'PC Software', icon: '💿' },
  { label: 'Application Issues', icon: '📱' },
  { label: 'Network', icon: '🌐' },
  { label: 'Electronics', icon: '⚡' },
  { label: 'Plumbing', icon: '🚰' },
  { label: 'Other', icon: '🛠' },
];

const priorityLevels = [
  { level: 'Urgent', desc: 'Critical blocker / exam or server failure', color: 'var(--prio-urgent)' },
  { level: 'High', desc: 'Major issue affecting classroom or lab', color: 'var(--prio-high)' },
  { level: 'Medium', desc: 'Normal issue / partial functionality', color: 'var(--prio-med)' },
  { level: 'Low', desc: 'Minor cosmetic or non-urgent request', color: 'var(--prio-low)' },
];

const ComplaintFormPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [contactPhone, setContactPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [type, setType] = useState('PC Hardware');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('Failed to load campus departments');
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
        setError('Failed to load blocks');
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
        setError('Failed to load rooms');
      } finally {
        setLoadingData(false);
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAttachment(file);
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedDepartment = departments.find((d) => d._id === departmentId);
      const selectedBlock = blocks.find((b) => b._id === blockId);
      const selectedRoom = filteredRooms.find((r) => r._id === roomId);

      const finalRoomNumber = roomId === '__manual__' ? customRoomNumber : (selectedRoom?.roomNumber || '');
      if (!finalRoomNumber) {
        setError('Please select a room or enter a manual room number');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', title.trim() || `${type} in ${selectedBlock?.name || ''} - ${finalRoomNumber}`);
      formData.append('priority', priority);
      formData.append('contactPhone', contactPhone.trim());
      formData.append('departmentName', selectedDepartment?.name || '');
      formData.append('blockName', selectedBlock?.name || '');
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks);
      if (attachment) formData.append('attachment', attachment);
      if (user?.id) formData.append('userId', user.id);

      await complaintService.create(formData);
      addToast('Ticket raised successfully! Technicians notified.', 'success');

      // Navigate to tickets dashboard
      navigate(user?.role === 'SuperAdmin' ? '/complaints' : '/my-complaints');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-screen fade-in">
      <div className="screen-header">
        <div>
          <h1>Raise Support Ticket</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Submit an infrastructure issue for rapid campus technical dispatch
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="action-panel glass-card">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="ticket-form-layout">
          {/* Section 1: Ticket Essentials */}
          <div className="form-section-title">
            <span>01</span> Basic Details & Urgency
          </div>

          <div className="form-grid-2col">
            <div className="form-group full-width">
              <label>Ticket Summary / Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lab 3 Projector not detecting HDMI, or AC water leakage"
                required
              />
            </div>

            <div className="form-group">
              <label>Problem Category *</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {complaintTypes.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Contact Phone / Extension</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +91 9876543210 or Ext. 402"
              />
            </div>
          </div>

          {/* Priority Selection Cards */}
          <div className="form-group full-width">
            <label>Priority SLA Level *</label>
            <div className="priority-selector-grid">
              {priorityLevels.map((p) => {
                const isSelected = priority === p.level;
                return (
                  <div
                    key={p.level}
                    className={`priority-select-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--prio-color': p.color }}
                    onClick={() => setPriority(p.level)}
                  >
                    <div className="psc-header">
                      <span className={`priority-badge priority-${p.level.toLowerCase()}`}>
                        {p.level}
                      </span>
                      {isSelected && <span className="psc-check">✓</span>}
                    </div>
                    <div className="psc-desc">{p.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="form-section-title">
            <span>02</span> Campus Location
          </div>

          <div className="form-grid-3col">
            <div className="form-group">
              <label>Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                disabled={loadingData}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.shortName || 'Dept'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Block / Building *</label>
              <select
                value={blockId}
                onChange={(e) => setBlockId(e.target.value)}
                required
                disabled={!departmentId || loadingData}
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
              <label>Room Number *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={!blockId || loadingData}
              >
                <option value="">-- Select Room --</option>
                {filteredRooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    Room {room.roomNumber}
                  </option>
                ))}
                <option value="__manual__">Manual Room Entry...</option>
              </select>
            </div>
          </div>

          {(roomId === '__manual__' || (blockId && filteredRooms.length === 0)) && (
            <div className="form-group">
              <label>Custom Room / Location Name *</label>
              <input
                value={customRoomNumber}
                onChange={(e) => setCustomRoomNumber(e.target.value)}
                placeholder="e.g. Server Room B or Hall 401"
                required
              />
            </div>
          )}

          {/* Section 3: Detailed Description & Photo */}
          <div className="form-section-title">
            <span>03</span> Problem Details & Attachment
          </div>

          <div className="form-group full-width">
            <label>Detailed Description</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide exact symptoms, error messages, asset serial numbers, or steps taken..."
              rows={4}
            />
          </div>

          <div className="form-group full-width">
            <label>Attachment / Evidence (Photo, Screenshot, or PDF)</label>
            <div className="attachment-dropzone">
              <input
                type="file"
                id="file-upload"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="dropzone-label">
                <span className="dropzone-icon">📎</span>
                <span className="dropzone-text">
                  {attachment ? attachment.name : 'Click to browse image or document'}
                </span>
                <span className="dropzone-sub">Supports JPG, PNG, WEBP, PDF up to 10MB</span>
              </label>

              {previewUrl && (
                <div className="image-preview-box">
                  <img src={previewUrl} alt="Upload preview" />
                  <button
                    type="button"
                    className="preview-remove-btn"
                    onClick={() => {
                      setAttachment(null);
                      setPreviewUrl(null);
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="form-footer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary submit-ticket-btn"
            >
              {loading ? 'Submitting Ticket...' : '⚡ Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .ticket-form-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.75rem;
          margin-top: 0.5rem;
        }

        .form-section-title span {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.2);
          color: var(--primary-light);
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .form-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .form-grid-3col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.25rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        /* Priority selector */
        .priority-selector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .priority-select-card {
          padding: 1rem 1.25rem;
          border-radius: 14px;
          background: rgba(13, 20, 36, 0.6);
          border: 1px solid var(--glass-border);
          cursor: pointer;
          transition: var(--transition);
        }

        .priority-select-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .priority-select-card.selected {
          background: rgba(25, 35, 62, 0.85);
          border-color: var(--prio-color);
          box-shadow: 0 0 15px -3px var(--prio-color);
        }

        .psc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .psc-check {
          color: #10b981;
          font-weight: 800;
        }

        .psc-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Dropzone */
        .attachment-dropzone {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          background: rgba(13, 20, 36, 0.5);
          cursor: pointer;
          transition: var(--transition);
          text-align: center;
        }

        .dropzone-label:hover {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
        }

        .dropzone-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .dropzone-text {
          font-weight: 600;
          color: white;
          font-size: 0.95rem;
        }

        .dropzone-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .image-preview-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .image-preview-box img {
          max-width: 140px;
          max-height: 90px;
          border-radius: 8px;
          object-fit: cover;
        }

        .preview-remove-btn {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 6px 12px;
          font-size: 0.8rem;
          border-radius: 8px;
        }

        /* Footer */
        .form-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--glass-border);
        }

        .submit-ticket-btn {
          padding: 13px 32px;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .form-grid-2col, .form-grid-3col {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
};

export default ComplaintFormPage;
