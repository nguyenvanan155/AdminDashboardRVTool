import { useState } from 'react';

const ADMIN_ACCOUNT = 'Luffy.legion54';
const ADMIN_PASS = 'Reviews4boostfalcon.@lucas&$';

export default function Login({ onLogin }) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (account === ADMIN_ACCOUNT && password === ADMIN_PASS) {
      onLogin();
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(59,130,246,0.12) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(16,185,129,0.08) 0px, transparent 55%)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="logo" style={{ borderBottom: 'none', padding: 0, fontSize: '28px' }}>
            Auto<span>Seller</span> Admin
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
            Vui lòng đăng nhập để truy cập Dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
              Tài khoản
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Nhập tài khoản"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '14px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'filter 0.2s, transform 0.1s',
            }}
            onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
            onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
