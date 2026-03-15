# Square Image Upload Fix

## Problem
Product images fetched from ISBNdb and UPCitemdb APIs were not being uploaded to Square during catalog sync.

## Root Cause
The initial implementation had several issues:
1. Attempted to use non-existent `uploadCatalogImage` method
2. Tried to update images separately instead of uploading with the catalog image creation
3. Incorrectly handled the Square SDK's FileWrapper API

## Solution
The corrected implementation:
1. Uses Square SDK's `FileWrapper` class correctly
2. Uploads images in a single `createCatalogImage` API call
3. Converts image buffer to Readable stream (required by FileWrapper in SDK v38)
4. Sets `isPrimary: true` to make the uploaded image the main product image

## Key Changes in `/lib/square.ts`

### Import Changes
```typescript
import { Client, Environment, FileWrapper } from 'square'
import { Readable } from 'stream'
```

### Fixed `uploadImageFromUrl` Method
- Downloads image from URL using axios
- Converts ArrayBuffer to Node.js Buffer
- Creates Readable stream from Buffer (required for FileWrapper)
- Uses FileWrapper with the stream
- Calls `createCatalogImage` with both metadata and image file in one request

## Testing

### Manual Testing
1. Ensure Square credentials are set in environment variables:
   - `SQUARE_ACCESS_TOKEN`
   - `SQUARE_LOCATION_ID`

2. Run the test script:
   ```bash
   node test-image-upload.js
   ```

3. Check your Square dashboard to verify:
   - New item appears in catalog
   - Item has the product image attached
   - Image is set as primary

### Production Testing
1. Scan a book ISBN or product UPC
2. Verify image appears in the preview
3. Push to Square
4. Check Square catalog - item should have the image

## Technical Details

### Square SDK Version
Using Square SDK v38.0.0 which uses the FileWrapper pattern for file uploads.

### API Pattern
```typescript
// Correct pattern for SDK v38:
const imageFile = new FileWrapper(readableStream, {
  contentType: 'image/jpeg'
});

await client.catalogApi.createCatalogImage(
  {
    idempotencyKey: uuidv4(),
    image: { /* catalog image metadata */ },
    isPrimary: true
  },
  imageFile  // File data passed as second parameter
);
```

### Error Handling
- Image upload failures don't block item creation
- Errors are logged but item creation continues
- This ensures catalog sync works even if image sources are unavailable

## Files Modified
- `/lib/square.ts` - Fixed image upload implementation
- `test-image-upload.js` - Test script for verification
- `IMAGE_UPLOAD_FIX.md` - This documentation

## Verification Steps
1. Build passes: `npm run build` ✅
2. TypeScript compilation successful ✅
3. Test script can create items with images ✅
4. Production flow maintains backward compatibility ✅