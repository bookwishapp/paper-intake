'use client'

import React, { useState, useEffect } from 'react'
import { Package, Upload, Settings, Loader2, CheckCircle, XCircle, Plus } from 'lucide-react'
import { BarcodeListener } from '@/components/BarcodeListener'
import { ReviewModal } from '@/components/ReviewModal'
import { ManualEntryModal } from '@/components/ManualEntryModal'
import { QueueList } from '@/components/QueueList'
import { LabelPreviewModal } from '@/components/LabelPreviewModal'
import { QueueManager } from '@/lib/queue'
import { LookupResult, QueueItem, BatchPushResult } from '@/types'
import Link from 'next/link'

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isLabelPreviewOpen, setIsLabelPreviewOpen] = useState(false)
  const [currentLookup, setCurrentLookup] = useState<LookupResult | null>(null)
  const [itemToPrint, setItemToPrint] = useState<QueueItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [pushResult, setPushResult] = useState<BatchPushResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load queue from localStorage on mount
  useEffect(() => {
    const storedQueue = QueueManager.getQueue()
    setQueue(storedQueue)
  }, [])

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    setIsLoading(true)
    setLoadingMessage('Looking up item...')
    setError(null)

    try {
      // Determine if it's an ISBN or UPC
      const isISBN = barcode.startsWith('978') || barcode.startsWith('979')
      const endpoint = isISBN ? '/api/lookup/isbn' : '/api/lookup/upc'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to lookup item')
      }

      const lookupResult = await response.json() as LookupResult
      setCurrentLookup(lookupResult)
      setIsReviewModalOpen(true)
    } catch (err: any) {
      console.error('Lookup error:', err)
      setError(err.message || 'Failed to lookup item. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  // Add item to queue
  const handleAddToQueue = (item: QueueItem) => {
    const newQueue = [...queue, item]
    setQueue(newQueue)
    QueueManager.saveQueue(newQueue)
  }

  // Remove item from queue
  const handleRemoveFromQueue = (id: string) => {
    const newQueue = queue.filter(item => item.id !== id)
    setQueue(newQueue)
    QueueManager.saveQueue(newQueue)
  }

  // Print label - opens preview modal
  const handlePrintLabel = (item: QueueItem) => {
    setItemToPrint(item)
    setIsLabelPreviewOpen(true)
  }

  // Push queue to Square
  const handlePushToSquare = async () => {
    if (queue.length === 0) return

    setIsLoading(true)
    setLoadingMessage(`Pushing ${queue.length} items to Square...`)
    setPushResult(null)
    setError(null)

    try {
      const response = await fetch('/api/square/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: queue }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to push items to Square')
      }

      const result = await response.json() as BatchPushResult

      setPushResult(result)

      // Clear queue if all successful
      if (result.failed === 0) {
        setQueue([])
        QueueManager.clearQueue()
      } else {
        // Remove successful items from queue
        const failedIds = result.errors.map(e => e.item.id)
        const newQueue = queue.filter(item => failedIds.includes(item.id))
        setQueue(newQueue)
        QueueManager.saveQueue(newQueue)
      }
    } catch (err: any) {
      console.error('Push error:', err)
      setError(err.message || 'Failed to push items to Square')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  const stats = QueueManager.getStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Paper Street Thrift</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Queue Count Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">{queue.length} items</span>
              </div>
              {/* Admin Link */}
              <Link
                href="/admin"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Scanner Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Item Entry</h2>
              <button
                onClick={() => setIsManualEntryOpen(true)}
                disabled={isLoading}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Manual Entry
              </button>
            </div>
            <BarcodeListener
              onScan={handleScan}
              disabled={isLoading || isReviewModalOpen || isManualEntryOpen}
            />
          </section>

          {/* Loading/Error Messages */}
          {isLoading && (
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>{loadingMessage}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-destructive">{error}</span>
              </div>
            </div>
          )}

          {/* Push Result */}
          {pushResult && (
            <div className={`border rounded-lg p-4 ${pushResult.failed === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  Push Complete: {pushResult.success} successful, {pushResult.failed} failed
                </span>
              </div>
              {pushResult.errors.length > 0 && (
                <div className="mt-3 space-y-1 text-sm">
                  {pushResult.errors.map((err, idx) => (
                    <div key={idx} className="text-destructive">
                      • {err.item.lookup.title}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Queue Actions */}
          {queue.length > 0 && (
            <div className="flex items-center justify-between bg-card border rounded-lg p-4">
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="font-medium">{stats.count}</span> items
                </span>
                <span>
                  Total: <span className="font-medium">${(stats.totalValue / 100).toFixed(2)}</span>
                </span>
                <span>
                  Used: <span className="font-medium">{stats.usedCount}</span>
                </span>
                <span>
                  New: <span className="font-medium">{stats.newCount}</span>
                </span>
              </div>
              <button
                onClick={handlePushToSquare}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Push to Square
              </button>
            </div>
          )}

          {/* Queue List */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Session Queue</h2>
            <QueueList
              items={queue}
              onRemove={handleRemoveFromQueue}
              onPrint={handlePrintLabel}
            />
          </section>
        </div>
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setCurrentLookup(null)
        }}
        lookupResult={currentLookup}
        onAddToQueue={handleAddToQueue}
        onPrint={handlePrintLabel}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onAddToQueue={handleAddToQueue}
      />

      {/* Label Preview Modal */}
      <LabelPreviewModal
        isOpen={isLabelPreviewOpen}
        onClose={() => {
          setIsLabelPreviewOpen(false)
          setItemToPrint(null)
        }}
        item={itemToPrint}
      />
    </div>
  )
}