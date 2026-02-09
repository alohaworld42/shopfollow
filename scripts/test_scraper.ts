
const FUNCTION_URL = 'https://qcmnnfrvujxytcwmnquy.supabase.co/functions/v1/scrape-product';

const urls = [
    'https://www.etsy.com/at/listing/128069217/14k-gold-starburst-diamant-halskette?click_key=b5a7c8c15ef77ad73984af93eda86c209948b3ee%3A128069217&click_sum=d60082e9&external=1&ref=hp_consolidated_gifting_listings-3&sts=1'
];

async function testScraper() {
    console.log('Testing scraper function at:', FUNCTION_URL);

    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);
        try {
            const response = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Success:', response.status);
                // Simplify output for readability
                const simplified = {
                    title: data.title?.substring(0, 50) + '...',
                    image: data.image ? (data.image.length > 50 ? '...' + data.image.slice(-20) : data.image) : '❌ MISSING',
                    price: data.price,
                    method: data.method,
                    error: data.error
                };
                console.log(JSON.stringify(simplified, null, 2));
            } else {
                console.log('❌ Failed:', response.status, data);
            }

        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

testScraper();
