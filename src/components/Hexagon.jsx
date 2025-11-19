import React, { useRef } from 'react';
import styles from './Hexagon.module.css';

const Hexagon = ({
    title,
    subtitle,
    image,
    color,
    titleColor,
    subtitleColor,
    onDoubleClick,
    isCenter = false,
    className = '',
    style
}) => {
    const lastTapRef = useRef(0);

    const bgStyle = {
        ...(image ? { backgroundImage: `url(${image})` } : {}),
        ...(color ? { backgroundColor: color } : {})
    };

    // Handle both double-click (desktop) and double-tap (mobile)
    const handleTap = (e) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300; // ms

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap detected
            e.preventDefault();
            if (onDoubleClick) {
                onDoubleClick(e);
            }
        }
        lastTapRef.current = now;
    };

    return (
        <div
            className={`${styles.hexagonWrapper} ${className}`}
            onDoubleClick={onDoubleClick}
            onTouchEnd={handleTap}
            style={style}
        >
            <div
                className={`${styles.hexagon} ${isCenter ? styles.centerNode : ''}`}
                style={bgStyle}
            >
                <div className={styles.hexagonContent}>
                    <h3 className={styles.title} style={{ color: titleColor || 'white' }}>{title}</h3>
                    {subtitle && <p className={styles.subtitle} style={{ color: subtitleColor || 'rgba(255, 255, 255, 0.8)' }}>{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

export default Hexagon;
