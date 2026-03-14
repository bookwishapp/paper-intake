import axios from 'axios'
import { ISBNdbResponse, LookupResult } from '@/types'

const ISBNDB_BASE_URL = 'https://api2.isbndb.com'

export class ISBNdbClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ISBNDB_API_KEY || ''
  }

  async lookup(isbn: string): Promise<LookupResult> {
    // Clean the ISBN (remove dashes and spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, '')

    // Require API key
    if (!this.apiKey || this.apiKey === '') {
      console.error('ISBNdb API key is missing')
      throw new Error('ISBNdb API key is required. Please configure ISBNDB_API_KEY in your environment variables.')
    }

    console.log('ISBNdb lookup - API key present:', this.apiKey.substring(0, 8) + '...')

    try {
      const response = await axios.get<ISBNdbResponse>(
        `${ISBNDB_BASE_URL}/book/${cleanIsbn}`,
        {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      )

      const book = response.data.book || response.data.books?.[0]

      if (!book) {
        throw new Error('Book not found')
      }

      return this.transformToLookupResult(cleanIsbn, book)
    } catch (error: any) {
      console.error('ISBNdb lookup error:', error)
      if (error.response?.status === 401) {
        throw new Error('Invalid ISBNdb API key')
      } else if (error.response?.status === 404) {
        throw new Error('ISBN not found in database')
      } else if (error.message) {
        throw error
      } else {
        throw new Error('Failed to lookup ISBN')
      }
    }
  }

  private transformToLookupResult(isbn: string, book: any): LookupResult {
    // Try to parse the MSRP
    let retailPriceCents: number | null = null
    if (book.msrp) {
      const msrp = typeof book.msrp === 'string'
        ? parseFloat(book.msrp.replace(/[^0-9.]/g, ''))
        : book.msrp
      if (!isNaN(msrp)) {
        retailPriceCents = Math.round(msrp * 100)
      }
    }

    return {
      barcode: isbn,
      type: 'isbn',
      title: book.title_long || book.title || 'Unknown Book',
      authors: book.authors || [],
      publisher: book.publisher,
      imageUrl: book.image,
      retailPriceCents
    }
  }

}