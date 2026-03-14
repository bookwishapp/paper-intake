import { NextRequest, NextResponse } from 'next/server'
import { ISBNdbClient } from '@/lib/isbndb'
import { LookupResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode } = body

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Validate ISBN format
    const cleanIsbn = barcode.replace(/[-\s]/g, '')

    // Check if it starts with 978 or 979
    if (!cleanIsbn.startsWith('978') && !cleanIsbn.startsWith('979')) {
      return NextResponse.json(
        { error: 'Invalid ISBN format - must start with 978 or 979' },
        { status: 400 }
      )
    }

    // Check length (ISBN-13 should be 13 digits)
    if (cleanIsbn.length !== 13) {
      return NextResponse.json(
        { error: `Invalid ISBN length - should be 13 digits, got ${cleanIsbn.length}` },
        { status: 400 }
      )
    }

    console.log('Looking up ISBN:', cleanIsbn)

    const client = new ISBNdbClient()
    const result: LookupResult = await client.lookup(cleanIsbn)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('ISBN lookup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to lookup ISBN' },
      { status: error.message?.includes('required') ? 503 : 500 }
    )
  }
}