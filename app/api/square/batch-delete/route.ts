import { NextRequest, NextResponse } from 'next/server'
import { SquareClient } from '@/lib/square'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemIds } = body

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Item IDs array is required' },
        { status: 400 }
      )
    }

    const client = new SquareClient()

    // Delete items from Square
    const results = await client.batchDeleteCatalogObjects(itemIds)

    return NextResponse.json({
      success: true,
      deletedCount: results.deletedObjectIds?.length || 0,
      deletedIds: results.deletedObjectIds || [],
      deletedAt: results.deletedAt
    })
  } catch (error: any) {
    console.error('Batch delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete items from Square' },
      { status: 500 }
    )
  }
}