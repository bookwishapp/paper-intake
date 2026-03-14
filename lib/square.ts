import { Client, Environment } from 'square'
import { QueueItem, SquareCatalogObject } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export class SquareClient {
  private client: Client
  private locationId: string

  constructor(accessToken?: string, locationId?: string) {
    const token = accessToken || process.env.SQUARE_ACCESS_TOKEN || ''
    this.locationId = locationId || process.env.SQUARE_LOCATION_ID || ''

    this.client = new Client({
      accessToken: token,
      environment: token.startsWith('sandbox-')
        ? Environment.Sandbox
        : Environment.Production
    })
  }

  async searchCatalogByBarcode(barcode: string): Promise<SquareCatalogObject | null> {
    try {
      const response = await this.client.catalogApi.searchCatalogObjects({
        objectTypes: ['ITEM_VARIATION'],
        query: {
          exactQuery: {
            attributeName: 'sku',
            attributeValue: barcode
          }
        },
        limit: 1
      })

      if (response.result.objects && response.result.objects.length > 0) {
        return response.result.objects[0] as SquareCatalogObject
      }

      // Also try searching by UPC
      const upcResponse = await this.client.catalogApi.searchCatalogObjects({
        objectTypes: ['ITEM_VARIATION'],
        query: {
          exactQuery: {
            attributeName: 'upc',
            attributeValue: barcode
          }
        },
        limit: 1
      })

      if (upcResponse.result.objects && upcResponse.result.objects.length > 0) {
        return upcResponse.result.objects[0] as SquareCatalogObject
      }

      return null
    } catch (error) {
      console.error('Error searching catalog:', error)
      return null
    }
  }

  async createOrUpdateItem(item: QueueItem): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if item exists
      const existing = await this.searchCatalogByBarcode(item.lookup.barcode)

      if (existing) {
        // Update existing item's price
        return await this.updateItemPrice(existing, item.priceCents)
      }

      // Create new item
      const itemId = `#${uuidv4()}`
      const variationId = `#${uuidv4()}`

      const catalogObject = {
        type: 'ITEM' as const,
        id: itemId,
        presentAtAllLocations: true,
        itemData: {
          name: item.lookup.title.slice(0, 512), // Square has a 512 char limit
          description: this.buildDescription(item),
          categoryId: this.getCategoryId(item.category),
          variations: [
            {
              type: 'ITEM_VARIATION' as const,
              id: variationId,
              presentAtAllLocations: true,
              itemVariationData: {
                itemId: itemId,
                name: item.condition === 'new' ? 'New' : 'Used',
                sku: item.lookup.barcode,
                upc: item.lookup.type === 'upc' ? item.lookup.barcode : undefined,
                pricingType: 'FIXED_PRICING' as const,
                priceMoney: {
                  amount: BigInt(item.priceCents),
                  currency: 'USD'
                },
                trackInventory: false
              }
            }
          ],
          productType: 'REGULAR' as const
        }
      }

      const response = await this.client.catalogApi.upsertCatalogObject({
        idempotencyKey: uuidv4(),
        object: catalogObject
      })

      return { success: true }
    } catch (error) {
      console.error('Error creating/updating item:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async updateItemPrice(
    existing: SquareCatalogObject,
    priceCents: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updatedObject = {
        ...existing,
        version: existing.version
      }

      // Update the price in the variation data
      if (updatedObject.item_variation_data) {
        updatedObject.item_variation_data.price_money = {
          amount: BigInt(priceCents),
          currency: 'USD'
        }
      }

      const response = await this.client.catalogApi.upsertCatalogObject({
        idempotencyKey: uuidv4(),
        object: updatedObject
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating item price:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private buildDescription(item: QueueItem): string {
    const parts = []

    if (item.lookup.type === 'isbn' && item.lookup.authors?.length) {
      parts.push(`By ${item.lookup.authors.join(', ')}`)
    }

    if (item.lookup.publisher) {
      parts.push(`Publisher: ${item.lookup.publisher}`)
    }

    if (item.lookup.brand) {
      parts.push(`Brand: ${item.lookup.brand}`)
    }

    parts.push(`Condition: ${item.condition}`)
    parts.push(`Category: ${item.category}`)
    parts.push(`Barcode: ${item.lookup.barcode}`)

    return parts.join(' | ')
  }

  private getCategoryId(category: string): string | undefined {
    // In a real implementation, you might want to map these to actual Square category IDs
    // For now, we'll return undefined and let Square handle it
    return undefined
  }

  async deleteAllCatalogItems(): Promise<{ deleted: number; error?: string }> {
    try {
      let allObjectIds: string[] = []
      let cursor: string | undefined = undefined
      let hasMore = true

      // Fetch all catalog object IDs
      while (hasMore) {
        const response = await this.client.catalogApi.listCatalog(
          cursor,
          'ITEM'
        )

        if (response.result.objects) {
          const ids = response.result.objects.map(obj => obj.id)
          allObjectIds = allObjectIds.concat(ids)
        }

        cursor = response.result.cursor
        hasMore = !!cursor
      }

      if (allObjectIds.length === 0) {
        return { deleted: 0 }
      }

      // Delete in batches of 200 (Square's limit)
      let deletedCount = 0
      const batchSize = 200

      for (let i = 0; i < allObjectIds.length; i += batchSize) {
        const batch = allObjectIds.slice(i, i + batchSize)

        try {
          const deleteResponse = await this.client.catalogApi.batchDeleteCatalogObjects({
            objectIds: batch
          })

          deletedCount += batch.length
        } catch (batchError) {
          console.error('Error deleting batch:', batchError)
        }
      }

      return { deleted: deletedCount }
    } catch (error) {
      console.error('Error deleting catalog items:', error)
      return {
        deleted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Mock mode for development without API keys
  async mockPushItems(items: QueueItem[]): Promise<any> {
    console.log('Mock Square Push - would push these items:', items)
    return {
      success: items.length,
      failed: 0,
      errors: []
    }
  }

  async mockDeleteAll(): Promise<{ deleted: number }> {
    console.log('Mock Square Delete - would delete all catalog items')
    return { deleted: 42 } // Mock number
  }
}