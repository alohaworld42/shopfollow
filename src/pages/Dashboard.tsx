import { useState, useEffect, useMemo } from 'react';
import { Plus, Grid3X3, List } from 'lucide-react';
import { ProfileHeader, ProductGrid, EditProductModal, ImportProductForm } from '../components/profile';
import { SkeletonProfile, Button } from '../components/common';
import { useAuth, useProducts, useToast } from '../hooks';
import type { Product, Visibility } from '../types';

const Dashboard = () => {
    const { user } = useAuth();
    const { products, loading, fetchUserProducts, updateProduct, deleteProduct, createProduct } = useProducts();
    const { showToast } = useToast();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showImportForm, setShowImportForm] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserProducts(user.uid);
        }
    }, [user, fetchUserProducts]);

    // Calculate total spending
    const totalSpending = useMemo(() => {
        return products.reduce((sum, p) => sum + p.price, 0);
    }, [products]);

    const handleUpdateVisibility = (productId: string, data: { visibility: Visibility; groupId?: string }) => {
        updateProduct(productId, data);
        showToast('success', 'Sichtbarkeit aktualisiert');
    };

    const handleDeleteProduct = (productId: string) => {
        deleteProduct(productId);
        showToast('info', 'Produkt gelöscht');
    };

    const handleImportProduct = async (data: {
        name: string;
        imageUrl: string;
        price: number;
        storeName: string;
        storeUrl: string;
        visibility: Visibility;
        groupId?: string;
    }) => {
        await createProduct(data);
        showToast('success', 'Produkt hinzugefügt!');
        if (user) {
            fetchUserProducts(user.uid);
        }
    };

    if (!user) {
        return (
            <div className="p-4">
                <SkeletonProfile />
            </div>
        );
    }

    return (
        <div className="pb-4">
            {loading ? (
                <div className="p-4">
                    <SkeletonProfile />
                </div>
            ) : (
                <>
                    {/* Profile Header */}
                    <div className="pt-4">
                        <ProfileHeader
                            user={user}
                            productCount={products.length}
                            totalSpending={totalSpending}
                        />
                    </div>

                    {/* Actions */}
                    <div className="px-4 mt-6">
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => setShowImportForm(true)}
                        >
                            <Plus className="w-5 h-5" />
                            Produkt hinzufügen
                        </Button>
                    </div>

                    {/* View Toggle Header */}
                    <div className="flex items-center justify-center gap-8 mt-6 py-3 border-t border-white/10">
                        <button className="flex items-center gap-2 text-primary-400">
                            <Grid3X3 className="w-5 h-5" />
                            <span className="text-sm font-medium">Raster</span>
                        </button>
                    </div>

                    {/* Product Grid */}
                    <ProductGrid
                        products={products}
                        onProductClick={setSelectedProduct}
                    />

                    {/* Edit Product Modal */}
                    <EditProductModal
                        product={selectedProduct}
                        isOpen={!!selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        onUpdate={handleUpdateVisibility}
                        onDelete={handleDeleteProduct}
                        groups={user.groups}
                    />

                    {/* Import Product Form */}
                    <ImportProductForm
                        isOpen={showImportForm}
                        onClose={() => setShowImportForm(false)}
                        onSubmit={handleImportProduct}
                        groups={user.groups}
                    />
                </>
            )}
        </div>
    );
};

export default Dashboard;
