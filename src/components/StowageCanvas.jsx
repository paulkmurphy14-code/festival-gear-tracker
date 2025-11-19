import { useState, useRef, useEffect } from 'react';

export default function StowageCanvas({
  container,
  stowageItems = [],
  gear = [],
  onItemMove,
  onItemDelete,
  onStagedDrop,
  stagedItems = [],
  touchDragItem = null,
  onTouchDragComplete,
  readonly = false
}) {
  const canvasRef = useRef(null);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [contextMenuItem, setContextMenuItem] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  if (!container) return null;

  const containerHeight = container.container_height || 3;
  const { length, width } = container;

  // Calculate canvas dimensions - responsive for mobile and desktop
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        // Use available viewport width
        const viewportWidth = window.innerWidth;
        const maxWidth = Math.min(viewportWidth - 40, 800); // Max 800px, min 40px margin
        const maxHeight = window.innerHeight - 400; // Leave room for controls

        // Maintain aspect ratio but ensure minimum sizes
        const canvasWidth = Math.max(maxWidth, 300);
        const canvasHeight = Math.max(maxHeight, 400);

        setCanvasDimensions({ width: canvasWidth, height: canvasHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [length, width]);

  // Show all items (no layer filtering for simplicity)
  const visibleItems = stowageItems;

  // Get gear info for an item
  const getGearInfo = (gearId) => {
    return gear.find(g => g.id === gearId);
  };

  // Get band initials
  const getBandInitials = (bandId) => {
    if (!bandId) return '??';
    return bandId.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
  };

  // Get band color - auto-assign distinct colors to different bands
  const getBandColor = (bandId) => {
    // Vibrant color palette for easy visual distinction
    const colorPalette = [
      '#e74c3c', // Red
      '#3498db', // Blue
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Turquoise
      '#e67e22', // Dark Orange
      '#16a085', // Dark Turquoise
      '#c0392b', // Dark Red
      '#8e44ad', // Dark Purple
      '#27ae60', // Dark Green
      '#2980b9', // Dark Blue
      '#f1c40f', // Yellow
      '#d35400', // Pumpkin
      '#c0392b'  // Crimson
    ];

    // Generate consistent color index from band name
    const hash = bandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colorPalette.length;

    return colorPalette[colorIndex];
  };

  // Convert percentage position to pixels
  // Canvas: width=horizontal, height=vertical
  // Container: width=horizontal dimension (ft), length=vertical dimension (ft)
  const percentToPixels = (xPercent, yPercent, itemWidth, itemLength) => {
    return {
      x: (xPercent / 100) * canvasDimensions.width,
      y: (yPercent / 100) * canvasDimensions.height,
      width: (itemWidth / width) * canvasDimensions.width, // Item width in ft / container width in ft
      height: (itemLength / length) * canvasDimensions.height // Item length in ft / container length in ft
    };
  };

  // Convert pixels to percentage
  const pixelsToPercent = (x, y) => {
    return {
      xPercent: (x / canvasDimensions.width) * 100,
      yPercent: (y / canvasDimensions.height) * 100
    };
  };

  const handleMouseDown = (e, item) => {
    if (readonly) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const itemPos = percentToPixels(item.x_position, item.y_position, item.item_width, item.item_length);

    setDraggingItem(item);
    setDragOffset({
      x: mouseX - itemPos.x,
      y: mouseY - itemPos.y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingItem || readonly) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;

    // Constrain to canvas bounds
    const maxX = canvasDimensions.width - (draggingItem.item_width / width) * canvasDimensions.width;
    const maxY = canvasDimensions.height - (draggingItem.item_length / length) * canvasDimensions.height;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    const { xPercent, yPercent } = pixelsToPercent(constrainedX, constrainedY);

    // Update dragging item position temporarily
    setDraggingItem({ ...draggingItem, x_position: xPercent, y_position: yPercent });
  };

  const handleMouseUp = () => {
    if (draggingItem && onItemMove) {
      onItemMove(draggingItem.id, {
        x_position: draggingItem.x_position,
        y_position: draggingItem.y_position
      });
    }
    setDraggingItem(null);
  };

  // Touch handlers for moving items on mobile
  const handleTouchStartItem = (e, item) => {
    if (readonly) return;

    e.stopPropagation(); // Prevent canvas touch handlers from interfering

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const itemPos = percentToPixels(item.x_position, item.y_position, item.item_width, item.item_length);

    setDraggingItem(item);
    setDragOffset({
      x: touchX - itemPos.x,
      y: touchY - itemPos.y
    });
  };

  const handleTouchMoveItem = (e) => {
    if (!draggingItem || readonly) return;

    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const newX = touchX - dragOffset.x;
    const newY = touchY - dragOffset.y;

    // Constrain to canvas bounds
    const maxX = canvasDimensions.width - (draggingItem.item_width / width) * canvasDimensions.width;
    const maxY = canvasDimensions.height - (draggingItem.item_length / length) * canvasDimensions.height;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    const { xPercent, yPercent } = pixelsToPercent(constrainedX, constrainedY);

    // Update dragging item position temporarily
    setDraggingItem({ ...draggingItem, x_position: xPercent, y_position: yPercent });
  };

  const handleTouchEndItem = () => {
    if (draggingItem && onItemMove) {
      onItemMove(draggingItem.id, {
        x_position: draggingItem.x_position,
        y_position: draggingItem.y_position
      });
    }
    setDraggingItem(null);
  };

  const handleItemDelete = (item, e) => {
    e.stopPropagation();
    if (onItemDelete && window.confirm('Remove this item from the container?')) {
      onItemDelete(item);
    }
  };

  const handleContextMenu = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (readonly) return;

    setContextMenuItem(item);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleBringToFront = () => {
    if (!contextMenuItem || !onItemMove) return;

    // Find max z-index
    const maxZ = Math.max(...visibleItems.map(i => i.z || 0), 0);

    // Update this item to be on top
    onItemMove(contextMenuItem.id, { z: maxZ + 1 });
    setContextMenuItem(null);
  };

  const handleSendToBack = () => {
    if (!contextMenuItem || !onItemMove) return;

    // Find min z-index
    const minZ = Math.min(...visibleItems.map(i => i.z || 0), 0);

    // Update this item to be on bottom
    onItemMove(contextMenuItem.id, { z: minZ - 1 });
    setContextMenuItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (readonly || !onStagedDrop) return;

    // Accept both staged items and direct drag from gear list
    const stagedGearId = e.dataTransfer.getData('staged_gear_id');
    const directGearId = e.dataTransfer.getData('direct_gear_id');
    const gearId = stagedGearId || directGearId;

    if (!gearId) return;

    // Find gear item from staged items or full gear list
    const gearItem = stagedItems.find(item => item.id === gearId)
                     || gear.find(g => g.id === gearId);
    if (!gearItem) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;

    const { xPercent, yPercent } = pixelsToPercent(dropX, dropY);

    onStagedDrop(gearItem, { xPercent, yPercent });
  };

  // Touch drop handler for mobile
  const handleTouchEnd = (e) => {
    if (readonly || !onStagedDrop || !touchDragItem) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = canvasRef.current.getBoundingClientRect();

    // Check if touch ended over canvas
    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {

      const dropX = touch.clientX - rect.left;
      const dropY = touch.clientY - rect.top;

      const { xPercent, yPercent } = pixelsToPercent(dropX, dropY);

      onStagedDrop(touchDragItem, { xPercent, yPercent });
    }

    // Clean up
    if (onTouchDragComplete) {
      onTouchDragComplete();
    }
  };


  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px'
    },
    layerSelector: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    layerButton: (isActive) => ({
      padding: '10px 16px',
      background: isActive ? '#ffa500' : '#2d2d2d',
      color: isActive ? '#1a1a1a' : '#888',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
    }),
    canvasWrapper: {
      position: 'relative',
      borderRadius: '8px',
      padding: '12px'
    },
    canvas: {
      position: 'relative',
      background: '#1a1a1a',
      border: '2px solid #444',
      borderRadius: '8px',
      cursor: draggingItem ? 'grabbing' : 'default',
      userSelect: 'none'
    },
    label: {
      position: 'absolute',
      fontSize: '12px',
      color: '#888',
      fontWeight: '600'
    },
    item: (itemPos, isBeingDragged) => ({
      position: 'absolute',
      left: `${itemPos.x}px`,
      top: `${itemPos.y}px`,
      width: `${itemPos.width}px`,
      height: `${itemPos.height}px`,
      border: '2px solid #000',
      borderRadius: '4px',
      cursor: readonly ? 'default' : 'grab',
      transition: isBeingDragged ? 'none' : 'all 0.2s',
      opacity: isBeingDragged ? 0.8 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }),
    itemLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#000',
      textAlign: 'center',
      padding: '4px',
      textShadow: '0 1px 2px rgba(255,255,255,0.5)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: '100%'
    }
  };

  return (
    <div style={styles.container}>
      {/* Canvas */}
      <div style={styles.canvasWrapper}>
        <div
          ref={canvasRef}
          data-stowage-canvas="true"
          style={{
            ...styles.canvas,
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTouchEnd={handleTouchEnd}
        >
          {/* Simplified labels for mobile */}
          <div style={{ ...styles.label, top: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px' }}>
            FRONT
          </div>
          <div style={{ ...styles.label, bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px' }}>
            BACK
          </div>

          {/* Empty state message */}
          {visibleItems.length === 0 && !readonly && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#666',
              fontSize: '13px',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontWeight: '600' }}>
                Drag items here
              </div>
            </div>
          )}

          {/* Render items as simple cards - sorted by z-index */}
          {visibleItems
            .sort((a, b) => (a.z || 0) - (b.z || 0)) // Bottom to top
            .map((item, index) => {
            const gearItem = getGearInfo(item.gear_id);
            if (!gearItem) return null;

            const displayItem = draggingItem?.id === item.id ? draggingItem : item;
            const itemPos = percentToPixels(
              displayItem.x_position,
              displayItem.y_position,
              displayItem.item_width,
              displayItem.item_length
            );
            const bandColor = getBandColor(gearItem.band_id);
            const bandInitials = getBandInitials(gearItem.band_id);

            // Count items at this position (including this one) - tighter tolerance for true stacking
            const stackedItems = visibleItems.filter(otherItem => {
              const xOverlap = Math.abs(otherItem.x_position - item.x_position) < 5; // Much tighter: 5% tolerance
              const yOverlap = Math.abs(otherItem.y_position - item.y_position) < 5;
              return xOverlap && yOverlap;
            });
            const stackCount = stackedItems.length;
            const isStacked = stackCount > 1;

            const isHovered = hoveredItem?.id === item.id;

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${itemPos.x}px`,
                  top: `${itemPos.y}px`,
                  width: '50px',
                  height: '50px',
                  background: bandColor,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  cursor: readonly ? 'default' : 'grab',
                  transition: draggingItem?.id === item.id ? 'none' : 'all 0.2s',
                  opacity: draggingItem?.id === item.id ? 0.8 : 1,
                  border: '3px solid #000',
                  boxShadow: isStacked
                    ? '4px 4px 0 rgba(0,0,0,0.3), 8px 8px 0 rgba(0,0,0,0.2)'
                    : '3px 3px 6px rgba(0,0,0,0.3)',
                  touchAction: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, item)}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                onContextMenu={(e) => handleContextMenu(item, e)}
                onTouchStart={(e) => handleTouchStartItem(e, item)}
                onTouchMove={handleTouchMoveItem}
                onTouchEnd={handleTouchEndItem}
                title={gearItem.description}
              >
                {bandInitials}

                {/* Stack count badge */}
                {isStacked && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      right: '-6px',
                      width: '24px',
                      height: '24px',
                      background: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#1a1a1a',
                      border: '2px solid #000',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                    title={`${stackCount} items stacked here`}
                  >
                    {stackCount}
                  </div>
                )}

                {/* Delete button on hover */}
                {isHovered && !readonly && onItemDelete && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      background: '#ff6b6b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#fff',
                      fontWeight: '700',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                    onClick={(e) => handleItemDelete(item, e)}
                    title="Remove item"
                  >
                    ×
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuItem && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998
            }}
            onClick={() => setContextMenuItem(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: `${contextMenuPos.x}px`,
              top: `${contextMenuPos.y}px`,
              background: '#1a1a1a',
              border: '2px solid #ffa500',
              borderRadius: '6px',
              padding: '8px',
              zIndex: 9999,
              minWidth: '150px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                color: '#e0e0e0',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d2d'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={handleBringToFront}
            >
              ⬆️ Bring to Front
            </div>
            <div
              style={{
                padding: '10px 12px',
                color: '#e0e0e0',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d2d'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={handleSendToBack}
            >
              ⬇️ Send to Back
            </div>
          </div>
        </>
      )}

      {readonly && (
        <div style={{ textAlign: 'center', marginTop: '16px', color: '#888', fontSize: '14px' }}>
          View only - Contact an admin to edit
        </div>
      )}
    </div>
  );
}
