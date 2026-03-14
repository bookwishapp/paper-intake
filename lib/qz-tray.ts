// QZ Tray connection and printing service
declare global {
  interface Window {
    qz: any
  }
}

export class QZTrayService {
  private static instance: QZTrayService
  private connected: boolean = false
  private connecting: boolean = false

  static getInstance(): QZTrayService {
    if (!QZTrayService.instance) {
      QZTrayService.instance = new QZTrayService()
    }
    return QZTrayService.instance
  }

  // Check if QZ Tray is available
  isAvailable(): boolean {
    return typeof window !== 'undefined' && window.qz !== undefined
  }

  // Check if connected to QZ Tray
  isConnected(): boolean {
    return this.connected && this.isAvailable() && window.qz.websocket.isActive()
  }

  // Connect to QZ Tray
  async connect(): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('QZ Tray is not loaded. Please ensure QZ Tray is running.')
    }

    if (this.isConnected()) {
      return true
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.connecting) {
            clearInterval(checkInterval)
            resolve(this.connected)
          }
        }, 100)
      })
    }

    this.connecting = true

    try {
      await window.qz.websocket.connect()
      this.connected = true
      this.connecting = false
      return true
    } catch (error) {
      this.connected = false
      this.connecting = false

      // Check if it's a connection refused error (QZ Tray not running)
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message || ''
        if (message.includes('CONNECTION_ERROR') || message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error('QZ Tray is not running. Please start QZ Tray on this computer.')
        }
      }

      throw error
    }
  }

  // Disconnect from QZ Tray
  async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      return
    }

    try {
      await window.qz.websocket.disconnect()
      this.connected = false
    } catch (error) {
      console.error('Error disconnecting from QZ Tray:', error)
    }
  }

  // Find Zebra printers
  async findZebraPrinters(): Promise<string[]> {
    if (!this.isConnected()) {
      await this.connect()
    }

    try {
      const printers = await window.qz.printers.find()
      // Filter for Zebra printers (you can adjust this filter)
      return printers.filter((printer: string) =>
        printer.toLowerCase().includes('zebra') ||
        printer.toLowerCase().includes('zpl') ||
        printer.toLowerCase().includes('label')
      )
    } catch (error) {
      console.error('Error finding printers:', error)
      return []
    }
  }

  // Get all available printers
  async getAllPrinters(): Promise<string[]> {
    if (!this.isConnected()) {
      await this.connect()
    }

    try {
      return await window.qz.printers.find()
    } catch (error) {
      console.error('Error finding printers:', error)
      return []
    }
  }

  // Get default printer
  async getDefaultPrinter(): Promise<string | null> {
    if (!this.isConnected()) {
      await this.connect()
    }

    try {
      const defaultPrinter = await window.qz.printers.getDefault()
      return defaultPrinter || null
    } catch (error) {
      console.error('Error getting default printer:', error)
      return null
    }
  }

  // Send ZPL to printer
  async printZPL(zplData: string, printerName?: string): Promise<void> {
    if (!this.isConnected()) {
      await this.connect()
    }

    try {
      const config = window.qz.configs.create(printerName || null)
      const data = [{
        type: 'raw',
        format: 'command',
        flavor: 'plain',
        data: zplData
      }]

      await window.qz.print(config, data)
    } catch (error) {
      console.error('Error printing ZPL:', error)
      throw new Error('Failed to send label to printer. Please check printer connection.')
    }
  }
}