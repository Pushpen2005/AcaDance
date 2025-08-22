// ===== 3D EFFECTS JAVASCRIPT LIBRARY =====

class Effects3D {
  constructor() {
    this.init();
    this.setupEventListeners();
  }

  init() {
    this.createParticleSystem();
    this.setupMouseTracking();
    this.initializeCardTilt();
    this.setupScrollAnimations();
    this.createFloatingElements();
  }

  // Mouse tracking for 3D card tilting
  setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e);
      this.tiltCards(e);
      this.moveParticles(e);
    });
  }

  updateMousePosition(e) {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  // Enhanced 3D card tilting with depth
  tiltCards(e) {
    const cards = document.querySelectorAll('.card-3d-advanced, .dashboard-card-3d, .login-card-3d');
    
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      
      const maxTilt = 15;
      const tiltX = deltaY * maxTilt;
      const tiltY = deltaX * -maxTilt;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const scale = Math.min(1 + distance * 0.05, 1.1);
      
      if (distance < 1) {
        card.style.transform = `
          perspective(1000px) 
          rotateX(${tiltX}deg) 
          rotateY(${tiltY}deg) 
          translateZ(${distance * 20}px)
          scale(${scale})
        `;
        
        // Add glow effect based on mouse proximity
        const glowIntensity = Math.max(0, 1 - distance);
        card.style.boxShadow = `
          0 ${20 + distance * 10}px ${40 + distance * 20}px rgba(34, 197, 94, ${0.2 + glowIntensity * 0.3}),
          0 ${10 + distance * 5}px ${20 + distance * 10}px rgba(34, 197, 94, ${0.1 + glowIntensity * 0.2})
        `;
      }
    });
  }

  // Reset card positions when mouse leaves
  resetCardTilt() {
    const cards = document.querySelectorAll('.card-3d-advanced, .dashboard-card-3d, .login-card-3d');
    cards.forEach(card => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  }

  // Particle system for background effects
  createParticleSystem() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-system-3d';
    particleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    `;
    
    document.body.appendChild(particleContainer);
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      this.createParticle(particleContainer);
    }
  }

  createParticle(container) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, rgba(34, 197, 94, ${Math.random() * 0.5 + 0.3}) 0%, transparent 70%);
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particle-float-3d ${Math.random() * 20 + 10}s linear infinite;
      animation-delay: ${Math.random() * 5}s;
    `;
    
    container.appendChild(particle);
    
    // Remove and recreate particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove();
        this.createParticle(container);
      }
    }, (Math.random() * 20 + 10) * 1000);
  }

  // Move particles based on mouse position
  moveParticles(e) {
    const particles = document.querySelectorAll('.particle-system-3d > div');
    const mouseInfluence = 50;
    
    particles.forEach(particle => {
      const rect = particle.getBoundingClientRect();
      const particleCenterX = rect.left + rect.width / 2;
      const particleCenterY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - particleCenterX) / window.innerWidth;
      const deltaY = (e.clientY - particleCenterY) / window.innerHeight;
      
      const moveX = deltaX * mouseInfluence;
      const moveY = deltaY * mouseInfluence;
      
      particle.style.transform = `translate(${moveX}px, ${moveY}px) translateZ(${Math.abs(deltaX + deltaY) * 10}px)`;
    });
  }

  // Initialize card tilt effects
  initializeCardTilt() {
    const cards = document.querySelectorAll('.card-3d-advanced, .dashboard-card-3d, .stat-card-3d');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transformStyle = 'preserve-3d';
        card.style.transition = 'all 0.1s ease-out';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.320, 1)';
      });
    });
  }

  // Scroll-based 3D animations
  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElementIn(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll(
      '.dashboard-card-3d, .stat-card-3d, .chart-container-3d, .notification-3d'
    );
    
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(50px) rotateX(20deg)';
      observer.observe(el);
    });
  }

  animateElementIn(element) {
    const delay = Math.random() * 300;
    
    setTimeout(() => {
      element.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.320, 1)';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) rotateX(0deg)';
    }, delay);
  }

  // Create floating 3D elements
  createFloatingElements() {
    const container = document.createElement('div');
    container.className = 'floating-elements-3d';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    `;
    
    document.body.appendChild(container);
    
    // Create geometric shapes
    for (let i = 0; i < 8; i++) {
      this.createFloatingShape(container);
    }
  }

  createFloatingShape(container) {
    const shapes = ['circle', 'square', 'triangle'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const element = document.createElement('div');
    
    const size = Math.random() * 60 + 20;
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    
    element.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${startX}px;
      top: ${startY}px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.2);
      animation: float-shape-3d ${Math.random() * 20 + 15}s ease-in-out infinite;
      animation-delay: ${Math.random() * 5}s;
      transform-style: preserve-3d;
    `;
    
    // Apply shape-specific styles
    switch (shape) {
      case 'circle':
        element.style.borderRadius = '50%';
        break;
      case 'square':
        element.style.borderRadius = '10%';
        break;
      case 'triangle':
        element.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        break;
    }
    
    container.appendChild(element);
  }

  // Interactive button effects
  enhanceButtons() {
    const buttons = document.querySelectorAll('.btn-3d-interactive, .action-button-3d, .login-button-3d');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', (e) => {
        this.createRippleEffect(e.target, e);
      });
      
      button.addEventListener('click', (e) => {
        this.createClickEffect(e.target, e);
      });
    });
  }

  createRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-3d 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  createClickEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create multiple particles for click effect
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      const angle = (i / 6) * Math.PI * 2;
      const distance = 30;
      
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #22c55e;
        border-radius: 50%;
        left: ${centerX}px;
        top: ${centerY}px;
        pointer-events: none;
        z-index: 1000;
        animation: click-particle-3d 0.8s ease-out forwards;
        transform: translate(-50%, -50%);
      `;
      
      particle.style.setProperty('--angle', `${angle}rad`);
      particle.style.setProperty('--distance', `${distance}px`);
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 800);
    }
    
    // Button feedback
    element.style.transform = 'scale(0.95) translateZ(2px)';
    setTimeout(() => {
      element.style.transform = '';
    }, 150);
  }

  // Performance monitoring and optimization
  optimizePerformance() {
    // Reduce effects on mobile devices
    if (window.innerWidth < 768) {
      this.reduceMobileEffects();
    }
    
    // Pause effects when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseEffects();
      } else {
        this.resumeEffects();
      }
    });
  }

  reduceMobileEffects() {
    const style = document.createElement('style');
    style.textContent = `
      .card-3d-advanced:hover,
      .dashboard-card-3d:hover,
      .stat-card-3d:hover {
        transform: scale(1.02) !important;
      }
      
      .particle-system-3d {
        display: none !important;
      }
      
      .floating-elements-3d {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  pauseEffects() {
    const particles = document.querySelectorAll('.particle-system-3d *, .floating-elements-3d *');
    particles.forEach(particle => {
      particle.style.animationPlayState = 'paused';
    });
  }

  resumeEffects() {
    const particles = document.querySelectorAll('.particle-system-3d *, .floating-elements-3d *');
    particles.forEach(particle => {
      particle.style.animationPlayState = 'running';
    });
  }

  // Cleanup method
  destroy() {
    const particleSystem = document.querySelector('.particle-system-3d');
    const floatingElements = document.querySelector('.floating-elements-3d');
    
    if (particleSystem) particleSystem.remove();
    if (floatingElements) floatingElements.remove();
    
    document.removeEventListener('mousemove', this.updateMousePosition);
    document.removeEventListener('mousemove', this.tiltCards);
    document.removeEventListener('mousemove', this.moveParticles);
  }
}

// CSS animations for JavaScript effects
const style = document.createElement('style');
style.textContent = `
  @keyframes particle-float-3d {
    0% {
      transform: translate3d(0, 100vh, 0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translate3d(0, -100vh, 0) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes float-shape-3d {
    0%, 100% {
      transform: translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    }
    25% {
      transform: translateY(-20px) rotateX(90deg) rotateY(45deg) rotateZ(15deg);
    }
    50% {
      transform: translateY(-10px) rotateX(180deg) rotateY(90deg) rotateZ(30deg);
    }
    75% {
      transform: translateY(-15px) rotateX(270deg) rotateY(135deg) rotateZ(45deg);
    }
  }
  
  @keyframes ripple-3d {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  @keyframes click-particle-3d {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(-50% + cos(var(--angle)) * var(--distance)),
        calc(-50% + sin(var(--angle)) * var(--distance))
      ) scale(0);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize 3D effects when DOM is loaded
let effects3D;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    effects3D = new Effects3D();
  });
} else {
  effects3D = new Effects3D();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Effects3D;
}

// Global access
window.Effects3D = Effects3D;
