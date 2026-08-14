import { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';

const FIREBASE_SECRET = 'h88ZsD2lxYWBws2UD7gEdukIRdMmGV7iwb8tpJJD';
const FIREBASE_URL    = 'https://admin-reviewtool-default-rtdb.asia-southeast1.firebasedatabase.app';

function loadNameMap() {
  try { return JSON.parse(localStorage.getItem('nameMap') || '{}'); }
  catch { return {}; }
}
function saveNameMap(map) {
  localStorage.setItem('nameMap', JSON.stringify(map));
}

function StatusBadge({ status }) {
  if (status === 'ACTIVE')  return <span className="badge online"><div className="dot g" />🟢 Active</span>;
  if (status === 'IDLE')    return <span className="badge" style={{background:'rgba(234,179,8,0.12)',color:'#eab308'}}><div className="dot y" />🟡 Idle</span>;
  return                           <span className="badge offline"><div className="dot r" />🔴 Offline</span>;
}

function getRealStatus(emp) {
  if (emp.status === 'OFFLINE') return 'OFFLINE';
  if (!emp.lastSeen || Date.now() - emp.lastSeen > 180000) return 'OFFLINE';
  return emp.status;
}

/** Gửi lệnh điều khiển lên Firebase /commands/{safeKey} */
async function sendCommand(safeKey, action, payload = null) {
  const url = `${FIREBASE_URL}/commands/${safeKey}.json?auth=${FIREBASE_SECRET}`;
  await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, issuedAt: Date.now() }),
  });
}

/* ------------------------------------------------------------------ */
/*  Proxy Modal Component                                               */
/* ------------------------------------------------------------------ */

