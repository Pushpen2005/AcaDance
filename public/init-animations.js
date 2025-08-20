/**
 * Animation Initialization Script
 * Automatically sets up all enhanced animations when the DOM is ready
 */

(function() {
  'use strict';

  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  let animationSystem = null;
  let interactiveManager = null;

  // Initialize animations
  function initializeAnimations() {
    try {
      // Initialize Enhanced Interactivity if available
      if (window.EnhancedInteractivity) {
        animationSystem = new window.EnhancedInteractivity({
          enableParticles: true,
          enable3D: true,
          particleCount: determineParticleCount(),
          performanceMode: 'auto'
        });
        console.log('✨ Enhanced 3D Animations initialized');
      }

      // Initialize Interactive Manager if available
      if (window.InteractiveManager) {
        interactiveManager = new window.InteractiveManager();
        interactiveManager.init();
        console.log('🎮 Interactive Manager initialized');
      }

      // Setup manual animations for elements already in DOM
      setupManualAnimations();

    } catch (error) {
      console.warn('Animation initialization failed:', error);
    }
  }

  // Determine optimal particle count based on device capabilities
  function determineParticleCount() {
    const isMobile = window.innerWidth <= 768;
    const isLowPerformance = navigator.hardwareConcurrency <= 2;
    
    if (isMobile || isLowPerformance) {
      return 20;
    } else {
      return 50;
    }
  }

  // Setup animations for elements that don't use React hooks
  function setupManualAnimations() {
    // Add hover effects to elements with specific classes
    addHoverEffects();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Setup particle systems for static elements
    initializeStaticParticleSystems();
    
    // Add magnetic effects
    initializeMagneticElements();

    // Setup matrix rain effects
    initializeMatrixRain();
  }

  function addHoverEffects() {
    const elements = document.querySelectorAll('.auto-hover, .interactive-card');
    
    elements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'translateY(-4px)';
        element.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.12)';
        element.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translateY(0)';
        element.style.boxShadow = '';
      });
    });
  }

  function initializeScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in-scroll, .slide-in-scroll');
    
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'all 0.6s ease';
      
      observer.observe(element);
    });

    // Add CSS for the animation
    if (!document.querySelector('#scroll-animations-css')) {
      const style = document.createElement('style');
      style.id = 'scroll-animations-css';
      style.textContent = `
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  function initializeStaticParticleSystems() {
    const containers = document.querySelectorAll('.static-particles');
    
    containers.forEach(container => {
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      
      // Create ambient particles
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(16, 185, 129, 0.6);
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: particleFloat ${6 + Math.random() * 4}s ease-in-out infinite;
          animation-delay: ${Math.random() * 3}s;
          pointer-events: none;
        `;
        container.appendChild(particle);
      }
    });
  }

  function initializeMagneticElements() {
    const elements = document.querySelectorAll('.auto-magnetic');
    
    elements.forEach(element => {
      const strength = parseFloat(element.dataset.strength) || 0.3;
      const range = parseFloat(element.dataset.range) || 100;
      
      document.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          (e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2
        );
        
        if (distance < range) {
          const force = (range - distance) / range;
          const moveX = (e.clientX - centerX) * force * strength;
          const moveY = (e.clientY - centerY) * force * strength;
          
          element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
          element.style.transition = 'transform 0.1s ease-out';
        } else {
          element.style.transform = 'translate3d(0, 0, 0)';
          element.style.transition = 'transform 0.3s ease';
        }
      });
    });
  }

  function initializeMatrixRain() {
    const containers = document.querySelectorAll('.matrix-rain-auto');
    
    containers.forEach(container => {
      const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const dropCount = 30;
      
      container.style.cssText += `
        position: relative;
        overflow: hidden;
        background: #000;
        color: #00ff00;
      `;
      
      for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.style.cssText = `
          position: absolute;
          top: -100px;
          left: ${Math.random() * 100}%;
          font-family: 'Courier New', monospace;
          font-size: ${12 + Math.random() * 8}px;
          color: inherit;
          animation: matrixFall ${3 + Math.random() * 3}s linear infinite;
          animation-delay: ${Math.random() * 2}s;
          pointer-events: none;
        `;
        
        const updateChar = () => {
          drop.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
        };
        
        updateChar();
        setInterval(updateChar, 100 + Math.random() * 200);
        
        container.appendChild(drop);
      }
    });
  }

  // Performance monitoring
  function monitorPerformance() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function checkFPS() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Reduce animations if FPS is too low
        if (fps < 30 && animationSystem) {
          animationSystem.setPerformanceMode('low');
          console.warn('🐌 Low FPS detected, switching to performance mode');
        }
      }
      
      requestAnimationFrame(checkFPS);
    }
    
    requestAnimationFrame(checkFPS);
  }

  // Cleanup function
  function cleanup() {
    if (animationSystem) {
      animationSystem.destroy();
    }
    if (interactiveManager) {
      interactiveManager.destroy();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimations);
  } else {
    initializeAnimations();
  }

  // Start performance monitoring
  if (window.location.pathname.includes('enhanced-animations')) {
    monitorPerformance();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  // Export for manual use
  window.initializeAnimations = initializeAnimations;
  window.cleanupAnimations = cleanup;

})();
