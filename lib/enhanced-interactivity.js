/**
 * Enhanced Interactivity and Advanced 3D Animations
 * Next-generation interactive effects for modern web applications
 */

export class EnhancedInteractivity {
  constructor(options = {}) {
    this.options = {
      enableParticles: true,
      enable3D: true,
      enableSound: false,
      particleCount: 50,
      mouseSensitivity: 1,
      performanceMode: 'auto', // 'auto', 'high', 'low'
      ...options
    };

    this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth <= 768;
    this.isLowPerformance = navigator.hardwareConcurrency <= 2;
    
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.particles = [];
    this.morphElements = [];
    this.animationFrameId = null;
    this.activeAnimations = new Set();
    
    this.init();
  }

  init() {
    if (this.isReduced) return;
    
    this.detectPerformanceMode();
    this.setupEventListeners();
    this.initializeEffects();
    this.startAnimationLoop();
  }

  detectPerformanceMode() {
    if (this.options.performanceMode === 'auto') {
      if (this.isLowPerformance || this.isMobile) {
        this.options.performanceMode = 'low';
        this.options.particleCount = 20;
      } else {
        this.options.performanceMode = 'high';
      }
    }
  }

  setupEventListeners() {
    // Enhanced mouse tracking with velocity
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Touch events for mobile
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    
    // Intersection observer for scroll animations
    this.setupScrollObserver();
  }

  handleMouseMove(e) {
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    
    // Calculate velocity
    this.mouse.velocityX = this.mouse.x - this.mouse.prevX;
    this.mouse.velocityY = this.mouse.y - this.mouse.prevY;
    this.mouse.speed = Math.sqrt(
      this.mouse.velocityX ** 2 + this.mouse.velocityY ** 2
    );

    // Update CSS custom properties
    const mouseXPercent = (this.mouse.x / window.innerWidth) * 100;
    const mouseYPercent = (this.mouse.y / window.innerHeight) * 100;
    
    document.documentElement.style.setProperty('--mouse-x', `${mouseXPercent}%`);
    document.documentElement.style.setProperty('--mouse-y', `${mouseYPercent}%`);
    document.documentElement.style.setProperty('--mouse-speed', this.mouse.speed);

    // Trigger magnetic effects
    this.updateMagneticElements();
    
    // Create trail particles on fast movement
    if (this.mouse.speed > 5 && this.options.enableParticles) {
      this.createTrailParticle();
    }
  }

  handleClick(e) {
    // Create explosion effect at click position
    this.createClickExplosion(e.clientX, e.clientY);
    
    // Screen shake effect for important actions
    if (e.target.classList.contains('shake-on-click')) {
      this.screenShake();
    }
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.mouse.x = touch.clientX;
    this.mouse.y = touch.clientY;
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.handleMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  }

  handleResize() {
    this.isMobile = window.innerWidth <= 768;
    this.reinitializeParticles();
  }

  initializeEffects() {
    this.setupAdvancedTilt();
    this.setupMagneticElements();
    this.setupMorphingShapes();
    this.setupParticleSystem();
    this.setupGlitchEffects();
    this.setupLiquidButtons();
    this.setupNeuralNetwork();
    this.setupHolographicElements();
  }

