import React, { useState, useEffect } from 'react';
import APIService from '../../services/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ user }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => {
        fetchUserAnalytics();
    }, [user.id, timeRange]);

    const fetchUserAnalytics = async () => {
        try {
            setLoading(true);
            const response = await APIService.getUserAnalytics(user.id, timeRange);
            
            if (response.success) {
                setAnalyticsData(response.data);
            } else {
                setAnalyticsData(generateAnalyticsFromUserData());
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalyticsData(generateAnalyticsFromUserData());
        } finally {
            setLoading(false);
        }
    };

    const generateAnalyticsFromUserData = () => {
        const userSessions = user.sessions || [];
        const chatHistory = user.chatHistory || [];
        
        const currentMood = calculateCurrentMood(chatHistory);
        const moodTrend = calculateMoodTrend(userSessions, timeRange);
        const emotionDistribution = calculateEmotionDistribution(chatHistory);
        const sessionStats = calculateSessionStats(userSessions, timeRange);
        const wellnessScore = calculateWellnessScore(currentMood, sessionStats, emotionDistribution);
        const stressLevel = calculateStressLevel(currentMood, emotionDistribution);
        
        return {
            currentMood,
            moodTrend,
            emotionDistribution,
            sessionStats,
            wellnessScore,
            stressLevel,
            insights: generatePersonalizedInsights(currentMood, sessionStats, emotionDistribution),
            activityFrequency: calculateActivityFrequency(userSessions),
            sleepQuality: user.sleepData?.quality || calculateSleepQuality(chatHistory),
            exerciseMinutes: user.exerciseData?.weeklyMinutes || calculateExerciseMinutes(userSessions)
        };
    };

    const calculateMoodTrend = (sessions, range) => {
        const now = new Date();
        let dataPoints = [];
        let labels = [];

        switch (range) {
            case 'week':
                // Last 7 days
                dataPoints = 7;
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                break;
            case 'month':
                // Last 4 weeks
                dataPoints = 4;
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                break;
            case 'year':
                // Last 12 months
                dataPoints = 12;
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                break;
            default:
                dataPoints = 7;
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        }

        return labels.map((label, index) => {
            // Calculate average mood for each period
            const periodSessions = sessions.filter(session => {
                if (!session.timestamp) return false;
                const sessionDate = new Date(session.timestamp);
                const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
                
                switch (range) {
                    case 'week':
                        return daysDiff === index;
                    case 'month':
                        return daysDiff >= (index * 7) && daysDiff < ((index + 1) * 7);
                    case 'year':
                        return sessionDate.getMonth() === index;
                    default:
                        return daysDiff === index;
                }
            });

            const averageMood = periodSessions.length > 0 
                ? Math.round(periodSessions.reduce((sum, session) => sum + (session.mood || 5), 0) / periodSessions.length)
                : Math.max(1, Math.min(10, 5 + Math.floor(Math.random() * 3) - 1));

            return {
                period: label,
                mood: averageMood
            };
        });
    };

    const calculateCurrentMood = (chatHistory) => {
        if (!chatHistory.length) return 5;
        const recentChats = chatHistory.slice(-5);
        const moodSum = recentChats.reduce((sum, chat) => {
            return sum + (chat.emotionScore || 5);
        }, 0);
        return Math.round(moodSum / recentChats.length);
    };

    const calculateEmotionDistribution = (chatHistory) => {
        const emotionCount = {};
        const totalChats = chatHistory.length || 1;
        
        chatHistory.forEach(chat => {
            const emotion = chat.detectedEmotion || 'neutral';
            emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
        });
        
        if (Object.keys(emotionCount).length === 0) {
            return [
                { emotion: 'Calm', percentage: 35 },
                { emotion: 'Happy', percentage: 25 },
                { emotion: 'Neutral', percentage: 20 },
                { emotion: 'Anxious', percentage: 15 },
                { emotion: 'Sad', percentage: 5 }
            ];
        }
        
        return Object.entries(emotionCount)
            .map(([emotion, count]) => ({
                emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                percentage: Math.round((count / totalChats) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 6); // Show top 6 emotions
    };

    const calculateSessionStats = (sessions, range) => {
        const now = new Date();
        const currentPeriodSessions = sessions.filter(session => 
            isInCurrentPeriod(session.timestamp, range, now)
        );
        
        const previousPeriodSessions = sessions.filter(session => 
            isInPreviousPeriod(session.timestamp, range, now)
        );
        
        return {
            currentPeriod: currentPeriodSessions.length,
            previousPeriod: previousPeriodSessions.length,
            total: sessions.length
        };
    };

    const isInCurrentPeriod = (timestamp, range, now) => {
        if (!timestamp) return false;
        const date = new Date(timestamp);
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (range) {
            case 'week': return diffDays <= 7;
            case 'month': return diffDays <= 30;
            case 'year': return diffDays <= 365;
            default: return diffDays <= 7;
        }
    };

    const isInPreviousPeriod = (timestamp, range, now) => {
        if (!timestamp) return false;
        const date = new Date(timestamp);
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (range) {
            case 'week': return diffDays > 7 && diffDays <= 14;
            case 'month': return diffDays > 30 && diffDays <= 60;
            case 'year': return diffDays > 365 && diffDays <= 730;
            default: return diffDays > 7 && diffDays <= 14;
        }
    };

    const calculateWellnessScore = (currentMood, sessionStats, emotionDistribution) => {
        const moodScore = (currentMood / 10) * 40;
        const sessionScore = Math.min(sessionStats.currentPeriod * 5, 30);
        const positiveEmotions = emotionDistribution.filter(e => 
            ['Happy', 'Calm', 'Excited', 'Grateful'].includes(e.emotion)
        ).reduce((sum, e) => sum + e.percentage, 0);
        const emotionScore = (positiveEmotions / 100) * 30;
        
        return Math.min(100, moodScore + sessionScore + emotionScore);
    };

    const calculateStressLevel = (currentMood, emotionDistribution) => {
        const anxiousEmotions = emotionDistribution.filter(e => 
            ['Anxious', 'Stressed', 'Angry', 'Frustrated'].includes(e.emotion)
        ).reduce((sum, e) => sum + e.percentage, 0);
        
        if (currentMood <= 3 || anxiousEmotions > 40) return 'High';
        if (currentMood <= 6 || anxiousEmotions > 20) return 'Medium';
        return 'Low';
    };

    const calculateActivityFrequency = (sessions) => {
        const activities = {};
        sessions.forEach(session => {
            session.activities?.forEach(activity => {
                activities[activity.type] = activities[activity.type] || { count: 0, duration: 0 };
                activities[activity.type].count++;
                activities[activity.type].duration += activity.duration || 5;
            });
        });
        
        const defaultActivities = ['Breathing', 'Meditation', 'Journaling', 'Exercise', 'Mindfulness'];
        return defaultActivities.map(activity => ({
            activity,
            frequency: activities[activity]?.count || 0,
            duration: activities[activity] ? Math.round(activities[activity].duration / activities[activity].count) : 0
        })).filter(item => item.frequency > 0);
    };

    const calculateSleepQuality = (chatHistory) => {
        const sleepChats = chatHistory.filter(chat => 
            chat.message?.toLowerCase().includes('sleep') || 
            chat.message?.toLowerCase().includes('tired')
        );
        return sleepChats.length > 0 ? Math.max(3, 10 - sleepChats.length) : 7;
    };

    const calculateExerciseMinutes = (sessions) => {
        return sessions.reduce((total, session) => {
            return total + (session.exerciseMinutes || 0);
        }, 0);
    };

    const generatePersonalizedInsights = (currentMood, sessionStats, emotionDistribution) => {
        const insights = [];
        
        if (currentMood >= 8) {
            insights.push({
                type: 'positive',
                text: 'Your mood is excellent! Keep maintaining your positive routines and self-care practices.'
            });
        } else if (currentMood <= 4) {
            insights.push({
                type: 'suggestion',
                text: 'Consider trying some relaxation exercises or talking to someone about how you\'re feeling.'
            });
        }
        
        if (sessionStats.currentPeriod >= 7) {
            insights.push({
                type: 'positive',
                text: `Great consistency! ${sessionStats.currentPeriod} sessions this period shows strong commitment to your mental health.`
            });
        } else if (sessionStats.currentPeriod <= 2) {
            insights.push({
                type: 'reminder',
                text: 'Regular practice helps maintain mental wellness. Try to check in more often to build consistent habits.'
            });
        }
        
        const anxiousPercentage = emotionDistribution.find(e => e.emotion === 'Anxious')?.percentage || 0;
        if (anxiousPercentage > 30) {
            insights.push({
                type: 'suggestion',
                text: 'Noticing higher anxiety levels. Breathing exercises and mindfulness can help manage stress effectively.'
            });
        }
        
        if (insights.length === 0) {
            insights.push({
                type: 'reminder',
                text: 'You\'re making good progress in your mental wellness journey. Remember to celebrate small victories and be kind to yourself.'
            });
        }
        
        return insights.slice(0, 3);
    };

    const getMoodDescription = (mood) => {
        if (mood >= 9) return 'Excellent';
        if (mood >= 7) return 'Good';
        if (mood >= 5) return 'Okay';
        if (mood >= 3) return 'Low';
        return 'Very Low';
    };

    const getMoodEmoji = (mood) => {
        if (mood >= 9) return '😊';
        if (mood >= 7) return '🙂';
        if (mood >= 5) return '😐';
        if (mood >= 3) return '😔';
        return '😢';
    };

    const getTrendText = (current, previous) => {
        const difference = current - previous;
        if (difference > 0) return `+${difference} from last period`;
        if (difference < 0) return `${difference} from last period`;
        return 'Same as last period';
    };

    const getTrendClass = (current, previous) => {
        const difference = current - previous;
        if (difference > 0) return 'positive';
        if (difference < 0) return 'negative';
        return 'neutral';
    };

    if (loading) {
        return (
            <div className="analytics-dashboard loading">
                <div className="analytics-header">
                    <h1>Your Mental Health Analytics</h1>
                    <p>Loading your personalized data...</p>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="analytics-dashboard error">
                <div className="analytics-header">
                    <h1>Your Mental Health Analytics</h1>
                    <p>Unable to load your data at this time</p>
                </div>
                <button onClick={fetchUserAnalytics} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

    const trendText = getTrendText(
        analyticsData.sessionStats.currentPeriod,
        analyticsData.sessionStats.previousPeriod
    );
    const trendClass = getTrendClass(
        analyticsData.sessionStats.currentPeriod,
        analyticsData.sessionStats.previousPeriod
    );

    return (
        <div className="analytics-dashboard">
            <div className="analytics-header">
                <h1>Your Mental Health Analytics</h1>
                <p>Track your emotional journey and progress over time</p>
                
                <div className="time-range-selector">
                    <button 
                        className={timeRange === 'week' ? 'active' : ''}
                        onClick={() => setTimeRange('week')}
                    >
                        This Week
                    </button>
                    <button 
                        className={timeRange === 'month' ? 'active' : ''}
                        onClick={() => setTimeRange('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={timeRange === 'year' ? 'active' : ''}
                        onClick={() => setTimeRange('year')}
                    >
                        This Year
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card mood-card">
                    <div className="metric-header">
                        <h3>Current Mood</h3>
                        <span className="mood-emoji">{getMoodEmoji(analyticsData.currentMood)}</span>
                    </div>
                    <div className="metric-value">{analyticsData.currentMood}/10</div>
                    <div className="metric-description">{getMoodDescription(analyticsData.currentMood)}</div>
                </div>

                <div className="metric-card sessions-card">
                    <div className="metric-header">
                        <h3>
                            {timeRange === 'week' ? 'Weekly' : 
                             timeRange === 'month' ? 'Monthly' : 'Yearly'} Sessions
                        </h3>
                        <span className="metric-icon">💬</span>
                    </div>
                    <div className="metric-value">{analyticsData.sessionStats.currentPeriod}</div>
                    <div className={`metric-description ${trendClass}`}>
                        {trendText}
                    </div>
                    <div className="metric-trend">
                        Total: {analyticsData.sessionStats.total} sessions
                    </div>
                </div>

                <div className="metric-card wellness-card">
                    <div className="metric-header">
                        <h3>Wellness Score</h3>
                        <span className="metric-icon">🌟</span>
                    </div>
                    <div className="metric-value">{Math.round(analyticsData.wellnessScore)}%</div>
                    <div className="metric-description">
                        {analyticsData.wellnessScore >= 80 ? 'Excellent' : 
                         analyticsData.wellnessScore >= 60 ? 'Good' : 
                         'Needs attention'}
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${analyticsData.wellnessScore}%` }}
                        ></div>
                    </div>
                </div>

                <div className="metric-card stress-card">
                    <div className="metric-header">
                        <h3>Stress Level</h3>
                        <span className="metric-icon">🧘</span>
                    </div>
                    <div className="metric-value">{analyticsData.stressLevel}</div>
                    <div className="metric-description">
                        {analyticsData.stressLevel === 'Low' ? 'Well managed' : 
                         analyticsData.stressLevel === 'Medium' ? 'Manageable' : 
                         'Consider support'}
                    </div>
                    <div className="stress-indicator">
                        <div className={`stress-dot ${analyticsData.stressLevel.toLowerCase()}`}></div>
                        <div className="stress-label">{analyticsData.stressLevel} stress</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>
                            {timeRange === 'week' ? 'Weekly Mood Trend' :
                             timeRange === 'month' ? 'Monthly Mood Trend' : 'Yearly Mood Trend'}
                        </h3>
                        <span className="chart-subtitle">Your mood patterns over time</span>
                    </div>
                    <div className={`mood-chart ${timeRange}`}>
                        {analyticsData.moodTrend.map((data, index) => (
                            <div key={index} className="chart-column">
                                <div 
                                    className="chart-bar" 
                                    style={{ height: `${data.mood * 8}%` }}
                                    data-value={data.mood}
                                >
                                    <div className="bar-value">{data.mood}</div>
                                </div>
                                <div className="chart-label">{data.period}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Emotion Distribution</h3>
                        <span className="chart-subtitle">Your emotional patterns</span>
                    </div>
                    <div className="emotion-chart">
                        {analyticsData.emotionDistribution.map((item, index) => (
                            <div key={index} className="emotion-item">
                                <div className="emotion-info">
                                    <span className="emotion-name">{item.emotion}</span>
                                    <span className="emotion-percentage">{item.percentage}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div 
                                        className="emotion-bar" 
                                        style={{ width: `${item.percentage}%` }}
                                        data-emotion={item.emotion.toLowerCase()}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Insights */}
            <div className="insights-section">
                <div className="activities-card">
                    <h3>Activity Frequency</h3>
                    <div className="activities-list">
                        {analyticsData.activityFrequency.length > 0 ? (
                            analyticsData.activityFrequency.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-name">{activity.activity}</div>
                                    <div className="activity-stats">
                                        <span className="frequency">{activity.frequency}x</span>
                                        <span className="duration">{activity.duration}min avg</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">
                                <div className="no-data-icon">📊</div>
                                <p>No activity data yet</p>
                                <small>Start using wellness features to see your activity patterns</small>
                            </div>
                        )}
                    </div>
                </div>

                <div className="personal-insights">
                    <h3>Personalized Insights</h3>
                    <div className="insights-list">
                        {analyticsData.insights.map((insight, index) => (
                            <div key={index} className={`insight ${insight.type}`}>
                                <div className="insight-icon">
                                    {insight.type === 'positive' ? '🌟' :
                                     insight.type === 'suggestion' ? '💡' : '📋'}
                                </div>
                                <div className="insight-text">
                                    <strong>
                                        {insight.type === 'positive' ? 'Positive Trend' :
                                         insight.type === 'suggestion' ? 'Suggestion' : 'Reminder'}
                                    </strong>
                                    <p>{insight.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Footer */}
            <div className="data-footer">
                <button 
                    onClick={fetchUserAnalytics} 
                    disabled={loading}
                    className="refresh-btn"
                >
                    {loading ? 'Refreshing...' : '🔄 Refresh Data'}
                </button>
                <span className="last-updated">
                    Last updated: {new Date().toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;