function ProxyModal({ safeKey, dispName, onClose, onSent }) {
  const [provider, setProvider] = useState('cliproxy');
  const [num,      setNum]      = useState(10);
  const [country,  setCountry]  = useState('US');
  const [loading,  setLoading]  = useState(false);

  async function handleFetch() {
    if (loading) return;
    setLoading(true);
    try {
      await sendCommand(safeKey, 'fetch_proxies', { provider, num: Number(num), country });
      onSent(`⏳ Fetching ${num} proxies via ${provider.toUpperCase()}... (check feedback in ~5s)`);
      onClose();
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!window.confirm(`Clear ALL proxies on ${dispName || safeKey}?`)) return;
    try {
      await sendCommand(safeKey, 'clear_proxies');
      onSent('⏳ Clearing proxies...');
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div style={{
        background:'var(--surface,#1a1f2e)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:12, padding:28, width:400, maxWidth:'90vw',
        boxShadow:'0 24px 48px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
          <h3 style={{margin:0, fontSize:16}}>🌐 Proxy Tools — <span style={{color:'var(--muted,#888)', fontWeight:400}}>{dispName || safeKey}</span></h3>
          <button onClick={onClose} style={{background:'none', border:'none', color:'var(--muted,#888)', cursor:'pointer', fontSize:18}}>✕</button>
        </div>

        {/* Fetch Section */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13, fontWeight:600, marginBottom:10, color:'#4ade80'}}>📥 Fetch New Proxies</div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
            <div>
              <label style={{fontSize:12, color:'var(--muted,#888)', display:'block', marginBottom:4}}>Provider</label>
              <select value={provider} onChange={e => setProvider(e.target.value)}
                style={{width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'var(--text,#fff)', fontSize:13}}>
                <option value="cliproxy">CliProxy</option>
                <option value="novproxy">NovProxy</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12, color:'var(--muted,#888)', display:'block', marginBottom:4}}>Country Code</label>
              <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} maxLength={3}
                placeholder="US"
                style={{width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'var(--text,#fff)', fontSize:13, boxSizing:'border-box'}} />
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <label style={{fontSize:12, color:'var(--muted,#888)', display:'block', marginBottom:4}}>Quantity</label>
            <input type="number" value={num} onChange={e => setNum(e.target.value)} min={1} max={500}
              style={{width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'var(--text,#fff)', fontSize:13, boxSizing:'border-box'}} />
          </div>

          <button
            onClick={handleFetch}
            disabled={loading}
            style={{width:'100%', padding:'9px', background: loading ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.15)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)', borderRadius:7, fontSize:13, fontWeight:600, cursor: loading ? 'not-allowed':'pointer'}}>
            {loading ? '⏳ Sending...' : '⚡ Fetch & Import'}
          </button>
        </div>

        {/* Divider */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.08)', marginBottom:16}} />

        {/* Clear Section */}
        <div>
          <div style={{fontSize:13, fontWeight:600, marginBottom:10, color:'#ef4444'}}>🗑️ Clear Proxies</div>
          <button
            onClick={handleClear}
            style={{width:'100%', padding:'9px', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer'}}>
            Clear All Proxies on this machine
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function Employees() {
  const [employees,   setEmployees]   = useState({});
  const [nameMap,     setNameMap]     = useState(loadNameMap);
  const [editing,     setEditing]     = useState({});
  const [cmdFeedback, setCmdFeedback] = useState({}); // { safeKey: 'Sent!' }
  const [proxyModal,  setProxyModal]  = useState(null); // safeKey of open modal
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const empRef = ref(db, 'employees');
    const unsub = onValue(empRef, (snap) => {
      setEmployees(snap.val() || {});
    });
    return () => unsub();
  }, []);

  function saveName(safeKey) {
    const name = editing[safeKey];
    if (!name?.trim()) return;
    const updated = { ...nameMap, [safeKey]: name.trim() };
    setNameMap(updated);
    saveNameMap(updated);
    setEditing(prev => { const n = {...prev}; delete n[safeKey]; return n; });
  }

  function deleteEmployee(safeKey) {
    if (!window.confirm('Are you sure you want to delete this employee? This will remove them from the dashboard until they reconnect.')) return;
    remove(ref(db, `employees/${safeKey}`)).catch(err => alert('Failed to delete: ' + err.message));
  }

  async function handleCommand(safeKey, action) {
    try {
      await sendCommand(safeKey, action);
      setCmdFeedback(prev => ({ ...prev, [safeKey]: `✅ Sent: ${action.toUpperCase()}` }));
      setTimeout(() => setCmdFeedback(prev => { const n={...prev}; delete n[safeKey]; return n; }), 3000);
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    }
  }

  function onProxySent(safeKey, msg) {
    setCmdFeedback(prev => ({ ...prev, [safeKey]: msg }));
    setTimeout(() => setCmdFeedback(prev => { const n={...prev}; delete n[safeKey]; return n; }), 8000);
  }

  return (
    <div>
      <h1 className="page-title">👥 Employee Management</h1>
      <p style={{color:'var(--muted)', marginBottom:24, fontSize:14}}>
        Assign friendly names to License Keys. These names will be displayed across the dashboard.
      </p>

      {/* Proxy Modal */}
      {proxyModal && (() => {
        const emp = employees[proxyModal];
        const dispName = nameMap[proxyModal] || '';
        return (
          <ProxyModal
            safeKey={proxyModal}
            dispName={dispName}
            onClose={() => setProxyModal(null)}
            onSent={(msg) => onProxySent(proxyModal, msg)}
          />
        );
      })()}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>License Key</th>
              <th>Display Name</th>
              <th>Status</th>
              <th>Current Map</th>
              <th>Last Seen</th>
              <th>Remote Control</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(employees).length === 0 && (
              <tr><td colSpan={7} className="empty">
                No employees connected. Please run the Tool on a client machine.
              </td></tr>
            )}
            {Object.entries(employees).map(([safeKey, emp]) => {
              const realStatus = getRealStatus(emp);
              const dispName  = nameMap[safeKey] || '';
              const editVal   = editing[safeKey] ?? dispName;
              const isEditing = safeKey in editing;
              const lastAction = emp.lastAction;

              return (
                <tr key={safeKey}>
                  <td data-label="License Key" style={{fontFamily:'monospace', fontSize:13, color:'var(--muted)'}}>
                    {emp.key || safeKey}
                  </td>
                  <td data-label="Display Name">
                    {isEditing ? (
                      <input
                        value={editVal}
                        onChange={e => setEditing(prev => ({...prev, [safeKey]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && saveName(safeKey)}
                        placeholder="Enter employee name..."
                        style={{width:180}}
                      />
                    ) : (
                      <span style={{fontWeight: dispName ? 600 : 400, color: dispName ? 'var(--text)' : 'var(--muted)'}}>
                        {dispName || '(unnamed)'}
                      </span>
                    )}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={realStatus} />
                  </td>
                  <td data-label="Current Map" style={{color: realStatus !== 'OFFLINE' ? 'var(--text)' : 'var(--muted)'}}>
                    {emp.currentMap || '—'}
                  </td>
                  <td data-label="Last Seen" style={{fontSize:13, color:'var(--muted)'}}>
                    {emp.lastSeen ? new Date(emp.lastSeen).toLocaleString('en-US') : '—'}
                  </td>

                  {/* Remote Control Column */}
                  <td data-label="Remote Control">
                    {realStatus !== 'OFFLINE' ? (
                      <div style={{display:'flex', flexDirection:'column', gap:6}}>
                        {/* Feedback message (from cmdFeedback or Firebase lastAction) */}
                        {cmdFeedback[safeKey] && (
                          <span style={{fontSize:11, color:'#4ade80', fontWeight:600}}>{cmdFeedback[safeKey]}</span>
                        )}
                        {!cmdFeedback[safeKey] && lastAction?.message && (
                          <span style={{fontSize:11, color:'var(--muted)'}} title={lastAction.at ? new Date(lastAction.at).toLocaleString() : ''}>
                            {lastAction.message}
                          </span>
                        )}
                        {/* Control buttons */}
                        <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                          <button className="btn"
                            style={{padding:'4px 9px', fontSize:12, background:'rgba(59,130,246,0.15)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)'}}
                            onClick={() => { if(window.confirm(`Start bot on ${dispName || safeKey}?`)) handleCommand(safeKey, 'start'); }}
                            title="Start">⚡ Start</button>
                          <button className="btn"
                            style={{padding:'4px 9px', fontSize:12, background:'rgba(234,179,8,0.15)', color:'#eab308', border:'1px solid rgba(234,179,8,0.3)'}}
                            onClick={() => handleCommand(safeKey, 'pause')}
                            title="Pause">⏸ Pause</button>
                          <button className="btn"
                            style={{padding:'4px 9px', fontSize:12, background:'rgba(74,222,128,0.15)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)'}}
                            onClick={() => handleCommand(safeKey, 'resume')}
                            title="Resume">▶ Resume</button>
                          <button className="btn"
                            style={{padding:'4px 9px', fontSize:12, background:'rgba(239,68,68,0.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)'}}
                            onClick={() => { if(window.confirm(`Stop bot on ${dispName || safeKey}?`)) handleCommand(safeKey, 'stop'); }}
                            title="Stop">⏹ Stop</button>
                          <button className="btn"
                            style={{padding:'4px 9px', fontSize:12, background:'rgba(168,85,247,0.15)', color:'#a855f7', border:'1px solid rgba(168,85,247,0.3)'}}
                            onClick={() => setProxyModal(safeKey)}
                            title="Proxy Tools">🌐 Proxy</button>
                        </div>
                      </div>
                    ) : (
                      <span style={{fontSize:12, color:'var(--muted)'}}>— offline —</span>
                    )}
                  </td>

                  {/* Manage Column */}
                  <td data-label="Manage">
                    {isEditing ? (
                      <div style={{display:'flex', gap:6}}>
                        <button className="btn success" style={{padding:'5px 12px', fontSize:13}} onClick={() => saveName(safeKey)}>✓ Save</button>
                        <button className="btn" style={{padding:'5px 12px', fontSize:13, background:'rgba(255,255,255,0.05)'}}
                          onClick={() => setEditing(prev => { const n={...prev}; delete n[safeKey]; return n; })}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{display:'flex', gap:6}}>
                        <button className="btn primary" style={{padding:'5px 14px', fontSize:13}}
                          onClick={() => setEditing(prev => ({...prev, [safeKey]: dispName}))}>
                          ✏️ Edit Name
                        </button>
                        <button className="btn" style={{padding:'5px 12px', fontSize:13, background:'rgba(239, 68, 68, 0.1)', color:'#ef4444'}}
                          onClick={() => deleteEmployee(safeKey)}
                          title="Delete Employee">
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
