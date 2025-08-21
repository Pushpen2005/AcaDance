"use client"

import { useEffect } from 'react'
import { initHighlight } from '@/lib/highlight'

export function HighlightInit() {
  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      try {
        initHighlight()
        console.log('Highlight.io initialized successfully')
      } catch (error) {
        console.warn('Failed to initialize Highlight.io:', error)
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

export default HighlightInit
