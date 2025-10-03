// frontend/src/components/WellnessCenter/BreathingExercises.jsx
import React, { useState, useEffect, useRef } from 'react';
import APIService from '../../services/api';
import './BreathingExercises.css';

const BreathingExercises = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentPhase, setCurrentPhase] = useState('inhale');
    const [cycleCount, setCycleCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(4);
    const [exercise, setExercise] = useState(null);
    
    const timerRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        loadDefaultExercise();
    }, []);

    const loadDefaultExercise = async () => {
        try {
            const response = await APIService.getBreathingExercise(5, 'beginner');
            if (response.success) {
                setExercise(response.exercise);
            }
        } catch (error) {
            console.error('Error loading exercise:', error);
        }
    };

    const startExercise = () => {
        if (!exercise) return;
        
        setIsActive(true);
        setCycleCount(0);
        setCurrentPhase('inhale');
        setTimeLeft(exercise.pattern[0]);
        
        startBreathingCycle();
    };

    const startBreathingCycle = () => {
        const phases = ['inhale', 'hold', 'exhale', 'hold'];
        let phaseIndex = 0;
        let currentCycle = 0;

        const updateBreathing = () => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Move to next phase
                    phaseIndex = (phaseIndex + 1) % phases.length;
                    
                    if (phaseIndex === 0) {
                        // Completed one cycle
                        currentCycle++;
                        setCycleCount(currentCycle);
                        
                        if (currentCycle >= exercise.cycles) {
                            stopExercise();
                            return 0;
                        }
                    }
                    
                    const nextPhase = phases[phaseIndex];
                    setCurrentPhase(nextPhase);
                    return exercise.pattern[phaseIndex];
                }
                return prev - 1;
            });

            animationRef.current = requestAnimationFrame(updateBreathing);
        };

        animationRef.current = requestAnimationFrame(updateBreathing);
    };

    const stopExercise = () => {
        setIsActive(false);
        setCurrentPhase('ready');
        setTimeLeft(0);
        
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    const getPhaseInstructions = () => {
        switch (currentPhase) {
            case 'inhale':
                return 'Breathe in slowly through your nose...';
            case 'hold':
                return 'Hold your breath...';
            case 'exhale':
                return 'Breathe out slowly through your mouth...';
            case 'hold':
                return 'Hold...';
            default:
                return 'Get ready to begin...';
        }
    };

    const getCircleStyle = () => {
        const baseSize = 200;
        
        switch (currentPhase) {
            case 'inhale':
                return {
                    width: `${baseSize + timeLeft * 10}px`,
                    height: `${baseSize + timeLeft * 10}px`,
                    opacity: 0.7 + (timeLeft / exercise.pattern[0]) * 0.3
                };
            case 'exhale':
                return {
                    width: `${baseSize + timeLeft * 10}px`,
                    height: `${baseSize + timeLeft * 10}px`,
                    opacity: 0.7 + (timeLeft / exercise.pattern[2]) * 0.3
                };
            default:
                return {
                    width: `${baseSize}px`,
                    height: `${baseSize}px`,
                    opacity: 0.8
                };
        }
    };

    return (
        <div className="breathing-exercises">
            <div className="exercise-header">
                <h2>{exercise?.name || 'Breathing Exercise'}</h2>
                <p>{exercise?.description || 'Calm your mind with guided breathing'}</p>
            </div>

            <div className="breathing-visualization">
                <div 
                    className={`breathing-circle ${currentPhase}`}
                    style={getCircleStyle()}
                >
                    <div className="phase-text">
                        <div className="phase-name">{currentPhase.toUpperCase()}</div>
                        <div className="timer">{timeLeft}s</div>
                    </div>
                </div>
                
                <div className="instructions">
                    <p>{getPhaseInstructions()}</p>
                </div>
            </div>

            <div className="exercise-controls">
                {!isActive ? (
                    <button className="start-btn" onClick={startExercise}>
                        Start Breathing Exercise
                    </button>
                ) : (
                    <button className="stop-btn" onClick={stopExercise}>
                        Stop Exercise
                    </button>
                )}
            </div>

            <div className="exercise-stats">
                <div className="stat">
                    <span className="label">Cycles Completed:</span>
                    <span className="value">{cycleCount}/{exercise?.cycles}</span>
                </div>
                <div className="stat">
                    <span className="label">Current Phase:</span>
                    <span className="value">{currentPhase}</span>
                </div>
            </div>

            <div className="exercise-tips">
                <h4>Tips for Effective Breathing:</h4>
                <ul>
                    <li>Sit comfortably with your back straight</li>
                    <li>Close your eyes to enhance focus</li>
                    <li>Breathe deeply from your diaphragm</li>
                    <li>Maintain a consistent rhythm</li>
                </ul>
            </div>
        </div>
    );
};

export default BreathingExercises;