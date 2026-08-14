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

export default function Licenses() {
  const [licenses, setLicenses] = useState({});
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    const r = ref(db, 'licenses');
    const unsub = onValue(r, snap => {
      setLicenses(snap.val() || {});
    });
    return () => unsub();
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
  
  function updateNote(safeKey, newNote) {
    update(ref(db, `licenses/${safeKey}`), { note: newNote }).catch(err => alert('Failed: ' + err.message));
  }

  const entries = Object.entries(licenses);

  return (
    <div>
      <h1 className="page-title">🔑 License Management</h1>
      
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

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>License Key</th>
              <th>Status</th>
              <th>Hardware ID (HWID)</th>
              <th>Expiry Date</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} className="empty">No licenses found.</td></tr>
            )}
            {entries.map(([safeKey, lic]) => {
              const isExpired = lic.expiry && new Date(lic.expiry) < new Date();
              const badgeClass = lic.status === 'ACTIVE' && !isExpired ? 'online' : (lic.status === 'DISABLED' ? 'offline' : 'offline');
              
              return (
                <tr key={safeKey}>
                  <td data-label="License Key" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                    {lic.key || safeKey}
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${badgeClass}`}>
                      <div className={`dot ${badgeClass === 'online' ? 'g' : 'r'}`} />
                      {lic.status === 'DISABLED' ? 'DISABLED' : (isExpired ? 'EXPIRED' : 'ACTIVE')}
                    </span>
                  </td>
                  <td data-label="HWID" style={{ fontFamily: 'monospace', fontSize: 12, color: lic.hwid ? 'var(--text)' : 'var(--muted)' }}>
                    {lic.hwid || 'Not Bound'}
                    {lic.hwid && (
                      <button className="btn" style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)' }} onClick={() => resetHwid(safeKey)}>
                        Reset HWID
                      </button>
                    )}
                  </td>
                  <td data-label="Expiry Date">
                    <input 
                      type="date"
                      value={lic.expiry || ''}
                      onChange={e => updateExpiry(safeKey, e.target.value)}
                      style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4 }}
                    />
                  </td>
                  <td data-label="Note">
                    <input 
                      type="text"
                      placeholder="User name, info..."
                      value={lic.note || ''}
                      onChange={e => updateNote(safeKey, e.target.value)}
                      style={{ padding: '4px 8px', width: 140 }}
                    />
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.05)' }} onClick={() => toggleStatus(safeKey, lic.status)}>
                        {lic.status === 'ACTIVE' ? '🚫 Disable' : '✅ Enable'}
                      </button>
                      <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => deleteLicense(safeKey)}>
                        🗑️ Delete
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
