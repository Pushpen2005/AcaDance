import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Mail, 
  Bell, 
  Clock, 
  Users, 
  Database, 
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  Key,
  Globe,
  Smartphone,
  Lock
} from "lucide-react";

interface SystemSettings {
  general: {
    systemName: string;
    systemDescription: string;
    timezone: string;
    language: string;
    dateFormat: string;
    maintenanceMode: boolean;
    maxUploadSize: number;
    sessionTimeout: number;
  };
  security: {
    enforcePasswordPolicy: boolean;
    minPasswordLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    enableTwoFactor: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    enableAuditLogging: boolean;
    enableIpWhitelist: boolean;
  };
  attendance: {
    enableGeofencing: boolean;
    geofenceRadius: number;
    qrCodeExpiry: number;
    allowManualEntry: boolean;
    enableLateMarking: boolean;
    lateMarkingGracePeriod: number;
    autoMarkAbsent: boolean;
    requireFacultyApproval: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    enablePushNotifications: boolean;
    enableInAppNotifications: boolean;
    attendanceReminders: boolean;
    systemMaintenance: boolean;
    lowAttendanceAlerts: boolean;
    weeklyReports: boolean;
  };
  integrations: {
    enableLdapAuth: boolean;
    ldapServerUrl: string;
    enableSsoAuth: boolean;
    ssoProvider: string;
    enableApiAccess: boolean;
    apiRateLimit: number;
    enableWebhooks: boolean;
    webhookUrl: string;
  };
}

const AdminGlobalSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Mock settings data - Replace with actual API calls
  useEffect(() => {
    const mockSettings: SystemSettings = {
      general: {
        systemName: 'Academic Management System',
        systemDescription: 'Comprehensive academic attendance and timetable management platform',
        timezone: 'UTC',
        language: 'en',
        dateFormat: 'YYYY-MM-DD',
        maintenanceMode: false,
        maxUploadSize: 10,
        sessionTimeout: 1440
      },
      security: {
        enforcePasswordPolicy: true,
        minPasswordLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        enableTwoFactor: false,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        enableAuditLogging: true,
        enableIpWhitelist: false
      },
      attendance: {
        enableGeofencing: true,
        geofenceRadius: 100,
        qrCodeExpiry: 30,
        allowManualEntry: true,
        enableLateMarking: true,
        lateMarkingGracePeriod: 15,
        autoMarkAbsent: true,
        requireFacultyApproval: false
      },
      notifications: {
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enablePushNotifications: true,
        enableInAppNotifications: true,
        attendanceReminders: true,
        systemMaintenance: true,
        lowAttendanceAlerts: true,
        weeklyReports: true
      },
      integrations: {
        enableLdapAuth: false,
        ldapServerUrl: '',
        enableSsoAuth: false,
        ssoProvider: 'none',
        enableApiAccess: true,
        apiRateLimit: 1000,
        enableWebhooks: false,
        webhookUrl: ''
      }
    };

    setTimeout(() => {
      setSettings(mockSettings);
      setLoading(false);
    }, 1000);
  }, []);

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setHasChanges(false);
      // Show success message
    }, 2000);
  };

  const resetSettings = () => {
    setLoading(true);
    // Simulate reset
    setTimeout(() => {
      setLoading(false);
      setHasChanges(false);
    }, 1000);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_settings_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !settings) {
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
            <Settings className="w-6 h-6" />
            Global Settings
          </h2>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportSettings} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={resetSettings} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || saving}
            size="sm"
          >
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                You have unsaved changes. Remember to save your settings.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Configure basic system information and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={settings.general.systemName}
                    onChange={(e) => updateSetting('general', 'systemName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemDescription">System Description</Label>
                <Textarea
                  id="systemDescription"
                  value={settings.general.systemDescription}
                  onChange={(e) => updateSetting('general', 'systemDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) => updateSetting('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.general.dateFormat}
                    onValueChange={(value) => updateSetting('general', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.general.sessionTimeout}
                    onChange={(e) => updateSetting('general', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">System Behavior</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to restrict system access
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                  <Input
                    id="maxUploadSize"
                    type="number"
                    value={settings.general.maxUploadSize}
                    onChange={(e) => updateSetting('general', 'maxUploadSize', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Password Policy
              </CardTitle>
              <CardDescription>Configure password requirements and security rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Password Policy</Label>
                  <p className="text-sm text-muted-foreground">
                    Require users to follow password complexity rules
                  </p>
                </div>
                <Switch
                  checked={settings.security.enforcePasswordPolicy}
                  onCheckedChange={(checked) => updateSetting('security', 'enforcePasswordPolicy', checked)}
                />
              </div>

              {settings.security.enforcePasswordPolicy && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                    <Input
                      id="minPasswordLength"
                      type="number"
                      value={settings.security.minPasswordLength}
                      onChange={(e) => updateSetting('security', 'minPasswordLength', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.security.requireUppercase}
                        onCheckedChange={(checked) => updateSetting('security', 'requireUppercase', checked)}
                      />
                      <Label>Require Uppercase</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.security.requireNumbers}
                        onCheckedChange={(checked) => updateSetting('security', 'requireNumbers', checked)}
                      />
                      <Label>Require Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.security.requireSpecialChars}
                        onCheckedChange={(checked) => updateSetting('security', 'requireSpecialChars', checked)}
                      />
                      <Label>Require Special Characters</Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Authentication Security
              </CardTitle>
              <CardDescription>Configure login security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for enhanced security
                  </p>
                </div>
                <Switch
                  checked={settings.security.enableTwoFactor}
                  onCheckedChange={(checked) => updateSetting('security', 'enableTwoFactor', checked)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all security events
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.enableAuditLogging}
                    onCheckedChange={(checked) => updateSetting('security', 'enableAuditLogging', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict access by IP address
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.enableIpWhitelist}
                    onCheckedChange={(checked) => updateSetting('security', 'enableIpWhitelist', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                QR Code & Geofencing
              </CardTitle>
              <CardDescription>Configure attendance scanning and location settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Geofencing</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict attendance marking to specific locations
                  </p>
                </div>
                <Switch
                  checked={settings.attendance.enableGeofencing}
                  onCheckedChange={(checked) => updateSetting('attendance', 'enableGeofencing', checked)}
                />
              </div>

              {settings.attendance.enableGeofencing && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label htmlFor="geofenceRadius">Geofence Radius (meters)</Label>
                  <Input
                    id="geofenceRadius"
                    type="number"
                    value={settings.attendance.geofenceRadius}
                    onChange={(e) => updateSetting('attendance', 'geofenceRadius', parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qrCodeExpiry">QR Code Expiry (minutes)</Label>
                  <Input
                    id="qrCodeExpiry"
                    type="number"
                    value={settings.attendance.qrCodeExpiry}
                    onChange={(e) => updateSetting('attendance', 'qrCodeExpiry', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lateMarkingGracePeriod">Late Marking Grace Period (minutes)</Label>
                  <Input
                    id="lateMarkingGracePeriod"
                    type="number"
                    value={settings.attendance.lateMarkingGracePeriod}
                    onChange={(e) => updateSetting('attendance', 'lateMarkingGracePeriod', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Attendance Rules
              </CardTitle>
              <CardDescription>Configure attendance marking policies and approvals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Manual Entry</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable manual attendance entry
                    </p>
                  </div>
                  <Switch
                    checked={settings.attendance.allowManualEntry}
                    onCheckedChange={(checked) => updateSetting('attendance', 'allowManualEntry', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Late Marking</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow attendance after class starts
                    </p>
                  </div>
                  <Switch
                    checked={settings.attendance.enableLateMarking}
                    onCheckedChange={(checked) => updateSetting('attendance', 'enableLateMarking', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Mark Absent</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically mark as absent after grace period
                    </p>
                  </div>
                  <Switch
                    checked={settings.attendance.autoMarkAbsent}
                    onCheckedChange={(checked) => updateSetting('attendance', 'autoMarkAbsent', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Faculty Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Manual entries need faculty approval
                    </p>
                  </div>
                  <Switch
                    checked={settings.attendance.requireFacultyApproval}
                    onCheckedChange={(checked) => updateSetting('attendance', 'requireFacultyApproval', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>Configure which notification methods are available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enableEmailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enableEmailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enableSmsNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enableSmsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enablePushNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enablePushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the app
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enableInAppNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enableInAppNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Notification Types
              </CardTitle>
              <CardDescription>Configure which types of notifications to send</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Attendance Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Remind students to mark attendance
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.attendanceReminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'attendanceReminders', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about system maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemMaintenance}
                    onCheckedChange={(checked) => updateSetting('notifications', 'systemMaintenance', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Attendance Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when attendance falls below threshold
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.lowAttendanceAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'lowAttendanceAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Send weekly attendance summary reports
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReports', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Authentication Integrations
              </CardTitle>
              <CardDescription>Configure external authentication providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>LDAP Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Integrate with LDAP directory services
                  </p>
                </div>
                <Switch
                  checked={settings.integrations.enableLdapAuth}
                  onCheckedChange={(checked) => updateSetting('integrations', 'enableLdapAuth', checked)}
                />
              </div>

              {settings.integrations.enableLdapAuth && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label htmlFor="ldapServerUrl">LDAP Server URL</Label>
                  <Input
                    id="ldapServerUrl"
                    value={settings.integrations.ldapServerUrl}
                    onChange={(e) => updateSetting('integrations', 'ldapServerUrl', e.target.value)}
                    placeholder="ldap://your-ldap-server.com"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SSO Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable Single Sign-On integration
                  </p>
                </div>
                <Switch
                  checked={settings.integrations.enableSsoAuth}
                  onCheckedChange={(checked) => updateSetting('integrations', 'enableSsoAuth', checked)}
                />
              </div>

              {settings.integrations.enableSsoAuth && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label htmlFor="ssoProvider">SSO Provider</Label>
                  <Select
                    value={settings.integrations.ssoProvider}
                    onValueChange={(value) => updateSetting('integrations', 'ssoProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Provider</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="microsoft">Microsoft</SelectItem>
                      <SelectItem value="okta">Okta</SelectItem>
                      <SelectItem value="auth0">Auth0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                API & Webhooks
              </CardTitle>
              <CardDescription>Configure API access and webhook integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable external API access
                  </p>
                </div>
                <Switch
                  checked={settings.integrations.enableApiAccess}
                  onCheckedChange={(checked) => updateSetting('integrations', 'enableApiAccess', checked)}
                />
              </div>

              {settings.integrations.enableApiAccess && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={settings.integrations.apiRateLimit}
                    onChange={(e) => updateSetting('integrations', 'apiRateLimit', parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhooks</Label>
                  <p className="text-sm text-muted-foreground">
                    Send event notifications to external services
                  </p>
                </div>
                <Switch
                  checked={settings.integrations.enableWebhooks}
                  onCheckedChange={(checked) => updateSetting('integrations', 'enableWebhooks', checked)}
                />
              </div>

              {settings.integrations.enableWebhooks && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.integrations.webhookUrl}
                    onChange={(e) => updateSetting('integrations', 'webhookUrl', e.target.value)}
                    placeholder="https://your-service.com/webhook"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGlobalSettings;
