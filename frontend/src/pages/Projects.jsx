import React, { useState, useEffect, useMemo } from 'react';
import { projectService } from '../services/project';
import { documentService } from '../services/document';
import { reportsService } from '../services/reports';
import { 
  Plus, 
  Search, 
  Filter, 
  Paperclip, 
  FileText, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Eye,
  Edit2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    project_code: '',
    description: '',
    allocated_budget: ''
  });

  // Edit Project Modal State
  const [editModalProject, setEditModalProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    project_code: '',
    description: '',
    allocated_budget: '',
    status: 'Active',
    venue: '',
    start_date: '',
    end_date: ''
  });

  // Delete Project Modal State
  const [deleteModalProject, setDeleteModalProject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Attachments Modal State
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const openAttachments = async (project) => {
    setActiveProject(project);
    setShowAttachModal(true);
    fetchAttachments(project.id);
  };

  const fetchAttachments = async (projectId) => {
    try {
      const docs = await documentService.getDocuments({ project_id: projectId });
      setAttachments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!uploadFile || !activeProject) return;
    setUploading(true);
    try {
      await documentService.uploadDocument(uploadFile, {
        document_category: 'Approval',
        project_id: activeProject.id
      });
      setUploadFile(null);
      fetchAttachments(activeProject.id);
    } catch (err) {
      alert("Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        allocated_budget: parseFloat(formData.allocated_budget) || 0
      };
      await projectService.createProject(data);
      setShowModal(false);
      setFormData({ name: '', project_code: '', description: '', allocated_budget: '' });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to create project");
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects();
      
      // Fetch summary for each project to show progress
      const projectsWithSummary = await Promise.all(data.map(async (p) => {
        try {
          const summary = await projectService.getProjectSummary(p.id);
          return { ...p, summary };
        } catch (e) {
          return { ...p, summary: { allocated_budget: p.allocated_budget, spent: 0, collected: 0, remaining: p.allocated_budget, profit: 0 } };
        }
      }));
      
      setProjects(projectsWithSummary);
    } catch (error) {
      console.error("Error fetching projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!deleteModalProject) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(deleteModalProject.id);
      showToast(`Project "${deleteModalProject.name}" deleted successfully`, 'success');
      setDeleteModalProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Delete project error", err);
      showToast(err.response?.data?.detail || "Failed to delete project", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEditProject = (project) => {
    setEditModalProject(project);
    setEditFormData({
      name: project.name || '',
      project_code: project.project_code || '',
      description: project.description || '',
      allocated_budget: project.allocated_budget || 0,
      status: project.status || 'Active',
      venue: project.venue || '',
      start_date: project.start_date || '',
      end_date: project.end_date || ''
    });
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editModalProject) return;
    setEditing(true);
    try {
      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description ? editFormData.description.trim() : null,
        allocated_budget: parseFloat(editFormData.allocated_budget) || 0,
        status: editFormData.status,
        venue: editFormData.venue ? editFormData.venue.trim() : null,
        start_date: editFormData.start_date || null,
        end_date: editFormData.end_date || null
      };
      await projectService.updateProject(editModalProject.id, updateData);
      showToast(`Project "${editFormData.name}" updated successfully`, 'success');
      setEditModalProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Update project error", err);
      showToast(err.response?.data?.detail || "Failed to update project", 'error');
    } finally {
      setEditing(false);
    }
  };

  const handleExportExcel = async (project) => {
    try {
      await reportsService.exportExcel('event', project.id, project.name);
      showToast(`Exported "${project.name}" Excel (.xlsx)`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to export Excel report", 'error');
    }
  };

  const handleExportPdf = async (project) => {
    try {
      await reportsService.exportPdf('event', project.id);
      showToast(`Exported "${project.name}" PDF (.pdf)`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to export PDF report", 'error');
    }
  };

  const handleExportDocx = async (project) => {
    try {
      await reportsService.exportDocx('event', project.id, project.name);
      showToast(`Exported "${project.name}" Word (.docx)`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to export Word report", 'error');
    }
  };

  const handleExportCsv = async (project) => {
    try {
      await reportsService.exportCsv('event', project.id, project.name);
      showToast(`Exported "${project.name}" CSV (.csv)`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to export CSV report", 'error');
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(term) ||
      (p.project_code && p.project_code.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }, [projects, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          backgroundColor: toast.type === 'error' ? '#fee2e2' : '#ecfdf5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${toast.type === 'error' ? '#f87171' : '#6ee7b7'}`,
          fontSize: '0.875rem',
          fontWeight: 500,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, marginLeft: '0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Projects & Events</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage financial projects, events, and their budgets.</p>
        </div>
        <div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search projects by name, code, description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          {searchTerm && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading projects...</div>
      ) : (
        <div className="dashboard-grid">
          {filteredProjects.map((project) => {
            const usagePercentage = project.allocated_budget > 0 
              ? Math.min(100, Math.round((project.summary.spent / project.allocated_budget) * 100))
              : 0;
              
            return (
              <div key={project.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{project.name}</h3>
                    {project.project_code && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {project.project_code}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      backgroundColor: project.status === 'Planning' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: project.status === 'Planning' ? 'var(--primary)' : 'var(--accent)'
                    }}>
                      {project.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditProject(project)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem',
                        color: 'var(--primary)',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      title={`Edit ${project.name}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModalProject(project)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem',
                        color: 'var(--danger)',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      title={`Delete ${project.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description || 'No description provided.'}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Budget</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(project.allocated_budget)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Spent</div>
                    <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(project.summary.spent)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Collected</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(project.summary.collected)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Remaining</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(project.summary.remaining)}</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Budget Progress</span>
                    <span style={{ fontWeight: 500, color: usagePercentage > 90 ? 'var(--danger)' : (usagePercentage > 75 ? 'var(--warning)' : 'var(--text-main)') }}>
                      {usagePercentage}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${usagePercentage}%`, 
                      backgroundColor: usagePercentage > 90 ? 'var(--danger)' : (usagePercentage > 75 ? 'var(--warning)' : 'var(--primary)'),
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
                
                {/* Card Action Buttons: [Approvals] [Excel (.xlsx)] [Word (.docx)] [PDF (.pdf)] [CSV (.csv)] */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <button 
                    className="btn btn-secondary flex items-center justify-center gap-1" 
                    style={{ padding: '0.45rem 0.5rem', fontSize: '0.78rem', width: '100%' }} 
                    onClick={() => openAttachments(project)}
                    title="View & upload project approval documents"
                  >
                    <Paperclip size={13} /> Approvals & Documents
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                    <button 
                      className="btn flex items-center justify-center gap-1" 
                      style={{ 
                        padding: '0.45rem 0.2rem', 
                        fontSize: '0.74rem',
                        backgroundColor: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleExportExcel(project)}
                      title="Export Project Financial Report as Excel (.xlsx)"
                    >
                      <FileSpreadsheet size={12} /> Excel
                    </button>
                    <button 
                      className="btn flex items-center justify-center gap-1" 
                      style={{ 
                        padding: '0.45rem 0.2rem', 
                        fontSize: '0.74rem',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleExportDocx(project)}
                      title="Export Project Financial Report as Word (.docx)"
                    >
                      <FileText size={12} /> Word
                    </button>
                    <button 
                      className="btn flex items-center justify-center gap-1" 
                      style={{ 
                        padding: '0.45rem 0.2rem', 
                        fontSize: '0.74rem',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleExportPdf(project)}
                      title="Export Project Financial Report as PDF (.pdf)"
                    >
                      <FileText size={12} /> PDF
                    </button>
                    <button 
                      className="btn flex items-center justify-center gap-1" 
                      style={{ 
                        padding: '0.45rem 0.2rem', 
                        fontSize: '0.74rem',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleExportCsv(project)}
                      title="Export Project Transactions as CSV (.csv)"
                    >
                      <FileText size={12} /> CSV
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProjects.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', color: 'var(--text-muted)' }}>
              {searchTerm ? `No projects match "${searchTerm}".` : 'No projects found. Create your first project to get started.'}
            </div>
          )}
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteModalProject && (
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
          <div className="card" style={{
            width: '100%',
            maxWidth: '480px',
            borderRadius: '0.75rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--danger)',
                flexShrink: 0 
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--danger)' }}>Delete Project</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permanent Project Removal</div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-main)', marginBottom: '1rem' }}>
              Are you sure you want to delete project <strong>"{deleteModalProject.name}"</strong> ({deleteModalProject.project_code})?
            </p>

            <div style={{
              backgroundColor: '#fef2f2',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              border: '1px solid #fecaca',
              fontSize: '0.8rem',
              color: '#991b1b',
              lineHeight: 1.4
            }}>
              <strong>Notice:</strong> Any financial transactions associated with this project will remain in the Financial Ledger, but will be safely unlinked from this event.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setDeleteModalProject(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                onClick={handleConfirmDeleteProject}
                disabled={deleting}
                style={{ backgroundColor: 'var(--danger)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editModalProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Project</h3>
              <button 
                type="button" 
                onClick={() => setEditModalProject(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Project Code</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editFormData.project_code}
                    disabled
                    style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed', opacity: 0.7 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="input-field"
                    value={editFormData.status}
                    onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="Planning">Planning</option>
                    <option value="Registration Open">Registration Open</option>
                    <option value="Active">Active</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Allocated Budget (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editFormData.allocated_budget}
                  onChange={e => setEditFormData({...editFormData, allocated_budget: e.target.value})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Venue / Location</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Auditorium / Main Seminar Hall"
                  value={editFormData.venue}
                  onChange={e => setEditFormData({...editFormData, venue: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={editFormData.start_date}
                    onChange={e => setEditFormData({...editFormData, start_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={editFormData.end_date}
                    onChange={e => setEditFormData({...editFormData, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="input-field" 
                  value={editFormData.description}
                  onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalProject(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editing}>
                  {editing ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Create New Project</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Code (e.g. YNV-24)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.project_code}
                  onChange={e => setFormData({...formData, project_code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Allocated Budget (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.allocated_budget}
                  onChange={e => setFormData({...formData, allocated_budget: e.target.value})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="input-field" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachments Modal */}
      {showAttachModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Approval Documents</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Project: {activeProject?.name}
            </p>

            {/* List existing attachments */}
            <div style={{ marginBottom: '2rem' }}>
              {attachments.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', color: 'var(--text-muted)' }}>
                  No documents attached to this project.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachments.map(doc => (
                    <li key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={18} color="var(--primary)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.original_name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '0.1rem 0.5rem', borderRadius: '9999px' }}>{doc.document_category}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => documentService.previewDocument(doc.id, doc.original_name)} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Preview document"
                        >
                          <Eye size={13} /> Preview
                        </button>
                        <button 
                          type="button"
                          onClick={() => documentService.downloadDocument(doc.id, doc.original_name)} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Download document"
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Upload form */}
            <form onSubmit={handleUploadAttachment} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Upload Approval Letter or Budget Document</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="file" 
                    className="input-field" 
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    required
                  />
                  <button type="submit" className="btn btn-primary flex items-center justify-center gap-2" disabled={uploading || !uploadFile} style={{ minWidth: '120px' }}>
                    {uploading ? 'Uploading...' : <><Upload size={16} /> Upload</>}
                  </button>
                </div>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAttachModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
