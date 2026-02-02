<?php
/**
 * Plugin Name: CartConnect for WooCommerce
 * Plugin URI: https://cartconnect.app
 * Description: Automatically share your purchases to CartConnect social shopping app
 * Version: 1.0.0
 * Author: CartConnect
 * Author URI: https://cartconnect.app
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

defined('ABSPATH') || exit;

class CartConnect_WooCommerce {
    
    private static $instance = null;
    private $option_name = 'cartconnect_settings';
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Admin hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // WooCommerce hooks
        add_action('woocommerce_order_status_completed', array($this, 'send_order_to_cartconnect'));
        add_action('woocommerce_order_status_processing', array($this, 'send_order_to_cartconnect'));
    }
    
    /**
     * Add settings page to WooCommerce menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'CartConnect',
            'CartConnect',
            'manage_options',
            'cartconnect',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting($this->option_name, $this->option_name, array(
            'sanitize_callback' => array($this, 'sanitize_settings')
        ));
        
        add_settings_section(
            'cartconnect_main',
            'CartConnect Settings',
            array($this, 'section_callback'),
            'cartconnect'
        );
        
        add_settings_field(
            'webhook_url',
            'Webhook URL',
            array($this, 'webhook_url_callback'),
            'cartconnect',
            'cartconnect_main'
        );
        
        add_settings_field(
            'webhook_secret',
            'Webhook Secret',
            array($this, 'webhook_secret_callback'),
            'cartconnect',
            'cartconnect_main'
        );
        
        add_settings_field(
            'enabled',
            'Enable Integration',
            array($this, 'enabled_callback'),
            'cartconnect',
            'cartconnect_main'
        );
    }
    
    public function sanitize_settings($input) {
        $sanitized = array();
        $sanitized['webhook_url'] = esc_url_raw($input['webhook_url']);
        $sanitized['webhook_secret'] = sanitize_text_field($input['webhook_secret']);
        $sanitized['enabled'] = isset($input['enabled']) ? 1 : 0;
        return $sanitized;
    }
    
    public function section_callback() {
        echo '<p>Connect your WooCommerce store to CartConnect to automatically share purchases.</p>';
    }
    
    public function webhook_url_callback() {
        $options = get_option($this->option_name);
        $value = isset($options['webhook_url']) ? $options['webhook_url'] : '';
        echo '<input type="url" name="' . $this->option_name . '[webhook_url]" value="' . esc_attr($value) . '" class="regular-text" placeholder="https://your-project.supabase.co/functions/v1/webhook-woocommerce" />';
        echo '<p class="description">Your CartConnect webhook URL from the app settings.</p>';
    }
    
    public function webhook_secret_callback() {
        $options = get_option($this->option_name);
        $value = isset($options['webhook_secret']) ? $options['webhook_secret'] : '';
        echo '<input type="password" name="' . $this->option_name . '[webhook_secret]" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">Your webhook secret for secure communication.</p>';
    }
    
    public function enabled_callback() {
        $options = get_option($this->option_name);
        $checked = isset($options['enabled']) && $options['enabled'] ? 'checked' : '';
        echo '<input type="checkbox" name="' . $this->option_name . '[enabled]" value="1" ' . $checked . ' />';
        echo '<label>Send completed orders to CartConnect</label>';
    }
    
    /**
     * Settings page HTML
     */
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>CartConnect for WooCommerce</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields($this->option_name);
                do_settings_sections('cartconnect');
                submit_button();
                ?>
            </form>
            
            <hr>
            <h2>Setup Instructions</h2>
            <ol>
                <li>Log in to your CartConnect app</li>
                <li>Go to Settings → Shop Connections</li>
                <li>Click "Add WooCommerce Store"</li>
                <li>Copy the Webhook URL and Secret</li>
                <li>Paste them above and enable the integration</li>
            </ol>
            
            <h3>Test Connection</h3>
            <button type="button" class="button" id="test-connection">Test Webhook</button>
            <span id="test-result"></span>
            
            <script>
            document.getElementById('test-connection').addEventListener('click', function() {
                var result = document.getElementById('test-result');
                result.textContent = 'Testing...';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: 'action=cartconnect_test'
                })
                .then(response => response.json())
                .then(data => {
                    result.textContent = data.success ? '✓ Connection successful!' : '✗ ' + data.message;
                    result.style.color = data.success ? 'green' : 'red';
                })
                .catch(error => {
                    result.textContent = '✗ Error: ' + error.message;
                    result.style.color = 'red';
                });
            });
            </script>
        </div>
        <?php
    }
    
    /**
     * Send order to CartConnect
     */
    public function send_order_to_cartconnect($order_id) {
        $options = get_option($this->option_name);
        
        // Check if enabled
        if (!isset($options['enabled']) || !$options['enabled']) {
            return;
        }
        
        // Check if webhook URL is set
        if (empty($options['webhook_url'])) {
            return;
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        // Check if already sent
        if ($order->get_meta('_cartconnect_sent')) {
            return;
        }
        
        // Build order data
        $line_items = array();
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            $image_url = '';
            
            if ($product) {
                $image_id = $product->get_image_id();
                if ($image_id) {
                    $image_url = wp_get_attachment_url($image_id);
                }
            }
            
            $line_items[] = array(
                'name' => $item->get_name(),
                'price' => (float) $order->get_item_total($item, true),
                'quantity' => $item->get_quantity(),
                'product_id' => $item->get_product_id(),
                'image' => array('src' => $image_url)
            );
        }
        
        $payload = array(
            'id' => $order_id,
            'order_key' => $order->get_order_key(),
            'billing' => array('email' => $order->get_billing_email()),
            'line_items' => $line_items,
            'total' => $order->get_total(),
            'date_created' => $order->get_date_created()->format('c')
        );
        
        // Create signature
        $signature = base64_encode(hash_hmac('sha256', json_encode($payload), $options['webhook_secret'], true));
        
        // Send webhook
        $response = wp_remote_post($options['webhook_url'], array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-WC-Webhook-Signature' => $signature,
                'X-WC-Webhook-Source' => home_url()
            ),
            'body' => json_encode($payload),
            'timeout' => 30
        ));
        
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $order->update_meta_data('_cartconnect_sent', current_time('mysql'));
            $order->save();
        }
    }
}

// Initialize plugin
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        CartConnect_WooCommerce::get_instance();
    }
});

// AJAX test handler
add_action('wp_ajax_cartconnect_test', function() {
    $options = get_option('cartconnect_settings');
    
    if (empty($options['webhook_url'])) {
        wp_send_json(array('success' => false, 'message' => 'Webhook URL not configured'));
        return;
    }
    
    $response = wp_remote_get($options['webhook_url'], array('timeout' => 10));
    
    if (is_wp_error($response)) {
        wp_send_json(array('success' => false, 'message' => $response->get_error_message()));
    } else {
        wp_send_json(array('success' => true));
    }
});
