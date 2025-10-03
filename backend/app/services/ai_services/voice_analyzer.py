# backend/app/services/ai_services/voice_analyzer.py
import librosa
import numpy as np
import tensorflow as tf
from sklearn.svm import SVC

class VoiceAnalyzer:
    def __init__(self):
        self.model = self._load_voice_emotion_model()
        self.emotions = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised']
    
    def analyze_voice_emotion(self, audio_path):
        try:
            # Extract audio features
            features = self._extract_audio_features(audio_path)
            
            if features is None:
                return {'success': False, 'error': 'Could not extract audio features'}
            
            # Predict emotion
            prediction = self.model.predict([features])
            confidence = np.max(self.model.predict_proba([features]))
            
            emotion_index = prediction[0]
            emotion = self.emotions[emotion_index]
            
            return {
                'success': True,
                'emotion': emotion,
                'confidence': float(confidence),
                'features': {
                    'pitch_variation': float(features[0]),
                    'speech_rate': float(features[1]),
                    'energy': float(features[2]),
                    'spectral_centroid': float(features[3])
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _extract_audio_features(self, audio_path):
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, sr=22050)
            
            # Extract features
            pitch = librosa.piptrack(y=y, sr=sr)
            pitch_values = pitch[0][pitch[0] > 0]
            
            features = [
                np.std(pitch_values) if len(pitch_values) > 0 else 0,  # Pitch variation
                len(y) / sr,  # Speech rate approximation
                np.mean(librosa.feature.rms(y=y)),  # Energy
                np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))  # Spectral centroid
            ]
            
            return features
            
        except Exception as e:
            print(f"Error extracting audio features: {e}")
            return None
    
    def _load_voice_emotion_model(self):
        # In practice, you would load a pre-trained model
        # For demo, returning a dummy model
        return SVC(probability=True)