import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/category';
import { Plus, Tag, Trash2, Edit } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Expense', color: '#10B981' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryService.createCategory(formData);
      setShowModal(false);
      setFormData({ name: '', type: 'Expense', color: '#10B981' });
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to create category");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This cannot be undone.")) {
      try {
        await categoryService.deleteCategory(id);
        fetchCategories();
      } catch (error) {
        alert("Failed to delete category");
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Categories</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage customizable income and expense categories.</p>
        </div>
        <div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>Expense Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.filter(c => c.type === 'Expense').map(category => (
              <div key={category.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: category.color || 'var(--danger)' }}></div>
                  <span style={{ fontWeight: 500 }}>{category.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleDelete(category.id)} className="btn btn-secondary" style={{ padding: '0.25rem', color: 'var(--danger)', backgroundColor: 'transparent', border: 'none' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {categories.filter(c => c.type === 'Expense').length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No expense categories defined.</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Income Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.filter(c => c.type === 'Income').map(category => (
              <div key={category.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: category.color || 'var(--accent)' }}></div>
                  <span style={{ fontWeight: 500 }}>{category.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleDelete(category.id)} className="btn btn-secondary" style={{ padding: '0.25rem', color: 'var(--danger)', backgroundColor: 'transparent', border: 'none' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {categories.filter(c => c.type === 'Income').length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No income categories defined.</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Add New Category</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select 
                  className="input-field" 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
