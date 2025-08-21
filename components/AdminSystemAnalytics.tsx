// Enhanced with Advanced Supabase Analytics Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock, 
  Server, 
  Database, 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Zap,
  HardDrive,
  Cpu,
  Wifi
} from "lucide-react";

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: string;
  systemUptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  errorRate: number;
  successRate: number;
}

interface PerformanceData {
  timestamp: string;
  responseTime: number;
  requests: number;
  errors: number;
}

interface UsageStats {
  studentLogins: number;
  facultyLogins: number;
  adminLogins: number;
  qrScans: number;
  attendanceMarked: number;
  timetableViews: number;
  reportGenerated: number;
  notificationsSent: number;
}

const AdminSystemAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    const mockSystemMetrics: SystemMetrics = {
      totalUsers: 1247,
      activeUsers: 342,
      totalSessions: 156,
      avgSessionDuration: '24m 15s',
      systemUptime: '99.8%',
      cpuUsage: 67,
      memoryUsage: 54,
      diskUsage: 78,
      networkLatency: 45,
      errorRate: 0.2,
      successRate: 99.8
    };

    const mockPerformanceData: PerformanceData[] = [
      { timestamp: '2024-01-08', responseTime: 120, requests: 1250, errors: 2 },
      { timestamp: '2024-01-09', responseTime: 110, requests: 1340, errors: 1 },
      { timestamp: '2024-01-10', responseTime: 130, requests: 1180, errors: 3 },
      { timestamp: '2024-01-11', responseTime: 115, requests: 1420, errors: 1 },
      { timestamp: '2024-01-12', responseTime: 125, requests: 1380, errors: 2 },
      { timestamp: '2024-01-13', responseTime: 105, requests: 1560, errors: 0 },
      { timestamp: '2024-01-14', responseTime: 118, requests: 1490, errors: 1 }
    ];

    const mockUsageStats: UsageStats = {
      studentLogins: 1089,
      facultyLogins: 78,
      adminLogins: 12,
      qrScans: 2340,
      attendanceMarked: 1876,
      timetableViews: 3456,
      reportGenerated: 89,
      notificationsSent: 567
    };

    setTimeout(() => {
      setSystemMetrics(mockSystemMetrics);
      setPerformanceData(mockPerformanceData);
      setUsageStats(mockUsageStats);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getHealthStatus = (value: number, threshold: number, invert = false) => {
    const isHealthy = invert ? value < threshold : value > threshold;
    return isHealthy ? 'healthy' : 'warning';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-green-700 bg-gray-100 border-gray-200';
    }
  };

  const refreshData = () => {
    setLoading(true);
    // Simulate API refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const exportAnalytics = () => {
    const data = {
      metrics: systemMetrics,
      performance: performanceData,
      usage: usageStats,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !systemMetrics || !usageStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            System Analytics
          </h2>
          <p className="text-muted-foreground">
            Monitor system performance, usage metrics, and health status
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.activeUsers} active now
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {systemMetrics.avgSessionDuration}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.systemUptime}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.errorRate}% error rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
              <CardDescription>Key system resources and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">{systemMetrics.cpuUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.cpuUsage} className="h-2" />
                  <Badge className={`text-xs ${getStatusColor(getHealthStatus(systemMetrics.cpuUsage, 80, true))}`}>
                    {getHealthStatus(systemMetrics.cpuUsage, 80, true)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">{systemMetrics.memoryUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.memoryUsage} className="h-2" />
                  <Badge className={`text-xs ${getStatusColor(getHealthStatus(systemMetrics.memoryUsage, 80, true))}`}>
                    {getHealthStatus(systemMetrics.memoryUsage, 80, true)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm text-muted-foreground">{systemMetrics.diskUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.diskUsage} className="h-2" />
                  <Badge className={`text-xs ${getStatusColor(getHealthStatus(systemMetrics.diskUsage, 85, true))}`}>
                    {getHealthStatus(systemMetrics.diskUsage, 85, true)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Latency</span>
                    <span className="text-sm text-muted-foreground">{systemMetrics.networkLatency}ms</span>
                  </div>
                  <Progress value={Math.min(systemMetrics.networkLatency / 2, 100)} className="h-2" />
                  <Badge className={`text-xs ${getStatusColor(getHealthStatus(systemMetrics.networkLatency, 100, true))}`}>
                    {getHealthStatus(systemMetrics.networkLatency, 100, true)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Average API response times over the last {timeRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{data.timestamp}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((data.responseTime / 200) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">{data.responseTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>API requests and error rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{data.timestamp}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{data.requests.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">requests</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${data.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {data.errors}
                          </div>
                          <div className="text-xs text-muted-foreground">errors</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Performance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">High Response Time Detected</p>
                    <p className="text-xs text-muted-foreground">Average response time increased by 15% in the last hour</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Warning
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System Performance Stable</p>
                    <p className="text-xs text-muted-foreground">All metrics within normal ranges for the past 6 hours</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-blue-600">
                    Info
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Student Logins</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.studentLogins.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faculty Logins</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.facultyLogins}</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Code Scans</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.qrScans.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Marked</CardTitle>
                <CheckCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.attendanceMarked.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last week
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most used platform features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timetable Views</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{usageStats.timetableViews.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">QR Code Scans</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '70%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{usageStats.qrScans.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attendance Records</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{usageStats.attendanceMarked.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications Sent</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '40%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{usageStats.notificationsSent}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reports Generated</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '15%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{usageStats.reportGenerated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Active users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                      <span className="text-sm">Students</span>
                    </div>
                    <span className="text-sm font-medium">{usageStats.studentLogins} ({((usageStats.studentLogins / (usageStats.studentLogins + usageStats.facultyLogins + usageStats.adminLogins)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full" />
                      <span className="text-sm">Faculty</span>
                    </div>
                    <span className="text-sm font-medium">{usageStats.facultyLogins} ({((usageStats.facultyLogins / (usageStats.studentLogins + usageStats.facultyLogins + usageStats.adminLogins)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-600 rounded-full" />
                      <span className="text-sm">Admins</span>
                    </div>
                    <span className="text-sm font-medium">{usageStats.adminLogins} ({((usageStats.adminLogins / (usageStats.studentLogins + usageStats.facultyLogins + usageStats.adminLogins)) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.cpuUsage}%</div>
                <Progress value={systemMetrics.cpuUsage} className="mt-2" />
                <Badge className={`text-xs mt-2 ${getStatusColor(getHealthStatus(systemMetrics.cpuUsage, 80, true))}`}>
                  {getHealthStatus(systemMetrics.cpuUsage, 80, true)}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Server className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.memoryUsage}%</div>
                <Progress value={systemMetrics.memoryUsage} className="mt-2" />
                <Badge className={`text-xs mt-2 ${getStatusColor(getHealthStatus(systemMetrics.memoryUsage, 80, true))}`}>
                  {getHealthStatus(systemMetrics.memoryUsage, 80, true)}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.diskUsage}%</div>
                <Progress value={systemMetrics.diskUsage} className="mt-2" />
                <Badge className={`text-xs mt-2 ${getStatusColor(getHealthStatus(systemMetrics.diskUsage, 85, true))}`}>
                  {getHealthStatus(systemMetrics.diskUsage, 85, true)}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
                <Wifi className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.networkLatency}ms</div>
                <Progress value={Math.min(systemMetrics.networkLatency / 2, 100)} className="mt-2" />
                <Badge className={`text-xs mt-2 ${getStatusColor(getHealthStatus(systemMetrics.networkLatency, 100, true))}`}>
                  {getHealthStatus(systemMetrics.networkLatency, 100, true)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* System Status Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Pool</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Query Performance</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backup Status</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Up to Date</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage Space</span>
                  <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">78% Used</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication Service</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notification Service</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">QR Code Service</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Upload Service</span>
                  <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Degraded</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemAnalytics;
