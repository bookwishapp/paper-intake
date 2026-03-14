'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, AlertTriangle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface ConfigStatus {
  environment: string
  square: {
    configured: boolean
    hasToken: boolean
    hasLocation: boolean
  }
  isbndb: {
    configured: boolean
  }
  upcitemdb: {
    configured: boolean
  }
}

export default function AdminPage() {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ deleted: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)

  const canDelete = confirmText === 'DELETE'

  // Fetch configuration status on mount
  useEffect(() => {
    fetch('/api/config/status')
      .then(res => res.json())
      .then(data => setConfigStatus(data))
      .catch(err => console.error('Failed to fetch config status:', err))
  }, [])

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
            {configStatus ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="font-mono">
                    {configStatus.environment}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Square API</span>
                  <span className={`font-medium ${configStatus.square.configured ? 'text-green-500' : 'text-red-500'}`}>
                    {configStatus.square.configured ? 'Configured' :
                     (!configStatus.square.hasToken ? 'Missing Token' : 'Missing Location ID')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">ISBNdb API</span>
                  <span className={`font-medium ${configStatus.isbndb.configured ? 'text-green-500' : 'text-red-500'}`}>
                    {configStatus.isbndb.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">UPCitemDB API</span>
                  <span className="font-medium text-green-500">
                    Free Tier Active
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading configuration...</span>
              </div>
            )}
          </section>

          {/* Test Endpoints */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/print/label')
                    if (!response.ok) {
                      throw new Error('Failed to generate test label')
                    }
                    const result = await response.json()

                    // Download the ZPL file
                    const blob = new Blob([result.labelData], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `test-label.${result.printerType === 'dymo' ? 'xml' : 'zpl'}`
                    a.click()
                    URL.revokeObjectURL(url)

                    // Show success message
                    alert(`Test label downloaded as test-label.${result.printerType === 'dymo' ? 'xml' : 'zpl'}`)
                  } catch (error) {
                    console.error('Error generating test label:', error)
                    alert('Failed to generate test label. Check console for details.')
                  }
                }}
                className="btn-outline w-full"
              >
                Generate Test Label (ZPL)
              </button>
              <button
                onClick={async () => {
                  try {
                    // Show the test label content in a modal or text area
                    const response = await fetch('/api/print/label')
                    if (!response.ok) {
                      throw new Error('Failed to generate test label')
                    }
                    const result = await response.json()

                    // Create a simple modal to show the label content
                    const modal = document.createElement('div')
                    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#171717;border:1px solid #262626;padding:20px;z-index:1000;max-width:600px;width:90%;max-height:80vh;overflow:auto;border-radius:8px'
                    modal.innerHTML = `
                      <h3 style="margin-bottom:10px;color:#fafafa">Test Label Preview (ZPL)</h3>
                      <pre style="background:#0a0a0a;padding:10px;border-radius:4px;overflow-x:auto;color:#a3a3a3;font-size:12px">${result.labelData}</pre>
                      <div style="margin-top:10px;color:#a3a3a3;font-size:12px">
                        <p>Label Type: ${result.printerType?.toUpperCase() || 'ZPL'}</p>
                        <p>Size: 2.25" x 1.25"</p>
                      </div>
                      <button onclick="this.parentElement.remove();document.getElementById('modal-backdrop').remove()" style="margin-top:15px;padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer">Close</button>
                    `

                    const backdrop = document.createElement('div')
                    backdrop.id = 'modal-backdrop'
                    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999'
                    backdrop.onclick = () => {
                      modal.remove()
                      backdrop.remove()
                    }

                    document.body.appendChild(backdrop)
                    document.body.appendChild(modal)
                  } catch (error) {
                    console.error('Error generating test label:', error)
                    alert('Failed to generate test label')
                  }
                }}
                className="btn-outline w-full"
              >
                View Test Label Content
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}