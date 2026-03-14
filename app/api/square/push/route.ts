import { NextRequest, NextResponse } from 'next/server'
import { SquareClient } from '@/lib/square'
import { QueueItem, BatchPushResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    const client = new SquareClient()

    const result: BatchPushResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    // Process each item
    for (const item of items as QueueItem[]) {
      const pushResult = await client.createOrUpdateItem(item)

      if (pushResult.success) {
        result.success++
      } else {
        result.failed++
        result.errors.push({
          item,
          error: pushResult.error || 'Unknown error'
        })
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Square push error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to push items to Square' },
      { status: error.message?.includes('required') ? 503 : 500 }
    )
  }
}

// DELETE endpoint for clearing the catalog (used by admin)
export async function DELETE(request: NextRequest) {
  try {
    const client = new SquareClient()
    const result = await client.deleteAllCatalogItems()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Square delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete catalog items' },
      { status: error.message?.includes('required') ? 503 : 500 }
    )
  }
}