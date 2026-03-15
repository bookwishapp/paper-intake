// Complete end-to-end test of the image upload flow
const axios = require('axios');

async function testCompleteFlow() {
  console.log('='.repeat(80));
  console.log('COMPLETE IMAGE UPLOAD FLOW TEST');
  console.log('='.repeat(80));

  const baseURL = 'http://localhost:3000';

  // Test ISBN (Harry Potter)
  const testISBN = '9780439708180';

  console.log('\n1. SIMULATING ISBN LOOKUP (via API route)');
  console.log('-'.repeat(40));

  try {
    // Call the ISBN lookup API route
    const lookupResponse = await axios.post(`${baseURL}/api/lookup/isbn`, {
      barcode: testISBN
    });

    const lookupResult = lookupResponse.data;

    console.log('API Response:');
    console.log(JSON.stringify(lookupResult, null, 2));

    console.log('\n2. CHECKING IMAGE IN RESPONSE');
    console.log('-'.repeat(40));
    console.log('Has imageUrl?', !!lookupResult.imageUrl);
    console.log('Image URL:', lookupResult.imageUrl);

    if (!lookupResult.imageUrl) {
      console.log('\n⚠️  WARNING: No imageUrl in API response!');
      console.log('The issue is that ISBNdb is not returning images.');
      console.log('\nPossible reasons:');
      console.log('1. ISBNdb doesn\'t have images for this ISBN');
      console.log('2. ISBNdb API plan doesn\'t include images');
      console.log('3. Image field name has changed in ISBNdb API');
    }

    console.log('\n3. SIMULATING SQUARE PUSH');
    console.log('-'.repeat(40));

    const queueItem = {
      id: 'test-' + Date.now(),
      lookup: lookupResult,
      condition: 'used',
      priceCents: 999,
      category: 'books',
      addedAt: new Date().toISOString()
    };

    console.log('Sending to Square API:');
    console.log('- Title:', queueItem.lookup.title);
    console.log('- Has Image URL:', !!queueItem.lookup.imageUrl);

    const pushResponse = await axios.post(`${baseURL}/api/square/push`, {
      items: [queueItem]
    });

    console.log('\n4. SQUARE PUSH RESULT');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(pushResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    console.log('\nMake sure:');
    console.log('1. The app is running (npm run dev)');
    console.log('2. Environment variables are set:');
    console.log('   - ISBNDB_API_KEY');
    console.log('   - SQUARE_ACCESS_TOKEN');
    console.log('   - SQUARE_LOCATION_ID');
  }

  console.log('\n' + '='.repeat(80));
}

// Check if running locally
if (process.argv.includes('--local')) {
  testCompleteFlow().catch(console.error);
} else {
  console.log('Run with --local flag to test against local server');
  console.log('Make sure the app is running with: npm run dev');
}