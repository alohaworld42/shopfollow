import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Coins, ChevronRight, Sparkles } from 'lucide-react';

const features = [
    {
        icon: ShoppingBag,
        title: 'Share Purchases',
        description: 'Post your shopping finds and inspire your friends with your style'
    },
    {
        icon: Users,
        title: 'Discover Together',
        description: 'See what your network is buying and find new products you\'ll love'
    },
    {
        icon: Coins,
        title: 'Earn Rewards',
        description: 'Get rewarded when friends buy through your affiliate links'
    }
];

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">
            {/* Decorative elements */}
            <div className="welcome-glow" />

            {/* Hero Section */}
            <div className="welcome-hero">
                <div className="welcome-logo">
                    <div className="welcome-logo-icon">
                        <ShoppingBag size={44} strokeWidth={1.5} />
                    </div>
                </div>
                <h1 className="welcome-title">CartConnect</h1>
                <p className="welcome-subtitle">
                    Share Your Style, Earn Together
                </p>
                <p className="welcome-tagline">
                    The social way to shop. Share your finds, discover what friends are buying, and earn rewards together.
                </p>
            </div>

            {/* Features */}
            <div className="welcome-features">
                {features.map((feature, index) => (
                    <div key={index} className="welcome-feature">
                        <div className="welcome-feature-icon">
                            <feature.icon size={26} strokeWidth={1.5} />
                        </div>
                        <div className="welcome-feature-text">
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats/Social Proof */}
            <div className="welcome-stats">
                <div className="welcome-stat">
                    <Sparkles size={16} />
                    <span>Join thousands sharing their style</span>
                </div>
            </div>

            {/* CTA Buttons */}
            <div className="welcome-actions">
                <button
                    className="welcome-btn welcome-btn-primary"
                    onClick={() => navigate('/signup')}
                >
                    Get Started
                    <ChevronRight size={20} />
                </button>
                <button
                    className="welcome-btn welcome-btn-secondary"
                    onClick={() => navigate('/login')}
                >
                    Sign In
                </button>
            </div>

            {/* Demo Mode Link */}
            <button
                className="welcome-demo-link"
                onClick={() => navigate('/demo')}
            >
                Try Demo Mode →
            </button>
        </div>
    );
};

export default Welcome;
