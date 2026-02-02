import { useState } from 'react';
import { Eye, EyeOff, Users, Trash2, ExternalLink } from 'lucide-react';
import { Modal, Button, Badge } from '../common';
import type { Product, Visibility, Group } from '../../types';

interface EditProductModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (productId: string, data: { visibility: Visibility; groupId?: string }) => void;
    onDelete: (productId: string) => void;
    groups: Group[];
}

const EditProductModal = ({
    product,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    groups
}: EditProductModalProps) => {
    const [visibility, setVisibility] = useState<Visibility>(product?.visibility || 'public');
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(product?.groupId);
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!product) return null;

    const handleSave = () => {
        onUpdate(product.id, {
            visibility,
            groupId: visibility === 'group' ? selectedGroupId : undefined
        });
        onClose();
    };

    const handleDelete = () => {
        if (confirmDelete) {
            onDelete(product.id);
            onClose();
        } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000);
        }
    };

    const visibilityOptions = [
        { value: 'public', label: 'Öffentlich', icon: Eye, desc: 'Alle können sehen' },
        { value: 'private', label: 'Privat', icon: EyeOff, desc: 'Nur du' },
        { value: 'group', label: 'Gruppe', icon: Users, desc: 'Nur Gruppenmitglieder' }
    ] as const;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Item bearbeiten">
            <div className="p-6 space-y-6">
                {/* Product Preview */}
                <div className="flex gap-4">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                        <h3 className="font-semibold text-white">{product.name}</h3>
                        <p className="text-sm text-white/50">{product.storeName}</p>
                        <Badge variant="price" size="sm" className="mt-2">
                            €{product.price.toFixed(2)}
                        </Badge>
                    </div>
                </div>

                {/* Visibility Options */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Sichtbarkeit</label>
                    <div className="grid gap-2">
                        {visibilityOptions.map(opt => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setVisibility(opt.value)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${visibility === opt.value
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${visibility === opt.value ? 'text-primary-400' : 'text-white/50'
                                        }`} />
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-white">{opt.label}</p>
                                        <p className="text-xs text-white/50">{opt.desc}</p>
                                    </div>
                                    {visibility === opt.value && (
                                        <div className="w-2 h-2 rounded-full bg-primary-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Group Selection */}
                {visibility === 'group' && (
                    <div className="space-y-2 animate-slide-down">
                        <label className="text-sm font-medium text-white/70">Gruppe auswählen</label>
                        {groups.length === 0 ? (
                            <p className="text-sm text-white/40 p-3 bg-dark-700 rounded-xl">
                                Keine Gruppen vorhanden. Erstelle zuerst eine Gruppe im Netzwerk-Tab.
                            </p>
                        ) : (
                            <select
                                value={selectedGroupId || ''}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="w-full p-3 rounded-xl bg-dark-700 border border-white/10 text-white focus:border-primary-500 focus:outline-none"
                            >
                                <option value="">Gruppe wählen...</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} ({group.members.length} Mitglieder)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Shop Link */}
                <a
                    href={product.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
                >
                    <ExternalLink className="w-4 h-4" />
                    Im Shop öffnen
                </a>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4" />
                        {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="flex-1"
                    >
                        Speichern
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditProductModal;
