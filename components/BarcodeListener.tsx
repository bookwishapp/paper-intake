'use client'

import React, { useEffect, useRef, useState } from 'react'

interface BarcodeListenerProps {
  onScan: (barcode: string) => void
  disabled?: boolean
}

export function BarcodeListener({ onScan, disabled = false }: BarcodeListenerProps) {
  const [buffer, setBuffer] = useState('')
  const [lastScan, setLastScan] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastScanTimeRef = useRef<number>(0)

  useEffect(() => {
    if (disabled) return

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if an input is focused (except our hidden input)
      const activeElement = document.activeElement as HTMLElement
      if (activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.tagName === 'SELECT') {
        if (activeElement.id !== 'barcode-capture') {
          return
        }
      }

      // Clear timeout on each keypress
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Handle Enter key
      if (event.key === 'Enter') {
        if (buffer.length > 0) {
          // Debounce to prevent duplicate scans (100ms)
          const now = Date.now()
          if (now - lastScanTimeRef.current > 100) {
            lastScanTimeRef.current = now
            const scannedCode = buffer
            setLastScan(scannedCode)
            onScan(scannedCode)
          }
          setBuffer('')
        }
        return
      }

      // Build buffer with printable characters
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        setBuffer(prev => prev + event.key)

        // Clear buffer after 500ms of inactivity
        timeoutRef.current = setTimeout(() => {
          setBuffer('')
        }, 500)
      }
    }

    window.addEventListener('keypress', handleKeyPress)

    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [buffer, onScan, disabled])

  // Hidden input to maintain focus
  useEffect(() => {
    const input = document.getElementById('barcode-capture') as HTMLInputElement
    if (input && !disabled) {
      const focusInput = () => {
        if (document.activeElement?.tagName !== 'INPUT' ||
            document.activeElement?.id === 'barcode-capture') {
          input.focus()
        }
      }

      // Initial focus
      focusInput()

      // Refocus on click anywhere (except other inputs)
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' &&
            target.tagName !== 'TEXTAREA' &&
            target.tagName !== 'SELECT') {
          setTimeout(focusInput, 10)
        }
      }

      document.addEventListener('click', handleClick)

      return () => {
        document.removeEventListener('click', handleClick)
      }
    }
  }, [disabled])

  return (
    <div className="relative">
      {/* Hidden input to capture barcode scanner input */}
      <input
        id="barcode-capture"
        type="text"
        className="absolute -left-full opacity-0 pointer-events-none"
        tabIndex={disabled ? -1 : 0}
        aria-hidden="true"
        readOnly
      />

      {/* Scanner status display */}
      <div className="bg-card border rounded-lg p-6 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <div className={`w-2 h-2 rounded-full ${disabled ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-sm font-medium">
              {disabled ? 'Scanner Disabled' : 'Scanner Ready'}
            </span>
          </div>
        </div>

        {lastScan && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Scanned:</p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {lastScan}
            </p>
          </div>
        )}

        {!lastScan && (
          <p className="text-muted-foreground">
            Scan a barcode to get started
          </p>
        )}

        {buffer && (
          <div className="mt-4 p-2 bg-secondary/50 rounded">
            <p className="text-xs text-muted-foreground">Buffer: {buffer}</p>
          </div>
        )}
      </div>
    </div>
  )
}