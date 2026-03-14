import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check which APIs are configured
  const status = {
    environment: process.env.NODE_ENV || 'development',
    square: {
      configured: !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID),
      hasToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasLocation: !!process.env.SQUARE_LOCATION_ID
    },
    isbndb: {
      configured: !!process.env.ISBNDB_API_KEY
    },
    upcitemdb: {
      configured: true // Always true since it uses free tier
    }
  }

  return NextResponse.json(status)
}