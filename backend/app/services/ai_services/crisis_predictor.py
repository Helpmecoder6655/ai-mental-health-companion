# backend/app/services/ai_services/crisis_predictor.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from transformers import pipeline
import numpy as np

class CrisisPredictor:
    def __init__(self):
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        self.suicide_risk_classifier = pipeline(
            "text-classification", 
            model="mental-health-classifier"
        )
        self.ml_model = RandomForestClassifier()
        
    def analyze_text_crisis(self, text_input, user_history):
        """Analyze text for crisis indicators"""
        # Sentiment analysis
        sentiment = self.sentiment_analyzer(text_input)[0]
        
        # Suicide risk detection
        risk_assessment = self.suicide_risk_classifier(text_input)[0]
        
        # Pattern matching for crisis keywords
        crisis_keywords = ['suicide', 'kill myself', 'end it all', 'want to die']
        keyword_alert = any(keyword in text_input.lower() for keyword in crisis_keywords)
        
        crisis_level = self._calculate_crisis_level(
            sentiment, 
            risk_assessment, 
            keyword_alert,
            user_history
        )
        
        return {
            'crisis_level': crisis_level,
            'sentiment': sentiment,
            'risk_assessment': risk_assessment,
            'immediate_action_required': crisis_level in ['HIGH', 'SEVERE'],
            'recommended_intervention': self._get_intervention_protocol(crisis_level)
        }
    
    def predict_mood_trends(self, user_data):
        """Predict future mood trends using ML"""
        features = self._extract_features(user_data)
        prediction = self.ml_model.predict(features)
        
        return {
            'predicted_mood': prediction[0],
            'confidence': self.ml_model.predict_proba(features).max(),
            'trend_direction': 'improving' if prediction[0] > user_data[-1] else 'declining'
        }