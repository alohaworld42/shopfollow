// CartConnect Browser Extension - Content Script

// Product extraction logic for various e-commerce sites
const productExtractors = {
    // Amazon
    amazon: () => ({
        name: document.querySelector('#productTitle')?.textContent?.trim(),
        price: parsePrice(document.querySelector('.a-price-whole')?.textContent),
        imageUrl: document.querySelector('#landingImage')?.src || document.querySelector('#imgBlkFront')?.src,
    }),

    // eBay
    ebay: () => ({
        name: document.querySelector('.x-item-title__mainTitle')?.textContent?.trim(),
        price: parsePrice(document.querySelector('.x-price-primary')?.textContent),
        imageUrl: document.querySelector('.ux-image-carousel-item img')?.src,
    }),

    // Generic - tries common patterns
    generic: () => ({
        name: findProductName(),
        price: findProductPrice(),
        imageUrl: findProductImage(),
    })
};

// Helper functions
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.replace(/[^\d.,]/g, '').replace(',', '.').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
}

function findProductName() {
    const selectors = [
        'h1[itemprop="name"]',
        'h1.product-title',
        'h1.product-name',
        '.product-title h1',
        '[data-testid="product-title"]',
        'h1'
    ];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim().length > 3) {
            return el.textContent.trim().substring(0, 200);
        }
    }

    return document.title.split('|')[0].split('-')[0].trim();
}

function findProductPrice() {
    const selectors = [
        '[itemprop="price"]',
        '.product-price',
        '.price',
        '[data-testid="price"]',
        '.current-price',
        'span[class*="price"]'
    ];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
            const price = parsePrice(el.textContent || el.getAttribute('content'));
            if (price > 0) return price;
        }
    }

    return 0;
}

function findProductImage() {
    const selectors = [
        'img[itemprop="image"]',
        '.product-image img',
        '.gallery-image img',
        '[data-testid="product-image"] img',
        'img.product-image',
        '#product-image',
        'img[class*="product"]'
    ];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.src && !el.src.includes('placeholder')) {
            return el.src;
        }
    }

    // Fallback: largest image on page
    const images = Array.from(document.querySelectorAll('img'))
        .filter(img => img.naturalWidth > 200 && img.naturalHeight > 200)
        .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));

    return images[0]?.src || '';
}

function getExtractor() {
    const hostname = window.location.hostname;

    if (hostname.includes('amazon')) return productExtractors.amazon;
    if (hostname.includes('ebay')) return productExtractors.ebay;

    return productExtractors.generic;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractProduct") {
        const extractor = getExtractor();
        const extracted = extractor();

        const product = {
            name: extracted.name || request.selectedText || 'Unknown Product',
            imageUrl: request.imageUrl || extracted.imageUrl || '',
            price: extracted.price || 0,
            storeName: window.location.hostname.replace('www.', ''),
            storeUrl: window.location.href
        };

        // Show confirmation popup
        showConfirmationPopup(product);
    }
});

// Floating confirmation popup
function showConfirmationPopup(product) {
    // Remove existing popup
    const existing = document.getElementById('cartconnect-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'cartconnect-popup';
    popup.innerHTML = `
    <div class="cartconnect-popup-content">
      <div class="cartconnect-popup-header">
        <span>Add to CartConnect</span>
        <button class="cartconnect-close">&times;</button>
      </div>
      <div class="cartconnect-popup-body">
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="">` : ''}
        <div class="cartconnect-product-info">
          <input type="text" id="cartconnect-name" value="${escapeHtml(product.name)}" placeholder="Product name">
          <input type="number" id="cartconnect-price" value="${product.price}" step="0.01" placeholder="Price">
        </div>
      </div>
      <div class="cartconnect-popup-footer">
        <button class="cartconnect-cancel">Cancel</button>
        <button class="cartconnect-submit">Add Product</button>
      </div>
    </div>
  `;

    document.body.appendChild(popup);

    // Event listeners
    popup.querySelector('.cartconnect-close').addEventListener('click', () => popup.remove());
    popup.querySelector('.cartconnect-cancel').addEventListener('click', () => popup.remove());

    popup.querySelector('.cartconnect-submit').addEventListener('click', async () => {
        const submitBtn = popup.querySelector('.cartconnect-submit');
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;

        const finalProduct = {
            ...product,
            name: document.getElementById('cartconnect-name').value,
            price: parseFloat(document.getElementById('cartconnect-price').value) || 0
        };

        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { action: "sendToCartConnect", product: finalProduct },
                    (response) => {
                        if (response.success) resolve(response.result);
                        else reject(new Error(response.error));
                    }
                );
            });

            submitBtn.textContent = '✓ Added!';
            setTimeout(() => popup.remove(), 1500);
        } catch (error) {
            submitBtn.textContent = 'Error: ' + error.message;
            submitBtn.disabled = false;
            setTimeout(() => submitBtn.textContent = 'Add Product', 3000);
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
