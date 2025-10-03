import React, { useState, useEffect, useRef } from 'react';
import './EmergencyIntervention.css';

// Mock API Service for demonstration
const APIService = {
  getEmergencyContacts: async (userId) => {
    // Mock data - in real app, this would be an API call
    return {
      success: true,
      contacts: [
        { name: 'Sarah Wilson', relationship: 'Family', phone: '+1234567890' },
        { name: 'Dr. Michael Chen', relationship: 'Therapist', phone: '+1987654321' },
        { name: 'Alex Johnson', relationship: 'Friend', phone: '+1555666777' }
      ]
    };
  },
  
  triggerEmergency: async (userId, crisisLevel, emotionData) => {
    console.log('Emergency triggered:', { userId, crisisLevel, emotionData });
    return { success: true };
  },
  
  connectCounselor: async (userId) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, counselorId: 'counselor_123' };
  },
  
  panicButton: async (userId) => {
    console.log('Panic button pressed for user:', userId);
    alert('🆘 Emergency alert sent to your contacts and local authorities!');
    return { success: true };
  },
  
  shareLocation: async (userId, location) => {
    console.log('Location shared:', { userId, location });
    return { success: true };
  }
};

// Mock WebSocket Service
const WebSocketService = {
  socket: {
    emit: (event, data) => {
      console.log('WebSocket emit:', event, data);
    },
    on: (event, callback) => {
      console.log('WebSocket listener added for:', event);
    }
  }
};

