import React from 'react';
import './HowItWorks.css';

const Step = ({ number, icon, title, text }) => (
    <div className="step-card">
        <div className="step-number">{number}</div>
        <div className="step-icon">{icon}</div>
        <h3 className="step-title">{title}</h3>
        <p className="step-text">{text}</p>
    </div>
);

const HowItWorks = () => {
    return (
        <div className="how-it-works section">
            <div className="container">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">Creating your custom coloring book is as easy as 1-2-3</p>

                <div className="steps-grid">
                    <Step
                        number="1"
                        icon="📤"
                        title="Upload Your Photo"
                        text="Choose any photo - family, pets, vacation memories, or anything you love!"
                    />
                    <Step
                        number="2"
                        icon="✨"
                        title="We Create Magic"
                        text="Our system transforms your photo into beautiful coloring book pages in seconds."
                    />
                    <Step
                        number="3"
                        icon="⬇️"
                        title="Download & Color"
                        text="Get your custom coloring book instantly. Print at home or save digitally!"
                    />
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
