// Test script to check raw ISBNdb API response
const axios = require('axios');

async function testRawISBNdbAPI() {
  console.log('='.repeat(80));
  console.log('RAW ISBNdb API TEST');
  console.log('='.repeat(80));

  const apiKey = process.env.ISBNDB_API_KEY;

  if (!apiKey) {
    console.error('❌ ISBNDB_API_KEY environment variable not set');
    return;
  }

  // Test with multiple ISBNs
  const testISBNs = [
    '9780439708180', // Harry Potter and the Sorcerer's Stone
    '9780140328721', // Fantastic Mr. Fox
    '9780545010221', // Harry Potter and the Deathly Hallows
  ];

  for (const isbn of testISBNs) {
    console.log(`\nTesting ISBN: ${isbn}`);
    console.log('-'.repeat(40));

    try {
      const response = await axios.get(
        `https://api2.isbndb.com/book/${isbn}`,
        {
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const book = response.data.book || response.data.books?.[0];

      if (book) {
        console.log('Title:', book.title || book.title_long);
        console.log('Authors:', book.authors);
        console.log('Publisher:', book.publisher);
        console.log('Has "image" field?:', 'image' in book);
        console.log('Image value:', book.image);

        // Check other possible image fields
        const possibleImageFields = [
          'image', 'cover', 'thumbnail', 'image_url',
          'cover_url', 'thumbnail_url', 'images'
        ];

        console.log('\nChecking all possible image fields:');
        for (const field of possibleImageFields) {
          if (field in book) {
            console.log(`  ${field}:`, book[field]);
          }
        }

        console.log('\nFull book object:');
        console.log(JSON.stringify(book, null, 2));
      } else {
        console.log('No book data found');
      }
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
}

// Run the test
testRawISBNdbAPI().catch(console.error);