import React, { useState, useEffect } from 'react';
import { approvalService } from '../services/approval';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  Tag, 
  Folder, 
  User, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Approvals = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL
  const [searchTerm, setSearchTerm] = useState('');

  // Action Modals State
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [approving, setApproving] = useState(false);

  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [deleteModalReq, setDeleteModalReq] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'PENDING') {
        data = await approvalService.getPendingApprovals();
      } else {
        data = await approvalService.getAllApprovals(activeTab);
      }
      setRequests(data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch approval requests", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // APPROVE ACTION
  // ==========================================
  const handleOpenApproveModal = (req) => {
    setApproveModalReq(req);
    setApproveNotes('Approved proposal for club expenditure');
  };

  const handleConfirmApprove = async () => {
    if (!approveModalReq) return;
    setApproving(true);
    try {
      await approvalService.approveRequest(approveModalReq.id, approveNotes);
      showToast(`Request ${approveModalReq.request_number} approved! Posted to financial ledger.`, 'success');
      setApproveModalReq(null);
      fetchApprovals();
    } catch (e) {
      console.error(e);
      showToast(e.response?.data?.detail || "Failed to approve request", 'error');
    } finally {
      setApproving(false);
    }
  };

  // ==========================================
  // REJECT ACTION
  // ==========================================
  const handleOpenRejectModal = (req) => {
    setRejectModalReq(req);
    setRejectReason('Insufficient event budget or proposal requires revision');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    setRejecting(true);
    try {
      await approvalService.rejectRequest(rejectModalReq.id, rejectReason);
      showToast(`Request ${rejectModalReq.request_number} rejected.`, 'success');
      setRejectModalReq(null);
      fetchApprovals();
    } catch (e) {
      console.error(e);
      showToast(e.response?.data?.detail || "Failed to reject request", 'error');
    } finally {
      setRejecting(false);
    }
  };

  // ==========================================
  // DELETE / REMOVE ACTION
  // ==========================================
  const handleOpenDeleteModal = (req) => {
    setDeleteModalReq(req);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalReq) return;
    setDeleting(true);
    try {
      await approvalService.deleteRequest(deleteModalReq.id);
      showToast(`Request ${deleteModalReq.request_number} deleted successfully`, 'success');
      setDeleteModalReq(null);
      setRequests(prev => prev.filter(r => r.id !== deleteModalReq.id));
    } catch (e) {
      console.error(e);
      showToast(e.response?.data?.detail || "Failed to delete request", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span style={{
          color: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '0.25rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <CheckCircle size={13} /> APPROVED
        </span>
      );
    } else if (s === 'rejected') {
      return (
        <span style={{
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '0.25rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <XCircle size={13} /> REJECTED
        </span>
      );
    } else {
      return (
        <span style={{
          color: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          padding: '0.25rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <Clock size={13} /> PENDING
        </span>
      );
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.request_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.requested_by_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '0.85rem 1.4rem',
          borderRadius: '0.5rem',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Expense Approvals
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Review, approve, reject, or remove member expenditure proposals with direct ledger synchronization.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link 
            to="/expense-requests" 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
          >
            <FileText size={16} /> View All Requests
          </Link>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(243, 244, 246, 0.8)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          {[
            { id: 'PENDING', label: 'Pending Approvals' },
            { id: 'APPROVED', label: 'Approved History' },
            { id: 'REJECTED', label: 'Rejected History' },
            { id: 'ALL', label: 'All Proposals' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-${tab.id.toLowerCase()}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            id="approvals-search"
            placeholder="Search by request #, member, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--input-bg, #ffffff)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Grid of Approval Cards */}
      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading approval proposals...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredRequests.map(req => {
            const isPending = req.status.toLowerCase() === 'pending';

            return (
              <div 
                key={req.id} 
                className="card" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: isPending ? '4px solid #f59e0b' : req.status.toLowerCase() === 'approved' ? '4px solid #10b981' : '4px solid #ef4444'
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 600 }}>
                        {req.request_number}
                      </span>
                      <h3 style={{ margin: '0.2rem 0 0', color: '#ef4444', fontSize: '1.4rem', fontWeight: 700 }}>
                        {formatCurrency(req.amount)}
                      </h3>
                    </div>
                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                    <span style={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                      color: '#2563eb', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '0.375rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {req.category_name}
                    </span>

                    {req.project_name && (
                      <span style={{ 
                        backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                        color: '#b45309', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '0.375rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600 
                      }}>
                        📌 {req.project_name}
                      </span>
                    )}

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0' }}>
                      <Calendar size={12} />
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Description Box */}
                  <div style={{
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(249, 250, 251, 0.8)',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    color: 'var(--text-primary)'
                  }}>
                    {req.description}
                  </div>

                  {/* Requester Info */}
                  {req.requested_by_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      <User size={14} /> Requested by: <strong style={{ color: 'var(--text-primary)' }}>{req.requested_by_name}</strong>
                    </div>
                  )}

                  {/* Comments if already reviewed */}
                  {req.approval_comments && (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.375rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px dashed rgba(59, 130, 246, 0.3)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '1rem'
                    }}>
                      💬 <em>"{req.approval_comments}"</em>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isPending ? (
                    <>
                      <button 
                        type="button"
                        id={`btn-approve-${req.id}`}
                        onClick={() => handleOpenApproveModal(req)}
                        className="btn btn-primary" 
                        style={{ 
                          flex: 1, 
                          backgroundColor: '#10b981', 
                          borderColor: '#10b981',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.4rem',
                          fontSize: '0.85rem' 
                        }}
                      >
                        <CheckCircle size={16} /> Approve
                      </button>

                      <button 
                        type="button"
                        id={`btn-reject-${req.id}`}
                        onClick={() => handleOpenRejectModal(req)}
                        className="btn btn-secondary" 
                        style={{ 
                          flex: 1, 
                          color: '#ef4444', 
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.4rem',
                          fontSize: '0.85rem' 
                        }}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  ) : null}

                  {/* Delete / Remove Proposal Button */}
                  <button
                    type="button"
                    id={`btn-delete-${req.id}`}
                    onClick={() => handleOpenDeleteModal(req)}
                    className="btn btn-outline"
                    style={{ 
                      padding: '0.45rem', 
                      color: '#ef4444', 
                      borderColor: 'rgba(239, 68, 68, 0.25)', 
                      backgroundColor: 'rgba(239, 68, 68, 0.05)' 
                    }}
                    title="Delete / Remove Proposal Record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={44} style={{ color: '#10b981', opacity: 0.6 }} />
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                  {activeTab === 'PENDING' ? 'All Clear! No Pending Approvals' : 'No Records Found'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {activeTab === 'PENDING' 
                    ? 'All member expense requests have been reviewed.' 
                    : 'No requests matched the selected tab or search query.'}
                </p>
                <Link to="/expense-requests" className="btn btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  View All Expense Requests
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* APPROVE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {approveModalReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Approve Expense Request</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirm expenditure & post to ledger</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalReq(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(249, 250, 251, 0.8)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Request Number:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{approveModalReq.request_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount:</span>
                  <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.1rem' }}>{formatCurrency(approveModalReq.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category:</span>
                  <span style={{ fontWeight: 500 }}>{approveModalReq.category_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project:</span>
                  <span style={{ fontWeight: 500 }}>{approveModalReq.project_name || 'General Club'}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Approval Notes / Comments
                </label>
                <input
                  type="text"
                  id="approvals-notes-input"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Approved by Executive Board..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setApproveModalReq(null)}
                  className="btn btn-secondary"
                  disabled={approving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-approvals-confirm-approve"
                  onClick={handleConfirmApprove}
                  className="btn btn-primary"
                  disabled={approving}
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {approving ? 'Approving...' : <><CheckCircle size={16} /> Confirm & Post to Ledger</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REJECT CONFIRMATION MODAL */}
      {/* ========================================== */}
      {rejectModalReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Reject Expense Request</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decline proposal and enter rejection reason</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(249, 250, 251, 0.8)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Request Number:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rejectModalReq.request_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount:</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(rejectModalReq.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{rejectModalReq.description}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Reason for Rejection <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="approvals-reject-reason-input"
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for the rejection..."
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="btn btn-secondary"
                  disabled={rejecting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-approvals-confirm-reject"
                  onClick={handleConfirmReject}
                  className="btn btn-primary"
                  disabled={rejecting}
                  style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {rejecting ? 'Rejecting...' : <><XCircle size={16} /> Confirm Rejection</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE / REMOVE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {deleteModalReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#ef4444' }}>Delete Expense Request</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanent deletion of request record</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalReq(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to delete request <strong style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{deleteModalReq.request_number}</strong>?
              </p>

              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                This will delete the request and unbind any associated approval or ledger transaction records.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalReq(null)}
                  className="btn btn-secondary"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-approvals-confirm-delete"
                  onClick={handleConfirmDelete}
                  className="btn btn-primary"
                  disabled={deleting}
                  style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {deleting ? 'Deleting...' : <><Trash2 size={16} /> Delete Permanently</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
