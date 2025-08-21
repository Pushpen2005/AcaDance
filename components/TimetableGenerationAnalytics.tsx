"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Settings,
  RefreshCw,
  ExternalLink,
  Database,
  Activity
} from 'lucide-react';

interface GenerationStats {
  total_generations: number;
  success_rate: number;
  average_optimization_score: number;
  popular_algorithms: string[];
  recent_generations: any[];
}

interface GenerationLog {
  id: string;
  generation_time: number;
  optimization_score: number;
  algorithm_used: string;
  conflicts_count: number;
  success: boolean;
  api_used: boolean;
  generated_sessions: number;
  created_at: string;
}

export default function TimetableGenerationAnalytics() {
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<GenerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  useEffect(() => {
    fetchGenerationData();
    checkApiKeyStatus();
  }, []);

  const fetchGenerationData = async () => {
    setLoading(true);
    try {
      // Fetch statistics from API
      const response = await fetch('/api/timetable/generate?action=stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setRecentLogs(data.recent_generations || []);
      }

      // Also fetch recent logs from Supabase
      const { data: logs } = await supabase
        .from('timetable_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logs) {
        setRecentLogs(logs);
      }
    } catch (error) {
      console.error('Failed to fetch generation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApiKeyStatus = async () => {
    // Check if API key is configured
    const hasApiKey = process.env.NEXT_PUBLIC_TIMETABLE_API_ENDPOINT;
    setApiKeyStatus(hasApiKey ? 'active' : 'inactive');
  };

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'ai_optimized': return 'bg-green-100 text-green-800';
      case 'genetic': return 'bg-blue-100 text-blue-800';
      case 'backtracking': return 'bg-purple-100 text-purple-800';
      case 'local_fallback': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatGenerationTime = (timeMs: number) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Timetable Generation Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              External Timetable API Status
            </span>
            <Badge variant={apiKeyStatus === 'active' ? 'default' : 'destructive'}>
              {apiKeyStatus === 'active' ? 'Connected' : 'Not Configured'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>API Key:</span>
              <Badge variant="outline">
                {process.env.TIMETABLE_GENERATION_API_KEY ? 'ttm_349...8e40' : 'Not Set'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Generation Method:</span>
              <Badge className={apiKeyStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {apiKeyStatus === 'active' ? 'External API + Fallback' : 'Local Generation Only'}
              </Badge>
            </div>
            {apiKeyStatus === 'inactive' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  💡 Configure the external API key (ttm_3494337cd17c0f1a94c8f0f6c14ddc073578aeb6020449f483d9dda8479c8e40) 
                  for advanced AI-powered timetable generation.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generation Statistics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Generations</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Generations</p>
                      <p className="text-2xl font-bold">{stats?.total_generations || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold">{((stats?.success_rate || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <Progress value={(stats?.success_rate || 0) * 100} className="mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Optimization</p>
                      <p className="text-2xl font-bold">{(stats?.average_optimization_score || 0).toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <Progress value={stats?.average_optimization_score || 0} className="mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">API Usage</p>
                      <p className="text-2xl font-bold">{apiKeyStatus === 'active' ? 'Active' : 'Local'}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Generations
                <Button variant="outline" size="sm" onClick={fetchGenerationData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No generation logs found</p>
                    <p className="text-sm">Generate a timetable to see analytics here</p>
                  </div>
                ) : (
                  recentLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getAlgorithmColor(log.algorithm_used)}>
                              {log.algorithm_used}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatGenerationTime(log.generation_time)}
                            </span>
                            <span className="flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              {log.optimization_score?.toFixed(1)}%
                            </span>
                            {log.conflicts_count > 0 && (
                              <span className="flex items-center text-orange-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {log.conflicts_count} conflicts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{log.generated_sessions} sessions</p>
                        <p className="text-xs text-gray-500">
                          {log.api_used ? 'External API' : 'Local'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.popular_algorithms.map((algorithm, index) => (
                  <div key={algorithm} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getAlgorithmColor(algorithm)}>
                        {algorithm}
                      </Badge>
                      <div>
                        <p className="font-medium">{algorithm.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-600">
                          {algorithm === 'ai_optimized' && 'Advanced AI-powered optimization'}
                          {algorithm === 'genetic' && 'Genetic algorithm with evolutionary approach'}
                          {algorithm === 'backtracking' && 'Constraint satisfaction with backtracking'}
                          {algorithm === 'local_fallback' && 'Local generation when API unavailable'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {algorithm === 'ai_optimized' && apiKeyStatus === 'active' ? 'Available' : 
                         algorithm === 'local_fallback' ? 'Fallback' : 'Available'}
                      </p>
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
}
