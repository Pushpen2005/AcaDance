// Realtime Debug Hook for Testing
import React from 'react';
import { advancedSupabase } from "@/lib/advancedSupabase";

export function useRealtimeDebug() {
  React.useEffect(() => {
    console.log('[RT DEBUG] Setting up realtime subscriptions...');
    
    const chan = advancedSupabase.getClient()
      .channel("debug")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "attendance_records" },
        (payload) => console.log("[RT] attendance_records:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "attendance_sessions" },
        (payload) => console.log("[RT] attendance_sessions:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => console.log("[RT] users:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "enrollments" },
        (payload) => console.log("[RT] enrollments:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        (payload) => console.log("[RT] courses:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "timetables" },
        (payload) => console.log("[RT] timetables:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload) => console.log("[RT] alerts:", payload)
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "attendance_statistics" },
        (payload) => console.log("[RT] attendance_statistics:", payload)
      )
      .subscribe((status) => {
        console.log('[RT DEBUG] Subscription status:', status);
      });

    return () => { 
      console.log('[RT DEBUG] Cleaning up subscriptions...');
      advancedSupabase.getClient().removeChannel(chan);
    };
  }, []);
}

// Hook for debug logging
export const useRealtimeDebugLogs = () => {
  const [logs, setLogs] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes('[RT]')) {
        setLogs(prev => [...prev.slice(-9), args.join(' ')]);
      }
      originalLog.apply(console, args);
    };
    
    return () => {
      console.log = originalLog;
    };
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-49), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return {
    logs,
    addLog
  };
};
