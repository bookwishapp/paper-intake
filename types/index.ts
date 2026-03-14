export type LookupResult = {
  barcode: string
  type: 'isbn' | 'upc'
  title: string
  subtitle?: string
  authors?: string[]
  brand?: string
  publisher?: string
  imageUrl?: string
  retailPriceCents: number | null
}

export type QueueItem = {
  id: string  // uuid
  lookup: LookupResult
  condition: 'used' | 'new'
  priceCents: number
  category: 'book' | 'game' | 'puzzle' | 'paper' | 'other'
  addedAt: string
}

export type Category = 'book' | 'game' | 'puzzle' | 'paper' | 'other'
export type Condition = 'used' | 'new'

export interface ISBNdbBook {
  title?: string
  title_long?: string
  authors?: string[]
  publisher?: string
  image?: string
  msrp?: string | number
  isbn13?: string
  isbn?: string
}

export interface ISBNdbResponse {
  book?: ISBNdbBook
  books?: ISBNdbBook[]
}

export interface UPCItem {
  title?: string
  brand?: string
  images?: string[]
  lowest_recorded_price?: number
  highest_recorded_price?: number
  msrp?: number
  upc?: string
}

export interface UPCItemResponse {
  items?: UPCItem[]
  code?: string
  message?: string
}

export interface SquareCatalogObject {
  type: string
  id: string
  updated_at?: string
  version?: bigint
  is_deleted?: boolean
  custom_attribute_values?: Record<string, any>
  catalog_v1_ids?: any[]
  present_at_all_locations?: boolean
  present_at_location_ids?: string[]
  absent_at_location_ids?: string[]
  item_data?: {
    name?: string
    description?: string
    abbreviation?: string
    label_color?: string
    available_online?: boolean
    available_for_pickup?: boolean
    available_electronically?: boolean
    category_id?: string
    tax_ids?: string[]
    modifier_list_info?: any[]
    variations?: SquareCatalogItemVariation[]
    product_type?: string
    skip_modifier_screen?: boolean
    item_options?: any[]
    image_ids?: string[]
    sort_name?: string
    categories?: any[]
    description_html?: string
    description_plaintext?: string
    is_archived?: boolean
  }
}

export interface SquareCatalogItemVariation {
  type: string
  id?: string
  updated_at?: string
  version?: bigint
  is_deleted?: boolean
  custom_attribute_values?: Record<string, any>
  catalog_v1_ids?: any[]
  present_at_all_locations?: boolean
  present_at_location_ids?: string[]
  absent_at_location_ids?: string[]
  item_variation_data?: {
    item_id?: string
    name?: string
    sku?: string
    upc?: string
    ordinal?: number
    pricing_type?: string
    price_money?: {
      amount?: bigint
      currency?: string
    }
    location_overrides?: any[]
    track_inventory?: boolean
    inventory_alert_type?: string
    inventory_alert_threshold?: bigint
    user_data?: string
    service_duration?: bigint
    available_for_booking?: boolean
    color_hexcode?: string
    color_label?: string
    sellable?: boolean
    stockable?: boolean
  }
}

export interface PrintLabelRequest {
  title: string
  priceCents: number
  condition: Condition
  barcode: string
  storeName?: string
}

export interface BatchPushResult {
  success: number
  failed: number
  errors: Array<{
    item: QueueItem
    error: string
  }>
}