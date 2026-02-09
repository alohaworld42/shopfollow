import { useNavigate } from 'react-router-dom';
import { Camera, TrendingUp, Coins, ChevronRight, Star, ShoppingBag, Globe, Shield, Heart } from 'lucide-react';

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">
            {/* Navbar */}
            <nav className="glass-panel" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 32px',
                alignItems: 'center',
                maxWidth: '1280px',
                width: '90%',
                margin: '24px auto',
                borderRadius: '99px',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', fontSize: '20px' }}>
                    <div className="welcome-logo-icon" style={{ width: 40, height: 40, margin: 0, borderRadius: 10 }}>
                        <ShoppingBag size={20} color="white" />
                    </div>
                    <span>CartConnect</span>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="glass-button"
                    style={{
                        padding: '10px 24px',
                        borderRadius: '99px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Section */}
            <div className="welcome-hero">
                {/* Purple Glow */}
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                    <div className="welcome-logo">
                        <div className="welcome-logo-icon">
                            <ShoppingBag size={48} color="white" />
                        </div>
                    </div>

                    <h1 className="welcome-title">
                        Social Shopping <br />
                        <span className="text-gradient">Reimagined</span>
                    </h1>
                    <p className="welcome-tagline">
                        Share your finds, earn rewards. The future of commerce is social.
                    </p>

                    <div style={{ marginTop: '40px' }}>
                        <button
                            onClick={() => navigate('/signup')}
                            className="welcome-btn welcome-btn-primary"
                            style={{ display: 'inline-flex' }}
                        >
                            Get Started
                            <ChevronRight size={20} />
                        </button>

                        <div>
                            <button
                                onClick={() => navigate('/demo')}
                                className="welcome-demo-link"
                            >
                                Try Demo Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section style={{ padding: '0 24px', maxWidth: '1280px', margin: '0 auto 80px', width: '100%' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {[
                        { icon: Camera, title: 'Share Purchases', desc: 'Snap and share your latest hauls with your network.' },
                        { icon: TrendingUp, title: 'Discover Trends', desc: 'See what is trending in your circle and beyond.' },
                        { icon: Coins, title: 'Earn Commission', desc: 'Get paid when friends shop from your shared links.' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card" style={{ padding: '32px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#A78BFA',
                                marginBottom: '20px'
                            }}>
                                <item.icon size={24} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{item.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '15px' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section style={{ padding: '0 24px', maxWidth: '1280px', margin: '0 auto 80px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '48px' }}>
                    What Our Community Says
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {[
                        { name: 'Alex M.', role: 'Fashion Blogger', quote: "CartConnect completely changed how I monetize my content. It's so seamless!" },
                        { name: 'Sarah K.', role: 'Early Adopter', quote: "I love seeing what my friends are actually buying, not just what they wish for." },
                        { name: 'James L.', role: 'Tech Reviews', quote: "The auto-linking feature saves me so much time. Highly recommended." }
                    ].map((t, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', color: '#F59E0B' }}>
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                            </div>
                            <p style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{t.quote}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {t.name[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
                padding: '64px 24px',
                width: '100%',
                background: 'var(--bg-base)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '48px',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
                            <ShoppingBag size={20} color="#8B5CF6" />
                            <span>CartConnect</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                            &copy; 2026 CartConnect Inc.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
