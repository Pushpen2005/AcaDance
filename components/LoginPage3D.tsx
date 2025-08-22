"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  GraduationCap,
  BookOpen,
  Github,
  Chrome,
  Apple,
  Sparkles,
  Shield,
  Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LoginPageProps {
  onLogin?: (credentials: any) => void;
  onRegister?: (userData: any) => void;
}

const LoginPage3D: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    role: 'student'
  });
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    // Create initial particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2
    }));
    setParticles(newParticles);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (activeTab === 'login') {
        onLogin?.(formData);
      } else {
        onRegister?.(formData);
      }
      setLoading(false);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="login-3d-container min-h-screen flex items-center justify-center p-4">
      {/* Animated Background Particles */}
      <div className="login-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="login-particle"
            style={{
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.id * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="login-card-3d w-full max-w-md"
      >
        {/* Header */}
        <div className="login-header-3d">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center animate-float shadow-2xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-bounce">
                <BookOpen className="w-3 h-3 text-white m-1.5" />
              </div>
            </div>
          </motion.div>
          
          <h1 className="login-title-3d">Academic System</h1>
          <p className="login-subtitle-3d">Modern Education Management Platform</p>
        </div>

        {/* Login/Register Toggle */}
        <div className="login-toggle-3d">
          <button
            className={`login-toggle-option-3d ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            className={`login-toggle-option-3d ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Sign Up
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Email Input */}
                <div className="login-input-group-3d">
                  <input
                    type="email"
                    className="login-input-3d"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Mail className="login-input-icon-3d w-5 h-5" />
                </div>

                {/* Password Input */}
                <div className="login-input-group-3d">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input-3d"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-input-icon-3d"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Name Input */}
                <div className="login-input-group-3d">
                  <input
                    type="text"
                    className="login-input-3d"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <User className="login-input-icon-3d w-5 h-5" />
                </div>

                {/* Email Input */}
                <div className="login-input-group-3d">
                  <input
                    type="email"
                    className="login-input-3d"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Mail className="login-input-icon-3d w-5 h-5" />
                </div>

                {/* Role Selection */}
                <div className="login-input-group-3d">
                  <select
                    className="login-input-3d"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                  <GraduationCap className="login-input-icon-3d w-5 h-5" />
                </div>

                {/* Password Input */}
                <div className="login-input-group-3d">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input-3d"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <Lock className="login-input-icon-3d w-5 h-5" />
                </div>

                {/* Confirm Password Input */}
                <div className="login-input-group-3d">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input-3d"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-input-icon-3d"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-button-3d w-full flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="login-spinner-3d mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {activeTab === 'login' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Social Login */}
        <div className="login-social-3d">
          <a href="#" className="login-social-button-3d">
            <Chrome className="w-5 h-5" />
            Google
          </a>
          <a href="#" className="login-social-button-3d">
            <Github className="w-5 h-5" />
            GitHub
          </a>
          <a href="#" className="login-social-button-3d">
            <Apple className="w-5 h-5" />
            Apple
          </a>
        </div>

        {/* Features Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-8 grid grid-cols-3 gap-4 text-center"
        >
          <div className="text-white/80">
            <Shield className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <span className="text-xs">Secure</span>
          </div>
          <div className="text-white/80">
            <Zap className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <span className="text-xs">Fast</span>
          </div>
          <div className="text-white/80">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <span className="text-xs">Modern</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-8 text-center"
        >
          <p className="text-white/60 text-sm">
            By continuing, you agree to our{' '}
            <a href="#" className="text-green-400 hover:text-green-300 transition-colors">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-green-400 hover:text-green-300 transition-colors">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage3D;
