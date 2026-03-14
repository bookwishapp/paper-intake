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

    // Mock data for testing without API key
    if (!this.apiKey || this.apiKey === '') {
      console.log('ISBNdb: Using mock data (no API key)')
      return this.getMockData(cleanIsbn)
    }

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
    } catch (error) {
      console.error('ISBNdb lookup error:', error)
      // Return mock data on error for development
      return this.getMockData(cleanIsbn)
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

  private getMockData(isbn: string): LookupResult {
    // Mock data for development/testing
    const mockBooks: Record<string, LookupResult> = {
      '9780140328721': {
        barcode: '9780140328721',
        type: 'isbn',
        title: 'Fantastic Mr. Fox',
        authors: ['Roald Dahl'],
        publisher: 'Puffin Books',
        imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140328721-L.jpg',
        retailPriceCents: 899
      },
      '9780439708180': {
        barcode: '9780439708180',
        type: 'isbn',
        title: 'Harry Potter and the Sorcerer\'s Stone',
        authors: ['J.K. Rowling'],
        publisher: 'Scholastic',
        imageUrl: 'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
        retailPriceCents: 1499
      }
    }

    // Return specific mock or generate generic one
    return mockBooks[isbn] || {
      barcode: isbn,
      type: 'isbn',
      title: `Mock Book ${isbn.slice(-4)}`,
      authors: ['Test Author'],
      publisher: 'Test Publisher',
      imageUrl: `https://via.placeholder.com/200x300?text=ISBN+${isbn.slice(-4)}`,
      retailPriceCents: 1999
    }
  }
}