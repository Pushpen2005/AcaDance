/**
 * Advanced 3D Animations and Interactive Effects
 * Provides dynamic animations, particle systems, and mouse interactions
 */

export class Advanced3DAnimations {
  constructor() {
    this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth <= 768;
    this.particles = [];
    this.mousePosition = { x: 0, y: 0 };
    this.init();
  }

  init() {
    if (this.isReduced) return;
    
    this.setupMouseTracking();
    this.setupTiltEffects();
    this.setupParticleSystem();
    this.setupMorphingElements();
    this.setupInteractiveBackgrounds();
    this.setupAdvancedHovers();
  }

  // Enhanced Mouse Tracking with 3D Effects
  setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      this.mousePosition = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      };

      // Update CSS custom properties for interactive gradients
      document.documentElement.style.setProperty('--mouse-x', `${this.mousePosition.x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${this.mousePosition.y}%`);

      // Apply parallax effects to background elements
      this.updateParallaxElements(e);
    });
  }

  // Advanced Tilt Effects for Cards
  setupTiltEffects() {
    const tiltElements = document.querySelectorAll('.tilt-card, .card-3d');
    
    tiltElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        if (this.isMobile) return;
        
        element.style.transition = 'transform 0.1s ease-out';
      });

      element.addEventListener('mousemove', (e) => {
        if (this.isMobile) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const rotateX = (e.clientY - centerY) / (rect.height / 2) * -10;
        const rotateY = (e.clientX - centerX) / (rect.width / 2) * 10;
        
        element.style.transform = `
          perspective(1000px) 
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          translateZ(20px)
        `;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transition = 'transform 0.3s ease';
        element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  }

  // Dynamic Particle System
  setupParticleSystem() {
    const containers = document.querySelectorAll('.particle-system');
    
    containers.forEach(container => {
      this.createParticles(container, 20);
      
      // Add particles on interaction
      container.addEventListener('click', (e) => {
        this.createClickParticles(e, container);
      });
    });
  }

  createParticles(container, count) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random starting position and animation delay
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (8 + Math.random() * 4) + 's';
      
      container.appendChild(particle);
      this.particles.push(particle);
    }
  }

  createClickParticles(event, container) {
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle click-particle';
      particle.style.left = x + '%';
      particle.style.top = y + '%';
      particle.style.animation = 'particleExplode 1s ease-out forwards';
      
      container.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  }

  // Morphing Blob Elements
  setupMorphingElements() {
    const morphElements = document.querySelectorAll('.morph-blob');
    
    morphElements.forEach(element => {
      // Add interactive morphing on hover
      element.addEventListener('mouseenter', () => {
        element.style.animationDuration = '2s';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.animationDuration = '20s';
      });
    });
  }

  // Interactive Background Effects
  setupInteractiveBackgrounds() {
    const interactiveElements = document.querySelectorAll('.gradient-interactive');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        element.style.setProperty('--mouse-x', `${x}%`);
        element.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  // Advanced Hover Effects
  setupAdvancedHovers() {
    const buttons = document.querySelectorAll('.btn-3d');
    
    buttons.forEach(button => {
      // Add ripple effect on click
      button.addEventListener('click', (e) => {
        this.createRippleEffect(e, button);
      });
      
      // Add magnetic effect
      button.addEventListener('mousemove', (e) => {
        if (this.isMobile) return;
        
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        button.style.transform = `
          translateY(-2px) 
          rotateX(${y / 10}deg) 
          rotateY(${x / 10}deg)
          translateX(${x / 20}px)
          translateY(${y / 20}px)
        `;
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0px) rotateX(0deg) rotateY(0deg) translateX(0px)';
      });
    });
  }

  createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple-effect');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Parallax Effects
  updateParallaxElements(event) {
    const parallaxElements = document.querySelectorAll('.parallax-bg, [data-parallax]');
    
    parallaxElements.forEach(element => {
      const speed = element.dataset.parallax || 0.1;
      const x = (event.clientX * speed) / 100;
      const y = (event.clientY * speed) / 100;
      
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  // Form Input Enhancements
  setupInputAnimations() {
    const inputs = document.querySelectorAll('.input-3d');
    
    inputs.forEach(input => {
      // Floating label effect
      const label = input.previousElementSibling;
      if (label && label.tagName === 'LABEL') {
        input.addEventListener('focus', () => {
          label.style.transform = 'translateY(-20px) scale(0.8)';
          label.style.color = '#10b981';
        });
        
        input.addEventListener('blur', () => {
          if (!input.value) {
            label.style.transform = 'translateY(0) scale(1)';
            label.style.color = '';
          }
        });
      }
      
      // Character wave animation for typing
      input.addEventListener('input', (e) => {
        this.createTypingWave(e.target);
      });
    });
  }

  createTypingWave(input) {
    const chars = input.value.split('');
    if (chars.length === 0) return;
    
    // Add wave effect to the last character
    input.style.textShadow = '0 0 5px rgba(16, 185, 129, 0.5)';
    setTimeout(() => {
      input.style.textShadow = '';
    }, 200);
  }

  // Scroll-triggered Animations
  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          // Stagger animations for multiple elements
          const siblings = Array.from(entry.target.parentElement.children);
          siblings.forEach((sibling, index) => {
            if (sibling.classList.contains('stagger')) {
              setTimeout(() => {
                sibling.classList.add('animate-in');
              }, index * 100);
            }
          });
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }

  // Performance Optimization
  optimizeForDevice() {
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency <= 2) {
      document.documentElement.classList.add('low-performance');
    }
    
    // Disable 3D effects on mobile
    if (this.isMobile) {
      document.documentElement.classList.add('mobile-optimized');
    }
    
    // Battery level optimization
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          document.documentElement.classList.add('battery-saver');
        }
      });
    }
  }

  // Cleanup method
  destroy() {
    this.particles.forEach(particle => particle.remove());
    this.particles = [];
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
  }
}

// CSS for additional effects
const additionalCSS = `
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes particleExplode {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(3) translate(var(--random-x, 50px), var(--random-y, -50px));
    opacity: 0;
  }
}

.animate-in {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

[data-animate] {
  opacity: 0;
  transform: translateY(20px);
}

.low-performance .card-3d,
.low-performance .hover-lift-3d,
.low-performance .morph-blob {
  animation: none !important;
  transform: none !important;
}

.mobile-optimized .tilt-card,
.mobile-optimized .card-3d {
  transform: none !important;
}

.battery-saver * {
  animation-duration: 0.1s !important;
  transition-duration: 0.1s !important;
}
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.advanced3D = new Advanced3DAnimations();
  });
} else {
  window.advanced3D = new Advanced3DAnimations();
}

export default Advanced3DAnimations;
