import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText,
  Image,
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ArrowRight, 
  Tag, 
  Check, 
  RefreshCw,
  Layers,
  HelpCircle,
  Database,
  Plus
} from 'lucide-react';
import { ledgerService } from '../services/ledger';
import { categoryService } from '../services/category';
import { projectService } from '../services/project';
import Select from 'react-select';

const reactSelectModalStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.45rem',
    border: state.isFocused ? '1px solid var(--primary, #1e3a8a)' : '1px solid var(--border-color, #e2e8f0)',
    boxShadow: 'none',
    '&:hover': {
      border: '1px solid var(--primary, #1e3a8a)'
    },
    padding: '0.1rem',
    minHeight: '38px',
    backgroundColor: '#ffffff',
    fontSize: '0.85rem'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? 'var(--primary, #1e3a8a)' 
      : state.isFocused 
        ? 'rgba(30, 58, 138, 0.08)' 
        : 'transparent',
    color: state.isSelected ? '#ffffff' : 'var(--text-main, #1e293b)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    '&:active': {
      backgroundColor: 'var(--primary, #1e3a8a)',
      color: '#ffffff'
    }
  }),
  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--text-muted, #94a3b8)',
    fontSize: '0.85rem'
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-main, #1e293b)'
  })
};

const ImportScannerModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  // File & Upload State
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getFileIcon = (filename = '', size = 18) => {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.pdf')) {
      return <FileText size={size} color="#dc2626" />;
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      return <FileText size={size} color="#2563eb" />;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
      return <Image size={size} color="#ea580c" />;
    }
    return <FileSpreadsheet size={size} color="var(--primary)" />;
  };

  // Column Mapping State
  const [mapping, setMapping] = useState({
    amount_column: '',
    name_column: '',
    reference_column: '',
    date_column: '',
    payment_method_column: '',
    category_column: '',
    project_column: ''
  });

  // Transaction Flow State (Income vs Expense)
  const [transactionType, setTransactionType] = useState('Income');

  // Fixed Amount Override State (for Google Forms, registration sheets, and event tickets)
  const [fixedAmount, setFixedAmount] = useState('');

  // Batch Options
  const [allCategories, setAllCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [defaultMethod, setDefaultMethod] = useState('Scanner / UPI');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Quick-Add Project & Category State
  const [showQuickAddProject, setShowQuickAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [showDocColumnMapping, setShowDocColumnMapping] = useState(false);

  // Row Selection & Committing State
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [committing, setCommitting] = useState(false);

  // Load Categories and Projects on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cats, projs] = await Promise.all([
          categoryService.getCategories(),
          projectService.getProjects()
        ]);
        setAllCategories(cats || []);
        setProjects(projs || []);
      } catch (err) {
        console.error("Failed to load categories/projects for importer", err);
      }
    };
    loadMetadata();
  }, []);

  const categories = useMemo(() => {
    return allCategories.filter(c => c.type === transactionType && c.is_active);
  }, [allCategories, transactionType]);

  // Quick Create Project Handler
  const handleQuickCreateProject = async () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const existing = projects.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setSelectedProject(existing.id);
      setNewProjectName('');
      setShowQuickAddProject(false);
      return;
    }
    setCreatingProject(true);
    try {
      const cleanCode = (trimmed.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'PRJ') + '-' + Math.floor(1000 + Math.random() * 9000);
      const created = await projectService.createProject({
        name: trimmed,
        project_code: cleanCode,
        description: 'Created during payment import',
        status: 'Active'
      });
      setProjects(prev => [...prev, created]);
      setSelectedProject(created.id);
      setNewProjectName('');
      setShowQuickAddProject(false);
    } catch (err) {
      console.error("Failed to create project", err);
      alert(err.response?.data?.detail || "Could not create project.");
    } finally {
      setCreatingProject(false);
    }
  };

  // Quick Create Category Handler
  const handleQuickCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const existing = allCategories.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === transactionType);
    if (existing) {
      setSelectedCategory(existing.id);
      setNewCategoryName('');
      setShowQuickAddCategory(false);
      return;
    }
    setCreatingCategory(true);
    try {
      const created = await categoryService.createCategory({
        name: trimmed,
        type: transactionType,
        color: transactionType === 'Income' ? '#10B981' : '#EF4444',
        icon: 'tag',
        is_active: true
      });
      setAllCategories(prev => [...prev, created]);
      setSelectedCategory(created.id);
      setNewCategoryName('');
      setShowQuickAddCategory(false);
    } catch (err) {
      console.error("Failed to create category", err);
      alert(err.response?.data?.detail || "Could not create category.");
    } finally {
      setCreatingCategory(false);
    }
  };

  // Handle File Upload & Parsing
  const processFile = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setParsing(true);
    setErrorMessage('');
    
    try {
      const res = await ledgerService.parseExcelPayments(uploadedFile);
      setParsedData(res);
      
      // Auto-set detected mapping
      const detected = res.detected_mapping || {};
      const hasAmountCol = Boolean(detected.amount_column);

      let initialFixedAmount = '';
      if (!hasAmountCol && res.rows && res.rows.length > 0) {
        const rowWithAmt = res.rows.find(r => r._parsed_amount > 0);
        if (rowWithAmt && rowWithAmt._parsed_amount > 0) {
          initialFixedAmount = String(rowWithAmt._parsed_amount);
        }
      }
      setFixedAmount(initialFixedAmount);

      setMapping({
        amount_column: detected.amount_column || '__FIXED__',
        name_column: detected.name_column || '',
        reference_column: detected.reference_column || '',
        date_column: detected.date_column || '',
        payment_method_column: detected.payment_method_column || '',
        category_column: detected.category_column || '',
        project_column: detected.project_column || ''
      });

      // Select ALL rows by default so no student or participant is silently omitted!
      const allRowIds = res.rows.map(r => r._row_id);
      setSelectedRowIds(allRowIds);
    } catch (err) {
      console.error("Parse error", err);
      setErrorMessage(err.response?.data?.detail || "Could not parse file. Ensure it is a valid spreadsheet (.xlsx, .xls, .csv), PDF, Word document, ZIP, or payment receipt image.");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetFile = () => {
    setFile(null);
    setParsedData(null);
    setErrorMessage('');
    setSelectedRowIds([]);
    setFixedAmount('');
    setShowQuickAddProject(false);
    setNewProjectName('');
    setShowQuickAddCategory(false);
    setNewCategoryName('');
  };

  // Checkbox helpers
  const toggleSelectRow = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!parsedData) return;
    setSelectedRowIds(parsedData.rows.map(r => r._row_id));
  };

  const selectNonDuplicates = () => {
    if (!parsedData) return;
    setSelectedRowIds(parsedData.rows.filter(r => !r._is_duplicate).map(r => r._row_id));
  };

  const deselectAll = () => {
    setSelectedRowIds([]);
  };

  // Dynamic Custom Columns calculation
  const customColumns = useMemo(() => {
    if (!parsedData) return [];
    const mappedValues = new Set(Object.values(mapping).filter(Boolean));
    return parsedData.headers.filter(h => !mappedValues.has(h));
  }, [parsedData, mapping]);

  // Selected Amount Sum
  const selectedTotalAmount = useMemo(() => {
    if (!parsedData) return 0;
    const amountCol = mapping.amount_column;
    const isFixed = amountCol === '__FIXED__' || (fixedAmount && parseFloat(fixedAmount) > 0);
    const fixedNum = parseFloat(fixedAmount) || 0;

    if (isFixed && fixedNum > 0) {
      return selectedRowIds.length * fixedNum;
    }

    return parsedData.rows
      .filter(r => selectedRowIds.includes(r._row_id))
      .reduce((sum, r) => {
        const val = amountCol && amountCol !== '__FIXED__'
          ? parseFloat(String(r[amountCol]).replace(/[^0-9.]/g, '')) || 0
          : (fixedNum > 0 ? fixedNum : (r._parsed_amount || 0));
        return sum + val;
      }, 0);
  }, [parsedData, selectedRowIds, mapping, fixedAmount]);

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const canImport = !committing && selectedRowIds.length > 0 && (
    (fixedAmount && parseFloat(fixedAmount) > 0) ||
    (mapping.amount_column && mapping.amount_column !== '__FIXED__') ||
    selectedTotalAmount > 0
  );

  // Commit Import
  const handleCommit = async () => {
    if (!parsedData || selectedRowIds.length === 0) return;
    const isFixed = mapping.amount_column === '__FIXED__' || (fixedAmount && parseFloat(fixedAmount) > 0);
    if (!mapping.amount_column && !isFixed) {
      alert("Please choose an Amount Column or enter a Fixed / Uniform Amount to proceed.");
      return;
    }

    setCommitting(true);
    try {
      const fixedNum = parseFloat(fixedAmount) || 0;
      const selectedRows = parsedData.rows
        .filter(r => selectedRowIds.includes(r._row_id))
        .map(r => ({
          ...r,
          _parsed_amount: (isFixed && fixedNum > 0)
            ? fixedNum
            : (mapping.amount_column && mapping.amount_column !== '__FIXED__'
                ? (parseFloat(String(r[mapping.amount_column]).replace(/[^0-9.]/g, '')) || 0)
                : r._parsed_amount)
        }));

      const payload = {
        rows: selectedRows,
        mapping: mapping,
        category_id: selectedCategory || null,
        project_id: selectedProject || null,
        default_payment_method: defaultMethod,
        skip_duplicates: skipDuplicates,
        fixed_amount: (isFixed && fixedNum > 0) ? fixedNum : null,
        transaction_type: transactionType
      };

      const res = await ledgerService.commitExcelPayments(payload);
      if (onSuccess) {
        onSuccess(res);
      }
      onClose();
    } catch (err) {
      console.error("Import commit error", err);
      let errMsg = err.response?.data?.detail;
      if (typeof errMsg === "object") {
        errMsg = JSON.stringify(errMsg);
      }
      alert(errMsg || err.message || "Failed to commit imported transactions.");
    } finally {
      setCommitting(false);
    }
  };

  const reactSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.45rem',
      border: state.isFocused ? '1px solid var(--accent)' : '1px solid var(--border-color)',
      boxShadow: 'none',
      fontSize: '0.84rem',
      minHeight: '36px',
      backgroundColor: '#fff',
      cursor: 'pointer',
      '&:hover': {
        border: '1px solid var(--accent)'
      }
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999
    }),
    menu: (base) => ({
      ...base,
      zIndex: 99999,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
      borderRadius: '0.5rem',
      fontSize: '0.82rem'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.82rem',
      backgroundColor: state.isSelected ? 'var(--accent)' : state.isFocused ? 'rgba(13, 148, 136, 0.12)' : 'transparent',
      color: state.isSelected ? '#ffffff' : 'var(--text-main)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--accent)'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--text-muted)',
      fontSize: '0.82rem'
    })
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: parsedData ? '1140px' : '680px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0.85rem',
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        transition: 'max-width 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--card-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '0.6rem',
              backgroundColor: 'rgba(13, 148, 136, 0.12)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(13, 148, 136, 0.25)'
            }}>
              {parsedData?.filename ? getFileIcon(parsedData.filename, 22) : <FileSpreadsheet size={22} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Universal Payment & Scanner Importer
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(30, 58, 138, 0.1)',
                  color: 'var(--primary)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px'
                }}>
                  Universal Schema
                </span>
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Upload any Excel sheet, CSV export, PDF statement, Word document, or receipt image. Dynamic spaces are extracted automatically.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {errorMessage && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #f87171',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STAGE 1: UPLOAD DROPZONE */}
          {!parsedData && (
            <div>
              {/* Flow Type Toggle (Stage 1) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(241, 245, 249, 0.75)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.65rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Select Transaction Category / Flow
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Are you importing incoming funds (registrations/fees) or expenses (bills/vouchers)?
                  </div>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '0.5rem', padding: '0.2rem', gap: '0.2rem' }}>
                  <button
                    type="button"
                    id="stage1-flow-income-btn"
                    onClick={() => {
                      setTransactionType('Income');
                      setSelectedCategory('');
                    }}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '0.4rem',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: transactionType === 'Income' ? '#059669' : 'transparent',
                      color: transactionType === 'Income' ? '#ffffff' : '#475569',
                      boxShadow: transactionType === 'Income' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>↗</span> Inflow (Income / Fees)
                  </button>
                  <button
                    type="button"
                    id="stage1-flow-expense-btn"
                    onClick={() => {
                      setTransactionType('Expense');
                      setSelectedCategory('');
                    }}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '0.4rem',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: transactionType === 'Expense' ? '#e11d48' : 'transparent',
                      color: transactionType === 'Expense' ? '#ffffff' : '#475569',
                      boxShadow: transactionType === 'Expense' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>↘</span> Outflow (Expense / Bills)
                  </button>
                </div>
              </div>

              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: dragOver ? 'rgba(30, 58, 138, 0.04)' : 'rgba(248, 250, 252, 0.6)',
                  borderRadius: '0.75rem',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('excel-file-input').click()}
              >
                <input 
                  id="excel-file-input"
                  type="file" 
                  accept=".xlsx, .xls, .csv, .pdf, .docx, .doc, .zip, .png, .jpg, .jpeg, .webp" 
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(30, 58, 138, 0.08)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}>
                  {parsing ? (
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <UploadCloud size={30} />
                  )}
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  {parsing ? 'Analyzing document structure...' : 'Drop your Excel, CSV, PDF, Word, or Receipt Image here'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                  {parsing 
                    ? 'Extracting headers, mapping amounts, and creating dynamic custom spaces...' 
                    : 'Click to browse files or drag and drop. Supports .xlsx, .xls, .csv, .pdf, .docx, and receipt images.'}
                </p>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>.XLSX</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>.XLS</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>.CSV</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>.PDF</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>.DOCX</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: '#ffedd5', color: '#9a3412', fontWeight: 600 }}>.PNG / .JPG</span>
                </div>
              </div>

              {/* Engine Benefits Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginTop: '1.5rem'
              }}>
                <div style={{ padding: '0.85rem', borderRadius: '0.5rem', backgroundColor: 'rgba(30, 58, 138, 0.04)', border: '1px solid rgba(30, 58, 138, 0.1)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <Sparkles size={15} /> Flexible Layouts
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No rigid column names required. Auto-detects amounts and payer names in any order.
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '0.5rem', backgroundColor: 'rgba(13, 148, 136, 0.04)', border: '1px solid rgba(13, 148, 136, 0.15)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <Tag size={15} /> Dynamic Spaces
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Student IDs, Roll numbers, phone numbers, and departments are saved as searchable tags.
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <CheckCircle size={15} /> Duplicate Guard
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Checks against existing UTR/Reference numbers in the Ledger to prevent double-entry.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: PARSED PREVIEW & MAPPER */}
          {parsedData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* File details banner */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(30, 58, 138, 0.06)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(30, 58, 138, 0.15)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getFileIcon(parsedData.filename, 20)}
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{parsedData.filename}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ({parsedData.total_rows} records detected)
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={resetFile}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Change File
                </button>
              </div>

              {/* Flow Type Toggle (Stage 2) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: transactionType === 'Expense' ? 'rgba(254, 242, 242, 0.7)' : 'rgba(236, 253, 245, 0.7)',
                border: `1px solid ${transactionType === 'Expense' ? '#fecaca' : '#a7f3d0'}`,
                borderRadius: '0.65rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: transactionType === 'Expense' ? '#991b1b' : '#065f46' }}>
                    Flow Type: {transactionType === 'Expense' ? 'Outflow / Expense (Disbursements & Bills)' : 'Inflow / Income (Collections & Fees)'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Ledger will log these {parsedData.total_rows} records as {transactionType === 'Expense' ? 'Expense transactions' : 'Income transactions'}.
                  </div>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '0.5rem', padding: '0.2rem', gap: '0.2rem' }}>
                  <button
                    type="button"
                    id="stage2-flow-income-btn"
                    onClick={() => {
                      setTransactionType('Income');
                      setSelectedCategory('');
                    }}
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '0.4rem',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: transactionType === 'Income' ? '#059669' : 'transparent',
                      color: transactionType === 'Income' ? '#ffffff' : '#475569',
                      boxShadow: transactionType === 'Income' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <span>↗</span> Inflow (Income)
                  </button>
                  <button
                    type="button"
                    id="stage2-flow-expense-btn"
                    onClick={() => {
                      setTransactionType('Expense');
                      setSelectedCategory('');
                    }}
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '0.4rem',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: transactionType === 'Expense' ? '#e11d48' : 'transparent',
                      color: transactionType === 'Expense' ? '#ffffff' : '#475569',
                      boxShadow: transactionType === 'Expense' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <span>↘</span> Outflow (Expense)
                  </button>
                </div>
              </div>

              {/* Column Mapping & Custom Spaces Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Core Field Mapper */}
                <div style={{ padding: '1.25rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="var(--primary)" /> Core Financial Mappings
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Confirm or adjust which column represents the core financial fields:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          Amount Source <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        {(mapping.amount_column === '__FIXED__' || (fixedAmount && parseFloat(fixedAmount) > 0)) && (
                          <span style={{ fontSize: '0.68rem', backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            Custom Uniform Fee
                          </span>
                        )}
                      </div>
                      <select 
                        className="input-field" 
                        value={mapping.amount_column}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMapping(prev => ({ ...prev, amount_column: val }));
                        }}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      >
                        <option value="__FIXED__">⚡ Set Uniform Fixed Amount for All Entries</option>
                        <option value="">-- Choose Column from Sheet --</option>
                        {parsedData.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>

                      {/* Custom Uniform Amount Input */}
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.65rem', borderRadius: '0.4rem', backgroundColor: 'rgba(13, 148, 136, 0.05)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                          <span>Uniform Fee Amount (₹) per Participant</span>
                        </label>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          placeholder="e.g. 50, 100, 200, 500"
                          value={fixedAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFixedAmount(val);
                            if (val && parseFloat(val) > 0) {
                              setMapping(prev => ({ ...prev, amount_column: '__FIXED__' }));
                              if (selectedRowIds.length === 0) {
                                setSelectedRowIds(parsedData.rows.map(r => r._row_id));
                              }
                            }
                          }}
                          className="input-field"
                          style={{
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--accent)',
                            borderColor: fixedAmount ? 'var(--accent)' : 'var(--border-color)',
                            backgroundColor: '#fff'
                          }}
                        />
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {fixedAmount && parseFloat(fixedAmount) > 0 
                            ? `✓ Every selected participant will be recorded with ₹${parseFloat(fixedAmount).toLocaleString('en-IN')}.`
                            : `Enter the fee / amount per record here if your document has no explicit amount column.`}
                        </p>
                        {mapping.amount_column === '__FIXED__' && (!fixedAmount || parseFloat(fixedAmount) <= 0) && (
                          <div style={{
                            marginTop: '0.4rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '0.35rem',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#92400e',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <AlertTriangle size={13} />
                            <span>Action needed: Enter a fee (₹) above so the Import button can be enabled.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                        Payer / Student Name Column
                      </label>
                      <select 
                        className="input-field" 
                        value={mapping.name_column}
                        onChange={(e) => setMapping(prev => ({ ...prev, name_column: e.target.value }))}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      >
                        <option value="">-- None / Default Payer --</option>
                        {parsedData.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                        Scanner / UTR / Reference ID Column
                      </label>
                      <select 
                        className="input-field" 
                        value={mapping.reference_column}
                        onChange={(e) => setMapping(prev => ({ ...prev, reference_column: e.target.value }))}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      >
                        <option value="">-- None --</option>
                        {parsedData.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category & Project / Event (Matches Income/Expenses) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>
                            Category <span style={{ color: 'var(--danger)' }}>*</span>
                          </label>
                          <button
                            type="button"
                            id="importer-quick-add-category-toggle"
                            onClick={() => {
                              setShowQuickAddCategory(prev => !prev);
                              if (showQuickAddProject) setShowQuickAddProject(false);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: 0
                            }}
                          >
                            <Plus size={13} /> {showQuickAddCategory ? 'Cancel' : 'New Category'}
                          </button>
                        </div>

                        {showQuickAddCategory && (
                          <div style={{
                            display: 'flex',
                            gap: '0.35rem',
                            marginBottom: '0.4rem',
                            padding: '0.4rem',
                            backgroundColor: 'rgba(13, 148, 136, 0.05)',
                            borderRadius: '0.375rem',
                            border: '1px solid rgba(13, 148, 136, 0.18)'
                          }}>
                            <input 
                              type="text"
                              id="importer-quick-category-input"
                              placeholder={`New ${transactionType.toLowerCase()} category...`}
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleQuickCreateCategory();
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '0.3rem 0.5rem',
                                fontSize: '0.8rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--border-color)',
                                backgroundColor: '#fff'
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              id="importer-quick-category-submit"
                              onClick={handleQuickCreateCategory}
                              disabled={creatingCategory || !newCategoryName.trim()}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minWidth: 'auto', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                            >
                              {creatingCategory ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        )}

                        <Select
                          id="importer-category-select"
                          name="category_id"
                          options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                          value={categories.map(cat => ({ value: cat.id, label: cat.name })).find(option => option.value === selectedCategory) || null}
                          onChange={(selectedOption) => setSelectedCategory(selectedOption ? selectedOption.value : '')}
                          placeholder="Search category..."
                          isClearable={false}
                          isSearchable={true}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          styles={reactSelectModalStyles}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>
                            Project / Event <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                          </label>
                          <button
                            type="button"
                            id="importer-quick-add-project-toggle"
                            onClick={() => {
                              setShowQuickAddProject(prev => !prev);
                              if (showQuickAddCategory) setShowQuickAddCategory(false);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: 0
                            }}
                          >
                            <Plus size={13} /> {showQuickAddProject ? 'Cancel' : 'New Project'}
                          </button>
                        </div>

                        {showQuickAddProject && (
                          <div style={{
                            display: 'flex',
                            gap: '0.35rem',
                            marginBottom: '0.4rem',
                            padding: '0.4rem',
                            backgroundColor: 'rgba(30, 58, 138, 0.05)',
                            borderRadius: '0.375rem',
                            border: '1px solid rgba(30, 58, 138, 0.18)'
                          }}>
                            <input 
                              type="text"
                              id="importer-quick-project-input"
                              placeholder="New project name..."
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleQuickCreateProject();
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '0.3rem 0.5rem',
                                fontSize: '0.8rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--border-color)',
                                backgroundColor: '#fff'
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              id="importer-quick-project-submit"
                              onClick={handleQuickCreateProject}
                              disabled={creatingProject || !newProjectName.trim()}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minWidth: 'auto' }}
                            >
                              {creatingProject ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        )}

                        <Select
                          id="importer-project-select"
                          name="project_id"
                          options={projects.map(proj => ({ value: proj.id, label: proj.name }))}
                          value={projects.map(proj => ({ value: proj.id, label: proj.name })).find(option => option.value === selectedProject) || null}
                          onChange={(selectedOption) => setSelectedProject(selectedOption ? selectedOption.value : '')}
                          placeholder="Search project..."
                          isClearable={true}
                          isSearchable={true}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          styles={reactSelectModalStyles}
                        />
                      </div>
                    </div>

                    {/* Advanced Document Column Mapping (Collapsible) */}
                    <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                      <button
                        type="button"
                        id="toggle-doc-column-mapping-btn"
                        onClick={() => setShowDocColumnMapping(prev => !prev)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.15rem 0'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem' }}>{showDocColumnMapping ? '▼' : '▶'}</span>
                        <span>Map Category / Project from Document Columns instead (Optional)</span>
                      </button>

                      {showDocColumnMapping && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.75rem',
                          marginTop: '0.5rem',
                          padding: '0.6rem',
                          backgroundColor: 'rgba(241, 245, 249, 0.7)',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <label style={{ fontSize: '0.74rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                              Category Column
                            </label>
                            <select 
                              id="importer-category-column-select"
                              className="input-field" 
                              value={mapping.category_column || ''}
                              onChange={(e) => setMapping(prev => ({ ...prev, category_column: e.target.value }))}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              <option value="">-- None (Use Selected Category) --</option>
                              {parsedData.headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.74rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                              Project Column
                            </label>
                            <select 
                              id="importer-project-column-select"
                              className="input-field" 
                              value={mapping.project_column || ''}
                              onChange={(e) => setMapping(prev => ({ ...prev, project_column: e.target.value }))}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              <option value="">-- None (Use Selected Project) --</option>
                              {parsedData.headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Spaces & Security Options */}
                <div style={{ padding: '1.25rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={16} color="var(--accent)" /> Dynamic Spaces ({customColumns.length})
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    These custom spreadsheet / document columns are automatically preserved as searchable metadata:
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {customColumns.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        All columns mapped to core fields.
                      </span>
                    ) : (
                      customColumns.map(col => (
                        <span key={col} style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: 'rgba(13, 148, 136, 0.1)',
                          color: 'var(--accent)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          border: '1px solid rgba(13, 148, 136, 0.2)'
                        }}>
                          🏷️ {col}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Payment Method Setting */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      Default Payment Method
                    </label>
                    <select
                      id="importer-payment-method-select"
                      className="input-field"
                      value={defaultMethod}
                      onChange={(e) => setDefaultMethod(e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      <option value="Scanner / UPI">Scanner / UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  {/* Smart Duplicate Guard */}
                  <div style={{
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    backgroundColor: skipDuplicates ? 'rgba(13, 148, 136, 0.07)' : 'rgba(241, 245, 249, 0.6)',
                    border: `1px solid ${skipDuplicates ? 'rgba(13, 148, 136, 0.28)' : 'var(--border-color)'}`
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        id="importer-skip-duplicates-checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer', marginTop: '0.15rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          🛡️ Smart Duplicate Guard
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                          Automatically flags and skips duplicate transactions matching existing Reference/UTR numbers, Student/Campus IDs, Phone numbers, or identical Names and Amounts.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Preview Table */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.6rem', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: 'rgba(248, 250, 252, 0.95)',
                  borderBottom: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Extracted Preview ({parsedData.rows.length} rows)
                    </span>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: transactionType === 'Expense' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                      color: transactionType === 'Expense' ? '#dc2626' : 'var(--accent)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      Total {transactionType === 'Expense' ? 'Outflow' : 'Inflow'}: {formatCurrency(selectedTotalAmount > 0 ? selectedTotalAmount : parsedData.total_amount)}
                      {fixedAmount && parseFloat(fixedAmount) > 0 && (
                        <span style={{ opacity: 0.85, fontWeight: 500 }}>
                          ({selectedRowIds.length} × ₹{parseFloat(fixedAmount).toLocaleString('en-IN')})
                        </span>
                      )}
                    </span>
                    {parsedData.duplicate_count > 0 && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <AlertTriangle size={13} /> {parsedData.duplicate_count} Duplicate / Similar Records Flagged
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={selectNonDuplicates}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Select Non-Duplicates
                    </button>
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <button 
                      type="button" 
                      onClick={selectAll}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Select All
                    </button>
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <button 
                      type="button" 
                      onClick={deselectAll}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '300px', overflowX: 'auto', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem', width: '36px', textAlign: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.length === parsedData.rows.length && parsedData.rows.length > 0}
                            onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                        </th>
                        <th style={{ padding: '0.75rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#047857' }}>
                          Category
                        </th>
                        <th style={{ padding: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#1d4ed8' }}>
                          Event / Project
                        </th>
                        {/* Uniform Amount Column if in Fixed Mode */}
                        {(mapping.amount_column === '__FIXED__' || (fixedAmount && parseFloat(fixedAmount) > 0)) && (
                          <th style={{ padding: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--accent)' }}>
                            Applied Amount <span style={{ fontSize: '0.65rem' }}>[Uniform]</span>
                          </th>
                        )}
                        {/* Dynamic Headers from Excel File */}
                        {parsedData.headers.map(h => {
                          const isAmount = h === mapping.amount_column;
                          const isName = h === mapping.name_column;
                          const isRef = h === mapping.reference_column;
                          const isCat = h === mapping.category_column;
                          const isProj = h === mapping.project_column;
                          return (
                            <th key={h} style={{ 
                              padding: '0.75rem', 
                              fontWeight: 600,
                              backgroundColor: isAmount ? 'rgba(13, 148, 136, 0.08)' : (isName || isRef ? 'rgba(30, 58, 138, 0.04)' : (isCat ? 'rgba(16, 185, 129, 0.06)' : (isProj ? 'rgba(59, 130, 246, 0.06)' : 'transparent'))),
                              color: isAmount ? 'var(--accent)' : (isCat ? '#047857' : (isProj ? '#1d4ed8' : 'inherit'))
                            }}>
                              {h}
                              {isAmount && <span style={{ fontSize: '0.65rem', marginLeft: '0.3rem', color: 'var(--accent)' }}>[Amount]</span>}
                              {isName && <span style={{ fontSize: '0.65rem', marginLeft: '0.3rem', color: 'var(--primary)' }}>[Payer]</span>}
                              {isRef && <span style={{ fontSize: '0.65rem', marginLeft: '0.3rem', color: 'var(--primary)' }}>[Ref]</span>}
                              {isCat && <span style={{ fontSize: '0.65rem', marginLeft: '0.3rem', color: '#047857' }}>[Category]</span>}
                              {isProj && <span style={{ fontSize: '0.65rem', marginLeft: '0.3rem', color: '#1d4ed8' }}>[Project]</span>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.rows.map(row => {
                        const isSelected = selectedRowIds.includes(row._row_id);
                        return (
                          <tr 
                            key={row._row_id}
                            style={{
                              borderBottom: '1px solid var(--border-color)',
                              backgroundColor: row._is_duplicate ? 'rgba(254, 242, 242, 0.4)' : (isSelected ? 'rgba(30, 58, 138, 0.04)' : 'transparent')
                            }}
                          >
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(row._row_id)}
                                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                              />
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              {row._is_duplicate ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '9999px',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    width: 'fit-content'
                                  }}>
                                    <AlertTriangle size={11} /> Duplicate
                                  </span>
                                  {row._duplicate_reason && (
                                    <span style={{
                                      fontSize: '0.68rem',
                                      color: '#b91c1c',
                                      maxWidth: '260px',
                                      whiteSpace: 'normal',
                                      lineHeight: 1.25,
                                      fontWeight: 500
                                    }}>
                                      {row._duplicate_reason}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '9999px',
                                  backgroundColor: '#ecfdf5',
                                  color: '#065f46',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <Check size={11} /> Ready
                                </span>
                              )}
                            </td>
                            {/* Live Category Preview Cell */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              {(() => {
                                let catName = '';
                                if (mapping.category_column && row[mapping.category_column]) {
                                  catName = String(row[mapping.category_column]).trim();
                                } else if (selectedCategory) {
                                  const match = allCategories.find(c => c.id === selectedCategory);
                                  catName = match ? match.name : '';
                                }
                                return catName ? (
                                  <span style={{
                                    fontSize: '0.72rem',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: transactionType === 'Expense' ? '#fee2e2' : '#ecfdf5',
                                    color: transactionType === 'Expense' ? '#991b1b' : '#065f46',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <Tag size={11} /> {catName}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                                );
                              })()}
                            </td>
                            {/* Live Project Preview Cell */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              {(() => {
                                let projName = '';
                                if (mapping.project_column && row[mapping.project_column]) {
                                  projName = String(row[mapping.project_column]).trim();
                                } else if (selectedProject) {
                                  const match = projects.find(p => p.id === selectedProject);
                                  projName = match ? match.name : '';
                                } else {
                                  projName = 'General Funds';
                                }
                                return (
                                  <span style={{
                                    fontSize: '0.72rem',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: '#eff6ff',
                                    color: '#1e40af',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <Layers size={11} /> {projName}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* Uniform Amount Cell if in Fixed Mode */}
                            {(mapping.amount_column === '__FIXED__' || (fixedAmount && parseFloat(fixedAmount) > 0)) && (
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                                {fixedAmount && parseFloat(fixedAmount) > 0 ? `₹${parseFloat(fixedAmount).toLocaleString('en-IN')}` : '—'}
                              </td>
                            )}
                            {/* Dynamic Cell Values */}
                            {parsedData.headers.map(h => {
                              const val = row[h];
                              const isAmount = h === mapping.amount_column;
                              return (
                                <td key={h} style={{ 
                                  padding: '0.6rem 0.75rem',
                                  fontWeight: isAmount ? 700 : 400,
                                  color: isAmount ? 'var(--accent)' : 'inherit'
                                }}>
                                  {val !== undefined && val !== null ? String(val) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--card-bg)'
        }}>
          <div>
            {parsedData && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                Selected: <strong>{selectedRowIds.length}</strong> of {parsedData.total_rows} records
                {selectedRowIds.length > 0 && (
                  <span style={{ marginLeft: '0.5rem', color: 'var(--accent)', fontWeight: 700 }}>
                    ({formatCurrency(selectedTotalAmount)})
                  </span>
                )}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={committing}
            >
              Cancel
            </button>
            {parsedData && (
              <button 
                type="button" 
                id="modal-commit-import-btn"
                className="btn btn-primary flex items-center gap-2"
                onClick={handleCommit}
                disabled={!canImport}
                style={{ 
                  backgroundColor: !canImport ? '#94a3b8' : (transactionType === 'Expense' ? '#e11d48' : 'var(--accent)'), 
                  borderColor: !canImport ? '#94a3b8' : (transactionType === 'Expense' ? '#e11d48' : 'var(--accent)'), 
                  color: '#fff', 
                  minWidth: '190px', 
                  justifyContent: 'center',
                  cursor: canImport ? 'pointer' : 'not-allowed'
                }}
              >
                {committing ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Import {selectedRowIds.length} {transactionType === 'Expense' ? 'Expenses' : 'Payments'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportScannerModal;
