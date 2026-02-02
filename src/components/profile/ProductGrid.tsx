import { Eye, EyeOff, Users as UsersIcon } from 'lucide-react';
import { Badge } from '../common';
import type { Product } from '../../types';

interface ProductGridProps {
    products: Product[];
    onProductClick: (product: Product) => void;
}

const ProductGrid = ({ products, onProductClick }: ProductGridProps) => {
    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'private':
                return <EyeOff className="w-4 h-4" />;
            case 'group':
                return <UsersIcon className="w-4 h-4" />;
            default:
                return <Eye className="w-4 h-4" />;
        }
    };

    if (products.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
                    <Eye className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/50">Noch keine Produkte</p>
                <p className="text-sm text-white/30 mt-1">Füge dein erstes Item hinzu!</p>
            </div>
        );
    }

    return (
        <div className="profile-grid mt-4 px-4">
            {products.map((product) => (
                <button
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="profile-grid-item group"
                >
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                    />

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="text-white text-sm font-medium">€{product.price.toFixed(0)}</span>
                    </div>

                    {/* Visibility Badge */}
                    <div className="absolute top-2 right-2">
                        <Badge
                            variant={product.visibility === 'public' ? 'success' : 'warning'}
                            size="sm"
                        >
                            {getVisibilityIcon(product.visibility)}
                        </Badge>
                    </div>

                    {/* Private Overlay */}
                    {product.visibility === 'private' && (
                        <div className="absolute inset-0 bg-dark-900/40 flex items-center justify-center pointer-events-none">
                            <EyeOff className="w-6 h-6 text-white/50" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};

export default ProductGrid;
