import { useState } from 'react';
import { Plus, Link, DollarSign, Store, Image, Wand2 } from 'lucide-react';
import { Modal, Button } from '../common';
import { supabase } from '../../lib/supabase';
import type { Visibility, Group } from '../../types';

interface ImportProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name: string;
        images: string[];
        price: number;
        storeName: string;
        storeUrl: string;
        category?: string;
        categoryId?: string;
        visibility: Visibility;
        groupId?: string;
        affiliateUrl?: string;
    }) => void;
    groups: Group[];
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-4)',
    paddingLeft: '44px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none'
};

const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-2)',
    display: 'block'
};

const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)'
};

const ImportProductForm = ({ isOpen, onClose, onSubmit, groups }: ImportProductFormProps) => {
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [price, setPrice] = useState('');
    const [storeName, setStoreName] = useState('');
    const [storeUrl, setStoreUrl] = useState('');
    const [category, setCategory] = useState('');
    const [visibility, setVisibility] = useState<Visibility>('public');
    const [groupId, setGroupId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Scraper state
    const [scraping, setScraping] = useState(false);

    const handleScrape = async () => {
        if (!storeUrl) return;
        setScraping(true);
        try {
            const { data, error } = await supabase.functions.invoke('scrape-product', {
                body: { url: storeUrl }
            });

            if (error) throw error;

            // Handle server-side errors returned as 200 OK
            if (data && data.success === false) {
                console.error('Scraper error:', data.error);
                throw new Error(data.error || 'Failed to scrape product');
            }

            // Handle blocked domains
            if (data && data.blocked) {
                alert(`⚠️ ${data.storeName || 'This site'} blocks automated requests.\n\nPlease fill in the product details manually.`);
                if (data.storeName) setStoreName(data.storeName);
                return;
            }

            if (data && data.success) {
                if (!data.title && !data.image && !data.price) {
                    alert('⚠️ Scraper finished but could not find product details.\n\nPlease enter them manually.');
                    return;
                }

                if (data.title) setName(data.title.trim());
                if (data.image) setImageUrl(data.image);
                if (data.price) setPrice(data.price.toString());
                if (data.storeName) setStoreName(data.storeName);

                // Show success toast or small indicator if needed
                // showToast('success', 'Product details found!');
            }
        } catch (error) {
            console.error('Scraping failed:', error);
            const msg = (error as Error).message;
            if (msg.includes('API key')) {
                alert('⚠️ Scraper configuration error: Missing API Key in Supabase.\nPlease add SCRAPER_API_KEY or GEMINI_API_KEY to Edge Function secrets.');
            } else {
                alert('Auto-fill not available for this link. Please enter details manually.');
            }
        } finally {
            setScraping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !imageUrl || !price || !storeName || !storeUrl) return;

        setLoading(true);
        try {
            // Generate affiliate link
            let finalAffiliateUrl = undefined;
            if (storeUrl) {
                try {
                    const { data: affData } = await supabase.functions.invoke('generate-affiliate-link', {
                        body: { url: storeUrl }
                    });
                    if (affData?.success && affData?.affiliatedUrl) {
                        finalAffiliateUrl = affData.affiliatedUrl;
                    }
                } catch (err) {
                    console.warn('Affiliate link generation failed', err);
                }
            }

            await onSubmit({
                name,
                images: [imageUrl],
                price: parseFloat(price),
                storeName,
                storeUrl,
                category,
                visibility,
                groupId: visibility === 'group' ? groupId : undefined,
                affiliateUrl: finalAffiliateUrl
            });
            // Reset form
            setName('');
            setImageUrl('');
            setPrice('');
            setStoreName('');
            setStoreUrl('');
            setCategory('');
            setVisibility('public');
            setGroupId('');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Product">
            <form
                onSubmit={handleSubmit}
                style={{ padding: '0 var(--space-6) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
            >
                {/* 1. Product Link (Top) */}
                <div style={{ padding: 'var(--space-6) 0 0' }}>
                    <label style={labelStyle}>Product Link</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="url"
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                placeholder="https://shop.com/product/123"
                                style={inputStyle}
                                required
                            />
                            <Link size={18} style={iconStyle} />
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleScrape}
                            loading={scraping}
                            disabled={!storeUrl}
                        >
                            <Wand2 size={16} />
                            <span style={{ marginLeft: '8px' }}>Auto-Fill</span>
                        </Button>
                    </div>
                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border-subtle)', marginTop: 'var(--space-6)' }} />
                </div>

                {/* 2. Fetched Details */}

                {/* Product Name */}
                <div>
                    <label style={labelStyle}>Product Name</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Nike Air Max 90"
                            style={inputStyle}
                            required
                        />
                        <Store size={18} style={iconStyle} />
                    </div>
                </div>

                {/* Image Preview / URL Input */}
                <div>
                    <label style={labelStyle}>Product Image</label>
                    {imageUrl ? (
                        <div style={{ position: 'relative' }}>
                            <img
                                src={imageUrl}
                                alt="Preview"
                                style={{
                                    width: '100%',
                                    height: '240px',
                                    objectFit: 'contain',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border-subtle)'
                                }}
                                onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image'}
                            />
                            <button
                                type="button"
                                onClick={() => setImageUrl('')}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(4px)'
                                }}
                                title="Change Image"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="Paste image address if missing..."
                                style={inputStyle}
                                required
                            />
                            <Image size={18} style={iconStyle} />
                        </div>
                    )}
                </div>

                {/* Price & Store Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                        <label style={labelStyle}>Price (€)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="99.99"
                                style={inputStyle}
                                required
                            />
                            <DollarSign size={18} style={iconStyle} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Store Name</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="e.g. Nike"
                            style={{ ...inputStyle, paddingLeft: 'var(--space-4)' }}
                            required
                        />
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label style={labelStyle}>Category</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                ...inputStyle,
                                paddingLeft: 'var(--space-4)',
                                appearance: 'none'
                            }}
                        >
                            <option value="">Select category...</option>
                            {['Fashion', 'Beauty', 'Home', 'Fitness', 'Family', 'Sale'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Store size={18} style={iconStyle} />
                    </div>
                </div>

                {/* Visibility */}
                <div>
                    <label style={labelStyle}>Visibility</label>
                    <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as Visibility)}
                        style={{
                            ...inputStyle,
                            paddingLeft: 'var(--space-4)',
                            appearance: 'none'
                        }}
                    >
                        <option value="public">🌍 Public</option>
                        <option value="private">🔒 Private</option>
                        <option value="group">👥 Group Only</option>
                    </select>
                </div>

                {/* Group Selection */}
                {visibility === 'group' && (
                    <div>
                        <label style={labelStyle}>Group</label>
                        <select
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            style={{
                                ...inputStyle,
                                paddingLeft: 'var(--space-4)',
                                appearance: 'none'
                            }}
                            required
                        >
                            <option value="">Select group...</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Submit */}
                <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    style={{ width: '100%', marginTop: 'var(--space-2)' }}
                >
                    <Plus size={18} />
                    Post Product
                </Button>
            </form>
        </Modal>
    );
};

export default ImportProductForm;
