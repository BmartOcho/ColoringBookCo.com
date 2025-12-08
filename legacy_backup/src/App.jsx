import { useState } from 'react';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import UploadSection from './components/UploadSection';
import ResultSection from './components/ResultSection';
import './index.css';

function App() {
  // steps: 'landing' | 'processing' | 'result'
  const [view, setView] = useState('landing');
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleStart = () => {
    const uploadElement = document.getElementById('upload-section');
    if (uploadElement) {
      uploadElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setView('processing');
      // Simulate processing time
      setTimeout(() => {
        setView('result');
      }, 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setView('landing');
  };

  return (
    <div className="app">
      {view === 'landing' && (
        <>
          <Hero onStart={handleStart} />
          <HowItWorks />
          <UploadSection onUpload={handleImageUpload} />
          <footer style={{ textAlign: 'center', padding: '20px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
            © {new Date().getFullYear()} Coloring Book Co.
          </footer>
        </>
      )}

      {view === 'processing' && (
        <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2>Creating Magic...</h2>
          <p>Converting your photo into a coloring page.</p>
          {/* Simple loader */}
          <div style={{ marginTop: '20px', width: '50px', height: '50px', border: '5px solid #eee', borderTop: '5px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {view === 'result' && (
        <ResultSection image={uploadedImage} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
