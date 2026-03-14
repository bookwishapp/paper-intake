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
    if (!cleanIsbn.startsWith('978') && !cleanIsbn.startsWith('979')) {
      return NextResponse.json(
        { error: 'Invalid ISBN format' },
        { status: 400 }
      )
    }

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