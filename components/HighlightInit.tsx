"use client"

// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { initHighlight } from '@/lib/highlight'

export function HighlightInit() {
  const [initializationAttempted, setInitializationAttempted] = useState(false)
  
  useEffect(() => {
    // Skip initialization if disabled via environment variable
    const isHighlightDisabled = process.env.NEXT_PUBLIC_DISABLE_HIGHLIGHT === 'true'
    
    // Only initialize in browser environment and if not already attempted
    if (typeof window !== 'undefined' && !initializationAttempted && !isHighlightDisabled) {
      setInitializationAttempted(true)
      
      try {
        initHighlight()
        console.log('Highlight.io initialized successfully')
      } catch (error) {
        console.warn('Failed to initialize Highlight.io:', error)
        
        // If initialization fails due to session data corruption
        if (error instanceof Error && (
          error.message.includes('sessionData_') || 
          error.message.includes('not session data')
        )) {
          console.log('Detected corrupted session data, attempting cleanup...')
          
          // Clear all highlight-related data from storage
          try {
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (
                key.includes('highlight') || 
                key.includes('sessionData_') || 
                key.includes('highlightSession')
              )) {
                keysToRemove.push(key)
              }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key))
            console.log(`Cleared ${keysToRemove.length} corrupted session keys`)
            
          } catch (storageError) {
            console.warn('Failed to clear storage:', storageError)
          }
        }
      }
    } else if (isHighlightDisabled) {
      console.log('Highlight.io initialization disabled via environment variable')
    }
  }, [initializationAttempted])

  // This component doesn't render anything visible
  return null
}

// Performance and Error Handling Enhanced
export default React.memo(HighlightInit);
