'use client'

import React from 'react'

interface BarcodeDisplayProps {
  barcode: string
  height?: number
  width?: number
}

export function BarcodeDisplay({ barcode, height = 40, width = 200 }: BarcodeDisplayProps) {
  // Generate a deterministic pattern based on the barcode string
  const generateBarcodePattern = (code: string): number[] => {
    const pattern: number[] = []

    // Start with quiet zone
    pattern.push(3, 1, 2, 1, 3)

    // Generate bars based on characters
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i)
      // Create varying bar widths based on character
      pattern.push(
        (charCode % 3) + 1,  // Bar (1-3 width)
        1,                    // Space
        ((charCode >> 2) % 2) + 1,  // Bar (1-2 width)
        1,                    // Space
        ((charCode >> 4) % 3) + 1   // Bar (1-3 width)
      )

      // Add separator every 4 characters
      if ((i + 1) % 4 === 0) {
        pattern.push(1, 2, 1)
      }
    }

    // End with quiet zone
    pattern.push(3, 1, 2, 1, 3)

    return pattern
  }

  const pattern = generateBarcodePattern(barcode)

  // Calculate total width units
  const totalUnits = pattern.reduce((sum, width) => sum + width, 0)
  const unitWidth = width / totalUnits

  // Generate bars
  let position = 0
  const bars = pattern.map((widthUnits, index) => {
    const barWidth = widthUnits * unitWidth
    const bar = (
      <rect
        key={index}
        x={position}
        y={0}
        width={barWidth}
        height={height}
        fill={index % 2 === 0 ? '#000' : '#fff'}
      />
    )
    position += barWidth
    return bar
  })

  return (
    <div className="flex flex-col items-center space-y-1">
      <svg
        width={width}
        height={height}
        className="barcode-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* White background */}
        <rect x={0} y={0} width={width} height={height} fill="#fff" />
        {/* Barcode bars */}
        {bars}
      </svg>
      <div className="text-center font-mono text-xs">
        {barcode}
      </div>
    </div>
  )
}