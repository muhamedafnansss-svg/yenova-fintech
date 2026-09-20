import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Users as UsersIcon
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'admin@yenova.com';

const Users = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: 2 // Default: Member
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role_id: 2,
    status: 'Active',
    password: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsersList(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 4500);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 4500);
    }
  };

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // Handle Add User
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users', {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        phone: addForm.phone.trim() || null,
        role_id: parseInt(addForm.role_id, 10)
      });
      showNotification(`User ${addForm.name} created successfully!`);
      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role_id: 2
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (targetUser) => {
    setSelectedUser(targetUser);
    setEditForm({
      name: targetUser.name || '',
      email: targetUser.email || '',
      phone: targetUser.phone || '',
      role_id: targetUser.role_id || (targetUser.role === 'Admin' ? 1 : 2),
      status: targetUser.status || 'Active',
      password: ''
    });
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError('');
    try {
      const isSuperAdmin = selectedUser.is_primary_admin || selectedUser.id === 2 || selectedUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        role_id: isSuperAdmin ? 1 : parseInt(editForm.role_id, 10),
        status: isSuperAdmin ? 'Active' : editForm.status
      };
      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      await api.put(`/users/${selectedUser.id}`, payload);
      showNotification(`User updated successfully!`);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (targetUser) => {
    if (targetUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      showNotification('The primary Super Admin account cannot be deleted.', true);
      return;
    }
    setSelectedUser(targetUser);
    setShowDeleteModal(true);
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      showNotification(`User ${selectedUser.name} removed successfully.`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast Alert */}
      {successMessage && (
        <div style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '0.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '0.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon size={26} color="var(--primary)" /> User Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Manage club members and administrator accounts. Only <strong>admin@yenova.com</strong> holds permanent Super Admin status.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary flex items-center gap-2"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      {/* Summary KPI info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{usersList.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admins & Officers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
            {usersList.filter(u => u.role_id === 1 || u.role === 'Admin').length}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Club Members</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {usersList.filter(u => u.role_id === 2 || u.role === 'Member').length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(248, 250, 252, 0.95)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Phone</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading users list...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users registered in system.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const isSuperAdmin = u.is_primary_admin || u.id === 2 || u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                  const isAdmin = u.role_id === 1 || u.role === 'Admin';
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isSuperAdmin ? 'rgba(234, 179, 8, 0.15)' : isAdmin ? 'rgba(30, 58, 138, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: isSuperAdmin ? '#b45309' : isAdmin ? 'var(--primary)' : '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {u.name}
                              {isSuperAdmin && (
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  backgroundColor: 'rgba(234, 179, 8, 0.15)', 
                                  color: '#b45309', 
                                  padding: '0.1rem 0.4rem', 
                                  borderRadius: '9999px',
                                  fontWeight: 600
                                }}>
                                  Primary
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {u.phone || '—'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {isSuperAdmin ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(234, 179, 8, 0.15)',
                            color: '#b45309',
                            border: '1px solid rgba(234, 179, 8, 0.3)'
                          }}>
                            ⭐ Super Admin
                          </span>
                        ) : isAdmin ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(30, 58, 138, 0.08)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(30, 58, 138, 0.2)'
                          }}>
                            <ShieldCheck size={13} /> Admin
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            <User size={13} /> Member
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: u.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: u.status === 'Active' ? '#059669' : 'var(--danger)'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleOpenEdit(u)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Edit User"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {!isSuperAdmin && (
                            <button 
                              onClick={() => handleOpenDelete(u)}
                              className="btn btn-secondary" 
                              style={{ 
                                padding: '0.35rem 0.6rem', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                color: 'var(--danger)',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                borderColor: 'rgba(239, 68, 68, 0.2)'
                              }}
                              title="Delete User"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD USER MODAL                                                            */}
      {/* ========================================================================= */}
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', borderRadius: '0.75rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Add New User</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> Full Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. John Doe"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} /> Email Address
                </label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="e.g. john@yenova.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Lock size={14} /> Password
                  </label>
                  <input 
                    type="password" 
                    className="input-field" 
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={14} /> Phone (Optional)
                  </label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="e.g. 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} /> Account Role
                </label>
                <select 
                  className="input-field"
                  value={addForm.role_id}
                  onChange={(e) => setAddForm({ ...addForm, role_id: parseInt(e.target.value, 10) })}
                >
                  <option value={2}>👤 Club Member (Add Income, Request Expenses, Read Ledger)</option>
                  <option value={1}>🛡️ Administrator (Full system management & approvals)</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                  {addForm.role_id === 2 
                    ? '• Members can only access Dashboard, Income, Expenses (approval required), and Ledger (read-only).'
                    : '• Admins can approve expense requests, modify financial setup, and manage users.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL                                                           */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', borderRadius: '0.75rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit User #{selectedUser.id}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {selectedUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: 'rgba(234, 179, 8, 0.1)', 
                color: '#b45309', 
                borderRadius: '0.5rem', 
                fontSize: '0.8rem', 
                marginBottom: '1rem',
                border: '1px solid rgba(234, 179, 8, 0.25)'
              }}>
                ⭐ This is the primary Super Admin account ({SUPER_ADMIN_EMAIL}). Its role is permanently locked as Admin and its status cannot be changed to Inactive.
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} /> Email Address (Used for Login)
                </label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> Full Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={14} /> Reset Password (Optional)
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Enter a new password (min 6 characters) if you want to reset this user's password.
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} /> Phone Number
                </label>
                <input 
                  type="tel" 
                  className="input-field" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Role</label>
                  <select 
                    className="input-field"
                    value={editForm.role_id}
                    onChange={(e) => setEditForm({ ...editForm, role_id: parseInt(e.target.value, 10) })}
                    disabled={selectedUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()}
                  >
                    <option value={2}>👤 Member</option>
                    <option value={1}>🛡️ Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
                  <select 
                    className="input-field"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    disabled={selectedUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {showDeleteModal && selectedUser && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', borderRadius: '0.75rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Delete User Account</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              Are you sure you want to permanently remove <strong>{selectedUser.name}</strong> ({selectedUser.email})? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
