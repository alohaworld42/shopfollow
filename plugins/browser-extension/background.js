// CartConnect Browser Extension - Background Service Worker

// Context menu for right-click on images
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToCartConnect",
        title: "Add to CartConnect",
        contexts: ["image", "selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToCartConnect") {
        // Send message to content script to extract product info
        chrome.tabs.sendMessage(tab.id, {
            action: "extractProduct",
            imageUrl: info.srcUrl,
            selectedText: info.selectionText
        });
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendToCartConnect") {
        sendProductToCartConnect(request.product)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }

    if (request.action === "getSettings") {
        chrome.storage.sync.get(["apiKey", "webhookUrl"], (data) => {
            sendResponse(data);
        });
        return true;
    }
});

async function sendProductToCartConnect(product) {
    const { apiKey, webhookUrl } = await chrome.storage.sync.get(["apiKey", "webhookUrl"]);

    if (!apiKey || !webhookUrl) {
        throw new Error("Please configure CartConnect in extension settings");
    }

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey
        },
        body: JSON.stringify({
            api_key: apiKey,
            product: {
                name: product.name,
                image_url: product.imageUrl,
                price: product.price,
                store_name: product.storeName,
                store_url: product.storeUrl
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add product");
    }

    return response.json();
}
