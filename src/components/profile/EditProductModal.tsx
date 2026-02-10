import { useState } from 'react';
import { Eye, EyeOff, Users, Trash2, ExternalLink } from 'lucide-react';
import { Modal, Button } from '../common';
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
        { value: 'public', label: 'Public', icon: Eye, desc: 'Everyone can see' },
        { value: 'private', label: 'Private', icon: EyeOff, desc: 'Only you' },
        { value: 'group', label: 'Group', icon: Users, desc: 'Only group members' }
    ] as const;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Item">
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Product Preview */}
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover'
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {product.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            {product.storeName}
                        </p>
                        <span style={{
                            background: 'var(--bg-secondary)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                        }}>
                            €{product.price.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Visibility Options */}
                <div>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', display: 'block' }}>
                        Visibility
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {visibilityOptions.map(opt => {
                            const Icon = opt.icon;
                            const isActive = visibility === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setVisibility(opt.value)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-4)',
                                        padding: 'var(--space-4)',
                                        borderRadius: 'var(--radius-md)',
                                        border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--border-primary)'}`,
                                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <Icon size={20} color={isActive ? 'var(--color-primary-light)' : 'var(--text-muted)'} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{opt.desc}</p>
                                    </div>
                                    {isActive && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'var(--color-primary-light)'
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Group Selection */}
                {visibility === 'group' && (
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', display: 'block' }}>
                            Select Group
                        </label>
                        {groups.length === 0 ? (
                            <p style={{
                                fontSize: '14px',
                                color: 'var(--text-muted)',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                No groups available. Create one in the Network tab first.
                            </p>
                        ) : (
                            <select
                                value={selectedGroupId || ''}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '15px',
                                    outline: 'none'
                                }}
                            >
                                <option value="">Select group...</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} ({group.members.length} members)
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
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: '14px',
                        color: 'var(--color-primary-light)',
                        textDecoration: 'none'
                    }}
                >
                    <ExternalLink size={16} />
                    Open in Store
                </a>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border-primary)'
                }}>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        style={{ flex: 1 }}
                    >
                        <Trash2 size={16} />
                        {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        style={{ flex: 1 }}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditProductModal;
