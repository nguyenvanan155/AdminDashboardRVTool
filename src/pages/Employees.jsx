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
/* ------------------------------------------------------------------ */
/*  Proxy Modal Component                                               */
/* ------------------------------------------------------------------ */

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

      return (
    <div>
      <h1 className="page-title">👥 Employee Management</h1>
      <p style={{color:'var(--muted)', marginBottom:24, fontSize:14}}>
        Assign friendly names to License Keys. These names will be displayed across the dashboard.
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
