// Test script to verify Square image upload functionality
const { SquareClient } = require('./lib/square');

async function testImageUpload() {
  console.log('Testing Square image upload functionality...\n');

  // Sample test data
  const testItem = {
    id: 'test-' + Date.now(),
    lookup: {
      barcode: 'TEST-' + Date.now(),
      type: 'isbn',
      title: 'Test Book with Image',
      authors: ['Test Author'],
      publisher: 'Test Publisher',
      // Using a sample book cover image from Open Library
      imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140328721-L.jpg',
      retailPriceCents: 1999
    },
    condition: 'used',
    priceCents: 999,
    category: 'books',
    addedAt: new Date().toISOString()
  };

  try {
    console.log('Item details:');
    console.log('- Title:', testItem.lookup.title);
    console.log('- Barcode:', testItem.lookup.barcode);
    console.log('- Image URL:', testItem.lookup.imageUrl);
    console.log('- Price:', '$' + (testItem.priceCents / 100).toFixed(2));
    console.log('\n');

    // Initialize Square client
    const client = new SquareClient();

    console.log('Creating item in Square catalog with image...');
    const result = await client.createOrUpdateItem(testItem);

    if (result.success) {
      console.log('✅ Success! Item created with image in Square catalog.');
      console.log('\nPlease check your Square dashboard to verify:');
      console.log('1. The item "' + testItem.lookup.title + '" is created');
      console.log('2. The item has the book cover image attached');
      console.log('3. The SKU is set to: ' + testItem.lookup.barcode);
    } else {
      console.log('❌ Failed to create item:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('required')) {
      console.log('\nMake sure your Square credentials are configured:');
      console.log('- SQUARE_ACCESS_TOKEN');
      console.log('- SQUARE_LOCATION_ID');
    }
  }
}

// Run the test
testImageUpload().catch(console.error);