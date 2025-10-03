from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import json
from datetime import datetime
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Configure CORS properly for all origins and methods
CORS(app, origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"], 
     supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

socketio = SocketIO(app, 
                   cors_allowed_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
                   async_mode='threading')

# Store user sessions (in production, use a database)
user_sessions = {}

class SimpleEmotionDetector:
    def detect_from_text(self, text):
        """Simple keyword-based emotion detection"""
        text_lower = text.lower()
        
        emotion_keywords = {
            'happy': ['happy', 'good', 'great', 'awesome', 'excited', 'joy', 'amazing', 'wonderful', 'fantastic'],
            'sad': ['sad', 'bad', 'terrible', 'depressed', 'unhappy', 'miserable', 'hopeless', 'alone'],
            'angry': ['angry', 'mad', 'frustrated', 'annoyed', 'hate', 'furious', 'upset'],
            'anxious': ['anxious', 'nervous', 'worried', 'stress', 'panic', 'scared', 'afraid', 'overwhelmed']
        }
        
        scores = {emotion: 0 for emotion in emotion_keywords.keys()}
        
        for emotion, keywords in emotion_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[emotion] += 1
        
        if sum(scores.values()) == 0:
            return {'emotion': 'neutral', 'confidence': 0.5}
        
        dominant_emotion = max(scores, key=scores.get)
        confidence = min(scores[dominant_emotion] / 3, 0.9)
        
        return {
            'emotion': dominant_emotion,
            'confidence': confidence,
            'all_scores': scores
        }

# Initialize detector
emotion_detector = SimpleEmotionDetector()

@app.route('/')
def home():
    return jsonify({
        "message": "AI Mental Health Companion API", 
        "status": "running",
        "version": "1.0"
    })

# Handle CORS preflight requests
@app.route('/api/chat', methods=['OPTIONS'])
def handle_chat_options():
    response = jsonify({'status': 'success'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    try:
        data = request.get_json()
        message = data.get('message', '')
        user_id = data.get('user_id', 'anonymous')
        
        if not message:
            return jsonify({'success': False, 'error': 'No message provided'}), 400
        
        # Analyze emotion first
        emotion_result = emotion_detector.detect_from_text(message)
        emotion = emotion_result['emotion']
        
        # Generate appropriate response based on emotion
        responses = {
            'happy': [
                "That's wonderful to hear! 😊 What's making you feel happy today?",
                "I'm glad you're feeling good! Would you like to share what brought you joy?",
                "Happiness is contagious! Tell me more about what's going well for you.",
                "It's great to hear you're feeling positive! What's been the highlight of your day?"
            ],
            'sad': [
                "I'm sorry you're feeling this way. 💙 It's okay to feel sad sometimes. Would you like to talk about what's bothering you?",
                "I hear that you're going through a tough time. Remember that these feelings are temporary. Would a breathing exercise help?",
                "Thank you for sharing how you feel. You're not alone in this. Let's work through it together.",
                "It takes courage to acknowledge sadness. I'm here to listen whenever you're ready to share."
            ],
            'angry': [
                "I can sense you're feeling frustrated. 🧘 Let's take a moment to breathe together.",
                "Anger is a natural emotion. Would you like to try some techniques to help calm those feelings?",
                "I understand you're upset. Let's break this down - what specifically is bothering you?",
                "It's okay to feel angry. Sometimes talking about it can help process those emotions."
            ],
            'anxious': [
                "Anxiety can feel overwhelming. Let's try a grounding exercise together. 🌿",
                "I'm here with you. Let's focus on your breathing - in for 4, hold for 4, out for 4.",
                "It sounds like you're carrying a lot right now. Would you like to try a quick mindfulness exercise?",
                "Anxiety can make everything feel bigger. Let's take it one step at a time together."
            ],
            'neutral': [
                "Thanks for sharing. How are you really feeling today?",
                "I'm here to listen. What's on your mind?",
                "Tell me more about what's going on with you today.",
                "I appreciate you reaching out. What would you like to talk about?"
            ]
        }
        
        ai_response = random.choice(responses.get(emotion, responses['neutral']))
        
        # Determine if we should suggest an exercise
        suggest_exercise = emotion in ['sad', 'angry', 'anxious']
        
        response_data = {
            'success': True,
            'response': ai_response,
            'emotion_detected': emotion_result,
            'suggest_exercise': suggest_exercise,
            'exercise_type': 'breathing' if suggest_exercise else None
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = jsonify({'success': False, 'error': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/exercises/breathing', methods=['GET', 'OPTIONS'])
def get_breathing_exercise():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        exercise_type = request.args.get('type', '478')
        
        exercises = {
            '478': {
                'name': '4-7-8 Breathing',
                'description': 'Calming technique for stress and anxiety relief',
                'instructions': [
                    'Sit comfortably with your back straight',
                    'Place the tip of your tongue against the roof of your mouth',
                    'Exhale completely through your mouth',
                    'Close your mouth and inhale quietly through your nose for 4 seconds',
                    'Hold your breath for 7 seconds',
                    'Exhale completely through your mouth for 8 seconds',
                    'Repeat this cycle 4-5 times'
                ],
                'duration': 5,
                'benefits': ['Reduces anxiety', 'Helps with sleep', 'Calms the nervous system']
            },
            'box': {
                'name': 'Box Breathing',
                'description': 'Military technique for focus and calm',
                'instructions': [
                    'Sit upright in a comfortable position',
                    'Slowly exhale all your air',
                    'Inhale through your nose for 4 seconds',
                    'Hold your breath for 4 seconds',
                    'Exhale through your mouth for 4 seconds',
                    'Hold at the bottom for 4 seconds',
                    'Repeat 5-10 times'
                ],
                'duration': 7,
                'benefits': ['Improves focus', 'Reduces stress', 'Increases alertness']
            }
        }
        
        exercise = exercises.get(exercise_type, exercises['478'])
        
        response = jsonify({
            'success': True,
            'exercise': exercise
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = jsonify({'success': False, 'error': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/emergency/help', methods=['POST', 'OPTIONS'])
def emergency_help():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        crisis_level = data.get('crisis_level', 'moderate')
        
        emergency_resources = {
            'immediate': {
                'message': '🚨 IMMEDIATE HELP IS AVAILABLE',
                'actions': [
                    'Call Emergency Services: 911',
                    'National Suicide Prevention Lifeline: 1-800-273-8255',
                    'Crisis Text Line: Text HOME to 741741'
                ],
                'instructions': 'Please stay on the line. Help is coming.'
            },
            'high': {
                'message': 'You are not alone. Professional help is available.',
                'actions': [
                    'National Suicide Prevention Lifeline: 1-800-273-8255',
                    'Crisis Text Line: Text HOME to 741741',
                    'Emergency Services: 911'
                ],
                'instructions': 'Reach out to one of these resources immediately.'
            },
            'moderate': {
                'message': 'Support is available when you need it.',
                'actions': [
                    'Talk to a trusted friend or family member',
                    'Contact a mental health professional',
                    'Use calming exercises in the app'
                ],
                'instructions': 'You are not alone in this.'
            }
        }
        
        resource = emergency_resources.get(crisis_level, emergency_resources['moderate'])
        
        # Log emergency request
        print(f"EMERGENCY: User {user_id} requested help at level {crisis_level}")
        
        response = jsonify({
            'success': True,
            'emergency_response': resource,
            'timestamp': datetime.now().isoformat()
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = jsonify({'success': False, 'error': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/user/session/<user_id>', methods=['GET', 'OPTIONS'])
def get_user_session(user_id):
    """Get user's emotion history"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        session_data = user_sessions.get(user_id, [])
        response = jsonify({
            'success': True,
            'user_id': user_id,
            'session_count': len(session_data),
            'recent_emotions': session_data[-10:]  # Last 10 entries
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        error_response = jsonify({'success': False, 'error': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

# WebSocket events for real-time features
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    socketio.emit('connected', {'message': 'Connected to Mental Health Companion', 'status': 'active'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('start_emotion_tracking')
def handle_start_tracking(data):
    user_id = data.get('user_id')
    print(f'Starting emotion tracking for user: {user_id}')
    socketio.emit('tracking_started', {'user_id': user_id, 'status': 'active'})

@socketio.on('user_message')
def handle_user_message(data):
    user_id = data.get('user_id')
    message = data.get('message')
    
    # Process message and send AI response via WebSocket
    emotion_result = emotion_detector.detect_from_text(message)
    
    socketio.emit('ai_response', {
        'user_id': user_id,
        'message': message,
        'emotion': emotion_result,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting AI Mental Health Companion Server...")
    print("📍 API running at: http://localhost:5000")
    print("📡 WebSocket server active")
    print("🌐 CORS enabled for: http://localhost:3000, http://localhost:3001")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)