// Test script to trace ISBN lookup and Square push flow
const { ISBNdbClient } = require('./lib/isbndb');
const { SquareClient } = require('./lib/square');
const { v4: uuidv4 } = require('uuid');

async function testISBNFlow() {
  console.log('='.repeat(80));
  console.log('ISBN LOOKUP AND SQUARE PUSH FLOW TEST');
  console.log('='.repeat(80));

  // Test ISBN (Harry Potter and the Sorcerer's Stone)
  const testISBN = '9780439708180';

  console.log('\n1. TESTING ISBN LOOKUP');
  console.log('-'.repeat(40));

  try {
    const isbnClient = new ISBNdbClient();
    const lookupResult = await isbnClient.lookup(testISBN);

    console.log('Lookup Result:');
    console.log(JSON.stringify(lookupResult, null, 2));

    console.log('\n2. CHECKING IMAGE URL');
    console.log('-'.repeat(40));
    console.log('Has imageUrl?', !!lookupResult.imageUrl);
    console.log('Image URL:', lookupResult.imageUrl);

    if (!lookupResult.imageUrl) {
      console.log('⚠️  WARNING: No imageUrl returned from ISBNdb!');
      console.log('This is likely the root cause of the issue.');
    }

    console.log('\n3. CREATING QUEUE ITEM');
    console.log('-'.repeat(40));

    const queueItem = {
      id: uuidv4(),
      lookup: lookupResult,
      condition: 'used',
      priceCents: 999,
      category: 'books',
      addedAt: new Date().toISOString()
    };

    console.log('Queue Item (abbreviated):');
    console.log({
      id: queueItem.id,
      title: queueItem.lookup.title,
      hasImageUrl: !!queueItem.lookup.imageUrl,
      imageUrl: queueItem.lookup.imageUrl
    });

    console.log('\n4. SIMULATING SQUARE PUSH');
    console.log('-'.repeat(40));
    console.log('Would send to Square:');
    console.log('- Title:', queueItem.lookup.title);
    console.log('- Barcode:', queueItem.lookup.barcode);
    console.log('- Image URL:', queueItem.lookup.imageUrl || 'NONE');

    if (process.argv.includes('--push')) {
      console.log('\n5. ACTUALLY PUSHING TO SQUARE');
      console.log('-'.repeat(40));

      const squareClient = new SquareClient();
      const result = await squareClient.createOrUpdateItem(queueItem);

      console.log('Push Result:', result);
    } else {
      console.log('\n(To actually push to Square, run with --push flag)');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.message.includes('API key')) {
      console.log('\nMake sure ISBNDB_API_KEY is set in environment');
    }
  }

  console.log('\n' + '='.repeat(80));
}

// Run the test
testISBNFlow().catch(console.error);