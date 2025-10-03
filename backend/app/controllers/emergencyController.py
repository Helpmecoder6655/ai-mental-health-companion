# backend/app/controllers/emergencyController.py
from flask import request, jsonify
from app.services.integrations.counselor_api import CounselorService
from app.services.integrations.emergency_services import EmergencyService
import threading
import time

class EmergencyController:
    def __init__(self):
        self.counselor_service = CounselorService()
        self.emergency_service = EmergencyService()
        self.active_crises = {}
    
    def trigger_emergency_protocol(self):
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            crisis_level = data.get('crisis_level', 'HIGH')
            location = data.get('location', {})
            emotion_data = data.get('emotion_data', {})
            
            # Store crisis event
            crisis_id = self._store_crisis_event(user_id, crisis_level, emotion_data)
            
            # Immediate actions based on crisis level
            response = {
                'crisis_id': crisis_id,
                'actions_taken': [],
                'resources_provided': []
            }
            
            if crisis_level in ['HIGH', 'SEVERE']:
                # Connect to live counselor immediately
                counselor_connection = self.counselor_service.connect_immediate_counselor(user_id)
                response['actions_taken'].append('counselor_connected')
                response['counselor'] = counselor_connection
                
                # Notify emergency contacts
                self._notify_emergency_contacts(user_id, crisis_level)
                response['actions_taken'].append('contacts_notified')
                
                # Provide crisis resources
                resources = self._get_crisis_resources(location)
                response['resources_provided'] = resources
                
                # Start safety check protocol
                self._start_safety_protocol(user_id, crisis_id)
                
            elif crisis_level == 'MODERATE':
                # Schedule counselor callback
                callback = self.counselor_service.schedule_callback(user_id)
                response['counselor_callback'] = callback
                
                # Provide self-help resources
                resources = self._get_self_help_resources(emotion_data)
                response['resources_provided'] = resources
            
            return jsonify({
                'success': True,
                'emergency_response': response
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def connect_live_counselor(self):
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            preference = data.get('preference', 'any')  # 'male', 'female', 'any'
            
            # Find available counselor matching preference
            counselor = self.counselor_service.find_available_counselor(preference)
            
            if counselor:
                # Establish connection
                connection = self.counselor_service.establish_connection(user_id, counselor)
                
                return jsonify({
                    'success': True,
                    'counselor': counselor,
                    'connection_details': connection
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'No counselors available. Please try again in few minutes.'
                }), 503
                
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def panic_button(self):
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            
            # Immediate highest priority response
            response = self.trigger_emergency_protocol()
            
            # Additionally, send immediate alerts
            self._send_immediate_alerts(user_id)
            
            # Start location tracking for safety
            self._activate_location_tracking(user_id)
            
            return jsonify({
                'success': True,
                'message': 'Emergency response activated',
                'immediate_help_contacted': True,
                'stay_on_line': True
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    def _start_safety_protocol(self, user_id, crisis_id):
        """Start automated safety checking"""
        def safety_check():
            for i in range(6):  # Check for 30 minutes
                time.sleep(300)  # 5 minutes
                if not self._confirm_safety(user_id):
                    # Escalate emergency
                    self._escalate_emergency(user_id, crisis_id)
        
        thread = threading.Thread(target=safety_check)
        thread.daemon = True
        thread.start()