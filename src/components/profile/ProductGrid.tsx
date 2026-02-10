import { Eye, EyeOff, Users as UsersIcon } from 'lucide-react';
import type { Product } from '../../types';

interface ProductGridProps {
    products: Product[];
    onProductClick: (product: Product) => void;
}

const ProductGrid = ({ products, onProductClick }: ProductGridProps) => {
    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'private':
                return <EyeOff size={14} />;
            case 'group':
                return <UsersIcon size={14} />;
            default:
                return <Eye size={14} />;
        }
    };

    if (products.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <Eye size={32} />
                </div>
                <h3>No products yet</h3>
                <p>Add your first item to get started!</p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-1)',
            marginTop: 'var(--space-4)',
            padding: '0 var(--space-5)'
        }}>
            {products.map((product) => (
                <button
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    style={{
                        position: 'relative',
                        aspectRatio: '1',
                        overflow: 'hidden',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer'
                    }}
                >
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                        }}
                        loading="lazy"
                    />

                    {/* Visibility Badge */}
                    <div style={{
                        position: 'absolute',
                        top: 'var(--space-2)',
                        right: 'var(--space-2)',
                        background: product.visibility === 'public'
                            ? 'rgba(16, 185, 129, 0.8)'
                            : 'rgba(245, 158, 11, 0.8)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {getVisibilityIcon(product.visibility)}
                    </div>

                    {/* Private Overlay */}
                    {product.visibility === 'private' && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(12, 12, 12, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            <EyeOff size={24} color="rgba(255,255,255,0.5)" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};

export default ProductGrid;
