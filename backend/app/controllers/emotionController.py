# backend/app/controllers/emotionController.py
from flask import request, jsonify
from app.services.ai_services.emotion_detector import AdvancedEmotionDetector
from app.services.ai_services.crisis_predictor import CrisisPredictor
import base64
import cv2
import numpy as np

class EmotionController:
    def __init__(self):
        self.emotion_detector = AdvancedEmotionDetector()
        self.crisis_predictor = CrisisPredictor()
    
    def analyze_text_emotion(self):
        try:
            data = request.get_json()
            text = data.get('text', '')
            user_id = data.get('user_id')
            
            # Get user history for context
            user_history = self._get_user_emotion_history(user_id)
            
            # Analyze text emotion and crisis level
            analysis = self.crisis_predictor.analyze_text_crisis(text, user_history)
            
            # Store analysis in database
            self._store_emotion_analysis(user_id, 'text', analysis)
            
            return jsonify({
                'success': True,
                'analysis': analysis,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def analyze_facial_emotion(self):
        try:
            data = request.get_json()
            image_data = data.get('image')
            user_id = data.get('user_id')
            
            # Convert base64 image to OpenCV format
            image = self._base64_to_image(image_data)
            
            # Save temporary image for analysis
            temp_path = f"temp_{user_id}_{datetime.now().timestamp()}.jpg"
            cv2.imwrite(temp_path, image)
            
            # Analyze facial emotion
            analysis = self.emotion_detector.multi_model_emotion_analysis(temp_path)
            
            # Clean up
            import os
            os.remove(temp_path)
            
            if analysis['success']:
                # Store in database
                self._store_emotion_analysis(user_id, 'facial', analysis)
                
                # Check for crisis
                if analysis['crisis_level'] in ['HIGH', 'SEVERE']:
                    self._trigger_crisis_protocol(user_id, analysis)
            
            return jsonify(analysis)
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def analyze_voice_emotion(self):
        try:
            audio_file = request.files['audio']
            user_id = request.form.get('user_id')
            
            # Save audio file
            audio_path = f"temp_audio_{user_id}_{datetime.now().timestamp()}.wav"
            audio_file.save(audio_path)
            
            # Analyze voice emotion
            analysis = self._analyze_voice_emotion(audio_path)
            
            # Clean up
            import os
            os.remove(audio_path)
            
            return jsonify(analysis)
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def get_combined_emotion_analysis(self):
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            
            # Get all emotion data from last session
            text_emotion = self._get_recent_text_emotion(user_id)
            facial_emotion = self._get_recent_facial_emotion(user_id)
            voice_emotion = self._get_recent_voice_emotion(user_id)
            
            # Combine analyses
            combined_analysis = self._fuse_emotion_modalities(
                text_emotion, facial_emotion, voice_emotion
            )
            
            return jsonify({
                'success': True,
                'combined_analysis': combined_analysis,
                'recommended_actions': self._get_recommended_actions(combined_analysis)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def _base64_to_image(self, base64_string):
        # Convert base64 string to OpenCV image
        encoded_data = base64_string.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)