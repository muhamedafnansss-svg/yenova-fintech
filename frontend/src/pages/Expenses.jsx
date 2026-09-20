import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ledgerService } from '../services/ledger';
import { categoryService } from '../services/category';
import { projectService } from '../services/project';
import { documentService } from '../services/document';
import { expenseRequestService } from '../services/expenseRequest';
import { useAuth } from '../context/AuthContext';
import Select from 'react-select';

const Expenses = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreateDirectly = hasPermission('CREATE_EXPENSE');
  const [formData, setFormData] = useState({
    type: 'Expense',
    amount: '',
    category_id: '',
    project_id: '',
    description: '',
    payment_method: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdTransactionId, setCreatedTransactionId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumData, catData, projData] = await Promise.all([
          ledgerService.getSummary(),
          categoryService.getCategories(),
          projectService.getProjects()
        ]);
        setCurrentBalance(sumData.current_balance);
        setCategories(catData.filter(c => c.type === 'Expense' && c.is_active));
        setProjects(projData.filter(p => p.status !== 'Archived' && p.status !== 'Cancelled'));
      } catch (err) {
        console.error("Could not fetch data", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Check balance if amount changes
    if (e.target.name === 'amount') {
      const amt = parseFloat(e.target.value) || 0;
      if (amt > currentBalance) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || null,
        project_id: formData.project_id || null
      };
      
      if (canCreateDirectly) {
        const response = await ledgerService.addExpense(data);
        setCreatedTransactionId(response.id || response.transaction_id || response.uuid);
        setShowUploadModal(true);
      } else {
        await expenseRequestService.createRequest({
          category_id: data.category_id,
          event_id: data.project_id,
          amount: data.amount,
          description: data.description
        });
        alert('Expense Request submitted successfully! It will be reviewed by the committee.');
        navigate('/expense-requests');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving.');
      setLoading(false);
    }
  };

  const handleSkipUpload = () => {
    navigate('/ledger');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !createdTransactionId) return;
    
    setLoading(true);
    try {
      await documentService.uploadDocument(file, {
        document_category: 'Receipt',
        transaction_id: createdTransactionId,
        project_id: formData.project_id
      });
      alert('Expense and receipt recorded successfully!');
      navigate('/ledger');
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>{canCreateDirectly ? 'Add Expense' : 'Submit Expense Request'}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {canCreateDirectly ? 'Record outgoing club payments.' : 'Request reimbursement or payment for a club expense.'}
      </p>
      
      <div className="card" style={{ maxWidth: '600px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.375rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Available Balance</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(currentBalance)}</span>
        </div>

        {!canCreateDirectly && (
          <div style={{ 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem', 
            backgroundColor: 'rgba(59, 130, 246, 0.08)', 
            color: '#1d4ed8', 
            borderRadius: '0.5rem', 
            border: '1px solid rgba(59, 130, 246, 0.25)', 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.75rem' 
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>ℹ️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Administrator Approval Required</div>
              <div style={{ fontSize: '0.82rem', color: '#2563eb', lineHeight: '1.4' }}>
                As a club member, all expenses must be reviewed and approved by an administrator before being added to the official financial ledger. Once submitted, track its status in <strong>My Requests</strong>.
              </div>
            </div>
          </div>
        )}

        {showWarning && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '0.375rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <strong>Warning:</strong> Insufficient Available Balance. This expense exceeds the current balance.
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.375rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input 
              type="number" 
              name="amount" 
              className="input-field" 
              value={formData.amount} 
              onChange={handleChange}
              min="1"
              step="0.01"
              required 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <Select
                name="category_id"
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                value={categories.map(cat => ({ value: cat.id, label: cat.name })).find(option => option.value === formData.category_id) || null}
                onChange={(selectedOption) => setFormData({ ...formData, category_id: selectedOption ? selectedOption.value : '' })}
                placeholder="Search category..."
                isClearable={false}
                isSearchable={true}
                className="react-select-container"
                classNamePrefix="react-select"
                required
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    boxShadow: 'none',
                    '&:hover': {
                      border: '1px solid var(--primary-light)'
                    },
                    padding: '0.15rem'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? 'var(--primary)' : state.isFocused ? 'var(--primary-light)' : 'transparent',
                    color: state.isSelected ? 'white' : 'var(--text-main)',
                    '&:active': {
                      backgroundColor: 'var(--primary)'
                    }
                  })
                }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Project / Event (Optional)</label>
              <Select
                name="project_id"
                options={projects.map(proj => ({ value: proj.id, label: proj.name }))}
                value={projects.map(proj => ({ value: proj.id, label: proj.name })).find(option => option.value === formData.project_id) || null}
                onChange={(selectedOption) => setFormData({ ...formData, project_id: selectedOption ? selectedOption.value : '' })}
                placeholder="Search project..."
                isClearable={true}
                isSearchable={true}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    boxShadow: 'none',
                    '&:hover': {
                      border: '1px solid var(--primary-light)'
                    },
                    padding: '0.15rem'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? 'var(--primary)' : state.isFocused ? 'var(--primary-light)' : 'transparent',
                    color: state.isSelected ? 'white' : 'var(--text-main)',
                    '&:active': {
                      backgroundColor: 'var(--primary)'
                    }
                  })
                }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description / Vendor / Remarks</label>
            <textarea 
              name="description" 
              className="input-field" 
              value={formData.description} 
              onChange={handleChange}
              rows="3"
              placeholder="e.g. Paid ABC Printers for posters"
              required 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {canCreateDirectly && (
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <input 
                  type="text" 
                  name="payment_method" 
                  className="input-field" 
                  value={formData.payment_method} 
                  onChange={handleChange}
                  placeholder="UPI, Cash, Bank Transfer..."
                />
              </div>
            )}
            
            {canCreateDirectly && (
              <div className="form-group">
                <label className="form-label">Reference Number (Optional)</label>
                <input 
                  type="text" 
                  name="reference_number" 
                  className="input-field" 
                  value={formData.reference_number} 
                  onChange={handleChange}
                  placeholder="Txn ID, Bill No."
                />
              </div>
            )}
          </div>
          
          {canCreateDirectly && (
            <div className="form-group">
              <label className="form-label">Transaction Date</label>
              <input 
                type="date" 
                name="transaction_date" 
                className="input-field" 
                value={formData.transaction_date} 
                onChange={handleChange}
                required 
              />
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading} 
              style={{ backgroundColor: canCreateDirectly ? 'var(--danger)' : 'var(--primary)' }}
            >
              {loading && !showUploadModal ? 'Saving...' : (canCreateDirectly ? 'Save Expense' : 'Submit for Approval')}
            </button>
          </div>
        </form>
      </div>

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Expense Recorded!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Would you like to attach a receipt to this transaction?</p>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Select Receipt File</label>
                <input 
                  type="file" 
                  className="input-field" 
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleSkipUpload}>Skip</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !file}>
                  {loading ? 'Uploading...' : 'Upload Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
