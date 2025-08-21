// Realtime Debug Hook for Testing
import React from 'react';
import { advancedSupabase } from "../lib/advancedSupabase";

export function useRealtimeDebug() {
  React.useEffect(() => {
    console.log('[RT DEBUG] Setting up realtime subscriptions...');
    
    const chan = advancedSupabase.getClient()
      .channel("debug")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance_records" },
        (payload) => console.log("[RT] attendance_records INSERT:", payload)
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

// Component for adding debug info to any page
export const RealtimeDebugPanel: React.FC = () => {
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

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-black/90 text-green-400 p-4 rounded-lg text-xs font-mono max-h-60 overflow-y-auto">
      <div className="font-bold text-green-300 mb-2">🔴 Realtime Debug</div>
      {logs.length === 0 ? (
        <div className="text-gray-400">Waiting for realtime events...</div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="mb-1 break-words">
            {log}
          </div>
        ))
      )}
    </div>
  );
};
