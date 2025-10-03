# backend/app/controllers/therapyController.py
from flask import request, jsonify
from app.services.ai_services.response_generator import ResponseGenerator
import json
import random

class TherapyController:
    def __init__(self):
        self.response_generator = ResponseGenerator()
        self.exercises = self._load_therapy_exercises()
    
    def chat_with_ai_therapist(self):
        try:
            data = request.get_json()
            user_message = data.get('message')
            user_id = data.get('user_id')
            emotion_context = data.get('emotion_context', {})
            
            # Generate AI response based on emotion context
            ai_response = self.response_generator.generate_response(
                user_message, 
                emotion_context,
                user_id
            )
            
            # Store conversation
            self._store_conversation(user_id, user_message, ai_response)
            
            # Check if exercise is recommended
            recommended_exercise = None
            if ai_response.get('suggest_exercise', False):
                recommended_exercise = self._get_recommended_exercise(emotion_context)
            
            return jsonify({
                'success': True,
                'response': ai_response['text'],
                'response_type': ai_response['type'],
                'recommended_exercise': recommended_exercise,
                'crisis_level': ai_response.get('crisis_level', 'LOW'),
                'follow_up_questions': ai_response.get('follow_up_questions', [])
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def get_breathing_exercise(self):
        try:
            data = request.get_json()
            duration = data.get('duration', 5)  # minutes
            difficulty = data.get('difficulty', 'beginner')
            
            exercise = self.exercises['breathing'][difficulty]
            exercise['duration'] = duration
            
            return jsonify({
                'success': True,
                'exercise': exercise,
                'instructions': self._generate_breathing_instructions(duration)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def get_meditation_session(self):
        try:
            data = request.get_json()
            theme = data.get('theme', 'mindfulness')
            duration = data.get('duration', 10)
            
            meditation = self.exercises['meditation'][theme]
            meditation['duration'] = duration
            
            return jsonify({
                'success': True,
                'meditation': meditation,
                'audio_url': self._get_meditation_audio(theme, duration)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def get_journaling_prompts(self):
        try:
            emotion = request.args.get('emotion', 'general')
            prompts = self.exercises['journaling'][emotion]
            
            return jsonify({
                'success': True,
                'prompts': random.sample(prompts, 3)  # Return 3 random prompts
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def _load_therapy_exercises(self):
        return {
            'breathing': {
                'beginner': {
                    'name': '4-7-8 Breathing',
                    'description': 'Calming breathing technique for stress relief',
                    'pattern': [4, 7, 8],  # inhale, hold, exhale
                    'cycles': 10
                },
                'intermediate': {
                    'name': 'Box Breathing',
                    'description': 'Military technique for focus and calm',
                    'pattern': [4, 4, 4, 4],  # inhale, hold, exhale, hold
                    'cycles': 12
                }
            },
            'meditation': {
                'mindfulness': {
                    'name': 'Mindfulness Meditation',
                    'description': 'Focus on present moment awareness'
                },
                'loving_kindness': {
                    'name': 'Loving Kindness Meditation',
                    'description': 'Cultivate compassion for self and others'
                },
                'body_scan': {
                    'name': 'Body Scan Meditation',
                    'description': 'Progressive relaxation through body awareness'
                }
            },
            'journaling': {
                'anxiety': [
                    "What's causing your anxiety right now?",
                    "What evidence supports your worried thoughts?",
                    "What would you tell a friend with these worries?"
                ],
                'depression': [
                    "What small thing brought you joy today?",
                    "What are you grateful for right now?",
                    "What would you like to accomplish this week?"
                ],
                'anger': [
                    "What triggered your anger?",
                    "How does your body feel when angry?",
                    "What's a constructive way to express this feeling?"
                ]
            }
        }