  // Advanced 3D Tilt with Physics
  setupAdvancedTilt() {
    const tiltElements = document.querySelectorAll('.tilt-enhanced, .card-3d-enhanced');
    
    tiltElements.forEach(element => {
      let isHovering = false;
      let currentRotation = { x: 0, y: 0 };
      let targetRotation = { x: 0, y: 0 };
      
      element.addEventListener('mouseenter', () => {
        isHovering = true;
        element.style.willChange = 'transform';
      });

      element.addEventListener('mousemove', (e) => {
        if (!isHovering || this.isMobile) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const intensity = parseFloat(element.dataset.tiltIntensity) || 15;
        targetRotation.x = ((e.clientY - centerY) / (rect.height / 2)) * -intensity;
        targetRotation.y = ((e.clientX - centerX) / (rect.width / 2)) * intensity;
        
        // Add parallax to child elements
        const parallaxElements = element.querySelectorAll('[data-parallax-depth]');
        parallaxElements.forEach(child => {
          const depth = parseFloat(child.dataset.parallaxDepth) || 1;
          const translateX = targetRotation.y * depth * 0.5;
          const translateY = targetRotation.x * depth * 0.5;
          child.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
        });
      });

      element.addEventListener('mouseleave', () => {
        isHovering = false;
        targetRotation = { x: 0, y: 0 };
        element.style.willChange = 'auto';
        
        // Reset parallax elements
        const parallaxElements = element.querySelectorAll('[data-parallax-depth]');
        parallaxElements.forEach(child => {
          child.style.transform = 'translate3d(0, 0, 0)';
        });
      });

      // Smooth rotation animation
      const animateTilt = () => {
        if (!element.isConnected) return;
        
        const easing = 0.1;
        currentRotation.x += (targetRotation.x - currentRotation.x) * easing;
        currentRotation.y += (targetRotation.y - currentRotation.y) * easing;
        
        const perspective = element.dataset.perspective || '1000px';
        const translateZ = isHovering ? 20 : 0;
        
        element.style.transform = `
          perspective(${perspective})
          rotateX(${currentRotation.x}deg)
          rotateY(${currentRotation.y}deg)
          translateZ(${translateZ}px)
        `;
        
        requestAnimationFrame(animateTilt);
      };
      
      animateTilt();
    });
  }

