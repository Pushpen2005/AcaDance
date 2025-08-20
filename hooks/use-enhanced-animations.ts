import { useEffect, useRef, useCallback } from 'react';

interface Advanced3DOptions {
  enableTilt?: boolean;
  enableParticles?: boolean;
  enableHover?: boolean;
  tiltIntensity?: number;
  perspective?: number;
}

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

interface ParticleOptions {
  color?: string;
  count?: number;
  onClick?: boolean;
}

interface MorphingOptions {
  speed?: number;
}

interface TypewriterOptions {
  speed?: number;
  delay?: number;
}

interface CounterOptions {
  duration?: number;
  startValue?: number;
  formatter?: (value: number) => string;
}

interface MagneticOptions {
  strength?: number;
  range?: number;
}

interface GlitchOptions {
  intensity?: number;
  duration?: number;
  trigger?: 'hover' | 'manual';
}

interface LiquidButtonOptions {
  color?: string;
}

/**
 * Custom hook for advanced 3D animations and interactivity
 */
export function useAdvanced3D(options: Advanced3DOptions = {}) {
  const elementRef = useRef<HTMLElement>(null);
  const animationsRef = useRef(new Set<number>());
  
  const defaultOptions = {
    enableTilt: true,
    enableParticles: true,
    enableHover: true,
    tiltIntensity: 15,
    perspective: 1000,
    ...options
  };

  // Initialize 3D effects
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const cleanup: (() => void)[] = [];

    // Enhanced tilt effect
    if (defaultOptions.enableTilt) {
      let isHovering = false;
      let currentRotation = { x: 0, y: 0 };
      let targetRotation = { x: 0, y: 0 };

      const handleMouseEnter = () => {
        isHovering = true;
        element.style.willChange = 'transform';
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isHovering) return;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        targetRotation.x = ((e.clientY - centerY) / (rect.height / 2)) * -defaultOptions.tiltIntensity;
        targetRotation.y = ((e.clientX - centerX) / (rect.width / 2)) * defaultOptions.tiltIntensity;
      };

      const handleMouseLeave = () => {
        isHovering = false;
        targetRotation = { x: 0, y: 0 };
        element.style.willChange = 'auto';
      };

      // Smooth animation loop
      const animateTilt = () => {
        const easing = 0.1;
        currentRotation.x += (targetRotation.x - currentRotation.x) * easing;
        currentRotation.y += (targetRotation.y - currentRotation.y) * easing;

        const translateZ = isHovering ? 20 : 0;
        element.style.transform = `
          perspective(${defaultOptions.perspective}px)
          rotateX(${currentRotation.x}deg)
          rotateY(${currentRotation.y}deg)
          translateZ(${translateZ}px)
        `;

        if (element.isConnected) {
          requestAnimationFrame(animateTilt);
        }
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);

      const animationId = requestAnimationFrame(animateTilt);
      animationsRef.current.add(animationId);

      cleanup.push(() => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
        cancelAnimationFrame(animationId);
      });
    }

    // Enhanced hover effects
    if (defaultOptions.enableHover) {
      const handleHoverStart = () => {
        element.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        element.style.transform += ' translateY(-2px)';
        element.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
      };

      const handleHoverEnd = () => {
        element.style.transform = element.style.transform.replace('translateY(-2px)', '');
        element.style.boxShadow = '';
      };

      element.addEventListener('mouseenter', handleHoverStart);
      element.addEventListener('mouseleave', handleHoverEnd);

      cleanup.push(() => {
        element.removeEventListener('mouseenter', handleHoverStart);
        element.removeEventListener('mouseleave', handleHoverEnd);
      });
    }

    // Cleanup function
    return () => {
      cleanup.forEach(fn => fn());
      animationsRef.current.forEach(id => cancelAnimationFrame(id));
      animationsRef.current.clear();
    };
  }, []);

  return elementRef;
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(animationType = 'fadeInUp', options: ScrollAnimationOptions = {}) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;

    // Add initial animation class
    element.classList.add('animate-on-scroll', animationType);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          entry.target.classList.remove('animate-in');
        }
      });
    }, { threshold, rootMargin });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [animationType, options]);

  return elementRef;
}

/**
 * Hook for particle effects
 */
