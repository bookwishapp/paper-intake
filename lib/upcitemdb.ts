import axios from 'axios'
import { UPCItemResponse, LookupResult } from '@/types'

// UPCitemdb free tier endpoint - no API key required!
const UPCITEMDB_BASE_URL = 'https://api.upcitemdb.com/prod/trial'

export class UPCItemDBClient {
  constructor() {
    // No API key needed for free tier
  }

  async lookup(upc: string): Promise<LookupResult> {
    // Clean the UPC (remove spaces)
    const cleanUpc = upc.replace(/\s/g, '')

    try {
      // Use the free trial endpoint - no authentication needed
      const response = await axios.get<UPCItemResponse>(
        `${UPCITEMDB_BASE_URL}/lookup`,
        {
          params: {
            upc: cleanUpc
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      )

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Product not found in UPCitemDB')
      }

      const item = response.data.items[0]
      return this.transformToLookupResult(cleanUpc, item)
    } catch (error: any) {
      console.error('UPCitemdb lookup error:', error)
      if (error.response?.status === 404) {
        throw new Error('UPC not found in database')
      } else if (error.message) {
        throw error
      } else {
        throw new Error('Failed to lookup UPC')
      }
    }
  }

  private transformToLookupResult(upc: string, item: any): LookupResult {
    // Try to determine the best price
    let retailPriceCents: number | null = null

    if (item.msrp && item.msrp > 0) {
      retailPriceCents = Math.round(item.msrp * 100)
    } else if (item.highest_recorded_price && item.highest_recorded_price > 0) {
      retailPriceCents = Math.round(item.highest_recorded_price * 100)
    } else if (item.lowest_recorded_price && item.lowest_recorded_price > 0) {
      // Use 1.5x the lowest as an estimate
      retailPriceCents = Math.round(item.lowest_recorded_price * 150)
    }

    return {
      barcode: upc,
      type: 'upc',
      title: item.title || 'Unknown Product',
      brand: item.brand,
      imageUrl: item.images?.[0],
      retailPriceCents
    }
  }

}