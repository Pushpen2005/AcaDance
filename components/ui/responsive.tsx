import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "./use-mobile"

interface ResponsiveGridProps extends React.ComponentProps<"div"> {
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    xl?: number
  }
  gap?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export function ResponsiveGrid({ 
  className, 
  cols = { mobile: 1, tablet: 2, desktop: 3, xl: 4 },
  gap = { mobile: 3, tablet: 4, desktop: 6 },
  children,
  ...props 
}: ResponsiveGridProps) {
  const colsClasses = [
    `grid-cols-${cols.mobile || 1}`,
    `sm:grid-cols-${cols.tablet || 2}`,
    `lg:grid-cols-${cols.desktop || 3}`,
    `xl:grid-cols-${cols.xl || 4}`
  ].join(' ')

  const gapClasses = [
    `gap-${gap.mobile || 3}`,
    `sm:gap-${gap.tablet || 4}`,
    `lg:gap-${gap.desktop || 6}`
  ].join(' ')

  return (
    <div
      className={cn(
        "grid",
        colsClasses,
        gapClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResponsiveContainerProps extends React.ComponentProps<"div"> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full"
  padding?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export function ResponsiveContainer({ 
  className,
  maxWidth = "7xl",
  padding = { mobile: 3, tablet: 4, desktop: 8 },
  children,
  ...props 
}: ResponsiveContainerProps) {
  const maxWidthClass = maxWidth === "full" ? "w-full" : `max-w-${maxWidth}`
  
  const paddingClasses = [
    `px-${padding.mobile || 3}`,
    `sm:px-${padding.tablet || 4}`,
    `lg:px-${padding.desktop || 8}`
  ].join(' ')

  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidthClass,
        paddingClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResponsiveStackProps extends React.ComponentProps<"div"> {
  direction?: {
    mobile?: "row" | "col"
    tablet?: "row" | "col"
    desktop?: "row" | "col"
  }
  spacing?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
}

export function ResponsiveStack({ 
  className,
  direction = { mobile: "col", tablet: "row", desktop: "row" },
  spacing = { mobile: 2, tablet: 4, desktop: 6 },
  align = "start",
  justify = "start",
  children,
  ...props 
}: ResponsiveStackProps) {
  const directionClasses = [
    `flex-${direction.mobile || "col"}`,
    `sm:flex-${direction.tablet || "row"}`,
    `lg:flex-${direction.desktop || "row"}`
  ].join(' ')

  const spacingClasses = [
    direction.mobile === "row" ? `space-x-${spacing.mobile || 2}` : `space-y-${spacing.mobile || 2}`,
    direction.tablet === "row" ? `sm:space-x-${spacing.tablet || 4} sm:space-y-0` : `sm:space-y-${spacing.tablet || 4} sm:space-x-0`,
    direction.desktop === "row" ? `lg:space-x-${spacing.desktop || 6} lg:space-y-0` : `lg:space-y-${spacing.desktop || 6} lg:space-x-0`
  ].join(' ')

  const alignClass = `items-${align}`
  const justifyClass = `justify-${justify}`

  return (
    <div
      className={cn(
        "flex",
        directionClasses,
        spacingClasses,
        alignClass,
        justifyClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ResponsiveText({ 
  className,
  size = { mobile: "sm", tablet: "base", desktop: "lg" },
  weight = "normal",
  children,
  ...props 
}: {
  className?: string
  size?: {
    mobile?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
    tablet?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
    desktop?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
  }
  weight?: "normal" | "medium" | "semibold" | "bold"
  children: React.ReactNode
} & React.ComponentProps<"div">) {
  const sizeClasses = [
    `text-${size.mobile || "sm"}`,
    `sm:text-${size.tablet || "base"}`,
    `lg:text-${size.desktop || "lg"}`
  ].join(' ')

  const weightClass = `font-${weight}`

  return (
    <div
      className={cn(
        sizeClasses,
        weightClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
