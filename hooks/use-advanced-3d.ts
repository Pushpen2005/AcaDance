import { useEffect, useCallback, useRef } from 'react'

interface MousePosition {
  x: number
  y: number
}

interface ParticleOptions {
  count?: number
  colors?: string[]
  speed?: number
  size?: number
}

export function useAdvanced3D() {
  const mousePosition = useRef<MousePosition>({ x: 0, y: 0 })
  const animationFrame = useRef<number | null>(null)
  const particles = useRef<HTMLElement[]>([])

  // Enhanced mouse tracking with 3D effects
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePosition.current = {
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100
    }

    // Update CSS custom properties for interactive gradients
    document.documentElement.style.setProperty('--mouse-x', `${mousePosition.current.x}%`)
    document.documentElement.style.setProperty('--mouse-y', `${mousePosition.current.y}%`)

    // Apply parallax effects
    updateParallaxElements(e)
  }, [])

  const updateParallaxElements = useCallback((event: MouseEvent) => {
    const parallaxElements = document.querySelectorAll('[data-parallax]')
    
    parallaxElements.forEach(element => {
      const speed = parseFloat((element as HTMLElement).dataset.parallax || '0.1')
      const x = (event.clientX * speed) / 100
      const y = (event.clientY * speed) / 100
      
      ;(element as HTMLElement).style.transform = `translate3d(${x}px, ${y}px, 0)`
    })
  }, [])

  // Tilt effect for cards
  const setupTiltEffect = useCallback((element: HTMLElement) => {
    const handleMouseEnter = () => {
      if (window.innerWidth <= 768) return
      element.style.transition = 'transform 0.1s ease-out'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth <= 768) return
      
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const rotateX = (e.clientY - centerY) / (rect.height / 2) * -10
      const rotateY = (e.clientX - centerX) / (rect.width / 2) * 10
      
      element.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(20px)
      `
    }

    const handleMouseLeave = () => {
      element.style.transition = 'transform 0.3s ease'
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Create interactive particles
  const createParticles = useCallback((container: HTMLElement, options: ParticleOptions = {}) => {
    const {
      count = 20,
      colors = ['#10b981', '#059669', '#34d399'],
      speed = 8,
      size = 4
    } = options

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.cssText = `
        position: absolute;
        width: ${size + Math.random() * 3}px;
        height: ${size + Math.random() * 3}px;
        background: radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]}, transparent);
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particleFloat ${speed + Math.random() * 4}s linear infinite;
        animation-delay: ${Math.random() * 8}s;
        pointer-events: none;
        opacity: 0.6;
      `
      
      container.appendChild(particle)
      particles.current.push(particle)
    }
  }, [])

  // Create click effect
  const createClickEffect = useCallback((event: MouseEvent, container: HTMLElement) => {
    const rect = container.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div')
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #10b981, transparent);
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        animation: particleExplode 1s ease-out forwards;
        pointer-events: none;
        --random-x: ${(Math.random() - 0.5) * 100}px;
        --random-y: ${(Math.random() - 0.5) * 100}px;
      `
      
      container.appendChild(particle)
      
      setTimeout(() => {
        particle.remove()
      }, 1000)
    }
  }, [])

  // Ripple effect for buttons
  const createRippleEffect = useCallback((event: MouseEvent, element: HTMLElement) => {
    const ripple = document.createElement('span')
    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `
    
    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)
    
    setTimeout(() => {
      ripple.remove()
    }, 600)
  }, [])

  // Floating animation for elements
  const addFloatingAnimation = useCallback((element: HTMLElement, intensity: number = 1) => {
    let start: number
    const amplitude = 20 * intensity
    const frequency = 0.001
    
    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      
      const y = Math.sin(elapsed * frequency) * amplitude
      const x = Math.cos(elapsed * frequency * 0.5) * (amplitude * 0.3)
      const rotation = Math.sin(elapsed * frequency * 0.8) * 5
      
      element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`
      
      animationFrame.current = requestAnimationFrame(animate)
    }
    
    animationFrame.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  // Input focus animations
  const setupInputAnimations = useCallback(() => {
    const inputs = document.querySelectorAll('.input-3d')
    
    inputs.forEach(input => {
      const handleFocus = () => {
        const label = input.previousElementSibling as HTMLElement
        if (label && label.tagName === 'LABEL') {
          label.style.transform = 'translateY(-20px) scale(0.8)'
          label.style.color = '#10b981'
          label.style.transition = 'all 0.3s ease'
        }
      }
      
      const handleBlur = () => {
        const label = input.previousElementSibling as HTMLElement
        if (label && label.tagName === 'LABEL' && !(input as HTMLInputElement).value) {
          label.style.transform = 'translateY(0) scale(1)'
          label.style.color = ''
        }
      }
      
      const handleInput = () => {
        // Add typing effect
        ;(input as HTMLElement).style.textShadow = '0 0 5px rgba(16, 185, 129, 0.5)'
        setTimeout(() => {
          ;(input as HTMLElement).style.textShadow = ''
        }, 200)
      }
      
      input.addEventListener('focus', handleFocus)
      input.addEventListener('blur', handleBlur)
      input.addEventListener('input', handleInput)
    })
  }, [])

  // Initialize scroll animations
  const setupScrollAnimations = useCallback(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
          
          // Stagger animations for multiple elements
          const siblings = Array.from(entry.target.parentElement?.children || [])
          siblings.forEach((sibling, index) => {
            if (sibling.classList.contains('stagger')) {
              setTimeout(() => {
                sibling.classList.add('animate-in')
              }, index * 100)
            }
          })
        }
      })
    }, { threshold: 0.1 })
    
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el)
    })
    
    return () => observer.disconnect()
  }, [])

  // Performance optimization
  const optimizeForDevice = useCallback(() => {
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency <= 2) {
      document.documentElement.classList.add('low-performance')
    }
    
    // Disable 3D effects on mobile
    if (window.innerWidth <= 768) {
      document.documentElement.classList.add('mobile-optimized')
    }
    
    // Battery level optimization
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          document.documentElement.classList.add('battery-saver')
        }
      }).catch(() => {
        // Battery API not supported
      })
    }
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    particles.current.forEach(particle => particle.remove())
    particles.current = []
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }
    
    document.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // Initialize all effects
    document.addEventListener('mousemove', handleMouseMove)
    setupInputAnimations()
    optimizeForDevice()
    const scrollCleanup = setupScrollAnimations()

    // Throttle resize events
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        optimizeForDevice()
      }, 250)
    }
    
    window.addEventListener('resize', handleResize)

    return () => {
      cleanup()
      scrollCleanup()
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [handleMouseMove, setupInputAnimations, optimizeForDevice, setupScrollAnimations, cleanup])

  return {
    mousePosition: mousePosition.current,
    setupTiltEffect,
    createParticles,
    createClickEffect,
    createRippleEffect,
    addFloatingAnimation,
    cleanup
  }
}

export default useAdvanced3D
