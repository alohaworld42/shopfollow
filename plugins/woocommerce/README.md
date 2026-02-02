# CartConnect for WooCommerce

WordPress/WooCommerce plugin that automatically sends completed orders to CartConnect.

## Installation

1. Download this folder or the ZIP file
2. Upload to your WordPress installation at `/wp-content/plugins/cartconnect-for-woocommerce/`
3. Activate the plugin in WordPress Admin → Plugins

## Configuration

1. Go to **WooCommerce → CartConnect** in your WordPress admin
2. Enter your **Webhook URL** from CartConnect app settings
3. Enter your **Webhook Secret** from CartConnect app settings
4. Check **Enable Integration**
5. Save changes

## How it Works

When a customer completes an order (status: `completed` or `processing`), the plugin:

1. Extracts product info (name, price, image)
2. Signs the webhook payload with your secret
3. Sends it to CartConnect
4. CartConnect creates a "pending" item in your inbox
5. You can accept or reject items in the CartConnect app

## Webhook Payload

```json
{
  "id": 12345,
  "order_key": "wc_order_xxx",
  "billing": { "email": "customer@example.com" },
  "line_items": [
    {
      "name": "Product Name",
      "price": 29.99,
      "quantity": 1,
      "product_id": 123,
      "image": { "src": "https://..." }
    }
  ],
  "total": "29.99",
  "date_created": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

**Orders not appearing in CartConnect?**
- Check that the plugin is enabled
- Verify webhook URL and secret are correct
- Use the "Test Connection" button
- Check your server can make outbound HTTPS requests

**Duplicate items?**
- The plugin tracks sent orders via `_cartconnect_sent` meta
- Each order is only sent once
