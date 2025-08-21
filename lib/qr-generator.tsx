'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { supabase, AttendanceSession } from './supabaseClient';
import { useAuth } from './auth-context';
import { RefreshCw, Users, Clock, CheckCircle, AlertCircle, QrCode } from 'lucide-react';

interface QRGeneratorProps {
  sessionId: string;
  onAttendanceUpdate?: (count: number) => void;
}

export function QRGenerator({ sessionId, onAttendanceUpdate }: QRGeneratorProps) {
  const [qrData, setQrData] = useState<string>('');
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (sessionId) {
      loadSession();
      generateQR();
      
      // Refresh QR every 5 minutes for security
      const qrInterval = setInterval(generateQR, 5 * 60 * 1000);
      
      // Update timer every second
      const timerInterval = setInterval(updateTimer, 1000);

      // Subscribe to attendance updates
      const attendanceSubscription = supabase
        .channel(`attendance-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance_records',
            filter: `session_id=eq.${sessionId}`
          },
          () => {
            loadAttendanceCount();
          }
        )
        .subscribe();

      return () => {
        clearInterval(qrInterval);
        clearInterval(timerInterval);
        attendanceSubscription.unsubscribe();
      };
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, timetable:timetables(*)')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
      await loadAttendanceCount();
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceCount = async () => {
    try {
      const { count, error } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('status', 'present');

      if (error) throw error;
      
      const newCount = count || 0;
      setAttendanceCount(newCount);
      onAttendanceUpdate?.(newCount);

      // Update session stats
      await supabase
        .from('attendance_sessions')
        .update({
          total_present: newCount,
          attendance_percentage: session?.total_enrolled 
            ? Math.round((newCount / session.total_enrolled) * 100)
            : 0
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error loading attendance count:', error);
    }
  };

  const generateQR = async () => {
    if (!session || !profile) return;

    try {
      const timestamp = Date.now();
      const secret = process.env.NEXT_PUBLIC_QR_SECRET || 'fallback-secret';
      
      const qrPayload = {
        sessionId,
        facultyId: profile.id,
        timestamp,
        expiry: timestamp + (10 * 60 * 1000), // 10 minutes
        secret: btoa(`${sessionId}-${timestamp}-${secret}`)
      };

      const qrString = JSON.stringify(qrPayload);
      setQrData(qrString);

      // Update session with new QR
      await supabase
        .from('attendance_sessions')
        .update({
          qr_code: qrString,
          qr_expiry: new Date(qrPayload.expiry).toISOString(),
          session_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const updateTimer = () => {
    if (!session) return;

    const now = Date.now();
    const endTime = new Date(session.end_time || session.start_time).getTime() + (60 * 60 * 1000); // 1 hour default
    const remaining = Math.max(0, endTime - now);
    
    setTimeLeft(remaining);

    // Auto end session when time is up
    if (remaining === 0 && session.session_status === 'active') {
      endSession();
    }
  };

  const endSession = async () => {
    try {
      await supabase
        .from('attendance_sessions')
        .update({
          session_status: 'completed',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      setSession(prev => prev ? { ...prev, session_status: 'completed' } : null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Session not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          {session.timetable?.course?.course_name || 'Attendance Session'}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">
              Time Left: {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">
              Present: {attendanceCount}/{session.total_enrolled}
            </span>
          </div>
        </div>
      </div>

      {session.session_status === 'active' ? (
        <div className="text-center space-y-4">
          {/* QR Code Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-white p-6 rounded-lg shadow-lg inline-block"
          >
            {qrData ? (
              <QRCodeSVG
                value={qrData}
                size={256}
                level="M"
                includeMargin={true}
                imageSettings={{
                  src: "/logo.png",
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </motion.div>

          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              Scan to Mark Attendance
            </p>
            <p className="text-sm text-gray-600">
              QR code refreshes every 5 minutes for security
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateQR}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh QR
            </button>
            
            <button
              onClick={endSession}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              End Session
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Session Completed
          </h3>
          <p className="text-gray-600">
            Final attendance: {attendanceCount} students present
          </p>
        </div>
      )}

      {/* Live Attendance List */}
      <LiveAttendanceList sessionId={sessionId} />
    </div>
  );
}

function LiveAttendanceList({ sessionId }: { sessionId: string }) {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAndSubscribe = async () => {
      await loadAttendanceRecords();

      // Subscribe to real-time updates
      const subscription = supabase
        .channel(`attendance-list-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
            filter: `session_id=eq.${sessionId}`
          },
          () => {
            loadAttendanceRecords();
          }
        )
        .subscribe();

      return subscription;
    };

    let subscription: any = null;
    
    loadAndSubscribe().then(sub => {
      subscription = sub;
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [sessionId]);

  const loadAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, student:users(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-semibold mb-4">Live Attendance</h4>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-12 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Live Attendance ({attendanceRecords.length})
      </h4>
      
      <div className="max-h-64 overflow-y-auto space-y-2">
        {attendanceRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No attendance records yet
          </p>
        ) : (
          attendanceRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {record.student?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {record.student?.name || 'Unknown Student'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.student?.student_id}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  record.status === 'present' 
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'late'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {record.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(record.created_at).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
