import { useState } from 'react';
import { Plus, Users, Trash2, Edit3 } from 'lucide-react';
import { Card, Button, Modal } from '../common';
import type { Group } from '../../types';

interface GroupManagerProps {
    groups: Group[];
    onCreate: (name: string, members: string[]) => void;
    onUpdate: (groupId: string, data: Partial<Group>) => void;
    onDelete: (groupId: string) => void;
}

const GroupManager = ({ groups, onCreate, onUpdate, onDelete }: GroupManagerProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupName, setGroupName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) return;

        if (editingGroup) {
            onUpdate(editingGroup.id, { name: groupName.trim() });
        } else {
            onCreate(groupName.trim(), []);
        }

        setGroupName('');
        setEditingGroup(null);
        setIsModalOpen(false);
    };

    const handleEdit = (group: Group) => {
        setEditingGroup(group);
        setGroupName(group.name);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
        setGroupName('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Your Groups
                </h3>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={16} />
                    New Group
                </Button>
            </div>

            {groups.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Users size={32} />
                    </div>
                    <h3>No groups yet</h3>
                    <p>Create groups to share items with specific people</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {groups.map(group => (
                        <Card
                            key={group.id}
                            glass
                            padding="sm"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Users size={20} color="var(--color-primary-light)" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{group.name}</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {group.members.length} members
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button
                                        onClick={() => handleEdit(group)}
                                        style={{
                                            padding: 'var(--space-2)',
                                            borderRadius: '50%',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(group.id)}
                                        style={{
                                            padding: 'var(--space-2)',
                                            borderRadius: '50%',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(239, 68, 68, 0.6)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={editingGroup ? 'Edit Group' : 'Create New Group'}
            >
                <form
                    onSubmit={handleSubmit}
                    style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                            Group Name
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Family, Best Friends"
                            autoFocus
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
                        />
                    </div>

                    <Button type="submit" variant="primary" style={{ width: '100%' }}>
                        {editingGroup ? 'Save' : 'Create'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default GroupManager;