export function useParticleEffect(options: ParticleOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  const createParticle = useCallback((x: number, y: number) => {
    if (!containerRef.current) return;

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 4px;
      height: 4px;
      background: ${options.color || '#10b981'};
      border-radius: 50%;
      pointer-events: none;
      animation: particleFloat 2s ease-out forwards;
    `;

    containerRef.current.appendChild(particle);
    particlesRef.current.push(particle);

    setTimeout(() => {
      particle.remove();
      particlesRef.current = particlesRef.current.filter(p => p !== particle);
    }, 2000);
  }, [options.color]);

  const triggerParticles = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const count = options.count || 10;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        createParticle(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 20
        );
      }, i * 50);
    }
  }, [createParticle, options.count]);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    element.style.position = 'relative';
    element.style.overflow = 'hidden';

    if (options.onClick) {
      element.addEventListener('click', triggerParticles);
    }

    return () => {
      if (options.onClick) {
        element.removeEventListener('click', triggerParticles);
      }
      particlesRef.current.forEach(particle => particle.remove());
      particlesRef.current = [];
    };
  }, [triggerParticles, options.onClick]);

  return { containerRef, triggerParticles };
}

/**
 * Hook for morphing shapes
 */
export function useMorphingShape(options = {}) {
  const shapeRef = useRef(null);

  useEffect(() => {
    if (!shapeRef.current) return;

    const element = shapeRef.current;
    const speed = options.speed || 0.02;
    let animationPhase = 0;
    let animationId;

    const animate = () => {
      animationPhase += speed;

      const x1 = 50 + Math.sin(animationPhase) * 30;
      const y1 = 50 + Math.cos(animationPhase * 0.7) * 20;
      const x2 = 50 + Math.sin(animationPhase * 1.3) * 25;
      const y2 = 50 + Math.cos(animationPhase * 0.9) * 35;

      const borderRadius = `${x1}% ${100-x1}% ${y1}% ${100-y1}% / ${x2}% ${y2}% ${100-x2}% ${100-y2}%`;
      element.style.borderRadius = borderRadius;

      if (element.isConnected) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [options.speed]);

  return shapeRef;
}

/**
 * Hook for typewriter effect
 */
export function useTypewriter(text, options = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current || !text) return;

    const element = elementRef.current;
    const speed = options.speed || 50;
    const delay = options.delay || 0;

    element.textContent = '';
    element.style.borderRight = '2px solid';
    element.style.animation = 'blink 0.75s step-end infinite';

    const startTyping = () => {
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
    };

    if (delay > 0) {
      setTimeout(startTyping, delay);
    } else {
      startTyping();
    }
  }, [text, options.speed, options.delay]);

  return elementRef;
}

/**
 * Hook for counter animation
 */
export function useCounter(targetValue, options = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current || targetValue === undefined) return;

    const element = elementRef.current;
    const duration = options.duration || 2000;
    const startValue = options.startValue || 0;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const startTime = Date.now();

          const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

            element.textContent = options.formatter 
              ? options.formatter(current) 
              : current.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              element.textContent = options.formatter 
                ? options.formatter(targetValue) 
                : targetValue.toLocaleString();
            }
          };

          updateCounter();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [targetValue, options]);

  return elementRef;
}

/**
 * Hook for magnetic effect
 */
export function useMagnetic(options = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const strength = options.strength || 0.3;
    const range = options.range || 100;

    const handleMouseMove = (e) => {
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
        const scale = 1 + force * 0.1;

        element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${scale})`;
        element.style.transition = 'transform 0.1s ease-out';
      } else {
        element.style.transform = 'translate3d(0, 0, 0) scale(1)';
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate3d(0, 0, 0) scale(1)';
      element.style.transition = 'transform 0.3s ease';
    };

    document.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [options.strength, options.range]);

  return elementRef;
}

/**
 * Hook for glitch effect
 */
export function useGlitch(options = {}) {
  const elementRef = useRef(null);

  const triggerGlitch = useCallback(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const intensity = options.intensity || 5;
    const duration = options.duration || 200;

    const originalTransform = element.style.transform;
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
    }, duration / glitchFrames.length);
  }, [options.intensity, options.duration]);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    if (options.trigger === 'hover') {
      element.addEventListener('mouseenter', triggerGlitch);
      
      return () => {
        element.removeEventListener('mouseenter', triggerGlitch);
      };
    }
  }, [triggerGlitch, options.trigger]);

  return { elementRef, triggerGlitch };
}

/**
 * Hook for liquid button effect
 */
export function useLiquidButton(options = {}) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const liquid = document.createElement('div');
    
    liquid.className = 'liquid-fill';
    liquid.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: ${options.color || 'radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent)'};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
      pointer-events: none;
      z-index: -1;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(liquid);

    const handleMouseEnter = () => {
      liquid.style.width = '200%';
      liquid.style.height = '200%';
    };

    const handleMouseLeave = () => {
      liquid.style.width = '0';
      liquid.style.height = '0';
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      if (liquid.parentNode) {
        liquid.parentNode.removeChild(liquid);
      }
    };
  }, [options.color]);

  return buttonRef;
}

export default {
  useAdvanced3D,
  useScrollAnimation,
  useParticleEffect,
  useMorphingShape,
  useTypewriter,
  useCounter,
  useMagnetic,
  useGlitch,
  useLiquidButton
};
