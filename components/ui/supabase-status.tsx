"use client"

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Cloud,
  Server
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"

interface SupabaseStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const SupabaseStatusIndicator: React.FC<SupabaseStatusProps> = ({ 
  className = "", 
  showDetails = false 
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected')
  const [dbStatus, setDbStatus] = useState('checking')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetailedStatus, setShowDetailedStatus] = useState(showDetails)

  useEffect(() => {
    checkSupabaseConnection()
    setupRealtimeStatus()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkSupabaseConnection, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        setIsConnected(false)
        setDbStatus('error')
      } else {
        setIsConnected(true)
        setDbStatus('connected')
        setLastUpdate(new Date())
      }
    } catch (error) {
      setIsConnected(false)
      setDbStatus('error')
    }
  }

  const setupRealtimeStatus = () => {
    const channel = supabase
      .channel('connection-test')
      .on('presence', { event: 'sync' }, () => {
        setRealtimeStatus('connected')
      })
      .on('presence', { event: 'join' }, () => {
        setRealtimeStatus('connected')
      })
      .on('presence', { event: 'leave' }, () => {
        setRealtimeStatus('disconnected')
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const getStatusIcon = () => {
    if (isConnected && realtimeStatus === 'connected') {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (isConnected) {
      return <Database className="w-4 h-4 text-yellow-500" />
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    if (isConnected && realtimeStatus === 'connected') {
      return 'Live Connected'
    } else if (isConnected) {
      return 'DB Connected'
    } else {
      return 'Disconnected'
    }
  }

  const getStatusColor = () => {
    if (isConnected && realtimeStatus === 'connected') {
      return 'bg-green-100 text-green-800 border-green-200'
    } else if (isConnected) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    } else {
      return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        {/* Main Status Badge */}
        <Badge 
          variant="outline" 
          className={`${getStatusColor()} flex items-center gap-1 cursor-pointer transition-all hover:scale-105`}
          onClick={() => setShowDetailedStatus(!showDetailedStatus)}
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
          {realtimeStatus === 'connected' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
          )}
        </Badge>

        {/* Supabase Logo/Indicator */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Cloud className="w-3 h-3" />
          <span className="hidden sm:inline">Supabase</span>
        </div>
      </motion.div>

      {/* Detailed Status Panel */}
      <AnimatePresence>
        {showDetailedStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 z-50"
          >
            <Card className="w-72 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Supabase Connection</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDetailedStatus(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                
                {/* Database Status */}
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge variant={dbStatus === 'connected' ? 'default' : 'destructive'}>
                    {dbStatus}
                  </Badge>
                </div>

                {/* Real-time Status */}
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Real-time</span>
                  </div>
                  <Badge variant={realtimeStatus === 'connected' ? 'default' : 'destructive'}>
                    {realtimeStatus}
                  </Badge>
                </div>

                {/* Server Status */}
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Server</span>
                  </div>
                  <Badge variant="default">
                    Active
                  </Badge>
                </div>

                {lastUpdate && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    Last checked: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkSupabaseConnection}
                  className="w-full"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Refresh Status
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const RealtimeIndicator: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [isLive, setIsLive] = useState(false)
  
  useEffect(() => {
    const channel = supabase
      .channel('live-indicator')
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <motion.div 
      className={`flex items-center gap-1 ${className}`}
      animate={{ opacity: isLive ? 1 : 0.5 }}
    >
      <motion.div
        animate={{ 
          scale: isLive ? [1, 1.2, 1] : 1,
          backgroundColor: isLive ? ['#ef4444', '#f59e0b', '#ef4444'] : '#6b7280'
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-2 h-2 rounded-full"
      />
      <span className="text-xs text-gray-600">
        {isLive ? 'LIVE' : 'OFFLINE'}
      </span>
    </motion.div>
  )
}
