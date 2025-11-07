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
        background: '#f8f9fa',
        borderRadius: '10px',
        textAlign: 'center',
        color: '#666'
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
        background: '#f8f9fa',
        borderRadius: '10px',
        textAlign: 'center',
        color: '#666'
      }}>
        No scan history available
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      borderRadius: '10px',
      border: '1px solid #2196f3',
      maxHeight: '300px',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#1565c0' }}>
        📜 Scan History ({history.length} events)
      </div>
      {history.map((scan, index) => (
        <div
          key={scan.id || index}
          style={{
            padding: '12px',
            marginBottom: '8px',
            background: 'white',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: '600', color: '#1976d2' }}>
              {getActionLabel(scan.action)}
            </span>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {formatTimestamp(scan.timestamp)}
            </span>
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            <div>📍 {getLocationInfo(scan.location_id).name}</div>
            <div>👤 {scan.user_email || 'Unknown user'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}