import { Client, Environment, FileWrapper } from 'square'
import { QueueItem, SquareCatalogObject } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { Readable } from 'stream'

export class SquareClient {
  private client: Client
  private locationId: string

  constructor(accessToken?: string, locationId?: string) {
    const token = accessToken || process.env.SQUARE_ACCESS_TOKEN || ''
    this.locationId = locationId || process.env.SQUARE_LOCATION_ID || ''

    if (!token) {
      throw new Error('Square access token is required. Please configure SQUARE_ACCESS_TOKEN in your environment variables.')
    }

    if (!this.locationId) {
      throw new Error('Square location ID is required. Please configure SQUARE_LOCATION_ID in your environment variables.')
    }

    this.client = new Client({
      accessToken: token,
      environment: token.startsWith('sandbox-')
        ? Environment.Sandbox
        : Environment.Production
    })
  }

  async searchItemsByBarcode(barcode: string): Promise<SquareCatalogObject[]> {
    try {
      // Search by SKU
      const skuResponse = await this.client.catalogApi.searchCatalogObjects({
        objectTypes: ['ITEM'],
        query: {
          exactQuery: {
            attributeName: 'sku',
            attributeValue: barcode
          }
        }
      })

      if (skuResponse.result.objects && skuResponse.result.objects.length > 0) {
        return skuResponse.result.objects as SquareCatalogObject[]
      }

      // Also search for items that have variations with this SKU
      const variationResponse = await this.client.catalogApi.searchCatalogObjects({
        objectTypes: ['ITEM_VARIATION'],
        query: {
          exactQuery: {
            attributeName: 'sku',
            attributeValue: barcode
          }
        },
        includeRelatedObjects: true
      })

      if (variationResponse.result.relatedObjects) {
        const items = variationResponse.result.relatedObjects.filter(
          obj => obj.type === 'ITEM'
        )
        if (items.length > 0) {
          return items as SquareCatalogObject[]
        }
      }

      // Try searching by UPC
      const upcResponse = await this.client.catalogApi.searchCatalogObjects({
        objectTypes: ['ITEM_VARIATION'],
        query: {
          exactQuery: {
            attributeName: 'upc',
            attributeValue: barcode
          }
        },
        includeRelatedObjects: true
      })

      if (upcResponse.result.relatedObjects) {
        const items = upcResponse.result.relatedObjects.filter(
          obj => obj.type === 'ITEM'
        )
        return items as SquareCatalogObject[]
      }

      return []
    } catch (error: any) {
      console.error('Error searching catalog by barcode:', error)
      throw error
    }
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
      console.log('[Square] Processing item:', {
        title: item.lookup.title,
        barcode: item.lookup.barcode,
        hasImageUrl: !!item.lookup.imageUrl,
        imageUrl: item.lookup.imageUrl
      })

      // Check if item exists
      const existing = await this.searchCatalogByBarcode(item.lookup.barcode)

      if (existing) {
        console.log('[Square] Item already exists, updating price only')
        // Update existing item's price
        return await this.updateItemPrice(existing, item.priceCents)
      }

      // Create new item
      const itemId = `#${uuidv4()}`
      const variationId = `#${uuidv4()}`

      // Handle image upload if imageUrl is provided
      let imageIds: string[] | undefined
      if (item.lookup.imageUrl) {
        console.log('[Square] Attempting to upload image from URL:', item.lookup.imageUrl)
        const imageId = await this.uploadImageFromUrl(item.lookup.imageUrl, item.lookup.title)
        if (imageId) {
          console.log('[Square] Image uploaded successfully with ID:', imageId)
          imageIds = [imageId]
        } else {
          console.log('[Square] Image upload failed or returned null')
        }
      } else {
        console.log('[Square] No imageUrl provided in lookup result')
      }

      const catalogObject = {
        type: 'ITEM' as const,
        id: itemId,
        presentAtAllLocations: true,
        itemData: {
          name: item.lookup.title.slice(0, 512), // Square has a 512 char limit
          description: this.buildDescription(item),
          categoryId: this.getCategoryId(item.category),
          imageIds: imageIds, // Add image IDs to the catalog object
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

      console.log('[Square] Creating catalog object with imageIds:', imageIds)
      console.log('[Square] Full catalog object:', JSON.stringify(catalogObject, null, 2))

      const response = await this.client.catalogApi.upsertCatalogObject({
        idempotencyKey: uuidv4(),
        object: catalogObject
      })

      console.log('[Square] Item created successfully')
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
      const updatedObject: any = {
        ...existing,
        version: existing.version
      }

      // Update the price in the variation data (for ITEM_VARIATION type)
      // The search returns ITEM_VARIATION objects, not ITEM objects
      if (existing.type === 'ITEM_VARIATION' && updatedObject.itemVariationData) {
        updatedObject.itemVariationData.priceMoney = {
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

  private async uploadImageFromUrl(imageUrl: string, itemName: string): Promise<string | null> {
    try {
      console.log('[Square Image] Starting image download from:', imageUrl)

      // First, download the image from the URL
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000 // 10 second timeout for image download
      })

      console.log('[Square Image] Downloaded image, size:', imageResponse.data.byteLength, 'bytes')

      // Convert to Buffer for Square API
      const imageBuffer = Buffer.from(imageResponse.data)

      // Convert Buffer to Readable stream for FileWrapper
      const imageStream = Readable.from(imageBuffer)

      // Generate a unique ID for the image
      const imageId = `#${uuidv4()}`

      console.log('[Square Image] Creating FileWrapper with contentType: image/jpeg')

      // Create a FileWrapper for the image data
      const imageFile = new FileWrapper(imageStream, {
        contentType: 'image/jpeg'
      })

      console.log('[Square Image] Calling createCatalogImage API with image ID:', imageId)

      // Create the catalog image with the file data in a single call
      const createImageResponse = await this.client.catalogApi.createCatalogImage(
        {
          idempotencyKey: uuidv4(),
          image: {
            type: 'IMAGE' as const,
            id: imageId,
            imageData: {
              name: `${itemName} - Product Image`.slice(0, 255),
              caption: itemName.slice(0, 255)
            }
          },
          isPrimary: true
        },
        imageFile
      )

      console.log('[Square Image] API Response:', JSON.stringify(createImageResponse.result, null, 2))

      if (!createImageResponse.result.image?.id) {
        console.error('[Square Image] Failed - no image ID in response')
        return null
      }

      const finalImageId = createImageResponse.result.image.id
      console.log('[Square Image] Success! Image created with ID:', finalImageId)
      return finalImageId
    } catch (error: any) {
      console.error('[Square Image] Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      })
      // Don't fail the entire item creation if image upload fails
      return null
    }
  }

  async batchDeleteCatalogObjects(objectIds: string[]): Promise<any> {
    try {
      const response = await this.client.catalogApi.batchDeleteCatalogObjects({
        objectIds
      })

      return response.result
    } catch (error: any) {
      console.error('Error batch deleting catalog objects:', error)
      throw error
    }
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

}