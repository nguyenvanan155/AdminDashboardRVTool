import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import DatabaseModal from '../components/DatabaseModal';

function loadNameMap() {
  try { return JSON.parse(localStorage.getItem('nameMap') || '{}'); }
  catch { return {}; }
}

/** Xác định badge màu theo status từ Firebase */
function StatusBadge({ status }) {
  if (status === 'ACTIVE')  return <span className="badge online"><div className="dot g" />🟢 Active</span>;
  if (status === 'IDLE')    return <span className="badge" style={{background:'rgba(234,179,8,0.12)',color:'#eab308'}}><div className="dot y" />🟡 Idle</span>;
  return                           <span className="badge offline"><div className="dot r" />🔴 Offline</span>;
}

/** Tự động offline nếu quá 3 phút (180000ms) không update lastSeen */
function getRealStatus(emp) {
  if (emp.status === 'OFFLINE') return 'OFFLINE';
  if (!emp.lastSeen || Date.now() - emp.lastSeen > 180000) return 'OFFLINE';
  return emp.status;
}

export default function Dashboard() {
  const [employees,    setEmployees]    = useState({});
  const [todayLogs,   setTodayLogs]    = useState([]);
  const [nameMap]                      = useState(loadNameMap);
  const [modalEmp,    setModalEmp]     = useState(null); // { safeKey, emp } | null
  const [,            setTick]         = useState(0);

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  })();

  // Re-render every 30s to update the auto-offline calculation
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'employees'), snap => setEmployees(snap.val() || {}));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, `logs/${todayStr}`), snap => {
      const raw  = snap.val() || {};
      setTodayLogs(Object.values(raw).sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [todayStr]);

  // KPI
  const employeesList = Object.values(employees).map(e => ({ ...e, realStatus: getRealStatus(e) }));
  const onlineCount = employeesList.filter(e => e.realStatus === 'ACTIVE' || e.realStatus === 'IDLE').length;
  const activeCount = employeesList.filter(e => e.realStatus === 'ACTIVE').length;
  const totalEmp    = employeesList.length;
  const doneToday   = todayLogs.filter(l => l.status === 'DONE').length;
  const mapsToday   = [...new Set(todayLogs.map(l => l.mapName))].filter(Boolean).length;

  const getName = (key) => nameMap[key] || key;

  return (
    <div>
      <h1 className="page-title">📊 Overview</h1>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card">
          <div className="kpi-label">Online Now</div>
          <div className="kpi-value" style={{color:'var(--success)'}}>
            {onlineCount}
            <span style={{fontSize:16,color:'var(--muted)',fontWeight:400}}> / {totalEmp} Staff</span>
          </div>
          <div className="kpi-sub">
            🟢 {activeCount} Active &nbsp;·&nbsp; 🟡 {onlineCount - activeCount} Idle
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Successful Reviews Today</div>
          <div className="kpi-value" style={{color:'var(--accent)'}}>{doneToday}</div>
          <div className="kpi-sub">DONE status only</div>
        </div>
        <div className="card">
          <div className="kpi-label">Maps Processed Today</div>
          <div className="kpi-value">{mapsToday}</div>
          <div className="kpi-sub">Unique Maps</div>
        </div>
      </div>

      {/* Employee Status Table */}
      <div className="section-title">Employee Status (Live)</div>
      <div className="table-wrap" style={{marginBottom:32}}>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Status</th>
              <th>Current Map</th>
              <th>Reviews Today</th>
              <th>Last Seen</th>
              <th>DB</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(employees).length === 0 && (
              <tr><td colSpan={6} className="empty">No employees connected yet...</td></tr>
            )}
            {Object.entries(employees).map(([safeKey, emp]) => {
              const realStatus = getRealStatus(emp);
              const done = todayLogs.filter(l => l.employeeSafeKey === safeKey && l.status === 'DONE').length;
              const hasTargets = emp.targets && Object.keys(emp.targets).length > 0;
              return (
                <tr key={safeKey}>
                  <td style={{fontWeight:600}}>{getName(emp.key || safeKey)}</td>
                  <td><StatusBadge status={realStatus} /></td>
                  <td style={{color: realStatus === 'ACTIVE' ? 'var(--text)' : 'var(--muted)'}}>
                    {emp.currentMap || '—'}
                  </td>
                  <td style={{fontWeight:600, color:'var(--success)'}}>{done}</td>
                  <td style={{color:'var(--muted)', fontSize:13}}>
                    {emp.lastSeen ? new Date(emp.lastSeen).toLocaleTimeString('en-US') : '—'}
                  </td>
                  <td>
                    {hasTargets ? (
                      <button
                        className="btn primary"
                        style={{padding:'4px 12px', fontSize:12}}
                        onClick={() => setModalEmp({ safeKey, emp })}
                      >
                        🗄️ View DB
                      </button>
                    ) : (
                      <span style={{color:'var(--muted)', fontSize:12}}>Syncing...</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Latest Logs */}
      <div className="section-title">Latest Logs Today</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Employee</th>
              <th>Map</th>
              <th>Account</th>
              <th>Status</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {todayLogs.length === 0 && (
              <tr><td colSpan={6} className="empty">No logs recorded today...</td></tr>
            )}
            {todayLogs.slice(0, 50).map((log, i) => (
              <tr key={i}>
                <td style={{fontSize:13, color:'var(--muted)'}}>
                  {new Date(log.timestamp).toLocaleTimeString('en-US')}
                </td>
                <td style={{fontWeight:500}}>{getName(log.employeeKey)}</td>
                <td>{log.mapName}</td>
                <td style={{fontSize:13, color:'var(--muted)'}}>{log.account}</td>
                <td>
                  <span className={`badge ${
                    log.status === 'DONE'             ? 'done' :
                    log.status === 'NO_INCREASE'      ? 'warn' :
                    log.status === 'ALREADY_REVIEWED' ? 'warn' : 'fail'
                  }`}>{log.status}</span>
                </td>
                <td>
                  {log.shareLink
                    ? <a href={log.shareLink} target="_blank" rel="noreferrer" style={{color:'var(--accent)', fontSize:13}}>🔗 View</a>
                    : <span style={{color:'var(--muted)'}}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Database Modal */}
      {modalEmp && (
        <DatabaseModal
          employee={modalEmp.emp}
          name={getName(modalEmp.emp.key || modalEmp.safeKey)}
          onClose={() => setModalEmp(null)}
        />
      )}
    </div>
  );
}
