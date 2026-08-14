import { useEffect } from 'react';

const CSS = {
  th: {
    padding: '10px 16px', textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.5px', fontWeight: 500,
  },
  td: {
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: 14,
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 10,
      padding: '12px 16px', flex: '1 1 100px', minWidth: 90,
    }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text)' }}>{value ?? '—'}</div>
    </div>
  );
}

function LimitBadge({ limitReachedAt }) {
  if (limitReachedAt) {
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
        fontSize: 11, fontWeight: 600,
        color: '#f97316', background: 'rgba(249,115,22,0.12)',
      }}>
        🟠 Limit Reached
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: 'var(--success)', background: 'rgba(34,197,94,0.1)',
    }}>
      🟢 OK
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:       { label: 'Pending',       color: 'var(--accent)',  bg: 'rgba(59,130,246,0.12)' },
    COMPLETED:     { label: 'Completed',     color: 'var(--muted)',   bg: 'rgba(148,163,184,0.1)' },
    LIMIT_REACHED: { label: 'Limit Reached', color: '#f97316',        bg: 'rgba(249,115,22,0.12)' },
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

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function DatabaseModal({ employee, name, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const targets = employee?.targets ? Object.entries(employee.targets) : [];
  const stats   = employee?.stats   || {};
  const accs    = stats.accounts    || null;
  const proxies = stats.proxies     || null;

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
        background: 'rgba(15,23,42,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 32,
        width: '92%', maxWidth: 820,
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>🗄️ Database Overview</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Employee: <strong style={{ color: 'var(--text)' }}>{name}</strong>
              &nbsp;·&nbsp;Synced every 60s
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
            color: 'var(--muted)', cursor: 'pointer', padding: '8px 14px', fontSize: 16,
          }}>✕</button>
        </div>

        {/* ── Section 1: Resources ── */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>📦 Resources (Inventory)</div>

          {/* Accounts */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Accounts
            </div>
            {accs ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <MiniStat label="Total"       value={accs.total}       color="var(--text)" />
                <MiniStat label="✅ Unused"   value={accs.UNUSED}      color="var(--success)" />
                <MiniStat label="✔ Done"     value={accs.DONE}        color="var(--muted)" />
                <MiniStat label="⚠️ Failed"  value={accs.FAILED}      color="#f97316" />
                <MiniStat label="🔒 Checkpoint" value={accs.CHECKPOINT} color="#8b5cf6" />
                <MiniStat label="💀 Dead"    value={accs.DEAD}        color="#64748b" />
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Syncing account data...</div>
            )}
          </div>

          {/* Proxies */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Proxies
            </div>
            {proxies ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <MiniStat label="Total"      value={proxies.total}  color="var(--text)" />
                <MiniStat label="🟢 Idle"   value={proxies.IDLE}   color="var(--success)" />
                <MiniStat label="⚡ Active" value={proxies.ACTIVE} color="var(--accent)" />
                <MiniStat label="❌ Failed" value={proxies.FAILED} color="#f97316" />
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Syncing proxy data...</div>
            )}
          </div>
        </div>

        {/* ── Section 2: Target Maps ── */}
        <div>
          <div className="section-title" style={{ marginBottom: 14 }}>
            🎯 Target Maps ({targets.length} maps)
          </div>

          {targets.length === 0 ? (
            <div className="empty" style={{ padding: '30px 0' }}>
              No target data synced yet. Data will appear after the first heartbeat.
            </div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={CSS.th}>Map Name</th>
                    <th style={CSS.th}>Daily Limit</th>
                    <th style={CSS.th}>Quota</th>
                    <th style={CSS.th}>Progress</th>
                    <th style={CSS.th} title="Ready to run">RC Unused</th>
                    <th style={CSS.th} title="Successfully reviewed">RC Used</th>
                    <th style={CSS.th} title="Waiting for link">Pending Link</th>
                    <th style={CSS.th}>Total RC</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map(([id, t]) => {
                    const pct = t.total > 0 ? Math.round((t.used / t.total) * 100) : 0;
                    return (
                      <tr key={id}>
                        <td data-label="Map Name" style={CSS.td}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                          {t.url && (
                            <a href={t.url} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
                              🔗 {t.url.length > 38 ? t.url.substring(0, 38) + '…' : t.url}
                            </a>
                          )}
                        </td>
                        <td data-label="Daily Limit" style={CSS.td}>
                          <span style={{ fontWeight: 600 }}>
                            {t.daily_limit > 0 ? `${t.daily_limit} / day` : 'No limit'}
                          </span>
                        </td>
                        <td data-label="Quota" style={CSS.td}>
                          <LimitBadge limitReachedAt={t.limit_reached_at} />
                        </td>
                        <td data-label="Progress" style={CSS.td}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{pct}%</div>
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
                        {/* RC Unused — sẵn sàng chạy */}
                        <td data-label="RC Unused" style={{ ...CSS.td, color: t.unused > 0 ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>
                          {t.unused ?? 0}
                        </td>
                        {/* RC Used — đã review thành công */}
                        <td data-label="RC Used" style={{ ...CSS.td, color: 'var(--accent)', fontWeight: 600 }}>
                          {t.used ?? 0}
                        </td>
                        {/* Pending Link — đã đăng, chờ link */}
                        <td data-label="Pending Link" style={{ ...CSS.td, color: t.pendingLink > 0 ? '#eab308' : 'var(--muted)', fontWeight: 600 }}>
                          {t.pendingLink ?? 0}
                        </td>
                        {/* Total */}
                        <td data-label="Total RC" style={{ ...CSS.td, fontWeight: 600 }}>{t.total ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
