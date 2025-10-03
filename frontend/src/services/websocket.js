class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.eventCallbacks = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        try {
            // For demo purposes, simulate WebSocket connection
            console.log('WebSocket: Simulating connection (backend not required)');
            this.isConnected = true;
            
            // Simulate successful connection
            setTimeout(() => {
                this.emitEvent('connected', { message: 'Connected to Mental Health Companion', status: 'active' });
            }, 1000);
            
        } catch (error) {
            console.log('WebSocket: Running in demo mode - backend connection not required');
            this.isConnected = true;
        }
    }

    disconnect() {
        this.isConnected = false;
        this.reconnectAttempts = 0;
        console.log('WebSocket disconnected');
    }

    // Event handling
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emitEvent(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in WebSocket event handler for ${event}:`, error);
                }
            });
        }
    }

    // Emit events to server (simulated for demo)
    emit(event, data) {
        console.log(`WebSocket: Emitting ${event}`, data);
        
        // Simulate server responses for demo
        if (event === 'start_emotion_tracking') {
            setTimeout(() => {
                this.emitEvent('tracking_started', { 
                    user_id: data.userId, 
                    status: 'active',
                    message: 'Real-time emotion tracking started'
                });
            }, 500);
        }
    }

    // Demo method to simulate real-time emotion updates
    startDemoEmotionStream(userId, callback) {
        console.log('Starting demo emotion stream for user:', userId);
        
        const emotions = ['happy', 'sad', 'neutral', 'angry', 'surprised'];
        let interval;
        
        const sendEmotion = () => {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            const intensity = 0.3 + Math.random() * 0.5; // 0.3 to 0.8
            
            const emotionData = {
                emotion: emotion,
                intensity: intensity,
                confidence: 0.7 + Math.random() * 0.3, // 0.7 to 1.0
                timestamp: new Date().toISOString(),
                userId: userId
            };
            
            callback(emotionData);
        };
        
        // Send emotion every 3 seconds
        interval = setInterval(sendEmotion, 3000);
        
        // Return function to stop the stream
        return () => {
            clearInterval(interval);
            console.log('Demo emotion stream stopped');
        };
    }
}

export default new WebSocketService();