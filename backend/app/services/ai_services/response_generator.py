# backend/app/services/ai_services/response_generator.py
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import json
import random

class ResponseGenerator:
    def __init__(self):
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        self.conversational_ai = pipeline("conversational")
        self.tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-medium")
        self.model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-medium")
        
        self.response_templates = self._load_response_templates()
    
    def generate_response(self, user_message, emotion_context, user_id):
        # Analyze sentiment and emotion
        sentiment = self.sentiment_analyzer(user_message)[0]
        dominant_emotion = emotion_context.get('dominant_emotion', 'neutral')
        intensity = emotion_context.get('intensity', 0.5)
        
        # Determine response strategy
        strategy = self._select_response_strategy(sentiment, dominant_emotion, intensity)
        
        # Generate appropriate response
        if strategy == 'crisis_intervention':
            response = self._generate_crisis_response(user_message, emotion_context)
        elif strategy == 'emotional_support':
            response = self._generate_emotional_support_response(user_message, emotion_context)
        elif strategy == 'practical_advice':
            response = self._generate_practical_advice(user_message, emotion_context)
        else:
            response = self._generate_general_response(user_message, emotion_context)
        
        # Add follow-up questions
        response['follow_up_questions'] = self._generate_follow_up_questions(
            dominant_emotion, intensity
        )
        
        return response
    
    def _select_response_strategy(self, sentiment, emotion, intensity):
        if intensity > 0.8 and emotion in ['sad', 'angry', 'fear']:
            return 'crisis_intervention'
        elif sentiment['label'] == 'NEGATIVE' or emotion in ['sad', 'anxious']:
            return 'emotional_support'
        elif emotion in ['neutral', 'happy']:
            return 'practical_advice'
        else:
            return 'general'
    
    def _generate_crisis_response(self, user_message, emotion_context):
        crisis_responses = [
            "I hear that you're going through something really difficult right now. You're not alone.",
            "That sounds incredibly challenging. I'm here with you.",
            "I can sense you're in a lot of pain. Would you like to talk about what's happening?"
        ]
        
        return {
            'text': random.choice(crisis_responses),
            'type': 'crisis_support',
            'suggest_exercise': True,
            'exercise_type': 'grounding',
            'crisis_level': 'HIGH'
        }
    
    def _generate_emotional_support_response(self, user_message, emotion_context):
        support_responses = {
            'sad': [
                "It's okay to feel sad. These feelings are valid and important.",
                "Would you like to share more about what's making you feel this way?",
                "Sometimes just acknowledging the sadness can be a first step toward healing."
            ],
            'anxious': [
                "Anxiety can feel overwhelming. Let's try to break this down together.",
                "What you're feeling is your body's way of trying to protect you.",
                "Let's focus on your breathing for a moment. In... and out..."
            ]
        }
        
        emotion = emotion_context.get('dominant_emotion', 'sad')
        responses = support_responses.get(emotion, support_responses['sad'])
        
        return {
            'text': random.choice(responses),
            'type': 'emotional_support',
            'suggest_exercise': True,
            'exercise_type': 'breathing'
        }