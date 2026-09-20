import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analytics';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  HeartPulse, 
  PieChart as PieIcon, 
  Layers, 
  Calendar,
  AlertCircle,
  PlusCircle,
  Award,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', 
  '#f97316', '#6366f1'
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [cashflow, setCashflow] = useState([]);
  const [events, setEvents] = useState({ most_profitable: [], highest_expense: [] });
  const [breakdownType, setBreakdownType] = useState('expense'); // 'expense' | 'income'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashData, catData, cashData, eventData] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getCategories(),
        analyticsService.getCashflow(6),
        analyticsService.getEvents()
      ]);
      setDashboard(dashData);
      setCategories(catData || { income: [], expense: [] });
      setCashflow(cashData || []);
      setEvents(eventData || { most_profitable: [], highest_expense: [] });

      // Automatically choose whichever tab has active data if one is empty
      if ((!catData?.expense || catData.expense.length === 0) && (catData?.income && catData.income.length > 0)) {
        setBreakdownType('income');
      }
    } catch (error) {
      console.error("Error fetching analytics data", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `₹${(value || 0).toLocaleString('en-IN')}`;

  const currentCategoryData = breakdownType === 'expense' 
    ? (categories.expense || []) 
    : (categories.income || []);

  const totalBreakdownValue = currentCategoryData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>
          <Layers size={36} color="#3b82f6" />
        </div>
        <h3 style={{ margin: 0, fontWeight: 600 }}>Loading Financial Analytics...</h3>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Processing ledger data, cash flow trends, and category distribution.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Real-time financial intelligence, revenue streams, and expenditure breakdown.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/ledger" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Layers size={15} /> View Ledger
          </Link>
          <Link to="/expenses" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <PlusCircle size={15} /> Record Expense
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* Current Balance */}
        <div className="card stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-header">
            <h3 className="stat-title">Current Balance</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(dashboard?.current_balance || 0)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Net Surplus across all events
          </div>
        </div>

        {/* Total Active Inflow */}
        <div className="card stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-header">
            <h3 className="stat-title">Total Active Inflow</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            +{formatCurrency(dashboard?.total_income || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {categories.income?.length || 0} active revenue streams
          </div>
        </div>

        {/* Total Active Outflow */}
        <div className="card stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-header">
            <h3 className="stat-title">Total Active Outflow</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            -{formatCurrency(dashboard?.total_expenses || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {categories.expense?.length || 0} expense categories recorded
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="card stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-header">
            <h3 className="stat-title">Financial Health</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <HeartPulse size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="stat-value" style={{ color: '#8b5cf6' }}>{dashboard?.health_score ?? 100}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.4rem' }}>
            ● Status: {dashboard?.health_status || 'Excellent'}
          </div>
        </div>
      </div>

      {/* Middle Row: Trend Line & Breakdown Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Cash Flow Trend Line Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem' }}>Cash Flow Trend</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>6-Month timeline (Income vs Expense vs Balance)</span>
            </div>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
              Monthly Aggregates
            </span>
          </div>
          
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflow} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis 
                  tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                />
                <RechartsTooltip 
                  formatter={(value) => [formatCurrency(value), '']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '0.5rem', 
                    border: '1px solid var(--border)', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
                <Line type="monotone" name="Income" dataKey="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                <Line type="monotone" name="Expense" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                <Line type="monotone" name="Net Balance" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Card with Dynamic Toggle */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {/* Card Header with Interactive Tab Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem' }}>
                {breakdownType === 'expense' ? 'Expense Breakdown' : 'Income Breakdown'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {breakdownType === 'expense' ? 'Itemized category expenditures' : 'Itemized revenue sources'}
              </span>
            </div>

            {/* Segmented Controls */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: 'rgba(243, 244, 246, 0.8)',
              padding: '0.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)'
            }}>
              <button
                type="button"
                id="analytics-tab-expense"
                onClick={() => setBreakdownType('expense')}
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: breakdownType === 'expense' ? '#ffffff' : 'transparent',
                  color: breakdownType === 'expense' ? '#ef4444' : 'var(--text-muted)',
                  boxShadow: breakdownType === 'expense' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📉 Expenses ({categories.expense?.length || 0})
              </button>
              <button
                type="button"
                id="analytics-tab-income"
                onClick={() => setBreakdownType('income')}
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: breakdownType === 'income' ? '#ffffff' : 'transparent',
                  color: breakdownType === 'income' ? '#10b981' : 'var(--text-muted)',
                  boxShadow: breakdownType === 'income' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📈 Income ({categories.income?.length || 0})
              </button>
            </div>
          </div>

          {/* Chart or Empty State Container */}
          {currentCategoryData.length === 0 ? (
            /* High Fidelity Empty State */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'rgba(249, 250, 251, 0.6)',
              borderRadius: '0.75rem',
              border: '1px dashed var(--border)',
              minHeight: '300px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: breakdownType === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: breakdownType === 'expense' ? '#ef4444' : '#10b981',
                marginBottom: '1rem'
              }}>
                <PieIcon size={28} />
              </div>
              <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                No {breakdownType === 'expense' ? 'Expense' : 'Income'} Records Found
              </h4>
              <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.5 }}>
                {breakdownType === 'expense' 
                  ? 'There are currently no recorded expenditures in the ledger. Active revenue is currently tracked at ' + formatCurrency(dashboard?.total_income || 0) + '.'
                  : 'There are currently no income entries recorded in the ledger.'}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setBreakdownType(breakdownType === 'expense' ? 'income' : 'expense')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  View {breakdownType === 'expense' ? 'Income' : 'Expense'} Breakdown
                </button>
                <Link
                  to={breakdownType === 'expense' ? '/expenses' : '/income/add'}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  + Record {breakdownType === 'expense' ? 'Expense' : 'Income'}
                </Link>
              </div>
            </div>
          ) : (
            /* Rich Donut Chart & Category Breakdown List */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ position: 'relative', height: 230, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredSlice(index)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      {currentCategoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PALETTE[index % PALETTE.length]} 
                          stroke="#ffffff"
                          strokeWidth={hoveredSlice === index ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(val, name) => {
                        const pct = totalBreakdownValue > 0 ? ((val / totalBreakdownValue) * 100).toFixed(1) : '0';
                        return [`${formatCurrency(val)} (${pct}%)`, name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '0.5rem', 
                        border: '1px solid var(--border)', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total {breakdownType === 'expense' ? 'Outflow' : 'Inflow'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: breakdownType === 'expense' ? '#ef4444' : '#10b981' }}>
                    {formatCurrency(totalBreakdownValue)}
                  </div>
                </div>
              </div>

              {/* Category Breakdown Detail Chips */}
              <div style={{
                marginTop: '1rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {currentCategoryData.map((cat, idx) => {
                  const pct = totalBreakdownValue > 0 ? ((cat.value / totalBreakdownValue) * 100).toFixed(1) : '0';
                  const color = PALETTE[idx % PALETTE.length];
                  return (
                    <div 
                      key={cat.name} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: hoveredSlice === idx ? 'rgba(243, 244, 246, 0.8)' : 'transparent',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={() => setHoveredSlice(idx)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                        <span style={{ fontWeight: 500 }}>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--border)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                          {pct}%
                        </span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(cat.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Project Financial Performance */}
      {events.most_profitable && events.most_profitable.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="#f59e0b" /> Project & Event Performance
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Revenue, expenditure, and net surplus by event</span>
            </div>
            <Link to="/projects" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
              View All Events
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Event / Project</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Allocated Budget</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Total Inflow</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Actual Spend</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Net Surplus</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.most_profitable.map((proj) => (
                  <tr key={proj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {proj.name}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                      {formatCurrency(proj.budget)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#10b981', fontWeight: 600 }}>
                      +{formatCurrency(proj.income)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#ef4444', fontWeight: 600 }}>
                      -{formatCurrency(proj.expense)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: proj.profit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: proj.profit >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {proj.profit >= 0 ? '+' : ''}{formatCurrency(proj.profit)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <Link to="/reports" style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 500 }}>
                        Reports <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
