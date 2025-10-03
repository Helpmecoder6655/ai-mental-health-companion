import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import EmotionService from '../../services/emotionService';
import './MultiModalScanner.css';

const MultiModalScanner = ({ user, onEmotionUpdate }) => {
    const webcamRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [emotions, setEmotions] = useState(null);
    const [error, setError] = useState('');
    const [scanDuration, setScanDuration] = useState(0);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        // Initialize emotion service
        const initializeService = async () => {
            try {
                const loaded = await EmotionService.loadModels();
                setModelsLoaded(loaded);
                if (!loaded) {
                    console.log('Running in demo mode with mock emotion data');
                }
            } catch (err) {
                console.log('Service initialized in demo mode');
                setModelsLoaded(false);
            }
        };

        initializeService();
    }, []);

    useEffect(() => {
        let interval;
        let durationInterval;

        if (isScanning) {
            setScanDuration(0);
            
            // Update duration every second
            durationInterval = setInterval(() => {
                setScanDuration(prev => prev + 1);
            }, 1000);

            // Scan for emotions every 2 seconds
            interval = setInterval(async () => {
                try {
                    let emotionData;
                    
                    if (webcamRef.current && modelsLoaded) {
                        // In production, this would capture and analyze real images
                        // For demo, we'll use mock data
                        emotionData = EmotionService.getMockEmotions();
                    } else {
                        // Use mock emotions
                        emotionData = EmotionService.getMockEmotions();
                    }
                    
                    setEmotions(emotionData);
                    onEmotionUpdate(emotionData);
                    
                } catch (err) {
                    console.error('Error in emotion scan:', err);
                    setError('Scanning error. Using demo data.');
                    
                    // Fallback to mock emotions
                    const emotionData = EmotionService.getMockEmotions();
                    setEmotions(emotionData);
                    onEmotionUpdate(emotionData);
                }
            }, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (durationInterval) clearInterval(durationInterval);
        };
    }, [isScanning, modelsLoaded, onEmotionUpdate]);

    const startFaceScan = () => {
        setError('');
        setIsScanning(true);
        console.log('Face scan started in demo mode');
    };

    const stopFaceScan = () => {
        setIsScanning(false);
        setEmotions(null);
        setScanDuration(0);
        console.log('Face scan stopped');
    };

    const getEmotionColor = (emotion) => {
        const colors = {
            happy: '#4ecdc4',
            sad: '#45b7d1',
            angry: '#ff6b6b',
            fearful: '#feca57',
            surprised: '#ff9ff3',
            neutral: '#95a5a6',
            disgusted: '#a29bfe'
        };
        return colors[emotion] || '#95a5a6';
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="multi-modal-scanner">
            <div className="scanner-header">
                <h2>Emotion Scanner</h2>
                <p>Analyze your emotional state through facial expressions</p>
                {!modelsLoaded && (
                    <div className="demo-notice">
                        🎭 Running in Demo Mode - Using simulated emotion data
                    </div>
                )}
            </div>

            <div className="scanner-content">
                <div className="webcam-section">
                    <div className="webcam-container">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="webcam-feed"
                            mirrored={true}
                        />
                        
                        {isScanning && (
                            <div className="scanning-overlay">
                                <div className="scanning-animation"></div>
                                <p>Analyzing emotions in real-time...</p>
                                <div className="scan-duration">
                                    Duration: {formatDuration(scanDuration)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="scanner-controls">
                        {!isScanning ? (
                            <button 
                                className="scan-btn start"
                                onClick={startFaceScan}
                                disabled={!webcamRef.current}
                            >
                                🎭 Start Face Scan
                            </button>
                        ) : (
                            <button 
                                className="scan-btn stop"
                                onClick={stopFaceScan}
                            >
                                ⏹️ Stop Scan
                            </button>
                        )}
                    </div>
                </div>

                {emotions && (
                    <div className="emotion-results">
                        <h3>Real-time Emotion Analysis</h3>
                        
                        <div className="dominant-emotion">
                            <span className="label">Dominant Emotion:</span>
                            <span 
                                className="emotion-value"
                                style={{ color: getEmotionColor(emotions.dominantEmotion) }}
                            >
                                {emotions.dominantEmotion.toUpperCase()}
                            </span>
                            <span className="confidence">
                                ({(emotions.confidence * 100).toFixed(1)}% confidence)
                            </span>
                        </div>

                        <div className="emotion-breakdown">
                            <h4>Detailed Emotional State:</h4>
                            {Object.entries(emotions.expressions)
                                .sort(([,a], [,b]) => b - a)
                                .map(([emotion, score]) => (
                                <div key={emotion} className="emotion-item">
                                    <span className="emotion-name">{emotion}</span>
                                    <div className="emotion-bar-container">
                                        <div 
                                            className="emotion-bar"
                                            style={{
                                                width: `${score * 100}%`,
                                                backgroundColor: getEmotionColor(emotion)
                                            }}
                                        ></div>
                                    </div>
                                    <span className="emotion-percentage">
                                        {(score * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                <div className="scanner-info">
                    <h4>💡 How it works:</h4>
                    <ul>
                        <li>Click "Start Face Scan" to begin real-time emotion analysis</li>
                        <li>The system analyzes facial expressions every 2 seconds</li>
                        <li>Results show your dominant emotion and detailed breakdown</li>
                        <li>Scan automatically updates emotional state in real-time</li>
                        <li>Click "Stop Scan" to end the session</li>
                    </ul>
                    
                    <div className="tech-note">
                        <strong>Technical Note:</strong> This demo uses simulated emotion data. 
                        In production, we use advanced AI models for real facial expression analysis.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiModalScanner;