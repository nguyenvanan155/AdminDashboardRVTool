import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Reports   from './pages/Reports';
import Licenses  from './pages/Licenses';
import Login     from './pages/Login';
import './index.css';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard',      icon: '📊' },
  { id: 'employees', label: 'Employees',      icon: '👥' },
  { id: 'licenses',  label: 'License Keys',   icon: '🔑' },
  { id: 'reports',   label: 'Export Reports', icon: '📥' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check local storage for login state
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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">Admin <span>Dashboard</span></div>
        {PAGES.map(p => (
          <button
            key={p.id}
            className={`nav-btn ${page === p.id ? 'active' : ''}`}
            onClick={() => setPage(p.id)}
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
        {page === 'employees' && <Employees />}
        {page === 'licenses'  && <Licenses />}
        {page === 'reports'   && <Reports />}
      </main>
    </div>
  );
}
