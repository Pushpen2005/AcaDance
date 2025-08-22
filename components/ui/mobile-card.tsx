import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "./use-mobile"

interface MobileCardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "elevated" | "outline"
  padding?: "sm" | "md" | "lg"
  hover?: boolean
}

export function MobileCard({ 
  className,
  variant = "default",
  padding = "md",
  hover = true,
  children,
  ...props 
}: MobileCardProps) {
  const isMobile = useIsMobile()
  
  const variantClasses = {
    default: "bg-card border border-border",
    elevated: "bg-card shadow-lg border-0",
    outline: "border-2 border-border bg-transparent"
  }

  const paddingClasses = {
    sm: isMobile ? "p-3" : "p-4",
    md: isMobile ? "p-4" : "p-6", 
    lg: isMobile ? "p-5" : "p-8"
  }

  const hoverClasses = hover ? "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" : ""

  return (
    <div
      className={cn(
        "rounded-xl text-card-foreground",
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        isMobile && "active:scale-[0.98]", // Touch feedback for mobile
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MobileCardHeaderProps extends React.ComponentProps<"div"> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function MobileCardHeader({ 
  className,
  title,
  subtitle,
  icon,
  action,
  ...props 
}: MobileCardHeaderProps) {
  const isMobile = useIsMobile()
  
  return (
    <div
      className={cn(
        "flex items-start justify-between",
        isMobile ? "mb-3" : "mb-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-card-foreground truncate",
            isMobile ? "text-base" : "text-lg"
          )}>
            {title}
          </h3>
          {subtitle && (
            <p className={cn(
              "text-muted-foreground mt-1 line-clamp-2",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-3">
          {action}
        </div>
      )}
    </div>
  )
}

interface MobileGridProps extends React.ComponentProps<"div"> {
  minCardWidth?: number // in rem
  maxColumns?: number
  gap?: number
}

export function MobileGrid({ 
  className,
  minCardWidth = 16, // 16rem = 256px
  maxColumns = 4,
  gap = 4,
  children,
  ...props 
}: MobileGridProps) {
  const isMobile = useIsMobile()
  
  // On mobile, always single column
  // On tablet and up, use auto-fit with minCardWidth
  const gridClasses = isMobile 
    ? "grid grid-cols-1"
    : `grid grid-cols-[repeat(auto-fit,minmax(${minCardWidth}rem,1fr))]`

  const maxColumnsClass = `xl:grid-cols-${Math.min(maxColumns, 4)}`
  const gapClass = `gap-${gap}`

  return (
    <div
      className={cn(
        gridClasses,
        !isMobile && maxColumnsClass,
        gapClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Hook for responsive breakpoints
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop' | 'xl'>('mobile')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('mobile')
      else if (width < 1024) setBreakpoint('tablet')
      else if (width < 1280) setBreakpoint('desktop')
      else setBreakpoint('xl')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}
