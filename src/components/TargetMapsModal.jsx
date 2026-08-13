import { useEffect } from 'react';

/**
 * Modal hiển thị danh sách Target Maps của một nhân viên.
 * Dữ liệu lấy từ Firebase /employees/{safeKey}/targets
 */
export default function TargetMapsModal({ employee, name, onClose }) {
  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const targets = employee?.targets ? Object.entries(employee.targets) : [];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'rgba(15,23,42,0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 32,
        width: '90%',
        maxWidth: 750,
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>📋 Target Maps</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Employee: <strong style={{ color: 'var(--text)' }}>{name}</strong>
              &nbsp;·&nbsp;{targets.length} map(s) synced
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
              color: 'var(--muted)', cursor: 'pointer', padding: '8px 14px', fontSize: 16,
            }}
          >✕</button>
        </div>

        {/* Table */}
        {targets.length === 0 ? (
          <div className="empty" style={{ padding: '40px 0' }}>
            No target data synced yet.<br />
            <span style={{ fontSize: 13 }}>Data will appear after the Tool sends its first heartbeat.</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Map Name</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Progress</th>
                <th style={thStyle}>Used</th>
                <th style={thStyle}>Unused</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {targets.map(([id, t]) => {
                const pct = t.total > 0 ? Math.round((t.used / t.total) * 100) : 0;
                return (
                  <tr key={id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {t.url ? (
                          <a href={t.url} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            🔗 {t.url.length > 40 ? t.url.substring(0, 40) + '…' : t.url}
                          </a>
                        ) : '—'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={t.status} />
                    </td>
                    <td style={{ ...tdStyle, minWidth: 140 }}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>{pct}%</div>
                      <div style={{
                        width: '100%', height: 6, borderRadius: 4,
                        background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 4,
                          background: pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--warn)',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--success)', fontWeight: 600 }}>{t.used}</td>
                    <td style={{ ...tdStyle, color: t.unused > 0 ? 'var(--warn)' : 'var(--muted)' }}>{t.unused}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{t.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:       { label: 'Pending',       color: 'var(--accent)',  bg: 'rgba(59,130,246,0.12)' },
    COMPLETED:     { label: 'Completed',     color: 'var(--muted)',   bg: 'rgba(148,163,184,0.1)' },
    LIMIT_REACHED: { label: 'Limit Reached', color: 'var(--warn)',    bg: 'rgba(245,158,11,0.12)' },
  };
  const s = map[status] || { label: status || 'Unknown', color: 'var(--muted)', bg: 'rgba(255,255,255,0.05)' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

const thStyle = {
  padding: '10px 16px', textAlign: 'left',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.5px', fontWeight: 500,
  background: 'rgba(15,23,42,0.5)',
};

const tdStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: 14,
};
