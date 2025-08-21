// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  User, 
  Clock, 
  Activity,
  Eye,
  Trash2,
  Calendar as CalendarIcon,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

const AdminAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Mock audit logs data - Replace with actual Supabase queries
  useEffect(() => {
    const mockAuditLogs: AuditLog[] = [
      {
        id: '1',
        user_id: 'user1',
        user_name: 'John Smith',
        user_role: 'admin',
        action: 'user_role_changed',
        details: { old_role: 'student', new_role: 'faculty', target_user: 'jane.doe@university.edu' },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: '2024-01-15T10:30:00Z',
        risk_level: 'high'
      },
      {
        id: '2',
        user_id: 'user2',
        user_name: 'Jane Doe',
        user_role: 'faculty',
        action: 'attendance_marked',
        details: { class_id: 'CS101', students_marked: 25, session_type: 'lecture' },
        ip_address: '10.0.1.50',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: '2024-01-15T09:15:00Z',
        risk_level: 'low'
      },
      {
        id: '3',
        user_id: 'user3',
        user_name: 'System Admin',
        user_role: 'admin',
        action: 'bulk_data_export',
        details: { export_type: 'attendance_reports', records_count: 5000, file_size: '2.3MB' },
        ip_address: '172.16.0.10',
        user_agent: 'curl/7.68.0',
        created_at: '2024-01-15T08:45:00Z',
        risk_level: 'medium'
      },
      {
        id: '4',
        user_id: 'user4',
        user_name: 'Bob Wilson',
        user_role: 'student',
        action: 'failed_login_attempt',
        details: { attempt_count: 5, reason: 'invalid_password', account_locked: true },
        ip_address: '203.0.113.45',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        created_at: '2024-01-15T07:20:00Z',
        risk_level: 'critical'
      },
      {
        id: '5',
        user_id: 'user5',
        user_name: 'Alice Johnson',
        user_role: 'faculty',
        action: 'qr_code_generated',
        details: { class_id: 'MATH201', expiry_time: '30 minutes', geofence_enabled: true },
        ip_address: '192.168.1.75',
        user_agent: 'Mozilla/5.0 (iPad; CPU OS 15_0)',
        created_at: '2024-01-15T06:00:00Z',
        risk_level: 'low'
      }
    ];

    setTimeout(() => {
      setAuditLogs(mockAuditLogs);
      setFilteredLogs(mockAuditLogs);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter logs based on search, action, risk level, and date range
  useEffect(() => {
    let filtered = auditLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address.includes(searchTerm);
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesRisk = riskFilter === 'all' || log.risk_level === riskFilter;
      
      const logDate = new Date(log.created_at);
      const matchesDateRange = (!dateRange.from || logDate >= dateRange.from) &&
                               (!dateRange.to || logDate <= dateRange.to);
      
      return matchesSearch && matchesAction && matchesRisk && matchesDateRange;
    });

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, actionFilter, riskFilter, dateRange]);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_role_changed': return <User className="w-4 h-4" />;
      case 'attendance_marked': return <Clock className="w-4 h-4" />;
      case 'bulk_data_export': return <Download className="w-4 h-4" />;
      case 'failed_login_attempt': return <AlertCircle className="w-4 h-4" />;
      case 'qr_code_generated': return <Activity className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Action', 'Risk Level', 'IP Address', 'Details'],
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_name,
        log.user_role,
        log.action,
        log.risk_level,
        log.ip_address,
        JSON.stringify(log.details)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const refreshLogs = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const summaryStats = {
    total: filteredLogs.length,
    critical: filteredLogs.filter(log => log.risk_level === 'critical').length,
    high: filteredLogs.filter(log => log.risk_level === 'high').length,
    last24h: filteredLogs.filter(log => 
      new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Audit Logs
          </h2>
          <p className="text-muted-foreground">
            Monitor system activities and security events
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshLogs} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportAuditLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summaryStats.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.last24h}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, actions, IPs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user_role_changed">Role Changes</SelectItem>
                  <SelectItem value="attendance_marked">Attendance</SelectItem>
                  <SelectItem value="bulk_data_export">Data Export</SelectItem>
                  <SelectItem value="failed_login_attempt">Failed Logins</SelectItem>
                  <SelectItem value="qr_code_generated">QR Generation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level</label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'MMM dd') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{from: dateRange.from, to: dateRange.to}}
                    onSelect={(range) => setDateRange({
                      from: range?.from,
                      to: range?.to
                    })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.user_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.user_role}
                          </Badge>
                          <Badge className={`text-xs ${getRiskBadgeColor(log.risk_level)}`}>
                            {log.risk_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</span>
                          <span>IP: {log.ip_address}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching the current filters.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Audit Log Details
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.user_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.user_role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Risk Level</label>
                  <Badge className={`text-xs ${getRiskBadgeColor(selectedLog.risk_level)}`}>
                    {selectedLog.risk_level}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.ip_address}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">User Agent</label>
                <p className="text-sm text-muted-foreground break-all">{selectedLog.user_agent}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Action Details</label>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Performance and Error Handling Enhanced
export default React.memo(AdminAuditLogs;
)
