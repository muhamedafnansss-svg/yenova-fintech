import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  HeartPulse, 
  Edit2, 
  Plus, 
  Minus, 
  Equal, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Save 
} from 'lucide-react';
import { ledgerService } from '../services/ledger';
import { analyticsService } from '../services/analytics';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [summary, setSummary] = useState({
    current_balance: 0,
    opening_balance: 0,
    financial_year: '2026-2027',
    total_income: 0,
    total_expenses: 0,
    today_transactions: 0,
    this_month_income: 0,
    this_month_expense: 0
  });
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Adjust Starting Balance Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newStartingBalance, setNewStartingBalance] = useState('');
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumData, txData, analyticsData] = await Promise.all([
        ledgerService.getSummary(),
        ledgerService.getRecentTransactions(5),
        analyticsService.getDashboard()
      ]);
      setSummary(sumData);
      setRecentTransactions(txData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStartingBalance = async (e) => {
    e.preventDefault();
    setUpdatingBalance(true);
    try {
      const amount = parseFloat(newStartingBalance) || 0;
      await ledgerService.setOpeningBalance({
        financial_year: summary.financial_year || '2026-2027',
        opening_balance: amount
      });
      showToast(`Starting balance updated to ₹${amount.toLocaleString('en-IN')}`, 'success');
      setShowAdjustModal(false);
      // Reload summary immediately
      const sumData = await ledgerService.getSummary();
      setSummary(sumData);
    } catch (err) {
      console.error(err);
      const msg = typeof err.response?.data?.detail === 'string' ? err.response.data.detail : "Failed to update starting balance";
      showToast(msg, 'error');
    } finally {
      setUpdatingBalance(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const parsedModalInput = parseFloat(newStartingBalance) || 0;
  const modalProjectedBalance = parsedModalInput + (summary.total_income || 0) - (summary.total_expenses || 0);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Command Center...</div>;

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Notification */}
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
          zIndex: 9999,
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

      <h1 style={{ marginBottom: '0.5rem' }}>Command Center</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Welcome back, {user?.name}. Here's the current financial health of Yenova IT Club.</p>

      <div className="dashboard-grid dashboard-stats" style={{ marginBottom: '2rem' }}>
        {/* Current Balance with Adjust Button */}
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Current Balance</h3>
              {isAdmin && (
                <button 
                  onClick={() => {
                    setNewStartingBalance(String(summary.opening_balance || 0));
                    setShowAdjustModal(true);
                  }} 
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '0.2rem 0.5rem', 
                    fontSize: '0.72rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                  title="Change or set what you want the starting balance to be"
                >
                  <Edit2 size={12} /> Set Starting
                </button>
              )}
            </div>
            <p style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.25rem 0' }}>{formatCurrency(summary.current_balance)}</p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Base: {formatCurrency(summary.opening_balance || 0)} | In: +{formatCurrency(summary.total_income)} | Out: -{formatCurrency(summary.total_expenses)}
            </div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Income</h3>
            <p style={{ fontSize: '1.25rem' }}>{formatCurrency(summary.total_income)}</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Expenses</h3>
            <p style={{ fontSize: '1.25rem' }}>{formatCurrency(summary.total_expenses)}</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>Events</h3>
            <p style={{ fontSize: '1.25rem' }}>{analytics?.events_conducted || 0}</p>
          </div>
        </div>

        <div className="card stat-card" style={{ border: '2px solid rgba(139, 92, 246, 0.3)' }}>
          <div className="stat-icon" style={{ color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <HeartPulse size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: '#8b5cf6' }}>Health Score</h3>
            <p style={{ fontSize: '1.5rem', color: '#8b5cf6' }}>{analytics?.health_score}/100</p>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{analytics?.health_status}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-layout">
        <div className="card" style={{ minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Transactions</h3>
            <Link to="/ledger" className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>View All</Link>
          </div>
          
          {recentTransactions.length === 0 ? (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
               No recent activity to show.
             </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Category</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Description</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatDate(tx.transaction_date)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: tx.type === 'Income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: tx.type === 'Income' ? 'var(--accent)' : 'var(--danger)'
                        }}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>{tx.category ? tx.category.name : (tx.category_id ? 'Unknown' : 'Legacy')}</div>
                      </td>
                      <td style={{ padding: '1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.description}>
                        {tx.description}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, color: tx.type === 'Income' ? 'var(--accent)' : 'var(--danger)' }}>
                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="card" style={{ minHeight: '300px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/income/add" className="btn btn-primary" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Add Income</Link>
            <Link to="/expenses" className="btn btn-danger" style={{ textAlign: 'center', width: '100%', display: 'block', backgroundColor: 'var(--danger)', color: 'white' }}>
              {isAdmin ? 'Add Expense' : 'Request Expense'}
            </Link>
            <Link to="/ledger" className="btn btn-secondary" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Search Transactions</Link>
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>THIS MONTH</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Income</span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{formatCurrency(summary.this_month_income)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Expense</span>
              <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{formatCurrency(summary.this_month_expense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADJUST STARTING BALANCE MODAL */}
      {isAdmin && showAdjustModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '0.75rem',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Set Financial Starting Balance</h3>
              </div>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Set whatever baseline amount you put. All incomes will be added, and all expenses will be deducted automatically from this base.
            </p>

            <form onSubmit={handleSaveStartingBalance}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Starting / Opening Balance (₹)
                </label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newStartingBalance} 
                  onChange={(e) => setNewStartingBalance(e.target.value)}
                  step="any"
                  required
                  placeholder="Enter starting amount"
                  style={{ fontSize: '1.2rem', fontWeight: 700, padding: '0.75rem 1rem' }}
                />
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Quick Presets:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[0, 25000, 50000, 100000, 250000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setNewStartingBalance(String(preset))}
                      style={{ 
                        padding: '0.25rem 0.6rem', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: parsedModalInput === preset ? 'var(--primary-light)' : undefined,
                        borderColor: parsedModalInput === preset ? 'var(--primary)' : undefined,
                        color: parsedModalInput === preset ? 'var(--primary)' : undefined
                      }}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Arithmetic Preview */}
              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'var(--bg-main)', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Live Balance Calculation Preview
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span>What You Put (Base):</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(parsedModalInput)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#059669' }}>
                  <span>+ Total Verified Income:</span>
                  <span style={{ fontWeight: 600 }}>+{formatCurrency(summary.total_income)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#dc2626' }}>
                  <span>- Total Verified Expenses:</span>
                  <span style={{ fontWeight: 600 }}>-{formatCurrency(summary.total_expenses)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.95rem', 
                  fontWeight: 700, 
                  borderTop: '1px solid var(--border)', 
                  paddingTop: '0.5rem',
                  color: modalProjectedBalance >= 0 ? 'var(--text-main)' : '#dc2626'
                }}>
                  <span>= Resulting Current Balance:</span>
                  <span>{formatCurrency(modalProjectedBalance)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-1"
                  disabled={updatingBalance}
                >
                  <Save size={16} />
                  <span>{updatingBalance ? 'Saving...' : 'Apply Starting Balance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
