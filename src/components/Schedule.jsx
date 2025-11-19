import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useRole } from '../hooks/useRole';
import { normalizeBandName } from '../utils/bandNormalization';

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

  // Gear modal state
  const [showStageGearModal, setShowStageGearModal] = useState(false);
  const [showBandGearModal, setShowBandGearModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedBand, setSelectedBand] = useState(null);
  const [stageGear, setStageGear] = useState({}); // Changed to object for band grouping
  const [bandGear, setBandGear] = useState([]);
  const [modalLocations, setModalLocations] = useState([]); // Locations for modal status display
  const [expandedStageGearBands, setExpandedStageGearBands] = useState({});

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

    // Refresh every 60 seconds to keep data fresh
    const interval = setInterval(loadSchedule, 60000);

    // Refresh when page gains focus
    const handleFocus = () => {
      loadSchedule();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadSchedule]);

  // Helper: Get gear status/location (matches GearList display logic)
  const getGearStatus = (gear, allLocations) => {
    if (gear.missing_status === 'missing') {
      return 'MISSING ⚠️';
    } else if (gear.in_transit) {
      return 'IN TRANSIT';
    } else if (gear.checked_out) {
      return 'CHECKED OUT';
    } else if (gear.current_location_id) {
      const location = allLocations.find(loc => String(loc.id) === String(gear.current_location_id));
      return location?.name || 'Unknown';
    } else {
      return 'NO LOCATION';
    }
  };

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

    // Validate stage name exists
    if (!stageName) {
      errors.push(`Row ${rowNum}: Stage name is required`);
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
        stageName: stageName,
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

      // Extract unique bands from validated rows
      const bandNames = new Set();
      validatedRows.forEach(row => {
        if (row.band_id && row.band_id.trim()) {
          bandNames.add(row.band_id.trim());
        }
      });

      // Update band registry
      // First, delete existing schedule-sourced bands
      const existingBands = await db.bands.toArray();
      for (const band of existingBands) {
        if (band.source === 'schedule') {
          await db.bands.delete(band.id);
        }
      }

      // Add new bands from schedule
      for (const bandName of Array.from(bandNames)) {
        await db.bands.add({
          name: bandName,
          name_normalized: normalizeBandName(bandName),
          created_at: new Date(),
          source: 'schedule'
        });
      }

      // Extract unique stages from validated rows
      const stageNames = new Set();
      validatedRows.forEach(row => {
        if (row.stageName && row.stageName.trim()) {
          stageNames.add(row.stageName.trim());
        }
      });

      // Update stage/location registry
      // First, delete existing schedule-sourced stages
      const existingLocations = await db.locations.toArray();
      for (const location of existingLocations) {
        if (location.type === 'stage') {
          await db.locations.delete(location.id);
        }
      }

      // Define color palette for auto-created stages
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8'];
      let colorIndex = 0;

      // Create stages from CSV
      const createdStages = [];
      for (const stageName of Array.from(stageNames)) {
        const newId = await db.locations.add({
          name: stageName,
          type: 'stage',
          color: colors[colorIndex % colors.length],
          emoji: ''
        });

        createdStages.push({ name: stageName, id: newId });
        colorIndex++;
      }

      // Reload all locations to get IDs for mapping
      const allLocations = await db.locations.toArray();

      // Map validated rows to include location_id
      const performancesWithLocationIds = validatedRows.map(row => {
        const location = allLocations.find(loc =>
          loc.name.toLowerCase() === row.stageName.toLowerCase()
        );

        return {
          band_id: row.band_id,
          location_id: location.id,
          date: row.date,
          time: row.time
        };
      });

      // Delete all existing performances
      const existingPerfs = await db.performances.toArray();
      for (const perf of existingPerfs) {
        await db.performances.delete(perf.id);
      }

      // Add new performances
      for (const perf of performancesWithLocationIds) {
        await db.performances.add({
          band_id: perf.band_id,
          location_id: perf.location_id,
          date: perf.date,
          time: perf.time
        });
      }

      setMessage(`✓ Schedule imported: ${validatedRows.length} performances from ${bandNames.size} bands across ${stageNames.size} stages`);
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

  // Load gear for a specific stage
  const handleStageClick = async (locationId, locationName) => {
    try {
      console.log('🎸 [STAGE MODAL] Opening stage modal for:', locationName, 'ID:', locationId);

      const allGear = await db.gear.toArray();
      const allLocations = await db.locations.toArray();

      console.log('🎸 [STAGE MODAL] Total gear loaded:', allGear.length);
      console.log('🎸 [STAGE MODAL] All gear locations:', allGear.map(g => ({
        id: g.id,
        desc: g.description,
        band: g.band_id,
        location_id: g.current_location_id
      })));

      // Filter gear: must be at this location AND not have status flags that override location
      const gearAtStage = allGear.filter(g => {
        // Must have this location as current_location_id
        if (String(g.current_location_id) !== String(locationId)) return false;

        // Exclude if status flags override the location
        if (g.missing_status === 'missing') return false;
        if (g.in_transit) return false;
        if (g.checked_out) return false;

        return true;
      });

      console.log('🎸 [STAGE MODAL] Gear at this stage:', gearAtStage.length);
      console.log('🎸 [STAGE MODAL] Filtered gear:', gearAtStage.map(g => ({
        id: g.id,
        desc: g.description,
        band: g.band_id,
        location_id: g.current_location_id,
        in_transit: g.in_transit,
        checked_out: g.checked_out,
        missing: g.missing_status
      })));

      // Group by band
      const groupedByBand = {};
      gearAtStage.forEach(gear => {
        if (!groupedByBand[gear.band_id]) {
          groupedByBand[gear.band_id] = [];
        }
        groupedByBand[gear.band_id].push(gear);
      });

      console.log('🎸 [STAGE MODAL] Grouped by band:', Object.keys(groupedByBand));

      setStageGear(groupedByBand);
      setSelectedStage(locationName);
      setModalLocations(allLocations);
      setShowStageGearModal(true);

      // Initialize all bands as collapsed
      const initialExpanded = {};
      Object.keys(groupedByBand).forEach(band => {
        initialExpanded[band] = false;
      });
      setExpandedStageGearBands(initialExpanded);
    } catch (error) {
      console.error('Error loading stage gear:', error);
    }
  };

  // Load gear for a specific band
  const handleBandClick = async (bandName) => {
    try {
      console.log('🎤 [BAND MODAL] Opening band modal for:', bandName);

      const allGear = await db.gear.toArray();
      const allLocations = await db.locations.toArray();

      console.log('🎤 [BAND MODAL] Total gear loaded:', allGear.length);
      console.log('🎤 [BAND MODAL] Total locations loaded:', allLocations.length);
      console.log('🎤 [BAND MODAL] Available locations:', allLocations.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type
      })));

      // Find gear for this band (using normalized matching)
      const normalizedBandName = normalizeBandName(bandName);
      console.log('🎤 [BAND MODAL] Normalized band name:', normalizedBandName);

      const gearForBand = allGear.filter(g =>
        normalizeBandName(g.band_id) === normalizedBandName
      );
      console.log('🎤 [BAND MODAL] Gear found for band:', gearForBand.length);
      console.log('🎤 [BAND MODAL] Raw gear data:', gearForBand.map(g => ({
        id: g.id,
        desc: g.description,
        current_location_id: g.current_location_id,
        in_transit: g.in_transit,
        checked_out: g.checked_out,
        missing_status: g.missing_status
      })));

      console.log('🎤 [BAND MODAL] Gear statuses:', gearForBand.map(g => ({
        id: g.id,
        status: getGearStatus(g, allLocations)
      })));

      setBandGear(gearForBand);
      setSelectedBand(bandName);
      setModalLocations(allLocations);
      setShowBandGearModal(true);
    } catch (error) {
      console.error('Error loading band gear:', error);
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
    stageContent: {
      paddingLeft: '16px',
      marginBottom: '8px'
    },
    performanceItem: {
      padding: '10px 12px',
      background: '#1a1a1a',
      borderRadius: '4px',
      marginBottom: '4px',
      fontSize: '16px',
      color: '#e0e0e0',
      display: 'flex',
      gap: '12px'
    },
    performanceTime: {
      color: '#ffa500',
      fontWeight: '600',
      minWidth: '70px',
      fontSize: '16px'
    },
    performanceBand: {
      color: '#ccc',
      fontSize: '18px'
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
                      >
                        <div
                          style={{ ...styles.stageName, flex: 1, cursor: 'pointer' }}
                          onClick={() => toggleStage(dateKey, stageId)}
                        >
                          <span>{isStageExpanded ? '▼' : '▶'}</span>
                          <span>{locationInfo.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageClick(stageId, locationInfo.name);
                          }}
                          style={{
                            background: 'rgba(255, 165, 0, 0.2)',
                            border: '1px solid #ffa500',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: '#ffa500',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          🎸 Gear
                        </button>
                      </div>

                      {isStageExpanded && (
                        <div style={styles.stageContent}>
                          {stagePerformances.map((perf, index) => (
                            <div key={index} style={styles.performanceItem}>
                              <span style={styles.performanceTime}>
                                {formatTime(perf.time)}
                              </span>
                              <span
                                style={{
                                  ...styles.performanceBand,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textDecorationColor: 'rgba(255, 165, 0, 0.4)',
                                  textUnderlineOffset: '2px'
                                }}
                                onClick={() => handleBandClick(perf.band_id)}
                              >
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

      {/* Upload Schedule Button at Bottom */}
      {canUploadScheduleCSV && (
        <label style={{ display: 'block', marginTop: '24px' }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button style={{...styles.uploadButton, width: '100%'}} onClick={(e) => e.currentTarget.previousElementSibling.click()}>
            📤 Upload Schedule
          </button>
        </label>
      )}

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

      {/* Stage Gear Modal */}
      {showStageGearModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setShowStageGearModal(false)}
        >
          <div
            style={{
              background: '#2d2d2d',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '2px solid #ffa500'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #3a3a3a'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffa500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Gear at {selectedStage}
              </h3>
            </div>

            {Object.keys(stageGear).length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '14px'
              }}>
                No gear currently at this location
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#e0e0e0',
                  marginBottom: '16px',
                  fontWeight: '600'
                }}>
                  {Object.keys(stageGear).length} band(s), {Object.values(stageGear).flat().length} item(s) total:
                </div>

                {Object.entries(stageGear).map(([bandName, gearItems]) => {
                  const isExpanded = expandedStageGearBands[bandName];
                  return (
                    <div key={bandName} style={{ marginBottom: '12px' }}>
                      {/* Band Header */}
                      <div
                        onClick={() => {
                          setExpandedStageGearBands(prev => ({
                            ...prev,
                            [bandName]: !prev[bandName]
                          }));
                        }}
                        style={{
                          padding: '12px',
                          background: '#1a1a1a',
                          borderRadius: '8px',
                          border: '2px solid #3a3a3a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ffa500';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#3a3a3a';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#ffa500', fontSize: '14px' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ffa500'
                          }}>
                            {bandName}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: '#888',
                          fontWeight: '600'
                        }}>
                          ({gearItems.length} item{gearItems.length !== 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Expanded Gear Items */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '8px',
                          marginLeft: '16px',
                          paddingLeft: '12px',
                          borderLeft: '2px solid #3a3a3a'
                        }}>
                          {gearItems.map((gear) => (
                            <div
                              key={gear.id}
                              style={{
                                padding: '8px 12px',
                                marginBottom: '6px',
                                background: '#2d2d2d',
                                borderRadius: '6px',
                                border: '1px solid #3a3a3a',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '13px',
                                  color: '#e0e0e0',
                                  marginBottom: '2px'
                                }}>
                                  {gear.description}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#666'
                                }}>
                                  ID: {gear.id}
                                </div>
                              </div>
                              <div style={{
                                padding: '4px 8px',
                                background: 'rgba(255, 165, 0, 0.2)',
                                border: '1px solid #ffa500',
                                borderRadius: '4px',
                                fontSize: '10px',
                                color: '#ffa500',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}>
                                📍 {getGearStatus(gear, modalLocations)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowStageGearModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '20px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Band Gear Modal */}
      {showBandGearModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setShowBandGearModal(false)}
        >
          <div
            style={{
              background: '#2d2d2d',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '2px solid #ffa500'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #3a3a3a'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffa500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {selectedBand}'s Gear
              </h3>
            </div>

            {bandGear.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '14px'
              }}>
                No gear registered for this band
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#e0e0e0',
                  marginBottom: '16px',
                  fontWeight: '600'
                }}>
                  {bandGear.length} item(s) registered:
                </div>
                {bandGear.map((gear) => (
                  <div
                    key={gear.id}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                      border: '1px solid #3a3a3a',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#e0e0e0',
                        marginBottom: '4px'
                      }}>
                        {gear.description}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        ID: {gear.id}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      background: 'rgba(255, 165, 0, 0.2)',
                      border: '1px solid #ffa500',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#ffa500',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      📍 {getGearStatus(gear, modalLocations)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowBandGearModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '20px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
