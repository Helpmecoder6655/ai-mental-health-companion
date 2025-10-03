// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import WebSocketService from './services/websocket';
import EmotionService from './services/emotionService';
import MultiModalScanner from './components/EmotionScanner/MultiModalScanner';
import ChatInterface from './components/AITherapist/ChatInterface';
import WellnessCenter from './components/WellnessCenter/WellnessCenter';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import EmergencyIntervention from './components/Emergency/EmergencyIntervention';
import './App.css';

function App() {
    const [currentView, setCurrentView] = useState('scanner');
    const [user, setUser] = useState(null);
    const [realtimeEmotions, setRealtimeEmotions] = useState({});
    const [crisisLevel, setCrisisLevel] = useState('LOW');
    const [emotionHistory, setEmotionHistory] = useState([]);

    useEffect(() => {
        // Initialize WebSocket connection
        WebSocketService.connect();
        
        // Load FaceAPI models
        EmotionService.loadModels();
        
        // Set up event listeners
        WebSocketService.on('realtime_emotion', handleRealtimeEmotion);
        WebSocketService.on('emergency_alert', handleEmergencyAlert);
        
        // Check for existing user session
        checkUserSession();
        
        return () => {
            WebSocketService.disconnect();
        };
    }, []);

    const checkUserSession = () => {
        const savedUser = localStorage.getItem('mental_health_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    };

    const handleRealtimeEmotion = (emotionData) => {
        setRealtimeEmotions(emotionData);
        
        // Update emotion history
        setEmotionHistory(prev => {
            const newHistory = [...prev, emotionData].slice(-20); // Keep last 20 readings
            return newHistory;
        });
        
        // Update crisis level
        const newCrisisLevel = EmotionService.calculateCrisisLevel(emotionHistory);
        setCrisisLevel(newCrisisLevel);
    };

    const handleEmergencyAlert = (alertData) => {
        // Show emergency intervention
        setCurrentView('emergency');
        
        // Trigger browser notification
        if (Notification.permission === 'granted') {
            new Notification('Mental Health Alert', {
                body: `Crisis level: ${alertData.crisis_level}. Immediate attention recommended.`,
                icon: '/icon.png'
            });
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('mental_health_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('mental_health_user');
        WebSocketService.disconnect();
    };

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="app">
            {/* Crisis Indicator */}
            {crisisLevel !== 'LOW' && (
                <div className={`crisis-banner ${crisisLevel.toLowerCase()}`}>
                    <span>
                        🚨 Current Crisis Level: {crisisLevel} - 
                        {crisisLevel === 'HIGH' || crisisLevel === 'SEVERE' 
                            ? ' Immediate support recommended' 
                            : ' Monitoring your emotional state'}
                    </span>
                    <button 
                        className="get-help-btn"
                        onClick={() => setCurrentView('emergency')}
                    >
                        Get Help Now
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="app-nav">
                <div className="nav-brand">
                    <h2>🧠 MindCompanion</h2>
                    <span className="user-greeting">Hello, {user.name}</span>
                </div>
                
                <div className="nav-links">
                    <button 
                        className={currentView === 'scanner' ? 'active' : ''}
                        onClick={() => setCurrentView('scanner')}
                    >
                        Emotion Scan
                    </button>
                    <button 
                        className={currentView === 'chat' ? 'active' : ''}
                        onClick={() => setCurrentView('chat')}
                    >
                        AI Therapist
                    </button>
                    <button 
                        className={currentView === 'wellness' ? 'active' : ''}
                        onClick={() => setCurrentView('wellness')}
                    >
                        Wellness Center
                    </button>
                    <button 
                        className={currentView === 'analytics' ? 'active' : ''}
                        onClick={() => setCurrentView('analytics')}
                    >
                        Analytics
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="app-main">
                {currentView === 'scanner' && (
                    <MultiModalScanner 
                        user={user}
                        onEmotionUpdate={handleRealtimeEmotion}
                    />
                )}
                
                {currentView === 'chat' && (
                    <ChatInterface 
                        user={user}
                        currentEmotions={realtimeEmotions}
                    />
                )}
                
                {currentView === 'wellness' && (
                    <WellnessCenter user={user} />
                )}
                
                {currentView === 'analytics' && (
                    <AnalyticsDashboard user={user} />
                )}
                
                {currentView === 'emergency' && (
                    <EmergencyIntervention 
                        crisisLevel={crisisLevel}
                        emotionData={realtimeEmotions}
                        userId={user.id}
                    />
                )}
            </main>

            {/* Emergency Panic Button */}
            <div className="panic-button-container">
                <button 
                    className="panic-button"
                    onClick={() => setCurrentView('emergency')}
                >
                    🚨 Emergency Help
                </button>
            </div>
        </div>
    );
}

// Simple Login Component
const LoginScreen = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        studentId: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock login - in real app, this would call your auth API
        const userData = {
            id: 'user_' + Date.now(),
            name: formData.name,
            email: formData.email,
            studentId: formData.studentId,
            joinedAt: new Date().toISOString()
        };
        onLogin(userData);
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                <div className="login-header">
                    <h1>🧠 MindCompanion</h1>
                    <p>AI-Powered Mental Health Support for Students</p>
                </div>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                    
                    {isRegistering && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    )}
                    
                    <input
                        type="email"
                        placeholder="Student Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    
                    {isRegistering && (
                        <input
                            type="text"
                            placeholder="Student ID"
                            value={formData.studentId}
                            onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        />
                    )}
                    
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                    
                    <button type="submit" className="login-btn">
                        {isRegistering ? 'Create Account' : 'Login'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <button 
                        className="switch-mode"
                        onClick={() => setIsRegistering(!isRegistering)}
                    >
                        {isRegistering 
                            ? 'Already have an account? Login' 
                            : 'Need an account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;