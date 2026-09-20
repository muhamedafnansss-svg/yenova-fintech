import React, { useState, useEffect } from 'react';
import { ledgerService } from '../services/ledger';
import { 
  DollarSign, 
  Plus, 
  Minus, 
  Equal, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Save, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';

const FinancialSetup = () => {
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [balanceDetails, setBalanceDetails] = useState({
    financial_year: '2026-2027',
    opening_balance: 0,
    total_income: 0,
    total_expenses: 0,
    current_balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchBalanceData();
  }, [financialYear]);

  const fetchBalanceData = async () => {
    setLoading(true);
    try {
      const details = await ledgerService.getBalanceDetails();
      setBalanceDetails(details);
      setOpeningBalance(String(details.opening_balance || 0));
      if (details.financial_year) {
        setFinancialYear(details.financial_year);
      }
    } catch (error) {
      console.error("Failed to load balance details", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (amount) => {
    setOpeningBalance(String(amount));
  };

  const parsedInput = parseFloat(openingBalance) || 0;
  const liveProjectedBalance = parsedInput + (balanceDetails.total_income || 0) - (balanceDetails.total_expenses || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amount = parseFloat(openingBalance) || 0;
      await ledgerService.setOpeningBalance({
        financial_year: financialYear,
        opening_balance: amount
      });
      showToast(`Starting balance updated to ₹${amount.toLocaleString('en-IN')}`, 'success');
      await fetchBalanceData();
    } catch (error) {
      console.error("Failed to save starting balance", error);
      showToast(error.response?.data?.detail || "Failed to update starting balance", 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
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

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.85rem' }}>Financial Balance Setup</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Set your club's baseline starting balance. All income transactions will be added, and all expense vouchers will be subtracted accordingly.
        </p>
      </div>

      {/* LIVE EQUATION FORMULA CARD */}
      <div className="card" style={{ 
        padding: '1.75rem', 
        marginBottom: '2rem', 
        borderRadius: '0.75rem',
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.04) 100%)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Sparkles size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Live Financial Equation</h2>
        </div>

        {/* Dynamic Formula Display */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Starting Balance */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              What You Put (Base)
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatCurrency(parsedInput)}
            </div>
          </div>

          {/* Plus Sign */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent)' }}>
            <Plus size={24} strokeWidth={3} />
          </div>

          {/* Total Income */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Total Income (Added)
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669' }}>
              {formatCurrency(balanceDetails.total_income)}
            </div>
          </div>

          {/* Minus Sign */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger)' }}>
            <Minus size={24} strokeWidth={3} />
          </div>

          {/* Total Expenses */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Total Expenses (Subtracted)
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc2626' }}>
              {formatCurrency(balanceDetails.total_expenses)}
            </div>
          </div>

          {/* Equal Sign */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
            <Equal size={24} strokeWidth={3} />
          </div>

          {/* Resulting Live Balance */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: liveProjectedBalance >= 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.15)', 
            borderRadius: '0.5rem', 
            border: `2px solid ${liveProjectedBalance >= 0 ? 'var(--primary)' : '#ef4444'}` 
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Live Financial Balance
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: liveProjectedBalance >= 0 ? 'var(--text-main)' : '#dc2626' }}>
              {formatCurrency(liveProjectedBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* FORM & ADJUSTMENT CARD */}
      <div className="card" style={{ padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Financial Year
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={financialYear} 
                onChange={(e) => setFinancialYear(e.target.value)}
                placeholder="2026-2027"
                required
                style={{ padding: '0.75rem 1rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Current reporting fiscal cycle.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Starting / Opening Balance (₹)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  value={openingBalance} 
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  step="any"
                  required
                  style={{ padding: '0.75rem 1rem', fontSize: '1.15rem', fontWeight: 700 }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Enter whatever starting amount you wish. You can update this at any time.
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
              Quick Presets:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[0, 25000, 50000, 100000, 250000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    backgroundColor: parsedInput === preset ? 'var(--primary-light)' : undefined,
                    borderColor: parsedInput === preset ? 'var(--primary)' : undefined,
                    color: parsedInput === preset ? 'var(--primary)' : undefined
                  }}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              type="submit" 
              className="btn btn-primary flex items-center justify-center gap-2" 
              disabled={saving}
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', fontWeight: 600 }}
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Save Starting Balance</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={fetchBalanceData}
              disabled={loading}
              style={{ padding: '0.85rem 1.25rem' }}
            >
              Reset to Current
            </button>
          </div>
        </form>
      </div>

      {/* EXPLANATORY NOTE */}
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem 1.25rem', 
        borderRadius: '0.5rem', 
        backgroundColor: 'rgba(59, 130, 246, 0.06)', 
        border: '1px solid rgba(59, 130, 246, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <HelpCircle size={20} color="var(--primary)" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>How Financial Balance Works:</strong> The balance you set above is your starting treasury capital. Whenever anyone records an <em>Income</em> entry (scanner payments, registrations, ticket sales), it automatically adds to this balance. Whenever an <em>Expense</em> voucher is authorized, it automatically deducts. Voided transactions are automatically excluded from the calculation.
        </div>
      </div>
    </div>
  );
};

export default FinancialSetup;
