// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";


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

// Performance and Error Handling Enhanced
export default React.memo(HighlightInit
)
