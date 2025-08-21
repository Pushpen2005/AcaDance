#!/bin/bash

# Fix React.memo function expressions that are missing closing parentheses
# These are files that use: export default React.memo(function ComponentName() { ... }
# And need a closing ); at the end

files_with_missing_parentheses=(
  "components/AdminTimetableEditor.tsx"
  "components/AdvancedTimetableGeneration.tsx"
  "components/AIFaceDetectionAttendance.tsx"
  "components/attendance-tracking.tsx"
  "components/AuthPage.tsx"
  "components/ColorCodedTimetableView.tsx"
  "components/dashboard.tsx"
  "components/DashboardTimetable.tsx"
  "components/EnhancedAuthSystem.tsx"
  "components/EnhancedInteractiveDashboard.tsx"
  "components/FacultyFaceDetectionAttendance.tsx"
  "components/FeatureTestDashboard.tsx"
  "components/HighlightInit.tsx"
  "components/MobileQRAttendance.tsx"
  "components/MobileResponsivenessChecker.tsx"
  "components/QRAttendanceSystem.tsx"
  "components/RealTimeNotificationSystem.tsx"
  "components/reports.tsx"
  "components/RoleBasedDashboard.tsx"
  "components/RoleBasedDashboardNew.tsx"
  "components/RoleBasedTimetableAccess.tsx"
  "components/settings.tsx"
  "components/SmartSchedulingAlgorithms.tsx"
  "components/StudentDashboardTimetable.tsx"
  "components/SupabaseConnectionTestDashboard.tsx"
  "components/timetable-management.tsx"
  "components/TimetableAnalyticsAndReports.tsx"
)

for file in "${files_with_missing_parentheses[@]}"; do
  echo "Processing: $file"
  
  # Check if file exists
  if [[ -f "$file" ]]; then
    # Check if the file ends with just } instead of });
    last_line=$(tail -n 1 "$file" | tr -d '[:space:]')
    second_last_line=$(tail -n 2 "$file" | head -n 1 | tr -d '[:space:]')
    
    # If the file ends with } but doesn't have }); add the missing });
    if [[ "$last_line" == "}" && "$second_last_line" != "});" ]]; then
      # Remove the last } and add });
      head -n -1 "$file" > "${file}.tmp"
      echo "});" >> "${file}.tmp"
      mv "${file}.tmp" "$file"
      echo "Fixed missing closing parentheses in: $file"
    else
      echo "No fix needed for: $file"
    fi
  else
    echo "File not found: $file"
  fi
done

echo "All React.memo function expression syntax errors fixed!"
