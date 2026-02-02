import { useState } from 'react';
import { Plus, Link, DollarSign, Store, Image } from 'lucide-react';
import { Modal, Button } from '../common';
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
        visibility: Visibility;
        groupId?: string;
    }) => void;
    groups: Group[];
}

const ImportProductForm = ({ isOpen, onClose, onSubmit, groups }: ImportProductFormProps) => {
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [price, setPrice] = useState('');
    const [storeName, setStoreName] = useState('');
    const [storeUrl, setStoreUrl] = useState('');
    const [visibility, setVisibility] = useState<Visibility>('public');
    const [groupId, setGroupId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !imageUrl || !price || !storeName || !storeUrl) return;

        setLoading(true);
        try {
            await onSubmit({
                name,
                images: [imageUrl], // Convert single URL to array
                price: parseFloat(price),
                storeName,
                storeUrl,
                visibility,
                groupId: visibility === 'group' ? groupId : undefined
            });
            // Reset form
            setName('');
            setImageUrl('');
            setPrice('');
            setStoreName('');
            setStoreUrl('');
            setVisibility('public');
            setGroupId('');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Product">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Product Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Product Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Nike Air Max 90"
                            className="w-full p-3 pl-10 rounded-xl bg-dark-700 border border-white/10 text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                            required
                        />
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Image URL</label>
                    <div className="relative">
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full p-3 pl-10 rounded-xl bg-dark-700 border border-white/10 text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                            required
                        />
                        <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    </div>
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-xl mt-2"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                    )}
                </div>

                {/* Price & Store Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Price (€)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="99.99"
                                className="w-full p-3 pl-10 rounded-xl bg-dark-700 border border-white/10 text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                                required
                            />
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Store Name</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="e.g. Nike"
                            className="w-full p-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Store URL */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Product Link</label>
                    <div className="relative">
                        <input
                            type="url"
                            value={storeUrl}
                            onChange={(e) => setStoreUrl(e.target.value)}
                            placeholder="https://shop.com/product/123"
                            className="w-full p-3 pl-10 rounded-xl bg-dark-700 border border-white/10 text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                            required
                        />
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    </div>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Visibility</label>
                    <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as Visibility)}
                        className="w-full p-3 rounded-xl bg-dark-700 border border-white/10 text-white focus:border-primary-500 focus:outline-none"
                    >
                        <option value="public">🌍 Public</option>
                        <option value="private">🔒 Private</option>
                        <option value="group">👥 Group Only</option>
                    </select>
                </div>

                {/* Group Selection */}
                {visibility === 'group' && (
                    <div className="space-y-2 animate-slide-down">
                        <label className="text-sm font-medium text-white/70">Group</label>
                        <select
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            className="w-full p-3 rounded-xl bg-dark-700 border border-white/10 text-white focus:border-primary-500 focus:outline-none"
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
                    className="w-full mt-6"
                    loading={loading}
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </Button>
            </form>
        </Modal>
    );
};

export default ImportProductForm;
