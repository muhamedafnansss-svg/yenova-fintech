import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle,
  KeyRound,
  X
} from 'lucide-react';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'

  // Profile info form state
  const [infoForm, setInfoForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setInfoForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const isSuperAdmin = user?.is_primary_admin || user?.email?.toLowerCase() === 'admin@yenova.com';

  // Handle personal information / email update
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoSuccess('');
    setInfoError('');
    setInfoLoading(true);

    try {
      const payload = {
        name: infoForm.name.trim(),
        email: infoForm.email.trim(),
        phone: infoForm.phone.trim() || null
      };

      const res = await api.put('/profile', payload);
      if (refreshUser) {
        await refreshUser();
      }
      setInfoSuccess('Profile updated successfully! Your details have been saved.');
      setTimeout(() => setInfoSuccess(''), 5000);
    } catch (err) {
      setInfoError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setInfoLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/profile/password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      setPasswordSuccess('Password updated successfully! Next time you log in, please use your new password.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: '0 0 0.25rem 0' }}>Account Profile</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Manage your personal details, email address, and security credentials.
        </p>
      </div>

      {/* User Identity Card */}
      <div className="card" style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: '1.5rem',
        padding: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            width: '68px', 
            height: '68px', 
            borderRadius: '50%', 
            backgroundColor: isSuperAdmin ? 'rgba(234, 179, 8, 0.15)' : 'rgba(30, 58, 138, 0.1)', 
            color: isSuperAdmin ? '#b45309' : 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '1.75rem', 
            fontWeight: 700,
            border: isSuperAdmin ? '2px solid rgba(234, 179, 8, 0.4)' : '2px solid rgba(30, 58, 138, 0.2)'
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-main)' }}>{user?.name}</h2>
            <div style={{ margin: '0.2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              {isSuperAdmin ? (
                <span style={{ 
                  padding: '0.2rem 0.65rem', 
                  backgroundColor: 'rgba(234, 179, 8, 0.15)', 
                  color: '#b45309', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  border: '1px solid rgba(234, 179, 8, 0.3)'
                }}>
                  ⭐ Super Admin
                </span>
              ) : user?.role === 'Admin' ? (
                <span style={{ 
                  padding: '0.2rem 0.65rem', 
                  backgroundColor: 'rgba(30, 58, 138, 0.08)', 
                  color: 'var(--primary)', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  border: '1px solid rgba(30, 58, 138, 0.2)'
                }}>
                  🛡️ Admin
                </span>
              ) : (
                <span style={{ 
                  padding: '0.2rem 0.65rem', 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                  color: '#059669', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  👤 Club Member
                </span>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Account ID: #{user?.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ 
            borderRadius: '0.5rem 0.5rem 0 0', 
            padding: '0.65rem 1.25rem', 
            fontSize: '0.875rem',
            borderBottom: 'none'
          }}
          onClick={() => setActiveTab('info')}
        >
          <UserIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Personal Information & Email
        </button>
        <button 
          className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ 
            borderRadius: '0.5rem 0.5rem 0 0', 
            padding: '0.65rem 1.25rem', 
            fontSize: '0.875rem',
            borderBottom: 'none'
          }}
          onClick={() => setActiveTab('password')}
        >
          <KeyRound size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Security & Passwords
        </button>
      </div>

      {/* TAB 1: PERSONAL INFORMATION & EMAIL */}
      {activeTab === 'info' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>Edit Personal Details</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Update your display name, email address, or phone number.
          </p>

          {infoSuccess && (
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
                <span>{infoSuccess}</span>
              </div>
              <button onClick={() => setInfoSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {infoError && (
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
                <span>{infoError}</span>
              </div>
              <button onClick={() => setInfoError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleInfoSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserIcon size={15} /> Full Name
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={infoForm.name}
                onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                placeholder="Your full name"
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={15} /> Email Address (Used for Login)
              </label>
              <input 
                type="email" 
                className="input-field" 
                value={infoForm.email}
                onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                placeholder="name@yenova.com"
                required 
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Changing your email will update the username you use to log into this application.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={15} /> Phone Number
              </label>
              <input 
                type="tel" 
                className="input-field" 
                value={infoForm.phone}
                onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                placeholder="e.g. +91 9876543210"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={infoLoading}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                {infoLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'password' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>Change Password</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            To protect your account, ensure your password is secure and at least 6 characters long.
          </p>

          {passwordSuccess && (
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
                <span>{passwordSuccess}</span>
              </div>
              <button onClick={() => setPasswordSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {passwordError && (
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
                <span>{passwordError}</span>
              </div>
              <button onClick={() => setPasswordError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={15} /> Current Password
              </label>
              <input 
                type="password" 
                className="input-field" 
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                placeholder="Enter current password"
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <KeyRound size={15} /> New Password
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passwordForm.newPassword} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                  placeholder="Min 6 characters"
                  required 
                  minLength={6} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <KeyRound size={15} /> Confirm New Password
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passwordForm.confirmPassword} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                  placeholder="Re-enter new password"
                  required 
                  minLength={6} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={passwordLoading}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
