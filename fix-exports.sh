#!/bin/bash

# Fix React.memo export syntax errors
echo "🔧 Fixing React.memo export syntax errors..."

# List of files with the syntax error pattern
files=(
    "components/FacultyDashboard-old.tsx"
    "components/StudentDashboard-old.tsx"
    "components/IntegrationTestDashboard.tsx"
    "components/FacultyAttendanceDashboard.tsx"
    "components/StudentAttendanceDashboard.tsx"
    "components/TimetableView.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Fixing $file..."
        # Replace the broken export pattern with correct syntax
        sed -i.bak 's/export default React\.memo(\([^;]*\);$/export default React.memo(\1);/g' "$file"
        # Remove backup file
        rm -f "$file.bak"
        echo "✅ Fixed $file"
    else
        echo "⚠️  $file not found"
    fi
done

echo "🎉 React.memo export fixes completed!"
