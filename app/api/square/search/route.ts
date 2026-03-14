import { NextRequest, NextResponse } from 'next/server'
import { SquareClient } from '@/lib/square'

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

    const client = new SquareClient()

    // Search for items with matching SKU or UPC
    const items = await client.searchItemsByBarcode(barcode)

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Item not found in Square catalog' },
        { status: 404 }
      )
    }

    // Return the first match (should typically be only one)
    const item = items[0]

    // Extract relevant info
    const result = {
      id: item.id,
      name: item.item_data?.name || 'Unnamed Item',
      sku: item.item_data?.variations?.[0]?.item_variation_data?.sku,
      upc: item.item_data?.variations?.[0]?.item_variation_data?.upc,
      price: item.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount
        ? Number(item.item_data.variations[0].item_variation_data.price_money.amount)
        : null,
      barcode
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Square search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search Square catalog' },
      { status: 500 }
    )
  }
}