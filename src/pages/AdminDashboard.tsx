import { useState, useEffect } from 'react';
import {
    Shield, Flag, Users, Package, MessageSquare,
    AlertTriangle, CheckCircle, XCircle, Eye, Ban,
    Search, Filter, RefreshCw, ChevronDown
} from 'lucide-react';
import { Button, Card } from '../components/common';
import { useAuth } from '../hooks';
import { supabase } from '../lib/supabase';

interface ModerationFlag {
    id: string;
    reporter_id: string;
    reported_product_id?: string;
    reported_comment_id?: string;
    reported_user_id?: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
    created_at: string;
    reporter?: { display_name: string; avatar_url: string };
    reported_product?: { name: string; image_url: string };
    reported_user?: { display_name: string; avatar_url: string };
}

interface AdminStats {
    pendingReports: number;
    flaggedProducts: number;
    suspendedUsers: number;
    totalReportsToday: number;
}

const AdminDashboard = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<ModerationFlag[]>([]);
    const [stats, setStats] = useState<AdminStats>({
        pendingReports: 0,
        flaggedProducts: 0,
        suspendedUsers: 0,
        totalReportsToday: 0,
    });
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ModerationFlag | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.uid)
            .single();

        if (data?.is_admin) {
            setIsAdmin(true);
            loadStats();
            loadReports();
        } else {
            setIsAdmin(false);
            setLoading(false);
        }
    };

    const loadStats = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingRes, flaggedRes, suspendedRes, todayRes] = await Promise.all([
            supabase.from('moderation_flags').select('id', { count: 'exact' }).eq('status', 'pending'),
            supabase.from('products').select('id', { count: 'exact' }).eq('moderation_status', 'flagged'),
            supabase.from('profiles').select('id', { count: 'exact' }).eq('is_suspended', true),
            supabase.from('moderation_flags').select('id', { count: 'exact' }).gte('created_at', today.toISOString()),
        ]);

        setStats({
            pendingReports: pendingRes.count || 0,
            flaggedProducts: flaggedRes.count || 0,
            suspendedUsers: suspendedRes.count || 0,
            totalReportsToday: todayRes.count || 0,
        });
    };

    const loadReports = async () => {
        setLoading(true);

        let query = supabase
            .from('moderation_flags')
            .select(`
                *,
                reporter:profiles!reporter_id(display_name, avatar_url),
                reported_product:products!reported_product_id(name, image_url),
                reported_user:profiles!reported_user_id(display_name, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (!error && data) {
            setReports(data as unknown as ModerationFlag[]);
        }
        setLoading(false);
    };

    const handleAction = async (reportId: string, action: 'reviewed' | 'actioned' | 'dismissed') => {
        await supabase
            .from('moderation_flags')
            .update({
                status: action,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.uid,
            })
            .eq('id', reportId);

        // Reload reports
        loadReports();
        loadStats();
        setSelectedReport(null);
    };

    const handleBanUser = async (userId: string) => {
        await supabase
            .from('profiles')
            .update({
                is_suspended: true,
                suspension_reason: 'Violated community guidelines',
            })
            .eq('id', userId);

        loadStats();
    };

    const handleRemoveProduct = async (productId: string) => {
        await supabase
            .from('products')
            .update({ moderation_status: 'rejected' })
            .eq('id', productId);

        loadStats();
    };

    if (!isAdmin) {
        return (
            <div className="page-container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 'var(--space-6)'
            }}>
                <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <Shield size={48} color="var(--color-error)" style={{ marginBottom: 'var(--space-4)' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                        Access Denied
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        You don't have permission to access this page.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ padding: 'var(--space-5)' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                }}>
                    <Shield size={28} />
                    Moderation Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                    Review and manage reported content
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)'
            }}>
                <StatCard
                    icon={<Flag size={20} />}
                    label="Pending Reports"
                    value={stats.pendingReports}
                    color="var(--color-warning)"
                />
                <StatCard
                    icon={<Package size={20} />}
                    label="Flagged Products"
                    value={stats.flaggedProducts}
                    color="var(--color-error)"
                />
                <StatCard
                    icon={<Users size={20} />}
                    label="Suspended Users"
                    value={stats.suspendedUsers}
                    color="var(--text-muted)"
                />
                <StatCard
                    icon={<AlertTriangle size={20} />}
                    label="Reports Today"
                    value={stats.totalReportsToday}
                    color="var(--color-primary)"
                />
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
                alignItems: 'center'
            }}>
                <Button
                    variant={filter === 'pending' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => { setFilter('pending'); loadReports(); }}
                >
                    Pending
                </Button>
                <Button
                    variant={filter === 'reviewed' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => { setFilter('reviewed'); loadReports(); }}
                >
                    Reviewed
                </Button>
                <Button
                    variant={filter === 'all' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => { setFilter('all'); loadReports(); }}
                >
                    All
                </Button>
                <div style={{ flex: 1 }} />
                <Button variant="secondary" size="sm" onClick={() => { loadReports(); loadStats(); }}>
                    <RefreshCw size={16} />
                    Refresh
                </Button>
            </div>

            {/* Reports List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                        Loading reports...
                    </div>
                ) : reports.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <CheckCircle size={48} color="var(--color-success)" style={{ marginBottom: 'var(--space-4)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>No reports to review</p>
                    </Card>
                ) : (
                    reports.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onSelect={() => setSelectedReport(report)}
                            onAction={handleAction}
                            onBan={handleBanUser}
                            onRemove={handleRemoveProduct}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) => (
    <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color }}>{icon}</div>
            <div>
                <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {value}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</p>
            </div>
        </div>
    </Card>
);

// Report Card Component
const ReportCard = ({
    report,
    onSelect,
    onAction,
    onBan,
    onRemove
}: {
    report: ModerationFlag;
    onSelect: () => void;
    onAction: (id: string, action: 'reviewed' | 'actioned' | 'dismissed') => void;
    onBan: (userId: string) => void;
    onRemove: (productId: string) => void;
}) => {
    const [expanded, setExpanded] = useState(false);

    const getTargetType = () => {
        if (report.reported_product_id) return 'Product';
        if (report.reported_comment_id) return 'Comment';
        if (report.reported_user_id) return 'User';
        return 'Unknown';
    };

    const getStatusColor = () => {
        switch (report.status) {
            case 'pending': return 'var(--color-warning)';
            case 'reviewed': return 'var(--color-primary)';
            case 'actioned': return 'var(--color-success)';
            case 'dismissed': return 'var(--text-muted)';
        }
    };

    return (
        <Card style={{ padding: 'var(--space-4)' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    cursor: 'pointer'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                {/* Reporter Avatar */}
                <img
                    src={report.reporter?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reporter_id}`}
                    alt=""
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />

                {/* Report Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: getStatusColor(),
                            color: 'white',
                            fontWeight: 600
                        }}>
                            {report.status.toUpperCase()}
                        </span>
                        <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)'
                        }}>
                            {getTargetType()}
                        </span>
                    </div>
                    <p style={{ fontWeight: 500, marginTop: 'var(--space-1)' }}>
                        {report.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(report.created_at).toLocaleString()}
                    </p>
                </div>

                {/* Expand Icon */}
                <ChevronDown
                    size={20}
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                />
            </div>

            {/* Expanded Actions */}
            {expanded && (
                <div style={{
                    marginTop: 'var(--space-4)',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border-subtle)'
                }}>
                    {report.description && (
                        <p style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-4)',
                            padding: 'var(--space-3)',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            "{report.description}"
                        </p>
                    )}

                    {/* Reported Content Preview */}
                    {report.reported_product && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            marginBottom: 'var(--space-4)',
                            padding: 'var(--space-3)',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            <img
                                src={report.reported_product.image_url}
                                alt=""
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div>
                                <p style={{ fontWeight: 500 }}>{report.reported_product.name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reported Product</p>
                            </div>
                        </div>
                    )}

                    {report.reported_user && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            marginBottom: 'var(--space-4)',
                            padding: 'var(--space-3)',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            <img
                                src={report.reported_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reported_user_id}`}
                                alt=""
                                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                            />
                            <div>
                                <p style={{ fontWeight: 500 }}>{report.reported_user.display_name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reported User</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {report.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onAction(report.id, 'dismissed')}
                            >
                                <XCircle size={16} />
                                Dismiss
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onAction(report.id, 'reviewed')}
                            >
                                <Eye size={16} />
                                Mark Reviewed
                            </Button>
                            {report.reported_product_id && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                        onRemove(report.reported_product_id!);
                                        onAction(report.id, 'actioned');
                                    }}
                                >
                                    <Package size={16} />
                                    Remove Product
                                </Button>
                            )}
                            {report.reported_user_id && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                        onBan(report.reported_user_id!);
                                        onAction(report.id, 'actioned');
                                    }}
                                >
                                    <Ban size={16} />
                                    Suspend User
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default AdminDashboard;
