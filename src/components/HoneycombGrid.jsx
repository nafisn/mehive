// Import toBlob for export functionality
import { toBlob } from 'html-to-image';
import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import Draggable from 'react-draggable';
import Hexagon from './Hexagon';
import styles from './HoneycombGrid.module.css';

// Hexagon Geometry Constants
const HEX_WIDTH = 200;
const HEX_HEIGHT = 220;
const GAP = 15; // Consistent gap between hexagons

const GRID_X_STEP = HEX_WIDTH + GAP;
const GRID_Y_STEP = (HEX_HEIGHT * 0.75) + GAP;

// Helper to convert Axial (q, r) to Pixel (x, y)
// Using stretched grid logic to match visual dimensions + gap
const hexToPixel = (q, r) => {
    const x = GRID_X_STEP * (q + r / 2);
    const y = GRID_Y_STEP * r;
    return { x, y };
};

// Helper to convert Pixel (x, y) to Axial (q, r) - Rounded
const pixelToHex = (x, y) => {
    const r = y / GRID_Y_STEP;
    const q = (x / GRID_X_STEP) - (r / 2);
    return hexRound(q, r);
};

const hexRound = (q, r) => {
    let s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const q_diff = Math.abs(rq - q);
    const r_diff = Math.abs(rr - r);
    const s_diff = Math.abs(rs - s);

    if (q_diff > r_diff && q_diff > s_diff) {
        rq = -rr - rs;
    } else if (r_diff > s_diff) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
};

// Separate component to handle the ref for Draggable
const DraggableHexagon = ({ item, index, isCenter, position, onStop, onHexagonClick, style }) => {
    const nodeRef = useRef(null);
    const id = isCenter ? 'center' : item.id;

    return (
        <Draggable
            nodeRef={nodeRef}
            position={position}
            onStop={(e, data) => onStop(e, data, id)}
            grid={[1, 1]}
        >
            <div
                ref={nodeRef}
                className="hexagon-item"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    ...style // Apply animation delay here
                }}
            >
                <div style={{ transform: 'translate(-50%, -50%)' }}>
                    <Hexagon
                        {...item}
                        isCenter={isCenter}
                        onDoubleClick={() => onHexagonClick(item)}
                    // Removed className={styles.draggableHex} to avoid conflict
                    />
                </div>
            </div>
        </Draggable>
    );
};

