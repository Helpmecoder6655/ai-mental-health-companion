# backend/app/controllers/analyticsController.py
from flask import request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

class AnalyticsController:
    def __init__(self):
        self.mood_model = RandomForestRegressor()
    
    def get_user_analytics(self):
        try:
            user_id = request.args.get('user_id')
            timeframe = request.args.get('timeframe', '7d')  # 7d, 30d, 90d
            
            # Get user data
            user_data = self._get_user_data(user_id, timeframe)
            
            analytics = {
                'mood_trends': self._calculate_mood_trends(user_data),
                'session_effectiveness': self._calculate_session_effectiveness(user_data),
                'crisis_patterns': self._identify_crisis_patterns(user_data),
                'progress_metrics': self._calculate_progress_metrics(user_data),
                'personalized_insights': self._generate_insights(user_data)
            }
            
            return jsonify({
                'success': True,
                'analytics': analytics,
                'timeframe': timeframe
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def predict_mood_forecast(self):
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            days = data.get('days', 7)
            
            # Get historical data
            historical_data = self._get_historical_mood_data(user_id)
            
            if len(historical_data) < 7:
                return jsonify({
                    'success': False,
                    'message': 'Insufficient data for prediction'
                }), 400
            
            # Prepare features for prediction
            features = self._prepare_prediction_features(historical_data)
            
            # Train model if needed
            if not hasattr(self, 'trained_models'):
                self.trained_models = {}
            
            if user_id not in self.trained_models:
                self.trained_models[user_id] = self._train_mood_model(historical_data)
            
            # Make predictions
            predictions = self._predict_future_mood(
                self.trained_models[user_id], 
                features, 
                days
            )
            
            return jsonify({
                'success': True,
                'predictions': predictions,
                'confidence': self._calculate_prediction_confidence(historical_data)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def get_wellness_score(self):
        try:
            user_id = request.args.get('user_id')
            
            # Calculate comprehensive wellness score
            wellness_data = self._get_wellness_data(user_id)
            
            score = self._calculate_wellness_score(wellness_data)
            
            return jsonify({
                'success': True,
                'wellness_score': score,
                'breakdown': {
                    'emotional_health': wellness_data.get('emotional_score', 0),
                    'behavioral_health': wellness_data.get('behavioral_score', 0),
                    'social_health': wellness_data.get('social_score', 0),
                    'physical_health': wellness_data.get('physical_score', 0)
                },
                'recommendations': self._get_wellness_recommendations(score)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500