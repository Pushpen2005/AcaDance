/**
 * QR Code Utilities for Attendance System
 */

import QRCode from 'qrcode';

export interface AttendanceSession {
  sessionId: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  startTime: string;
  endTime: string;
  room: string;
  expiryTime: string;
  geofenceEnabled: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number;
}

export interface QRScanResult {
  sessionId: string;
  studentId: string;
  deviceId: string;
  timestamp: string;
  gps?: {
    lat: number;
    lng: number;
  };
}

/**
 * Generate QR code for attendance session
 */
export async function generateAttendanceQR(session: AttendanceSession): Promise<string> {
  const qrData = {
    type: 'attendance',
    sessionId: session.sessionId,
    expiryTime: session.expiryTime,
    courseCode: session.courseCode,
    room: session.room,
    checksum: generateChecksum(session.sessionId + session.expiryTime)
  };

  const qrString = JSON.stringify(qrData);
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse scanned QR code data
 */
export function parseAttendanceQR(qrData: string): AttendanceSession | null {
  try {
    const parsed = JSON.parse(qrData);
    
    // Validate QR code structure
    if (parsed.type !== 'attendance' || !parsed.sessionId || !parsed.expiryTime) {
      throw new Error('Invalid QR code format');
    }

    // Validate checksum
    const expectedChecksum = generateChecksum(parsed.sessionId + parsed.expiryTime);
    if (parsed.checksum !== expectedChecksum) {
      throw new Error('QR code checksum validation failed');
    }

    // Check if QR code has expired
    const expiryTime = new Date(parsed.expiryTime);
    const currentTime = new Date();
    
    if (currentTime > expiryTime) {
      throw new Error('QR code has expired');
    }

    return {
      sessionId: parsed.sessionId,
      courseCode: parsed.courseCode,
      courseName: '',
      facultyName: '',
      startTime: '',
      endTime: '',
      room: parsed.room,
      expiryTime: parsed.expiryTime,
      geofenceEnabled: false
    };
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
}

/**
 * Generate a simple checksum for QR code validation
 */
function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get current GPS coordinates
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Calculate distance between two GPS coordinates (in meters)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if student is within geofence
 */
export function validateGeofence(
  studentLat: number,
  studentLng: number,
  classLat: number,
  classLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(studentLat, studentLng, classLat, classLng);
  return distance <= radiusMeters;
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if current time is within class period
 */
export function isWithinClassTime(startTime: string, endTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return now >= start && now <= end;
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate session data before QR generation
 */
export function validateSessionData(session: Partial<AttendanceSession>): string[] {
  const errors: string[] = [];
  
  if (!session.sessionId) errors.push('Session ID is required');
  if (!session.courseCode) errors.push('Course code is required');
  if (!session.expiryTime) errors.push('Expiry time is required');
  if (!session.room) errors.push('Room is required');
  
  // Validate expiry time is in the future
  if (session.expiryTime) {
    const expiryTime = new Date(session.expiryTime);
    const now = new Date();
    if (expiryTime <= now) {
      errors.push('Expiry time must be in the future');
    }
  }
  
  return errors;
}

/**
 * Create QR code with session branding
 */
export async function generateBrandedQR(
  session: AttendanceSession,
  options: {
    logoUrl?: string;
    brandColor?: string;
    title?: string;
  } = {}
): Promise<string> {
  const qrData = {
    type: 'attendance',
    sessionId: session.sessionId,
    expiryTime: session.expiryTime,
    courseCode: session.courseCode,
    room: session.room,
    checksum: generateChecksum(session.sessionId + session.expiryTime)
  };

  const qrString = JSON.stringify(qrData);
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H', // High error correction for logo overlay
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: options.brandColor || '#1e40af',
        light: '#FFFFFF'
      },
      width: 400
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating branded QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
