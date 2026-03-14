'use client'

import React from 'react'
import { Condition } from '@/types'

interface ConditionToggleProps {
  value: Condition
  onChange: (value: Condition) => void
  size?: 'sm' | 'md' | 'lg'
}

export function ConditionToggle({
  value,
  onChange,
  size = 'md'
}: ConditionToggleProps) {
  const sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg'
  }

  return (
    <div className="flex rounded-lg overflow-hidden border-2 border-input">
      <button
        type="button"
        onClick={() => onChange('used')}
        className={`
          flex-1 font-medium transition-all
          ${sizeClasses[size]}
          ${value === 'used'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }
        `}
      >
        USED
      </button>
      <button
        type="button"
        onClick={() => onChange('new')}
        className={`
          flex-1 font-medium transition-all
          ${sizeClasses[size]}
          ${value === 'new'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }
        `}
      >
        NEW
      </button>
    </div>
  )
}