const HoneycombGrid = forwardRef(({ items, centerItem, onHexagonClick }, ref) => {
    // State to track positions: { [id]: { x, y, q, r } }
    // Initialize with center node at 0,0,0
    const [positions, setPositions] = useState({
        'center': { x: 0, y: 0, q: 0, r: 0 }
    });

    const [errorMsg, setErrorMsg] = useState(null);

    // Grid Bounds (approximate for now, can be expanded)
    const BOUNDS = {
        minQ: -5, maxQ: 5,
        minR: -5, maxR: 5
    };

    const isOccupied = (q, r, currentId) => {
        return Object.entries(positions).some(([id, pos]) => {
            if (id === currentId) return false;
            return pos.q === q && pos.r === r;
        });
    };

    const isConnected = (q, r, currentId) => {
        // Center node is the anchor
        if (q === 0 && r === 0) return true;

        // Check neighbors
        const neighbors = [
            { dq: 1, dr: 0 }, { dq: -1, dr: 0 },
            { dq: 0, dr: 1 }, { dq: 0, dr: -1 },
            { dq: 1, dr: -1 }, { dq: -1, dr: 1 }
        ];

        return neighbors.some(({ dq, dr }) => {
            const nQ = q + dq;
            const nR = r + dr;
            // Check if any neighbor is occupied by another node
            return Object.entries(positions).some(([id, pos]) => {
                if (id === currentId) return false;
                return pos.q === nQ && pos.r === nR;
            });
        });
    };

    const handleStop = (e, data, id) => {
        // 1. Calculate raw grid coordinates from pixels
        // We use the data.x/y which are relative to the grid origin
        const raw = pixelToHex(data.x, data.y);

        // 2. Get current position to check if it actually changed
        const currentPos = positions[id];

        // Optimization: If position hasn't changed in grid terms, do nothing
        if (currentPos && currentPos.q === raw.q && currentPos.r === raw.r) {
            return;
        }

        // 3. Validation Checks
        setErrorMsg(null);

        // Check Bounds
        if (raw.q < BOUNDS.minQ || raw.q > BOUNDS.maxQ || raw.r < BOUNDS.minR || raw.r > BOUNDS.maxR) {
            setErrorMsg("Out of bounds!");
            return; // Snap back happens automatically if we don't update state
        }

        // Check Overlap
        if (isOccupied(raw.q, raw.r, id)) {
            setErrorMsg("Cannot overlap with another hexagon!");
            return;
        }

        // Check Connectivity (Must touch at least one other node, unless it's the only one or center)
        // For this app, everything must connect to the hive (which starts at center)
        if (id !== 'center' && !isConnected(raw.q, raw.r, id)) {
            setErrorMsg("Must connect to the hive!");
            return;
        }

        // 4. Update State if Valid
        const newPixel = hexToPixel(raw.q, raw.r);
        setPositions(prev => ({
            ...prev,
            [id]: { x: newPixel.x, y: newPixel.y, q: raw.q, r: raw.r }
        }));
    };

    useImperativeHandle(ref, () => ({
        exportGrid: async () => {
            const element = document.getElementById('honeycomb-grid-container');
            const gridOrigin = element.querySelector(`.${styles.gridOrigin}`);

            if (!element || !gridOrigin) {
                alert("Grid container not found!");
                return;
            }

            try {
                // 1. Calculate Bounding Box based on Logical Positions (Source of Truth)
                const allPositions = Object.values(positions);
                if (allPositions.length === 0) throw new Error("No hexagons to export.");

                const halfW = HEX_WIDTH / 2;
                const halfH = HEX_HEIGHT / 2;

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                allPositions.forEach(pos => {
                    if (pos.x - halfW < minX) minX = pos.x - halfW;
                    if (pos.x + halfW > maxX) maxX = pos.x + halfW;
                    if (pos.y - halfH < minY) minY = pos.y - halfH;
                    if (pos.y + halfH > maxY) maxY = pos.y + halfH;
                });

                // 2. Add Padding
                const PADDING = 60;
                const cropWidth = maxX - minX + (PADDING * 2);
                const cropHeight = maxY - minY + (PADDING * 2);

                // 3. Calculate Center Shift
                // We want the center of the bounding box to be at the center of the captured image.
                // The captured image center will be at (0,0) relative to gridOrigin (since gridOrigin is centered).
                // The bounding box center is at ((minX + maxX)/2, (minY + maxY)/2).
                // We need to shift gridOrigin so that the bounding box center moves to (0,0).
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                // 4. Apply Temporary Transform
                const originalTransform = gridOrigin.style.transform;
                // We must subtract the center offset to bring it to (0,0)
                gridOrigin.style.transform = `translate(${-centerX}px, ${-centerY}px)`;

                // 5. Capture
                const blob = await toBlob(element, {
                    backgroundColor: '#242424',
                    width: cropWidth,
                    height: cropHeight,
                    style: {
                        // Force the container to match the crop size
                        width: `${cropWidth}px`,
                        height: `${cropHeight}px`,
                        // Ensure gridOrigin stays centered in this new "viewport"
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'visible'
                    },
                    cacheBust: true,
                    filter: (node) => {
                        return !node.innerText || !node.innerText.includes('Cannot place');
                    }
                });

                // 6. Restore Transform
                gridOrigin.style.transform = originalTransform;

                if (!blob) throw new Error("Export failed: Blob is null");

                const dataUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'MeHive-Year.png';
                link.href = dataUrl;
                link.click();
                setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);

            } catch (err) {
                console.error('Export failed:', err);
                // Ensure transform is restored even if error
                if (gridOrigin) gridOrigin.style.transform = '';
                alert("Export failed: " + err.message);
            }
        }
    }));

    // ... (rest of component: useState init, getPosition, return JSX)
    // Ensure to close the component correctly

    // Dynamic Layout Management
    React.useEffect(() => {
        setPositions(prevPositions => {
            const newPositions = { ...prevPositions };

            // 1. Remove positions for deleted items
            Object.keys(newPositions).forEach(key => {
                if (key !== 'center' && !items.find(i => i.id === parseInt(key))) {
                    delete newPositions[key];
                }
            });

            // 2. Add positions for new items
            items.forEach(item => {
                if (!newPositions[item.id]) {
                    // Find next available spot using spiral algorithm
                    let q = 0, r = 0;
                    let layer = 1;
                    let found = false;

                    // Simple spiral search
                    while (!found && layer < 10) {
                        let dq = 0, dr = -1; // Start direction
                        for (let i = 0; i < 6; i++) { // 6 sides
                            for (let j = 0; j < layer; j++) {
                                // Move to next hex
                                if (i === 0 && j === 0) {
                                    // Initial move out to layer
                                    q = 0; r = -layer;
                                } else {
                                    // Move in current direction
                                    // Directions: (1, -1), (1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1)
                                    // Simplified: check neighbors of current
                                    // Actually, let's just iterate all points in the ring
                                }
                            }
                        }
                        layer++;
                    }

                    // Fallback: Just find first non-occupied spot in a simple grid search
                    // This is easier and more robust for now
                    let placed = false;
                    for (let rad = 1; rad < 10 && !placed; rad++) {
                        for (let x = -rad; x <= rad; x++) {
                            for (let y = -rad; y <= rad; y++) {
                                // Axial distance check
                                if (Math.abs(x) + Math.abs(y) + Math.abs(-x - y) <= rad * 2) {
                                    // Check if occupied
                                    const isTaken = Object.values(newPositions).some(p => p.q === x && p.r === y);
                                    if (!isTaken) {
                                        const pixel = hexToPixel(x, y);
                                        newPositions[item.id] = { ...pixel, q: x, r: y };
                                        placed = true;
                                        break;
                                    }
                                }
                            }
                            if (placed) break;
                        }
                    }
                }
            });

            return newPositions;
        });
    }, [items]);

    const getPosition = (id) => {
        return positions[id] || { x: 0, y: 0 };
    };

    return (
        <div className={styles.gridContainer} id="honeycomb-grid-container">
            {errorMsg && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(255, 0, 0, 0.8)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    zIndex: 100,
                    fontWeight: 'bold'
                }}>
                    {errorMsg}
                </div>
            )}
            <div className={styles.gridOrigin}>
                <DraggableHexagon
                    item={centerItem}
                    isCenter={true}
                    position={getPosition('center')}
                    onStop={handleStop}
                    onHexagonClick={onHexagonClick}
                    style={{ animationDelay: '0ms' }}
                />
                {items.map((item, index) => (
                    <DraggableHexagon
                        key={item.id}
                        item={item}
                        index={index}
                        isCenter={false}
                        position={getPosition(item.id)}
                        onStop={handleStop}
                        onHexagonClick={onHexagonClick}
                        style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    />
                ))}
            </div>
        </div>
    );
});

export default HoneycombGrid;
