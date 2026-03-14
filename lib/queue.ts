import { QueueItem } from '@/types'

const QUEUE_KEY = 'paper-intake-queue'

export class QueueManager {
  /**
   * Get all items from the queue
   */
  static getQueue(): QueueItem[] {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem(QUEUE_KEY)
    if (!stored) return []

    try {
      return JSON.parse(stored) as QueueItem[]
    } catch (error) {
      console.error('Error parsing queue:', error)
      return []
    }
  }

  /**
   * Save the queue to localStorage
   */
  static saveQueue(queue: QueueItem[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Error saving queue:', error)
    }
  }

  /**
   * Add an item to the queue
   */
  static addItem(item: QueueItem): void {
    const queue = this.getQueue()
    queue.push(item)
    this.saveQueue(queue)
  }

  /**
   * Remove an item from the queue
   */
  static removeItem(id: string): void {
    const queue = this.getQueue()
    const filtered = queue.filter(item => item.id !== id)
    this.saveQueue(filtered)
  }

  /**
   * Update an item in the queue
   */
  static updateItem(id: string, updates: Partial<QueueItem>): void {
    const queue = this.getQueue()
    const index = queue.findIndex(item => item.id === id)

    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates }
      this.saveQueue(queue)
    }
  }

  /**
   * Clear the entire queue
   */
  static clearQueue(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(QUEUE_KEY)
  }

  /**
   * Get queue statistics
   */
  static getStats(): {
    count: number
    totalValue: number
    usedCount: number
    newCount: number
  } {
    const queue = this.getQueue()

    return {
      count: queue.length,
      totalValue: queue.reduce((sum, item) => sum + item.priceCents, 0),
      usedCount: queue.filter(item => item.condition === 'used').length,
      newCount: queue.filter(item => item.condition === 'new').length
    }
  }

  /**
   * Export queue to JSON
   */
  static exportQueue(): string {
    const queue = this.getQueue()
    return JSON.stringify(queue, null, 2)
  }

  /**
   * Import queue from JSON
   */
  static importQueue(json: string): boolean {
    try {
      const queue = JSON.parse(json) as QueueItem[]

      // Validate structure
      if (!Array.isArray(queue)) {
        throw new Error('Invalid queue format')
      }

      // Basic validation of items
      for (const item of queue) {
        if (!item.id || !item.lookup || !item.condition || !item.category) {
          throw new Error('Invalid queue item')
        }
      }

      this.saveQueue(queue)
      return true
    } catch (error) {
      console.error('Error importing queue:', error)
      return false
    }
  }
}