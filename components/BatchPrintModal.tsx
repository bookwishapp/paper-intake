'use client'

import React, { useState, useEffect } from 'react'
import { X, Printer, AlertCircle, CheckCircle, Loader2, ExternalLink, Package } from 'lucide-react'
import { QueueItem } from '@/types'
import { QZTrayService } from '@/lib/qz-tray'
import { ZPLGenerator } from '@/lib/zpl'

interface BatchPrintModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (printed: boolean) => void
  items: QueueItem[]
}

export function BatchPrintModal({ isOpen, onClose, onComplete, items }: BatchPrintModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [printProgress, setPrintProgress] = useState(0)
  const [currentItem, setCurrentItem] = useState<string | null>(null)

  // Check QZ Tray connection on mount
  useEffect(() => {
    if (isOpen) {
      checkConnection()
    }
  }, [isOpen])

  const checkConnection = async () => {
    const qz = QZTrayService.getInstance()

    if (!qz.isAvailable()) {
      setError('QZ Tray is not loaded. Please wait a moment and try again.')
      return
    }

    if (qz.isConnected()) {
      setIsConnected(true)
      await loadPrinters()
    } else {
      // Try to connect automatically
      await connectToQZ()
    }
  }

  const connectToQZ = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const qz = QZTrayService.getInstance()
      await qz.connect()
      setIsConnected(true)
      await loadPrinters()
    } catch (err: any) {
      console.error('QZ Tray connection error:', err)
      setIsConnected(false)
      if (err.message?.includes('not running')) {
        setError('QZ Tray is not running. Please start QZ Tray on this computer.')
      } else {
        setError('Failed to connect to QZ Tray. Please ensure it is running.')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const loadPrinters = async () => {
    try {
      const qz = QZTrayService.getInstance()
      const allPrinters = await qz.getAllPrinters()
      const zebraPrinters = await qz.findZebraPrinters()
      const defaultPrinter = await qz.getDefaultPrinter()

      setPrinters(allPrinters)

      // Auto-select: prefer Zebra printer, then default, then first available
      if (zebraPrinters.length > 0) {
        setSelectedPrinter(zebraPrinters[0])
      } else if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter)
      } else if (allPrinters.length > 0) {
        setSelectedPrinter(allPrinters[0])
      }
    } catch (err) {
      console.error('Error loading printers:', err)
    }
  }

  const handlePrintAll = async () => {
    if (!selectedPrinter || items.length === 0) return

    setIsPrinting(true)
    setError(null)
    setPrintProgress(0)

    try {
      const qz = QZTrayService.getInstance()

      // Print each label
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        setCurrentItem(item.lookup.title)
        setPrintProgress(((i + 1) / items.length) * 100)

        // Generate ZPL
        const zplData = ZPLGenerator.generateLabel({
          title: item.lookup.title,
          priceCents: item.priceCents,
          condition: item.condition,
          barcode: item.lookup.barcode,
          storeName: 'Paper Street Thrift'
        })

        // Send to printer
        await qz.printZPL(zplData, selectedPrinter)

        // Small delay between labels to prevent printer buffer overflow
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Success - all labels printed
      setPrintProgress(100)
      setCurrentItem(null)
      setTimeout(() => {
        onComplete(true)
      }, 1500)
    } catch (err: any) {
      console.error('Print error:', err)
      setError(err.message || 'Failed to print labels')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleSkip = () => {
    onComplete(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={!isPrinting ? onClose : undefined} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg bg-card rounded-lg border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Print Labels</h2>
          <button
            onClick={onClose}
            disabled={isPrinting}
            className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Message */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">
                  Print labels for {items.length} item{items.length !== 1 ? 's' : ''}?
                </p>
                <p className="text-sm text-muted-foreground">
                  Labels will be printed before pushing items to Square. You can also skip this step if you've already printed labels individually.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {!isConnected && !isConnecting && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm">
                    {error || 'QZ Tray is not connected'}
                  </p>
                  {error?.includes('not running') && (
                    <div className="space-y-2">
                      <a
                        href="https://qz.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Download QZ Tray
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={connectToQZ}
                        className="block text-sm text-primary hover:underline"
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connecting */}
          {isConnecting && (
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Connecting to QZ Tray...</span>
            </div>
          )}

          {/* Printer Selection */}
          {isConnected && printers.length > 0 && !isPrinting && (
            <div>
              <label htmlFor="printer" className="block text-sm font-medium mb-2">
                Select Printer
              </label>
              <select
                id="printer"
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="w-full px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
                disabled={isPrinting}
              >
                {printers.map((printer) => (
                  <option key={printer} value={printer}>
                    {printer}
                    {printer.toLowerCase().includes('zebra') && ' (Recommended)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Printing Progress */}
          {isPrinting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Printing labels...</span>
                <span>{Math.round(printProgress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${printProgress}%` }}
                />
              </div>
              {currentItem && (
                <p className="text-sm text-muted-foreground">
                  Printing: {currentItem}
                </p>
              )}
            </div>
          )}

          {/* Success Message */}
          {printProgress === 100 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-500">
                  All labels printed successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && isConnected && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <button
            onClick={handleSkip}
            className="btn-secondary"
            disabled={isPrinting}
          >
            Skip Printing
          </button>
          <button
            onClick={handlePrintAll}
            disabled={!isConnected || !selectedPrinter || isPrinting || printProgress === 100}
            className="btn-primary flex items-center gap-2"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Print All Labels
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}