import React from 'react';
import './Hero.css';

const Hero = ({ onStart }) => {
    return (
        <div className="hero section">
            <div className="container">
                <div className="hero-logo">COLORING<br />BOOK CO.</div>
                <h1 className="hero-title">
                    Turn Any Photo Into a <br />
                    <span className="hero-title-highlight">Custom Coloring Book</span>
                </h1>
                <p className="hero-subtitle">
                    Upload your favorite photo and we'll transform it into a beautiful, printable coloring book. Perfect for kids, gifts, and creative fun!
                </p>
                <button className="cta-button" onClick={onStart}>
                    Create Your Coloring Book &rarr;
                </button>
                <div className="hero-trust">
                    <span>✨ Instant download</span> • <span>High-quality pages</span> • <span>Print at home</span>
                </div>
            </div>
        </div>
    );
};

export default Hero;
