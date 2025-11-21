import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
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


// Memoized Draggable Hexagon component to prevent unnecessary re-renders
const DraggableHexagon = React.memo(({ item, index, isCenter, position, onStop, onHexagonClick, style }) => {
    const nodeRef = useRef(null);
    const id = isCenter ? 'center' : item.id;
    const { scale = 1, ...divStyle } = style || {};

    // Memoize the stop handler to prevent recreation
    const handleStop = useCallback((e, data) => {
        onStop(e, data, id);
    }, [onStop, id]);

    // Memoize the click handler
    const handleClick = useCallback(() => {
        onHexagonClick(item);
    }, [onHexagonClick, item]);

    return (
        <Draggable
            nodeRef={nodeRef}
            position={position}
            onStop={handleStop}
            grid={[1, 1]}
            scale={scale}
        >
            <div
                ref={nodeRef}
                className="hexagon-item"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    ...divStyle
                }}
            >
                <div style={{ transform: 'translate3d(-50%, -50%, 0)' }}>
                    <Hexagon
                        {...item}
                        isCenter={isCenter}
                        onDoubleClick={handleClick}
                    />
                </div>
            </div>
        </Draggable>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better memoization
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.title === nextProps.item.title &&
        prevProps.item.subtitle === nextProps.item.subtitle &&
        prevProps.item.image === nextProps.item.image &&
        prevProps.item.color === nextProps.item.color &&
        prevProps.item.titleColor === nextProps.item.titleColor &&
        prevProps.item.subtitleColor === nextProps.item.subtitleColor &&
        prevProps.position.x === nextProps.position.x &&
        prevProps.position.y === nextProps.position.y &&
        prevProps.isCenter === nextProps.isCenter &&
        prevProps.style?.scale === nextProps.style?.scale &&
        prevProps.style?.animationDelay === nextProps.style?.animationDelay
    );
});

