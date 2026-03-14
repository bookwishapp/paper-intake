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

    // If no Square credentials, use mock mode
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.log('Square: Using mock mode (no access token)')
      const mockResult = await client.mockPushItems(items as QueueItem[])
      return NextResponse.json(mockResult)
    }

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
  } catch (error) {
    console.error('Square push error:', error)
    return NextResponse.json(
      { error: 'Failed to push items to Square' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for clearing the catalog (used by admin)
export async function DELETE(request: NextRequest) {
  try {
    const client = new SquareClient()

    // If no Square credentials, use mock mode
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.log('Square: Using mock delete mode (no access token)')
      const mockResult = await client.mockDeleteAll()
      return NextResponse.json(mockResult)
    }

    const result = await client.deleteAllCatalogItems()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Square delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete catalog items' },
      { status: 500 }
    )
  }
}