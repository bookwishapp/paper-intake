'use client'

import React, { useState } from 'react'
import { Trash2, AlertTriangle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ deleted: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmText === 'DELETE'

  const handleDeleteAll = async () => {
    if (!canDelete) return

    setIsDeleting(true)
    setDeleteResult(null)
    setError(null)

    try {
      const response = await fetch('/api/square/push', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete catalog items')
      }

      const result = await response.json()
      setDeleteResult(result)
      setConfirmText('') // Reset confirmation
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete catalog items')
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
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Warning Section */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-yellow-500">Warning</h2>
                <p className="text-sm">
                  This is an administrative panel for managing the Square catalog.
                  Actions performed here are permanent and cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Clear Catalog Section */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Clear Square Catalog</h2>

            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium mb-2">
                  ⚠️ DANGER ZONE
                </p>
                <p className="text-sm">
                  This action will permanently delete ALL items from your Square catalog.
                  This cannot be undone. Only use this if you need to completely reset
                  your inventory.
                </p>
              </div>

              {/* Confirmation Input */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium mb-2">
                  Type <span className="font-mono bg-destructive/20 px-2 py-1 rounded">DELETE</span> to confirm
                </label>
                <input
                  id="confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to enable the button"
                  className="w-full px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-destructive"
                  disabled={isDeleting}
                />
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDeleteAll}
                disabled={!canDelete || isDeleting}
                className={`
                  w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                  ${canDelete && !isDeleting
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deleting Catalog Items...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete All Square Catalog Items
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Result Messages */}
          {deleteResult && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  Successfully deleted {deleteResult.deleted} catalog items
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-destructive">{error}</span>
              </div>
            </div>
          )}

          {/* Additional Admin Features */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-mono">
                  {process.env.NODE_ENV || 'development'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Square API</span>
                <span className={`font-medium ${process.env.SQUARE_ACCESS_TOKEN ? 'text-green-500' : 'text-yellow-500'}`}>
                  {process.env.SQUARE_ACCESS_TOKEN ? 'Configured' : 'Mock Mode'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">ISBNdb API</span>
                <span className={`font-medium ${process.env.ISBNDB_API_KEY ? 'text-green-500' : 'text-yellow-500'}`}>
                  {process.env.ISBNDB_API_KEY ? 'Configured' : 'Mock Mode'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">UPCitemDB API</span>
                <span className="font-medium text-green-500">
                  Free Tier Active
                </span>
              </div>
            </div>
          </section>

          {/* Test Endpoints */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const response = await fetch('/api/print/label')
                  const result = await response.json()
                  console.log('Test label:', result)
                  alert('Test label generated. Check console for details.')
                }}
                className="btn-outline w-full"
              >
                Generate Test Label
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}