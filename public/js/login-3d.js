// ===== LOGIN PAGE 3D INTERACTIVITY =====

class LoginEffects3D {
  constructor() {
    this.init();
    this.setupLoginAnimations();
    this.createLoginParticles();
    this.setupFormInteractions();
  }

  init() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseenter', () => this.startInteractions());
    document.addEventListener('mouseleave', () => this.resetInteractions());
  }

  handleMouseMove(e) {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    
    this.updateCardTilt(e);
    this.updateParallaxElements(e);
    this.updateGlowEffects(e);
  }

  setupLoginAnimations() {
    // Entrance animation for login card
    const loginCard = document.querySelector('.login-card-3d');
    if (loginCard) {
      loginCard.style.opacity = '0';
      loginCard.style.transform = 'translateY(50px) rotateX(20deg)';
      
      setTimeout(() => {
        loginCard.style.transition = 'all 1s cubic-bezier(0.23, 1, 0.320, 1)';
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0) rotateX(0deg)';
      }, 300);
    }

    // Staggered animation for form elements
    const formElements = document.querySelectorAll('.login-input-group-3d, .login-button-3d, .login-social-3d');
    formElements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.320, 1)';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 500 + (index * 100));
    });
  }

  updateCardTilt(e) {
    const loginCard = document.querySelector('.login-card-3d');
    if (!loginCard) return;

    const rect = loginCard.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    
    const maxTilt = 12;
    const tiltX = deltaY * maxTilt;
    const tiltY = deltaX * -maxTilt;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const translateZ = Math.min(distance * 15, 25);
    
    loginCard.style.transform = `
      perspective(1000px) 
      rotateX(${tiltX}deg) 
      rotateY(${tiltY}deg) 
      translateZ(${translateZ}px)
    `;
  }

  updateParallaxElements(e) {
    const parallaxElements = document.querySelectorAll('.login-particle');
    const intensity = 0.1;
    
    parallaxElements.forEach((element, index) => {
      const depth = (index % 3 + 1) * intensity;
      const moveX = this.mouseX * depth * 30;
      const moveY = this.mouseY * depth * 30;
      
      element.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  }

  updateGlowEffects(e) {
    const glowElements = document.querySelectorAll('.login-input-3d, .login-button-3d');
    
    glowElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      );
      
      const maxDistance = 200;
      const glowIntensity = Math.max(0, 1 - (distance / maxDistance));
      
      if (glowIntensity > 0) {
        element.style.boxShadow = `
          0 0 ${20 * glowIntensity}px rgba(34, 197, 94, ${0.3 * glowIntensity}),
          0 0 ${40 * glowIntensity}px rgba(34, 197, 94, ${0.2 * glowIntensity})
        `;
      } else {
        element.style.boxShadow = '';
      }
    });
  }

  createLoginParticles() {
    const container = document.querySelector('.login-particles') || 
                     document.querySelector('.login-container');
    
    if (!container) return;

    // Create particle container if it doesn't exist
    let particleContainer = document.querySelector('.login-particles');
    if (!particleContainer) {
      particleContainer = document.createElement('div');
      particleContainer.className = 'login-particles';
      container.appendChild(particleContainer);
    }

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      this.createLoginParticle(particleContainer, i);
    }
  }

  createLoginParticle(container, index) {
    const particle = document.createElement('div');
    particle.className = 'login-particle';
    
    const size = Math.random() * 6 + 2;
    const startX = Math.random() * 100;
    const animationDuration = Math.random() * 10 + 15;
    const animationDelay = (index * 0.5) + Math.random() * 2;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${startX}%;
      top: 100%;
      background: radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, transparent 70%);
      border-radius: 50%;
      animation: login-particle-rise ${animationDuration}s linear infinite;
      animation-delay: ${animationDelay}s;
      pointer-events: none;
    `;
    
    container.appendChild(particle);
  }

  setupFormInteractions() {
    this.setupInputEffects();
    this.setupButtonEffects();
    this.setupToggleEffects();
    this.setupValidationEffects();
  }

  setupInputEffects() {
    const inputs = document.querySelectorAll('.login-input-3d');
    
    inputs.forEach(input => {
      // Focus effects
      input.addEventListener('focus', (e) => {
        this.createInputFocusEffect(e.target);
      });
      
      input.addEventListener('blur', (e) => {
        this.removeInputFocusEffect(e.target);
      });
      
      // Typing effects
      input.addEventListener('input', (e) => {
        this.createTypingEffect(e.target);
      });
    });
  }

  createInputFocusEffect(input) {
    const inputGroup = input.closest('.login-input-group-3d');
    if (!inputGroup) return;

    // Create focus ring
    const focusRing = document.createElement('div');
    focusRing.className = 'login-focus-ring';
    focusRing.style.cssText = `
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px solid #22c55e;
      border-radius: 1rem;
      opacity: 0;
      animation: focus-ring-pulse 0.3s ease-out forwards;
      pointer-events: none;
      z-index: 1;
    `;
    
    inputGroup.style.position = 'relative';
    inputGroup.appendChild(focusRing);

    // 3D lift effect
    input.style.transform = 'translateZ(5px)';
    input.style.transition = 'all 0.3s ease';
  }

  removeInputFocusEffect(input) {
    const inputGroup = input.closest('.login-input-group-3d');
    const focusRing = inputGroup?.querySelector('.login-focus-ring');
    
    if (focusRing) {
      focusRing.style.animation = 'focus-ring-fade 0.3s ease-out forwards';
      setTimeout(() => focusRing.remove(), 300);
    }

    input.style.transform = '';
  }

  createTypingEffect(input) {
    const icon = input.nextElementSibling;
    if (icon && icon.classList.contains('login-input-icon-3d')) {
      icon.style.transform = 'translateZ(2px) scale(1.1)';
      icon.style.color = '#22c55e';
      
      clearTimeout(icon.resetTimer);
      icon.resetTimer = setTimeout(() => {
        icon.style.transform = '';
        icon.style.color = '';
      }, 200);
    }
  }

  setupButtonEffects() {
    const buttons = document.querySelectorAll('.login-button-3d, .login-social-button-3d');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', (e) => {
        this.createButtonHoverEffect(e.target);
      });
      
      button.addEventListener('mouseleave', (e) => {
        this.removeButtonHoverEffect(e.target);
      });
      
      button.addEventListener('mousedown', (e) => {
        this.createButtonPressEffect(e.target, e);
      });
      
      button.addEventListener('mouseup', (e) => {
        this.removeButtonPressEffect(e.target);
      });
    });
  }

  createButtonHoverEffect(button) {
    // Create floating particles around button
    for (let i = 0; i < 5; i++) {
      this.createButtonParticle(button, i);
    }
    
    // Enhanced glow
    button.style.boxShadow = `
      0 15px 35px rgba(34, 197, 94, 0.4),
      0 8px 15px rgba(34, 197, 94, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `;
  }

  removeButtonHoverEffect(button) {
    // Remove particles
    const particles = button.querySelectorAll('.button-particle');
    particles.forEach(particle => particle.remove());
  }

  createButtonParticle(button, index) {
    const particle = document.createElement('div');
    particle.className = 'button-particle';
    
    const size = Math.random() * 4 + 2;
    const angle = (index / 5) * Math.PI * 2;
    const radius = 40;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: #22c55e;
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      animation: button-particle-float 2s ease-in-out infinite;
      animation-delay: ${index * 0.1}s;
      pointer-events: none;
      z-index: 10;
    `;
    
    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    
    button.style.position = 'relative';
    button.appendChild(particle);
  }

  createButtonPressEffect(button, event) {
    // Create ripple effect
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    const size = Math.max(rect.width, rect.height) * 1.5;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: login-ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 5;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    // Button press animation
    button.style.transform = 'scale(0.95) translateZ(2px)';
  }

  removeButtonPressEffect(button) {
    button.style.transform = '';
  }

  setupToggleEffects() {
    const toggleOptions = document.querySelectorAll('.login-toggle-option-3d');
    
    toggleOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        this.animateToggleSwitch(e.target);
      });
    });
  }

  animateToggleSwitch(activeOption) {
    const allOptions = document.querySelectorAll('.login-toggle-option-3d');
    
    // Remove active state from all options
    allOptions.forEach(option => {
      option.classList.remove('active');
      option.style.transform = '';
    });
    
    // Add active state to clicked option
    activeOption.classList.add('active');
    activeOption.style.transform = 'translateZ(5px) scale(1.02)';
    
    // Create switch animation
    this.createSwitchEffect(activeOption);
  }

  createSwitchEffect(element) {
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
      border-radius: inherit;
      animation: switch-shine 0.6s ease-out;
      pointer-events: none;
    `;
    
    element.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
  }

  setupValidationEffects() {
    // Add validation visual feedback
    const form = document.querySelector('.login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      this.handleFormSubmission(e);
    });
  }

  handleFormSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.login-button-3d');
    const inputs = event.target.querySelectorAll('.login-input-3d');
    
    // Create loading state
    this.createLoadingState(submitButton);
    
    // Simulate validation
    setTimeout(() => {
      this.createSuccessState(submitButton, inputs);
    }, 2000);
  }

  createLoadingState(button) {
    const originalText = button.textContent;
    button.dataset.originalText = originalText;
    
    button.innerHTML = `
      <div class="login-spinner-3d"></div>
      Processing...
    `;
    button.disabled = true;
    button.style.pointerEvents = 'none';
  }

  createSuccessState(button, inputs) {
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 0.5rem;">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Success!
    `;
    
    // Success animation for inputs
    inputs.forEach((input, index) => {
      setTimeout(() => {
        input.style.borderColor = '#22c55e';
        input.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.2)';
        
        setTimeout(() => {
          input.style.borderColor = '';
          input.style.boxShadow = '';
        }, 1000);
      }, index * 100);
    });
    
    // Reset button after animation
    setTimeout(() => {
      button.innerHTML = button.dataset.originalText;
      button.disabled = false;
      button.style.pointerEvents = '';
    }, 2000);
  }

  // Performance optimization for mobile
  optimizeForMobile() {
    if (window.innerWidth < 768) {
      // Reduce particle count
      const particles = document.querySelectorAll('.login-particle');
      particles.forEach((particle, index) => {
        if (index % 2 === 0) particle.remove();
      });
      
      // Simplify animations
      const style = document.createElement('style');
      style.textContent = `
        .login-card-3d:hover {
          transform: scale(1.02) !important;
        }
        
        .login-button-3d:hover {
          transform: translateY(-2px) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// CSS for login effects
const loginStyle = document.createElement('style');
loginStyle.textContent = `
  @keyframes login-particle-rise {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes focus-ring-pulse {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes focus-ring-fade {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.1);
    }
  }
  
  @keyframes button-particle-float {
    0%, 100% {
      transform: translate(calc(-50% + var(--x) * 0.5), calc(-50% + var(--y) * 0.5));
      opacity: 0.5;
    }
    50% {
      transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y)));
      opacity: 1;
    }
  }
  
  @keyframes login-ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
  
  @keyframes switch-shine {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(loginStyle);

// Initialize login effects
let loginEffects3D;

const initLoginEffects = () => {
  if (document.querySelector('.login-container') || 
      document.querySelector('.login-card-3d')) {
    loginEffects3D = new LoginEffects3D();
    loginEffects3D.optimizeForMobile();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginEffects);
} else {
  initLoginEffects();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoginEffects3D;
}

window.LoginEffects3D = LoginEffects3D;
