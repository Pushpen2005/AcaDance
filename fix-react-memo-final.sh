#!/bin/bash

# Fix React.memo export syntax by removing extra parentheses
files=(
  "components/AdminAuditLogs.tsx"
  "components/AdminDashboard-backup.tsx"
  "components/AdminGlobalSettings.tsx"
  "components/ComprehensiveTimetableManagement.tsx"
  "components/FacultyAttendanceDashboard.tsx"
  "components/FacultyAttendanceMarking.tsx"
  "components/FacultyDashboard-old.tsx"
  "components/IntegrationTestDashboard.tsx"
  "components/SimpleAttendanceDemo.tsx"
  "components/StudentAttendanceDashboard.tsx"
  "components/StudentAttendanceSystem.tsx"
  "components/StudentDashboard-enhanced.tsx"
  "components/StudentDashboard-old.tsx"
  "components/StudentDashboard.tsx"
  "components/TimetableView.tsx"
)

for file in "${files[@]}"; do
  echo "Fixing React.memo syntax in: $file"
  
  # Fix export default React.memo(ComponentName))); to export default React.memo(ComponentName);
  sed -i '' 's/export default React\.memo(\([^)]*\))))/export default React.memo(\1)/g' "$file"
  
  echo "Fixed: $file"
done

echo "All React.memo syntax errors fixed!"
