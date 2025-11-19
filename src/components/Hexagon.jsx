import React from 'react';
import styles from './Hexagon.module.css';

const Hexagon = ({
    title,
    subtitle,
    image,
    color,
    titleColor,
    subtitleColor,
    boxColor,
    boxOpacity,
    onDoubleClick,
    isCenter = false,
    className = '',
    style
}) => {
    const bgStyle = {
        ...(image ? { backgroundImage: `url(${image})` } : {}),
        ...(color ? { backgroundColor: color } : {})
    };

    // Helper to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
        if (!hex) return 'rgba(0, 0, 0, 0.5)'; // Default
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha !== undefined ? alpha : 0.5})`;
    };

    const contentStyle = {
        backgroundColor: hexToRgba(boxColor, boxOpacity)
    };

    return (
        <div
            className={`${styles.hexagonWrapper} ${className}`}
            onDoubleClick={onDoubleClick}
            style={style}
        >
            <div
                className={`${styles.hexagon} ${isCenter ? styles.centerNode : ''}`}
                style={bgStyle}
            >
                <div className={styles.hexagonContent} style={contentStyle}>
                    <h3 className={styles.title} style={{ color: titleColor || 'white' }}>{title}</h3>
                    {subtitle && <p className={styles.subtitle} style={{ color: subtitleColor || 'rgba(255, 255, 255, 0.8)' }}>{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

export default Hexagon;
