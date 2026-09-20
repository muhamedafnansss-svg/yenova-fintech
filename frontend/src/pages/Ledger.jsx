import React, { useState, useEffect, useMemo } from 'react';
import { ledgerService } from '../services/ledger';
import { documentService } from '../services/document';
import { downloadBlob } from '../utils/fileDownloader';
import api from '../services/api';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Paperclip, 
  FileText, 
  Upload, 
  UploadCloud,
  CheckCircle, 
  Ban, 
  Eye, 
  AlertTriangle, 
  X, 
  Check, 
  FileSpreadsheet, 
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckSquare,
  Square,
  DollarSign,
  Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ImportScannerModal from '../components/ImportScannerModal';

const Ledger = () => {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, Income, Expense
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Completed, Verified, Voided, Approved
  const [showFilters, setShowFilters] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(25);

  // Dynamic Excel/Scanner Importer State
  const [showImportModal, setShowImportModal] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Attachments Modal State
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Receipt');
  const [uploading, setUploading] = useState(false);

  // Single Row Verification Modal State
  const [verifyModalTx, setVerifyModalTx] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Single Row Void Modal State
  const [voidModalTx, setVoidModalTx] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  // Single Row Delete Modal State
  const [deleteModalTx, setDeleteModalTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Action Modals State
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkDeletePermanent, setBulkDeletePermanent] = useState(true);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Starting Balance State & Modal
  const [balanceInfo, setBalanceInfo] = useState({ opening_balance: 0, current_balance: 0, financial_year: '2026-2027' });
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [newStartingBalance, setNewStartingBalance] = useState('');
  const [updatingStartingBalance, setUpdatingStartingBalance] = useState(false);

  // Global Accumulated Ledger Summary (Across All Pages)
  const [ledgerSummary, setLedgerSummary] = useState({
    total_records: 0,
    total_income: 0,
    total_expense: 0,
    verified_count: 0,
    voided_count: 0,
    opening_balance: 0,
    live_balance: 0,
    financial_year: '2026-2027'
  });

  // Interactive Hover State for KPI Cards
  const [hoveredCard, setHoveredCard] = useState(null);

  const fetchBalanceInfo = async () => {
    try {
      const data = await ledgerService.getBalanceDetails();
      setBalanceInfo(data);
    } catch (e) {
      console.error("Error fetching balance details", e);
    }
  };

  const handleSaveStartingBalance = async (e) => {
    e.preventDefault();
    setUpdatingStartingBalance(true);
    try {
      const amount = parseFloat(newStartingBalance) || 0;
      await ledgerService.setOpeningBalance({
        financial_year: balanceInfo.financial_year || '2026-2027',
        opening_balance: amount
      });
      showToast(`Starting balance updated to ₹${amount.toLocaleString('en-IN')}`, 'success');
      setShowAdjustBalanceModal(false);
      await Promise.all([fetchBalanceInfo(), fetchTransactions()]);
    } catch (err) {
      console.error(err);
      showToast("Failed to update starting balance", 'error');
    } finally {
      setUpdatingStartingBalance(false);
    }
  };

  // Fetch transactions and accumulated ledger summary from backend
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [data, summaryData] = await Promise.all([
        ledgerService.getLedger(skip, limit, searchTerm),
        ledgerService.getLedgerSummary(searchTerm)
      ]);
      setTransactions(data);
      if (summaryData) {
        setLedgerSummary(summaryData);
      }
    } catch (error) {
      console.error("Error fetching ledger", error);
      showToast("Failed to fetch ledger transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchBalanceInfo();
  }, [skip, limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSkip(0);
    fetchTransactions();
  };

  // Filtered transactions for UI
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, statusFilter]);

  // Clean up selected IDs if transactions change
  useEffect(() => {
    const validIds = new Set(transactions.map(t => t.id));
    setSelectedIds(prev => prev.filter(id => validIds.has(id)));
  }, [transactions]);

  // Checkbox selection helpers
  const isAllSelected = useMemo(() => {
    return filteredTransactions.length > 0 && filteredTransactions.every(tx => selectedIds.includes(tx.id));
  }, [filteredTransactions, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      setSelectedIds([]);
    } else {
      // Select all visible
      const allFilteredIds = filteredTransactions.map(tx => tx.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...allFilteredIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Quick stats computed specifically for CURRENT PAGE
  const pageStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let verified = 0;
    let voided = 0;

    filteredTransactions.forEach(tx => {
      if (tx.status === 'Voided') {
        voided += 1;
        return;
      }
      if (tx.type === 'Income') income += tx.amount;
      if (tx.type === 'Expense') expense += tx.amount;
      if (tx.status === 'Verified') verified += 1;
    });

    return { 
      income, 
      expense, 
      verified, 
      voided, 
      net: income - expense,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Page calculations
  const currentPage = Math.floor(skip / limit) + 1;
  const totalRecords = ledgerSummary.total_records || transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  // ==========================================
  // ATTACHMENTS ACTIONS
  // ==========================================
  const openAttachments = async (tx) => {
    setActiveTx(tx);
    setUploadFile(null);
    setUploadCategory(tx.type === 'Expense' ? 'Invoice' : 'Receipt');
    setShowAttachModal(true);
    fetchAttachments(tx.id);
  };

  const fetchAttachments = async (txId) => {
    setLoadingAttachments(true);
    try {
      const docs = await documentService.getDocuments({ transaction_id: txId });
      setAttachments(docs);
    } catch (e) {
      console.error("Error fetching attachments", e);
      showToast("Could not load attachments", "error");
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!uploadFile || !activeTx) return;
    setUploading(true);
    try {
      await documentService.uploadDocument(uploadFile, {
        document_category: uploadCategory,
        transaction_id: activeTx.id
      });
      setUploadFile(null);
      const fileInput = document.getElementById('attachment-file-input');
      if (fileInput) fileInput.value = '';
      showToast("Document attached successfully", "success");
      fetchAttachments(activeTx.id);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to upload attachment", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      await documentService.downloadDocument(doc.id, doc.original_name);
      showToast(`Downloaded: ${doc.original_name}`, "success");
    } catch (e) {
      console.error(e);
      showToast("Download failed", "error");
    }
  };

  const handlePreviewDoc = async (doc) => {
    try {
      await documentService.previewDocument(doc.id, doc.original_name);
    } catch (e) {
      console.error(e);
      showToast("Could not preview file", "error");
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to remove this attached file?")) return;
    try {
      await documentService.deleteDocument(docId);
      showToast("Attachment removed", "success");
      if (activeTx) fetchAttachments(activeTx.id);
    } catch (e) {
      console.error(e);
      showToast("Failed to delete attachment", "error");
    }
  };

  // ==========================================
  // SINGLE ROW ACTIONS
  // ==========================================
  const handleOpenVerifyModal = (tx) => {
    setVerifyModalTx(tx);
  };

  const handleConfirmVerify = async () => {
    if (!verifyModalTx) return;
    setVerifying(true);
    try {
      await ledgerService.verifyTransaction(verifyModalTx.id);
      showToast(`Transaction ${verifyModalTx.transaction_number} verified!`, "success");
      setVerifyModalTx(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error verifying entry", error);
      showToast(error.response?.data?.detail || "Failed to verify transaction", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenVoidModal = (tx) => {
    setVoidModalTx(tx);
    setVoidReason('Duplicate or clerical correction');
  };

  const handleConfirmVoid = async () => {
    if (!voidModalTx) return;
    setVoiding(true);
    try {
      await ledgerService.voidTransaction(voidModalTx.id, voidReason);
      showToast(`Transaction ${voidModalTx.transaction_number} voided`, "success");
      setVoidModalTx(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error voiding entry", error);
      showToast(error.response?.data?.detail || "Failed to void transaction", "error");
    } finally {
      setVoiding(false);
    }
  };

  const handleOpenDeleteModal = (tx) => {
    setDeleteModalTx(tx);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalTx) return;
    setDeleting(true);
    try {
      await ledgerService.deleteTransaction(deleteModalTx.id);
      showToast(`Transaction ${deleteModalTx.transaction_number} permanently deleted`, "success");
      setDeleteModalTx(null);
      // Remove from selectedIds if selected
      setSelectedIds(prev => prev.filter(id => id !== deleteModalTx.id));
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting entry", error);
      showToast(error.response?.data?.detail || "Failed to delete transaction", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // BULK ACTIONS
  // ==========================================
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await ledgerService.bulkDelete(selectedIds, bulkDeletePermanent, "Bulk delete from ledger");
      showToast(res.message || `${selectedIds.length} transaction(s) deleted`, "success");
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      fetchTransactions();
    } catch (error) {
      console.error("Bulk delete error", error);
      showToast(error.response?.data?.detail || "Failed to delete selected transactions", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleConfirmBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await ledgerService.bulkVerify(selectedIds);
      showToast(res.message || `${selectedIds.length} transaction(s) verified`, "success");
      setSelectedIds([]);
      setShowBulkVerifyModal(false);
      fetchTransactions();
    } catch (error) {
      console.error("Bulk verify error", error);
      showToast(error.response?.data?.detail || "Failed to verify selected transactions", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ==========================================
  // EXPORT
  // ==========================================
  const handleExport = async (format) => {
    setExporting(true);
    try {
      let endpoint = '/export/excel';
      let filename = 'Yenova_FinTech_Ledger.xlsx';
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (format === 'docx') {
        endpoint = '/export/docx?report_type=all';
        filename = 'Yenova_FinTech_Ledger.docx';
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (format === 'pdf') {
        endpoint = '/export/pdf?report_type=all';
        filename = 'Yenova_FinTech_Ledger.pdf';
        mimeType = 'application/pdf';
      } else if (format === 'csv') {
        endpoint = '/export/csv?report_type=all';
        filename = 'Yenova_FinTech_Ledger.csv';
        mimeType = 'text/csv;charset=utf-8;';
      }
      
      const response = await api.get(endpoint, { responseType: 'blob' });
      downloadBlob(response.data, filename, mimeType);
      
      showToast(`Exported ${format.toUpperCase()} successfully`, 'success');
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      showToast(`Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Verified':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#059669',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}>
            <ShieldCheck size={12} /> VERIFIED
          </span>
        );
      case 'Voided':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#dc2626',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 600,
            textDecoration: 'line-through'
          }}>
            <Ban size={12} /> VOIDED
          </span>
        );
      case 'Approved':
        return (
          <span style={{
            color: 'var(--primary)',
            backgroundColor: 'rgba(30, 58, 138, 0.12)',
            border: '1px solid rgba(30, 58, 138, 0.25)',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            APPROVED
          </span>
        );
      default:
        return (
          <span style={{
            color: 'var(--text-muted)',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            {status?.toUpperCase() || 'COMPLETED'}
          </span>
        );
    }
  };

  return (
    <div style={{ position: 'relative', paddingBottom: selectedIds.length > 0 ? '5rem' : '1rem' }}>
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

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Financial Ledger</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Master record of all club income, expenditures, and approved disbursements.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button 
              onClick={() => setShowImportModal(true)} 
              className="btn btn-primary flex items-center gap-2"
              style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
            >
              <UploadCloud size={16} /> Import Payments (Excel / PDF / Docs)
            </button>
          )}
          <button 
            onClick={() => setShowExportModal(true)} 
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={16} /> Export Ledger
          </button>
        </div>
      </div>

      {/* Ledger Master KPI Cards (Accumulated Across All Pages with Hover Details for Current Page) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Card 1: Live Balance */}
        <div 
          className="card" 
          onMouseEnter={() => setHoveredCard('balance')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ 
            padding: '1rem 1.25rem', 
            borderLeft: '4px solid var(--primary)', 
            position: 'relative',
            transition: 'all 0.25s ease',
            transform: hoveredCard === 'balance' ? 'translateY(-2px)' : 'none',
            boxShadow: hoveredCard === 'balance' ? '0 10px 25px -5px rgba(30, 58, 138, 0.15)' : 'none',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={14} color="var(--primary)" /> Live Balance
              <span style={{ fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'rgba(30, 58, 138, 0.08)', color: 'var(--primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                All Pages
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setNewStartingBalance(String(ledgerSummary.opening_balance || balanceInfo.opening_balance || 0));
                  setShowAdjustBalanceModal(true);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                title="Adjust Starting Base Balance"
              >
                <Edit2 size={11} /> Set Base
              </button>
            )}
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            {formatCurrency(ledgerSummary.live_balance)}
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Base: {formatCurrency(ledgerSummary.opening_balance)}
            </span>
            {hoveredCard === 'balance' ? (
              <span style={{ color: pageStats.net >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, fontSize: '0.72rem' }}>
                📄 Page {currentPage} Net: {pageStats.net >= 0 ? '+' : ''}{formatCurrency(pageStats.net)}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                Hover for Page {currentPage}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Active Inflow (All Pages Accumulation + Hover for Page Income) */}
        <div 
          className="card" 
          onMouseEnter={() => setHoveredCard('inflow')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ 
            padding: '1rem 1.25rem', 
            borderLeft: '4px solid var(--accent)',
            position: 'relative',
            transition: 'all 0.25s ease',
            transform: hoveredCard === 'inflow' ? 'translateY(-2px)' : 'none',
            boxShadow: hoveredCard === 'inflow' ? '0 10px 25px -5px rgba(13, 148, 136, 0.2)' : 'none',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpRight size={14} color="var(--accent)" /> Active Inflow
            </div>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 600, 
              backgroundColor: hoveredCard === 'inflow' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(13, 148, 136, 0.08)', 
              color: 'var(--accent)', 
              padding: '0.1rem 0.45rem', 
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}>
              {hoveredCard === 'inflow' ? `Page ${currentPage} of ${totalPages}` : 'All Pages Total'}
            </span>
          </div>

          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {formatCurrency(hoveredCard === 'inflow' ? pageStats.income : ledgerSummary.total_income)}
            {hoveredCard === 'inflow' && (
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                (Total: {formatCurrency(ledgerSummary.total_income)})
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {hoveredCard === 'inflow' ? (
              <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.72rem' }}>
                ⚡ {pageStats.count} records on Page {currentPage} ({ledgerSummary.total_income > 0 ? ((pageStats.income / ledgerSummary.total_income) * 100).toFixed(0) : 0}% of all inflow)
              </span>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)' }}>
                  All {totalRecords} records
                </span>
                <span style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 500 }}>
                  Hover for Page {currentPage} ({formatCurrency(pageStats.income)})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Active Outflow (All Pages Accumulation + Hover for Page Outflow) */}
        <div 
          className="card" 
          onMouseEnter={() => setHoveredCard('outflow')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ 
            padding: '1rem 1.25rem', 
            borderLeft: '4px solid var(--danger)',
            position: 'relative',
            transition: 'all 0.25s ease',
            transform: hoveredCard === 'outflow' ? 'translateY(-2px)' : 'none',
            boxShadow: hoveredCard === 'outflow' ? '0 10px 25px -5px rgba(239, 68, 68, 0.15)' : 'none',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowDownRight size={14} color="var(--danger)" /> Active Outflow
            </div>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 600, 
              backgroundColor: hoveredCard === 'outflow' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)', 
              color: 'var(--danger)', 
              padding: '0.1rem 0.45rem', 
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}>
              {hoveredCard === 'outflow' ? `Page ${currentPage} of ${totalPages}` : 'All Pages Total'}
            </span>
          </div>

          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--danger)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {formatCurrency(hoveredCard === 'outflow' ? pageStats.expense : ledgerSummary.total_expense)}
            {hoveredCard === 'outflow' && (
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                (Total: {formatCurrency(ledgerSummary.total_expense)})
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {hoveredCard === 'outflow' ? (
              <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.72rem' }}>
                ⚡ Page {currentPage} Outflow: {formatCurrency(pageStats.expense)}
              </span>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)' }}>
                  All {totalRecords} records
                </span>
                <span style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 500 }}>
                  Hover for Page {currentPage} ({formatCurrency(pageStats.expense)})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Verified Entries */}
        <div 
          className="card" 
          onMouseEnter={() => setHoveredCard('verified')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ 
            padding: '1rem 1.25rem', 
            borderLeft: '4px solid #059669',
            transition: 'all 0.25s ease',
            transform: hoveredCard === 'verified' ? 'translateY(-2px)' : 'none',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} color="#059669" /> Verified Entries
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'rgba(5, 150, 105, 0.08)', color: '#059669', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
              All Pages
            </span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#059669' }}>
            {hoveredCard === 'verified' ? pageStats.verified : ledgerSummary.verified_count}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
              {hoveredCard === 'verified' ? `audited on page ${currentPage}` : 'audited'}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {hoveredCard === 'verified' ? `Total All Pages: ${ledgerSummary.verified_count}` : `Hover for Page ${currentPage} count`}
          </div>
        </div>

        {/* Card 5: Voided Records */}
        <div 
          className="card" 
          onMouseEnter={() => setHoveredCard('voided')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ 
            padding: '1rem 1.25rem', 
            borderLeft: '4px solid #94a3b8',
            transition: 'all 0.25s ease',
            transform: hoveredCard === 'voided' ? 'translateY(-2px)' : 'none',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Ban size={14} color="#94a3b8" /> Voided Records
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#64748b', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
              All Pages
            </span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {hoveredCard === 'voided' ? pageStats.voided : ledgerSummary.voided_count}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
              {hoveredCard === 'voided' ? `excluded on page ${currentPage}` : 'excluded'}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {hoveredCard === 'voided' ? `Total All Pages: ${ledgerSummary.voided_count}` : `Hover for Page ${currentPage} count`}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by transaction no, description, reference..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ minWidth: '90px' }}>Search</button>
          
          <button 
            type="button" 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2" 
            style={{ 
              backgroundColor: showFilters ? 'rgba(30, 58, 138, 0.08)' : 'transparent',
              borderColor: showFilters ? 'var(--primary)' : 'var(--border-color)',
              color: showFilters ? 'var(--primary)' : 'inherit'
            }}
          >
            <Filter size={18} /> Filters {showFilters ? '▲' : '▼'}
          </button>
        </form>

        {/* Expandable Filters */}
        {showFilters && (
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            marginTop: '1.25rem', 
            paddingTop: '1.25rem', 
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                TYPE:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'Income', 'Expense'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid',
                      cursor: 'pointer',
                      borderColor: typeFilter === t ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: typeFilter === t ? 'var(--primary)' : '#fff',
                      color: typeFilter === t ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                STATUS:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'Completed', 'Verified', 'Voided'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid',
                      cursor: 'pointer',
                      borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: statusFilter === s ? 'var(--primary)' : '#fff',
                      color: statusFilter === s ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(30,58,138,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
            <div>Loading ledger records...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'rgba(248, 250, 252, 0.95)' }}>
                    {/* Multi-Select Header Checkbox */}
                    {isAdmin && (
                      <th style={{ padding: '1rem 0.75rem 1rem 1.25rem', width: '42px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                          title="Select All Transactions"
                        />
                      </th>
                    )}
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Txn No.</th>
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category / Project</th>
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', width: isAdmin ? '160px' : '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Layers size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                        <div>No transactions match your search or filter.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isSelected = selectedIds.includes(tx.id);
                      return (
                        <tr 
                          key={tx.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)', 
                            backgroundColor: isSelected 
                              ? 'rgba(30, 58, 138, 0.08)' 
                              : (tx.status === 'Voided' ? 'rgba(241, 245, 249, 0.45)' : 'transparent'),
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          {/* Row Checkbox */}
                          {isAdmin && (
                            <td style={{ padding: '1rem 0.75rem 1rem 1.25rem', textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(tx.id)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                              />
                            </td>
                          )}

                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>
                            {tx.transaction_number}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {formatDate(tx.transaction_date)}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: tx.type === 'Income' ? 'rgba(13, 148, 136, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: tx.type === 'Income' ? 'var(--accent)' : 'var(--danger)',
                              border: `1px solid ${tx.type === 'Income' ? 'rgba(13, 148, 136, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                            }}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                              {tx.category ? tx.category.name : (tx.category_id ? 'General' : 'Uncategorized')}
                            </div>
                            {tx.project && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                🏷️ {tx.project.name}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem', maxWidth: '300px', fontSize: '0.875rem' }} title={tx.description}>
                            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.description}
                            </div>
                            {tx.custom_metadata && (() => {
                              try {
                                const parsed = JSON.parse(tx.custom_metadata);
                                const entries = Object.entries(parsed);
                                if (entries.length === 0) return null;
                                return (
                                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {entries.slice(0, 3).map(([k, v]) => (
                                      <span key={k} style={{
                                        fontSize: '0.68rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(30, 58, 138, 0.08)',
                                        color: 'var(--primary)',
                                        border: '1px solid rgba(30, 58, 138, 0.15)',
                                        fontFamily: 'monospace'
                                      }}>
                                        {k}: {v}
                                      </span>
                                    ))}
                                    {entries.length > 3 && (
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        +{entries.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                            {tx.reference_number && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                                Ref: {tx.reference_number}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {getStatusBadge(tx.status)}
                          </td>
                          <td style={{ 
                            padding: '1rem', 
                            textAlign: 'right', 
                            fontWeight: 700, 
                            fontSize: '0.95rem',
                            color: tx.status === 'Voided' ? 'var(--text-muted)' : (tx.type === 'Income' ? 'var(--accent)' : 'var(--danger)'), 
                            textDecoration: tx.status === 'Voided' ? 'line-through' : 'none' 
                          }}>
                            {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          
                          {/* ROW ACTION BUTTONS: [📎] [✔️] [🚫] [🗑️] */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                              
                              {/* BUTTON 1: ATTACHMENTS */}
                              <button 
                                onClick={() => openAttachments(tx)}
                                className="btn btn-secondary" 
                                style={{ 
                                  padding: '0.35rem', 
                                  color: 'var(--primary)', 
                                  backgroundColor: 'rgba(30, 58, 138, 0.08)', 
                                  border: '1px solid rgba(30, 58, 138, 0.15)',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer'
                                }}
                                title="Attachments & Invoices"
                              >
                                <Paperclip size={15} />
                              </button>
                              
                              {/* BUTTON 2: VERIFY */}
                              {isAdmin && (
                                tx.status === 'Verified' ? (
                                  <button 
                                    disabled
                                    style={{ 
                                      padding: '0.35rem', 
                                      color: '#059669', 
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                                      border: '1px solid rgba(16, 185, 129, 0.25)', 
                                      borderRadius: '0.375rem',
                                      cursor: 'default'
                                    }}
                                    title="Verified Transaction"
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                ) : (
                                  hasPermission("VERIFY_TRANSACTION") && tx.status !== 'Voided' && (
                                    <button 
                                      onClick={() => handleOpenVerifyModal(tx)}
                                      className="btn btn-secondary" 
                                      style={{ 
                                        padding: '0.35rem', 
                                        color: '#059669', 
                                        backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                                        border: '1px solid rgba(16, 185, 129, 0.25)', 
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer'
                                      }}
                                      title="Verify this transaction"
                                    >
                                      <CheckCircle size={15} />
                                    </button>
                                  )
                                )
                              )}

                              {/* BUTTON 3: VOID */}
                              {isAdmin && (
                                tx.status === 'Voided' ? (
                                  <button 
                                    disabled
                                    style={{ 
                                      padding: '0.35rem', 
                                      color: '#94a3b8', 
                                      backgroundColor: 'rgba(148, 163, 184, 0.15)', 
                                      border: '1px solid rgba(148, 163, 184, 0.3)', 
                                      borderRadius: '0.375rem',
                                      cursor: 'not-allowed'
                                    }}
                                    title="Transaction is voided"
                                  >
                                    <Ban size={15} />
                                  </button>
                                ) : (
                                  hasPermission("VOID_TRANSACTION") && (
                                    <button 
                                      onClick={() => handleOpenVoidModal(tx)}
                                      className="btn btn-secondary" 
                                      style={{ 
                                        padding: '0.35rem', 
                                        color: '#ea580c', 
                                        backgroundColor: 'rgba(234, 88, 12, 0.08)', 
                                        border: '1px solid rgba(234, 88, 12, 0.25)', 
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer'
                                      }}
                                      title="Void Transaction (Keep history but exclude from totals)"
                                    >
                                      <Ban size={15} />
                                    </button>
                                  )
                                )
                              )}

                              {/* BUTTON 4: PERMANENT DELETE */}
                              {isAdmin && (
                                <button 
                                  onClick={() => handleOpenDeleteModal(tx)}
                                  className="btn btn-secondary" 
                                  style={{ 
                                    padding: '0.35rem', 
                                    color: 'var(--danger)', 
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                                    border: '1px solid rgba(239, 68, 68, 0.25)', 
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Permanently Delete Transaction"
                                >
                                  <Trash2 size={15} />
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
            
            {/* Pagination Controls with Page-Specific Flow Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Showing <strong>{totalRecords > 0 ? skip + 1 : 0}–{Math.min(skip + limit, totalRecords)}</strong> of <strong>{totalRecords}</strong> records (Page {currentPage} of {totalPages})
                </span>

                {/* Page Flow Pill */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(241, 245, 249, 0.85)',
                    border: '1px solid var(--border-color)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  title={`All Pages Accumulated: +${formatCurrency(ledgerSummary.total_income)} Inflow | -${formatCurrency(ledgerSummary.total_expense)} Outflow`}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Page {currentPage} Flow:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>+{formatCurrency(pageStats.income)}</span>
                  <span style={{ color: 'var(--border-color)' }}>|</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>-{formatCurrency(pageStats.expense)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={skip === 0}
                  onClick={() => setSkip(Math.max(0, skip - limit))}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-secondary" 
                  disabled={skip + limit >= totalRecords}
                  onClick={() => setSkip(skip + limit)}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING BULK ACTIONS TOOLBAR (WHEN ROWS SELECTED)                        */}
      {/* ========================================================================= */}
      {isAdmin && selectedIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          borderRadius: '9999px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            <span style={{ 
              backgroundColor: 'var(--primary)', 
              color: '#fff', 
              borderRadius: '50%', 
              width: '24px', 
              height: '24px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              {selectedIds.length}
            </span>
            <span>Selected</span>
          </div>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Bulk Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setBulkDeletePermanent(true);
                setShowBulkDeleteModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--danger)',
                color: '#fff',
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>

            {hasPermission("VERIFY_TRANSACTION") && (
              <button
                onClick={() => setShowBulkVerifyModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <CheckCircle size={14} /> Verify Selected ({selectedIds.length})
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#cbd5e1',
                padding: '0.4rem 0.8rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ATTACHMENTS MODAL                                                      */}
      {/* ========================================================================= */}
      {showAttachModal && activeTx && (
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '0.75rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ 
                    backgroundColor: 'rgba(30, 58, 138, 0.1)', 
                    color: 'var(--primary)', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    fontFamily: 'monospace' 
                  }}>
                    {activeTx.transaction_number}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDate(activeTx.transaction_date)}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Attachments & Invoices</h3>
              </div>
              <button 
                onClick={() => setShowAttachModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-color)', 
              padding: '0.85rem 1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeTx.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Category: {activeTx.category?.name || 'General'}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: activeTx.type === 'Income' ? 'var(--accent)' : 'var(--danger)' }}>
                {activeTx.type === 'Income' ? '+' : '-'}{formatCurrency(activeTx.amount)}
              </div>
            </div>

            {/* Document list */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Attached Files ({attachments.length})
              </h4>
              
              {loadingAttachments ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading documents...
                </div>
              ) : attachments.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)' }}>
                  <FileText size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.35 }} />
                  <div style={{ fontSize: '0.875rem' }}>No receipts or documents attached to this transaction.</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Upload proof below to attach it to the audit ledger.</div>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachments.map(doc => (
                    <li 
                      key={doc.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem 1rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '0.5rem',
                        backgroundColor: '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '0.375rem', 
                          backgroundColor: 'rgba(30, 58, 138, 0.08)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          flexShrink: 0
                        }}>
                          <FileText size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.original_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{doc.document_category}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button 
                          onClick={() => handlePreviewDoc(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Preview file"
                        >
                          <Eye size={14} /> Preview
                        </button>

                        <button 
                          onClick={() => handleDownloadDoc(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Download file"
                        >
                          <Download size={14} />
                        </button>

                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteDoc(doc.id)}
                            style={{ 
                              padding: '0.35rem 0.5rem', 
                              fontSize: '0.75rem', 
                              background: 'none', 
                              border: '1px solid rgba(239, 68, 68, 0.3)', 
                              color: 'var(--danger)', 
                              borderRadius: '0.375rem',
                              cursor: 'pointer'
                            }}
                            title="Delete file"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Upload form */}
            {isAdmin ? (
              <form onSubmit={handleUploadAttachment} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Upload New Document
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Select File (PDF, PNG, JPG, CSV)</label>
                    <input 
                      id="attachment-file-input"
                      type="file" 
                      className="input-field" 
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      required
                      style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Category</label>
                    <select 
                      className="input-field"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <option value="Receipt">Receipt</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Approval">Approval Doc</option>
                      <option value="Statement">Statement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAttachModal(false)}
                  >
                    Close
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary flex items-center justify-center gap-2" 
                    disabled={uploading || !uploadFile}
                  >
                    {uploading ? 'Uploading...' : <><Upload size={16} /> Attach Document</>}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔒 Documents are read-only for club members.</span>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAttachModal(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SINGLE ROW DELETE CONFIRMATION MODAL                                   */}
      {/* ========================================================================= */}
      {deleteModalTx && (
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
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--danger)' }}>Delete Transaction</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permanent Removal</div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-main)', marginBottom: '1rem' }}>
              Are you sure you want to permanently delete transaction <strong style={{ fontFamily: 'monospace' }}>{deleteModalTx.transaction_number}</strong>?
            </p>

            <div style={{ 
              backgroundColor: 'var(--bg-color)', 
              padding: '0.85rem 1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ fontWeight: 700, color: deleteModalTx.type === 'Income' ? 'var(--accent)' : 'var(--danger)' }}>
                  {deleteModalTx.type === 'Income' ? '+' : '-'}{formatCurrency(deleteModalTx.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Description:</span>
                <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deleteModalTx.description}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setDeleteModalTx(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ backgroundColor: 'var(--danger)', color: '#fff', border: 'none' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BULK DELETE MODAL (FOR MULTIPLE SELECTED ROWS)                         */}
      {/* ========================================================================= */}
      {showBulkDeleteModal && (
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
            maxWidth: '500px',
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
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--danger)' }}>
                  Delete {selectedIds.length} Selected Transactions
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bulk Ledger Removal</div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#fef2f2', 
              padding: '0.85rem 1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.25rem',
              border: '1px solid #fecaca',
              fontSize: '0.85rem',
              color: '#991b1b',
              lineHeight: 1.4
            }}>
              <strong>Warning:</strong> You have selected <strong>{selectedIds.length} transaction(s)</strong>.
              Deleting them will permanently erase their records and recalculate your net ledger balance.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkActionLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                onClick={handleConfirmBulkDelete}
                disabled={bulkActionLoading}
                style={{ backgroundColor: 'var(--danger)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem' }}
              >
                {bulkActionLoading ? 'Deleting...' : `Yes, Delete All ${selectedIds.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BULK VERIFY MODAL                                                      */}
      {/* ========================================================================= */}
      {showBulkVerifyModal && (
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
            maxWidth: '500px',
            borderRadius: '0.75rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0
              }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  Verify {selectedIds.length} Selected Transactions
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audit Batch Certification</div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to verify all <strong>{selectedIds.length}</strong> selected entries? This will update their audit status to Verified.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowBulkVerifyModal(false)}
                disabled={bulkActionLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleConfirmBulkVerify}
                disabled={bulkActionLoading}
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              >
                {bulkActionLoading ? 'Verifying...' : `Verify All ${selectedIds.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SINGLE ROW VERIFY MODAL                                                */}
      {/* ========================================================================= */}
      {verifyModalTx && (
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
            maxWidth: '500px',
            borderRadius: '0.75rem',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0
              }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Verify Ledger Transaction</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audit Certification</div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-color)', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.25rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transaction:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{verifyModalTx.transaction_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: verifyModalTx.type === 'Income' ? 'var(--accent)' : 'var(--danger)' }}>
                  {formatCurrency(verifyModalTx.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description:</span>
                <span style={{ fontSize: '0.85rem', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {verifyModalTx.description}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setVerifyModalTx(null)}
                disabled={verifying}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleConfirmVerify}
                disabled={verifying}
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              >
                {verifying ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SINGLE ROW VOID MODAL                                                  */}
      {/* ========================================================================= */}
      {voidModalTx && (
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
            maxWidth: '500px',
            borderRadius: '0.75rem',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(234, 88, 12, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#ea580c',
                flexShrink: 0
              }}>
                <Ban size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Void Transaction</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exclude from Ledger Totals</div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-color)', 
              padding: '0.85rem 1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.25rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{voidModalTx.transaction_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(voidModalTx.amount)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Reason for Voiding:</label>
              <input 
                type="text" 
                className="input-field" 
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason..."
                required
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setVoidModalTx(null)}
                disabled={voiding}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                onClick={handleConfirmVoid}
                disabled={voiding || !voidReason.trim()}
                style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none' }}
              >
                {voiding ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. EXPORT OPTIONS MODAL                                                   */}
      {/* ========================================================================= */}
      {showExportModal && (
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
            maxWidth: '460px',
            borderRadius: '0.75rem',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Export Financial Ledger</h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="btn btn-secondary flex items-center justify-between"
                style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Download PDF Audit Document</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Formatted A4 layout with letterhead</div>
                  </div>
                </div>
                <Download size={16} />
              </button>

              <button 
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="btn btn-secondary flex items-center justify-between"
                style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileSpreadsheet size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Download Excel (.xlsx)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Full multi-sheet workbook with formulas and summaries</div>
                  </div>
                </div>
                <Download size={16} />
              </button>

              <button 
                onClick={() => handleExport('docx')}
                disabled={exporting}
                className="btn btn-secondary flex items-center justify-between"
                style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color="#2563eb" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Download Word Document (.docx)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Formatted executive report with KPI tables</div>
                  </div>
                </div>
                <Download size={16} />
              </button>

              <button 
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="btn btn-secondary flex items-center justify-between"
                style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color="#6366f1" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Download CSV (.csv)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Raw tabular data for data science and analysis</div>
                  </div>
                </div>
                <Download size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowExportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADJUST STARTING BASE BALANCE MODAL */}
      {showAdjustBalanceModal && (
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
            maxWidth: '480px',
            borderRadius: '0.75rem',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Set Starting Base Balance</h3>
              </div>
              <button onClick={() => setShowAdjustBalanceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Set whatever initial base amount you put. Inflows are added (+), and outflows are subtracted (-) from this figure.
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
                  placeholder="Enter base amount"
                  style={{ fontSize: '1.15rem', fontWeight: 700, padding: '0.75rem 1rem' }}
                />
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Quick Presets:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[0, 50000, 100000, 250000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setNewStartingBalance(String(preset))}
                      style={{ 
                        padding: '0.25rem 0.55rem', 
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: 'var(--bg-main)', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span>What You Put (Base):</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {formatCurrency(parseFloat(newStartingBalance) || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#059669' }}>
                  <span>+ Inflow (Ledger):</span>
                  <span style={{ fontWeight: 600 }}>+{formatCurrency(activeStats.income)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#dc2626' }}>
                  <span>- Outflow (Ledger):</span>
                  <span style={{ fontWeight: 600 }}>-{formatCurrency(activeStats.expense)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.92rem', 
                  fontWeight: 700, 
                  borderTop: '1px solid var(--border)', 
                  paddingTop: '0.4rem' 
                }}>
                  <span>= Resulting Live Balance:</span>
                  <span>
                    {formatCurrency((parseFloat(newStartingBalance) || 0) + activeStats.income - activeStats.expense)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAdjustBalanceModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updatingStartingBalance}
                >
                  {updatingStartingBalance ? 'Saving...' : 'Apply Base Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DYNAMIC ADAPTIVE EXCEL & SCANNER IMPORTER MODAL */}
      <ImportScannerModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(result) => {
          showToast(result.message || "Successfully imported payment records!", "success");
          fetchTransactions();
          fetchBalanceInfo();
        }}
      />
    </div>
  );
};

export default Ledger;
