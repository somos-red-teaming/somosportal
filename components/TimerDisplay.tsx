'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { Badge } from './ui/badge'

interface TimerDisplayProps {
  participantId: string
  initialTimeRemaining: number // in seconds
  isExpired?: boolean // Add this
  onExpire: () => void
  onUpdate: (elapsedSeconds: number) => Promise<void>
}

export function TimerDisplay({ participantId, initialTimeRemaining, isExpired, onExpire, onUpdate }: TimerDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining)
  const [showWarning, setShowWarning] = useState(false)
  const hasExpiredRef = useRef(isExpired || false)
  const lastUpdateRef = useRef(Date.now())
  
  // Update ref when parent says it's expired
  useEffect(() => {
    if (isExpired) {
      hasExpiredRef.current = true
    }
  }, [isExpired])

  useEffect(() => {
    // Don't start countdown if already expired
    if (timeRemaining <= 0) {
      hasExpiredRef.current = true
      // Only call onExpire if not already expired from parent
      if (!isExpired) {
        setTimeout(() => onExpire(), 0)
      }
      return
    }

    // Countdown every second
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1)
        
        // Show warnings
        if (newTime === 300) { // 5 minutes
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 5000)
        }
        if (newTime === 60) { // 1 minute
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 5000)
        }
        
        // Expire
        if (newTime === 0) {
          hasExpiredRef.current = true  // Set BEFORE calling onExpire
          clearInterval(interval)
          setTimeout(() => onExpire(), 0)
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onExpire])

  // Sync with server every 30 seconds
  useEffect(() => {
    // Don't start if already expired
    if (hasExpiredRef.current) return
    
    const syncInterval = setInterval(async () => {
      // Check if expired - stop immediately
      if (hasExpiredRef.current) {
        clearInterval(syncInterval)
        return
      }
      
      const now = Date.now()
      const elapsed = Math.floor((now - lastUpdateRef.current) / 1000)
      
      if (elapsed > 0) {
        try {
          await onUpdate(elapsed)
          lastUpdateRef.current = now
        } catch (error) {
          console.error('Failed to sync timer:', error)
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(syncInterval)
  }, [onUpdate])

  // Sync on unmount (user leaving page)
  useEffect(() => {
    return () => {
      // Only sync if not expired
      if (hasExpiredRef.current) return
      
      const elapsed = Math.floor((Date.now() - lastUpdateRef.current) / 1000)
      if (elapsed > 0) {
        // Fire and forget - don't wait for response
        onUpdate(elapsed).catch(console.error)
      }
    }
  }, [onUpdate])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getVariant = (): 'default' | 'destructive' | 'secondary' => {
    if (timeRemaining === 0) return 'destructive'
    if (timeRemaining <= 60) return 'destructive'
    if (timeRemaining <= 300) return 'secondary'
    return 'default'
  }

  const shouldPulse = timeRemaining <= 60 && timeRemaining > 0

  if (timeRemaining === 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Time Expired
      </Badge>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge 
        variant={getVariant()} 
        className={`flex items-center gap-1 ${shouldPulse ? 'animate-pulse' : ''}`}
      >
        <Clock className="h-3 w-3" />
        {formatTime(timeRemaining)}
      </Badge>
      {showWarning && timeRemaining <= 300 && (
        <span className="text-xs text-orange-600 font-medium animate-pulse">
          {timeRemaining <= 60 ? '1 minute left!' : '5 minutes left!'}
        </span>
      )}
    </div>
  )
}
