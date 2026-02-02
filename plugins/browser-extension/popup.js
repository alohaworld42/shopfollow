// CartConnect Browser Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    const webhookUrlInput = document.getElementById('webhookUrl');
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const statusEl = document.getElementById('status');

    // Load saved settings
    const { webhookUrl, apiKey } = await chrome.storage.sync.get(['webhookUrl', 'apiKey']);

    if (webhookUrl) webhookUrlInput.value = webhookUrl;
    if (apiKey) apiKeyInput.value = apiKey;

    // Update status
    updateStatus(webhookUrl && apiKey);

    // Save settings
    saveBtn.addEventListener('click', async () => {
        const newWebhookUrl = webhookUrlInput.value.trim();
        const newApiKey = apiKeyInput.value.trim();

        if (!newWebhookUrl || !newApiKey) {
            alert('Please fill in both fields');
            return;
        }

        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        try {
            // Test connection
            const response = await fetch(newWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': newApiKey
                },
                body: JSON.stringify({
                    api_key: newApiKey,
                    product: {
                        name: 'Connection Test',
                        image_url: 'https://via.placeholder.com/100',
                        price: 0,
                        store_name: 'Test'
                    }
                })
            });

            if (response.ok) {
                await chrome.storage.sync.set({ webhookUrl: newWebhookUrl, apiKey: newApiKey });
                saveBtn.textContent = '✓ Saved!';
                updateStatus(true);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Connection failed');
            }
        } catch (error) {
            saveBtn.textContent = 'Error: ' + error.message;
            updateStatus(false);
        }

        setTimeout(() => {
            saveBtn.textContent = 'Save Settings';
            saveBtn.disabled = false;
        }, 2000);
    });

    function updateStatus(connected) {
        if (connected) {
            statusEl.className = 'status connected';
            statusEl.innerHTML = `
        <div class="status-icon">●</div>
        <div>Connected</div>
      `;
        } else {
            statusEl.className = 'status disconnected';
            statusEl.innerHTML = `
        <div class="status-icon">○</div>
        <div>Not connected</div>
      `;
        }
    }
});
