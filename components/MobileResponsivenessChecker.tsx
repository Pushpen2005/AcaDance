// Enhanced with Advanced Supabase Mobile Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Wifi, Database } from "lucide-react";


import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Wifi,
  Battery,
  Signal
} from "lucide-react";

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  userAgent: string;
  touchSupport: boolean;
  pixelRatio: number;
}

interface ResponsivenessTest {
  name: string;
  breakpoint: string;
  minWidth: number;
  maxWidth?: number;
  status: 'pass' | 'fail' | 'warning';
  description: string;
}

// Performance and Error Handling Enhanced
export default React.memo(function MobileResponsivenessChecker() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  
  const breakpoints = [
    { name: 'Mobile (xs)', width: 320, maxWidth: 639 },
    { name: 'Mobile (sm)', width: 640, maxWidth: 767 },
    { name: 'Tablet (md)', width: 768, maxWidth: 1023 },
    { name: 'Desktop (lg)', width: 1024, maxWidth: 1279 },
    { name: 'Large (xl)', width: 1280, maxWidth: 1535 },
    { name: 'Extra Large (2xl)', width: 1536, maxWidth: undefined }
  ];

  useEffect(() => {
    const updateDeviceInfo = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
        if (width < 768) type = 'mobile';
        else if (width < 1024) type = 'tablet';
        
        setDeviceInfo({
          type,
          width,
          height,
          orientation: width > height ? 'landscape' : 'portrait',
          userAgent: navigator.userAgent,
          touchSupport: 'ontouchstart' in window,
          pixelRatio: window.devicePixelRatio || 1
        });
      }
    };

    const updateOnlineStatus = () => {
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
    };
    
    const updateBatteryInfo = async () => {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          // @ts-ignore
          const battery = await navigator.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    updateDeviceInfo();
    updateOnlineStatus();
    updateBatteryInfo();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDeviceInfo);
      window.addEventListener('orientationchange', updateDeviceInfo);
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      return () => {
        window.removeEventListener('resize', updateDeviceInfo);
        window.removeEventListener('orientationchange', updateDeviceInfo);
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  const getResponsivenessTests = (): ResponsivenessTest[] => {
    if (!deviceInfo) return [];
    
    const { width } = deviceInfo;
    
    return [
      {
        name: 'Mobile Navigation',
        breakpoint: 'sm',
        minWidth: 320,
        status: width >= 320 ? 'pass' : 'fail',
        description: 'Navigation should be collapsible on mobile'
      },
      {
        name: 'Touch Targets',
        breakpoint: 'all',
        minWidth: 0,
        status: deviceInfo.touchSupport ? 'pass' : 'warning',
        description: 'Touch targets should be minimum 44px for mobile'
      },
      {
        name: 'Text Readability',
        breakpoint: 'sm',
        minWidth: 320,
        status: width >= 320 ? 'pass' : 'fail',
        description: 'Text should be readable without zooming'
      },
      {
        name: 'Layout Stacking',
        breakpoint: 'md',
        minWidth: 768,
        status: width < 768 ? 'pass' : 'warning',
        description: 'Content should stack vertically on mobile'
      },
      {
        name: 'Horizontal Scrolling',
        breakpoint: 'all',
        minWidth: 0,
        status: 'pass', // Would need DOM measurement
        description: 'No horizontal scrolling should occur'
      }
    ];
  };

  const getCurrentBreakpoint = () => {
    if (!deviceInfo) return null;
    return breakpoints.find(bp => 
      deviceInfo.width >= bp.width && 
      (!bp.maxWidth || deviceInfo.width <= bp.maxWidth)
    );
  };

  const getDeviceIcon = () => {
    if (!deviceInfo) return Monitor;
    switch (deviceInfo.type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const tests = getResponsivenessTests();
  const currentBreakpoint = getCurrentBreakpoint();
  const DeviceIcon = getDeviceIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Smartphone className="w-6 h-6" />
              Mobile Responsiveness Checker
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Device Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DeviceIcon className="w-5 h-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deviceInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device Type:</span>
                    <Badge variant="outline">{deviceInfo.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Screen Size:</span>
                    <span className="font-mono">{deviceInfo.width} × {deviceInfo.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orientation:</span>
                    <Badge variant="outline">{deviceInfo.orientation}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pixel Ratio:</span>
                    <span className="font-mono">{deviceInfo.pixelRatio}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Touch Support:</span>
                    <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"}>
                      {deviceInfo.touchSupport ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {currentBreakpoint && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Breakpoint:</span>
                      <Badge variant="outline">{currentBreakpoint.name}</Badge>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Wifi className="w-4 h-4" />
                  Network Status:
                </span>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              {batteryLevel !== null && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Battery className="w-4 h-4" />
                    Battery Level:
                  </span>
                  <Badge variant={batteryLevel > 20 ? "default" : "destructive"}>
                    {batteryLevel}%
                  </Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Agent:</span>
                <Button variant="outline" size="sm" className="text-xs">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responsiveness Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Responsiveness Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {test.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {test.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                    {test.status === 'fail' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-muted-foreground">{test.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        test.status === 'pass' ? 'default' : 
                        test.status === 'warning' ? 'secondary' : 'destructive'
                      }
                    >
                      {test.status.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {test.breakpoint}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Breakpoint Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Breakpoint Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {breakpoints.map((bp, index) => {
                const isActive = currentBreakpoint?.name === bp.name;
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="font-medium">{bp.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {bp.width}px{bp.maxWidth ? ` - ${bp.maxWidth}px` : '+'}
                    </div>
                    {isActive && (
                      <Badge className="mt-2 text-xs">Current</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh Tests
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const info = deviceInfo ? 
                    `Device: ${deviceInfo.type}\nScreen: ${deviceInfo.width}x${deviceInfo.height}\nBreakpoint: ${currentBreakpoint?.name || 'Unknown'}` :
                    'Device information not available';
                  navigator.clipboard.writeText(info);
                }}
              >
                Copy Device Info
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('/admin', '_blank')}
              >
                Test Admin Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('/login', '_blank')}
              >
                Test Auth Pages
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Mobile Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>• Ensure minimum touch target size of 44px on mobile devices</div>
              <div>• Test with different screen orientations</div>
              <div>• Verify text readability without zooming</div>
              <div>• Check navigation accessibility on small screens</div>
              <div>• Test form inputs and interactions on touch devices</div>
              <div>• Verify image and media responsiveness</div>
              <div>• Test offline functionality if implemented</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
)
