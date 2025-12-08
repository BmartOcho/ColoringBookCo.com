import React from 'react';
import './ResultSection.css';

const ResultSection = ({ image, onReset }) => {
    return (
        <div className="result-section section">
            <div className="container">
                <h2 className="section-title">Your Coloring Page is Ready!</h2>

                <div className="result-grid">
                    <div className="result-card">
                        <h3>Original</h3>
                        <img src={image} alt="Original" className="result-img" />
                    </div>

                    <div className="result-card">
                        <h3>Coloring Page</h3>
                        <div className="coloring-page-preview">
                            {/* CSS Filter hack to simulate coloring page: Grayscale + High Contrast + Invert/Edge Detection simulation */}
                            <img src={image} alt="Coloring Page" className="result-img mock-filter" />
                        </div>
                    </div>
                </div>

                <div className="action-buttons">
                    <a href={image} download="coloring-page.png" className="download-btn">
                        Download PDF / Image
                    </a>
                    <button onClick={onReset} className="reset-btn">
                        Create Another
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultSection;
