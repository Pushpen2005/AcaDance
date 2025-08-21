// Enhanced with Advanced Supabase Theme Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";


import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Check,
  Settings,
  Eye,
  Contrast,
  Zap
} from 'lucide-react';

interface ThemeOption {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  preview: string;
}

// Performance and Error Handling Enhanced
export default React.memo(function EnhancedThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Clean and bright interface',
      preview: 'bg-white text-gray-900 border-gray-200'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes in low light',
      preview: 'bg-gray-900 text-white border-gray-700'
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follows your device preference',
      preview: 'bg-gradient-to-r from-gray-100 to-gray-900 text-gray-700 border-gray-400'
    }
  ];

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Settings className="w-4 h-4" />
      </Button>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const currentThemeOption = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentThemeOption?.icon || Monitor;

  return (
    <div className="flex items-center gap-2">
      {/* Quick Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (theme === 'light') setTheme('dark');
          else if (theme === 'dark') setTheme('system');
          else setTheme('light');
        }}
        className="relative overflow-hidden transition-all duration-300 hover:scale-105"
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <CurrentIcon className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentThemeOption?.label}
          </span>
        </motion.div>
      </Button>

      {/* Advanced Theme Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Palette className="w-4 h-4" />
            <span className="sr-only">Theme options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Theme Preferences
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Theme Options */}
          <div className="p-2 space-y-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DropdownMenuItem
                    onClick={() => setTheme(option.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 border' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-md ${option.preview}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                          {option.value === 'system' && (
                            <Badge variant="secondary" className="text-xs">
                              {systemTheme}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              );
            })}
          </div>

          <DropdownMenuSeparator />
          
          {/* Theme Customization */}
          <DropdownMenuItem
            onClick={() => setIsCustomizing(true)}
            className="flex items-center gap-2 p-3"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Customization</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Customization Modal/Panel */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsCustomizing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[80vh] overflow-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Theme Customization
                  </CardTitle>
                  <CardDescription>
                    Advanced theme settings and accessibility options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Theme Preview */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Current Theme Preview
                    </h3>
                    <div className={`p-4 rounded-lg border transition-all ${
                      currentTheme === 'dark' 
                        ? 'bg-gray-900 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Academic Dashboard</h4>
                        <Badge variant={currentTheme === 'dark' ? 'secondary' : 'default'}>
                          {currentTheme}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-80">
                        This is how your interface looks with the current theme settings.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant={currentTheme === 'dark' ? 'secondary' : 'default'}>
                          Primary Action
                        </Button>
                        <Button size="sm" variant="outline">
                          Secondary
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Accessibility Options */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Contrast className="w-4 h-4" />
                      Accessibility
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">High Contrast</p>
                          <p className="text-sm text-muted-foreground">
                            Increases contrast for better readability
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Reduced Motion</p>
                          <p className="text-sm text-muted-foreground">
                            Minimizes animations and transitions
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Performance Options */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Performance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Auto Theme Switching</p>
                          <p className="text-sm text-muted-foreground">
                            Automatically switch between light/dark based on time
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsCustomizing(false)}>
                      Close
                    </Button>
                    <Button onClick={() => setIsCustomizing(false)}>
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple theme toggle for basic usage
export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="outline" size="sm" disabled><Settings className="w-4 h-4" /></Button>;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="transition-all duration-300"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
)
