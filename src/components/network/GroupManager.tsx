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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Deine Gruppen</h3>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    Neue Gruppe
                </Button>
            </div>

            {groups.length === 0 ? (
                <Card glass className="text-center py-8">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">Noch keine Gruppen erstellt</p>
                    <p className="text-sm text-white/30 mt-1">
                        Erstelle Gruppen, um Items gezielt zu teilen
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {groups.map(group => (
                        <Card
                            key={group.id}
                            glass
                            padding="sm"
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-secondary-500/30 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{group.name}</p>
                                    <p className="text-xs text-white/50">{group.members.length} Mitglieder</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleEdit(group)}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <Edit3 className="w-4 h-4 text-white/50" />
                                </button>
                                <button
                                    onClick={() => onDelete(group.id)}
                                    className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400/50 hover:text-red-400" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Gruppenname</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="z.B. Familie, Beste Freunde"
                            className="w-full p-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                            autoFocus
                        />
                    </div>

                    <Button type="submit" variant="primary" className="w-full">
                        {editingGroup ? 'Speichern' : 'Erstellen'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default GroupManager;
