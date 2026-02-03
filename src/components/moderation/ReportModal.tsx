import { useState } from 'react';
import { Flag, X, AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../common';
import { useAuth } from '../../hooks';
import {
    reportProduct,
    reportComment,
    reportUser,
    type ReportReason
} from '../../services/moderationService';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'product' | 'comment' | 'user';
    targetId: string;
    targetName?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
    { value: 'spam', label: 'Spam', description: 'Unwanted promotional content' },
    { value: 'inappropriate', label: 'Inappropriate', description: 'Offensive or inappropriate content' },
    { value: 'harassment', label: 'Harassment', description: 'Bullying or targeting someone' },
    { value: 'nsfw', label: 'NSFW Content', description: 'Adult or explicit content' },
    { value: 'scam', label: 'Scam', description: 'Fraudulent or misleading content' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { value: 'other', label: 'Other', description: 'Something else not listed' },
];

const ReportModal = ({
    isOpen,
    onClose,
    targetType,
    targetId,
    targetName,
}: ReportModalProps) => {
    const { user } = useAuth();
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!user || !selectedReason) return;

        setLoading(true);
        setError(null);

        try {
            const desc = description.trim() || undefined;

            switch (targetType) {
                case 'product':
                    await reportProduct(user.uid, targetId, selectedReason, desc);
                    break;
                case 'comment':
                    await reportComment(user.uid, targetId, selectedReason, desc);
                    break;
                case 'user':
                    await reportUser(user.uid, targetId, selectedReason, desc);
                    break;
            }

            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit report. Please try again.');
            console.error('Report error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedReason(null);
        setDescription('');
        setSubmitted(false);
        setError(null);
        onClose();
    };

    const getTitle = () => {
        switch (targetType) {
            case 'product': return 'Report Product';
            case 'comment': return 'Report Comment';
            case 'user': return 'Report User';
        }
    };

    if (submitted) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Report Submitted">
                <div style={{
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Flag size={28} color="var(--color-success)" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Thank you for reporting
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                        We'll review this report and take action if it violates our community guidelines.
                    </p>
                    <Button variant="primary" onClick={handleClose} style={{ marginTop: 'var(--space-2)' }}>
                        Done
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
            <div style={{
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-5)'
            }}>
                {targetName && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Reporting: <strong>{targetName}</strong>
                    </p>
                )}

                {/* Reason Selection */}
                <div>
                    <label style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-3)',
                        display: 'block'
                    }}>
                        Why are you reporting this?
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {REPORT_REASONS.map(reason => (
                            <button
                                key={reason.value}
                                onClick={() => setSelectedReason(reason.value)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3) var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${selectedReason === reason.value ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                                    background: selectedReason === reason.value ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>
                                        {reason.label}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {reason.description}
                                    </p>
                                </div>
                                {selectedReason === reason.value && (
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: 'var(--color-primary-light)'
                                    }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Additional Details */}
                {selectedReason === 'other' && (
                    <div>
                        <label style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-2)',
                            display: 'block'
                        }}>
                            Additional details (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please describe the issue..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                resize: 'none',
                                outline: 'none'
                            }}
                        />
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)'
                    }}>
                        <AlertTriangle size={16} />
                        <span style={{ fontSize: '13px' }}>{error}</span>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    variant="danger"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={!selectedReason}
                    style={{ width: '100%' }}
                >
                    <Flag size={16} />
                    Submit Report
                </Button>

                <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                }}>
                    False reports may result in action against your account
                </p>
            </div>
        </Modal>
    );
};

export default ReportModal;
