'use client'

import React, { useState, useEffect } from 'react'
import { X, Printer, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { QueueItem } from '@/types'
import { QZTrayService } from '@/lib/qz-tray'
import { ZPLGenerator } from '@/lib/zpl'
import { BarcodeDisplay } from './BarcodeDisplay'

interface LabelPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: QueueItem | null
}

export function LabelPreviewModal({ isOpen, onClose, item }: LabelPreviewModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')

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

  const handlePrint = async () => {
    if (!item || !selectedPrinter) return

    setIsPrinting(true)
    setError(null)
    setSuccess(false)

    try {
      const qz = QZTrayService.getInstance()

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

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      console.error('Print error:', err)
      setError(err.message || 'Failed to print label')
    } finally {
      setIsPrinting(false)
    }
  }

  if (!isOpen || !item) return null

  const labelData = {
    title: item.lookup.title.length > 40
      ? item.lookup.title.substring(0, 37) + '...'
      : item.lookup.title,
    price: `$${(item.priceCents / 100).toFixed(2)}`,
    condition: item.condition.toUpperCase(),
    barcode: item.lookup.barcode
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg bg-card rounded-lg border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Print Label</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Label Preview */}
          <div className="bg-white text-black p-6 rounded-lg border-2 border-gray-300">
            <div className="text-center space-y-2">
              <p className="text-sm font-bold">Paper Street Thrift</p>
              <p className="text-xs">{labelData.title}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">{labelData.price}</span>
                <span className="text-sm font-medium px-2 py-1 bg-gray-200 rounded">
                  {labelData.condition}
                </span>
              </div>
              <div className="pt-3">
                {/* Barcode visualization */}
                <BarcodeDisplay
                  barcode={labelData.barcode}
                  height={35}
                  width={180}
                />
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
          {isConnected && printers.length > 0 && (
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

          {/* No Printers */}
          {isConnected && printers.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm">No printers found. Please check your printer connections.</p>
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

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-500">Label sent to printer successfully!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isPrinting}
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={!isConnected || !selectedPrinter || isPrinting}
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
                Send to Printer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}