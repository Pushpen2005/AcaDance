// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Activity } from "lucide-react";


// Import the enhanced interactive dashboard
import EnhancedInteractiveDashboard from './EnhancedInteractiveDashboard'

// Performance and Error Handling Enhanced
export default React.memo(function RoleBasedDashboard() {
  // Use the enhanced dashboard with all interactive features
  return <EnhancedInteractiveDashboard />
}
)
