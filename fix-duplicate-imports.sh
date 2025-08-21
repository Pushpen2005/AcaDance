#!/bin/bash

# Script to fix duplicate imports and common syntax issues

echo "Fixing duplicate imports and syntax issues..."

# Find all TypeScript/JSX files with duplicate imports
find components -name "*.tsx" -o -name "*.ts" | while read file; do
    echo "Processing: $file"
    
    # Create a temporary file for processing
    temp_file=$(mktemp)
    
    # Remove duplicate import statements, keeping only the first occurrence
    awk '
    BEGIN { 
        seen_imports = 0
        react_imported = 0
        use_client_added = 0
    }
    /^"use client";?$/ {
        if (!use_client_added) {
            print
            use_client_added = 1
        }
        next
    }
    /^import.*React.*from.*react/ {
        if (!react_imported) {
            print
            react_imported = 1
        }
        next
    }
    /^import.*from.*@\/components\/ui\/(card|button|badge)/ {
        # Track UI component imports to avoid duplicates
        if (!seen[$0]) {
            seen[$0] = 1
            print
        }
        next
    }
    /^import.*from.*lucide-react/ {
        # Track lucide icon imports to avoid duplicates
        if (!seen[$0]) {
            seen[$0] = 1
            print
        }
        next
    }
    {
        # Print all other lines
        print
    }
    ' "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
done

echo "Fixed duplicate imports in TypeScript files."

# Fix common export syntax issues
echo "Fixing export syntax issues..."

# Fix React.memo export issues
find components -name "*.tsx" | while read file; do
    # Fix malformed React.memo exports
    sed -i '' 's/export default React\.memo(\([^;]*\);$/export default React.memo(\1);/g' "$file"
    
    # Remove extra closing parentheses at end of files
    sed -i '' '/^)$/d' "$file"
done

echo "Fixed export syntax issues."

echo "Cleaning up complete!"
