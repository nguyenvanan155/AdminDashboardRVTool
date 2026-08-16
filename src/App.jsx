import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Staff     from './pages/Staff';
import Control   from './pages/Control';
import BoostFalconControl from './pages/BoostFalconControl';
import Reports   from './pages/Reports';
import Login     from './pages/Login';
import './index.css';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard',      icon: '📊' },
  { id: 'staff',     label: 'Staff Management', icon: '👥' },
  { id: 'control',   label: 'Remote Control', icon: '🎮' },
  { id: 'nokey-control', label: 'BoostFalcon Control', icon: '🤖' },
  { id: 'reports',   label: 'Export Reports', icon: '📥' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isAdminLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isAdminLoggedIn');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="layout">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setIsSidebarOpen(true)}>🍔</button>
        <div className="mobile-logo">Admin <span>Dashboard</span></div>
      </div>
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo">Admin <span>Dashboard</span></div>
        {PAGES.map(p => (
          <button
            key={p.id}
            className={`nav-btn ${page === p.id ? 'active' : ''}`}
            onClick={() => { setPage(p.id); setIsSidebarOpen(false); }}
          >
            <span className="icon">{p.icon}</span>
            {p.label}
          </button>
        ))}
        
        <div style={{marginTop:'auto'}}>
          <button
            className="nav-btn"
            style={{ color: 'var(--danger)' }}
            onClick={handleLogout}
          >
            <span className="icon">🚪</span>
            Logout
          </button>
          <div style={{padding:'12px 0', borderTop:'1px solid var(--border)', color:'#f59e0b', fontSize:11, fontWeight: 600, letterSpacing: '0.3px', marginTop: '12px', lineHeight: '1.4'}}>
            ⚠️ Free Plan (1GB) Firebase <br/> May crash when overloaded
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {page === 'dashboard' && <Dashboard />}
        {page === 'staff'     && <Staff />}
        {page === 'control'   && <Control />}
        {page === 'nokey-control' && <BoostFalconControl />}
        {page === 'reports'   && <Reports />}
      </main>
    </div>
  );
}
