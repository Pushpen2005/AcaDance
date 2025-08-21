// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";

import { 
  useAdvanced3D, 
  useScrollAnimation, 
  useParticleEffect, 
  useMorphingShape,
  useTypewriter,
  useCounter,
  useMagnetic,
  useGlitch,
  useLiquidButton
} from '../hooks/use-enhanced-animations';

export default function EnhancedAnimationsDemo() {
  const [isClient, setIsClient] = useState(false);
  
  // Animation refs
  const tiltCardRef = useAdvanced3D({ tiltIntensity: 20 });
  const scrollRef = useScrollAnimation('fadeInUp');
  const { containerRef, triggerParticles } = useParticleEffect({ 
    color: '#10b981', 
    count: 15, 
    onClick: true 
  });
  const morphRef = useMorphingShape({ speed: 0.03 });
  const typewriterRef = useTypewriter('Welcome to the Future of Web Interactions!', { speed: 80 });
  const counterRef = useCounter(1250, { duration: 3000 });
  const magneticRef = useMagnetic({ strength: 0.4, range: 120 });
  const { elementRef: glitchRef, triggerGlitch } = useGlitch({ 
    intensity: 8, 
    duration: 300,
    trigger: 'hover' 
  });
  const liquidButtonRef = useLiquidButton({ 
    color: 'radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent)' 
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading amazing animations...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Hero Section with Advanced Effects */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        <div className="absolute inset-0 parallax-bg opacity-30"></div>
        
        {/* Main Content */}
        <div className="relative z-10 text-center space-y-8">
          {/* Typewriter Title */}
          <h1 
            ref={typewriterRef as any}
            className="text-6xl font-bold neon-glow mb-8"
          ></h1>
          
          {/* Subtitle with Scroll Animation */}
          <p 
            ref={scrollRef as any}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            data-scroll-animation="slideInUp"
          >
            Experience next-generation web interactions with advanced 3D animations, 
            particle effects, and immersive visual elements.
          </p>
          
          {/* Animated Counter */}
          <div className="flex justify-center items-center space-x-8 py-8">
            <div className="text-center">
              <div 
                ref={counterRef as any}
                className="text-4xl font-bold text-green-400"
              ></div>
              <p className="text-sm text-gray-400">Lines of Animation Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Showcase Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gradient">
            Interactive Elements Showcase
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 3D Tilt Card */}
            <div 
              ref={tiltCardRef as any}
              className="tilt-enhanced card-3d-enhanced p-8 rounded-xl glass-enhanced h-64 flex items-center justify-center cursor-pointer"
              data-tilt-intensity="15"
            >
              <div className="text-center">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">3D Tilt Effect</h3>
                <p className="text-gray-300">Hover to experience 3D depth</p>
              </div>
            </div>

            {/* Particle Effect Container */}
            <div 
              ref={containerRef as any}
              className="particle-system p-8 rounded-xl glass-enhanced h-64 flex items-center justify-center cursor-pointer hover-lift"
              onClick={(e) => triggerParticles(e.nativeEvent)}
            >
              <div className="text-center">
                <div className="text-3xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2">Particle Explosion</h3>
                <p className="text-gray-300">Click to create particles</p>
              </div>
            </div>

            {/* Morphing Shape */}
            <div className="p-8 rounded-xl glass-enhanced h-64 flex items-center justify-center">
              <div className="text-center">
                <div 
                  ref={morphRef as any}
                  className="w-24 h-24 mx-auto mb-4 morph-advanced bg-gradient-to-r from-green-400 to-blue-500"
                ></div>
                <h3 className="text-xl font-semibold mb-2">Morphing Blob</h3>
                <p className="text-gray-300">Dynamic shape animation</p>
              </div>
            </div>

            {/* Magnetic Element */}
            <div className="p-8 rounded-xl glass-enhanced h-64 flex items-center justify-center">
              <div className="text-center">
                <div 
                  ref={magneticRef as any}
                  className="magnetic w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl cursor-pointer"
                  data-magnetic="0.4"
                  data-magnetic-range="120"
                >
                  🧲
                </div>
                <h3 className="text-xl font-semibold mb-2">Magnetic Pull</h3>
                <p className="text-gray-300">Mouse attraction effect</p>
              </div>
            </div>

            {/* Glitch Effect */}
            <div className="p-8 rounded-xl glass-enhanced h-64 flex items-center justify-center">
              <div className="text-center">
                <div 
                  ref={glitchRef as any}
                  className="glitch-effect text-3xl mb-4 cursor-pointer"
                  data-text="GLITCH"
                  onMouseEnter={triggerGlitch}
                >
                  GLITCH
                </div>
                <h3 className="text-xl font-semibold mb-2">Glitch Animation</h3>
                <p className="text-gray-300">Hover for digital distortion</p>
              </div>
            </div>

            {/* Liquid Button */}
            <div className="p-8 rounded-xl glass-enhanced h-64 flex items-center justify-center">
              <div className="text-center w-full">
                <button 
                  ref={liquidButtonRef as any}
                  className="liquid-button btn-quantum px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
                >
                  Liquid Effect
                </button>
                <h3 className="text-xl font-semibold mb-2 mt-4">Liquid Button</h3>
                <p className="text-gray-300">Fluid hover animation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Effects Demonstration */}
      <section className="py-20 px-8 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 text-gradient">
            Advanced Visual Effects
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Neural Network Visualization */}
            <div className="neural-network relative h-64 rounded-xl glass-enhanced overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Neural Network</h3>
                  <p className="text-gray-300">Dynamic connection patterns</p>
                </div>
              </div>
            </div>

            {/* Holographic Element */}
            <div className="holographic relative h-64 rounded-xl overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🌈</div>
                <h3 className="text-xl font-semibold mb-2">Holographic Effect</h3>
                <p className="text-gray-300">Shimmer on hover</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Energy Orbs */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 text-gradient">
            Energy & Motion Effects
          </h2>
          
          <div className="flex justify-center items-center space-x-12">
            <div className="energy-orb"></div>
            <div className="energy-orb" style={{ animationDelay: '1s' }}></div>
            <div className="energy-orb" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <p className="text-gray-300 mt-8">
            Pulsating energy orbs with dynamic lighting effects
          </p>
        </div>
      </section>

      {/* Data Stream */}
      <section className="py-20">
        <div className="data-stream h-32 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-2xl font-bold">Data Stream Visualization</h3>
          </div>
        </div>
      </section>

      {/* Performance Info */}
      <section className="py-12 px-8 bg-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Performance Optimized</h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            All animations are GPU-accelerated and include automatic performance 
            optimization for mobile devices and battery-saving mode detection.
          </p>
        </div>
      </section>

      {/* Loading Animation Examples */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Loading Animations</h2>
          
          <div className="flex justify-center items-center space-x-12">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            
            <div className="loading-pulse w-12 h-12 bg-green-500 rounded-full"></div>
            
            <div className="loading-3d w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"></div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-gradient">
            Ready to Enhance Your App?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Integrate these cutting-edge animations into your project and create 
            unforgettable user experiences.
          </p>
          <button className="btn-quantum px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-lg font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Particle Canvas Overlay - Initialized by the JavaScript */}
      <div id="particle-overlay"></div>
    </div>
  );
}
