import React, { useState, useEffect } from 'react';
import styles from './SuperlativeModal.module.css';

const SuperlativeModal = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [image, setImage] = useState(null);
    const [color, setColor] = useState('#333333');

    // New Customization State
    const [titleColor, setTitleColor] = useState('#ffffff');
    const [subtitleColor, setSubtitleColor] = useState('#cccccc');
    const [boxColor, setBoxColor] = useState('#000000');
    const [boxOpacity, setBoxOpacity] = useState(0.5);

    useEffect(() => {
        if (item) {
            setTitle(item.title || '');
            setSubtitle(item.subtitle || '');
            setImage(item.image || null);
            setColor(item.color || (item.isCenter ? '#ffb703' : '#333333'));

            // Load new fields or defaults
            setTitleColor(item.titleColor || '#ffffff');
            setSubtitleColor(item.subtitleColor || '#cccccc');
            setBoxColor(item.boxColor || '#000000');
            setBoxOpacity(item.boxOpacity !== undefined ? item.boxOpacity : 0.5);
        }
    }, [item]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave({
            ...item,
            title,
            subtitle,
            image,
            color,
            titleColor,
            subtitleColor,
            boxColor,
            boxOpacity
        });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this hexagon?")) {
            onDelete(item.id);
        }
    };

    // Helper to convert hex to rgba for preview
    const hexToRgba = (hex, alpha) => {
        if (!hex) return 'rgba(0, 0, 0, 1)';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{item?.isCenter ? 'Edit Center Node' : 'Edit Superlative'}</h2>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        {item?.isCenter ? 'Title' : 'Category Title'}
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            className={styles.input}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={item?.isCenter ? "e.g. Nafis's Year" : "e.g. Best Movie"}
                            style={{ flex: 1 }}
                        />
                        <input
                            type="color"
                            value={titleColor}
                            onChange={e => setTitleColor(e.target.value)}
                            title="Text Color"
                            style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        {item?.isCenter ? 'Year / Subtitle' : 'Your Pick'}
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            className={styles.input}
                            value={subtitle}
                            onChange={e => setSubtitle(e.target.value)}
                            placeholder={item?.isCenter ? "e.g. 2024" : "e.g. Oppenheimer"}
                            style={{ flex: 1 }}
                        />
                        <input
                            type="color"
                            value={subtitleColor}
                            onChange={e => setSubtitleColor(e.target.value)}
                            title="Text Color"
                            style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* Text Box Styling Section */}
                <div className={styles.formGroup} style={{ borderTop: '1px solid #444', paddingTop: '15px', marginTop: '15px' }}>
                    <label className={styles.label} style={{ marginBottom: '10px', color: '#ffb703' }}>Text Box Style</label>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Color & Preview</span>
                            {/* Custom Color Picker with Opacity Preview */}
                            <div style={{
                                width: '50px',
                                height: '30px',
                                backgroundColor: hexToRgba(boxColor, boxOpacity),
                                border: '1px solid #666',
                                borderRadius: '4px',
                                position: 'relative',
                                cursor: 'pointer',
                                backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
                                backgroundSize: '10px 10px',
                                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: hexToRgba(boxColor, boxOpacity),
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }} />
                                <input
                                    type="color"
                                    value={boxColor}
                                    onChange={e => setBoxColor(e.target.value)}
                                    style={{
                                        opacity: 0,
                                        width: '100%',
                                        height: '100%',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                            <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Opacity ({Math.round(boxOpacity * 100)}%)</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={boxOpacity}
                                onChange={e => setBoxOpacity(parseFloat(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                </div>

                {item?.isCenter && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Hexagon Background Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                style={{ width: '50px', height: '40px', padding: '0', border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{color}</span>
                        </div>
                    </div>
                )}

                {!item?.isCenter && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Image</label>
                        <div className={styles.imagePreview} onClick={() => document.getElementById('fileInput').click()}>
                            {image ? (
                                <img src={image} alt="Preview" />
                            ) : (
                                <span className={styles.uploadBtn}>Click to upload image</span>
                            )}
                        </div>
                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            className={styles.fileInput}
                            onChange={handleImageChange}
                        />
                    </div>
                )}

                <div className={styles.actions} style={{ justifyContent: 'space-between' }}>
                    {!item?.isCenter && (
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDelete}
                            style={{ backgroundColor: '#e63946', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', marginRight: 'auto' }}
                        >
                            Delete
                        </button>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginLeft: item?.isCenter ? 'auto' : '0' }}>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperlativeModal;
