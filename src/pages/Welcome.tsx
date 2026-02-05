import { useNavigate } from 'react-router-dom';
import { Camera, TrendingUp, Coins, ChevronRight, Star, ShoppingBag, Globe, Shield, Heart } from 'lucide-react';

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-page" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0F0F0F',
            color: 'white',
            fontFamily: 'sans-serif', // Should ideally be Plus Jakarta Sans
            padding: 0
        }}>
            {/* Navbar */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '24px 48px',
                alignItems: 'center',
                maxWidth: '1280px',
                margin: '0 auto',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', fontSize: '20px' }}>
                    <ShoppingBag size={24} color="#8B5CF6" />
                    <span>CartConnect</span>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '99px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Section */}
            <div style={{
                textAlign: 'center',
                padding: '120px 24px 80px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Purple Glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{
                        fontSize: 'clamp(48px, 5vw, 72px)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        letterSpacing: '-0.02em'
                    }}>
                        Social Shopping <br />
                        <span style={{ color: '#8B5CF6' }}>Reimagined</span>
                    </h1>
                    <p style={{
                        fontSize: '20px',
                        color: 'rgba(255,255,255,0.6)',
                        maxWidth: '500px',
                        margin: '0 auto 40px',
                        lineHeight: 1.6
                    }}>
                        Share your finds, earn rewards. The future of commerce is social.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '16px 40px',
                            fontSize: '18px',
                            fontWeight: 600,
                            borderRadius: '99px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        Get Started
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <section style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {[
                        { icon: Camera, title: 'Share Purchases', desc: 'Snap and share your latest hauls with your network.' },
                        { icon: TrendingUp, title: 'Discover Trends', desc: 'See what is trending in your circle and beyond.' },
                        { icon: Coins, title: 'Earn Commission', desc: 'Get paid when friends shop from your shared links.' }
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.03)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '40px',
                            borderRadius: '24px',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#A78BFA',
                                marginBottom: '24px'
                            }}>
                                <item.icon size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>{item.title}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '64px' }}>
                    What Our Community Says
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {[
                        { name: 'Alex M.', role: 'Fashion Blogger', quote: "CartConnect completely changed how I monetize my content. It's so seamless!" },
                        { name: 'Sarah K.', role: 'Early Adopter', quote: "I love seeing what my friends are actually buying, not just what they wish for." },
                        { name: 'James L.', role: 'Tech Reviews', quote: "The auto-linking feature saves me so much time. Highly recommended." }
                    ].map((t, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '32px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', color: '#F59E0B' }}>
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                            </div>
                            <p style={{ fontSize: '18px', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic' }}>"{t.quote}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {t.name[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: 'auto',
                padding: '64px 24px',
                background: '#0a0a0a'
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
                    <div style={{ display: 'flex', gap: '64px' }}>
                        <div>
                            <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>Explore</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                <span>Features</span>
                                <span>Trending</span>
                                <span>Rewards</span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>Company</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                <span>About</span>
                                <span>Careers</span>
                                <span>Blog</span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>Support</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                <span>Help Center</span>
                                <span>Privacy</span>
                                <span>Terms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
