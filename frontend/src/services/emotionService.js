class EmotionService {
    constructor() {
        this.isModelsLoaded = false;
        this.modelsLoaded = false;
        this.loadError = null;
    }

    async loadModels() {
        try {
            console.log('Loading FaceAPI models...');
            
            // For demo purposes, we'll simulate model loading
            // In a real app, you would load actual models from public/models folder
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.modelsLoaded = true;
            this.isModelsLoaded = true;
            console.log('FaceAPI models loaded successfully (demo mode)');
            return true;
            
        } catch (error) {
            console.error('Error loading FaceAPI models (demo mode active):', error);
            this.loadError = error;
            this.modelsLoaded = false;
            this.isModelsLoaded = false;
            
            // Don't break the app - continue in demo mode
            return false;
        }
    }

    async detectEmotionsFromImage(imageElement) {
        if (!this.modelsLoaded) {
            // Return mock emotions for demo
            return this.getMockEmotions();
        }
        
        try {
            // This would be real face detection in production
            const detection = await this.realFaceDetection(imageElement);
            return detection;
        } catch (error) {
            console.error('Face detection error, using mock data:', error);
            return this.getMockEmotions();
        }
    }

    getMockEmotions() {
        // Generate realistic mock emotions
        const emotions = {
            happy: Math.random() * 0.4,
            sad: Math.random() * 0.3,
            angry: Math.random() * 0.2,
            fearful: Math.random() * 0.1,
            surprised: Math.random() * 0.2,
            neutral: Math.random() * 0.3,
            disgusted: Math.random() * 0.1
        };

        // Normalize to sum to 1
        const total = Object.values(emotions).reduce((sum, value) => sum + value, 0);
        Object.keys(emotions).forEach(emotion => {
            emotions[emotion] = emotions[emotion] / total;
        });

        const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
            emotions[a] > emotions[b] ? a : b
        );

        return {
            expressions: emotions,
            dominantEmotion: dominantEmotion,
            confidence: emotions[dominantEmotion],
            timestamp: new Date().toISOString()
        };
    }

    async realFaceDetection(imageElement) {
        // This would contain the actual Face-API.js code
        // For now, return mock data
        return this.getMockEmotions();
    }

    calculateCrisisLevel(emotionHistory) {
        if (!emotionHistory || emotionHistory.length === 0) return 'LOW';
        
        const recentEmotions = emotionHistory.slice(-5);
        const negativeEmotions = ['sad', 'angry', 'fearful'];
        
        const negativeCount = recentEmotions.filter(emotion => 
            negativeEmotions.includes(emotion.dominantEmotion)
        ).length;

        const averageIntensity = recentEmotions.reduce((sum, emotion) => 
            sum + emotion.confidence, 0) / recentEmotions.length;

        if (negativeCount >= 4 && averageIntensity > 0.7) return 'SEVERE';
        if (negativeCount >= 3 && averageIntensity > 0.5) return 'HIGH';
        if (negativeCount >= 2 && averageIntensity > 0.3) return 'MODERATE';
        
        return 'LOW';
    }
}

export default new EmotionService();