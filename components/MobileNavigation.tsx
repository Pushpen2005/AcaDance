import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Home, Calendar, Users, FileText, Settings, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/components/ui/use-mobile";

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
  className?: string;
}

export function MobileNavigation({ 
  activeTab, 
  onTabChange, 
  tabs, 
  className = "" 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {/* Mobile Bottom Navigation */}
      <div className="nav-mobile flex border-t border-border bg-background/95 backdrop-blur-sm">
        {tabs.slice(0, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`nav-mobile-item ${isActive ? 'active' : ''} group relative`}
            >
              <Icon className={`w-5 h-5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              }`} />
              <span className={`text-xs mt-1 transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
        
        {/* More menu for additional tabs */}
        {tabs.length > 4 && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="nav-mobile-item group">
                <Menu className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs mt-1 text-muted-foreground">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh] rounded-t-xl">
              <SheetHeader className="text-left">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                      {isActive && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function MobileHeader({ 
  title, 
  subtitle, 
  actions,
  showBackButton = false,
  onBackClick
}: MobileHeaderProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: "default" | "pills" | "underline";
}

export function MobileTabs({ 
  tabs, 
  activeTab, 
  onTabChange,
  variant = "default"
}: MobileTabsProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const baseClasses = "flex-1 px-3 py-2 text-sm font-medium transition-all text-center";
  
  const variantClasses = {
    default: "border-b-2 border-transparent",
    pills: "rounded-full mx-1",
    underline: "border-b border-transparent"
  };

  const activeClasses = {
    default: "border-primary text-primary",
    pills: "bg-primary text-primary-foreground",
    underline: "border-primary text-primary"
  };

  const inactiveClasses = {
    default: "text-muted-foreground hover:text-foreground hover:border-border",
    pills: "text-muted-foreground hover:bg-muted hover:text-foreground",
    underline: "text-muted-foreground hover:text-foreground"
  };

  return (
    <div className="flex bg-background border-b border-border overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${baseClasses} ${variantClasses[variant]} ${
              isActive ? activeClasses[variant] : inactiveClasses[variant]
            } whitespace-nowrap`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className="ml-2 text-xs"
              >
                {tab.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function MobileCard({ 
  children, 
  className = "",
  padding = "default",
  hover = true
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "default" | "lg";
  hover?: boolean;
}) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6"
  };

  return (
    <div className={`
      bg-card rounded-lg border border-border shadow-sm
      ${paddingClasses[padding]}
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
