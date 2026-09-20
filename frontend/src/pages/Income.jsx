import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ledgerService } from '../services/ledger';
import { categoryService } from '../services/category';
import { projectService } from '../services/project';
import { documentService } from '../services/document';
import Select from 'react-select';

const Income = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'Income',
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdTransactionId, setCreatedTransactionId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catData, projData] = await Promise.all([
          categoryService.getCategories(),
          projectService.getProjects()
        ]);
        setCategories(catData.filter(c => c.type === 'Income' && c.is_active));
        setProjects(projData.filter(p => p.status !== 'Archived' && p.status !== 'Cancelled'));
      } catch (err) {
        console.error("Error fetching options", err);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      
      const response = await ledgerService.addIncome(data);
      setCreatedTransactionId(response.id || response.transaction_id || response.uuid);
      setShowUploadModal(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving income.');
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
      alert('Income and receipt recorded successfully!');
      navigate('/ledger');
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Add Income</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Record incoming funds to the club.</p>
      
      <div className="card" style={{ maxWidth: '600px' }}>
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
            <label className="form-label">Description / Remarks</label>
            <textarea 
              name="description" 
              className="input-field" 
              value={formData.description} 
              onChange={handleChange}
              rows="3"
              placeholder="e.g. Received from ABC Corp for hackathon"
              required 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            
            <div className="form-group">
              <label className="form-label">Reference Number (Optional)</label>
              <input 
                type="text" 
                name="reference_number" 
                className="input-field" 
                value={formData.reference_number} 
                onChange={handleChange}
                placeholder="Txn ID, Cheque No."
              />
            </div>
          </div>
          
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
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && !showUploadModal ? 'Saving...' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Income Recorded!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Would you like to attach a receipt or invoice to this transaction?</p>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Select Document File</label>
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
                  {loading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
