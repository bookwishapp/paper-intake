# Image Upload Issue - Diagnosis Report

## Executive Summary
After thorough investigation, the root cause needs to be identified through actual runtime testing. Multiple potential failure points have been identified.

## Investigation Completed

### 1. Code Flow Analysis
The flow for image handling is:

1. **ISBN/UPC Lookup** (`/api/lookup/isbn` or `/api/lookup/upc`)
   - ISBNdb maps `book.image` → `lookupResult.imageUrl` (lib/isbndb.ts:76)
   - UPCitemdb maps `item.images?.[0]` → `lookupResult.imageUrl` (lib/upcitemdb.ts:68)

2. **Queue Item Creation** (`components/ReviewModal.tsx:84-91`)
   - Full `lookupResult` (including `imageUrl`) is stored in `QueueItem`

3. **Push to Square** (`/api/square/push`)
   - Queue items are sent with complete `lookup` data
   - `SquareClient.createOrUpdateItem()` checks for `item.lookup.imageUrl`
   - If present, calls `uploadImageFromUrl()`

4. **Image Upload** (`lib/square.ts:281-347`)
   - Downloads image from URL using axios
   - Creates FileWrapper with Readable stream
   - Calls `createCatalogImage` with image data and metadata

### 2. Potential Failure Points

#### A. ISBNdb Not Returning Images
**Most Likely Cause**

The ISBNdb API might not be returning image URLs for some or all books. This could be due to:
- API plan limitations (some plans don't include images)
- ISBNdb doesn't have images for specific ISBNs
- Field name changed in API response

**Test**: Run `node test-isbn-api-raw.js` to check raw API responses

#### B. Image URL Not Being Passed Through
The imageUrl might be getting lost somewhere in the flow:
- Not returned from lookup API
- Not included in queue item
- Not sent to Square push endpoint

**Test**: Check browser DevTools Network tab when scanning an ISBN

#### C. Image Upload Failing Silently
The Square image upload might be failing but not blocking item creation:
- Image download fails (404, timeout, CORS)
- Square API rejects the image
- FileWrapper not working correctly

**Test**: Run `node test-complete-flow.js --local` with app running

#### D. Wrong Image Format/Encoding
Square expects specific image formats:
- JPEG, PJPEG, PNG, or GIF
- Maximum 15MB
- The FileWrapper might not be handling the stream correctly

### 3. Logging Added
Comprehensive logging has been added to track:
- What data is received from ISBN/UPC APIs
- Whether imageUrl is present in queue items
- Image download attempts
- Square API calls and responses
- Any errors during image upload

### 4. Test Scripts Created

1. **test-isbn-api-raw.js** - Tests raw ISBNdb API responses
2. **test-isbn-flow.js** - Tests ISBN lookup and data transformation
3. **test-complete-flow.js** - Tests full end-to-end flow
4. **test-image-upload.js** - Tests direct Square image upload

## Required Actions

### 1. Check ISBNdb API Response
```bash
node test-isbn-api-raw.js
```
This will show if ISBNdb is actually returning image URLs.

### 2. Test Local Flow
```bash
npm run dev
# In another terminal:
node test-complete-flow.js --local
```
This will show the complete flow with all logging.

### 3. Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Scan an ISBN
4. Check the `/api/lookup/isbn` response
5. Look for `imageUrl` in the response

### 4. Check Server Logs
When pushing to Square, check the server console for:
- `[API] First item sample:` - Shows if imageUrl is received
- `[Square] Processing item:` - Shows if imageUrl is present
- `[Square Image]` logs - Shows image upload attempts

## Most Likely Root Cause

Based on the code analysis, the most likely issue is that **ISBNdb is not returning image URLs** in their API responses. This could be due to:

1. **API Plan Limitation**: Your ISBNdb plan might not include image data
2. **Missing Images**: ISBNdb might not have images for the ISBNs you're scanning
3. **API Change**: The field name or structure might have changed

## Recommended Solution

If ISBNdb is not providing images:

1. **Check ISBNdb Account**: Log into ISBNdb and verify your plan includes images
2. **Alternative Image Source**: Use Open Library Covers API as fallback:
   ```
   https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
   ```
3. **Google Books API**: As another fallback option

## Next Steps

1. Run the test scripts to identify where images are being lost
2. Check server logs when pushing to Square
3. Verify ISBNdb API plan includes images
4. If needed, implement fallback image sources