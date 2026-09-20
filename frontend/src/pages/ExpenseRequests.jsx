import React, { useState, useEffect } from 'react';
import { expenseRequestService } from '../services/expenseRequest';
import { categoryService } from '../services/category';
import { projectService } from '../services/project';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  Folder, 
  DollarSign, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  Send,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ExpenseRequests = () => {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals & Popups
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Action Modals
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [approving, setApproving] = useState(false);

  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [deleteModalReq, setDeleteModalReq] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Rejected'

  // Form State
  const [formData, setFormData] = useState({
    category_id: '',
    event_id: '',
    amount: '',
    description: ''
  });
  const [formError, setFormError] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [reqData, catData, projData] = await Promise.all([
        expenseRequestService.getRequests(),
        categoryService.getCategories(),
        projectService.getProjects()
      ]);
      setRequests(reqData || []);
      const expenseCats = (catData || []).filter(c => c.type === 'Expense' && c.is_active);
      setCategories(expenseCats);
      setProjects(projData || []);

      if (expenseCats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: expenseCats[0].id }));
      }
    } catch (e) {
      console.error("Error fetching expense requests data", e);
      showToast("Could not load expense requests data", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleOpenAddModal = () => {
    setFormData({
      category_id: categories.length > 0 ? categories[0].id : '',
      event_id: '',
      amount: '',
      description: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      setFormError("Please select an expense category");
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (!numAmount || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than ₹0");
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 4) {
      setFormError("Please enter a descriptive purpose for this expense request (at least 4 characters)");
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        category_id: formData.category_id,
        event_id: formData.event_id || null,
        amount: numAmount,
        description: formData.description.trim()
      };

      const newReq = await expenseRequestService.createRequest(payload);
      showToast(`Expense request ${newReq.request_number || ''} submitted successfully!`, 'success');
      setShowAddModal(false);
      
      const refreshed = await expenseRequestService.getRequests();
      setRequests(refreshed);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to submit expense request";
      setFormError(detail);
    } finally {
      setSubmitting(false);
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
      const res = await expenseRequestService.approveRequest(approveModalReq.id, approveNotes);
      showToast(`Request ${approveModalReq.request_number} approved! Created ledger entry.`, 'success');
      setApproveModalReq(null);
      if (selectedRequest?.id === approveModalReq.id) {
        setSelectedRequest(null);
      }
      const refreshed = await expenseRequestService.getRequests();
      setRequests(refreshed);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to approve expense request", 'error');
    } finally {
      setApproving(false);
    }
  };

  // ==========================================
  // REJECT ACTION
  // ==========================================
  const handleOpenRejectModal = (req) => {
    setRejectModalReq(req);
    setRejectReason('Budget limits reached or not approved for current quarter');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    setRejecting(true);
    try {
      const res = await expenseRequestService.rejectRequest(rejectModalReq.id, rejectReason);
      showToast(`Request ${rejectModalReq.request_number} rejected.`, 'success');
      setRejectModalReq(null);
      if (selectedRequest?.id === rejectModalReq.id) {
        setSelectedRequest(null);
      }
      const refreshed = await expenseRequestService.getRequests();
      setRequests(refreshed);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to reject expense request", 'error');
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
      await expenseRequestService.deleteRequest(deleteModalReq.id);
      showToast(`Request ${deleteModalReq.request_number} removed successfully`, 'success');
      setDeleteModalReq(null);
      if (selectedRequest?.id === deleteModalReq.id) {
        setSelectedRequest(null);
      }
      setRequests(prev => prev.filter(r => r.id !== deleteModalReq.id));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to delete request", 'error');
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

  // Filtered requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.request_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.requested_by_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || req.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status.toLowerCase() === 'pending').length;
  const approvedCount = requests.filter(r => r.status.toLowerCase() === 'approved').length;
  const totalAmount = requests.reduce((sum, r) => sum + (r.amount || 0), 0);

  const canApprove = hasPermission('APPROVE_EXPENSE') || user?.role === 'Admin';
  const canReject = hasPermission('REJECT_EXPENSE') || user?.role === 'Admin';
  const isAdmin = user?.role === 'Admin' || user?.role_id === 1;

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
            Expense Requests
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Submit expenditure proposals and manage approvals directly with real-time ledger integration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canApprove && (
            <Link 
              to="/approvals" 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              <CheckCircle size={16} /> Approvals Dashboard ({pendingCount})
            </Link>
          )}

          <button
            type="button"
            id="btn-add-expense-request"
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
          >
            <PlusCircle size={18} /> Submit Expense Request
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-header">
            <h3 className="stat-title">Total Requests</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Proposals submitted
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-header">
            <h3 className="stat-title">Pending Review</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Awaiting decision
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-header">
            <h3 className="stat-title">Approved Requests</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>{approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Entered into ledger
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-header">
            <h3 className="stat-title">Total Requested Volume</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{formatCurrency(totalAmount)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Cumulative expenditure
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            id="expense-request-search"
            placeholder="Search by request #, description, category, project, member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem 0.6rem 2.4rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--input-bg, #ffffff)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(243, 244, 246, 0.8)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          {['ALL', 'Pending', 'Approved', 'Rejected'].map(status => {
            const count = status === 'ALL' 
              ? requests.length 
              : requests.filter(r => r.status.toLowerCase() === status.toLowerCase()).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
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
                {status === 'ALL' ? 'All' : status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading expense proposals...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Request #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Event / Project</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => {
                  const isPending = req.status.toLowerCase() === 'pending';
                  const isUserOwner = req.requested_by === user?.uuid;
                  const allowDelete = isAdmin || isPending || isUserOwner;

                  return (
                    <tr 
                      key={req.id} 
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                      className="hover:bg-slate-50"
                    >
                      <td style={{ padding: '1rem', fontWeight: 600, fontFamily: 'monospace', color: '#3b82f6' }}>
                        {req.request_number}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '1rem', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.description}>
                          {req.description}
                        </div>
                        {req.requested_by_name && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            By: {req.requested_by_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                          color: '#2563eb', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem', 
                          fontWeight: 600 
                        }}>
                          {req.category_name}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {req.project_name ? (
                          <span style={{ 
                            backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                            color: '#b45309', 
                            padding: '0.2rem 0.55rem', 
                            borderRadius: '0.375rem', 
                            fontSize: '0.75rem', 
                            fontWeight: 600 
                          }}>
                            📌 {req.project_name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>General</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>
                        {formatCurrency(req.amount)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(req.status)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          {/* QUICK APPROVE BUTTON */}
                          {isPending && canApprove && (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(req)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                color: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderColor: 'rgba(16, 185, 129, 0.3)'
                              }}
                              title="Approve Request & Post to Ledger"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}

                          {/* QUICK REJECT BUTTON */}
                          {isPending && canReject && (
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(req)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                color: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderColor: 'rgba(239, 68, 68, 0.3)'
                              }}
                              title="Reject Request"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}

                          {/* VIEW DETAILS BUTTON */}
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="View Request Details"
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* DELETE BUTTON */}
                          {allowDelete && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(req)}
                              className="btn btn-outline"
                              style={{ 
                                padding: '0.3rem 0.5rem', 
                                fontSize: '0.75rem', 
                                color: '#ef4444', 
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)'
                              }}
                              title="Remove / Delete Request"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                        <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>No Expense Requests Found</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          {searchTerm || statusFilter !== 'ALL'
                            ? "No requests matched your filter criteria."
                            : "You haven't submitted any expense requests yet."}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="btn btn-primary"
                          style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                        >
                          <PlusCircle size={16} style={{ marginRight: '0.4rem' }} /> Submit Your First Request
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMIT EXPENSE REQUEST MODAL */}
      {/* ========================================== */}
      {showAddModal && (
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
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(249, 250, 251, 0.7)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Submit Expense Request</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Propose expenditure for administrator review</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Estimated Expense Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    id="req-input-amount"
                    name="amount"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 2500"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Expense Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="req-select-category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Associated Event / Project <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <select
                  id="req-select-project"
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">None (General Club Expenditure)</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.status})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Purpose / Itemized Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="req-input-description"
                  name="description"
                  rows="3"
                  placeholder="Describe items to be purchased, vendor quotes, or reason for expense..."
                  value={formData.description}
                  onChange={handleInputChange}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-proposal"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send size={16} /> Submit Proposal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirm expenditure & post entry into financial ledger</span>
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
                  id="approve-notes-input"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Approved per budget committee..."
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
                  id="btn-confirm-approve"
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decline proposal and notify requester</span>
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
                  id="reject-reason-input"
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a clear reason for the rejection..."
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
                  id="btn-confirm-reject"
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
                Are you sure you want to delete expense request <strong style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{deleteModalReq.request_number}</strong>?
              </p>

              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                This will remove the request and any associated approval or ledger transaction records.
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
                  id="btn-confirm-delete-request"
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

      {/* ========================================== */}
      {/* REQUEST DETAILS MODAL */}
      {/* ========================================== */}
      {selectedRequest && (
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
            maxWidth: '540px',
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
              backgroundColor: 'rgba(249, 250, 251, 0.7)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 600 }}>
                  {selectedRequest.request_number}
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem' }}>Expense Request Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Requested Amount:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ef4444' }}>
                  {formatCurrency(selectedRequest.amount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.category_name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Event / Project:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.project_name || 'General Club'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submitted Date:</span>
                <span>{new Date(selectedRequest.created_at).toLocaleString('en-IN')}</span>
              </div>

              {selectedRequest.requested_by_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Requested By:</span>
                  <span>{selectedRequest.requested_by_name}</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
                  Itemized Description / Purpose:
                </span>
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(249, 250, 251, 0.8)',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}>
                  {selectedRequest.description}
                </div>
              </div>

              {selectedRequest.approval_comments && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
                    Review Comments {selectedRequest.approver_name && `by ${selectedRequest.approver_name}`}:
                  </span>
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                  }}>
                    "{selectedRequest.approval_comments}"
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(249, 250, 251, 0.5)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                {(isAdmin || selectedRequest.status.toLowerCase() === 'pending' || selectedRequest.requested_by === user?.uuid) && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRequest;
                      setSelectedRequest(null);
                      handleOpenDeleteModal(r);
                    }}
                    className="btn btn-outline"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Trash2 size={15} /> Delete Request
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {canApprove && selectedRequest.status.toLowerCase() === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRequest;
                      setSelectedRequest(null);
                      handleOpenApproveModal(r);
                    }}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <CheckCircle size={15} /> Approve Proposal
                  </button>
                )}

                {canReject && selectedRequest.status.toLowerCase() === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRequest;
                      setSelectedRequest(null);
                      handleOpenRejectModal(r);
                    }}
                    className="btn btn-secondary"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <XCircle size={15} /> Reject Proposal
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseRequests;
