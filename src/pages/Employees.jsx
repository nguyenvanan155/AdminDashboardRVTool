import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';

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

export default function Employees() {
  const [employees, setEmployees] = useState({});
  const [licenses, setLicenses] = useState({});
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
      <h1 className="page-title">👥 Employee Management</h1>
      <p style={{color:'var(--muted)', marginBottom:24, fontSize:14}}>
        Employee list is synchronized with your License Keys. 
        Update the Display Name here to easily identify machines in the Remote Control tab.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>License Key</th>
              <th>Display Name</th>
              <th>Status</th>
              <th>Current Map</th>
              <th>Last Seen</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} className="empty">
                No licenses found. Please create a License Key first.
              </td></tr>
            )}
            {entries.map(([safeKey, lic]) => {
              const emp = employees[safeKey] || {};
              const realStatus = getRealStatus(emp);
              const dispName  = lic.note || '';
              const editVal   = editing[safeKey] ?? dispName;
              const isEditing = safeKey in editing;

              return (
                <tr key={safeKey}>
                  <td data-label="License Key" style={{fontFamily:'monospace', fontSize:13, color:'var(--muted)'}}>
                    {lic.key || safeKey}
                  </td>
                  <td data-label="Display Name">
                    {isEditing ? (
                      <input
                        value={editVal}
                        onChange={e => setEditing(prev => ({...prev, [safeKey]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && saveName(safeKey)}
                        placeholder="Enter employee name..."
                        style={{width:180, padding: '4px 8px'}}
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
                      <button className="btn primary" style={{padding:'5px 14px', fontSize:13}}
                        onClick={() => setEditing(prev => ({...prev, [safeKey]: dispName}))}>
                        ✎ Edit Name
                      </button>
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
