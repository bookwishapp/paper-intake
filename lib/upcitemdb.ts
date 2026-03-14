import axios from 'axios'
import { UPCItemResponse, LookupResult } from '@/types'

const UPCITEMDB_BASE_URL = 'https://api.upcitemdb.com/prod/trial'

export class UPCItemDBClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.UPCITEMDB_API_KEY || ''
  }

  async lookup(upc: string): Promise<LookupResult> {
    // Clean the UPC (remove spaces)
    const cleanUpc = upc.replace(/\s/g, '')

    // Mock data for testing without API key
    if (!this.apiKey || this.apiKey === '') {
      console.log('UPCitemdb: Using mock data (no API key)')
      return this.getMockData(cleanUpc)
    }

    try {
      const response = await axios.get<UPCItemResponse>(
        `${UPCITEMDB_BASE_URL}/lookup`,
        {
          params: {
            upc: cleanUpc
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'user_key': this.apiKey,
            'key_type': '3scale'
          },
          timeout: 5000
        }
      )

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Product not found')
      }

      const item = response.data.items[0]
      return this.transformToLookupResult(cleanUpc, item)
    } catch (error) {
      console.error('UPCitemdb lookup error:', error)
      // Return mock data on error for development
      return this.getMockData(cleanUpc)
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

  private getMockData(upc: string): LookupResult {
    // Mock data for development/testing
    const mockProducts: Record<string, LookupResult> = {
      '012345678901': {
        barcode: '012345678901',
        type: 'upc',
        title: 'Monopoly Board Game',
        brand: 'Hasbro',
        imageUrl: 'https://via.placeholder.com/200x200?text=Monopoly',
        retailPriceCents: 2999
      },
      '098765432109': {
        barcode: '098765432109',
        type: 'upc',
        title: '1000 Piece Jigsaw Puzzle - Mountain Scene',
        brand: 'Ravensburger',
        imageUrl: 'https://via.placeholder.com/200x200?text=Puzzle',
        retailPriceCents: 1799
      },
      '111222333444': {
        barcode: '111222333444',
        type: 'upc',
        title: 'Greeting Card Set - Birthday',
        brand: 'Hallmark',
        imageUrl: 'https://via.placeholder.com/200x200?text=Cards',
        retailPriceCents: 599
      }
    }

    // Return specific mock or generate generic one
    return mockProducts[upc] || {
      barcode: upc,
      type: 'upc',
      title: `Mock Product ${upc.slice(-4)}`,
      brand: 'Test Brand',
      imageUrl: `https://via.placeholder.com/200x200?text=UPC+${upc.slice(-4)}`,
      retailPriceCents: Math.floor(Math.random() * 3000) + 500 // Random price between $5 and $35
    }
  }
}