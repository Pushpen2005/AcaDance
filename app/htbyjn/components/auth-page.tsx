"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Star, Zap } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import StudentDashboard from "@/components/StudentDashboard"
import FacultyDashboard from "@/components/FacultyDashboard"
import AdminDashboard from "@/components/AdminDashboard"
import { useAdvanced3D } from "@/hooks/use-advanced-3d"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isFlipping, setIsFlipping] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string; id?: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast, toasts } = useToast()
  const { setupTiltEffect, createParticles, createClickEffect, createRippleEffect } = useAdvanced3D()

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)

    // Initialize particle system when container is ready
    if (containerRef.current) {
      createParticles(containerRef.current, {
        count: 15,
        colors: ['#10b981', '#059669', '#34d399', '#6ee7b7'],
        speed: 6,
        size: 3
      })

      // Add click effect listener
      const handleClick = (e: MouseEvent) => {
        createClickEffect(e, containerRef.current!)
      }
      
      containerRef.current.addEventListener('click', handleClick)
      
      return () => {
        containerRef.current?.removeEventListener('click', handleClick)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        })
      }
    }

    // Throttle mouse move events for better performance
    let timeoutId: NodeJS.Timeout
    const throttledMouseMove = (e: MouseEvent) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => handleMouseMove(e), 16) // ~60fps
    }

    window.addEventListener("mousemove", throttledMouseMove)
    return () => {
      window.removeEventListener("mousemove", throttledMouseMove)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    // Simple password strength logic
    let strength = 0
    if (password.length > 5) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    setPasswordStrength(strength)
  }, [password])

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser({
            name: session.user.user_metadata?.name || session.user.email || '',
            email: session.user.email || '',
            id: session.user.id
          })
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setIsSessionLoading(false)
      }
    }
    checkSession()
  }, [])

  const validateField = (field: string, value: string) => {
    const errors: { [key: string]: string } = {}

    if (field === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.email = "Please enter a valid email address"
      }
    }

    if (field === "password" && value) {
      if (value.length < 6) {
        errors.password = "Password must be at least 6 characters"
      }
    }

    if (field === "name" && value && !isLogin) {
      if (value.length < 2) {
        errors.name = "Name must be at least 2 characters"
      }
    }

    setFormErrors((prev) => ({ ...prev, ...errors }))

    // Clear error after 3 seconds
    if (Object.keys(errors).length === 0) {
      setTimeout(() => {
        setFormErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }, 3000)
    }
  }

  // Supabase Auth integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Clear previous errors
    setFormErrors({})

    // Validate fields
    const errors: { [key: string]: string } = {}
    
    if (!email) {
      errors.email = "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.email = "Please enter a valid email address"
      }
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (!isLogin && !name) {
      errors.name = "Name is required"
    } else if (!isLogin && name.length < 2) {
      errors.name = "Name must be at least 2 characters"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      let result
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            data: { name } 
          } 
        })
      }

      if (result.error) {
        toast({ 
          title: "Error", 
          description: result.error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: isLogin ? "Login Successful" : "Sign Up Successful",
          description: isLogin ? "Welcome back!" : "Your account has been created.",
        })
        
        if (result.data.user) {
          setUser({ 
            name: result.data.user.user_metadata?.name || name, 
            email: result.data.user.email || email,
            id: result.data.user.id
          })
        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // OAuth login
  const handleOAuth = async (provider: "google" | "github") => {
    setIsLoading(true)
    try {
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo
        }
      })
      if (error) {
        toast({ 
          title: "OAuth Error", 
          description: error.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("OAuth error:", error)
      toast({ 
        title: "OAuth Error", 
        description: "Failed to authenticate with OAuth provider",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsFlipping(true)
    setFormErrors({}) // Clear errors when switching modes

    setTimeout(() => {
      setIsLogin(!isLogin)
      setEmail("")
      setPassword("")
      setName("")
    }, 400)

    setTimeout(() => {
      setIsFlipping(false)
    }, 800)
  }

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()
          if (data && data.role) {
            setUserRole(data.role)
          } else if (error) {
            console.error("Error fetching user role:", error)
          }
        }
      } catch (error) {
        console.error("Error in fetchRole:", error)
      }
    }
    fetchRole()
  }, [user])

  return (
    <ToastProvider>
      {isSessionLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center particle-system">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin loading-3d"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-green-300 border-b-transparent rounded-full animate-spin loading-3d" style={{ animationDirection: 'reverse', animationDelay: '0.2s' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-green-700 font-medium animate-pulse">Initializing Authentication...</h3>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={darkMode ? "dark" : ""}>
          <button
            className="absolute top-6 right-6 z-20 px-4 py-2 rounded-full bg-gray-100 text-green-700 font-semibold shadow hover:bg-green-100 transition-colors duration-200"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>

        <div
          ref={containerRef}
          className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden particle-system gradient-interactive perspective-container"
        >
          {/* Enhanced Parallax Background */}
          <div className="parallax-bg" data-parallax="0.1"></div>
          
          {/* Advanced Particle System */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 bg-green-300 rounded-full opacity-30 animate-float-particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animationDelay: `${particle.delay}s`,
                  transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
                }}
              />
            ))}
          </div>

          {/* Morphing Background Blobs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 morph-blob blur-3xl opacity-20" />
          <div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 morph-blob blur-3xl opacity-20"
            style={{ animationDelay: "10s" }}
          />

          <div
            className={`w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-center relative z-10 ${isFlipping ? "flip-animation" : ""}`}
          >
            <div className="hidden lg:flex flex-col items-center justify-center space-y-8 animate-fade-in-up" data-animate="true">
              <div className="relative group">
                <div
                  className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-float-3d shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl tilt-card glass-morph"
                  style={{
                    transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px) scale(${1 + mousePosition.x * 0.1})`,
                  }}
                >
                  <Sparkles className="w-16 h-16 text-white animate-pulse" />
                </div>

                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full animate-bounce hover-lift-3d">
                  <Star className="w-4 h-4 text-white m-2" />
                </div>
                <div
                  className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-300 rounded-full animate-pulse-slow flex items-center justify-center hover-lift-3d"
                  style={{ animationDelay: "1s" }}
                >
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
              </div>

              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent animate-gradient-x">
                  Welcome Back
                </h1>
                <p className="text-lg text-gray-600 max-w-md animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                  Join thousands of users who trust our platform for their daily workflow and productivity needs.
                </p>
              </div>

              <div className="flex space-x-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-green-500 rounded-full animate-pulse cursor-pointer hover:scale-150 transition-transform"
                    style={{ animationDelay: `${i * 0.5}s` }}
                    onClick={() => {/* Widget action */}}
                    tabIndex={0}
                    aria-label={`Widget ${i + 1}`}
                    role="button"
                  />
                ))}
              </div>
            </div>

            <div className="w-full max-w-md mx-auto">
              <Card
                className={`shadow-2xl border-0 transition-all duration-500 glass-morph hover:shadow-3xl card-3d tilt-card ${isLogin ? "animate-slide-in-right" : "animate-slide-in-left"} px-2 sm:px-6 py-4 sm:py-8`}
                style={{
                  transform: `perspective(1000px) rotateY(${mousePosition.x * 2}deg) rotateX(${mousePosition.y * 2}deg)`,
                }}
                tabIndex={0}
                aria-label={isLogin ? "Sign In Card" : "Sign Up Card"}
                data-animate="true"
              >
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-bold animate-fade-in-up">
                    {isLogin ? "Sign In" : "Create Account"}
                  </CardTitle>
                  <CardDescription className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    {isLogin ? "Enter your credentials to access your account" : "Fill in your details to get started"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-2 animate-fade-in-up">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User
                            className={`absolute left-3 top-3 h-4 w-4 transition-colors ${focusedField === "name" ? "text-green-500" : "text-muted-foreground"}`}
                            aria-hidden="true"
                          />
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value)
                              validateField("name", e.target.value)
                            }}
                            onFocus={() => setFocusedField("name")}
                            onBlur={() => setFocusedField(null)}
                            className={`pl-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-green-400 input-3d hover-lift ${formErrors.name ? "border-red-400 animate-shake" : ""}`}
                            required={!isLogin}
                            aria-label="Full Name"
                            aria-invalid={!!formErrors.name}
                          />
                          {formErrors.name && (
                            <p className="text-red-500 text-xs mt-1 animate-fade-in-up" role="alert">{formErrors.name}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail
                          className={`absolute left-3 top-3 h-4 w-4 transition-colors ${focusedField === "email" ? "text-green-500" : "text-muted-foreground"}`}
                        />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            validateField("email", e.target.value)
                          }}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          className={`pl-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-green-400 input-3d hover-lift ${formErrors.email ? "border-red-400 animate-shake" : ""}`}
                          required
                          aria-label="Email Address"
                          aria-invalid={!!formErrors.email}
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-xs mt-1 animate-fade-in-up" role="alert">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock
                          className={`absolute left-3 top-3 h-4 w-4 transition-colors ${focusedField === "password" ? "text-green-500" : "text-muted-foreground"}`}
                        />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            validateField("password", e.target.value)
                          }}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          className={`pl-10 pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-green-400 input-3d hover-lift ${formErrors.password ? "border-red-400 animate-shake" : ""}`}
                          required
                          aria-label="Password"
                          aria-invalid={!!formErrors.password}
                        />
                        <Button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-green-500 transition-all duration-200 hover:scale-110 p-0 h-auto bg-transparent hover:bg-transparent"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          size="sm"
                          variant="ghost"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {formErrors.password && (
                          <p className="text-red-500 text-xs mt-1 animate-fade-in-up" role="alert">{formErrors.password}</p>
                        )}
                      </div>

                      {/* Password Strength Meter */}
                      {!isLogin && password && (
                        <>
                          <div className="w-full h-2 mt-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                passwordStrength === 0 ? "bg-red-400 w-1/5" :
                                passwordStrength === 1 ? "bg-orange-400 w-2/5" :
                                passwordStrength === 2 ? "bg-yellow-400 w-3/5" :
                                passwordStrength === 3 ? "bg-green-400 w-4/5" :
                                "bg-green-600 w-full"
                              }`}
                            ></div>
                          </div>
                          <div className="text-xs mt-1 text-gray-500">
                            {passwordStrength === 0 && "Very Weak"}
                            {passwordStrength === 1 && "Weak"}
                            {passwordStrength === 2 && "Medium"}
                            {passwordStrength === 3 && "Strong"}
                            {passwordStrength === 4 && "Very Strong"}
                          </div>
                        </>
                      )}
                    </div>

                    {isLogin && (
                      <div className="flex justify-end">
                        <button type="button" className="text-sm text-primary hover:text-primary/80 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 btn-3d hover-lift-3d"
                      disabled={isLoading}
                      aria-label={isLogin ? "Sign In" : "Create Account"}
                      onClick={(e) => createRippleEffect(e.nativeEvent, e.currentTarget)}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin loading-3d"></div>
                          <span>Processing...</span>
                        </div>
                      ) : isLogin ? (
                        "Sign In"
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                      <button
                        onClick={toggleMode}
                        className="ml-1 text-green-600 hover:text-green-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                        aria-label={isLogin ? "Switch to Sign Up" : "Switch to Sign In"}
                      >
                        {isLogin ? "Sign up" : "Sign in"}
                      </button>
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md bg-white border-gray-200 hover:border-green-300 hover:bg-green-50 group focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 btn-3d glass-morph hover-lift"
                        aria-label="Continue with Google"
                        onClick={(e) => {
                          createRippleEffect(e.nativeEvent, e.currentTarget)
                          handleOAuth("google")
                        }}
                      >
                        <svg className="w-4 h-4 mr-2 group-hover:animate-pulse" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md bg-white border-gray-200 hover:border-green-300 hover:bg-green-50 group focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 btn-3d glass-morph hover-lift"
                        aria-label="Continue with GitHub"
                        onClick={(e) => {
                          createRippleEffect(e.nativeEvent, e.currentTarget)
                          handleOAuth("github")
                        }}
                      >
                        <svg className="w-4 h-4 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
                        </svg>
                        GitHub
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {user && (
            <div className="absolute top-6 right-24 z-20 flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow">
              <User className="w-6 h-6 text-green-700" />
              <span className="font-semibold text-green-700">{user.name || user.email}</span>
              <button
                className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-green-100 transition-colors text-xs"
                onClick={() => {
                  setUser(null)
                  setUserRole(null)
                  supabase.auth.signOut()
                }}
                aria-label="Sign out"
              >
                Logout
              </button>
            </div>
          )}

          {userRole && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold shadow">
              Role: {userRole}
            </div>
          )}

          {user && userRole && (
            <>
              {userRole === "Student" && <StudentDashboard />}
              {userRole === "Faculty" && <FacultyDashboard />}
              {userRole === "Admin" && <AdminDashboard />}
            </>
          )}
        </div>

        <ToastViewport />
        {toasts.map((t) => (
          <Toast key={t.id} open={t.open} variant={t.variant || "default"}>
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
            <ToastClose />
          </Toast>
        ))}
      </div>
      )}
    </ToastProvider>
  )
}
