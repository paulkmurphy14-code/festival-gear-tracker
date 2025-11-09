import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useRole } from '../hooks/useRole';

export default function Schedule() {
  const db = useDatabase();
  const { canUploadScheduleCSV } = useRole();

  // Data state
  const [performances, setPerformances] = useState([]);
  const [locations, setLocations] = useState([]);

  // UI state
  const [expandedDays, setExpandedDays] = useState({});
  const [expandedStages, setExpandedStages] = useState({});
  const [bandFilter, setBandFilter] = useState('');
  const [timeFormat, setTimeFormat] = useState('24hr'); // '24hr' or '12hr'

  // CSV Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [validatedRows, setValidatedRows] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load schedule data
  const loadSchedule = useCallback(async () => {
    try {
      const perfs = await db.performances.toArray();
      const locs = await db.locations.toArray();

      setPerformances(perfs);
      setLocations(locs);

      // Auto-expand current day
      if (perfs.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const grouped = groupByDay(perfs);

        if (grouped[today]) {
          setExpandedDays({ [today]: true });
        } else {
          // If no performances today, expand first day
          const firstDay = Object.keys(grouped).sort()[0];
          if (firstDay) {
            setExpandedDays({ [firstDay]: true });
          }
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }, [db]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Helper: Group performances by day
  const groupByDay = (perfs) => {
    const grouped = {};
    perfs.forEach(perf => {
      if (!grouped[perf.date]) {
        grouped[perf.date] = [];
      }
      grouped[perf.date].push(perf);
    });
    return grouped;
  };

  // Helper: Group performances by stage within a day
  const groupByStage = (perfs) => {
    const grouped = {};
    perfs.forEach(perf => {
      if (!grouped[perf.location_id]) {
        grouped[perf.location_id] = [];
      }
      grouped[perf.location_id].push(perf);
    });

    // Sort performances within each stage by time
    Object.keys(grouped).forEach(stageId => {
      grouped[stageId].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  };

  // Helper: Format date display "Friday 8 November 2025"
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  // Helper: Format time based on selected format
  const formatTime = (time24hr) => {
    if (timeFormat === '24hr') {
      return time24hr;
    } else {
      const [hours, minutes] = time24hr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
  };

  // Helper: Convert DD-MM-YYYY to YYYY-MM-DD
  const convertDateFormat = (ddmmyyyy) => {
    const [day, month, year] = ddmmyyyy.split('-');
    return `${year}-${month}-${day}`;
  };

  // Helper: Validate CSV row
  const validateRow = (parts, rowNum, locationNames, hasHeader) => {
    const errors = [];

    if (parts.length !== 4) {
      errors.push(`Row ${rowNum}: Expected 4 columns, got ${parts.length}`);
      return { valid: false, errors };
    }

    const [bandName, stageName, dateStr, timeStr] = parts.map(p => p.trim());

    // Validate band name
    if (!bandName) {
      errors.push(`Row ${rowNum}: Band name is required`);
    }

    // Validate stage exists
    const stageNameLower = stageName.toLowerCase();
    const location = locations.find(loc => loc.name.toLowerCase() === stageNameLower);
    if (!location) {
      errors.push(`Row ${rowNum}: Stage "${stageName}" not found`);
    }

    // Validate date format DD-MM-YYYY
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const dateMatch = dateStr.match(dateRegex);
    if (!dateMatch) {
      errors.push(`Row ${rowNum}: Invalid date "${dateStr}". Use DD-MM-YYYY format`);
    } else {
      const [_, day, month, year] = dateMatch;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);

      if (dayNum < 1 || dayNum > 31) {
        errors.push(`Row ${rowNum}: Day must be between 01-31`);
      }
      if (monthNum < 1 || monthNum > 12) {
        errors.push(`Row ${rowNum}: Month must be between 01-12`);
      }
    }

    // Validate time format HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeStr)) {
      errors.push(`Row ${rowNum}: Invalid time "${timeStr}". Use HH:MM format (00:00-23:59)`);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Return validated data
    const [_, day, month, year] = dateStr.match(dateRegex);
    return {
      valid: true,
      data: {
        band_id: bandName.trim(),
        location_id: location.id,
        locationName: location.name,
        date: `${year}-${month}-${day}`,
        time: timeStr
      }
    };
  };

  // Parse and validate CSV file
  const parseAndValidateCSV = async (file) => {
    try {
      setLoading(true);

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        setMessage('❌ CSV file is empty');
        setLoading(false);
        return;
      }

      // Detect header row
      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes('band') || firstLine.includes('stage');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      if (dataLines.length === 0) {
        setMessage('❌ No data rows found in CSV');
        setLoading(false);
        return;
      }

      const validated = [];
      const allErrors = [];

      dataLines.forEach((line, index) => {
        const rowNum = hasHeader ? index + 2 : index + 1;

        if (!line.trim()) return;

        // Parse CSV (handle quoted values)
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

        const result = validateRow(parts, rowNum, locations, hasHeader);

        if (result.valid) {
          validated.push(result.data);
        } else {
          allErrors.push(...result.errors);
        }
      });

      if (allErrors.length > 0) {
        // Show available stages in error message
        const stageList = locations.map(loc => `• ${loc.name}`).join('\n');
        setMessage(`❌ Import Failed\n\n${allErrors.join('\n')}\n\nAvailable stages:\n${stageList}`);
        setLoading(false);
        return;
      }

      // Generate preview
      const preview = generatePreview(validated);
      setValidatedRows(validated);
      setCsvPreview(preview);
      setShowUploadModal(true);
      setLoading(false);

    } catch (error) {
      console.error('CSV parse error:', error);
      setMessage('❌ Error reading CSV file: ' + error.message);
      setLoading(false);
    }
  };

  // Generate preview statistics
  const generatePreview = (rows) => {
    // Group by date
    const byDate = {};
    rows.forEach(row => {
      if (!byDate[row.date]) {
        byDate[row.date] = [];
      }
      byDate[row.date].push(row);
    });

    // Group by stage
    const byStage = {};
    rows.forEach(row => {
      if (!byStage[row.locationName]) {
        byStage[row.locationName] = 0;
      }
      byStage[row.locationName]++;
    });

    return {
      totalPerformances: rows.length,
      dayBreakdown: Object.entries(byDate).map(([date, perfs]) => ({
        date,
        displayDate: formatDateDisplay(date),
        count: perfs.length
      })).sort((a, b) => a.date.localeCompare(b.date)),
      stageBreakdown: Object.entries(byStage).map(([stage, count]) => ({
        stage,
        count
      })).sort((a, b) => a.stage.localeCompare(b.stage))
    };
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage('❌ Please select a CSV file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setCsvFile(file);
    parseAndValidateCSV(file);
  };

  // Confirm and import CSV
  const handleConfirmImport = async () => {
    try {
      setLoading(true);

      // Delete all existing performances
      const existingPerfs = await db.performances.toArray();
      for (const perf of existingPerfs) {
        await db.performances.delete(perf.id);
      }

      // Add new performances
      for (const perf of validatedRows) {
        await db.performances.add({
          band_id: perf.band_id,
          location_id: perf.location_id,
          date: perf.date,
          time: perf.time
        });
      }

      setMessage(`✓ Schedule imported: ${validatedRows.length} performances added`);
      setTimeout(() => setMessage(''), 5000);

      // Close modal and refresh
      setShowUploadModal(false);
      setCsvFile(null);
      setCsvPreview(null);
      setValidatedRows([]);
      loadSchedule();
      setLoading(false);

    } catch (error) {
      console.error('Import error:', error);
      setMessage('❌ Error importing schedule: ' + error.message);
      setLoading(false);
    }
  };

  // Cancel import
  const handleCancelImport = () => {
    setShowUploadModal(false);
    setCsvFile(null);
    setCsvPreview(null);
    setValidatedRows([]);
  };

  // Toggle day expansion
  const toggleDay = (dateKey) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // Toggle stage expansion
  const toggleStage = (dateKey, stageId) => {
    const key = `${dateKey}-${stageId}`;
    setExpandedStages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle time format
  const toggleTimeFormat = () => {
    setTimeFormat(prev => prev === '24hr' ? '12hr' : '24hr');
  };

  // Get location info by ID
  const getLocationInfo = (locationId) => {
    const location = locations.find(loc => String(loc.id) === String(locationId));
    return location || { name: 'Unknown', color: '#888' };
  };

  // Get unique bands for filter
  const uniqueBands = [...new Set(performances.map(p => p.band_id))].sort();

  // Filter performances by selected band
  const filteredPerformances = bandFilter
    ? performances.filter(p => p.band_id === bandFilter)
    : performances;

  // Group performances for display
  const groupedByDay = groupByDay(filteredPerformances);
  const sortedDates = Object.keys(groupedByDay).sort();

  const styles = {
    message: {
      padding: '16px',
      marginBottom: '20px',
      background: message.includes('Error') || message.includes('Failed')
        ? 'rgba(244, 67, 54, 0.2)'
        : 'rgba(76, 175, 80, 0.2)',
      color: message.includes('Error') || message.includes('Failed')
        ? '#ff6b6b'
        : '#4caf50',
      borderRadius: '6px',
      border: `2px solid ${message.includes('Error') || message.includes('Failed') ? '#f44336' : '#4caf50'}`,
      fontSize: '14px',
      fontWeight: '600',
      whiteSpace: 'pre-line'
    },
    topBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      gap: '10px',
      flexWrap: 'wrap'
    },
    bandFilter: {
      flex: 1,
      minWidth: '150px',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      backgroundColor: '#2d2d2d',
      color: '#e0e0e0'
    },
    timeToggle: {
      padding: '12px 16px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      whiteSpace: 'nowrap'
    },
    uploadButton: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '16px'
    },
    dayHeader: {
      padding: '14px 16px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#2d2d2d',
      borderLeft: '4px solid #ffa500',
      borderRadius: '6px',
      marginBottom: '12px'
    },
    dayTitle: {
      fontSize: '15px',
      color: '#ffa500',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    dayCount: {
      fontSize: '12px',
      color: '#888',
      background: '#1a1a1a',
      padding: '4px 10px',
      borderRadius: '3px'
    },
    dayContent: {
      paddingLeft: '16px',
      marginBottom: '12px'
    },
    stageHeader: (color) => ({
      padding: '12px 16px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#2d2d2d',
      borderLeft: `4px solid ${color}`,
      borderRadius: '4px',
      marginBottom: '8px'
    }),
    stageName: {
      fontSize: '14px',
      color: '#ffa500',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    stageCount: {
      fontSize: '11px',
      color: '#888',
      background: '#1a1a1a',
      padding: '3px 8px',
      borderRadius: '3px'
    },
    stageContent: {
      paddingLeft: '16px',
      marginBottom: '8px'
    },
    performanceItem: {
      padding: '10px 12px',
      background: '#1a1a1a',
      borderRadius: '4px',
      marginBottom: '4px',
      fontSize: '13px',
      color: '#e0e0e0',
      display: 'flex',
      gap: '12px'
    },
    performanceTime: {
      color: '#ffa500',
      fontWeight: '600',
      minWidth: '60px'
    },
    performanceBand: {
      color: '#ccc'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#888'
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '20px'
    },
    emptyTitle: {
      fontSize: '18px',
      color: '#ffa500',
      fontWeight: '700',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    emptyMessage: {
      fontSize: '14px',
      color: '#888',
      marginBottom: '24px',
      lineHeight: '1.6'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalCard: {
      background: '#2d2d2d',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
      border: '2px solid #ffa500'
    },
    modalTitle: {
      fontSize: '18px',
      color: '#ffa500',
      fontWeight: '700',
      marginBottom: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    previewStats: {
      marginBottom: '20px'
    },
    previewSection: {
      marginBottom: '16px',
      padding: '12px',
      background: '#1a1a1a',
      borderRadius: '4px'
    },
    warningBox: {
      padding: '12px',
      background: 'rgba(255, 165, 0, 0.1)',
      border: '2px solid #ffa500',
      borderRadius: '4px',
      color: '#ffa500',
      fontWeight: '600',
      marginTop: '16px'
    },
    modalButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px'
    },
    confirmButton: {
      flex: 1,
      padding: '12px',
      background: '#4caf50',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    cancelButton: {
      flex: 1,
      padding: '12px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    filterResults: {
      marginTop: '20px'
    },
    filterResultsTitle: {
      fontSize: '16px',
      color: '#ffa500',
      fontWeight: '700',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    filterResultItem: {
      padding: '12px',
      background: '#2d2d2d',
      borderRadius: '4px',
      marginBottom: '8px',
      borderLeft: '4px solid #ffa500'
    },
    filterResultDate: {
      fontSize: '14px',
      color: '#e0e0e0',
      fontWeight: '600',
      marginBottom: '4px'
    },
    filterResultDetails: {
      fontSize: '13px',
      color: '#999',
      display: 'flex',
      gap: '12px'
    }
  };

  // Empty state
  if (performances.length === 0) {
    return (
      <div>
        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📅</div>
          <div style={styles.emptyTitle}>No Schedule Available</div>
          <div style={styles.emptyMessage}>
            {canUploadScheduleCSV
              ? 'Upload a CSV file to create the festival schedule.'
              : 'Schedule not yet available. Check back later.'}
          </div>

          {canUploadScheduleCSV && (
            <label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div style={styles.uploadButton}>
                📤 Upload Schedule
              </div>
            </label>
          )}
        </div>

        {/* Preview Modal */}
        {showUploadModal && csvPreview && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={styles.modalTitle}>📋 Schedule Preview</h3>

              <div style={styles.previewStats}>
                <p style={{ color: '#e0e0e0', marginBottom: '16px' }}>
                  {csvPreview.totalPerformances} performances ready to import
                </p>

                <div style={styles.previewSection}>
                  <strong style={{ color: '#ffa500' }}>By Day:</strong>
                  {csvPreview.dayBreakdown.map(day => (
                    <div key={day.date} style={{ color: '#ccc', marginTop: '8px' }}>
                      {day.displayDate}: {day.count} performances
                    </div>
                  ))}
                </div>

                <div style={styles.previewSection}>
                  <strong style={{ color: '#ffa500' }}>By Stage:</strong>
                  {csvPreview.stageBreakdown.map(stage => (
                    <div key={stage.stage} style={{ color: '#ccc', marginTop: '8px' }}>
                      {stage.stage}: {stage.count} performances
                    </div>
                  ))}
                </div>

                <div style={styles.warningBox}>
                  ⚠️ This will DELETE all existing schedule data and replace it.
                </div>
              </div>

              <div style={styles.modalButtons}>
                <button
                  onClick={handleConfirmImport}
                  style={styles.confirmButton}
                  disabled={loading}
                >
                  {loading ? 'Importing...' : '✓ Confirm Import'}
                </button>
                <button
                  onClick={handleCancelImport}
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  ✗ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Band filter view
  if (bandFilter) {
    return (
      <div>
        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.topBar}>
          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            style={styles.bandFilter}
          >
            <option value="">All Bands</option>
            {uniqueBands.map(band => (
              <option key={band} value={band}>{band}</option>
            ))}
          </select>

          <button onClick={toggleTimeFormat} style={styles.timeToggle}>
            🕐 {timeFormat === '24hr' ? '24hr ⇄ 12hr' : '12hr ⇄ 24hr'}
          </button>
        </div>

        {canUploadScheduleCSV && (
          <label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button style={styles.uploadButton} onClick={(e) => e.currentTarget.previousElementSibling.click()}>
              📤 Upload Schedule
            </button>
          </label>
        )}

        <div style={styles.filterResults}>
          <h3 style={styles.filterResultsTitle}>
            Performances by {bandFilter}
          </h3>
          {filteredPerformances
            .sort((a, b) => {
              const dateCompare = a.date.localeCompare(b.date);
              if (dateCompare !== 0) return dateCompare;
              return a.time.localeCompare(b.time);
            })
            .map((perf, index) => {
              const locationInfo = getLocationInfo(perf.location_id);
              return (
                <div key={index} style={styles.filterResultItem}>
                  <div style={styles.filterResultDate}>
                    {formatDateDisplay(perf.date)}
                  </div>
                  <div style={styles.filterResultDetails}>
                    <span style={{ color: locationInfo.color }}>{locationInfo.name}</span>
                    <span style={{ color: '#ffa500' }}>{formatTime(perf.time)}</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Preview Modal */}
        {showUploadModal && csvPreview && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={styles.modalTitle}>📋 Schedule Preview</h3>

              <div style={styles.previewStats}>
                <p style={{ color: '#e0e0e0', marginBottom: '16px' }}>
                  {csvPreview.totalPerformances} performances ready to import
                </p>

                <div style={styles.previewSection}>
                  <strong style={{ color: '#ffa500' }}>By Day:</strong>
                  {csvPreview.dayBreakdown.map(day => (
                    <div key={day.date} style={{ color: '#ccc', marginTop: '8px' }}>
                      {day.displayDate}: {day.count} performances
                    </div>
                  ))}
                </div>

                <div style={styles.previewSection}>
                  <strong style={{ color: '#ffa500' }}>By Stage:</strong>
                  {csvPreview.stageBreakdown.map(stage => (
                    <div key={stage.stage} style={{ color: '#ccc', marginTop: '8px' }}>
                      {stage.stage}: {stage.count} performances
                    </div>
                  ))}
                </div>

                <div style={styles.warningBox}>
                  ⚠️ This will DELETE all existing schedule data and replace it.
                </div>
              </div>

              <div style={styles.modalButtons}>
                <button
                  onClick={handleConfirmImport}
                  style={styles.confirmButton}
                  disabled={loading}
                >
                  {loading ? 'Importing...' : '✓ Confirm Import'}
                </button>
                <button
                  onClick={handleCancelImport}
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  ✗ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main collapsible view
  return (
    <div>
      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.topBar}>
        <select
          value={bandFilter}
          onChange={(e) => setBandFilter(e.target.value)}
          style={styles.bandFilter}
        >
          <option value="">🔍 Find band...</option>
          {uniqueBands.map(band => (
            <option key={band} value={band}>{band}</option>
          ))}
        </select>

        <button onClick={toggleTimeFormat} style={styles.timeToggle}>
          🕐 {timeFormat === '24hr' ? '24hr ⇄ 12hr' : '12hr ⇄ 24hr'}
        </button>
      </div>

      {canUploadScheduleCSV && (
        <label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button style={styles.uploadButton} onClick={(e) => e.currentTarget.previousElementSibling.click()}>
            📤 Upload Schedule
          </button>
        </label>
      )}

      {/* Day → Stage → Performance structure */}
      {sortedDates.map((dateKey, dayIndex) => {
        const dayPerformances = groupedByDay[dateKey];
        const stageGroups = groupByStage(dayPerformances);
        const isExpanded = expandedDays[dateKey];

        return (
          <div key={dateKey}>
            <div
              style={styles.dayHeader}
              onClick={() => toggleDay(dateKey)}
            >
              <div style={styles.dayTitle}>
                <span>{isExpanded ? '▼' : '▶'}</span>
                <span>Day {dayIndex + 1} - {formatDateDisplay(dateKey)}</span>
              </div>
              <span style={styles.dayCount}>({dayPerformances.length})</span>
            </div>

            {isExpanded && (
              <div style={styles.dayContent}>
                {Object.entries(stageGroups).map(([stageId, stagePerformances]) => {
                  const locationInfo = getLocationInfo(stageId);
                  const stageKey = `${dateKey}-${stageId}`;
                  const isStageExpanded = expandedStages[stageKey];

                  return (
                    <div key={stageId}>
                      <div
                        style={styles.stageHeader(locationInfo.color)}
                        onClick={() => toggleStage(dateKey, stageId)}
                      >
                        <div style={styles.stageName}>
                          <span>{isStageExpanded ? '▼' : '▶'}</span>
                          <span>{locationInfo.name}</span>
                        </div>
                        <span style={styles.stageCount}>({stagePerformances.length})</span>
                      </div>

                      {isStageExpanded && (
                        <div style={styles.stageContent}>
                          {stagePerformances.map((perf, index) => (
                            <div key={index} style={styles.performanceItem}>
                              <span style={styles.performanceTime}>
                                {formatTime(perf.time)}
                              </span>
                              <span style={styles.performanceBand}>
                                {perf.band_id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Preview Modal */}
      {showUploadModal && csvPreview && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>📋 Schedule Preview</h3>

            <div style={styles.previewStats}>
              <p style={{ color: '#e0e0e0', marginBottom: '16px' }}>
                {csvPreview.totalPerformances} performances ready to import
              </p>

              <div style={styles.previewSection}>
                <strong style={{ color: '#ffa500' }}>By Day:</strong>
                {csvPreview.dayBreakdown.map(day => (
                  <div key={day.date} style={{ color: '#ccc', marginTop: '8px' }}>
                    {day.displayDate}: {day.count} performances
                  </div>
                ))}
              </div>

              <div style={styles.previewSection}>
                <strong style={{ color: '#ffa500' }}>By Stage:</strong>
                {csvPreview.stageBreakdown.map(stage => (
                  <div key={stage.stage} style={{ color: '#ccc', marginTop: '8px' }}>
                    {stage.stage}: {stage.count} performances
                  </div>
                ))}
              </div>

              <div style={styles.warningBox}>
                ⚠️ This will DELETE all existing schedule data and replace it.
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={handleConfirmImport}
                style={styles.confirmButton}
                disabled={loading}
              >
                {loading ? 'Importing...' : '✓ Confirm Import'}
              </button>
              <button
                onClick={handleCancelImport}
                style={styles.cancelButton}
                disabled={loading}
              >
                ✗ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
