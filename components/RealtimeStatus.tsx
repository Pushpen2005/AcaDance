"use client"

import React from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RealtimeStatusProps {
  isConnected: boolean;
  connectionStatus?: {
    attendance: boolean;
    timetable: boolean;
    notifications: boolean;
    overall: boolean;
  };
  errors?: string[];
  className?: string;
  showDetails?: boolean;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  isConnected,
  connectionStatus,
  errors = [],
  className = '',
  showDetails = false
}) => {
  const getStatusIcon = () => {
    if (errors.length > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (errors.length > 0) return 'Connection Error';
    if (isConnected) return 'Real-time Connected';
    return 'Connecting...';
  };

  const getStatusColor = () => {
    if (errors.length > 0) return 'destructive';
    if (isConnected) return 'default';
    return 'secondary';
  };

  const getDetailedStatus = () => {
    if (!connectionStatus) return null;

    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          {connectionStatus.attendance ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-xs">Attendance</span>
        </div>
        <div className="flex items-center space-x-2">
          {connectionStatus.timetable ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-xs">Timetable</span>
        </div>
        <div className="flex items-center space-x-2">
          {connectionStatus.notifications ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-xs">Notifications</span>
        </div>
        {errors.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs font-medium text-red-600 mb-1">Errors:</p>
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-red-500">{error}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (showDetails && connectionStatus) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">Real-time Status</span>
        </div>
        {getDetailedStatus()}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center space-x-2 ${className}`}>
            {getStatusIcon()}
            <Badge variant={getStatusColor() as any} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          <div className="max-w-xs">
            {getDetailedStatus() || (
              <p className="text-xs">{getStatusText()}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RealtimeStatus;
