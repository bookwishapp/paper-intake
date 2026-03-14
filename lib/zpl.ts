import { PrintLabelRequest } from '@/types'

export class ZPLGenerator {
  /**
   * Sanitize barcode for Code 128 compatibility
   */
  private static sanitizeBarcode(barcode: string): string {
    // Code 128 can handle alphanumeric, but some special chars might cause issues
    // Remove any problematic characters
    return barcode.replace(/[^A-Za-z0-9\-]/g, '')
  }

  /**
   * Get appropriate barcode type and format based on data
   */
  private static getBarcodeFormat(barcode: string): { type: string; formatted: string } {
    // Check if it's a UPC (12 digits) or EAN/ISBN (13 digits)
    const digitsOnly = barcode.replace(/\D/g, '')

    if (digitsOnly.length === 12 || digitsOnly.length === 13) {
      // Use EAN-13 for numeric barcodes (works for both UPC and ISBN)
      return {
        type: '^BEN,50,Y,N',  // EAN-13 barcode
        formatted: digitsOnly
      }
    } else {
      // Use Code 128 for alphanumeric (like manual SKUs)
      return {
        type: '^BCN,50,Y,N,N',  // Code 128 barcode
        formatted: '>' + this.sanitizeBarcode(barcode)  // '>' forces Code 128 subset B
      }
    }
  }

  /**
   * Generate ZPL code for a 2.25" x 1.25" label
   * Compatible with Zebra thermal printers
   */
  static generateLabel(request: PrintLabelRequest): string {
    const {
      title,
      priceCents,
      condition,
      barcode,
      storeName = 'Paper Street Thrift'
    } = request

    // Get appropriate barcode format
    const barcodeFormat = this.getBarcodeFormat(barcode)

    // Truncate title to 40 chars
    const truncatedTitle = title.length > 40
      ? title.substring(0, 37) + '...'
      : title

    // Format price
    const priceStr = `$${(priceCents / 100).toFixed(2)}`

    // Condition badge
    const conditionStr = condition.toUpperCase()

    // ZPL commands for 2.25" x 1.25" label
    // ^XA = Start of label
    // ^CI28 = UTF-8 encoding
    // ^PW450 = Print width in dots (2.25" x 203dpi = 450)
    // ^LL250 = Label length in dots (1.25" x 203dpi = 250)
    const zpl = `
^XA
^CI28
^PW450
^LL250

~SD20

^FO10,10
^A0N,24,24
^FB430,1,0,C
^FD${storeName}^FS

^FO10,40
^A0N,18,18
^FB430,2,0,L
^FD${truncatedTitle}^FS

^FO10,85
^A0N,32,32
^FD${priceStr}^FS

^FO250,85
^GB100,35,2^FS
^FO255,90
^A0N,22,22
^FD${conditionStr}^FS

^FO20,135
^BY2,2,50
${barcodeFormat.type}
^FD${barcodeFormat.formatted}^FS

^PQ1
^XZ
`.trim()

    return zpl
  }

  /**
   * Generate a test label for printer setup
   */
  static generateTestLabel(): string {
    return ZPLGenerator.generateLabel({
      title: 'Test Item - Sample Product',
      priceCents: 1999,
      condition: 'used',
      barcode: '123456789012',
      storeName: 'Paper Street Thrift'
    })
  }

  /**
   * Convert ZPL to base64 for certain printer drivers
   */
  static toBase64(zpl: string): string {
    return Buffer.from(zpl).toString('base64')
  }

  /**
   * Generate Dymo label XML (alternative to ZPL for Dymo printers)
   * This is a simplified XML format for Dymo Connect
   */
  static generateDymoLabel(request: PrintLabelRequest): string {
    const {
      title,
      priceCents,
      condition,
      barcode,
      storeName = 'Paper Street Thrift'
    } = request

    // Truncate title to 40 chars
    const truncatedTitle = title.length > 40
      ? title.substring(0, 37) + '...'
      : title

    // Format price
    const priceStr = `$${(priceCents / 100).toFixed(2)}`

    // For Dymo, we'd return XML format
    // This is a simplified example - actual Dymo XML is more complex
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>Small30336</Id>
  <PaperName>30336 1 in x 2-1/8 in</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="1440" Height="3060" Rx="270" Ry="270"/>
  </DrawCommands>
  <ObjectInfo>
    <TextObject>
      <Name>StoreName</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>True</UseFullFontHeight>
      <Verticalized>False</Verticalized>
      <StyledText>
        <Element>
          <String>${storeName}</String>
          <Attributes>
            <Font Family="Arial" Size="10" Bold="True"/>
          </Attributes>
        </Element>
      </StyledText>
    </TextObject>
    <TextObject>
      <Name>Title</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <HorizontalAlignment>Left</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>True</UseFullFontHeight>
      <Verticalized>False</Verticalized>
      <StyledText>
        <Element>
          <String>${truncatedTitle}</String>
          <Attributes>
            <Font Family="Arial" Size="8"/>
          </Attributes>
        </Element>
      </StyledText>
    </TextObject>
    <TextObject>
      <Name>Price</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <HorizontalAlignment>Left</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>None</TextFitMode>
      <UseFullFontHeight>True</UseFullFontHeight>
      <Verticalized>False</Verticalized>
      <StyledText>
        <Element>
          <String>${priceStr} - ${condition.toUpperCase()}</String>
          <Attributes>
            <Font Family="Arial" Size="12" Bold="True"/>
          </Attributes>
        </Element>
      </StyledText>
    </TextObject>
    <BarcodeObject>
      <Name>Barcode</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <Text>${barcode}</Text>
      <Type>Code128Auto</Type>
      <Size>Small</Size>
      <TextPosition>Bottom</TextPosition>
      <TextFont Family="Arial" Size="8"/>
      <CheckSumFont Family="Arial" Size="8"/>
      <TextEmbedding>None</TextEmbedding>
      <ECLevel>0</ECLevel>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <QuietZonesPadding Left="0" Right="0" Top="0" Bottom="0"/>
    </BarcodeObject>
  </ObjectInfo>
</DieCutLabel>`

    return xml
  }
}