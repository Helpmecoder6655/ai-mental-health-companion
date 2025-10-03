import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        // Session management
        this.currentSessionId = null;
        this.conversationHistory = [];
        
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.log('API Error, using fallback responses:', error.message);
                return Promise.resolve({ data: this.getFallbackResponse(error.config) });
            }
        );
    }

    // Session management methods
    startNewSession(userId) {
        this.currentSessionId = `session_${Date.now()}_${userId}`;
        this.conversationHistory = [];
        return this.currentSessionId;
    }

    getCurrentSessionId() {
        return this.currentSessionId;
    }

    addToHistory(message, sender, emotion = null) {
        this.conversationHistory.push({
            message,
            sender,
            emotion,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 messages to prevent memory issues
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }
    }

    getConversationHistory() {
        return this.conversationHistory;
    }

    getFallbackResponse(config) {
        const url = config.url;
        const requestData = config.data ? JSON.parse(config.data) : {};
        
        if (url.includes('/chat')) {
            return this.getEnhancedFallbackChatResponse(requestData);
        } else if (url.includes('/exercises/breathing')) {
            return this.getFallbackBreathingExercise();
        } else if (url.includes('/emergency/help')) {
            return this.getFallbackEmergencyResponse();
        } else {
            return { success: true, message: 'Demo mode active' };
        }
    }

    getEnhancedFallbackChatResponse(requestData) {
        const message = requestData.message || '';
        const messageLower = message.toLowerCase();
        
        // Enhanced response system with context awareness
        const response = this.generateContextAwareResponse(messageLower, requestData);
        
        return {
            success: true,
            response: response.text,
            emotion_detected: response.emotion,
            suggest_exercise: response.suggestExercise,
            exercise_type: response.exerciseType,
            follow_up: response.followUp,
            demo_mode: true,
            session_id: this.currentSessionId
        };
    }

    generateContextAwareResponse(message, context) {
        // Get recent conversation context
        const recentUserMessages = this.conversationHistory
            .filter(msg => msg.sender === 'user')
            .slice(-3)
            .map(msg => msg.message.toLowerCase());

        // Enhanced keyword mapping with more variations
        const responseMap = {
            // Greetings and general
            greeting: {
                patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'],
                responses: [
                    "Hello! I'm your AI mental health companion. How are you feeling today?",
                    "Hi there! I'm here to listen and support you. What's on your mind?",
                    "Hello! It's good to connect with you. How has your day been?",
                    "Hey! I'm glad you're here. How are you doing today?"
                ],
                emotion: { emotion: 'neutral', confidence: 0.8 },
                suggestExercise: false
            },

            // Positive emotions
            happy: {
                patterns: ['happy', 'good', 'great', 'awesome', 'excited', 'joy', 'amazing', 'wonderful', 'fantastic', 'excellent', 'perfect', 'bliss', 'ecstatic'],
                responses: [
                    "That's wonderful to hear! 😊 What's making you feel so positive today?",
                    "I'm genuinely happy to hear that! Celebrating the good moments is important. Want to share what brought you joy?",
                    "It's beautiful to hear you're feeling good! These positive moments are worth cherishing.",
                    "Your happiness is contagious! Tell me more about what's going well for you.",
                    "That's fantastic! Positive emotions like these are great for your mental health. What's been the highlight?"
                ],
                emotion: { emotion: 'happy', confidence: 0.9 },
                suggestExercise: false,
                followUp: "Would you like to explore ways to maintain this positive mindset?"
            },

            // Sadness and depression
            sad: {
                patterns: ['sad', 'depressed', 'unhappy', 'miserable', 'hopeless', 'down', 'blue', 'gloomy', 'heartbroken', 'tearful', 'crying'],
                responses: [
                    "I'm really sorry you're feeling this way. 💙 It takes courage to acknowledge sadness. Would you like to talk about what's bothering you?",
                    "I hear the pain in your words. Remember that these feelings, while heavy, are temporary. You're not alone in this.",
                    "Thank you for sharing how you feel. Sadness can be overwhelming, but talking about it can help lighten the load.",
                    "I'm here with you in this moment. It's okay to not be okay. Would a calming exercise help right now?",
                    "Your feelings are completely valid. Sometimes just sitting with our sadness and acknowledging it can be the first step toward healing."
                ],
                emotion: { emotion: 'sad', confidence: 0.85 },
                suggestExercise: true,
                exerciseType: 'breathing'
            },

            // Anxiety and stress
            anxious: {
                patterns: ['anxious', 'anxiety', 'nervous', 'worried', 'stress', 'stressed', 'overwhelmed', 'panic', 'scared', 'afraid', 'fear', 'worries'],
                responses: [
                    "Anxiety can feel incredibly overwhelming. Let's take a moment to breathe together. Remember, this feeling will pass.",
                    "I understand that anxious feelings can be really challenging. You're safe here, and we can work through this together.",
                    "It sounds like you're carrying a lot right now. Would you like to try a grounding exercise to help calm your nervous system?",
                    "Anxiety often makes everything feel bigger than it is. Let's break it down together - what specifically is worrying you?",
                    "I'm here with you. Let's focus on your breathing - in for 4 seconds, hold for 4, out for 4. You've got this."
                ],
                emotion: { emotion: 'anxious', confidence: 0.8 },
                suggestExercise: true,
                exerciseType: 'grounding'
            },

            // Anger and frustration
            angry: {
                patterns: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'pissed', 'rage', 'livid', 'fuming'],
                responses: [
                    "I can feel the frustration in your words. Anger is a natural emotion - it's telling you that something isn't right.",
                    "It sounds like you're really upset right now. Would you like to try some techniques to help process these intense feelings?",
                    "Anger can be overwhelming. Let's take a moment to breathe and create some space between you and the emotion.",
                    "I understand you're feeling angry. Sometimes identifying what specifically triggered this can help us address it constructively.",
                    "Your anger is valid. Let's work together to find healthy ways to express and process these feelings."
                ],
                emotion: { emotion: 'angry', confidence: 0.75 },
                suggestExercise: true,
                exerciseType: 'anger_management'
            },

            // Loneliness
            lonely: {
                patterns: ['lonely', 'alone', 'isolated', 'no friends', 'by myself', 'no one cares', 'abandoned'],
                responses: [
                    "Feeling lonely can be incredibly painful. I want you to know that you're not alone right now - I'm here with you.",
                    "Loneliness is one of the hardest emotions to sit with. Thank you for reaching out - that takes real strength.",
                    "I hear how isolated you're feeling. Human connection is so important. Would you like to talk about what kind of connections you're missing?",
                    "You're brave for sharing this. Loneliness can make us feel invisible, but I see you and I'm listening.",
                    "These feelings of loneliness are valid and real. Sometimes just having someone to witness our experience can help."
                ],
                emotion: { emotion: 'sad', confidence: 0.8 },
                suggestExercise: false
            },

            // Sleep issues
            sleep: {
                patterns: ['sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep', 'wake up', 'night', 'bed'],
                responses: [
                    "Sleep struggles can really impact everything else. Have you noticed any patterns in your sleep difficulties?",
                    "Not sleeping well is incredibly frustrating. Good sleep is so important for mental health. What's your bedtime routine like?",
                    "Sleep issues often connect with our daytime stress. Would you like to try some relaxation techniques that might help?",
                    "I understand how exhausting sleep problems can be. Sometimes establishing a calming pre-sleep ritual can make a difference.",
                    "Poor sleep can really affect our mood and coping abilities. Let's explore what might be interfering with your rest."
                ],
                emotion: { emotion: 'anxious', confidence: 0.7 },
                suggestExercise: true,
                exerciseType: 'relaxation'
            },

            // Work/School stress
            work: {
                patterns: ['work', 'job', 'school', 'college', 'university', 'exam', 'test', 'deadline', 'project', 'assignment', 'boss', 'teacher'],
                responses: [
                    "Work/school pressure can be really intense. What specifically is feeling overwhelming right now?",
                    "Academic/professional stress is so common. Remember to break big tasks into smaller, manageable steps.",
                    "The pressure you're describing sounds challenging. Have you been able to take any breaks for yourself?",
                    "Stress from work/school can really build up. What's one small thing you could do to reduce the pressure?",
                    "I hear how stressed you are about this. Sometimes just talking through the challenges can help them feel more manageable."
                ],
                emotion: { emotion: 'anxious', confidence: 0.75 },
                suggestExercise: true,
                exerciseType: 'stress_relief'
            },

            // Relationships
            relationship: {
                patterns: ['friend', 'family', 'partner', 'boyfriend', 'girlfriend', 'wife', 'husband', 'parents', 'mother', 'father', 'sibling', 'argument', 'fight'],
                responses: [
                    "Relationship challenges can be really painful. Would you like to talk about what's happening?",
                    "Navigating relationships is complex. What specifically is feeling difficult right now?",
                    "Relationship stress affects us deeply. Remember that your feelings in this situation are valid.",
                    "It sounds like there's some tension in this relationship. What would a positive resolution look like for you?",
                    "Relationship dynamics can be complicated. Sometimes setting boundaries can help maintain your wellbeing."
                ],
                emotion: { emotion: 'sad', confidence: 0.7 },
                suggestExercise: false
            },

            // Self-care and coping
            selfcare: {
                patterns: ['self-care', 'cope', 'coping', 'manage', 'handle', 'deal with', 'self help', 'therapy'],
                responses: [
                    "Self-care is so important for mental health. What strategies have you tried that help you feel better?",
                    "Finding healthy coping mechanisms is a journey. What activities usually help you feel more grounded?",
                    "I'm glad you're thinking about self-care. Even small, consistent practices can make a big difference over time.",
                    "Developing coping skills takes practice. What's one small thing you could do today to support your wellbeing?",
                    "Self-care looks different for everyone. What does taking care of yourself mean to you right now?"
                ],
                emotion: { emotion: 'neutral', confidence: 0.8 },
                suggestExercise: true,
                exerciseType: 'mindfulness'
            },

            // Exercise suggestions
            exercise: {
                patterns: ['exercise', 'breathing', 'meditation', 'yoga', 'relax', 'calm down', 'grounding'],
                responses: [
                    "I'd be happy to guide you through an exercise! Would you prefer breathing, grounding, or relaxation techniques?",
                    "Exercises can be really helpful for managing difficult emotions. What type of support are you looking for right now?",
                    "Mindfulness practices can create space between you and intense emotions. Shall we try one together?",
                    "I have several exercises that might help. Would you like something for anxiety, stress relief, or general relaxation?",
                    "Practices like breathing and grounding can help regulate your nervous system. What would feel most supportive right now?"
                ],
                emotion: { emotion: 'neutral', confidence: 0.8 },
                suggestExercise: true
            },

            // Gratitude and positive focus
            gratitude: {
                patterns: ['grateful', 'thankful', 'appreciate', 'blessed', 'lucky', 'fortunate'],
                responses: [
                    "Practicing gratitude is such a powerful tool for mental wellbeing! What are you feeling thankful for today?",
                    "Focusing on what we're grateful for can really shift our perspective. Would you like to explore this more?",
                    "Gratitude practices have been shown to improve mood and resilience. What's one small thing you appreciate right now?",
                    "Noticing what we're thankful for, even in difficult times, takes real strength. What's bringing you comfort today?",
                    "Gratitude can be such an anchor during challenging times. What moments of goodness have you experienced recently?"
                ],
                emotion: { emotion: 'happy', confidence: 0.8 },
                suggestExercise: false
            },

            // Default/fallback responses
            default: {
                patterns: [],
                responses: [
                    "Thank you for sharing that with me. I'm here to listen and support you. Could you tell me more about what you're experiencing?",
                    "I appreciate you opening up. How has this been affecting your daily life?",
                    "Thank you for trusting me with this. What would be most helpful for you right now - listening, practical suggestions, or coping strategies?",
                    "I'm listening carefully. What emotions are coming up for you as you share this?",
                    "I hear what you're saying. Would you like to explore this further, or would you prefer to try a calming exercise?",
                    "Thank you for being open with me. What aspect of this situation feels most challenging right now?",
                    "I'm here with you in this. What would support look like for you in this moment?",
                    "I appreciate you sharing this. How long have you been dealing with these feelings?",
                    "Thank you for telling me about this. What's one small thing that might help you feel even slightly better?",
                    "I'm listening. What would you like to focus on right now - understanding these feelings or finding ways to cope with them?"
                ],
                emotion: { emotion: 'neutral', confidence: 0.6 },
                suggestExercise: false
            }
        };

        // Find matching response category
        let matchedCategory = 'default';
        for (const [category, data] of Object.entries(responseMap)) {
            if (data.patterns.some(pattern => messageLower.includes(pattern))) {
                matchedCategory = category;
                break;
            }
        }

        const categoryData = responseMap[matchedCategory];
        const randomResponse = categoryData.responses[Math.floor(Math.random() * categoryData.responses.length)];

        return {
            text: randomResponse,
            emotion: categoryData.emotion,
            suggestExercise: categoryData.suggestExercise || false,
            exerciseType: categoryData.exerciseType || 'breathing',
            followUp: categoryData.followUp || null
        };
    }

    getFallbackBreathingExercise() {
        const exercises = {
            '478': {
                name: '4-7-8 Breathing',
                description: 'Calming technique for stress and anxiety relief',
                instructions: [
                    'Find a comfortable seated position with your back straight',
                    'Place the tip of your tongue against the roof of your mouth, just behind your front teeth',
                    'Exhale completely through your mouth, making a whoosh sound',
                    'Close your mouth and inhale quietly through your nose for 4 seconds',
                    'Hold your breath for 7 seconds',
                    'Exhale completely through your mouth for 8 seconds, making a whoosh sound',
                    'Repeat this cycle 3-4 times',
                    'Notice how your body begins to relax with each breath'
                ],
                duration: 3,
                benefits: ['Reduces anxiety', 'Helps with sleep', 'Calms the nervous system', 'Promotes relaxation']
            },
            'box': {
                name: 'Box Breathing',
                description: 'Military technique for focus and calm under pressure',
                instructions: [
                    'Sit upright in a comfortable position with your hands resting on your lap',
                    'Slowly exhale all the air from your lungs',
                    'Inhale through your nose for 4 seconds, filling your lungs completely',
                    'Hold your breath for 4 seconds',
                    'Exhale through your mouth for 4 seconds, emptying your lungs completely',
                    'Hold at the bottom for 4 seconds before your next inhale',
                    'Repeat 5-10 times',
                    'Focus on making each part of the breath equal in duration'
                ],
                duration: 5,
                benefits: ['Improves focus', 'Reduces stress', 'Increases alertness', 'Regulates nervous system']
            },
            'grounding': {
                name: '5-4-3-2-1 Grounding Exercise',
                description: 'Technique to bring awareness to the present moment',
                instructions: [
                    'Take three deep breaths to center yourself',
                    'Name 5 things you can see around you',
                    'Name 4 things you can touch or feel',
                    'Name 3 things you can hear',
                    'Name 2 things you can smell',
                    'Name 1 thing you can taste',
                    'Take three more deep breaths',
                    'Notice how you feel more present and grounded'
                ],
                duration: 3,
                benefits: ['Reduces anxiety', 'Brings present-moment awareness', 'Helps with panic attacks', 'Grounds in reality']
            }
        };

        const exerciseTypes = Object.keys(exercises);
        const randomExercise = exercises[exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)]];

        return {
            success: true,
            exercise: {
                ...randomExercise,
                demo_mode: true
            }
        };
    }

    getFallbackEmergencyResponse() {
        return {
            success: true,
            emergency_response: {
                message: '🚨 Support Resources Available',
                actions: [
                    'National Suicide Prevention Lifeline: 1-800-273-8255',
                    'Crisis Text Line: Text HOME to 741741',
                    'Emergency Services: 911',
                    'Trevor Project (LGBTQ+): 1-866-488-7386',
                    'Veterans Crisis Line: 1-800-273-8255, press 1',
                    'Disaster Distress Helpline: 1-800-985-5990'
                ],
                instructions: 'You are not alone. Professional help is available 24/7. Please reach out if you need immediate support.'
            },
            demo_mode: true
        };
    }

    async chatWithAI(message, userId, emotionContext = {}) {
        // Start session if not already started
        if (!this.currentSessionId) {
            this.startNewSession(userId);
        }

        // Add user message to history
        this.addToHistory(message, 'user', emotionContext);

        try {
            const response = await this.client.post('/chat', {
                message,
                user_id: userId,
                emotion_context: emotionContext,
                session_id: this.currentSessionId,
                conversation_history: this.conversationHistory.slice(-5) // Send last 5 messages for context
            });

            // Add AI response to history
            if (response.data.success) {
                this.addToHistory(response.data.response, 'ai', response.data.emotion_detected);
            }

            return response.data;
        } catch (error) {
            console.error('AI chat error, using enhanced fallback:', error);
            const fallbackResponse = this.getEnhancedFallbackChatResponse({ message });
            
            // Add fallback response to history
            this.addToHistory(fallbackResponse.response, 'ai', fallbackResponse.emotion_detected);
            
            return fallbackResponse;
        }
    }

    async getBreathingExercise(type = 'random') {
        try {
            const response = await this.client.get('/exercises/breathing', {
                params: { type }
            });
            return response.data;
        } catch (error) {
            console.error('Breathing exercise error, using fallback:', error);
            return this.getFallbackBreathingExercise();
        }
    }

    async connectCounselor(userId, preference = 'any') {
        try {
            const response = await this.client.post('/emergency/help', {
                user_id: userId,
                crisis_level: 'high',
                session_id: this.currentSessionId
            });
            return response.data;
        } catch (error) {
            console.error('Counselor connection error, using fallback:', error);
            return this.getFallbackEmergencyResponse();
        }
    }

    async triggerEmergency(userId, crisisLevel, emotionData = {}) {
        try {
            const response = await this.client.post('/emergency/help', {
                user_id: userId,
                crisis_level: crisisLevel,
                emotion_data: emotionData,
                session_id: this.currentSessionId
            });
            return response.data;
        } catch (error) {
            console.error('Emergency trigger error, using fallback:', error);
            return this.getFallbackEmergencyResponse();
        }
    }
}

export default new APIService();