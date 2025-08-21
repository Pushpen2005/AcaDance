'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Database, 
  Zap, 
  Bell,
  Activity,
  Server,
  Settings,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
  database: boolean;
  cache: boolean;
  realtime: boolean;
  functions: boolean;
  timestamp: string;
  errors: string[];
}

interface SystemMetrics {
  activeUsers: number;
  todayAttendance: number;
  activeSessions: number;
  systemLoad: number;
  memoryUsage: number;
  responseTime: number;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  // Check system health
  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/init');
      const data = await response.json();
      
      if (data.success) {
        setHealth(data.data);
      } else {
        throw new Error(data.error || 'Failed to get system health');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize system
  const initializeSystem = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/system/init', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "System Initialized",
          description: "Academic system has been initialized successfully",
        });
        
        // Refresh health after initialization
        setTimeout(checkHealth, 2000);
      } else {
        throw new Error(data.error || 'Failed to initialize system');
      }
    } catch (error) {
      console.error('System initialization failed:', error);
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  // Get system metrics (mock data for now)
  const getMetrics = () => {
    setMetrics({
      activeUsers: Math.floor(Math.random() * 500) + 100,
      todayAttendance: Math.floor(Math.random() * 1000) + 200,
      activeSessions: Math.floor(Math.random() * 50) + 10,
      systemLoad: Math.floor(Math.random() * 80) + 10,
      memoryUsage: Math.floor(Math.random() * 70) + 20,
      responseTime: Math.floor(Math.random() * 200) + 50,
    });
  };

  // Auto-refresh health status
  useEffect(() => {
    checkHealth();
    getMetrics();
    
    const interval = setInterval(() => {
      checkHealth();
      getMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: boolean) => {
    if (status) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Healthy" : "Error"}
      </Badge>
    );
  };

  const overallHealth = health ? 
    health.database && health.cache && health.functions : false;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Monitoring
          </h1>
          <p className="text-green-700 dark:text-gray-400 mt-2">
            Monitor and manage the Academic System health and performance
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={checkHealth}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          
          <Button 
            onClick={initializeSystem}
            disabled={initializing}
            className="flex items-center gap-2"
          >
            {initializing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            Initialize System
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status
            {getStatusBadge(overallHealth)}
          </CardTitle>
          <CardDescription>
            Overall system health and component status
            {health?.timestamp && (
              <span className="block text-sm text-gray-500 mt-1">
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Checking system health...</span>
            </div>
          ) : health ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Database</span>
                </div>
                {getStatusIcon(health.database)}
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Cache</span>
                </div>
                {getStatusIcon(health.cache)}
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Real-time</span>
                </div>
                {getStatusIcon(health.realtime)}
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Functions</span>
                </div>
                {getStatusIcon(health.functions)}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-500">Unable to retrieve system health</p>
            </div>
          )}

          {health?.errors && health.errors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-red-600 mb-2">System Errors:</h4>
              <ul className="space-y-1">
                {health.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.activeUsers || 0}
                </div>
                <p className="text-xs text-gray-500">
                  +12% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.todayAttendance || 0}
                </div>
                <p className="text-xs text-gray-500">
                  Records marked today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.activeSessions || 0}
                </div>
                <p className="text-xs text-gray-500">
                  Currently running
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">System Load</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Usage</span>
                  <span>{metrics?.systemLoad || 0}%</span>
                </div>
                <Progress value={metrics?.systemLoad || 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>RAM Usage</span>
                  <span>{metrics?.memoryUsage || 0}%</span>
                </div>
                <Progress value={metrics?.memoryUsage || 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.responseTime || 0}ms
                </div>
                <p className="text-xs text-gray-500">
                  Average API response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Optimal
                </div>
                <p className="text-xs text-gray-500">
                  All queries executing normally
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Recent System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[
                  { time: '14:30:25', level: 'INFO', message: 'Database optimization completed successfully' },
                  { time: '14:29:15', level: 'INFO', message: 'Cache invalidation triggered for user attendance data' },
                  { time: '14:28:45', level: 'WARN', message: 'High memory usage detected (78%)' },
                  { time: '14:27:30', level: 'INFO', message: 'New session created with QR code generation' },
                  { time: '14:26:20', level: 'ERROR', message: 'Failed to send notification to user ID: 123' },
                  { time: '14:25:10', level: 'INFO', message: 'Batch enrollment completed for 25 students' },
                ].map((log, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      log.level === 'ERROR' 
                        ? 'border-red-500 bg-red-50' 
                        : log.level === 'WARN'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-mono">{log.message}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant={
                          log.level === 'ERROR' ? 'destructive' :
                          log.level === 'WARN' ? 'secondary' : 'default'
                        }>
                          {log.level}
                        </Badge>
                        <span>{log.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitoringDashboard;
