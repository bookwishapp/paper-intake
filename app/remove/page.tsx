'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, X, Package, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { BarcodeListener } from '@/components/BarcodeListener'
import Link from 'next/link'

interface RemovalQueueItem {
  id: string
  name: string
  price: number | null
  barcode: string
}

export default function RemovePage() {
  const [queue, setQueue] = useState<RemovalQueueItem[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleScan = async (barcode: string) => {
    // Check if already in queue
    if (queue.some(item => item.barcode === barcode)) {
      setError('Item already in removal queue')
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const response = await fetch('/api/square/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Item not found')
      }

      const item = await response.json()

      // Add to queue
      setQueue(prev => [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        barcode: item.barcode
      }])
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to find item')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      // For now, we'll search by treating the search term as a barcode
      // In the future, you could add text search functionality
      const response = await fetch('/api/square/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode: searchTerm }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Item not found')
      }

      const item = await response.json()

      // Check if already in queue
      if (!queue.some(qItem => qItem.id === item.id)) {
        setQueue(prev => [...prev, {
          id: item.id,
          name: item.name,
          price: item.price,
          barcode: item.barcode
        }])
        setSearchTerm('')
      } else {
        setError('Item already in removal queue')
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to find item')
    } finally {
      setIsSearching(false)
    }
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  const clearQueue = () => {
    setQueue([])
    setShowConfirm(false)
  }

  const handleBatchDelete = async () => {
    if (queue.length === 0) return

    setIsDeleting(true)
    setError(null)
    setShowConfirm(false)

    try {
      const itemIds = queue.map(item => item.id)

      const response = await fetch('/api/square/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete items')
      }

      const result = await response.json()

      setSuccess(`Successfully removed ${result.deletedCount} items from Square`)
      setQueue([]) // Clear the queue after successful deletion
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message || 'Failed to delete items')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Remove Items</h1>
                <p className="text-sm text-muted-foreground">Scan items to remove from Square inventory</p>
              </div>
            </div>
            {queue.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-full">
                <Trash2 className="w-4 h-4 text-destructive" />
                <span className="font-medium text-destructive">{queue.length} items queued</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Scanner Section */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Scan Items</h2>
            <BarcodeListener
              onScan={handleScan}
              disabled={isScanning || isDeleting}
            />
            {isScanning && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching for item...</span>
              </div>
            )}
          </section>

          {/* Manual Search */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Manual Search</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter barcode or SKU"
                className="flex-1 px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
                disabled={isSearching || isDeleting}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || isDeleting || !searchTerm.trim()}
                className="btn-secondary"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </section>

          {/* Messages */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-destructive">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-500">{success}</span>
              </div>
            </div>
          )}

          {/* Removal Queue */}
          {queue.length > 0 && (
            <section className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Removal Queue</h2>
                <button
                  onClick={clearQueue}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear Queue
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.price ? `$${(item.price / 100).toFixed(2)}` : 'No price'} • {item.barcode}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="Remove from queue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isDeleting}
                  className="flex-1 btn-destructive flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing Items...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove All from Square
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Empty State */}
          {queue.length === 0 && !error && !success && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No items in removal queue</p>
              <p className="text-sm text-muted-foreground">
                Scan barcodes or search for items to remove them from Square inventory
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowConfirm(false)} />
          <div className="relative z-50 w-full max-w-md bg-card rounded-lg border shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Confirm Removal</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to remove {queue.length} item{queue.length !== 1 ? 's' : ''} from Square inventory?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex-1 btn-destructive"
              >
                Remove Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}