import React, { useState, useRef, useEffect } from 'react';
import APIService from '../../services/api';
import './ChatInterface.css';

const ChatInterface = ({ user, currentEmotions }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize session and welcome message
    useEffect(() => {
        const sessionId = APIService.startNewSession(user.id);
        setCurrentSession(sessionId);
        
        setMessages([{
            id: 1,
            text: "Hello! I'm your AI mental health companion. I'm here to listen, support, and help you navigate whatever you're going through. How are you feeling today?",
            sender: 'ai',
            timestamp: new Date().toISOString(),
            isDemo: false,
            sessionId: sessionId
        }]);
    }, [user.id]);

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date().toISOString(),
            isDemo: false,
            sessionId: currentSession
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await APIService.chatWithAI(inputMessage, user.id, currentEmotions);
            
            // Check if we're in demo mode
            if (response.demo_mode && !isDemoMode) {
                setIsDemoMode(true);
            }
            
            if (response.success) {
                const aiMessage = {
                    id: Date.now() + 1,
                    text: response.response,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    suggestExercise: response.suggest_exercise,
                    emotionDetected: response.emotion_detected,
                    followUp: response.follow_up,
                    exerciseType: response.exercise_type,
                    isDemo: response.demo_mode || false,
                    sessionId: response.session_id || currentSession
                };
                
                setMessages(prev => [...prev, aiMessage]);
            } else {
                // Handle API error but still show response
                const errorMessage = {
                    id: Date.now() + 1,
                    text: response.response || "I'm here to listen. Please tell me more about how you're feeling.",
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    isDemo: true,
                    sessionId: currentSession
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsDemoMode(true);
            }
        } catch (error) {
            console.error('Chat error:', error);
            // Use enhanced fallback response
            const fallbackResponse = APIService.getEnhancedFallbackChatResponse({ message: inputMessage });
            const fallbackMessage = {
                id: Date.now() + 1,
                text: fallbackResponse.response,
                sender: 'ai',
                timestamp: new Date().toISOString(),
                suggestExercise: fallbackResponse.suggest_exercise,
                emotionDetected: fallbackResponse.emotion_detected,
                followUp: fallbackResponse.follow_up,
                exerciseType: fallbackResponse.exercise_type,
                isDemo: true,
                sessionId: currentSession
            };
            setMessages(prev => [...prev, fallbackMessage]);
            setIsDemoMode(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const startExercise = async (exerciseType = 'breathing') => {
        try {
            const response = await APIService.getBreathingExercise(exerciseType);
            if (response.success) {
                const exerciseMessage = {
                    id: Date.now(),
                    text: `Let's try the "${response.exercise.name}" exercise. ${response.exercise.description}`,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    exerciseDetails: response.exercise,
                    isDemo: response.demo_mode || false,
                    sessionId: currentSession
                };
                setMessages(prev => [...prev, exerciseMessage]);
                
                // Add instructions as separate messages for better readability
                const instructionMessage = {
                    id: Date.now() + 1,
                    text: "Follow these steps:\n• " + response.exercise.instructions.join('\n• '),
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    isDemo: response.demo_mode || false,
                    sessionId: currentSession
                };
                setMessages(prev => [...prev, instructionMessage]);

                // Add benefits information
                const benefitsMessage = {
                    id: Date.now() + 2,
                    text: `Benefits: ${response.exercise.benefits.join(', ')}. Duration: ${response.exercise.duration} minutes.`,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    isDemo: response.demo_mode || false,
                    sessionId: currentSession
                };
                setMessages(prev => [...prev, benefitsMessage]);
            }
        } catch (error) {
            console.error('Exercise error:', error);
        }
    };

    const handleFollowUp = (followUpText) => {
        const followUpMessage = {
            id: Date.now(),
            text: followUpText,
            sender: 'user',
            timestamp: new Date().toISOString(),
            isDemo: false,
            sessionId: currentSession
        };
        setMessages(prev => [...prev, followUpMessage]);
        // Automatically send the follow-up message
        setTimeout(() => {
            sendFollowUpMessage(followUpText);
        }, 500);
    };

    const sendFollowUpMessage = async (messageText) => {
        setIsLoading(true);
        try {
            const response = await APIService.chatWithAI(messageText, user.id, currentEmotions);
            
            if (response.demo_mode && !isDemoMode) {
                setIsDemoMode(true);
            }
            
            if (response.success) {
                const aiMessage = {
                    id: Date.now() + 1,
                    text: response.response,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    suggestExercise: response.suggest_exercise,
                    emotionDetected: response.emotion_detected,
                    followUp: response.follow_up,
                    exerciseType: response.exercise_type,
                    isDemo: response.demo_mode || false,
                    sessionId: response.session_id || currentSession
                };
                
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error('Follow-up chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        const newSessionId = APIService.startNewSession(user.id);
        setCurrentSession(newSessionId);
        setMessages([{
            id: 1,
            text: "Hello! I've started a new conversation. I'm here to listen and support you. What would you like to talk about today?",
            sender: 'ai',
            timestamp: new Date().toISOString(),
            isDemo: false,
            sessionId: newSessionId
        }]);
        setIsDemoMode(false);
    };

    const getEmotionColor = (emotion) => {
        const colors = {
            happy: '#4ecdc4',
            sad: '#45b7d1',
            angry: '#ff6b6b',
            anxious: '#feca57',
            neutral: '#95a5a6',
            fearful: '#ff9ff3',
            surprised: '#a29bfe'
        };
        return colors[emotion] || '#95a5a6';
    };

    const getQuickReplies = () => {
        return [
            "I'm feeling anxious",
            "I'm having a rough day",
            "I can't sleep well",
            "I'm feeling lonely",
            "Work is stressing me out",
            "I need coping strategies"
        ];
    };

    const handleQuickReply = (reply) => {
        setInputMessage(reply);
        // Auto-send after a brief delay
        setTimeout(() => {
            sendMessage();
        }, 100);
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <div className="header-content">
                    <h2>AI Mental Health Companion</h2>
                    <p>Your compassionate support system • Session: {currentSession?.substring(0, 8)}</p>
                    {isDemoMode && (
                        <div className="demo-mode-indicator">
                            🎭 Demo Mode - Enhanced responses active
                        </div>
                    )}
                </div>
                <div className="header-actions">
                    <button 
                        className="clear-chat-btn"
                        onClick={clearChat}
                        title="Start new conversation"
                    >
                        🗑️ New Chat
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.sender}`}>
                        <div className={`message-bubble ${message.isDemo ? 'demo-message' : ''}`}>
                            <div className="message-content">
                                <p>{message.text}</p>
                                {message.isDemo && (
                                    <div className="demo-badge">Demo Response</div>
                                )}
                            </div>
                            <span className="timestamp">
                                {new Date(message.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </span>
                        </div>
                        
                        {message.emotionDetected && (
                            <div 
                                className="emotion-badge"
                                style={{ 
                                    borderColor: getEmotionColor(message.emotionDetected.emotion),
                                    backgroundColor: getEmotionColor(message.emotionDetected.emotion) + '20'
                                }}
                            >
                                <span className="emotion-label">
                                    {message.emotionDetected.emotion}
                                </span>
                                <span className="confidence">
                                    {(message.emotionDetected.confidence * 100).toFixed(0)}% confidence
                                </span>
                            </div>
                        )}
                        
                        {message.suggestExercise && (
                            <div className="exercise-suggestion">
                                <div className="suggestion-content">
                                    <span className="suggestion-icon">💡</span>
                                    <span className="suggestion-text">
                                        Would you like to try a {message.exerciseType || 'breathing'} exercise?
                                    </span>
                                    <button 
                                        className="try-exercise-btn"
                                        onClick={() => startExercise(message.exerciseType)}
                                    >
                                        Try Exercise
                                    </button>
                                </div>
                            </div>
                        )}

                        {message.followUp && (
                            <div className="follow-up-suggestion">
                                <div className="follow-up-content">
                                    <span className="follow-up-text">{message.followUp}</span>
                                    <button 
                                        className="follow-up-btn"
                                        onClick={() => handleFollowUp("Yes, let's explore that")}
                                    >
                                        Yes
                                    </button>
                                    <button 
                                        className="follow-up-btn secondary"
                                        onClick={() => handleFollowUp("Not right now, thanks")}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        )}

                        {message.exerciseDetails && (
                            <div className="exercise-details">
                                <div className="exercise-header">
                                    <strong>{message.exerciseDetails.name}</strong>
                                    <span className="exercise-duration">
                                        {message.exerciseDetails.duration} min
                                    </span>
                                </div>
                                <div className="exercise-benefits">
                                    <strong>Benefits:</strong> {message.exerciseDetails.benefits?.join(', ')}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message ai">
                        <div className="message-bubble loading">
                            <div className="typing-indicator">
                                <span>AI companion is thinking</span>
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} className="scroll-anchor" />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && (
                <div className="quick-replies">
                    <div className="quick-replies-label">Quick starters:</div>
                    <div className="quick-replies-buttons">
                        {getQuickReplies().map((reply, index) => (
                            <button
                                key={index}
                                className="quick-reply-btn"
                                onClick={() => handleQuickReply(reply)}
                                disabled={isLoading}
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="chat-input-container">
                <div className="chat-input-wrapper">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Share your thoughts, feelings, or concerns... (Press Enter to send)"
                        rows="1"
                        disabled={isLoading}
                        className="chat-textarea"
                    />
                    <button 
                        onClick={sendMessage} 
                        disabled={!inputMessage.trim() || isLoading}
                        className={`send-button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <div className="send-button-loading">
                                <div className="loading-spinner"></div>
                            </div>
                        ) : (
                            'Send'
                        )}
                    </button>
                </div>
                <div className="input-hint">
                    💡 You can talk about emotions, stress, relationships, sleep, work, or anything on your mind
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;