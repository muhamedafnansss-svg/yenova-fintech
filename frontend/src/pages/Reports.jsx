import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/reports';
import { projectService } from '../services/project';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  FileCode,
  Loader2
} from 'lucide-react';

const Reports = () => {
  const [loadingType, setLoadingType] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (e) {
      console.error("Failed to load projects for reports", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleDownload = async (format, type = 'all', projectId = '', customName = '') => {
    const actionKey = `${format}_${type}_${projectId || 'global'}`;
    setLoadingType(actionKey);
    try {
      const label = customName || type;
      if (format === 'pdf') {
        await reportsService.exportPdf(type, projectId, customName);
        showToast(`Downloaded ${label} statement as PDF (.pdf)`, 'success');
      } else if (format === 'excel') {
        await reportsService.exportExcel(type, projectId, customName);
        showToast(`Downloaded ${label} workbook as Excel (.xlsx)`, 'success');
      } else if (format === 'docx') {
        await reportsService.exportDocx(type, projectId, customName);
        showToast(`Downloaded ${label} report as Word (.docx)`, 'success');
      } else if (format === 'csv') {
        await reportsService.exportCsv(type, projectId, customName);
        showToast(`Downloaded ${label} data as CSV (.csv)`, 'success');
      }
    } catch (e) {
      console.error(e);
      showToast(`Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setLoadingType(null);
    }
  };

  const reportPeriods = [
    {
      id: 'daily',
      title: 'Daily Financial Report',
      periodLabel: 'Today (Past 24 Hours)',
      description: 'Itemized receipts, payment vouchers, and real-time cash balance for today.',
      icon: Clock,
      color: '#3b82f6',
      badge: 'Real-time'
    },
    {
      id: 'weekly',
      title: 'Weekly Financial Report',
      periodLabel: 'Current Academic Week',
      description: 'Monday to Sunday cashflow audit, categorized inflows and club expenditures.',
      icon: Calendar,
      color: '#8b5cf6',
      badge: 'Weekly Cycle'
    },
    {
      id: 'monthly',
      title: 'Monthly Financial Statement',
      periodLabel: 'Current Month-to-Date',
      description: 'Full calendar month reconciliation with KPI metrics, net profit, and department totals.',
      icon: TrendingUp,
      color: '#0ea5e9',
      badge: 'Month-to-Date'
    },
    {
      id: 'yearly',
      title: 'Annual Academic Report',
      periodLabel: 'Fiscal Year (June 1 - Present)',
      description: 'Comprehensive annual academic year audit statement for institutional oversight.',
      icon: Award,
      color: '#f59e0b',
      badge: 'Academic Fiscal'
    }
  ];

  return (
    <div style={{ paddingBottom: '3rem' }}>
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
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.85rem' }}>Financial Reports & Data Exports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Generate professional statements and export data in <strong>Excel (.xlsx)</strong>, <strong>Word (.docx)</strong>, <strong>PDF (.pdf)</strong>, and <strong>CSV (.csv)</strong> formats.
        </p>
      </div>

      {/* SECTION 1: PERIODIC EXECUTIVE REPORTS */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Layers size={22} color="var(--primary)" />
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Periodic Executive Reports</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {reportPeriods.map((period) => {
            const Icon = period.icon;
            const isExcelLoading = loadingType === `excel_${period.id}_global`;
            const isDocxLoading = loadingType === `docx_${period.id}_global`;
            const isPdfLoading = loadingType === `pdf_${period.id}_global`;
            const isCsvLoading = loadingType === `csv_${period.id}_global`;

            return (
              <div 
                key={period.id} 
                className="card" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ 
                      padding: '0.75rem', 
                      backgroundColor: `${period.color}15`, 
                      borderRadius: '0.5rem', 
                      color: period.color 
                    }}>
                      <Icon size={24} />
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 600, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px', 
                      backgroundColor: 'var(--bg-main)', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)' 
                    }}>
                      {period.badge}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{period.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: period.color, fontWeight: 600, marginBottom: '0.5rem' }}>
                    {period.periodLabel}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.4, margin: '0 0 1.25rem 0' }}>
                    {period.description}
                  </p>
                </div>

                {/* Download Options Bar */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Download Format:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                    {/* Excel Button */}
                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#059669', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.5rem 0.25rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('excel', period.id, '', period.title)}
                      disabled={loadingType !== null}
                      title={`Export ${period.title} as Excel (.xlsx)`}
                    >
                      {isExcelLoading ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                      <span>Excel</span>
                    </button>

                    {/* Word Button */}
                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#2563eb', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.5rem 0.25rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('docx', period.id, '', period.title)}
                      disabled={loadingType !== null}
                      title={`Export ${period.title} as Word Document (.docx)`}
                    >
                      {isDocxLoading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                      <span>Word</span>
                    </button>

                    {/* PDF Button */}
                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.5rem 0.25rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('pdf', period.id, '', period.title)}
                      disabled={loadingType !== null}
                      title={`Export ${period.title} as PDF (.pdf)`}
                    >
                      {isPdfLoading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                      <span>PDF</span>
                    </button>

                    {/* CSV Button */}
                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#6366f1', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.5rem 0.25rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('csv', period.id, '', period.title)}
                      disabled={loadingType !== null}
                      title={`Export ${period.title} as CSV (.csv)`}
                    >
                      {isCsvLoading ? <Loader2 size={12} className="animate-spin" /> : <FileCode size={12} />}
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: RAW GENERAL LEDGER EXPORT */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="card" style={{ 
          padding: '2rem', 
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.04) 100%)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: '0.65rem', color: '#10b981' }}>
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Master General Ledger Export</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
                Complete transaction dataset with adaptive metadata, payment references, and audit balances.
              </p>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', maxWidth: '850px' }}>
            Download the comprehensive transaction registry across all fiscal years. Ideal for external audits, institutional regulatory compliance, formula-driven modeling, and deep pivot analysis.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            {/* Excel Master */}
            <button 
              className="btn flex items-center justify-center gap-2" 
              onClick={() => handleDownload('excel', 'all', '', 'Master_General_Ledger')} 
              disabled={loadingType !== null} 
              style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: '#059669', 
                color: '#fff', 
                fontWeight: 600,
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              {loadingType === 'excel_all_global' ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Word Master */}
            <button 
              className="btn flex items-center justify-center gap-2" 
              onClick={() => handleDownload('docx', 'all', '', 'Master_General_Ledger')} 
              disabled={loadingType !== null} 
              style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: '#2563eb', 
                color: '#fff', 
                fontWeight: 600,
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              {loadingType === 'docx_all_global' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              <span>Export Word (.docx)</span>
            </button>

            {/* PDF Statement Master */}
            <button 
              className="btn flex items-center justify-center gap-2" 
              onClick={() => handleDownload('pdf', 'all', '', 'Master_General_Ledger')} 
              disabled={loadingType !== null} 
              style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: '#ef4444', 
                color: '#fff', 
                fontWeight: 600,
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              {loadingType === 'pdf_all_global' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              <span>Export PDF (.pdf)</span>
            </button>

            {/* CSV Data Master */}
            <button 
              className="btn flex items-center justify-center gap-2" 
              onClick={() => handleDownload('csv', 'all', '', 'Master_General_Ledger')} 
              disabled={loadingType !== null} 
              style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: '#6366f1', 
                color: '#fff', 
                fontWeight: 600,
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              {loadingType === 'csv_all_global' ? <Loader2 size={18} className="animate-spin" /> : <FileCode size={18} />}
              <span>Export CSV (.csv)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROJECT / EVENT FINANCIAL STATEMENTS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Project & Event Financial Statements</h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {loadingProjects ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
            Loading project statements...
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No projects found. Create projects in the Projects section to generate project-specific financial workbooks.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {projects.map((proj) => {
              const isExcelLoading = loadingType === `excel_event_${proj.id}`;
              const isDocxLoading = loadingType === `docx_event_${proj.id}`;
              const isPdfLoading = loadingType === `pdf_event_${proj.id}`;
              const isCsvLoading = loadingType === `csv_event_${proj.id}`;

              return (
                <div 
                  key={proj.id} 
                  className="card" 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '0.65rem', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {proj.project_code || 'PRJ'}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '9999px', 
                        backgroundColor: proj.status === 'Completed' ? '#10b98115' : '#3b82f615',
                        color: proj.status === 'Completed' ? '#10b981' : '#3b82f6',
                        fontWeight: 600
                      }}>
                        {proj.status}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem' }}>{proj.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Allocated Budget: <strong>Rs. {Number(proj.allocated_budget || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#059669', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.45rem 0.2rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('excel', 'event', proj.id, proj.name)}
                      disabled={loadingType !== null}
                      title={`Download "${proj.name}" Excel (.xlsx)`}
                    >
                      {isExcelLoading ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                      <span>Excel</span>
                    </button>

                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#2563eb', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.45rem 0.2rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('docx', 'event', proj.id, proj.name)}
                      disabled={loadingType !== null}
                      title={`Download "${proj.name}" Word (.docx)`}
                    >
                      {isDocxLoading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                      <span>Word</span>
                    </button>

                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.45rem 0.2rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('pdf', 'event', proj.id, proj.name)}
                      disabled={loadingType !== null}
                      title={`Download "${proj.name}" PDF (.pdf)`}
                    >
                      {isPdfLoading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                      <span>PDF</span>
                    </button>

                    <button 
                      className="btn flex items-center justify-center gap-1"
                      style={{ 
                        backgroundColor: '#6366f1', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        padding: '0.45rem 0.2rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDownload('csv', 'event', proj.id, proj.name)}
                      disabled={loadingType !== null}
                      title={`Download "${proj.name}" CSV (.csv)`}
                    >
                      {isCsvLoading ? <Loader2 size={12} className="animate-spin" /> : <FileCode size={12} />}
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
