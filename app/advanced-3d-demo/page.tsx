"use client"

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Star, Zap, Heart, Code, Palette } from "lucide-react"
import { useAdvanced3D } from "@/hooks/use-advanced-3d"

export default function Advanced3DDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setupTiltEffect, createParticles, createClickEffect, createRippleEffect, addFloatingAnimation } = useAdvanced3D()
  const floatingRef = useRef<HTMLDivElement>(null)
  const tiltCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize particle system
    if (containerRef.current) {
      createParticles(containerRef.current, {
        count: 30,
        colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'],
        speed: 8,
        size: 4
      })

      // Add click effect
      const handleClick = (e: MouseEvent) => {
        createClickEffect(e, containerRef.current!)
      }
      
      containerRef.current.addEventListener('click', handleClick)
      
      return () => {
        containerRef.current?.removeEventListener('click', handleClick)
      }
    }
  }, [createParticles, createClickEffect])

  useEffect(() => {
    // Setup tilt effect for card
    if (tiltCardRef.current) {
      const cleanup = setupTiltEffect(tiltCardRef.current)
      return cleanup
    }
  }, [setupTiltEffect])

  useEffect(() => {
    // Setup floating animation
    if (floatingRef.current) {
      const cleanup = addFloatingAnimation(floatingRef.current, 1.5)
      return cleanup
    }
  }, [addFloatingAnimation])

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 particle-system gradient-interactive perspective-container p-8"
    >
      {/* Parallax Background */}
      <div className="parallax-bg" data-parallax="0.2"></div>
      
      {/* Morphing Background Blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 morph-blob blur-3xl opacity-20" />
      <div className="absolute bottom-10 right-10 w-64 h-64 morph-blob blur-3xl opacity-20" style={{ animationDelay: "10s" }} />
      
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-6" data-animate="true">
          <div ref={floatingRef} className="inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center glass-morph hover-lift-3d">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
            Advanced 3D Animations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience cutting-edge interactive effects with performance optimization and accessibility support
          </p>
        </div>

        {/* Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tilt Card */}
          <Card 
            ref={tiltCardRef}
            className="card-3d tilt-card glass-morph hover-lift-3d" 
            data-animate="true"
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-4 hover-lift">
                <Code className="w-6 h-6 text-white" />
              </div>
              <CardTitle>3D Tilt Effects</CardTitle>
              <CardDescription>Interactive mouse-following tilt animations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Move your mouse over this card to see the realistic 3D tilt effect in action.
              </p>
              <Button 
                className="btn-3d hover-lift-3d w-full"
                onClick={(e) => createRippleEffect(e.nativeEvent, e.currentTarget)}
              >
                Try Ripple Effect
              </Button>
            </CardContent>
          </Card>

          {/* Glass Morphism Card */}
          <Card className="glass-morph hover-lift-3d" data-animate="true">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mb-4 hover-lift">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Glass Morphism</CardTitle>
              <CardDescription>Modern glass-like translucent effects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="glass-morph p-4 rounded-lg">
                  <p className="text-sm">Nested glass effect with backdrop blur</p>
                </div>
                <Input 
                  className="input-3d hover-lift" 
                  placeholder="Interactive input field"
                />
              </div>
            </CardContent>
          </Card>

          {/* Particle System Card */}
          <Card className="card-3d glass-morph hover-lift-3d relative overflow-hidden" data-animate="true">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-4 hover-lift">
                <Star className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Particle System</CardTitle>
              <CardDescription>Dynamic interactive particles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Click anywhere on this page to create particle explosions!
              </p>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Form Section */}
        <Card className="glass-morph card-3d max-w-2xl mx-auto" data-animate="true">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Interactive Form Elements</CardTitle>
            <CardDescription>Enhanced inputs with 3D animations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demo-name">Floating Label Input</Label>
                <Input 
                  id="demo-name"
                  className="input-3d hover-lift" 
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-email">Enhanced Email Input</Label>
                <Input 
                  id="demo-email"
                  type="email"
                  className="input-3d hover-lift" 
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                className="btn-3d hover-lift-3d flex-1"
                onClick={(e) => createRippleEffect(e.nativeEvent, e.currentTarget)}
              >
                Primary Action
              </Button>
              <Button 
                variant="outline" 
                className="btn-3d glass-morph hover-lift flex-1"
                onClick={(e) => createRippleEffect(e.nativeEvent, e.currentTarget)}
              >
                Secondary Action
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Info */}
        <Card className="glass-morph max-w-4xl mx-auto" data-animate="true">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>Performance & Accessibility</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Performance Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• GPU-accelerated transforms</li>
                  <li>• Throttled mouse events</li>
                  <li>• Mobile optimization</li>
                  <li>• Low-battery detection</li>
                  <li>• Reduced motion support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Accessibility Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Respects prefers-reduced-motion</li>
                  <li>• Keyboard navigation support</li>
                  <li>• Screen reader compatibility</li>
                  <li>• High contrast mode support</li>
                  <li>• Focus indicators</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8" data-animate="true">
          <p className="text-gray-500">
            Built with React, TypeScript, and cutting-edge CSS animations
          </p>
        </div>
      </div>
    </div>
  )
}
