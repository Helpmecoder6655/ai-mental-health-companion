// frontend/src/components/WellnessCenter/VRMeditation.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const VRMeditation = () => {
    const mountRef = useRef(null);
    
    useEffect(() => {
        // Three.js setup for VR meditation environment
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);
        
        // Create calming environment
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        const texture = new THREE.TextureLoader().load('/textures/peaceful-nature.jpg');
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        
        // Add floating particles for breathing guidance
        const particles = createBreathingParticles();
        scene.add(particles);
        
        const animate = () => {
            requestAnimationFrame(animate);
            particles.rotation.y += 0.001;
            renderer.render(scene, camera);
        };
        animate();
        
        return () => mountRef.current.removeChild(renderer.domElement);
    }, []);
    
    return (
        <div className="vr-meditation">
            <div ref={mountRef} className="vr-container" />
            <div className="breathing-guide">
                <h3>Guided Breathing Exercise</h3>
                <div className="breathing-circle">
                    <div className="breath-animation"></div>
                </div>
                <p>Breathe in... and out...</p>
            </div>
        </div>
    );
};