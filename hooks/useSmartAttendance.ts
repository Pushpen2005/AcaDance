import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRealtimeAttendance } from './useRealtimeAttendance';
import { usePollingAttendance } from './usePollingAttendance';

interface UseSmartAttendanceProps {
  sessionId?: string;
  facultyId?: string;
  studentId?: string;
  enabled?: boolean;
}

// Smart hook that automatically detects realtime availability and falls back to polling
export function useSmartAttendance(props: UseSmartAttendanceProps = {}) {
  const [realtimeAvailable, setRealtimeAvailable] = useState<boolean | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Test realtime availability
  useEffect(() => {
    const testRealtime = async () => {
      try {
        console.log('🔍 Testing Supabase realtime availability...');
        
        // Create a test channel to see if realtime works
        const testChannel = supabase
          .channel('realtime-test')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles' },
            () => {
              console.log('✅ Realtime is working');
              setRealtimeAvailable(true);
              setDetectionError(null);
            }
          )
          .subscribe((status) => {
            console.log('📡 Realtime test status:', status);
            
            if (status === 'SUBSCRIBED') {
              setRealtimeAvailable(true);
              setDetectionError(null);
              // Clean up test channel
              setTimeout(() => {
                supabase.removeChannel(testChannel);
              }, 1000);
            } else if (status === 'CHANNEL_ERROR') {
              console.log('❌ Realtime not available, falling back to polling');
              setRealtimeAvailable(false);
              setDetectionError('Realtime not available');
            }
          });

        // Timeout after 5 seconds if no response
        setTimeout(() => {
          if (realtimeAvailable === null) {
            console.log('⏱️ Realtime test timeout, falling back to polling');
            setRealtimeAvailable(false);
            setDetectionError('Realtime test timeout');
            supabase.removeChannel(testChannel);
          }
        }, 5000);

      } catch (error) {
        console.error('❌ Realtime detection error:', error);
        setRealtimeAvailable(false);
        setDetectionError(`Detection error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    };

    testRealtime();
  }, []);

  // Use realtime or polling based on availability
  const realtimeHook = useRealtimeAttendance({
    ...props,
    enabled: props.enabled && realtimeAvailable === true
  });

  const pollingHook = usePollingAttendance({
    ...props,
    enabled: props.enabled && realtimeAvailable === false,
    pollingInterval: 3000 // 3 seconds
  });

  // Return the appropriate hook data
  const isUsingRealtime = realtimeAvailable === true;
  const isUsingPolling = realtimeAvailable === false;
  const isDetecting = realtimeAvailable === null;

  const activeHook = isUsingRealtime ? realtimeHook : pollingHook;

  return {
    ...activeHook,
    
    // Additional info about the connection method
    connectionMethod: isDetecting ? 'detecting' : 
                     isUsingRealtime ? 'realtime' : 'polling',
    realtimeAvailable,
    detectionError,
    isDetecting,
    isUsingRealtime,
    isUsingPolling,
    
    // Enhanced connection status
    isConnected: isDetecting ? false : activeHook.isConnected,
    error: detectionError || activeHook.error
  };
}
