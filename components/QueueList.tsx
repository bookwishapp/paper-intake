'use client'

import React from 'react'
import { Trash2, Printer, Package, DollarSign } from 'lucide-react'
import { QueueItem } from '@/types'

interface QueueListProps {
  items: QueueItem[]
  onRemove: (id: string) => void
  onPrint?: (item: QueueItem) => void
}

export function QueueList({ items, onRemove, onPrint }: QueueListProps) {
  const totalValue = items.reduce((sum, item) => sum + item.priceCents, 0)
  const usedCount = items.filter(item => item.condition === 'used').length
  const newCount = items.filter(item => item.condition === 'new').length

  if (items.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          No items in queue. Scan items to add them.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Items</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">${(totalValue / 100).toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Used Items</p>
          <p className="text-2xl font-bold">{usedCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">New Items</p>
          <p className="text-2xl font-bold">{newCount}</p>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  {item.lookup.imageUrl ? (
                    <img
                      src={item.lookup.imageUrl}
                      alt={item.lookup.title}
                      className="w-16 h-16 object-contain rounded bg-secondary"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate pr-2">
                    {item.lookup.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{item.lookup.barcode}</span>
                    <span className="capitalize">{item.category}</span>
                    {item.lookup.authors && item.lookup.authors.length > 0 && (
                      <span>{item.lookup.authors.join(', ')}</span>
                    )}
                    {item.lookup.brand && (
                      <span>{item.lookup.brand}</span>
                    )}
                  </div>
                </div>

                {/* Badges and Actions */}
                <div className="flex items-center gap-3">
                  {/* Condition Badge */}
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium uppercase
                      ${item.condition === 'new'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                      }
                    `}
                  >
                    {item.condition}
                  </span>

                  {/* Price */}
                  <div className="flex items-center gap-1 font-bold text-lg">
                    <DollarSign className="w-4 h-4" />
                    {(item.priceCents / 100).toFixed(2)}
                  </div>

                  {/* Actions */}
                  {onPrint && (
                    <button
                      onClick={() => onPrint(item)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="Print Label"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                    title="Remove from Queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}