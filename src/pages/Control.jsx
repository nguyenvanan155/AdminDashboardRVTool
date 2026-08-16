import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

const FIREBASE_SECRET = 'h88ZsD2lxYWBws2UD7gEdukIRdMmGV7iwb8tpJJD';
const FIREBASE_URL    = 'https://admin-reviewtool-default-rtdb.asia-southeast1.firebasedatabase.app';

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

async function sendCommand(safeKey, action, payload = null) {
  const url = `${FIREBASE_URL}/commands/${safeKey}.json?auth=${FIREBASE_SECRET}`;
  await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, issuedAt: Date.now() }),
  });
}

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
      onSent(`⏳ Fetching ${num} proxies via ${provider.toUpperCase()}...`);
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

function StartModal({ safeKey, dispName, targets, onClose, onSent }) {
  const allIds = (targets || []).map(t => t.id);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleStart() {
    if (loading) return;
    setLoading(true);
    try {
      const payload = selected.length > 0 && selected.length < allIds.length
        ? { selectedTargetIds: selected }
        : {};  // empty = all maps
      await sendCommand(safeKey, 'start', payload);
      const label = selected.length === allIds.length || selected.length === 0
        ? 'all maps'
        : `${selected.length} map(s)`;
      onSent(`✅ Start command sent — running ${label}`);
      onClose();
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const hasTargets = targets && targets.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface,#1a1f2e)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>▶️ Start Job — <span style={{ color: 'var(--muted,#888)', fontWeight: 400 }}>{dispName || safeKey}</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted,#888)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {hasTargets ? (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button onClick={() => setSelected(allIds)}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', cursor: 'pointer' }}>
                Select All
              </button>
              <button onClick={() => setSelected([])}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: 'var(--muted,#888)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                Deselect All
              </button>
              <span style={{ fontSize: 12, color: 'var(--muted,#888)', alignSelf: 'center', marginLeft: 'auto' }}>
                {selected.length}/{allIds.length} selected
              </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {targets.map(t => {
                const checked = selected.includes(t.id);
                const depleted = t.limit_reached;
                return (
                  <label key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                    background: checked ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${checked ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    opacity: depleted ? 0.45 : 1,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={checked} disabled={depleted}
                      onChange={() => !depleted && toggle(t.id)}
                      style={{ width: 15, height: 15, accentColor: '#4ade80', cursor: 'pointer' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name || `Map #${t.id}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted,#888)', marginTop: 2 }}>
                        {t.country || '—'} &nbsp;·&nbsp;
                        Limit: {t.daily_limit || 'default'} &nbsp;·&nbsp;
                        Unused: <span style={{ color: (t.unused ?? t.contentUnused ?? 0) > 0 ? '#4ade80' : '#ef4444' }}>{t.unused ?? t.contentUnused ?? 0}</span>
                        {t.limit_reached && <span style={{ color: '#ef4444', marginLeft: 6 }}>⛔ limit reached</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--muted,#888)', fontSize: 13, marginBottom: 16, padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
            ⚠️ No map data from tool — all maps will run. (Restart tool to sync map list.)
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading || (hasTargets && selected.length === 0)}
          style={{
            width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: (loading || (hasTargets && selected.length === 0)) ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.15)',
            color: (hasTargets && selected.length === 0) ? 'var(--muted)' : '#4ade80',
            border: '1px solid rgba(74,222,128,0.3)', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '⏳ Sending...' : `▶️ Start${hasTargets && selected.length > 0 && selected.length < allIds.length ? ` (${selected.length} maps)` : ' All'}`}
        </button>
      </div>
    </div>
  );
}


function AddTargetsModal({ safeKey, dispName, targets, onClose, onSent }) {
  const allIds = (targets || []).filter(t => (t.unused ?? t.contentUnused ?? 0) > 0 && !t.limit_reached).map(t => t.id);
  const [selected, setSelected] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleAdd() {
    if (loading || selected.length === 0) return;
    setLoading(true);
    try {
      await sendCommand(safeKey, 'add_targets', { selectedTargetIds: selected });
      onSent(`✅ Add command sent — added ${selected.length} map(s)`);
      onClose();
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const hasTargets = targets && targets.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface,#1a1f2e)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>➕ Add More Maps — <span style={{ color: 'var(--muted,#888)', fontWeight: 400 }}>{dispName || safeKey}</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted,#888)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {hasTargets ? (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button onClick={() => setSelected(allIds)}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', cursor: 'pointer' }}>
                Select All Valid
              </button>
              <button onClick={() => setSelected([])}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: 'var(--muted,#888)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                Deselect All
              </button>
              <span style={{ fontSize: 12, color: 'var(--muted,#888)', alignSelf: 'center', marginLeft: 'auto' }}>
                {selected.length}/{allIds.length} selected
              </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {targets.map(t => {
                const depleted = t.limit_reached || (t.unused ?? t.contentUnused ?? 0) <= 0;
                const checked = selected.includes(t.id);
                return (
                  <label key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 7, cursor: depleted ? 'not-allowed' : 'pointer',
                    background: checked ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${checked ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    opacity: depleted ? 0.45 : 1,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={checked} disabled={depleted}
                      onChange={() => !depleted && toggle(t.id)}
                      style={{ width: 15, height: 15, accentColor: '#4ade80', cursor: depleted ? 'not-allowed' : 'pointer' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name || `Map #${t.id}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted,#888)', marginTop: 2 }}>
                        {t.country || '—'} &nbsp;·&nbsp;
                        Limit: {t.daily_limit || 'default'} &nbsp;·&nbsp;
                        Unused: <span style={{ color: (t.unused ?? t.contentUnused ?? 0) > 0 ? '#4ade80' : '#ef4444' }}>{t.unused ?? t.contentUnused ?? 0}</span>
                        {t.limit_reached && <span style={{ color: '#ef4444', marginLeft: 6 }}>⛔ limit reached</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--muted,#888)', fontSize: 13, marginBottom: 16, padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
            ⚠️ No map data from tool.
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={loading || selected.length === 0}
          style={{
            width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: (loading || selected.length === 0) ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.15)',
            color: selected.length === 0 ? 'var(--muted)' : '#4ade80',
            border: '1px solid rgba(74,222,128,0.3)', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '⏳ Sending...' : `➕ Add ${selected.length} map(s)`}
        </button>
      </div>
    </div>
  );
}

function StopTargetModal({ safeKey, dispName, activeMaps, fallbackTargets, onClose, onSent }) {
  const [selectedMapId, setSelectedMapId] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Use activeMaps from heartbeat if available, otherwise use fallback
  const mapsToDisplay = (activeMaps && activeMaps.length > 0) ? activeMaps : (fallbackTargets || []);

  async function handleStop() {
    if (loading || !selectedMapId) return;
    setLoading(true);
    try {
      await sendCommand(safeKey, 'stop_target', { targetId: selectedMapId });
      onSent(`✅ Stop command sent for map ID ${selectedMapId}`);
      onClose();
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface,#1a1f2e)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 28, width: 480, maxWidth: '92vw',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>⛔ Stop One Map — <span style={{ color: 'var(--muted,#888)', fontWeight: 400 }}>{dispName || safeKey}</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted,#888)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Select map to stop:</label>
          <select 
            value={selectedMapId} 
            onChange={e => setSelectedMapId(e.target.value)}
            style={{ 
              width: '100%', padding: '10px', borderRadius: 8, 
              background: 'rgba(255,255,255,0.05)', color: 'var(--text)', 
              border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 
            }}
          >
            <option value="">-- Choose a Map --</option>
            {mapsToDisplay.map(t => (
              <option key={t.id} value={t.id}>{t.name || `Map #${t.id}`}</option>
            ))}
          </select>
          {(!activeMaps || activeMaps.length === 0) && (
            <div style={{ fontSize: 11, color: '#eab308', marginTop: 8 }}>
              ⚠️ Active maps list not received from tool. Displaying all maps. Stopping a map not in queue has no effect.
            </div>
          )}
        </div>

        <button
          onClick={handleStop}
          disabled={loading || !selectedMapId}
          style={{
            width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: (loading || !selectedMapId) ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.15)',
            color: !selectedMapId ? 'var(--muted)' : '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '⏳ Sending...' : '⛔ Stop Selected Map'}
        </button>
      </div>
    </div>
  );
}



function ResetLimitModal({ safeKey, dispName, targets, onClose, onSent }) {
  const [selectedMapId, setSelectedMapId] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Targets that have reached limit
  const limitedTargets = (targets || []).filter(t => t.limit_reached || (t.unused ?? t.contentUnused ?? 0) <= 0);
  // Other targets
  const otherTargets = (targets || []).filter(t => !t.limit_reached && (t.unused ?? t.contentUnused ?? 0) > 0);

  async function handleReset(targetId) {
    if (loading) return;
    setLoading(true);
    try {
      await sendCommand(safeKey, 'reset_limit', targetId ? { targetId } : {});
      onSent(targetId ? `✅ Reset limit for map ID ${targetId}` : `✅ Reset limits for ALL maps`);
      onClose();
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface,#1a1f2e)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>🔄 Clear Daily Limits — <span style={{ color: 'var(--muted,#888)', fontWeight: 400 }}>{dispName || safeKey}</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted,#888)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ marginBottom: 16, flex: 1, overflowY: 'auto' }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Select map to clear limit:</label>
          <select 
            value={selectedMapId} 
            onChange={e => setSelectedMapId(e.target.value)}
            style={{ 
              width: '100%', padding: '10px', borderRadius: 8, 
              background: 'rgba(255,255,255,0.05)', color: 'var(--text)', 
              border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, marginBottom: 16
            }}
          >
            <option value="">-- Choose a Map --</option>
            {limitedTargets.length > 0 && <optgroup label="⚠️ Limit Reached">
              {limitedTargets.map(t => (
                <option key={t.id} value={t.id}>{t.name || `Map #${t.id}`} (Limit: {t.daily_limit || 'default'})</option>
              ))}
            </optgroup>}
            {otherTargets.length > 0 && <optgroup label="✅ Normal Maps">
              {otherTargets.map(t => (
                <option key={t.id} value={t.id}>{t.name || `Map #${t.id}`} (Unused: {t.unused ?? t.contentUnused ?? 0})</option>
              ))}
            </optgroup>}
          </select>
          
          <button
            onClick={() => handleReset(selectedMapId)}
            disabled={loading || !selectedMapId}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 12,
              background: (loading || !selectedMapId) ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.15)',
              color: !selectedMapId ? 'var(--muted)' : '#4ade80',
              border: '1px solid rgba(74,222,128,0.3)', cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⏳ Sending...' : '🔄 Clear Limit for Selected Map'}
          </button>
          
          <div style={{ textAlign: 'center', margin: '10px 0', color: 'var(--muted)', fontSize: 12 }}>OR</div>

          <button
            onClick={() => handleReset('')}
            disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: loading ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)', cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⏳ Sending...' : '💥 Clear ALL Limits (Reset All)'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Control() {
  const [employees, setEmployees] = useState({});
  const [licenses, setLicenses] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  
  const [cmdFeedback, setCmdFeedback] = useState('');
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = React.useState(false);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [stopModalOpen, setStopModalOpen] = React.useState(false);
  const [resetLimitModalOpen, setResetLimitModalOpen] = React.useState(false);
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

  async function handleCommand(action) {
    try {
      await sendCommand(selectedKey, action);
      setCmdFeedback(`? Sent: ${action.toUpperCase()}`);
      setTimeout(() => setCmdFeedback(''), 4000);
    } catch (e) {
      alert('Failed to send command: ' + e.message);
    }
  }

  function onProxySent(msg) {
    setCmdFeedback(msg);
    setTimeout(() => setCmdFeedback(''), 6000);
  }

  const selectedEmp = selectedKey ? employees[selectedKey] : null;
  const safeKey = selectedKey;
  const realStatus = selectedEmp ? getRealStatus(selectedEmp) : 'OFFLINE';
  const isOnline = realStatus !== 'OFFLINE';

  return (
    <div>
      <h1 className="page-title">🤖 BoostFalcon Control</h1>
      <p style={{color:'var(--muted)', marginBottom:24, fontSize:14}}>Manage your Auto-seller tool instances. Select a license key to view stats and send remote commands.</p>

      {proxyModalOpen && (
        <ProxyModal
          safeKey={selectedKey}
          dispName={selectedKey}
          onClose={() => setProxyModalOpen(false)}
          onSent={onProxySent}
        />
      )}

      {addModalOpen && (
        <AddTargetsModal
          safeKey={selectedKey}
          dispName={selectedKey}
          targets={selectedEmp?.dbSnapshot?.targets || selectedEmp?.targets || []}
          onClose={() => setAddModalOpen(false)}
          onSent={(msg) => { setCmdFeedback(msg); setTimeout(() => setCmdFeedback(''), 6000); }}
        />
      )}

      {resetLimitModalOpen && (
        <ResetLimitModal
          safeKey={selectedKey}
          dispName={selectedKey}
          targets={selectedEmp?.dbSnapshot?.targets || selectedEmp?.targets || []}
          onClose={() => setResetLimitModalOpen(false)}
          onSent={(msg) => { setCmdFeedback(msg); setTimeout(() => setCmdFeedback(''), 6000); }}
        />
      )}

      {stopModalOpen && (
        <StopTargetModal
          safeKey={selectedKey}
          dispName={selectedKey}
          activeMaps={selectedEmp?.activeMaps || []}
          fallbackTargets={selectedEmp?.dbSnapshot?.targets || selectedEmp?.targets || []}
          onClose={() => setStopModalOpen(false)}
          onSent={(msg) => { setCmdFeedback(msg); setTimeout(() => setCmdFeedback(''), 6000); }}
        />
      )}

      {startModalOpen && (
        <StartModal
          safeKey={selectedKey}
          dispName={selectedKey}
          targets={selectedEmp?.dbSnapshot?.targets || selectedEmp?.targets || []}
          onClose={() => setStartModalOpen(false)}
          onSent={(msg) => { setCmdFeedback(msg); setTimeout(() => setCmdFeedback(''), 6000); }}
        />
      )}

      
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Select Machine to Control</label>
          <select 
            value={selectedKey} 
            onChange={(e) => setSelectedKey(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
              color: 'var(--text)', fontSize: 15, fontWeight: 500, cursor: 'pointer'
            }}
          >
            <option value="" disabled>-- Select an employee --</option>
            {Object.entries(employees).map(([k]) => {
              const dispName = licenses[k]?.note;
              const label = dispName ? `${dispName} (${k})` : k;
              return <option key={k} value={k} style={{ background: '#1a1f2e', color: '#fff' }}>{label}</option>;
            })}
          </select>
        </div>

        {!selectedKey ? (
          <div className="empty" style={{ padding: '40px 0' }}>No machine selected. Please select a machine to control.</div>
        ) : (
          <div style={{ display: 'block' }}>

        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Target Machine</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedKey}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Current Status</div>
              <StatusBadge status={realStatus} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Current Map</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: isOnline ? 'var(--text)' : 'var(--muted)' }}>
                {isOnline ? (selectedEmp?.currentMap || 'Initializing...') : '—'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operations</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <button 
              onClick={() => setStartModalOpen(true)}
              style={{
                padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'rgba(74,222,128,0.15)',
                color: '#4ade80',
                border: `1px solid rgba(74,222,128,0.3)`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              ▶️ Start Job
            </button>

            <button 
              onClick={() => handleCommand('stop')}
              style={{
                padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: `1px solid rgba(239,68,68,0.3)`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              ⏹️ Stop All
            </button>

            <button 
              onClick={() => handleCommand('pause')}
              style={{
                padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'rgba(234,179,8,0.15)',
                color: '#eab308',
                border: `1px solid rgba(234,179,8,0.3)`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              ⏸️ Pause
            </button>

            <button 
              onClick={() => handleCommand('resume')}
              style={{
                padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'rgba(59,130,246,0.15)',
                color: '#3b82f6',
                border: `1px solid rgba(59,130,246,0.3)`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              ⏯️ Resume
            </button>
          </div>

          {isOnline && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <button 
                onClick={() => setAddModalOpen(true)}
                disabled={realStatus !== 'RUNNING'}
                style={{
                  padding: '14px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: realStatus === 'RUNNING' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                  color: realStatus === 'RUNNING' ? '#4ade80' : 'var(--muted)',
                  border: `1px solid ${realStatus === 'RUNNING' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  cursor: realStatus === 'RUNNING' ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: realStatus === 'RUNNING' ? 1 : 0.5
                }}
              >
                ➕ Add Maps
              </button>

              <button 
                onClick={() => setStopModalOpen(true)}
                disabled={realStatus !== 'RUNNING'}
                style={{
                  padding: '14px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: realStatus === 'RUNNING' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  color: realStatus === 'RUNNING' ? '#ef4444' : 'var(--muted)',
                  border: `1px solid ${realStatus === 'RUNNING' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  cursor: realStatus === 'RUNNING' ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: realStatus === 'RUNNING' ? 1 : 0.5
                }}
              >
                ⛔ Stop Map
              </button>

              <button 
                onClick={() => setResetLimitModalOpen(true)}
                style={{
                  padding: '14px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(56,189,248,0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56,189,248,0.3)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                🔄 Clear Limit
              </button>
            </div>
          )}

          <button 
            onClick={() => setProxyModalOpen(true)}
            style={{
              width: '100%', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'rgba(255,255,255,0.1)',
              color: 'var(--text)',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            🌐 Open Proxy Tools
          </button>
          
          <button 
            onClick={() => handleCommand('sync_full_db')}
            style={{
              width: '100%', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'rgba(168,85,247,0.15)',
              color: '#a855f7',
              border: `1px solid rgba(168,85,247,0.3)`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 12
            }}
          >
            📥 Force Sync Now (Auto-syncs 60s)
          </button>

          {cmdFeedback && (
            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
              {cmdFeedback}
            </div>
          )}
          
          {selectedEmp?.dbSnapshot ? (
            <div style={{ marginTop: 32, padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#a855f7' }}>📊 Database Snapshot</h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                Last Synced: {new Date(selectedEmp.dbSnapshot.syncedAt).toLocaleString('en-US')}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Accounts ({selectedEmp.dbSnapshot.accounts.total})</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Unused:</span> <span style={{ color: '#4ade80' }}>{selectedEmp.dbSnapshot.accounts.unused}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Used/Success:</span> <span style={{ color: '#3b82f6' }}>{selectedEmp.dbSnapshot.accounts.used_success}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Failed/Dead:</span> <span style={{ color: '#ef4444' }}>{selectedEmp.dbSnapshot.accounts.failed}</span></div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Proxies ({selectedEmp.dbSnapshot.proxies.total})</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Idle:</span> <span style={{ color: '#4ade80' }}>{selectedEmp.dbSnapshot.proxies.idle}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Used:</span> <span style={{ color: '#3b82f6' }}>{selectedEmp.dbSnapshot.proxies.used}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Failed:</span> <span style={{ color: '#ef4444' }}>{selectedEmp.dbSnapshot.proxies.failed}</span></div>
                </div>
              </div>

              <div style={{ fontWeight: 600, marginBottom: 12 }}>Target Maps ({selectedEmp.dbSnapshot.targets.length})</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#1a1f2e' }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Map Name</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Total</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Unused</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Used</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Done Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmp.dbSnapshot.targets.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.name || t.url || `Map #${t.id}`}>{t.name || t.url || `Map #${t.id}`}</td>
                        <td style={{ padding: '8px' }}>{t.total}</td>
                        <td style={{ padding: '8px', color: '#4ade80' }}>{t.unused}</td>
                        <td style={{ padding: '8px', color: '#3b82f6' }}>{t.used}</td>
                        <td style={{ padding: '8px', color: t.limit_reached ? '#ef4444' : 'inherit' }}>{t.doneToday} / {t.daily_limit} {t.limit_reached && '(Limit)'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 32, padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--muted)' }}>
              No database snapshot available yet. Wait up to 60 seconds for auto-sync...
            </div>
          )}
          
        </div>
        </div>
        )}
      </div>
    </div>
  );
}

