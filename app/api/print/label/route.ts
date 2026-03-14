import { NextRequest, NextResponse } from 'next/server'
import { ZPLGenerator } from '@/lib/zpl'
import { PrintLabelRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, priceCents, condition, barcode, printerType = 'zebra' } = body

    if (!title || !barcode || priceCents === undefined || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const labelRequest: PrintLabelRequest = {
      title,
      priceCents,
      condition,
      barcode,
      storeName: 'Paper Street Thrift'
    }

    let labelData: string
    let contentType: string

    if (printerType === 'dymo') {
      // Generate Dymo XML
      labelData = ZPLGenerator.generateDymoLabel(labelRequest)
      contentType = 'application/xml'
    } else {
      // Generate ZPL for Zebra
      labelData = ZPLGenerator.generateLabel(labelRequest)
      contentType = 'text/plain'
    }

    // In a real implementation, this would send to the printer
    // For now, we return the label data for the client to handle
    return NextResponse.json({
      success: true,
      labelData,
      printerType,
      base64: ZPLGenerator.toBase64(labelData)
    })
  } catch (error) {
    console.error('Print label error:', error)
    return NextResponse.json(
      { error: 'Failed to generate label' },
      { status: 500 }
    )
  }
}

// GET endpoint for test label
export async function GET(request: NextRequest) {
  try {
    const labelData = ZPLGenerator.generateTestLabel()

    return NextResponse.json({
      success: true,
      labelData,
      printerType: 'zebra',
      base64: ZPLGenerator.toBase64(labelData)
    })
  } catch (error) {
    console.error('Test label error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test label' },
      { status: 500 }
    )
  }
}