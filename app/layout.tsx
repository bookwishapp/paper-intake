import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Paper Street Thrift - Inventory Intake',
  description: 'Barcode scanning and inventory management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        {/* QZ Tray library for label printing */}
        <Script
          src="https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.min.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  )
}