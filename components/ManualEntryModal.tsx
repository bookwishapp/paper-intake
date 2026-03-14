'use client'

import React, { useState } from 'react'
import { X, Plus, Package } from 'lucide-react'
import { ConditionToggle } from './ConditionToggle'
import { QueueItem, LookupResult, Category } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onAddToQueue: (item: QueueItem) => void
}

const CATEGORIES: Category[] = [
  'books',
  'clothing',
  'electronics',
  'home',
  'toys',
  'sporting',
  'media',
  'crafts',
  'jewelry',
  'accessories',
  'other'
]

export function ManualEntryModal({ isOpen, onClose, onAddToQueue }: ManualEntryModalProps) {
  const [title, setTitle] = useState('')
  const [priceCents, setPriceCents] = useState<number | null>(null)
  const [condition, setCondition] = useState<'new' | 'used'>('used')
  const [category, setCategory] = useState<Category>('other')
  const [error, setError] = useState<string | null>(null)

  const generateSKU = () => {
    // Generate SKU: PST-{YYYYMMDD}-{RANDOM}
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `PST-${dateStr}-${random}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!priceCents || priceCents <= 0) {
      setError('Price must be greater than $0.00')
      return
    }

    // Create a manual lookup result
    const sku = generateSKU()
    const lookupResult: LookupResult = {
      barcode: sku,
      type: 'manual',
      title: title.trim(),
      retailPriceCents: priceCents
    }

    // Create queue item
    const queueItem: QueueItem = {
      id: uuidv4(),
      lookup: lookupResult,
      condition,
      priceCents,
      category,
      addedAt: new Date().toISOString()
    }

    // Add to queue
    onAddToQueue(queueItem)

    // Reset form and close
    setTitle('')
    setPriceCents(null)
    setCondition('used')
    setCategory('other')
    onClose()
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Allow empty string for clearing the field
    if (value === '') {
      setPriceCents(null)
      return
    }

    // Parse as float and convert to cents
    const dollars = parseFloat(value)
    if (!isNaN(dollars) && dollars >= 0) {
      setPriceCents(Math.round(dollars * 100))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg bg-card rounded-lg border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Manual Item Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Item Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Vintage Leather Jacket"
              className="w-full px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-2">
              Price <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                id="price"
                type="number"
                value={priceCents ? priceCents / 100 : ''}
                onChange={handlePriceChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Condition
            </label>
            <ConditionToggle
              value={condition}
              onChange={setCondition}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary capitalize"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-secondary/50 border border-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              A unique SKU will be automatically generated for this item (PST-YYYYMMDD-XXXXX)
              which can be used for tracking and label printing.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}