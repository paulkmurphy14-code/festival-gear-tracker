import { useState } from 'react';

export default function StowageGrid({
  container,
  stowageItems = [],
  gear = [],
  onCellClick,
  readonly = false,
  mini = false
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isRotated, setIsRotated] = useState(false);

  if (!container) return null;

  const { length, width } = container;

  // When rotated, swap dimensions
  const gridWidth = isRotated ? length : width;
  const gridLength = isRotated ? width : length;

  // Calculate responsive cell size to prevent horizontal scrolling
  const calculateCellSize = () => {
    if (mini) return 15; // Smaller for mini grids

    // For full grids, scale down if necessary to fit viewport
    if (typeof window !== 'undefined') {
      const maxWidth = window.innerWidth - 80; // Account for padding/margins
      const idealCellSize = 40;
      const currentGridWidth = gridWidth * idealCellSize;

      if (currentGridWidth > maxWidth) {
        // Scale down to fit, but not smaller than 20px
        return Math.max(20, Math.floor(maxWidth / gridWidth));
      }
    }
    return 40;
  };

  const cellSize = calculateCellSize();

  const containerHeight = container.container_height || 3;

  // Filter items by current layer and create a map of occupied cells
  const occupiedCells = {};
  const cellStacking = {}; // Track how many layers have items at each (x,y)

  stowageItems.forEach(item => {
    const itemLayer = item.z || 0;
    const itemHeight = item.item_height || 1;

    // Check if this item occupies the current layer
    const occupiesCurrentLayer = itemLayer <= currentLayer && (itemLayer + itemHeight) > currentLayer;

    for (let x = item.x; x < item.x + item.width; x++) {
      for (let y = item.y; y < item.y + item.height; y++) {
        // Transform coordinates if rotated (swap x and y)
        const displayX = isRotated ? y : x;
        const displayY = isRotated ? x : y;
        const key = `${displayX},${displayY}`;

        // Track stacking for visual indicator
        if (!cellStacking[key]) cellStacking[key] = [];
        cellStacking[key].push(item);

        // Only show item on current layer
        if (occupiesCurrentLayer) {
          occupiedCells[key] = item;
        }
      }
    }
  });

  const getGearInfo = (gearId) => {
    return gear.find(g => g.id === gearId);
  };

  const getCellColor = (x, y) => {
    const key = `${x},${y}`;
    const item = occupiedCells[key];

    if (!item) return '#1a1a1a'; // Empty cell

    const gearItem = getGearInfo(item.gear_id);
    if (!gearItem) return '#444';

    // Use band color if available, otherwise default
    const bandColors = {
      'The Script': '#e74c3c',
      'Script': '#e74c3c',
      'Default': '#3498db'
    };

    return bandColors[gearItem.band_id] || '#ffa500';
  };

  const handleCellClick = (displayX, displayY) => {
    if (readonly || !onCellClick) return;

    const key = `${displayX},${displayY}`;
    const existingItem = occupiedCells[key];

    // Transform coordinates back to original if rotated
    const actualX = isRotated ? displayY : displayX;
    const actualY = isRotated ? displayX : displayY;

    onCellClick(actualX, actualY, existingItem);
  };

  const styles = {
    gridContainer: {
      display: 'inline-block',
      padding: mini ? '4px' : '12px',
      background: '#2d2d2d',
      borderRadius: mini ? '4px' : '8px',
      border: mini ? '1px solid #664400' : '2px solid #ffa500',
      position: 'relative'
    },
    axis: {
      position: 'absolute',
      fontSize: mini ? '8px' : '10px',
      color: '#888',
      fontWeight: '600'
    },
    axisHorizontal: {
      top: mini ? '-12px' : '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    axisVertical: {
      left: mini ? '-12px' : '-20px',
      top: '50%',
      transform: 'translateY(-50%) rotate(-90deg)',
      transformOrigin: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
      gridTemplateRows: `repeat(${gridLength}, ${cellSize}px)`,
      gap: mini ? '1px' : '2px',
      marginTop: mini ? '8px' : '24px'
    },
    cell: (x, y) => ({
      width: cellSize,
      height: cellSize,
      background: getCellColor(x, y),
      border: `1px solid ${hoveredCell === `${x},${y}` ? '#ffa500' : '#444'}`,
      cursor: readonly ? 'default' : 'pointer',
      transition: 'all 0.2s',
      borderRadius: mini ? '1px' : '2px',
      opacity: hoveredCell === `${x},${y}` ? 0.8 : 1
    }),
    tooltip: {
      position: 'absolute',
      bottom: mini ? '-40px' : '-60px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1a1a1a',
      color: '#ffa500',
      padding: mini ? '4px 8px' : '8px 12px',
      borderRadius: '4px',
      border: '2px solid #ffa500',
      fontSize: mini ? '10px' : '12px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10
    }
  };

  const hoveredItem = hoveredCell ? occupiedCells[hoveredCell] : null;
  const hoveredGear = hoveredItem ? getGearInfo(hoveredItem.gear_id) : null;

  return (
    <div style={styles.gridContainer}>
      {!mini && (
        <>
          {/* Rotation Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <button
              onClick={() => setIsRotated(!isRotated)}
              style={{
                padding: '8px 16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}
            >
              🔄 Rotate View
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '12px', color: '#ffa500', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
            {isRotated ? 'Left Side' : 'Front'}
          </div>

          {/* Layer Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {Array.from({ length: containerHeight }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentLayer(i)}
                style={{
                  padding: '8px 16px',
                  background: currentLayer === i ? '#ffa500' : '#2d2d2d',
                  color: currentLayer === i ? '#1a1a1a' : '#888',
                  border: currentLayer === i ? 'none' : '2px solid #444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}
              >
                {i === 0 ? 'Ground' : `Layer ${i}`}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
            {isRotated
              ? `Length: ${length} cells${container.real_length ? ` (${container.real_length}ft)` : ''} • Width: ${width} cells${container.real_width ? ` (${container.real_width}ft)` : ''}`
              : `Width: ${width} cells${container.real_width ? ` (${container.real_width}ft)` : ''} • Length: ${length} cells${container.real_length ? ` (${container.real_length}ft)` : ''}`
            }
          </div>
        </>
      )}

      <div style={styles.grid}>
        {Array.from({ length: gridLength }, (_, y) =>
          Array.from({ length: gridWidth }, (_, x) => {
            const key = `${x},${y}`;
            const hasStacking = cellStacking[key] && cellStacking[key].length > 1;

            return (
              <div
                key={key}
                style={{
                  ...styles.cell(x, y),
                  position: 'relative',
                  boxShadow: hasStacking ? `inset 0 0 0 2px ${currentLayer === 0 ? '#ffa500' : '#888'}` : 'none'
                }}
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={() => !mini && setHoveredCell(key)}
                onMouseLeave={() => !mini && setHoveredCell(null)}
              >
                {hasStacking && !mini && (
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    fontSize: '10px',
                    color: '#ffa500',
                    fontWeight: '700'
                  }}>
                    {cellStacking[key].length}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!mini && (
        <div style={{ textAlign: 'center', marginTop: '12px', color: '#ffa500', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
          {isRotated ? 'Right Side' : 'Back'}
        </div>
      )}

      {!mini && hoveredGear && (
        <div style={styles.tooltip}>
          {hoveredGear.description} (#{String(hoveredGear.display_id || '0000').padStart(4, '0')})
          <br />
          {hoveredItem.width}×{hoveredItem.height} cells
        </div>
      )}
    </div>
  );
}