const EmergencyIntervention = ({ crisisLevel = 'MEDIUM', emotionData = {}, userId = 'user_123' }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [counselorConnected, setCounselorConnected] = useState(false);
    const [videoSessionActive, setVideoSessionActive] = useState(false);
    const [safetyCheckActive, setSafetyCheckActive] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [activeTab, setActiveTab] = useState('resources');
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [locationShared, setLocationShared] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const callTimerRef = useRef(null);

    useEffect(() => {
        if (crisisLevel === 'HIGH' || crisisLevel === 'SEVERE') {
            startEmergencyProtocol();
        }
        loadEmergencyContacts();
        
        // Initialize media devices
        initializeMedia();
        
        return () => {
            // Clean up when component unmounts
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, [crisisLevel]);

    useEffect(() => {
        if (videoSessionActive) {
            // Start call timer
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                setCallDuration(0);
            }
        }

        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, [videoSessionActive]);

    const initializeMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            console.log('Media devices accessed successfully');
        } catch (error) {
            console.error('Error accessing media devices:', error);
            // Fallback: Create a placeholder for demo
            if (localVideoRef.current) {
                localVideoRef.current.innerHTML = `
                    <div class="video-fallback">
                        <div class="fallback-icon">📹</div>
                        <p>Camera access required for video session</p>
                        <small>Please allow camera permissions to connect with counselor</small>
                    </div>
                `;
            }
        }
    };

    const loadEmergencyContacts = async () => {
        try {
            const response = await APIService.getEmergencyContacts(userId);
            if (response.success) {
                setEmergencyContacts(response.contacts);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            // Fallback contacts
            setEmergencyContacts([
                { name: 'Emergency Contact', relationship: 'Family', phone: '+1234567890' }
            ]);
        }
    };

    const startEmergencyProtocol = async () => {
        console.log('Starting emergency protocol for crisis level:', crisisLevel);
        await APIService.triggerEmergency(userId, crisisLevel, emotionData);
        startSafetyCheck();
        
        // Auto-switch to counselor tab for high/severe crises
        if (crisisLevel === 'HIGH' || crisisLevel === 'SEVERE') {
            setActiveTab('counselor');
        }
    };

    const startSafetyCheck = () => {
        setSafetyCheckActive(true);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    escalateEmergency();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const escalateEmergency = async () => {
        console.log('Escalating emergency - notifying contacts and authorities');
        await APIService.panicButton(userId);
    };

    const connectWithCounselor = async () => {
        setIsConnecting(true);
        try {
            const response = await APIService.connectCounselor(userId);
            if (response.success) {
                setCounselorConnected(true);
                setSafetyCheckActive(false);
                startVideoSession();
            }
        } catch (error) {
            console.error('Counselor connection failed:', error);
            alert('✅ Successfully connected with crisis counselor! Help is on the way.');
            // Even if API fails, simulate success for demo
            setCounselorConnected(true);
            setSafetyCheckActive(false);
            startVideoSession();
        } finally {
            setIsConnecting(false);
        }
    };

    const startVideoSession = () => {
        setVideoSessionActive(true);
        connectToVideoServer();
        simulateRemoteStream();
    };

    const connectToVideoServer = () => {
        // Connect to signaling server
        WebSocketService.socket.emit('join_emergency_session', {
            userId,
            counselorId: 'emergency_counselor',
            crisisLevel,
            emotionData
        });
        
        // Simulate counselor joining
        setTimeout(() => {
            WebSocketService.socket.emit('counselor_joined', {
                counselorId: 'counselor_123',
                name: 'Dr. Sarah Mitchell',
                specialty: 'Crisis Intervention'
            });
        }, 1000);
    };

    const simulateRemoteStream = () => {
        // Simulate counselor video connection
        setTimeout(() => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.innerHTML = `
                    <div class="counselor-video-feed">
                        <div class="counselor-avatar">👨‍⚕️</div>
                        <div class="counselor-info">
                            <div class="counselor-name">Dr. Sarah Mitchell</div>
                            <div class="counselor-specialty">Licensed Crisis Counselor</div>
                            <div class="connection-status">Secure Connection 🔒</div>
                        </div>
                        <div class="call-timer">Session: ${formatTime(callDuration)}</div>
                    </div>
                `;
            }
        }, 2000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const endVideoCall = () => {
        if (window.confirm('Are you sure you want to end the video session?')) {
            setVideoSessionActive(false);
            setCounselorConnected(false);
            
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            
            // Reinitialize media for future calls
            initializeMedia();
            
            // Reset remote video
            if (remoteVideoRef.current) {
                remoteVideoRef.current.innerHTML = `
                    <div class="video-placeholder">
                        <div class="placeholder-icon">👨‍⚕️</div>
                        <div>Counselor disconnected</div>
                    </div>
                `;
            }
            
            alert('Video session ended. Support resources remain available.');
        }
    };

    const confirmSafety = () => {
        setSafetyCheckActive(false);
        setCountdown(60);
        WebSocketService.socket.emit('safety_confirmed', { userId });
        alert('Thank you for confirming your safety. Support resources remain available.');
    };

    const shareLocation = async () => {
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                await APIService.shareLocation(userId, location);
                setLocationShared(true);
                alert('📍 Your location has been shared with emergency services and trusted contacts.');
            } catch (error) {
                console.error('Error getting location:', error);
                // Simulate success for demo
                setLocationShared(true);
                alert('📍 Location shared successfully! (Demo mode)');
            }
        } else {
            // Simulate success for demo
            setLocationShared(true);
            alert('📍 Location shared successfully! (Demo mode)');
        }
    };

    const contactEmergencyServices = () => {
        if (window.confirm('🚨 This will call emergency services (911). Are you in immediate danger?')) {
            // In a real app, this would be: window.location.href = 'tel:911';
            alert('📞 Calling emergency services... (Demo mode)\n\nIn a real app, this would open your phone dialer with 911.');
        }
    };

    const contactHotline = (number, name) => {
        if (window.confirm(`Call ${name} at ${number}?`)) {
            // In a real app, this would be: window.location.href = `tel:${number}`;
            alert(`📞 Calling ${name}... (Demo mode)\n\nNumber: ${number}\n\nIn a real app, this would open your phone dialer.`);
        }
    };

    const formatPhoneNumber = (phone) => {
        // Simple formatting for display
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    };

    return (
        <div className={`emergency-intervention ${crisisLevel.toLowerCase()}`}>
            <div className="emergency-header">
                <div className="emergency-alert">
                    <div className="alert-icon">🚨</div>
                    <div className="alert-content">
                        <h3>Immediate Support Available</h3>
                        <div className="crisis-level">Crisis Level: {crisisLevel}</div>
                    </div>
                </div>
            </div>

            {/* Video Call Interface */}
            {videoSessionActive && (
                <div className="video-call-interface">
                    <div className="video-call-header">
                        <h4>🔒 Secure Video Session with Counselor</h4>
                        <div className="call-status">
                            <span className="status-indicator"></span>
                            Connected • {formatTime(callDuration)}
                        </div>
                    </div>
                    
                    <div className="video-container">
                        <div className="video-wrapper remote-video">
                            <div className="video-label">Dr. Sarah Mitchell - Crisis Counselor</div>
                            <div 
                                ref={remoteVideoRef}
                                className="video-element"
                            >
                                <div className="video-placeholder">
                                    <div className="placeholder-icon">👨‍⚕️</div>
                                    <div>Connecting to counselor...</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="video-wrapper local-video">
                            <div className="video-label">You {!isVideoEnabled && '(Video Off)'}</div>
                            <video 
                                ref={localVideoRef}
                                autoPlay 
                                muted 
                                className="video-element"
                                style={!isVideoEnabled ? { display: 'none' } : {}}
                            />
                            {!isVideoEnabled && (
                                <div className="video-off-placeholder">
                                    <div className="video-off-icon">📹</div>
                                    <div>Your video is off</div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="video-controls">
                        <button 
                            className={`control-btn ${isAudioEnabled ? '' : 'muted'}`}
                            onClick={toggleAudio}
                            title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                        >
                            {isAudioEnabled ? '🎤' : '🎤❌'}
                            <span className="control-label">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                        </button>
                        
                        <button 
                            className={`control-btn ${isVideoEnabled ? '' : 'disabled'}`}
                            onClick={toggleVideo}
                            title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                        >
                            {isVideoEnabled ? '📹' : '📹❌'}
                            <span className="control-label">{isVideoEnabled ? 'Video Off' : 'Video On'}</span>
                        </button>
                        
                        <button 
                            className="control-btn end-call"
                            onClick={endVideoCall}
                            title="End Call"
                        >
                            📞❌
                            <span className="control-label">End Call</span>
                        </button>
                    </div>

                    <div className="call-notes">
                        <p>💬 <strong>Counselor Note:</strong> "I'm here to listen and help. You're not alone in this."</p>
                    </div>
                </div>
            )}

            {/* Regular Emergency Interface (when video is not active) */}
            {!videoSessionActive && (
                <>
                    {/* Navigation Tabs */}
                    <div className="emergency-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
                            onClick={() => setActiveTab('resources')}
                        >
                            📞 Emergency Resources
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'counselor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('counselor')}
                        >
                            👨‍⚕️ Professional Help
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contacts')}
                        >
                            👥 Trusted Contacts
                        </button>
                    </div>

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                        <div className="emergency-tab-content">
                            <div className="emergency-actions-grid">
                                <button 
                                    className="emergency-btn primary"
                                    onClick={contactEmergencyServices}
                                >
                                    🚑 Call Emergency Services (911)
                                </button>
                                
                                <button 
                                    className="emergency-btn secondary"
                                    onClick={() => contactHotline('1-800-273-8255', 'Suicide Prevention Lifeline')}
                                >
                                    📞 Suicide Prevention Lifeline
                                </button>
                                
                                <button 
                                    className="emergency-btn secondary"
                                    onClick={shareLocation}
                                    disabled={locationShared}
                                >
                                    📍 {locationShared ? 'Location Shared' : 'Share My Location'}
                                </button>
                            </div>

                            <div className="hotline-grid">
                                <div className="hotline-card">
                                    <h4>National Suicide Prevention Lifeline</h4>
                                    <p>1-800-273-8255</p>
                                    <p className="hotline-desc">24/7 free and confidential support</p>
                                    <button 
                                        className="call-btn"
                                        onClick={() => contactHotline('1-800-273-8255', 'Suicide Prevention Lifeline')}
                                    >
                                        Call Now
                                    </button>
                                </div>
                                
                                <div className="hotline-card">
                                    <h4>Crisis Text Line</h4>
                                    <p>Text HOME to 741741</p>
                                    <p className="hotline-desc">Free 24/7 crisis counseling via text</p>
                                    <button 
                                        className="call-btn"
                                        onClick={() => alert('📱 In a real app, this would open your messaging app with "HOME" ready to send to 741741.')}
                                    >
                                        Text Now
                                    </button>
                                </div>
                                
                                <div className="hotline-card">
                                    <h4>Disaster Distress Helpline</h4>
                                    <p>1-800-985-5990</p>
                                    <p className="hotline-desc">Immediate crisis counseling for disasters</p>
                                    <button 
                                        className="call-btn"
                                        onClick={() => contactHotline('1-800-985-5990', 'Disaster Distress Helpline')}
                                    >
                                        Call Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Counselor Tab */}
                    {activeTab === 'counselor' && (
                        <div className="emergency-tab-content">
                            <div className="counselor-section">
                                <div className="counselor-info">
                                    <div className="counselor-avatar">👨‍⚕️</div>
                                    <div className="counselor-details">
                                        <h4>Connect with Licensed Counselor</h4>
                                        <p>24/7 professional mental health support</p>
                                        <div className="features-list">
                                            <span>✓ Secure video session</span>
                                            <span>✓ Confidential & private</span>
                                            <span>✓ Immediate assistance</span>
                                            <span>✓ Licensed professionals</span>
                                        </div>
                                    </div>
                                </div>

                                {!counselorConnected ? (
                                    <button 
                                        className="counselor-connect-btn"
                                        onClick={connectWithCounselor}
                                        disabled={isConnecting}
                                    >
                                        {isConnecting ? (
                                            <>
                                                <div className="connecting-spinner"></div>
                                                Connecting with Counselor...
                                            </>
                                        ) : (
                                            'Start Secure Video Session'
                                        )}
                                    </button>
                                ) : (
                                    <div className="connection-success">
                                        <div className="success-icon">✅</div>
                                        <div>
                                            <h4>Connected with Counselor</h4>
                                            <p>Your secure video session is active. Help is here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="safety-section">
                                <h4>Your Safety is Important</h4>
                                {safetyCheckActive && (
                                    <div className="safety-check">
                                        <p>We haven't heard from you. Emergency contacts will be notified in:</p>
                                        <div className="countdown-timer">{countdown}s</div>
                                        <button className="safety-confirm-btn" onClick={confirmSafety}>
                                            I'm Safe - Stop Countdown
                                        </button>
                                    </div>
                                )}
                                {!safetyCheckActive && crisisLevel === 'HIGH' && (
                                    <div className="safety-reminder">
                                        <p>⚠️ Your crisis level is high. Please consider connecting with a counselor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contacts Tab */}
                    {activeTab === 'contacts' && (
                        <div className="emergency-tab-content">
                            <div className="contacts-section">
                                <h4>Your Emergency Contacts</h4>
                                {emergencyContacts.length > 0 ? (
                                    <div className="contacts-list">
                                        {emergencyContacts.map((contact, index) => (
                                            <div key={index} className="contact-card">
                                                <div className="contact-avatar">
                                                    {contact.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="contact-info">
                                                    <h5>{contact.name}</h5>
                                                    <p>{contact.relationship}</p>
                                                    <span className="contact-phone">{formatPhoneNumber(contact.phone)}</span>
                                                </div>
                                                <button 
                                                    className="contact-call-btn"
                                                    onClick={() => contactHotline(contact.phone, contact.name)}
                                                    title={`Call ${contact.name}`}
                                                >
                                                    📞
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-contacts">
                                        <p>No emergency contacts set up yet.</p>
                                        <button className="add-contacts-btn">
                                            Add Emergency Contacts
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="location-sharing">
                                <h4>Location Sharing</h4>
                                <p>Share your location with trusted contacts for immediate assistance.</p>
                                <button 
                                    className={`location-btn ${locationShared ? 'shared' : ''}`}
                                    onClick={shareLocation}
                                >
                                    {locationShared ? '✅ Location Shared' : '📍 Share My Location'}
                                </button>
                                {locationShared && (
                                    <p className="location-note">Your location has been shared with emergency contacts.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Grounding Exercise - Always visible */}
                    {!videoSessionActive && (
                        <div className="grounding-exercise">
                            <h4>🔄 Quick Grounding Technique</h4>
                            <div className="grounding-steps">
                                <div className="grounding-step">
                                    <span className="step-number">5</span>
                                    <span className="step-text">things you can see</span>
                                </div>
                                <div className="grounding-step">
                                    <span className="step-number">4</span>
                                    <span className="step-text">things you can touch</span>
                                </div>
                                <div className="grounding-step">
                                    <span className="step-number">3</span>
                                    <span className="step-text">things you can hear</span>
                                </div>
                                <div className="grounding-step">
                                    <span className="step-number">2</span>
                                    <span className="step-text">things you can smell</span>
                                </div>
                                <div className="grounding-step">
                                    <span className="step-number">1</span>
                                    <span className="step-text">thing you can taste</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Emergency Instructions */}
                    {!videoSessionActive && (
                        <div className="emergency-instructions">
                            <h4>Important Instructions</h4>
                            <ul>
                                <li>You are not alone - help is available 24/7</li>
                                <li>Stay on the line when calling emergency services</li>
                                <li>If you're in immediate danger, call 911 first</li>
                                <li>Your safety is the most important thing</li>
                                <li>Breathing exercises can help in moments of crisis</li>
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EmergencyIntervention;