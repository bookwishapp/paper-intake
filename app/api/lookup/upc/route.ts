import { NextRequest, NextResponse } from 'next/server'
import { UPCItemDBClient } from '@/lib/upcitemdb'
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

    const client = new UPCItemDBClient()
    const result: LookupResult = await client.lookup(barcode)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('UPC lookup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to lookup UPC' },
      { status: 500 }
    )
  }
}