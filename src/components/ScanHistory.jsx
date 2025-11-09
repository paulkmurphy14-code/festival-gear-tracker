import { useState, useEffect } from 'react';

export default function ScanHistory({ gearId, loadScanHistory, getLocationInfo }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const scans = await loadScanHistory(gearId);
      setHistory(scans);
      setLoading(false);
    };
    fetchHistory();
  }, [gearId, loadScanHistory]);

  const getActionLabel = (action) => {
    const labels = {
      'check_in_from_band': '📦 Checked in from band',
      'check_in_from_transit': '🚚 Checked in from transit',
      'location_change': '📍 Location changed',
      'check_out_transit': '🚚 Checked out for transit',
      'check_out_band': '📦 Checked out to band'
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        marginTop: '12px',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '10px',
        textAlign: 'center',
        color: '#888',
        border: '2px solid #664400'
      }}>
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{
        marginTop: '12px',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '10px',
        textAlign: 'center',
        color: '#888',
        border: '2px solid #664400'
      }}>
        No scan history available
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: '#2d2d2d',
      borderRadius: '10px',
      border: '2px solid #664400',
      maxHeight: '300px',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700', color: '#ffa500', textTransform: 'uppercase', letterSpacing: '1px' }}>
        📜 Scan History ({history.length} events)
      </div>
      {history.map((scan, index) => (
        <div
          key={scan.id || index}
          style={{
            padding: '12px',
            marginBottom: '8px',
            background: '#1a1a1a',
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid #3a3a3a'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: '600', color: '#ffa500' }}>
              {getActionLabel(scan.action)}
            </span>
            <span style={{ color: '#888', fontSize: '12px' }}>
              {formatTimestamp(scan.timestamp)}
            </span>
          </div>
          <div style={{ color: '#e0e0e0', fontSize: '12px' }}>
            <div>📍 {getLocationInfo(scan.location_id).name}</div>
            <div>👤 {scan.user_email || 'Unknown user'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}