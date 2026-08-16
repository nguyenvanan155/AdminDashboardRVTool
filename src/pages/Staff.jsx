import { useState, useEffect } from 'react';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { db } from '../firebase';

function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = 'KEY-';
  for (let i = 0; i < 12; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i % 4 === 3 && i !== 11) res += '-';
  }
  return res;
}

function StatusBadge({ status }) {
  if (status === 'ACTIVE' || status === 'RUNNING')  return <span className="badge online"><div className="dot g" />🟢 Active</span>;
  if (status === 'PAUSED') return <span className="badge" style={{background:'rgba(234,179,8,0.12)',color:'#eab308'}}><div className="dot y" />⏸️ Paused</span>;
  if (status === 'IDLE' || status === 'STOPPED') return <span className="badge" style={{background:'rgba(234,179,8,0.12)',color:'#eab308'}}><div className="dot y" />🟡 Idle</span>;
  return <span className="badge offline"><div className="dot r" />🔴 Offline</span>;
}

function getRealStatus(emp) {
  if (!emp) return 'OFFLINE';
  if (emp.status === 'OFFLINE') return 'OFFLINE';
  if (!emp.lastSeen || Date.now() - emp.lastSeen > 180000) return 'OFFLINE';
  return emp.status;
}

export default function Staff() {
  const [employees, setEmployees] = useState({});
  const [licenses, setLicenses] = useState({});
  const [newKey, setNewKey] = useState('');
  const [editing, setEditing] = useState({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const empRef = ref(db, 'employees');
    const licRef = ref(db, 'licenses');
    
    const unsubEmp = onValue(empRef, snap => setEmployees(snap.val() || {}));
    const unsubLic = onValue(licRef, snap => setLicenses(snap.val() || {}));
    
    return () => { unsubEmp(); unsubLic(); };
  }, []);

  function addLicense() {
    let key = newKey.trim();
    if (!key) {
      key = generateRandomKey();
    }
    const safeKey = key.replace(/[.#$[\]/]/g, '_');
    
    if (licenses[safeKey]) {
      alert('This key already exists!');
      return;
    }
    
    set(ref(db, `licenses/${safeKey}`), {
      key: key,
      hwid: '',
      expiry: '',
      status: 'ACTIVE',
      note: '',
      createdAt: new Date().toISOString()
    }).then(() => {
      setNewKey('');
    }).catch(err => alert('Failed to add license: ' + err.message));
  }

  function deleteLicense(safeKey) {
    if (!window.confirm('Are you sure you want to delete this license? Any tool using it will immediately be blocked.')) return;
    remove(ref(db, `licenses/${safeKey}`)).catch(err => alert('Failed to delete: ' + err.message));
  }

  function resetHwid(safeKey) {
    if (!window.confirm('Reset HWID for this license? This allows the key to be used on a new computer.')) return;
    update(ref(db, `licenses/${safeKey}`), { hwid: '' }).catch(err => alert('Failed: ' + err.message));
  }

  function toggleStatus(safeKey, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    update(ref(db, `licenses/${safeKey}`), { status: newStatus }).catch(err => alert('Failed: ' + err.message));
  }

  function updateExpiry(safeKey, newExpiry) {
    update(ref(db, `licenses/${safeKey}`), { expiry: newExpiry }).catch(err => alert('Failed: ' + err.message));
  }
  
  function saveName(safeKey) {
    const name = editing[safeKey];
    if (name !== undefined) {
      update(ref(db, `licenses/${safeKey}`), { note: name.trim() })
        .catch(err => alert('Failed to save name: ' + err.message));
    }
    setEditing(prev => { const n = {...prev}; delete n[safeKey]; return n; });
  }

  const entries = Object.entries(licenses);

  return (
    <div>
      <h1 className="page-title">👥 Staff & License Management</h1>
      <p style={{color:'var(--muted)', marginBottom:24, fontSize:14}}>
        Manage your license keys and view employee status in one place.
      </p>

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Add New License</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Leave blank to auto-generate random key..."
            style={{ flex: 1, padding: '10px 14px' }}
            onKeyDown={e => e.key === 'Enter' && addLicense()}
          />
          <button className="btn success" style={{ padding: '10px 24px' }} onClick={addLicense}>
            ➕ Add License
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>License Key & HWID</th>
              <th>Display Name</th>
              <th>Live Status</th>
              <th>Current Map</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} className="empty">No licenses found.</td></tr>
            )}
            {entries.map(([safeKey, lic]) => {
              const emp = employees[safeKey] || {};
              const realStatus = getRealStatus(emp);
              const dispName  = lic.note || '';
              const editVal   = editing[safeKey] ?? dispName;
              const isEditing = safeKey in editing;
              const isExpired = lic.expiry && new Date(lic.expiry) < new Date();
              const badgeClass = lic.status === 'ACTIVE' && !isExpired ? 'online' : 'offline';

              return (
                <tr key={safeKey}>
                  <td data-label="License Key" style={{fontFamily:'monospace', fontSize:13}}>
                    <div style={{ color: 'var(--text)', fontWeight: 600 }}>{lic.key || safeKey}</div>
                    <div style={{ fontSize: 11, color: lic.hwid ? 'var(--text)' : 'var(--muted)', marginTop: 4 }}>
                      HWID: {lic.hwid || 'Not Bound'}
                      {lic.hwid && (
                        <button className="btn" style={{ marginLeft: 6, padding: '2px 6px', fontSize: 10, background: 'rgba(255,255,255,0.05)' }} onClick={() => resetHwid(safeKey)}>
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                  <td data-label="Display Name">
                    {isEditing ? (
                      <input
                        value={editVal}
                        onChange={e => setEditing(prev => ({...prev, [safeKey]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && saveName(safeKey)}
                        placeholder="Enter name..."
                        style={{width:160, padding: '4px 8px'}}
                      />
                    ) : (
                      <span style={{fontWeight: dispName ? 600 : 400, color: dispName ? 'var(--text)' : 'var(--muted)'}}>
                        {dispName || '(unnamed)'}
                      </span>
                    )}
                    <br/>
                    {isEditing ? (
                      <div style={{display:'flex', gap:6, marginTop: 6}}>
                        <button className="btn success" style={{padding:'2px 8px', fontSize:11}} onClick={() => saveName(safeKey)}>Save</button>
                        <button className="btn" style={{padding:'2px 8px', fontSize:11, background:'rgba(255,255,255,0.05)'}} onClick={() => setEditing(prev => { const n={...prev}; delete n[safeKey]; return n; })}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn" style={{padding:'2px 8px', fontSize:11, background:'rgba(255,255,255,0.05)', marginTop: 6}} onClick={() => setEditing(prev => ({...prev, [safeKey]: dispName}))}>
                        ✎ Edit
                      </button>
                    )}
                  </td>
                  <td data-label="Live Status">
                    <div style={{ marginBottom: 6 }}>
                      <StatusBadge status={realStatus} />
                    </div>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: 11 }}>
                      {lic.status === 'DISABLED' ? '🚫 DISABLED' : (isExpired ? '⚠️ EXPIRED' : '✅ LIC: ACTIVE')}
                    </span>
                    <div style={{fontSize:11, color:'var(--muted)', marginTop: 6}}>
                      Seen: {emp.lastSeen ? new Date(emp.lastSeen).toLocaleString('en-US') : '—'}
                    </div>
                  </td>
                  <td data-label="Current Map" style={{color: realStatus !== 'OFFLINE' ? 'var(--text)' : 'var(--muted)', fontSize: 13}}>
                    {emp.currentMap || '—'}
                  </td>
                  <td data-label="Expiry Date">
                    <input 
                      type="date"
                      value={lic.expiry || ''}
                      onChange={e => updateExpiry(safeKey, e.target.value)}
                      style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, width: 130 }}
                    />
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                      <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.05)' }} onClick={() => toggleStatus(safeKey, lic.status)}>
                        {lic.status === 'ACTIVE' ? '🚫 Disable License' : '✅ Enable License'}
                      </button>
                      <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => deleteLicense(safeKey)}>
                        🗑️ Delete Key
                      </button>
                    </div>
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
