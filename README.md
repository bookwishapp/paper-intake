# Paper Street Thrift - Inventory Intake System

A Next.js 14 application for managing thrift store inventory with barcode scanning, Square catalog integration, and label printing capabilities.

## Features

- **Barcode Scanning**: Capture HID scanner input with automatic ISBN/UPC detection
- **Product Lookup**: Integrated with ISBNdb (for books) and UPCitemdb free tier (for general products)
- **Square Integration**: Push inventory directly to Square catalog
- **Label Printing**: Generate ZPL (Zebra) or XML (Dymo) labels
- **Session Queue**: Manage items before pushing to Square with localStorage persistence
- **Admin Panel**: Clear Square catalog with safety confirmation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Square account (required for Square features)
- ISBNdb API key (required for ISBN lookups)
- UPCitemdb uses free tier (no API key needed!)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd paper-intake
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables example:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
ISBNDB_API_KEY=your_isbndb_key      # Required for ISBN lookups
SQUARE_ACCESS_TOKEN=your_square_token # Required for Square integration
SQUARE_LOCATION_ID=your_location_id   # Required for Square integration
# Note: UPCitemDB uses free tier - no API key needed!
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Scanning Items

1. Connect a USB barcode scanner (or use keyboard input)
2. The scanner input is automatically captured on the main page
3. Scan an ISBN (starting with 978/979) or UPC code
4. Review and edit the item details in the modal
5. Add to queue or skip

### Managing the Queue

- View all queued items with thumbnails and details
- Remove individual items with the trash icon
- Print labels for individual items
- Push entire queue to Square catalog

### Admin Functions

- Navigate to `/admin` from the settings icon
- Type "DELETE" to confirm catalog clearing
- View system status and API configuration

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## API Endpoints

- `POST /api/lookup/isbn` - Look up book by ISBN
- `POST /api/lookup/upc` - Look up product by UPC
- `POST /api/square/push` - Push items to Square catalog
- `DELETE /api/square/push` - Clear Square catalog
- `POST /api/print/label` - Generate label data
- `GET /api/print/label` - Generate test label

## Project Structure

```
paper-intake/
├── app/
│   ├── page.tsx              # Main scanning interface
│   ├── admin/page.tsx        # Admin panel
│   └── api/                  # API routes
├── components/
│   ├── BarcodeListener.tsx   # Scanner input handler
│   ├── ReviewModal.tsx       # Item review/edit modal
│   ├── QueueList.tsx        # Queue display
│   └── ConditionToggle.tsx  # Used/New selector
├── lib/
│   ├── isbndb.ts            # ISBNdb API client
│   ├── upcitemdb.ts         # UPCitemdb API client
│   ├── square.ts            # Square API client
│   ├── zpl.ts              # Label generation
│   └── queue.ts            # LocalStorage queue
└── types/
    └── index.ts            # TypeScript definitions
```

## API Configuration

- **UPCitemDB**: Uses the free trial endpoint - no configuration needed!
- **ISBNdb**: Requires an API key from https://isbndb.com/
- **Square**: Requires access token and location ID from Square Developer Dashboard

## Label Printing

The app generates label data in two formats:
- **ZPL**: For Zebra thermal printers (2.25" x 1.25" labels)
- **Dymo XML**: For Dymo label printers

Currently, labels are downloaded as files. For production use, integrate with a print server or browser print API.

## Security Notes

- No authentication is implemented (internal tool assumption)
- API keys should be kept secure and never committed to git
- Admin functions require explicit confirmation
- All Square operations are logged

## License

Internal use only - Paper Street Thrift

## Support

For issues or questions, please contact the development team.