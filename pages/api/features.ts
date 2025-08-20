import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Complete feature mapping for all roles
const ROLE_FEATURES = {
  student: {
    dashboard: {
      allowed: true,
      features: [
        "View personal timetable",
        "Check attendance percentage",
        "View notifications",
        "Track class schedule",
        "Attendance shortage alerts"
      ]
    },
    attendance: {
      allowed: true,
      features: [
        "Scan QR code for attendance",
        "View attendance history",
        "Attendance percentage tracking",
        "Shortage warnings",
        "Location-based check-in"
      ],
      restrictions: [
        "Cannot mark attendance manually",
        "Cannot edit attendance records", 
        "Cannot see other students' attendance",
        "Cannot create attendance sessions"
      ]
    },
    timetable: {
      allowed: true,
      features: [
        "View personal timetable",
        "Export timetable to calendar",
        "Class location information",
        "Faculty contact details"
      ],
      restrictions: [
        "Cannot modify timetable",
        "Cannot see other students' timetables",
        "Cannot create/edit classes"
      ]
    },
    notifications: {
      allowed: true,
      features: [
        "Receive notifications",
        "Mark notifications as read",
        "Filter by notification type"
      ],
      restrictions: [
        "Cannot send notifications",
        "Cannot create announcements"
      ]
    },
    profile: {
      allowed: true,
      features: [
        "Update personal information",
        "Change password",
        "Upload profile picture",
        "Manage notification preferences"
      ],
      restrictions: [
        "Cannot change role",
        "Cannot modify academic records"
      ]
    }
  },
  
  faculty: {
    dashboard: {
      allowed: true,
      features: [
        "View assigned classes",
        "Monitor class attendance",
        "Access teaching schedule",
        "View student performance",
        "Class management tools"
      ]
    },
    attendance: {
      allowed: true,
      features: [
        "Create QR attendance sessions",
        "View real-time attendance",
        "Mark attendance manually",
        "Edit attendance records",
        "Generate attendance reports",
        "Approve late attendance",
        "Location-based session control",
        "Session time limits"
      ],
      restrictions: [
        "Cannot see other faculty's sessions",
        "Cannot edit system-wide attendance settings"
      ]
    },
    timetable: {
      allowed: true,
      features: [
        "View personal teaching schedule",
        "See assigned classrooms",
        "View student groups",
        "Export class schedules",
        "Request timetable changes"
      ],
      restrictions: [
        "Cannot modify master timetable",
        "Cannot assign other faculty",
        "Cannot create new courses"
      ]
    },
    students: {
      allowed: true,
      features: [
        "View enrolled students",
        "Access student contact info",
        "View student attendance records",
        "Generate student reports",
        "Track student performance"
      ],
      restrictions: [
        "Cannot modify student personal data",
        "Cannot see students from other courses",
        "Cannot change student grades"
      ]
    },
    notifications: {
      allowed: true,
      features: [
        "Send notifications to students",
        "Create class announcements",
        "Send attendance reminders",
        "Course-specific notifications"
      ],
      restrictions: [
        "Cannot send system-wide notifications",
        "Cannot message other faculty's students"
      ]
    },
    reports: {
      allowed: true,
      features: [
        "Generate class attendance reports",
        "Student performance analytics",
        "Export data to Excel/PDF",
        "Attendance trend analysis"
      ],
      restrictions: [
        "Cannot access institution-wide reports",
        "Cannot see other faculty reports"
      ]
    }
  },
  
  admin: {
    dashboard: {
      allowed: true,
      features: [
        "Institution overview",
        "Monitor all classes",
        "System health metrics",
        "User activity monitoring",
        "Global statistics"
      ]
    },
    timetable: {
      allowed: true,
      features: [
        "Create and modify timetables",
        "Assign faculty to courses",
        "Manage classrooms and resources",
        "Auto-generate timetables",
        "Conflict detection and resolution",
        "Bulk timetable operations",
        "Export/import timetables"
      ],
      restrictions: []
    },
    attendance: {
      allowed: true,
      features: [
        "Monitor all attendance sessions",
        "Override attendance records",
        "Generate system-wide reports",
        "Configure attendance policies",
        "Audit attendance logs",
        "Bulk attendance operations"
      ],
      restrictions: []
    },
    users: {
      allowed: true,
      features: [
        "Create/modify/delete users",
        "Assign and change roles",
        "Manage user permissions",
        "Bulk user operations",
        "User activity monitoring",
        "Account activation/deactivation"
      ],
      restrictions: [
        "Cannot impersonate users without logging"
      ]
    },
    notifications: {
      allowed: true,
      features: [
        "Send system-wide notifications",
        "Create targeted announcements",
        "Schedule notifications",
        "Notification templates",
        "Emergency alerts"
      ],
      restrictions: []
    },
    reports: {
      allowed: true,
      features: [
        "Institution-wide analytics",
        "Attendance statistics",
        "Faculty workload reports",
        "Student performance metrics",
        "System usage analytics",
        "Custom report generation",
        "Data export capabilities"
      ],
      restrictions: []
    },
    settings: {
      allowed: true,
      features: [
        "Configure system settings",
        "Manage application preferences",
        "Set attendance policies",
        "Configure notification settings",
        "Backup and restore data",
        "Security configuration"
      ],
      restrictions: []
    },
    audit: {
      allowed: true,
      features: [
        "View all system logs",
        "Track user activities",
        "Monitor security events",
        "Generate audit reports",
        "Compliance tracking"
      ],
      restrictions: []
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;

    switch (method) {
      case "GET":
        const { role, feature } = req.query;
        
        if (role && feature) {
          // Get specific feature details for a role
          const roleFeatures = ROLE_FEATURES[role as keyof typeof ROLE_FEATURES];
          if (!roleFeatures) {
            return res.status(404).json({ error: "Role not found" });
          }
          
          const featureDetails = roleFeatures[feature as keyof typeof roleFeatures];
          if (!featureDetails) {
            return res.status(404).json({ error: "Feature not found for this role" });
          }
          
          return res.status(200).json(featureDetails);
        }
        
        if (role) {
          // Get all features for a specific role
          const roleFeatures = ROLE_FEATURES[role as keyof typeof ROLE_FEATURES];
          if (!roleFeatures) {
            return res.status(404).json({ error: "Role not found" });
          }
          
          return res.status(200).json(roleFeatures);
        }
        
        // Return all role features
        return res.status(200).json(ROLE_FEATURES);

      case "POST":
        // Check if user has permission for a specific action
        const { user_id, action, resource } = req.body;
        
        if (!user_id || !action || !resource) {
          return res.status(400).json({ error: "Missing required parameters" });
        }
        
        // Get user's role from database
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user_id)
          .single();
        
        if (!userProfile) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const userRole = userProfile.role;
        const rolePermissions = ROLE_FEATURES[userRole as keyof typeof ROLE_FEATURES];
        
        if (!rolePermissions) {
          return res.status(403).json({ 
            allowed: false, 
            reason: "Invalid role" 
          });
        }
        
        const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
        
        if (!resourcePermissions || !resourcePermissions.allowed) {
          return res.status(403).json({ 
            allowed: false, 
            reason: "Access denied to this resource" 
          });
        }
        
        // Check if action is specifically restricted
        const restrictions = (resourcePermissions as any).restrictions || [];
        const isRestricted = restrictions.some((restriction: string) => 
          restriction.toLowerCase().includes(action.toLowerCase())
        );
        
        if (isRestricted) {
          return res.status(403).json({ 
            allowed: false, 
            reason: "This action is restricted for your role",
            restrictions: restrictions
          });
        }
        
        // Log permission check
        await supabase
          .from('audit_logs')
          .insert([{
            user_id,
            action: 'permission_check',
            details: { action, resource, result: 'allowed' },
            timestamp: new Date().toISOString()
          }]);
        
        return res.status(200).json({ 
          allowed: true, 
          features: resourcePermissions.features,
          restrictions: restrictions
        });

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Features API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
