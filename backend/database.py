import sqlite3
import json
from datetime import datetime
import os

class MentalHealthDB:
    def __init__(self, db_path='mental_health.db'):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                student_id TEXT,
                age INTEGER,
                emergency_contact_name TEXT,
                emergency_contact_phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_type TEXT NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                duration INTEGER,
                emotion_data TEXT,
                crisis_level TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Chat messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id INTEGER,
                message_text TEXT NOT NULL,
                sender TEXT NOT NULL,
                emotion_detected TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        ''')
        
        # Emotions table for tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS emotion_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                emotion_type TEXT NOT NULL,
                intensity REAL NOT NULL,
                source TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        ''')
        
        # Exercises table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                exercise_type TEXT NOT NULL,
                duration INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                effectiveness INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Emergency events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS emergency_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                crisis_level TEXT NOT NULL,
                triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                action_taken TEXT,
                counselor_contacted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Database initialized successfully!")
    
    def add_user(self, user_data):
        """Add a new user to the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (id, name, email, student_id, age, emergency_contact_name, emergency_contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_data['id'],
            user_data['name'],
            user_data['email'],
            user_data.get('student_id'),
            user_data.get('age'),
            user_data.get('emergency_contact_name'),
            user_data.get('emergency_contact_phone')
        ))
        
        conn.commit()
        conn.close()
        return user_data['id']
    
    def get_user(self, user_id):
        """Get user by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        conn.close()
        
        if user:
            return {
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'student_id': user[3],
                'age': user[4],
                'emergency_contact_name': user[5],
                'emergency_contact_phone': user[6],
                'created_at': user[7]
            }
        return None
    
    def start_session(self, user_id, session_type='chat'):
        """Start a new therapy session"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO sessions (user_id, session_type)
            VALUES (?, ?)
        ''', (user_id, session_type))
        
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return session_id
    
    def end_session(self, session_id, emotion_data=None, crisis_level='low'):
        """End a therapy session"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Calculate duration
        cursor.execute('SELECT start_time FROM sessions WHERE id = ?', (session_id,))
        start_time = cursor.fetchone()[0]
        duration = (datetime.now() - datetime.fromisoformat(start_time)).seconds
        
        cursor.execute('''
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP, 
                duration = ?,
                emotion_data = ?,
                crisis_level = ?
            WHERE id = ?
        ''', (duration, json.dumps(emotion_data) if emotion_data else None, crisis_level, session_id))
        
        conn.commit()
        conn.close()
    
    def add_chat_message(self, user_id, session_id, message_text, sender, emotion_detected=None):
        """Add a chat message to the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO chat_messages 
            (user_id, session_id, message_text, sender, emotion_detected)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, session_id, message_text, sender, 
              json.dumps(emotion_detected) if emotion_detected else None))
        
        conn.commit()
        conn.close()
    
    def track_emotion(self, user_id, emotion_type, intensity, source, session_id=None):
        """Track user emotions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO emotion_tracking 
            (user_id, emotion_type, intensity, source, session_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, emotion_type, intensity, source, session_id))
        
        conn.commit()
        conn.close()
    
    def log_exercise(self, user_id, exercise_type, duration, effectiveness=None):
        """Log wellness exercises"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO exercises 
            (user_id, exercise_type, duration, effectiveness)
            VALUES (?, ?, ?, ?)
        ''', (user_id, exercise_type, duration, effectiveness))
        
        conn.commit()
        conn.close()
    
    def log_emergency(self, user_id, crisis_level, action_taken=None):
        """Log emergency events"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO emergency_events 
            (user_id, crisis_level, action_taken)
            VALUES (?, ?, ?)
        ''', (user_id, crisis_level, action_taken))
        
        event_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return event_id
    
    def get_user_sessions(self, user_id, limit=10):
        """Get user's recent sessions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM sessions 
            WHERE user_id = ? 
            ORDER BY start_time DESC 
            LIMIT ?
        ''', (user_id, limit))
        
        sessions = cursor.fetchall()
        conn.close()
        
        return [{
            'id': session[0],
            'user_id': session[1],
            'session_type': session[2],
            'start_time': session[3],
            'end_time': session[4],
            'duration': session[5],
            'emotion_data': json.loads(session[6]) if session[6] else None,
            'crisis_level': session[7]
        } for session in sessions]
    
    def get_user_emotions(self, user_id, days=7):
        """Get user's emotion history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT emotion_type, intensity, timestamp, source
            FROM emotion_tracking 
            WHERE user_id = ? AND timestamp >= datetime('now', '-' || ? || ' days')
            ORDER BY timestamp DESC
        ''', (user_id, days))
        
        emotions = cursor.fetchall()
        conn.close()
        
        return [{
            'emotion_type': emotion[0],
            'intensity': emotion[1],
            'timestamp': emotion[2],
            'source': emotion[3]
        } for emotion in emotions]
    
    def get_user_stats(self, user_id):
        """Get user statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total sessions
        cursor.execute('SELECT COUNT(*) FROM sessions WHERE user_id = ?', (user_id,))
        total_sessions = cursor.fetchone()[0]
        
        # Average session duration
        cursor.execute('SELECT AVG(duration) FROM sessions WHERE user_id = ? AND duration IS NOT NULL', (user_id,))
        avg_duration = cursor.fetchone()[0] or 0
        
        # Most common emotion
        cursor.execute('''
            SELECT emotion_type, COUNT(*) as count 
            FROM emotion_tracking 
            WHERE user_id = ? 
            GROUP BY emotion_type 
            ORDER BY count DESC 
            LIMIT 1
        ''', (user_id,))
        common_emotion = cursor.fetchone()
        
        # Emergency events count
        cursor.execute('SELECT COUNT(*) FROM emergency_events WHERE user_id = ?', (user_id,))
        emergency_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'total_sessions': total_sessions,
            'average_session_duration': round(avg_duration / 60, 1),  # Convert to minutes
            'most_common_emotion': common_emotion[0] if common_emotion else 'neutral',
            'emergency_events': emergency_count
        }

# Global database instance
db = MentalHealthDB()