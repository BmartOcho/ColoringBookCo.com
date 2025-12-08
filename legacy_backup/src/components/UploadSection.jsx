import React, { useState } from 'react';
import './UploadSection.css';

const UploadSection = ({ onUpload }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    return (
        <div id="upload-section" className="upload-section section">
            <div className="container">
                <h2 className="section-title">Start Your Masterpiece</h2>

                <div
                    className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="upload-icon">📁</div>
                    <h3>Drag & Drop your photo here</h3>
                    <p>or</p>
                    <label className="upload-btn">
                        Browse Files
                        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                    </label>
                    <p className="upload-note">Supports JPG, PNG up to 10MB</p>
                </div>
            </div>
        </div>
    );
};

export default UploadSection;