const HoneycombGrid = forwardRef(({ items, centerItem, onHexagonClick }, ref) => {
    // State to track positions: { [id]: { x, y, q, r } }
    // Initialize from localStorage if available
    const [positions, setPositions] = useState(() => {
        try {
            const saved = localStorage.getItem('mehive_layout');
            return saved ? JSON.parse(saved) : { 'center': { x: 0, y: 0, q: 0, r: 0 } };
        } catch (e) {
            console.error("Failed to load layout:", e);
            return { 'center': { x: 0, y: 0, q: 0, r: 0 } };
        }
    });

    // Debounced save to localStorage to avoid excessive writes during rapid drags
    const saveTimeoutRef = useRef(null);
    const savePositions = useCallback((newPositions) => {
        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        // Schedule save for 100ms later
        saveTimeoutRef.current = setTimeout(() => {
            localStorage.setItem('mehive_layout', JSON.stringify(newPositions));
        }, 100);
    }, []);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });

    // Grid Bounds (approximate for now, can be expanded)
    const BOUNDS = useMemo(() => ({
        minQ: -5, maxQ: 5,
        minR: -5, maxR: 5
    }), []);

    const handleStop = useCallback((e, data, id) => {
        // 1. Calculate raw grid coordinates from pixels
        const raw = pixelToHex(data.x, data.y);

        // 2. Use functional update to get current positions
        setPositions(prev => {
            const currentPos = prev[id];

            // Optimization: If position hasn't changed in grid terms, do nothing
            if (currentPos && currentPos.q === raw.q && currentPos.r === raw.r) {
                return prev;
            }

            // 3. Validation Checks
            // Check Bounds
            if (raw.q < BOUNDS.minQ || raw.q > BOUNDS.maxQ || raw.r < BOUNDS.minR || raw.r > BOUNDS.maxR) {
                console.log("Out of bounds:", raw.q, raw.r);
                return prev; // Don't update, snap back
            }

            // Check Overlap - build spatial map from current positions
            const occupantEntry = Object.entries(prev).find(([otherId, pos]) => {
                return pos.q === raw.q && pos.r === raw.r && String(otherId) !== String(id);
            });

            let newPositions;
            if (occupantEntry) {
                const [occupantId] = occupantEntry;
                console.log(`Swapping ${id} with ${occupantId}`);

                // Swap Logic:
                // 1. Dragged item (id) takes the target spot (raw)
                const newPixelForDragged = hexToPixel(raw.q, raw.r);

                // 2. Occupant takes the dragged item's original spot (currentPos)
                // We recalculate pixels to ensure perfect grid alignment
                const newPixelForOccupant = hexToPixel(currentPos.q, currentPos.r);

                newPositions = {
                    ...prev,
                    [id]: { x: newPixelForDragged.x, y: newPixelForDragged.y, q: raw.q, r: raw.r },
                    [occupantId]: { x: newPixelForOccupant.x, y: newPixelForOccupant.y, q: currentPos.q, r: currentPos.r }
                };
            } else {
                // 4. Update State if Valid (No overlap, just move)
                const newPixel = hexToPixel(raw.q, raw.r);
                newPositions = {
                    ...prev,
                    [id]: { x: newPixel.x, y: newPixel.y, q: raw.q, r: raw.r }
                };
            }

            // Save to localStorage
            savePositions(newPositions);
            return newPositions;
        });
    }, [BOUNDS, savePositions]);

    useImperativeHandle(ref, () => ({
        exportGrid: async () => {
            try {
                // Calculate bounding box of all hexagons
                const allPositions = Object.values(positions);
                if (allPositions.length === 0) {
                    alert("No hexagons to export!");
                    return;
                }

                const padding = 100;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

                allPositions.forEach(pos => {
                    const halfW = HEX_WIDTH / 2;
                    const halfH = HEX_HEIGHT / 2;
                    if (pos.x - halfW < minX) minX = pos.x - halfW;
                    if (pos.x + halfW > maxX) maxX = pos.x + halfW;
                    if (pos.y - halfH < minY) minY = pos.y - halfH;
                    if (pos.y + halfH > maxY) maxY = pos.y + halfH;
                });

                const canvasWidth = (maxX - minX) + padding * 2;
                const canvasHeight = (maxY - minY) + padding * 2;

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext('2d', { alpha: true });

                // Match the DOM background color for consistent appearance
                ctx.fillStyle = '#242424';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                // Helper to draw hexagon path
                const drawHexagonPath = (ctx, centerX, centerY, width, height) => {
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY - height / 2);
                    ctx.lineTo(centerX + width / 2, centerY - height / 4);
                    ctx.lineTo(centerX + width / 2, centerY + height / 4);
                    ctx.lineTo(centerX, centerY + height / 2);
                    ctx.lineTo(centerX - width / 2, centerY + height / 4);
                    ctx.lineTo(centerX - width / 2, centerY - height / 4);
                    ctx.closePath();
                };

                // Collect all hexagons with their data
                const hexagons = [];

                // Add center hexagon
                const centerPos = positions['center'];
                if (centerPos) {
                    hexagons.push({
                        pos: centerPos,
                        data: centerItem,
                        isCenter: true
                    });
                }

                // Add regular hexagons
                items.forEach(item => {
                    const pos = positions[item.id];
                    if (pos) {
                        hexagons.push({
                            pos,
                            data: item,
                            isCenter: false
                        });
                    }
                });

                // Load all images first
                const imagePromises = hexagons.map(async (hex) => {
                    if (hex.data.image) {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.crossOrigin = "anonymous";
                            img.onload = () => resolve({ hex, img });
                            img.onerror = () => resolve({ hex, img: null });
                            img.src = hex.data.image;
                        });
                    }
                    return Promise.resolve({ hex, img: null });
                });

                const loadedImages = await Promise.all(imagePromises);

                // Draw each hexagon
                loadedImages.forEach(({ hex, img }) => {
                    const canvasX = hex.pos.x - minX + padding;
                    const canvasY = hex.pos.y - minY + padding;

                    ctx.save();

                    // Create hexagon clip path
                    drawHexagonPath(ctx, canvasX, canvasY, HEX_WIDTH, HEX_HEIGHT);
                    ctx.clip();

                    // Draw background color
                    ctx.fillStyle = hex.data.color || '#333';
                    ctx.fill();

                    // Draw image if available
                    if (img) {
                        const imgAspect = img.width / img.height;
                        const hexAspect = HEX_WIDTH / HEX_HEIGHT;
                        let drawWidth, drawHeight, offsetX, offsetY;

                        if (imgAspect > hexAspect) {
                            drawHeight = HEX_HEIGHT;
                            drawWidth = drawHeight * imgAspect;
                            offsetX = -(drawWidth - HEX_WIDTH) / 2;
                            offsetY = 0;
                        } else {
                            drawWidth = HEX_WIDTH;
                            drawHeight = drawWidth / imgAspect;
                            offsetX = 0;
                            offsetY = -(drawHeight - HEX_HEIGHT) / 2;
                        }

                        ctx.drawImage(
                            img,
                            canvasX - HEX_WIDTH / 2 + offsetX,
                            canvasY - HEX_HEIGHT / 2 + offsetY,
                            drawWidth,
                            drawHeight
                        );
                    }

                    ctx.restore();

                    // Draw hexagon border
                    ctx.save();
                    drawHexagonPath(ctx, canvasX, canvasY, HEX_WIDTH, HEX_HEIGHT);
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();

                    // Draw text
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Title
                    if (hex.data.title) {
                        ctx.fillStyle = hex.data.titleColor || 'white';
                        ctx.font = 'bold 20px Arial';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 4;
                        ctx.shadowOffsetY = 2;

                        // Wrap text character-by-character
                        const titleText = hex.data.title.toUpperCase();
                        const maxWidth = HEX_WIDTH - 40;
                        const lines = [];
                        let currentLine = '';

                        for (let i = 0; i < titleText.length; i++) {
                            const testLine = currentLine + titleText[i];
                            const metrics = ctx.measureText(testLine);
                            if (metrics.width > maxWidth && currentLine.length > 0) {
                                lines.push(currentLine);
                                currentLine = titleText[i];
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine.length > 0) {
                            lines.push(currentLine);
                        }

                        // Limit to 2 lines
                        if (lines.length > 2) {
                            lines.splice(2);
                            if (lines[1].length > 3) {
                                lines[1] = lines[1].substring(0, lines[1].length - 3) + '...';
                            }
                        }

                        // Draw lines
                        const titleStartY = canvasY - 15 - ((lines.length - 1) * 12);
                        lines.forEach((line, i) => {
                            ctx.fillText(line, canvasX, titleStartY + (i * 24));
                        });
                    }

                    // Subtitle
                    if (hex.data.subtitle) {
                        ctx.fillStyle = hex.data.subtitleColor || 'rgba(255, 255, 255, 0.8)';
                        ctx.font = '600 17px Arial';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                        ctx.shadowBlur = 4;
                        ctx.shadowOffsetY = 2;

                        // Wrap text character-by-character
                        const maxWidth = HEX_WIDTH - 40;
                        const lines = [];
                        let currentLine = '';

                        for (let i = 0; i < hex.data.subtitle.length; i++) {
                            const testLine = currentLine + hex.data.subtitle[i];
                            const metrics = ctx.measureText(testLine);
                            if (metrics.width > maxWidth && currentLine.length > 0) {
                                lines.push(currentLine);
                                currentLine = hex.data.subtitle[i];
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine.length > 0) {
                            lines.push(currentLine);
                        }

                        // Limit to 2 lines
                        if (lines.length > 2) {
                            lines.splice(2);
                            if (lines[1].length > 3) {
                                lines[1] = lines[1].substring(0, lines[1].length - 3) + '...';
                            }
                        }

                        // Draw lines
                        const subtitleStartY = canvasY + 25 - ((lines.length - 1) * 10);
                        lines.forEach((line, i) => {
                            ctx.fillText(line, canvasX, subtitleStartY + (i * 20));
                        });
                    }

                    ctx.restore();
                });

                // Convert canvas to blob and download
                canvas.toBlob((blob) => {
                    if (!blob) {
                        alert("Export failed: Could not create image");
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = 'MeHive-Year.png';
                    link.href = url;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }, 'image/png');

            } catch (err) {
                console.error('Export failed:', err);
                alert("Export failed: " + err.message);
            }
        }
    }), [positions, items, centerItem]);

    // ... (rest of component: useState init, getPosition, return JSX)
    // Ensure to close the component correctly

    // Dynamic Layout Management
    React.useEffect(() => {
        setPositions(prevPositions => {
            const newPositions = { ...prevPositions };

            // 1. Remove positions for deleted items
            // Create a Set of current item IDs for O(1) lookup
            const currentIds = new Set(items.map(i => String(i.id)));
            Object.keys(newPositions).forEach(key => {
                if (key !== 'center' && !currentIds.has(key)) {
                    delete newPositions[key];
                }
            });

            // 2. Add positions for new items
            items.forEach(item => {
                if (!newPositions[item.id]) {
                    // Find next available spot using spiral algorithm
                    let q = 0, r = 0;
                    let layer = 1;
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

    // Responsive Scaling with RAF-based debouncing for better performance
    React.useEffect(() => {
        let rafId = null;
        let resizeTimeout = null;

        const handleResize = () => {
            // Cancel any pending RAF
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            // Use RAF for smooth updates
            rafId = requestAnimationFrame(() => {
                const allPositions = Object.values(positions);
                if (allPositions.length === 0) return;

                const halfW = HEX_WIDTH / 2;
                const halfH = HEX_HEIGHT / 2;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

                allPositions.forEach(pos => {
                    if (pos.x - halfW < minX) minX = pos.x - halfW;
                    if (pos.x + halfW > maxX) maxX = pos.x + halfW;
                    if (pos.y - halfH < minY) minY = pos.y - halfH;
                    if (pos.y + halfH > maxY) maxY = pos.y + halfH;
                });

                const contentWidth = maxX - minX + 100; // Reduced padding for closer zoom
                const contentHeight = maxY - minY + 100;

                const availableWidth = window.innerWidth;
                const availableHeight = window.innerHeight - 120; // account for UI

                const scaleX = availableWidth / contentWidth;
                const scaleY = availableHeight / contentHeight;

                // Use the smaller scale to fit both dimensions, but cap at 1.2 (allow slight zoom in)
                const newScale = Math.min(1.2, scaleX, scaleY);

                // Calculate center offset
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                // Only update if significantly different to avoid jitter
                if (Math.abs(newScale - scale) > 0.01 ||
                    Math.abs(-centerX - translate.x) > 1 ||
                    Math.abs(-centerY - translate.y) > 1) {
                    setScale(newScale);
                    setTranslate({ x: -centerX, y: -centerY });
                }
            });
        };

        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 100);
        };

        handleResize(); // Initial calc
        window.addEventListener('resize', debouncedResize);
        return () => {
            window.removeEventListener('resize', debouncedResize);
            if (rafId) cancelAnimationFrame(rafId);
            if (resizeTimeout) clearTimeout(resizeTimeout);
        };
    }, [positions, scale, translate]);

    const getPosition = useCallback((id) => {
        return positions[id] || { x: 0, y: 0 };
    }, [positions]);

    return (
        <div className={styles.gridContainer} id="honeycomb-grid-container">
            <div className={styles.gridOrigin} style={{ transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)` }}>
                <DraggableHexagon
                    item={centerItem}
                    isCenter={true}
                    position={getPosition('center')}
                    onStop={handleStop}
                    onHexagonClick={onHexagonClick}
                    style={{ animationDelay: '0ms', scale }}
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
                        style={{ animationDelay: `${(index + 1) * 100}ms`, scale }}
                    />
                ))}
            </div>
        </div>
    );
});

export default HoneycombGrid;
