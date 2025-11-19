import React, { useState, useRef, useEffect } from 'react';
import styles from './SelectionOverlay.module.css';

const SelectionOverlay = ({ onConfirm, onCancel }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [selection, setSelection] = useState(null);

    const handleMouseDown = (e) => {
        // Ignore clicks on controls
        if (e.target.closest(`.${styles.controls}`)) return;

        setIsDragging(true);
        const x = e.clientX;
        const y = e.clientY;
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setSelection({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const x = e.clientX;
        const y = e.clientY;
        setCurrentPos({ x, y });

        const minX = Math.min(startPos.x, x);
        const minY = Math.min(startPos.y, y);
        const width = Math.abs(x - startPos.x);
        const height = Math.abs(y - startPos.y);

        setSelection({ x: minX, y: minY, width, height });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleConfirm = () => {
        if (selection && selection.width > 0 && selection.height > 0) {
            onConfirm(selection);
        } else {
            alert("Please select an area first!");
        }
    };

    return (
        <div
            className={styles.overlay}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className={styles.instruction}>
                Click and drag to select the area to export
            </div>

            {selection && (
                <div
                    className={styles.selectionBox}
                    style={{
                        left: selection.x,
                        top: selection.y,
                        width: selection.width,
                        height: selection.height
                    }}
                />
            )}

            <div className={styles.controls}>
                <button className={`${styles.button} ${styles.cancelBtn}`} onClick={onCancel}>
                    Cancel
                </button>
                <button className={`${styles.button} ${styles.downloadBtn}`} onClick={handleConfirm}>
                    Download Selection
                </button>
            </div>
        </div>
    );
};

export default SelectionOverlay;
