"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  LogIn,
  Key,
  QrCode,
  Fingerprint
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AuthProps {
  onAuthSuccess?: (user: any) => void
}

export default function EnhancedAuthSystem({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState('login')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: '',
    department: '',
    studentId: '',
    employeeId: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showMFA, setShowMFA] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [deviceFingerprint, setDeviceFingerprint] = useState('')
  
  const { toast } = useToast()
  const router = useRouter()

  // Generate device fingerprint on mount
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx!.textBaseline = 'top'
      ctx!.font = '14px Arial'
      ctx!.fillText('Device fingerprint', 2, 2)
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|')
      
      return btoa(fingerprint).substring(0, 32)
    }
    
    setDeviceFingerprint(generateFingerprint())
  }, [])

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = (password: string) => {
      let strength = 0
      if (password.length >= 8) strength += 25
      if (/[a-z]/.test(password)) strength += 25
      if (/[A-Z]/.test(password)) strength += 25
      if (/[0-9]/.test(password)) strength += 25
      if (/[^A-Za-z0-9]/.test(password)) strength += 25
      return Math.min(strength, 100)
    }
    
    setPasswordStrength(calculateStrength(formData.password))
  }, [formData.password])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    if (activeTab === 'signup') {
      if (!formData.fullName) {
        errors.fullName = 'Full name is required'
      }
      
      if (!formData.role) {
        errors.role = 'Role is required'
      }
      
      if (!formData.department) {
        errors.department = 'Department is required'
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
      
      if (formData.role === 'student' && !formData.studentId) {
        errors.studentId = 'Student ID is required'
      }
      
      if ((formData.role === 'faculty' || formData.role === 'admin') && !formData.employeeId) {
        errors.employeeId = 'Employee ID is required'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      if (activeTab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        if (error) throw error
        
        // Check if user requires MFA
        const { data: profile } = await supabase
          .from('profiles')
          .select('requires_mfa, role')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.requires_mfa) {
          setShowMFA(true)
          return
        }
        
        // Log successful login
        await supabase.from('audit_logs').insert({
          user_id: data.user.id,
          action: 'login',
          details: {
            device_fingerprint: deviceFingerprint,
            ip_address: 'client_ip', // Would be populated server-side
            user_agent: navigator.userAgent
          }
        })
        
        toast({
          title: "Login Successful",
          description: `Welcome back! Redirecting to your ${profile?.role || 'user'} dashboard.`
        })
        
        if (onAuthSuccess) {
          onAuthSuccess(data.user)
        } else {
          router.push('/')
        }
        
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: formData.role,
              department: formData.department,
              student_id: formData.studentId,
              employee_id: formData.employeeId
            }
          }
        })
        
        if (error) throw error
        
        if (data.user) {
          // Create profile
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
            department: formData.department,
            student_id: formData.studentId || null,
            employee_id: formData.employeeId || null,
            device_fingerprint: deviceFingerprint,
            created_at: new Date().toISOString()
          })
          
          // Log successful signup
          await supabase.from('audit_logs').insert({
            user_id: data.user.id,
            action: 'signup',
            details: {
              role: formData.role,
              department: formData.department,
              device_fingerprint: deviceFingerprint
            }
          })
          
          toast({
            title: "Account Created",
            description: "Please check your email to verify your account."
          })
          
          setActiveTab('login')
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFAVerification = async () => {
    setIsLoading(true)
    
    try {
      // In a real implementation, this would verify the MFA code
      // For now, we'll simulate successful verification
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'mfa_verification',
          details: {
            device_fingerprint: deviceFingerprint,
            success: true
          }
        })
        
        toast({
          title: "Authentication Complete",
          description: "MFA verification successful!"
        })
        
        if (onAuthSuccess) {
          onAuthSuccess(user)
        } else {
          router.push('/')
        }
      }
    } catch (error: any) {
      toast({
        title: "MFA Error",
        description: "Invalid verification code",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500'
    if (passwordStrength < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Very Weak'
    if (passwordStrength < 50) return 'Weak'
    if (passwordStrength < 75) return 'Good'
    return 'Strong'
  }

  if (showMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
              <p className="text-green-700 mt-2">Enter the verification code sent to your device</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification Code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="text-center text-lg tracking-wider"
                  maxLength={6}
                />
              </div>
              
              <Button
                onClick={handleMFAVerification}
                disabled={isLoading || mfaCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify</span>
                  </div>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setShowMFA(false)}
                className="w-full"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4"
            >
              <QrCode className="w-8 h-8" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Academic System</CardTitle>
            <p className="text-blue-100 mt-2">Secure Access Portal</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleAuth} className="space-y-4">
                <TabsContent value="login" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@university.edu"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-sm flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{formErrors.email}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {formErrors.password && (
                      <p className="text-red-500 text-sm flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{formErrors.password}</span>
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`pl-10 ${formErrors.fullName ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <p className="text-red-500 text-sm">{formErrors.fullName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@university.edu"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-sm">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.role && (
                        <p className="text-red-500 text-sm">{formErrors.role}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                        <SelectTrigger className={formErrors.department ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select dept" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="computer-science">Computer Science</SelectItem>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.department && (
                        <p className="text-red-500 text-sm">{formErrors.department}</p>
                      )}
                    </div>
                  </div>
                  
                  {formData.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        placeholder="Enter student ID"
                        value={formData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        className={formErrors.studentId ? 'border-red-500' : ''}
                      />
                      {formErrors.studentId && (
                        <p className="text-red-500 text-sm">{formErrors.studentId}</p>
                      )}
                    </div>
                  )}
                  
                  {(formData.role === 'faculty' || formData.role === 'admin') && (
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        placeholder="Enter employee ID"
                        value={formData.employeeId}
                        onChange={(e) => handleInputChange('employeeId', e.target.value)}
                        className={formErrors.employeeId ? 'border-red-500' : ''}
                      />
                      {formErrors.employeeId && (
                        <p className="text-red-500 text-sm">{formErrors.employeeId}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Password Strength:</span>
                          <span className={passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {formErrors.password && (
                      <p className="text-red-500 text-sm">{formErrors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="text-red-500 text-sm">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </TabsContent>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 h-12"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {activeTab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-green-700 flex items-center justify-center space-x-2">
                  <Fingerprint className="w-4 h-4" />
                  <span>Secured with device fingerprinting and audit logging</span>
                </p>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
