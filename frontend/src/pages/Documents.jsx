import React, { useState, useEffect } from 'react';
import { documentService } from '../services/document';
import { FileText, Image, Search, Upload, Download, Trash2, Eye, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ category: 'Receipt' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const data = await documentService.getRepositoryStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats", error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (activeTab !== 'All') filters.category = activeTab;
      
      const data = await documentService.getDocuments(filters);
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    try {
      await documentService.uploadDocument(file, {
        document_category: uploadData.category
      });
      setShowUploadModal(false);
      setFile(null);
      fetchDocuments();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await documentService.deleteDocument(id);
        fetchDocuments();
        fetchStats();
      } catch (error) {
        alert(error.response?.data?.detail || "Failed to delete");
      }
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.original_name.toLowerCase().includes(search.toLowerCase()) || 
    doc.document_category.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (type) => {
    if (type.includes('pdf')) return <FileText size={24} color="#ef4444" />;
    if (type.includes('image')) return <Image size={24} color="#3b82f6" />;
    return <FileText size={24} color="#64748b" />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Document Repository</h1>
          <p style={{ color: 'var(--text-muted)' }}>Securely store and manage all financial evidence.</p>
        </div>
        <div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> Upload Document
          </button>
        </div>
      </div>

      {stats && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}>
            <HardDrive size={32} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500 }}>Storage Used</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatSize(stats.storage_used)} of {formatSize(stats.storage_limit)}</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, (stats.storage_used / stats.storage_limit) * 100)}%`, 
                backgroundColor: 'var(--primary)', 
                height: '100%',
                borderRadius: '4px'
              }}></div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span>Total Files: {stats.total_documents}</span>
              <span>• Receipts: {stats.category_counts?.Receipt || 0}</span>
              <span>• Invoices: {stats.category_counts?.Invoice || 0}</span>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {['All', 'Receipt', 'Invoice', 'Approval', 'Report', 'Other'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {tab === 'All' ? 'All Documents' : tab + 's'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by file name or category..." 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading repository...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>File</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Size</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Date Uploaded</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {getIcon(doc.file_type)}
                      <span style={{ fontWeight: 500 }}>{doc.original_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--primary)'
                    }}>
                      {doc.document_category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                    {formatSize(doc.file_size)}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => documentService.previewDocument(doc.id, doc.original_name)} className="btn btn-secondary flex items-center justify-center" style={{ padding: '0.5rem', minWidth: '40px' }} title="Preview">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => documentService.downloadDocument(doc.id, doc.original_name)} className="btn btn-secondary flex items-center justify-center" style={{ padding: '0.5rem', minWidth: '40px' }} title="Download File">
                        <Download size={16} />
                      </button>
                      {user?.role === 'Admin' && (
                        <button className="btn flex items-center justify-center" style={{ padding: '0.5rem', backgroundColor: 'var(--danger)', color: 'white', minWidth: '40px' }} onClick={() => handleDelete(doc.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No documents found in this repository.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Upload Document</h3>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Document Category</label>
                <select 
                  className="input-field" 
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                >
                  <option value="Receipt">Receipt</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Approval">Approval Letter</option>
                  <option value="Report">Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Select File (Max 5MB)</label>
                <input 
                  type="file" 
                  className="input-field" 
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !file}>
                  {loading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
