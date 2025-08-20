/**
 * Interactive Elements Manager
 * Utility functions for managing advanced animations and interactions
 */

export class InteractiveManager {
  constructor() {
    this.elements = new Map();
    this.animations = new Map();
    this.observers = new Map();
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupUtilities();
    this.initializeComponents();
    this.isInitialized = true;
  }

  setupUtilities() {
    // Add utility CSS classes dynamically
    this.injectUtilityCSS();
    
    // Setup global event listeners
    this.setupGlobalEvents();
  }

  injectUtilityCSS() {
    const css = `
      /* Interactive Utility Classes */
      .interactive-hover {
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        cursor: pointer;
      }

      .interactive-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .scale-on-hover {
        transition: transform 0.3s ease;
      }

      .scale-on-hover:hover {
        transform: scale(1.05);
      }

      .glow-on-hover {
        transition: all 0.3s ease;
      }

      .glow-on-hover:hover {
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
      }

      .pulse-slow {
        animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      .bounce-soft {
        animation: bounceSoft 2s infinite;
      }

      @keyframes bounceSoft {
        0%, 100% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(-5px);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }

      .fade-in-up {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease;
      }

      .fade-in-up.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .slide-in-left {
        opacity: 0;
        transform: translateX(-50px);
        transition: all 0.6s ease;
      }

      .slide-in-left.visible {
        opacity: 1;
        transform: translateX(0);
      }

      .slide-in-right {
        opacity: 0;
        transform: translateX(50px);
        transition: all 0.6s ease;
      }

      .slide-in-right.visible {
        opacity: 1;
        transform: translateX(0);
      }

      .zoom-in {
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.6s ease;
      }

      .zoom-in.visible {
        opacity: 1;
        transform: scale(1);
      }

      .rotate-in {
        opacity: 0;
        transform: rotate(-90deg) scale(0.8);
        transition: all 0.6s ease;
      }

      .rotate-in.visible {
        opacity: 1;
        transform: rotate(0deg) scale(1);
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = css;
    document.head.appendChild(styleSheet);
  }

  setupGlobalEvents() {
    // Mouse trail effect
    let mouseTrail = [];
    document.addEventListener('mousemove', (e) => {
      mouseTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      
      // Keep only recent trail points
      mouseTrail = mouseTrail.filter(point => Date.now() - point.time < 500);
      
      // Update CSS variables for trail effects
      document.documentElement.style.setProperty('--mouse-trail-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-trail-y', e.clientY + 'px');
    });

    // Enhanced click effects
    document.addEventListener('click', (e) => {
      this.createClickRipple(e);
    });

    // Keyboard navigation enhancements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  initializeComponents() {
    // Auto-initialize common interactive elements
    this.initHoverEffects();
    this.initScrollAnimations();
    this.initParallaxElements();
    this.initTypewriterEffects();
    this.initCounterAnimations();
    this.initProgressBars();
  }

  // Hover Effects
  initHoverEffects() {
    const hoverElements = document.querySelectorAll('.hover-effect, .interactive-hover');
    
    hoverElements.forEach(element => {
      if (this.elements.has(element)) return;
      
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'translateY(-2px)';
        element.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translateY(0)';
        element.style.boxShadow = '';
      });

      this.elements.set(element, 'hover-effect');
    });
  }

  // Scroll Animations
  initScrollAnimations() {
    const scrollElements = document.querySelectorAll('.animate-on-scroll, [data-animate]');
    
    if (scrollElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationType = element.dataset.animate || 'fade-in-up';
          
          element.classList.add(animationType, 'visible');
          
          // Stagger animations for child elements
          const staggerDelay = parseInt(element.dataset.stagger) || 0;
          if (staggerDelay > 0) {
            const children = element.children;
            Array.from(children).forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('visible');
              }, index * staggerDelay);
            });
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    scrollElements.forEach(element => {
      observer.observe(element);
    });

    this.observers.set('scroll', observer);
  }

  // Parallax Elements
  initParallaxElements() {
    const parallaxElements = document.querySelectorAll('.parallax, [data-parallax]');
    
    if (parallaxElements.length === 0) return;

    const updateParallax = () => {
      const scrollTop = window.pageYOffset;
      
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrollTop * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // Typewriter Effects
  initTypewriterEffects() {
    const typewriterElements = document.querySelectorAll('.typewriter, [data-typewriter]');
    
    typewriterElements.forEach(element => {
      if (this.elements.has(element)) return;
      
      const text = element.textContent;
      const speed = parseInt(element.dataset.typewriterSpeed) || 50;
      
      element.textContent = '';
      element.style.borderRight = '2px solid';
      element.style.animation = 'blink 0.75s step-end infinite';
      
      let index = 0;
      const typeInterval = setInterval(() => {
        element.textContent += text.charAt(index);
        index++;
        
        if (index >= text.length) {
          clearInterval(typeInterval);
          element.style.borderRight = 'none';
          element.style.animation = 'none';
        }
      }, speed);

      this.elements.set(element, 'typewriter');
    });
  }

  // Counter Animations
  initCounterAnimations() {
    const counterElements = document.querySelectorAll('.counter, [data-counter]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.elements.has(entry.target)) {
          this.animateCounter(entry.target);
        }
      });
    });

    counterElements.forEach(element => {
      observer.observe(element);
    });
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.counter) || parseInt(element.textContent);
    const duration = parseInt(element.dataset.duration) || 2000;
    const startTime = Date.now();
    
    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(target * easeOutQuart);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    updateCounter();
    this.elements.set(element, 'counter');
  }

  // Progress Bars
  initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar, [data-progress]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.elements.has(entry.target)) {
          this.animateProgressBar(entry.target);
        }
      });
    });

    progressBars.forEach(element => {
      observer.observe(element);
    });
  }

  animateProgressBar(element) {
    const progress = parseInt(element.dataset.progress) || 0;
    const duration = parseInt(element.dataset.duration) || 1000;
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progressPercent, 3);
      const currentProgress = progress * easeOutCubic;
      
      element.style.width = currentProgress + '%';
      
      if (progressPercent < 1) {
        requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    this.elements.set(element, 'progress-bar');
  }

  // Click Ripple Effect
  createClickRipple(event) {
    const ripple = document.createElement('div');
    const size = 100;
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.3);
      width: ${size}px;
      height: ${size}px;
      left: ${event.clientX - size / 2}px;
      top: ${event.clientY - size / 2}px;
      pointer-events: none;
      z-index: 9999;
      animation: rippleEffect 0.6s ease-out;
    `;
    
    document.body.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Utility Methods
  addHoverEffect(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.transform = options.transform || 'translateY(-2px)';
        element.style.transition = options.transition || 'all 0.3s ease';
        if (options.boxShadow) {
          element.style.boxShadow = options.boxShadow;
        }
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = '';
        element.style.boxShadow = '';
      });
    });
  }

  addScrollAnimation(selector, animationType = 'fade-in-up') {
    const elements = document.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationType, 'visible');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(element => {
      element.classList.add(animationType);
      observer.observe(element);
    });
  }

  addParticleEffect(element, options = {}) {
    const particleCount = options.count || 10;
    const colors = options.colors || ['#10b981', '#059669', '#34d399'];
    
    element.addEventListener('click', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          border-radius: 50%;
          left: ${x}px;
          top: ${y}px;
          pointer-events: none;
          animation: particleExplode 1s ease-out forwards;
        `;
        
        element.appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 1000);
      }
    });
  }

  // Advanced Effects
  createMatrix(container, options = {}) {
    const characters = options.characters || '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const dropCount = options.dropCount || 50;
    
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.background = options.background || '#000';
    container.style.color = options.color || '#00ff00';
    
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
      `;
      
      const updateChar = () => {
        drop.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
      };
      
      updateChar();
      setInterval(updateChar, 100 + Math.random() * 200);
      
      container.appendChild(drop);
    }
  }

  createNeonText(element, options = {}) {
    const color = options.color || '#10b981';
    const intensity = options.intensity || 1;
    
    element.style.textShadow = `
      0 0 ${5 * intensity}px ${color},
      0 0 ${10 * intensity}px ${color},
      0 0 ${15 * intensity}px ${color},
      0 0 ${20 * intensity}px ${color}
    `;
    
    element.style.animation = 'neonFlicker 2s infinite alternate';
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.elements.clear();
    this.animations.clear();
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.InteractiveManager = InteractiveManager;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.interactiveManager = new InteractiveManager();
      window.interactiveManager.init();
    });
  } else {
    window.interactiveManager = new InteractiveManager();
    window.interactiveManager.init();
  }
}

export default InteractiveManager;
