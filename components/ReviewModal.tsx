'use client'

import React, { useState, useEffect } from 'react'
import { X, Package, DollarSign, Tag, Image as ImageIcon, Printer } from 'lucide-react'
import { LookupResult, QueueItem, Category, Condition } from '@/types'
import { ConditionToggle } from './ConditionToggle'
import { v4 as uuidv4 } from 'uuid'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  lookupResult: LookupResult | null
  onAddToQueue: (item: QueueItem) => void
  onPrint?: (item: QueueItem) => void
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'books', label: 'Books' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home', label: 'Home' },
  { value: 'toys', label: 'Toys' },
  { value: 'sporting', label: 'Sporting Goods' },
  { value: 'media', label: 'Media' },
  { value: 'crafts', label: 'Crafts' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
]

export function ReviewModal({
  isOpen,
  onClose,
  lookupResult,
  onAddToQueue,
  onPrint
}: ReviewModalProps) {
  const [title, setTitle] = useState('')
  const [condition, setCondition] = useState<Condition>('used')
  const [priceCents, setPriceCents] = useState<number | null>(null)
  const [category, setCategory] = useState<Category>('other')
  const [imageError, setImageError] = useState(false)

  // Reset form when lookup result changes
  useEffect(() => {
    if (lookupResult) {
      setTitle(lookupResult.title)
      setCondition('used') // Default to used
      setImageError(false)

      // Auto-detect category based on type
      if (lookupResult.type === 'isbn') {
        setCategory('books')
      } else {
        setCategory('other')
      }

      // Set price based on condition and retail price
      if (lookupResult.retailPriceCents) {
        // Used defaults to 50% of retail
        setPriceCents(Math.round(lookupResult.retailPriceCents * 0.5))
      } else {
        setPriceCents(null) // Will require manual entry
      }
    }
  }, [lookupResult])

  // Update price when condition changes
  const handleConditionChange = (newCondition: Condition) => {
    setCondition(newCondition)

    if (lookupResult?.retailPriceCents) {
      if (newCondition === 'new') {
        setPriceCents(lookupResult.retailPriceCents)
      } else {
        setPriceCents(Math.round(lookupResult.retailPriceCents * 0.5))
      }
    }
  }

  const handleAddToQueue = () => {
    if (!lookupResult || !title || priceCents === null) return

    const queueItem: QueueItem = {
      id: uuidv4(),
      lookup: lookupResult,
      condition,
      priceCents,
      category,
      addedAt: new Date().toISOString()
    }

    // Update the lookup result title if it was edited
    if (title !== lookupResult.title) {
      queueItem.lookup = { ...lookupResult, title }
    }

    onAddToQueue(queueItem)
    onClose()
  }

  const handlePrint = () => {
    if (!lookupResult || !title || priceCents === null || !onPrint) return

    const queueItem: QueueItem = {
      id: uuidv4(),
      lookup: lookupResult,
      condition,
      priceCents,
      category,
      addedAt: new Date().toISOString()
    }

    if (title !== lookupResult.title) {
      queueItem.lookup = { ...lookupResult, title }
    }

    onPrint(queueItem)
  }

  if (!isOpen || !lookupResult) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-2xl bg-card rounded-lg border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Review Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image and Basic Info */}
          <div className="flex gap-6">
            {/* Image */}
            <div className="flex-shrink-0">
              {lookupResult.imageUrl && !imageError ? (
                <img
                  src={lookupResult.imageUrl}
                  alt={title}
                  className="w-32 h-32 object-contain rounded-lg bg-secondary"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-secondary flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Barcode: {lookupResult.barcode}
              </p>
              <p className="text-sm text-muted-foreground">
                Type: {lookupResult.type.toUpperCase()}
              </p>
              {lookupResult.authors && lookupResult.authors.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Authors: {lookupResult.authors.join(', ')}
                </p>
              )}
              {lookupResult.brand && (
                <p className="text-sm text-muted-foreground">
                  Brand: {lookupResult.brand}
                </p>
              )}
              {lookupResult.publisher && (
                <p className="text-sm text-muted-foreground">
                  Publisher: {lookupResult.publisher}
                </p>
              )}
              {lookupResult.retailPriceCents && (
                <p className="text-sm text-muted-foreground">
                  Retail Price: ${(lookupResult.retailPriceCents / 100).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter item title"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Condition
              </label>
              <ConditionToggle
                value={condition}
                onChange={handleConditionChange}
                size="lg"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price {!lookupResult.retailPriceCents && <span className="text-destructive">*</span>}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceCents !== null ? priceCents / 100 : ''}
                  onChange={handlePriceChange}
                  className="w-full pl-10 pr-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  required
                />
              </div>
              {!lookupResult.retailPriceCents && (
                <p className="text-xs text-muted-foreground mt-1">
                  No retail price found. Please enter a price manually.
                </p>
              )}
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
                className="w-full px-4 py-2 bg-input border rounded-lg focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex gap-2">
            {onPrint && (
              <button
                onClick={handlePrint}
                disabled={!title || priceCents === null}
                className="btn-outline flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Label
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Skip
            </button>
            <button
              onClick={handleAddToQueue}
              disabled={!title || priceCents === null}
              className="btn-primary flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Add to Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}