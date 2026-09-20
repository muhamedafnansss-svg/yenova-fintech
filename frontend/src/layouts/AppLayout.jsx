import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart, 
  Users, 
  Settings, 
  LogOut,
  User as UserIcon,
  FileText,
  Menu,
  X,
  FileCheck,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';

const AppLayout = () => {
  const { user, logout, isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.role === 'Admin';
  const isSuperAdmin = user?.is_primary_admin || user?.email?.toLowerCase() === 'admin@yenova.com';

  const navItems = isAdmin ? [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <PieChart size={20} /> },
    { name: 'Ledger', path: '/ledger', icon: <BookOpen size={20} /> },
    { name: 'Income', path: '/income', icon: <TrendingUp size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <TrendingDown size={20} /> },
    { name: 'Requests', path: '/expense-requests', icon: <ClipboardList size={20} /> },
    { name: 'Approvals', path: '/approvals', icon: <FileCheck size={20} /> },
    { name: 'Projects', path: '/projects', icon: <Calendar size={20} /> },
    { name: 'Categories', path: '/categories', icon: <PieChart size={20} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
    { name: 'Reports', path: '/reports', icon: <PieChart size={20} /> },
    { name: 'Financial Setup', path: '/financial-setup', icon: <Settings size={20} /> },
    { name: 'Audit Log', path: '/audit-log', icon: <ShieldAlert size={20} /> },
    { name: 'Users', path: '/users', icon: <Users size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ] : [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Ledger', path: '/ledger', icon: <BookOpen size={20} /> },
    { name: 'Income', path: '/income', icon: <TrendingUp size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <TrendingDown size={20} /> },
    { name: 'My Requests', path: '/expense-requests', icon: <ClipboardList size={20} /> }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          FinTech
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.25rem', border: 'none', color: 'var(--sidebar-text)', display: 'var(--mobile-menu-display, none)' }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/expenses' && location.pathname.startsWith('/expenses')) ||
              (item.path === '/income' && location.pathname.startsWith('/income'));
            return item.disabled ? (
              <div key={item.name} className="nav-item disabled" title="Coming Soon">
                {item.icon}
                <span>{item.name} <span style={{fontSize: '0.7em'}}>(Soon)</span></span>
              </div>
            ) : (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Sidebar Action */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-hover)' }}>
          <button onClick={handleLogout} className="btn w-full flex items-center" style={{ backgroundColor: 'transparent', color: 'var(--sidebar-text)', justifyContent: 'flex-start', padding: '0.75rem' }}>
            <LogOut size={20} style={{ marginRight: '0.75rem' }} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-nav">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="btn btn-outline flex items-center justify-center" 
              style={{ padding: '0.5rem', marginRight: '1rem', border: 'none', display: 'var(--mobile-menu-display, none)' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <style>{`
              @media (max-width: 768px) {
                .top-nav button { display: flex !important; }
              }
            `}</style>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isSuperAdmin ? (
              <span style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                color: '#ea580c',
                fontWeight: 700,
                border: '1px solid rgba(234, 88, 12, 0.25)'
              }}>
                ⭐ Super Admin
              </span>
            ) : isAdmin ? (
              <span style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                color: 'var(--primary)',
                fontWeight: 600,
                border: '1px solid rgba(30, 58, 138, 0.2)'
              }}>
                🛡️ Admin
              </span>
            ) : (
              <span style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                👤 Member
              </span>
            )}
            <Link to="/profile" className="flex items-center" style={{ textDecoration: 'none', color: 'var(--text-main)', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.profile_picture ? <img src={user.profile_picture} alt="Profile" style={{ width: '100%', borderRadius: '50%' }} /> : <UserIcon size={16} />}
              </div>
              <span style={{ fontWeight: 500 }}>{user?.name}</span>
            </Link>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
