import React, { useState } from 'react';
import { complaintService } from '../services/api';
import { useToast } from './Toast';

const TicketDetailModal = ({ complaint, currentUser, allUsers, onClose, onRefresh }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'timeline' | 'action'
  const [newStatus, setNewStatus] = useState(complaint?.status || 'Pending');
  const [resolutionNotes, setResolutionNotes] = useState(complaint?.resolutionNotes || '');
  const [assigneeId, setAssigneeId] = useState(complaint?.assignedTo?._id || '');
  const [noteContent, setNoteContent] = useState('');
  const [rating, setRating] = useState(complaint?.rating || 5);
  const [feedback, setFeedback] = useState(complaint?.feedback || '');
  const [loadingAction, setLoadingAction] = useState(false);

  if (!complaint) return null;

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const isAssignee =
    complaint.assignedTo &&
    String(complaint.assignedTo._id || complaint.assignedTo) === String(currentUser?.id || currentUser?._id);
  const isCreator =
    complaint.createdBy &&
    String(complaint.createdBy._id || complaint.createdBy) === String(currentUser?.id || currentUser?._id);

  // Stepper calculations
  const statuses = ['Pending', 'Assigned', 'In-Progress', 'Closed'];
  const currentStepIndex = statuses.indexOf(complaint.status);

  // Handle Status Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await complaintService.updateStatus(complaint._id, newStatus, resolutionNotes);
      addToast(`Status updated to ${newStatus}`, 'success');
      onRefresh();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Assignee
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assigneeId) return addToast('Select an assignee first', 'warning');
    setLoadingAction(true);
    try {
      await complaintService.assign(complaint._id, assigneeId);
      addToast('Ticket assigned successfully', 'success');
      onRefresh();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to assign ticket', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Add Timeline Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setLoadingAction(true);
    try {
      await complaintService.addNote(complaint._id, noteContent.trim());
      addToast('Progress note logged to timeline', 'success');
      setNoteContent('');
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add note', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Submit Rating & Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await complaintService.addFeedback(complaint._id, rating, feedback);
      addToast('Thank you for rating our service!', 'success');
      onRefresh();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit feedback', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const ticketCode = `#TMS-${complaint._id ? complaint._id.slice(-6).toUpperCase() : '0000'}`;
  const attachmentUrl = complaint.attachment
    ? `http://localhost:5000${complaint.attachment.startsWith('/') ? '' : '/'}${complaint.attachment}`
    : null;

  return (
    <div className="tms-modal-backdrop" onClick={onClose}>
      <div className="tms-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="tms-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="ticket-code-pill">{ticketCode}</span>
              <span className={`priority-badge priority-${(complaint.priority || 'Medium').toLowerCase()}`}>
                {complaint.priority || 'Medium'}
              </span>
              <span className={`status-badge status-${complaint.status.toLowerCase()}`}>
                {complaint.status}
              </span>
            </div>
            <h2>{complaint.title || `${complaint.complaintType} - ${complaint.blockName}`}</h2>
          </div>
          <button className="tms-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="stepper-wrapper">
          <div className="stepper-track">
            {statuses.map((st, idx) => {
              const isPastOrCurrent = currentStepIndex >= idx || complaint.status === 'Closed';
              const isCurrent = complaint.status === st;
              return (
                <div key={st} className={`stepper-step ${isPastOrCurrent ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-circle">
                    {isPastOrCurrent && !isCurrent ? '✓' : idx + 1}
                  </div>
                  <span className="step-label">{st === 'Closed' ? 'Resolved' : st}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Nav Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Ticket Overview
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            🕒 Audit Timeline ({complaint.timeline?.length || 1})
          </button>
          {(isSuperAdmin || isAssignee || (isCreator && complaint.status === 'Closed')) && (
            <button
              className={`modal-tab-btn ${activeTab === 'action' ? 'active' : ''}`}
              onClick={() => setActiveTab('action')}
            >
              ⚡ Manage / Rate
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="tms-modal-body">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="modal-tab-pane">
              <div className="modal-meta-grid">
                <div className="meta-card">
                  <div className="meta-card-label">Campus Location</div>
                  <div className="meta-card-value">
                    {complaint.departmentName ? `${complaint.departmentName} · ` : ''}
                    {complaint.blockName} — Room {complaint.roomNumber}
                  </div>
                </div>

                <div className="meta-card">
                  <div className="meta-card-label">Category</div>
                  <div className="meta-card-value">{complaint.complaintType}</div>
                </div>

                <div className="meta-card">
                  <div className="meta-card-label">Reported By</div>
                  <div className="meta-card-value">
                    {complaint.createdBy?.username || 'User'}
                    {complaint.createdBy?.email && ` (${complaint.createdBy.email})`}
                  </div>
                  {complaint.contactPhone && (
                    <div className="meta-card-sub">Phone: {complaint.contactPhone}</div>
                  )}
                </div>

                <div className="meta-card">
                  <div className="meta-card-label">Assigned Technician</div>
                  <div className="meta-card-value">
                    {complaint.assignedTo ? (
                      <span style={{ color: 'var(--primary-light)' }}>
                        👤 {complaint.assignedTo.username} ({complaint.assignedTo.role || 'Staff'})
                      </span>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="meta-card">
                  <div className="meta-card-label">Created Date</div>
                  <div className="meta-card-value">
                    {new Date(complaint.createdAt).toLocaleString()}
                  </div>
                </div>

                {complaint.resolvedAt && (
                  <div className="meta-card">
                    <div className="meta-card-label">Resolved At</div>
                    <div className="meta-card-value" style={{ color: 'var(--status-closed)' }}>
                      {new Date(complaint.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks / Description */}
              <div className="modal-description-box">
                <h4>Description / Issue Notes</h4>
                <p>{complaint.remarks || 'No detailed remarks provided.'}</p>
              </div>

              {/* Resolution Notes */}
              {complaint.resolutionNotes && (
                <div className="modal-resolution-box">
                  <h4>🛠 Resolution Summary</h4>
                  <p>{complaint.resolutionNotes}</p>
                </div>
              )}

              {/* User Rating / Feedback */}
              {complaint.rating && (
                <div className="modal-rating-display">
                  <div className="mrd-stars">
                    {'★'.repeat(complaint.rating)}{'☆'.repeat(5 - complaint.rating)}
                    <span className="mrd-num">({complaint.rating} / 5)</span>
                  </div>
                  {complaint.feedback && <p className="mrd-quote">"{complaint.feedback}"</p>}
                </div>
              )}

              {/* Attachment Preview */}
              {attachmentUrl && (
                <div className="modal-attachment-box">
                  <h4>Attached Evidence</h4>
                  <div className="attachment-row">
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      📎 View Full Attachment
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="modal-tab-pane">
              <div className="timeline-container">
                {(complaint.timeline && complaint.timeline.length > 0 ? complaint.timeline : [
                  {
                    action: 'Ticket Created',
                    status: 'Pending',
                    note: complaint.remarks || 'Ticket created',
                    byName: complaint.createdBy?.username || 'User',
                    timestamp: complaint.createdAt,
                  }
                ]).map((tl, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content glass">
                      <div className="tl-head">
                        <span className="tl-action">{tl.action}</span>
                        <span className="tl-time">
                          {new Date(tl.timestamp || complaint.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {tl.note && <div className="tl-note">{tl.note}</div>}
                      <div className="tl-by">By: {tl.byName || 'System'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Progress Note Form */}
              <form onSubmit={handleAddNote} className="add-note-box">
                <input
                  type="text"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a progress update note..."
                />
                <button type="submit" disabled={loadingAction || !noteContent.trim()} className="btn btn-primary btn-sm">
                  Add Note
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ACTIONS & RATING */}
          {activeTab === 'action' && (
            <div className="modal-tab-pane">
              {/* SuperAdmin Assign */}
              {isSuperAdmin && (
                <form onSubmit={handleAssign} className="action-subcard glass">
                  <h4>Assign Technician</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem' }}>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      required
                    >
                      <option value="">Select Technician / Staff</option>
                      {allUsers
                        ?.filter((u) => u.role !== 'SuperAdmin')
                        .map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.username} ({u.role || 'Staff'})
                          </option>
                        ))}
                    </select>
                    <button type="submit" disabled={loadingAction} className="btn-primary">
                      Assign
                    </button>
                  </div>
                </form>
              )}

              {/* Status Update (Staff & Admin) */}
              {(isSuperAdmin || isAssignee) && (
                <form onSubmit={handleStatusUpdate} className="action-subcard glass" style={{ marginTop: '1.25rem' }}>
                  <h4>Update Work Order Status</h4>
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label>Select New Status</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Onhold">Onhold</option>
                      <option value="Closed">Resolved (Closed)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Resolution Summary / Notes</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Explain repairs completed or reason for delay..."
                      rows={3}
                    />
                  </div>

                  <button type="submit" disabled={loadingAction} className="btn-primary" style={{ width: '100%' }}>
                    {loadingAction ? 'Updating...' : 'Save Status Update'}
                  </button>
                </form>
              )}

              {/* User Rating / Feedback (If Closed) */}
              {complaint.status === 'Closed' && (isCreator || isSuperAdmin) && (
                <form onSubmit={handleSubmitFeedback} className="action-subcard glass" style={{ marginTop: '1.25rem' }}>
                  <h4>⭐ Rate Technician Resolution Quality</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Share your experience with how swiftly and effectively this ticket was resolved.
                  </p>

                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`star-choice ${rating >= s ? 'filled' : ''}`}
                        onClick={() => setRating(s)}
                      >
                        ★
                      </span>
                    ))}
                    <span className="star-rating-label">{rating} of 5 Stars</span>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Comments / Review</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Great service, technician solved the issue promptly..."
                      rows={3}
                    />
                  </div>

                  <button type="submit" disabled={loadingAction} className="btn-primary" style={{ width: '100%' }}>
                    {loadingAction ? 'Submitting...' : 'Submit Resolution Review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="tms-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .ticket-code-pill {
          font-family: monospace;
          font-weight: 700;
          font-size: 0.85rem;
          color: #c7d2fe;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          padding: 3px 8px;
          border-radius: 6px;
        }

        /* Stepper */
        .stepper-wrapper {
          padding: 1rem 2rem;
          background: rgba(13, 20, 36, 0.5);
          border-bottom: 1px solid var(--glass-border);
        }

        .stepper-track {
          display: flex;
          justify-content: space-between;
          position: relative;
        }

        .stepper-track::before {
          content: '';
          position: absolute;
          top: 14px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }

        .stepper-step {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #1e293b;
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: #94a3b8;
          transition: var(--transition);
        }

        .stepper-step.active .step-circle {
          background: var(--primary);
          border-color: #818cf8;
          color: white;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
        }

        .stepper-step.current .step-circle {
          background: #10b981;
          border-color: #34d399;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .stepper-step.active .step-label {
          color: white;
        }

        /* Tabs */
        .modal-tabs {
          display: flex;
          gap: 6px;
          padding: 0.75rem 2rem 0;
          border-bottom: 1px solid var(--glass-border);
        }

        .modal-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          box-shadow: none;
          cursor: pointer;
        }

        .modal-tab-btn.active {
          color: white;
          background: rgba(255, 255, 255, 0.06);
          border-bottom: 2px solid var(--primary);
        }

        /* Meta Grid */
        .modal-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .meta-card {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          background: rgba(13, 20, 36, 0.6);
          border: 1px solid var(--glass-border);
        }

        .meta-card-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .meta-card-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
        }

        .meta-card-sub {
          font-size: 0.8rem;
          color: var(--primary-light);
          margin-top: 4px;
        }

        .modal-description-box, .modal-resolution-box, .modal-attachment-box {
          padding: 1.25rem;
          border-radius: 14px;
          background: rgba(13, 20, 36, 0.6);
          border: 1px solid var(--glass-border);
          margin-bottom: 1.25rem;
        }

        .modal-description-box h4, .modal-resolution-box h4, .modal-attachment-box h4 {
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }

        .modal-resolution-box {
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }

        .modal-rating-display {
          padding: 1rem 1.25rem;
          border-radius: 14px;
          background: rgba(234, 179, 8, 0.08);
          border: 1px solid rgba(234, 179, 8, 0.3);
          margin-bottom: 1.25rem;
        }

        .mrd-stars {
          color: #fbbf24;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mrd-num {
          font-size: 0.85rem;
          color: white;
          font-weight: 700;
        }

        .mrd-quote {
          font-style: italic;
          color: #cbd5e1;
          margin-top: 0.5rem;
          font-size: 0.92rem;
        }

        /* Timeline */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          padding-left: 20px;
          margin-bottom: 1.5rem;
        }

        .timeline-container::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: rgba(255, 255, 255, 0.1);
        }

        .timeline-item {
          position: relative;
        }

        .timeline-marker {
          position: absolute;
          left: -20px;
          top: 14px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--primary);
          border: 3px solid #0f172a;
          box-shadow: 0 0 8px var(--primary);
        }

        .timeline-content {
          padding: 1rem 1.25rem;
          border-radius: 14px;
        }

        .tl-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .tl-action {
          font-weight: 700;
          color: white;
          font-size: 0.92rem;
        }

        .tl-time {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .tl-note {
          font-size: 0.88rem;
          color: #cbd5e1;
          margin: 6px 0;
        }

        .tl-by {
          font-size: 0.78rem;
          color: var(--primary-light);
        }

        .add-note-box {
          display: flex;
          gap: 10px;
        }

        /* Action Cards */
        .action-subcard {
          padding: 1.5rem;
          border-radius: 16px;
        }

        .action-subcard h4 {
          font-size: 1.05rem;
          color: white;
          margin: 0;
        }

        /* Star Picker */
        .star-picker {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .star-choice {
          font-size: 2rem;
          color: #475569;
          cursor: pointer;
          transition: var(--transition);
        }

        .star-choice.filled {
          color: #fbbf24;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }

        .star-rating-label {
          margin-left: 10px;
          font-weight: 700;
          color: white;
          font-size: 0.95rem;
        }
      `}} />
    </div>
  );
};

export default TicketDetailModal;
