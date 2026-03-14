BUILD: Paper Street Thrift Inventory Intake Tool

Build a new Next.js 14 (App Router) project called `paper-intake`. Deploy target is Railway. Use Tailwind CSS. TypeScript throughout. No database — Square is the source of truth, session queue lives in localStorage.

---

ENVIRONMENT VARIABLES NEEDED

```
ISBNDB_API_KEY=
SQUARE_ACCESS_TOKEN=
SQUARE_LOCATION_ID=
UPCITEMDB_API_KEY=
```

---

CORE FLOW

1. Barcode input — full-page keyboard listener captures HID scanner input (characters buffered until Enter). Input field always has focus. Debounce 100ms to prevent duplicates. Auto-detect type: barcodes starting with 978 or 979 are ISBNs and route to ISBNdb. All others route to UPCitemdb.

2. Lookup API routes
   - POST /api/lookup/isbn — calls ISBNdb, returns { title, authors, publisher, imageUrl, retailPriceCents }
   - POST /api/lookup/upc — calls UPCitemdb, returns { title, brand, imageUrl, retailPriceCents } (retailPrice may be null)
   - Both return a normalized LookupResult type. If lookup fails or returns no price, return result with retailPriceCents: null so UI can prompt manual entry.

3. Review card modal — appears after scan. Shows:
   - Item image (or placeholder)
   - Editable title field
   - Condition toggle: Used (default) / New — toggle is prominent, not buried
   - Price display: Used defaults to 50% of retail, New defaults to 100%. Both are editable number inputs in dollars. If no retail price found, price field starts empty and is required.
   - Category dropdown: Book / Game / Puzzle / Paper Goods / Other
   - [Add to Queue] button — adds to session queue and closes modal, ready for next scan
   - [Skip] button — dismisses without adding

4. Session queue — displayed as a list below the scan area. Each row shows: thumbnail, title, condition badge, price, category, and a remove button. Queue persists in localStorage. Shows running item count and total retail value.

5. Push to Square — POST /api/square/push endpoint. For each item in queue:
   - Search Square catalog for existing item by barcode/UPC first to avoid duplicates
   - If not found: create CatalogItem and CatalogItemVariation with price, condition, and category as custom attribute
   - If found: update price on existing variation
   - After successful push, clear queue and show success summary showing how many items were added
   - Handle errors per-item and report failures without blocking successes

6. Print label — POST /api/print/label generates ZPL for Zebra OR uses Dymo Connect SDK for Dymo. Label contains: title (truncated to 40 chars), price, condition, barcode (Code 128 of the original scan), and store name "Paper Street Thrift". Label size: 2.25" x 1.25". Print button appears both on the review card (print immediately) and on each queue row (reprint).

7. Admin panel — accessible via /admin route, no auth needed (internal tool). Contains one function: Clear Square Catalog. Button labeled "Delete All Square Catalog Items". Requires typing DELETE in a confirmation input before the button activates. On confirm: fetches all catalog object IDs and deletes them in batches of 200 via batchDeleteCatalogObjects. Shows progress and final count of deleted items.

---

TYPE DEFINITIONS TO CREATE

```typescript
type LookupResult = {
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

type QueueItem = {
  id: string  // uuid
  lookup: LookupResult
  condition: 'used' | 'new'
  priceCents: number
  category: 'book' | 'game' | 'puzzle' | 'paper' | 'other'
  addedAt: string
}
```

---

PROJECT STRUCTURE

```
paper-intake/
├── app/
│   ├── page.tsx                  # Main scan + queue UI
│   ├── admin/page.tsx            # Square catalog wipe
│   └── api/
│       ├── lookup/isbn/route.ts
│       ├── lookup/upc/route.ts
│       ├── square/push/route.ts
│       └── print/label/route.ts
├── components/
│   ├── BarcodeListener.tsx       # Global keypress capture
│   ├── ReviewModal.tsx           # Post-scan review card
│   ├── QueueList.tsx             # Session queue display
│   └── ConditionToggle.tsx       # Used/New toggle
├── lib/
│   ├── isbndb.ts                 # ISBNdb client
│   ├── upcitemdb.ts              # UPCitemdb client
│   ├── square.ts                 # Square Catalog client (write-focused)
│   ├── zpl.ts                    # ZPL label generator, storeName defaults to "Paper Street Thrift"
│   └── queue.ts                  # localStorage queue helpers
├── types/
│   └── index.ts                  # LookupResult, QueueItem, and all shared types
└── railway.toml                  # Railway deployment config
```

---

UI NOTES

- Store name displayed in header: Paper Street Thrift
- Dark background, high contrast — this is used in a store, possibly in bright light or glare
- Large tap targets — operator may be moving fast or wearing gloves
- Scan area should show last scanned barcode prominently so operator knows it registered
- Queue count badge in header always visible
- No login, no auth — this is an internal store tool

---

Build all files. Make the app runnable. Use placeholder/mock API calls where keys are not present so the UI is fully testable before real API keys are configured. Do not leave stubs — every component should render and every button should do something.
