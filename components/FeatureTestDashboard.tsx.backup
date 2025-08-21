"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smartphone, 
  Palette, 
  Eye, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import MobileResponsivenessTester from '@/components/MobileResponsivenessTester';
import ComprehensiveMobileTest from '@/components/ComprehensiveMobileTest';
import EnhancedThemeToggle from '@/components/EnhancedThemeToggle';
import AIFaceDetectionAttendance from '@/components/AIFaceDetectionAttendance';

export default function FeatureTestDashboard() {
  const [activeFeature, setActiveFeature] = useState<string>('overview');

  const features = [
    {
      id: 'mobile-responsive',
      title: 'Mobile Responsiveness',
      description: 'Test responsive design across devices',
      icon: Smartphone,
      status: 'ready',
      component: <MobileResponsivenessTester />
    },
    {
      id: 'mobile-comprehensive',
      title: 'Comprehensive Mobile Test',
      description: 'Advanced mobile testing suite',
      icon: Smartphone,
      status: 'ready',
      component: <ComprehensiveMobileTest />
    },
    {
      id: 'theme-toggle',
      title: 'Dark/Light Mode',
      description: 'Enhanced theme switching',
      icon: Palette,
      status: 'ready',
      component: (
        <div className="space-y-6 p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Theme Toggle Testing</h2>
            <p className="text-muted-foreground">
              The theme toggle is available in the header. Test switching between light, dark, and system themes.
            </p>
            <EnhancedThemeToggle />
          </div>
          
          {/* Demo content to show theme changes */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Sample Card</CardTitle>
                <CardDescription>This card demonstrates theme colors</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This content should adapt to the selected theme.</p>
                <Button className="mt-2">Primary Button</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>Watch the colors change</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline" className="ml-2">Outline Badge</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Third Card</CardTitle>
                <CardDescription>More theme testing</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost" className="ml-2">Ghost Button</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'face-detection',
      title: 'AI Face Detection',
      description: 'Face detection for attendance',
      icon: Eye,
      status: 'ready',
      component: <AIFaceDetectionAttendance />
    }
  ];

  const currentFeature = features.find(f => f.id === activeFeature);

  if (activeFeature !== 'overview' && currentFeature) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with back button */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveFeature('overview')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    <currentFeature.icon className="w-5 h-5" />
                    {currentFeature.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">{currentFeature.description}</p>
                </div>
              </div>
              <EnhancedThemeToggle />
            </div>
          </div>
        </div>

        {/* Feature content */}
        <div className="container mx-auto px-4 py-6">
          {currentFeature.component}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Feature Test Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Test mobile responsiveness, theme toggle, and AI features
              </p>
            </div>
            <EnhancedThemeToggle />
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                    {feature.status === 'ready' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Test {feature.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-muted-foreground">Features Implemented</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">4</div>
                <div className="text-sm text-muted-foreground">Test Suites</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Ready</div>
                <div className="text-sm text-muted-foreground">System Status</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
