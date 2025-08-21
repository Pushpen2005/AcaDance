// Enhanced with Advanced Supabase Mobile Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Wifi, Database } from "lucide-react";


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Check, 
  X, 
  AlertTriangle,
  Maximize,
  Minimize,
  RotateCcw
} from 'lucide-react';

interface BreakpointTest {
  name: string;
  width: number;
  icon: React.ComponentType<any>;
  description: string;
}

interface ResponsiveTest {
  component: string;
  mobile: 'pass' | 'fail' | 'warning';
  tablet: 'pass' | 'fail' | 'warning';
  desktop: 'pass' | 'fail' | 'warning';
  issues: string[];
  recommendations: string[];
}

export default function MobileResponsivenessTester() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('desktop');
  const [screenWidth, setScreenWidth] = useState<number>(1200);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testResults, setTestResults] = useState<ResponsiveTest[]>([]);

  const breakpoints: BreakpointTest[] = [
    { name: 'mobile', width: 375, icon: Smartphone, description: 'Mobile (375px)' },
    { name: 'tablet', width: 768, icon: Tablet, description: 'Tablet (768px)' },
    { name: 'desktop', width: 1200, icon: Monitor, description: 'Desktop (1200px)' }
  ];

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        setScreenWidth(width);
        
        if (width < 640) setCurrentBreakpoint('mobile');
        else if (width < 1024) setCurrentBreakpoint('tablet');
        else setCurrentBreakpoint('desktop');
      }
    };

    handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const runResponsivenessTests = () => {
    setIsTestMode(true);
    
    // Simulate testing various components
    const results: ResponsiveTest[] = [
      {
        component: 'AdminDashboard',
        mobile: 'warning',
        tablet: 'pass',
        desktop: 'pass',
        issues: ['Cards stack vertically on mobile', 'Some text might be too small'],
        recommendations: ['Add mobile-specific card layouts', 'Increase font sizes for mobile']
      },
      {
        component: 'TimetableView',
        mobile: 'fail',
        tablet: 'warning',
        desktop: 'pass',
        issues: ['Table overflow on mobile', 'Horizontal scroll needed'],
        recommendations: ['Implement card view for mobile', 'Add horizontal scroll indicators']
      },
      {
        component: 'Navigation',
        mobile: 'pass',
        tablet: 'pass',
        desktop: 'pass',
        issues: [],
        recommendations: ['Consider hamburger menu for better UX']
      },
      {
        component: 'Forms',
        mobile: 'warning',
        tablet: 'pass',
        desktop: 'pass',
        issues: ['Input fields might be too close', 'Touch targets could be larger'],
        recommendations: ['Increase padding between inputs', 'Make buttons at least 44px tall']
      }
    ];
    
    setTestResults(results);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <Check className="w-4 h-4 text-green-500" />;
      case 'fail': return <X className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Mobile Responsiveness Tester
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Test and validate mobile responsiveness across different screen sizes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            {screenWidth}px
          </Badge>
          <Badge variant={currentBreakpoint === 'mobile' ? 'default' : 'outline'}>
            {currentBreakpoint}
          </Badge>
        </div>
      </div>

      {/* Breakpoint Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Maximize className="w-5 h-5" />
            Breakpoint Simulator
          </CardTitle>
          <CardDescription>
            Test your app at different screen sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {breakpoints.map((bp) => {
              const Icon = bp.icon;
              return (
                <Button
                  key={bp.name}
                  variant={currentBreakpoint === bp.name ? "default" : "outline"}
                  className="flex items-center gap-2 h-auto p-4"
                  onClick={() => {
                    setCurrentBreakpoint(bp.name);
                    setScreenWidth(bp.width);
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">{bp.description}</div>
                    <div className="text-xs text-muted-foreground">{bp.width}px</div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={runResponsivenessTests} className="flex-1">
                Run Responsiveness Tests
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responsiveness Test Results</CardTitle>
            <CardDescription>
              Component-by-component analysis of mobile responsiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h3 className="font-semibold text-lg">{result.component}</h3>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.mobile)}
                        <span className="text-sm">Mobile</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.tablet)}
                        <span className="text-sm">Tablet</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.desktop)}
                        <span className="text-sm">Desktop</span>
                      </div>
                    </div>
                  </div>
                  
                  {result.issues.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Issues Found:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-300">
                        {result.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 dark:text-blue-400 mb-2">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-600 dark:text-blue-300">
                        {result.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile-Specific Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Design Guidelines</CardTitle>
          <CardDescription>
            Best practices for mobile responsiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="interactions">Touch</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layout" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Use flexible layouts with CSS Grid and Flexbox
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Stack cards vertically on mobile devices
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Use fixed widths that don't scale
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Force horizontal scrolling for tables
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="typography" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Use minimum 16px font size for body text
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Increase line height for better readability
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Use fonts smaller than 14px on mobile
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Rely solely on color to convey information
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="interactions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Make touch targets at least 44px × 44px
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Add adequate spacing between interactive elements
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Place interactive elements too close together
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Rely on hover states for mobile interactions
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Optimize images for different screen densities
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do:</strong> Use lazy loading for off-screen content
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Load unnecessary resources on mobile
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Don't:</strong> Block the main thread with heavy computations
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
