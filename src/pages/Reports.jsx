import { useState, useEffect } from 'react';
import { ref, get, onValue } from 'firebase/database';
import * as XLSX from 'xlsx-js-style';
import { db } from '../firebase';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Sinh ra mang cac ngay tu startDate den endDate (inclusive)
function getDatesInRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const fin = new Date(end);
  while (cur <= fin) {
    dates.push(toDateStr(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default function Reports() {
  const today = toDateStr(new Date());
  const [filterKey,  setFilterKey]  = useState('ALL');
  const [startDate,  setStartDate]  = useState(today);
  const [endDate,    setEndDate]    = useState(today);
  const [loading,    setLoading]    = useState(false);
  const [preview,    setPreview]    = useState(null); // { logs, summary }
  const [licenses,   setLicenses]   = useState({});  // safeKey -> lic data

  // Load licenses ngay khi mount de dropdown hien ngay
  useEffect(() => {
    const unsub = onValue(ref(db, 'licenses'), snap => setLicenses(snap.val() || {}));
    return () => unsub();
  }, []);

  // Resolve display name tu /licenses
  const getName = (key) => {
    const lic = licenses[key];
    return lic ? (lic.note || lic.key || key) : key;
  };

  // Lay du lieu Firebase
  async function fetchLogs() {
    setLoading(true);
    try {
      const dates = getDatesInRange(startDate, endDate);
      let allLogs = [];

      for (const dateStr of dates) {
        const snap = await get(ref(db, `logs/${dateStr}`));
        const raw  = snap.val() || {};
        allLogs = allLogs.concat(Object.values(raw));
      }

      // Loc theo nhan vien
      if (filterKey !== 'ALL') {
        allLogs = allLogs.filter(l => {
          const logSafe = l.employeeSafeKey || l.employeeKey?.replace(/[.#$[\]\/]/g, '_');
          return logSafe === filterKey || l.employeeKey === filterKey;
        });
      }

      // Sap xep theo thoi gian
      allLogs.sort((a, b) => a.timestamp - b.timestamp);

      // Tinh summary theo nhan vien
      const summaryMap = {};
      for (const log of allLogs) {
        const k = log.employeeSafeKey || log.employeeKey;
        if (!summaryMap[k]) {
          summaryMap[k] = { key: log.employeeKey, name: getName(k), done: 0, noIncrease: 0, alreadyReviewed: 0, failed: 0, maps: new Set() };
        }
        summaryMap[k].maps.add(log.mapName);
        if (log.status === 'DONE')             summaryMap[k].done++;
        else if (log.status === 'NO_INCREASE') summaryMap[k].noIncrease++;
        else if (log.status === 'ALREADY_REVIEWED') summaryMap[k].alreadyReviewed++;
        else if (log.status === 'FAILED')      summaryMap[k].failed++;
      }

      const summary = Object.values(summaryMap).map(s => ({
        ...s,
        maps: [...s.maps].join(', '),
        total: s.done + s.noIncrease + s.alreadyReviewed + s.failed,
        rate: s.done + s.noIncrease + s.alreadyReviewed + s.failed > 0
          ? Math.round(s.done / (s.done + s.noIncrease + s.alreadyReviewed + s.failed) * 100)
          : 0,
      }));

      setPreview({ logs: allLogs, summary });
    } catch (err) {
      alert('Error fetching data: ' + err.message);
    }
    setLoading(false);
  }

  // Xuat file Excel
  function exportExcel() {
    if (!preview) return;
    const wb = XLSX.utils.book_new();

    /* -- Sheet 1: Tong hop KPI -- */
    const s1Data = [
      ['Employee', 'License Key', 'Maps Processed', 'Success', 'No Increase', 'Already Reviewed', 'Failed', 'Total', 'Success Rate'],
    ];
    for (const s of preview.summary) {
      s1Data.push([s.name, s.key, s.maps, s.done, s.noIncrease, s.alreadyReviewed, s.failed, s.total, `${s.rate}%`]);
    }
    const ws1 = XLSX.utils.aoa_to_sheet(s1Data);
    ws1['!cols'] = [20,36,40,18,14,14,12,10,14].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws1, 'KPI Summary');

    /* -- Tu Tab 2 tro di: Moi Map la mot Sheet -- */
    const mapGroups = {};
    for (const log of preview.logs) {
      if (log.status !== 'DONE') continue;
      if (!mapGroups[log.mapName]) mapGroups[log.mapName] = [];
      mapGroups[log.mapName].push(log);
    }

    const usedSheetNames = new Set(['KPI Summary']);

    for (const [mapName, logs] of Object.entries(mapGroups)) {
      const sheetData = [
        ['Map Name', 'Content', 'Result Link', 'Date Posted']
      ];

      logs.forEach((log, index) => {
        let dateStr = '';
        if (log.timestamp) {
          const d = new Date(log.timestamp);
          const pad = (n) => String(n).padStart(2, '0');
          dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
        sheetData.push([
          index === 0 ? (log.mapUrl || '') : '',
          log.content || '',
          log.shareLink || '',
          dateStr
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws[XLSX.utils.encode_cell({ r: 0, c: 0 })].v = mapName;

      // To mau vang cot A
      const colStyle = { fill: { fgColor: { rgb: "FFFFFF00" } } };
      for (let rIdx = 0; rIdx < sheetData.length; rIdx++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rIdx, c: 0 });
        if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
        ws[cellAddress].s = colStyle;
      }

      ws['!cols'] = [40, 70, 70, 15].map(w => ({wch:w}));

      let baseName = mapName.replace(/[\\/?*[\]:]/g, ' ').trim().substring(0, 28);
      if (!baseName) baseName = 'Map';
      
      let sheetName = baseName;
      let counter = 1;
      while (usedSheetNames.has(sheetName.toLowerCase())) {
        sheetName = `${baseName} (${counter})`;
        counter++;
      }
      usedSheetNames.add(sheetName.toLowerCase());

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const fname = `Report_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fname);
  }

  // Danh sach license de loc — lay tu /licenses, bo key khong hop le
  const licenseOptions = Object.entries(licenses);

  return (
    <div>
      <h1 className="page-title">📥 Export Reports</h1>

      <div className="card" style={{marginBottom:24}}>
        <div className="section-title" style={{marginBottom:16}}>Filters</div>
        <div className="toolbar">
          <select value={filterKey} onChange={e => setFilterKey(e.target.value)}>
            <option value="ALL">All Employees</option>
            {licenseOptions.map(([sk, lic]) => (
              <option key={sk} value={sk}>{lic.note || lic.key || sk}</option>
            ))}
          </select>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{color:'var(--muted)', fontSize:14}}>From date</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{color:'var(--muted)', fontSize:14}}>To date</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn primary" onClick={fetchLogs} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔍 View Results'}
          </button>
          {preview && (
            <button className="btn success" onClick={exportExcel}>
              📥 Export Excel ({preview.logs.length} rows)
            </button>
          )}
        </div>
      </div>

      {/* Preview Tong hop */}
      {preview && (
        <>
          <div className="section-title">Sheet 1 — KPI Summary</div>
          <div className="table-wrap" style={{marginBottom:28}}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Maps Processed</th>
                  <th>✅ Success</th>
                  <th>⚠️ No Increase</th>
                  <th>🔁 Already Reviewed</th>
                  <th>❌ Failed</th>
                  <th>Total</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {preview.summary.length === 0 && (
                  <tr><td colSpan={8} className="empty">No data available for the selected period.</td></tr>
                )}
                {preview.summary.map((s, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{s.name}</td>
                    <td style={{fontSize:13, color:'var(--muted)'}}>{s.maps || '—'}</td>
                    <td style={{color:'var(--success)', fontWeight:600}}>{s.done}</td>
                    <td style={{color:'var(--warn)'}}>{s.noIncrease}</td>
                    <td style={{color:'var(--muted)'}}>{s.alreadyReviewed}</td>
                    <td style={{color:'var(--danger)'}}>{s.failed}</td>
                    <td style={{fontWeight:600}}>{s.total}</td>
                    <td>
                      <span style={{color: s.rate >= 70 ? 'var(--success)' : s.rate >= 40 ? 'var(--warn)' : 'var(--danger)', fontWeight:600}}>
                        {s.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview Chi tiet */}
          <div className="section-title">Sheet 2 — Details ({preview.logs.length} rows)</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Employee</th>
                  <th>Map</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Share Link</th>
                </tr>
              </thead>
              <tbody>
                {preview.logs.slice(0, 100).map((log, i) => {
                  const logSafeKey = log.employeeSafeKey || log.employeeKey;
                  return (
                  <tr key={i}>
                    <td style={{fontSize:13, color:'var(--muted)'}}>
                      {new Date(log.timestamp).toLocaleString('en-US')}
                    </td>
                    <td style={{fontWeight:500}}>{getName(logSafeKey)}</td>
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
                  );
                })}
                {preview.logs.length > 100 && (
                  <tr><td colSpan={6} style={{textAlign:'center', color:'var(--muted)', padding:12, fontSize:13}}>
                    ... and {preview.logs.length - 100} more rows (export to Excel to view all)
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}