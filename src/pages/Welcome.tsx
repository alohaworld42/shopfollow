import { useNavigate } from 'react-router-dom';
import { Share2, TrendingUp, DollarSign, ChevronRight, ShoppingBag } from 'lucide-react';

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">
            {/* Hero */}
            <div className="welcome-hero">
                <div className="welcome-logo">
                    <div className="welcome-logo-icon">
                        <ShoppingBag size={32} color="white" strokeWidth={1.5} />
                    </div>
                </div>

                <h1 className="welcome-title">
                    Discover. Share.<br />Shop Together.
                </h1>
                <p className="welcome-tagline">
                    Join the community of smart shoppers sharing their favorite finds
                </p>
            </div>

            {/* Features */}
            <div className="welcome-features">
                {[
                    { icon: Share2, title: 'Share Finds', desc: 'Post products you love and inspire others' },
                    { icon: TrendingUp, title: 'Follow Friends', desc: 'See what your circle is buying' },
                    { icon: DollarSign, title: 'Track Prices', desc: 'Get notified when prices drop' }
                ].map((item, i) => (
                    <div key={i} className="welcome-feature">
                        <div className="welcome-feature-icon">
                            <item.icon size={20} strokeWidth={1.5} />
                        </div>
                        <div className="welcome-feature-text">
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="welcome-actions">
                <button
                    onClick={() => navigate('/signup')}
                    className="welcome-btn welcome-btn-primary"
                >
                    Get Started
                    <ChevronRight size={18} />
                </button>
                <button
                    onClick={() => navigate('/login')}
                    className="welcome-btn welcome-btn-secondary"
                >
                    I already have an account
                </button>
            </div>
        </div>
    );
};

export default Welcome;