  // Magnetic Elements
  setupMagneticElements() {
    const magneticElements = document.querySelectorAll('.magnetic');
    
    magneticElements.forEach(element => {
      let isNear = false;
      
      element.addEventListener('mouseenter', () => {
        isNear = true;
        element.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.320, 1)';
      });

      element.addEventListener('mouseleave', () => {
        isNear = false;
        element.style.transform = 'translate3d(0, 0, 0) scale(1)';
      });
    });
  }

  updateMagneticElements() {
    const magneticElements = document.querySelectorAll('.magnetic');
    
    magneticElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        (this.mouse.x - centerX) ** 2 + (this.mouse.y - centerY) ** 2
      );
      
      const magneticStrength = parseFloat(element.dataset.magnetic) || 0.3;
      const magneticRange = parseFloat(element.dataset.magneticRange) || 100;
      
      if (distance < magneticRange) {
        const force = (magneticRange - distance) / magneticRange;
        const moveX = (this.mouse.x - centerX) * force * magneticStrength;
        const moveY = (this.mouse.y - centerY) * force * magneticStrength;
        const scale = 1 + force * 0.1;
        
        element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${scale})`;
      }
    });
  }

  // Advanced Morphing Shapes
  setupMorphingShapes() {
    const morphElements = document.querySelectorAll('.morph-advanced');
    
    morphElements.forEach(element => {
      let animationPhase = 0;
      
      const animateMorph = () => {
        animationPhase += 0.02;
        
        const x1 = 50 + Math.sin(animationPhase) * 30;
        const y1 = 50 + Math.cos(animationPhase * 0.7) * 20;
        const x2 = 50 + Math.sin(animationPhase * 1.3) * 25;
        const y2 = 50 + Math.cos(animationPhase * 0.9) * 35;
        
        const borderRadius = `${x1}% ${100-x1}% ${y1}% ${100-y1}% / ${x2}% ${y2}% ${100-x2}% ${100-y2}%`;
        element.style.borderRadius = borderRadius;
        
        if (element.isConnected) {
          requestAnimationFrame(animateMorph);
        }
      };
      
      animateMorph();
    });
  }

  // Enhanced Particle System
  setupParticleSystem() {
    if (!this.options.enableParticles) return;
    
    this.particleCanvas = document.createElement('canvas');
    this.particleCanvas.className = 'particle-canvas';
    this.particleCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    document.body.appendChild(this.particleCanvas);
    this.particleCtx = this.particleCanvas.getContext('2d');
    
    this.resizeParticleCanvas();
    this.initParticles();
  }

  resizeParticleCanvas() {
    if (!this.particleCanvas) return;
    
    this.particleCanvas.width = window.innerWidth;
    this.particleCanvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
      size: Math.random() * 3 + 1,
      color: this.getRandomColor(),
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.1
    };
  }

  getRandomColor() {
    const colors = [
      'rgba(16, 185, 129, ',
      'rgba(5, 150, 105, ',
      'rgba(52, 211, 153, ',
      'rgba(110, 231, 183, '
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateParticles() {
    if (!this.particleCtx) return;
    
    this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
    
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.angle += particle.spin;
      
      // Update life
      particle.life -= particle.decay;
      
      // Mouse interaction
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.vx += dx * force * 0.001;
        particle.vy += dy * force * 0.001;
      }
      
      // Boundaries
      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;
      
      // Draw particle
      this.particleCtx.save();
      this.particleCtx.translate(particle.x, particle.y);
      this.particleCtx.rotate(particle.angle);
      this.particleCtx.globalAlpha = particle.life;
      
      this.particleCtx.fillStyle = particle.color + particle.life + ')';
      this.particleCtx.beginPath();
      this.particleCtx.arc(0, 0, particle.size, 0, Math.PI * 2);
      this.particleCtx.fill();
      
      this.particleCtx.restore();
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles[index] = this.createParticle();
      }
    });
  }

  createTrailParticle() {
    if (this.particles.length < this.options.particleCount * 2) {
      const particle = {
        x: this.mouse.x + (Math.random() - 0.5) * 20,
        y: this.mouse.y + (Math.random() - 0.5) * 20,
        vx: -this.mouse.velocityX * 0.1 + (Math.random() - 0.5) * 2,
        vy: -this.mouse.velocityY * 0.1 + (Math.random() - 0.5) * 2,
        life: 1,
        decay: 0.02,
        size: Math.random() * 4 + 2,
        color: this.getRandomColor(),
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2
      };
      
      this.particles.push(particle);
    }
  }

  createClickExplosion(x, y) {
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 3 + Math.random() * 5;
      
      const particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        decay: 0.03,
        size: Math.random() * 6 + 3,
        color: this.getRandomColor(),
        angle: angle,
        spin: (Math.random() - 0.5) * 0.3
      };
      
      this.particles.push(particle);
    }
  }

  // Glitch Effects
  setupGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch-effect');
    
    glitchElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        this.triggerGlitch(element);
      });
    });
  }

  triggerGlitch(element) {
    const originalTransform = element.style.transform;
    const duration = 200;
    const intensity = 5;
    
    const glitchFrames = [
      `translateX(${Math.random() * intensity - intensity/2}px) skew(${Math.random() * 5}deg)`,
      `translateX(${Math.random() * intensity - intensity/2}px) scaleX(${0.9 + Math.random() * 0.2})`,
      `translateY(${Math.random() * intensity - intensity/2}px) skew(${Math.random() * 5}deg)`,
      originalTransform
    ];
    
    let frameIndex = 0;
    const glitchInterval = setInterval(() => {
      element.style.transform = glitchFrames[frameIndex];
      frameIndex++;
      
      if (frameIndex >= glitchFrames.length) {
        clearInterval(glitchInterval);
      }
    }, 50);
  }

  // Liquid Buttons
  setupLiquidButtons() {
    const liquidButtons = document.querySelectorAll('.liquid-button');
    
    liquidButtons.forEach(button => {
      const liquid = document.createElement('div');
      liquid.className = 'liquid-fill';
      liquid.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
        pointer-events: none;
        z-index: -1;
      `;
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(liquid);
      
      button.addEventListener('mouseenter', () => {
        liquid.style.width = '200%';
        liquid.style.height = '200%';
      });
      
      button.addEventListener('mouseleave', () => {
        liquid.style.width = '0';
        liquid.style.height = '0';
      });
    });
  }

  // Neural Network Visualization
  setupNeuralNetwork() {
    const networkElements = document.querySelectorAll('.neural-network');
    
    networkElements.forEach(element => {
      this.createNeuralNetwork(element);
    });
  }

  createNeuralNetwork(container) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const nodes = [];
    const connections = [];
    
    // Create nodes
    for (let i = 0; i < 20; i++) {
      nodes.push({
        x: Math.random() * container.offsetWidth,
        y: Math.random() * container.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        energy: Math.random()
      });
    }
    
    const animateNetwork = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.energy += (Math.random() - 0.5) * 0.1;
        
        // Boundaries
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.energy, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${0.3 + node.energy * 0.7})`;
        ctx.fill();
      });
      
      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${(100 - distance) / 100 * 0.2})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      
      if (container.isConnected) {
        requestAnimationFrame(animateNetwork);
      }
    };
    
    animateNetwork();
  }

  // Holographic Elements
  setupHolographicElements() {
    const holoElements = document.querySelectorAll('.holographic');
    
    holoElements.forEach(element => {
      const shader = document.createElement('div');
      shader.className = 'holo-shader';
      shader.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          45deg,
          transparent 30%,
          rgba(16, 185, 129, 0.1) 50%,
          transparent 70%
        );
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
      `;
      
      element.style.position = 'relative';
      element.appendChild(shader);
      
      element.addEventListener('mouseenter', () => {
        shader.style.opacity = '1';
        shader.style.transform = 'translateX(100%)';
      });
      
      element.addEventListener('mouseleave', () => {
        shader.style.opacity = '0';
        shader.style.transform = 'translateX(-100%)';
      });
    });
  }

  // Screen Shake Effect
  screenShake(intensity = 10, duration = 500) {
    const startTime = Date.now();
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const currentIntensity = intensity * (1 - progress);
        const x = (Math.random() - 0.5) * currentIntensity;
        const y = (Math.random() - 0.5) * currentIntensity;
        
        document.body.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(shake);
      } else {
        document.body.style.transform = 'translate(0, 0)';
      }
    };
    
    shake();
  }

  // Scroll Observer for Animations
  setupScrollObserver() {
    const observerOptions = {
      threshold: [0, 0.1, 0.5, 1],
      rootMargin: '-10% 0px -10% 0px'
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const animationType = element.dataset.scrollAnimation || 'fadeInUp';
        
        if (entry.isIntersecting) {
          element.classList.add('animate-in', `animate-${animationType}`);
          
          // Staggered animations
          if (element.dataset.stagger) {
            const siblings = element.parentElement.children;
            Array.from(siblings).forEach((sibling, index) => {
              setTimeout(() => {
                sibling.classList.add('animate-in');
              }, index * parseInt(element.dataset.stagger));
            });
          }
        } else if (element.dataset.repeat === 'true') {
          element.classList.remove('animate-in', `animate-${animationType}`);
        }
      });
    }, observerOptions);

    // Observe all elements with data-scroll-animation
    document.querySelectorAll('[data-scroll-animation]').forEach(el => {
      this.scrollObserver.observe(el);
    });
  }

  // Animation Loop
  startAnimationLoop() {
    const animate = () => {
      this.updateParticles();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Utility Methods
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Cleanup
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.particleCanvas) {
      this.particleCanvas.remove();
    }
    
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    
    this.particles = [];
    this.activeAnimations.clear();
  }

  // Public API Methods
  addParticleExplosion(x, y, count = 10) {
    this.createClickExplosion(x, y);
  }

  triggerElementGlitch(selector) {
    const element = document.querySelector(selector);
    if (element) {
      this.triggerGlitch(element);
    }
  }

  setPerformanceMode(mode) {
    this.options.performanceMode = mode;
    this.detectPerformanceMode();
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.EnhancedInteractivity = EnhancedInteractivity;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.interactivity = new EnhancedInteractivity();
    });
  } else {
    window.interactivity = new EnhancedInteractivity();
  }
}

export default EnhancedInteractivity;
