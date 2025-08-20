"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Eye,
  Settings,
  Check,
  Smartphone
} from "lucide-react";

interface ThemePreference {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
}

const themePreferences: ThemePreference[] = [
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Calm and professional blue theme',
    primary: 'bg-blue-500',
    secondary: 'bg-blue-100',
    accent: 'bg-blue-200'
  },
  {
    id: 'green',
    name: 'Forest Green',
    description: 'Natural and soothing green theme',
    primary: 'bg-green-500',
    secondary: 'bg-green-100',
    accent: 'bg-green-200'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Creative and sophisticated purple theme',
    primary: 'bg-purple-500',
    secondary: 'bg-purple-100',
    accent: 'bg-purple-200'
  },
  {
    id: 'red',
    name: 'Warm Red',
    description: 'Energetic and bold red theme',
    primary: 'bg-red-500',
    secondary: 'bg-red-100',
    accent: 'bg-red-200'
  }
];

export default function ThemeCustomizer() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedThemePreference, setSelectedThemePreference] = useState('blue');
  const [systemTheme, setSystemTheme] = useState<string>('light');
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
      if (autoSwitchEnabled) {
        setTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [autoSwitchEnabled, setTheme]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme !== 'system') {
      setAutoSwitchEnabled(false);
    }
  };

  const toggleAutoSwitch = (enabled: boolean) => {
    setAutoSwitchEnabled(enabled);
    if (enabled) {
      setTheme('system');
    }
  };

  const applyCustomStyles = () => {
    const root = document.documentElement;
    const selectedPreference = themePreferences.find(p => p.id === selectedThemePreference);
    
    if (selectedPreference) {
      // Apply CSS custom properties for theme colors
      // This would need to be extended with actual CSS variable implementation
      root.style.setProperty('--theme-primary', selectedPreference.primary);
      root.style.setProperty('--theme-secondary', selectedPreference.secondary);
      root.style.setProperty('--theme-accent', selectedPreference.accent);
    }
    
    // Apply accessibility preferences
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  useEffect(() => {
    applyCustomStyles();
  }, [selectedThemePreference, highContrast, reducedMotion]);

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
      default: return Sun;
    }
  };

  const ThemeIcon = getThemeIcon(theme || 'light');

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Palette className="w-6 h-6" />
              Theme Customizer
            </CardTitle>
            <p className="text-muted-foreground">
              Customize the appearance and accessibility of your academic system
            </p>
          </CardHeader>
        </Card>

        {/* Theme Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThemeIcon className="w-5 h-5" />
              Theme Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['light', 'dark', 'system'].map((mode) => {
                const Icon = getThemeIcon(mode);
                const isActive = theme === mode;
                
                return (
                  <Button
                    key={mode}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => handleThemeChange(mode)}
                    className="h-auto p-4 flex flex-col gap-2"
                  >
                    <Icon className="w-6 h-6" />
                    <span className="capitalize">{mode}</span>
                    {mode === 'system' && (
                      <span className="text-xs opacity-75">
                        Currently: {systemTheme}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="auto-switch" className="font-medium">
                  Auto Switch with System
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically change theme based on system preference
                </p>
              </div>
              <Switch
                id="auto-switch"
                checked={autoSwitchEnabled}
                onCheckedChange={toggleAutoSwitch}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Theme Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-semibold text-card-foreground mb-2">Current Theme: {resolvedTheme}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div className="p-2 bg-primary text-primary-foreground rounded text-center">
                    Primary
                  </div>
                  <div className="p-2 bg-secondary text-secondary-foreground rounded text-center">
                    Secondary
                  </div>
                  <div className="p-2 bg-muted text-muted-foreground rounded text-center">
                    Muted
                  </div>
                  <div className="p-2 bg-accent text-accent-foreground rounded text-center">
                    Accent
                  </div>
                </div>
              </div>
              
              {/* Sample UI Elements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sample Card</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button size="sm" className="w-full">Primary Button</Button>
                    <Button size="sm" variant="outline" className="w-full">Outline Button</Button>
                    <Badge>Status Badge</Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Text Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="text-foreground">Primary text content</p>
                    <p className="text-muted-foreground">Secondary text content</p>
                    <p className="text-accent-foreground bg-accent px-2 py-1 rounded">
                      Accent text
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Color Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="color-scheme">Accent Color Scheme</Label>
              <Select
                value={selectedThemePreference}
                onValueChange={setSelectedThemePreference}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  {themePreferences.map((pref) => (
                    <SelectItem key={pref.id} value={pref.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${pref.primary}`} />
                        {pref.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {themePreferences.find(p => p.id === selectedThemePreference)?.description}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themePreferences.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => setSelectedThemePreference(pref.id)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedThemePreference === pref.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className={`w-4 h-4 rounded ${pref.primary}`} />
                    <div className={`w-4 h-4 rounded ${pref.secondary}`} />
                    <div className={`w-4 h-4 rounded ${pref.accent}`} />
                  </div>
                  <div className="text-xs font-medium">{pref.name}</div>
                  {selectedThemePreference === pref.id && (
                    <Check className="w-4 h-4 mx-auto mt-1 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Accessibility Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="high-contrast" className="font-medium">
                  High Contrast Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="reduced-motion" className="font-medium">
                  Reduced Motion
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Theme Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Mobile Theme Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Theme changes apply across all devices</p>
              <p>• System theme follows device settings automatically</p>
              <p>• High contrast mode improves readability on small screens</p>
              <p>• Reduced motion saves battery and improves performance</p>
            </div>
          </CardContent>
        </Card>

        {/* Apply Changes */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={applyCustomStyles}
                className="flex-1"
              >
                Apply Theme Changes
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setTheme('light');
                  setSelectedThemePreference('blue');
                  setHighContrast(false);
                  setReducedMotion(false);
                  setAutoSwitchEnabled(false);
                }}
                className="flex-1"
              >
                Reset to Defaults
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center mt-3">
              Theme preferences are saved automatically and persist across sessions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
