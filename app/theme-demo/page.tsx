"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ThemeToggle from "@/components/ThemeToggle"
import { 
  Leaf, 
  Sparkles, 
  Heart, 
  Star, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  GraduationCap 
} from "lucide-react"

export default function ThemeDemo() {
  const [inputValue, setInputValue] = useState("")
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-green-primary bg-green-gradient bg-clip-text text-transparent">
            Modern Green Theme Demo
          </h1>
          <p className="text-lg text-green-muted">
            Bright, modern green and white color scheme with enhanced UI elements
          </p>
          <div className="flex justify-center">
            <ThemeToggle showLabel />
          </div>
        </div>

        {/* Color Palette */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-20 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-medium">Primary</span>
                </div>
                <p className="text-sm text-center text-muted-foreground">Green 600</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 bg-secondary rounded-lg flex items-center justify-center">
                  <span className="text-secondary-foreground font-medium">Secondary</span>
                </div>
                <p className="text-sm text-center text-muted-foreground">Green 200</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-accent-foreground font-medium">Accent</span>
                </div>
                <p className="text-sm text-center text-muted-foreground">Green 500</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">Muted</span>
                </div>
                <p className="text-sm text-center text-muted-foreground">Green 50</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons Showcase */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Button Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="btn-primary hover-green">
                <CheckCircle className="w-4 h-4" />
                Primary
              </Button>
              <Button variant="secondary" className="btn-secondary">
                <Heart className="w-4 h-4" />
                Secondary
              </Button>
              <Button variant="outline" className="hover-green">
                <Star className="w-4 h-4" />
                Outline
              </Button>
              <Button variant="ghost" className="hover-green">
                <AlertCircle className="w-4 h-4" />
                Ghost
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards and Glass Effects */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-modern shadow-green">
            <CardHeader>
              <CardTitle className="text-green-primary">Modern Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-muted">
                This card uses the new modern styling with green shadows and hover effects.
              </p>
              <div className="mt-4 space-y-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Modern Design
                </Badge>
                <Badge className="bg-green-gradient text-white">
                  Green Theme
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-green backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-green-primary">Glass Effect Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-muted">
                This card demonstrates the glass morphism effect with green tinting.
              </p>
              <div className="mt-4">
                <div className="w-full bg-green-gradient-soft h-2 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-green-gradient rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Metrics */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Dashboard Metrics (Green Theme)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-gradient-soft p-6 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Total Students</span>
                </div>
                <p className="text-2xl font-bold text-green-800">1,234</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
              
              <div className="bg-green-gradient-soft p-6 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Classes Today</span>
                </div>
                <p className="text-2xl font-bold text-green-800">24</p>
                <p className="text-sm text-green-600">8 completed</p>
              </div>
              
              <div className="bg-green-gradient-soft p-6 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Attendance Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-800">94%</p>
                <p className="text-sm text-green-600">Excellent performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Form Elements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Modern Input Field
                </label>
                <Input 
                  className="input-modern focus-green"
                  placeholder="Enter your text here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="btn-primary"
                  onClick={() => setInputValue("")}
                >
                  Clear Input
                </Button>
                <Button 
                  variant="outline" 
                  className="hover-green"
                  disabled={!inputValue}
                >
                  Submit Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Loading States & Animations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="loading-green bg-green-50 p-4 rounded-lg">
                <p className="text-green-700">Loading shimmer effect</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-gradient rounded-full animate-bounce"></div>
                <div className="w-8 h-8 bg-green-gradient rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-8 h-8 bg-green-gradient rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              
              <div className="w-full bg-green-100 h-2 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-green-gradient animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Examples */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="state-success border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Success State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>This demonstrates the success state styling with green colors.</p>
            </CardContent>
          </Card>

          <Card className="state-error border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Error State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>This shows how error states are handled while maintaining the green theme.</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-8">
          <p className="text-green-muted">
            Modern Academic Management System - Green Theme
          </p>
          <p className="text-sm text-green-600">
            Built with Next.js, Tailwind CSS, and modern design principles
          </p>
        </div>
      </div>
    </div>
  )
}
