import React, { useState, useEffect, useCallback } from 'react';
import styles from './SuperlativeModal.module.css';

const SuperlativeModal = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [image, setImage] = useState(null);
    const [color, setColor] = useState('#52d053');

    // New Customization State
    const [titleColor, setTitleColor] = useState('#ffffff');
    const [subtitleColor, setSubtitleColor] = useState('#cccccc');

    // Image URL State
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [imageError, setImageError] = useState('');

    useEffect(() => {
        if (item) {
            setTitle(item.title || '');
            setSubtitle(item.subtitle || '');
            setImage(item.image || null);
            setColor(item.color || (item.isCenter ? '#ffb703' : '#52d053'));

            // Load new fields or defaults
            setTitleColor(item.titleColor || '#ffffff');
            setSubtitleColor(item.subtitleColor || '#cccccc');

            // Reset URL input
            setImageUrlInput('');
            setImageError('');
        }
    }, [item]);

    const handleUrlChange = useCallback((e) => {
        const url = e.target.value;
        setImageUrlInput(url);
        setImageError(''); // Clear error while typing

        if (!url) return;

        // 1. Check if image exists/loads normally
        const img = new Image();
        img.onload = () => {
            // Image exists. Now check if it supports CORS (required for export)
            const corsImg = new Image();
            corsImg.crossOrigin = "anonymous";
            corsImg.onload = () => {
                // All good!
                setImage(url);
                setImageError('');
            };
            corsImg.onerror = () => {
                // Loads normally but fails CORS - BLOCK IT
                // Do NOT set the image
                setImageError('⛔ Export Blocked: This site blocks external access. Please save the image and upload it instead.');
            };
            // Add random query param to bypass cache and force a fresh CORS check
            // This ensures we don't get a false positive/negative from a previous non-CORS cached response
            corsImg.src = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        };
        img.onerror = () => {
            setImageError('Unable to load image. Please check the URL.');
        };
        img.src = url;
    }, []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Create an image element to compress
                const img = new Image();
                img.onload = () => {
                    // Create canvas for compression
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions (max 800px)
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    // Set canvas size to new dimensions
                    canvas.width = width;
                    canvas.height = height;

                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to 80% quality JPEG
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setImage(compressedDataUrl);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleSave = useCallback(() => {
        onSave({
            ...item,
            title,
            subtitle,
            image,
            color,
            titleColor,
            subtitleColor
        });
        onClose();
    }, [item, title, subtitle, image, color, titleColor, subtitleColor, onSave, onClose]);

    const handleDelete = useCallback(() => {
        if (window.confirm("Are you sure you want to delete this hexagon?")) {
            onDelete(item.id);
        }
    }, [item, onDelete]);

    if (!isOpen) return null;

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

                        <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                            <label className={styles.label} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                                Or paste Image URL
                            </label>
                            <input
                                className={styles.input}
                                value={imageUrlInput}
                                onChange={handleUrlChange}
                                placeholder="https://example.com/image.jpg"
                                style={{ width: '100%' }}
                            />
                            {imageError && (
                                <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '5px' }}>
                                    {imageError}
                                </div>
                            )}
                        </div>
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
