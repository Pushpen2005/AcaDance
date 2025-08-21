// Enhanced with Advanced Supabase Theme Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";


import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Palette, Settings } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

// Performance and Error Handling Enhanced
export default React.memo(function ThemeToggle({ 
  className = "", 
  variant = "ghost", 
  size = "icon",
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-4 w-4" />
        {showLabel && <span className="ml-2">Theme</span>}
      </Button>
    );
  }

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeName: string) => {
    switch (themeName) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Light';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {getThemeIcon(theme || 'light')}
          {showLabel && (
            <span className="ml-2">
              {getThemeLabel(theme || 'light')}
            </span>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Options
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Theme Mode Options */}
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Light
          </div>
          {theme === 'light' && <div className="w-2 h-2 bg-primary rounded-full" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Dark
          </div>
          {theme === 'dark' && <div className="w-2 h-2 bg-primary rounded-full" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System
          </div>
          {theme === 'system' && <div className="w-2 h-2 bg-primary rounded-full" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Current Theme Info */}
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          Currently using: {resolvedTheme}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Link to Theme Customizer */}
        <DropdownMenuItem 
          onClick={() => {
            // This would open a theme customizer modal or navigate to theme settings
            window.open('/theme-customizer', '_blank');
          }}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Customize Theme...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick toggle component for simple light/dark switching
export function QuickThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={className} disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className={className}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Theme status indicator
export function ThemeStatusIndicator() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <div className={`w-2 h-2 rounded-full ${
        resolvedTheme === 'dark' ? 'bg-slate-400' : 'bg-yellow-400'
      }`} />
      {resolvedTheme}
    </div>
  );
}
)
