import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Lock, ChevronRight } from 'lucide-react';

const features = [
    {
        icon: ShoppingBag,
        title: 'Share Your Finds',
        description: 'Show off your purchases with friends and followers'
    },
    {
        icon: Users,
        title: 'Discover Together',
        description: 'See what your network is buying and get inspired'
    },
    {
        icon: Lock,
        title: 'Privacy Control',
        description: 'Choose who sees your purchases - public, private, or groups'
    }
];

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">
            {/* Hero Section */}
            <div className="welcome-hero">
                <div className="welcome-logo">
                    <div className="welcome-logo-icon">
                        <ShoppingBag size={40} />
                    </div>
                </div>
                <h1 className="welcome-title">CartConnect</h1>
                <p className="welcome-subtitle">
                    The social network for sharing your shopping discoveries
                </p>
            </div>

            {/* Features */}
            <div className="welcome-features">
                {features.map((feature, index) => (
                    <div key={index} className="welcome-feature">
                        <div className="welcome-feature-icon">
                            <feature.icon size={24} />
                        </div>
                        <div className="welcome-feature-text">
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    </div>
                ))}
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
                    I already have an account
                </button>
            </div>

            {/* Demo Mode Link */}
            <button
                className="welcome-demo-link"
                onClick={() => navigate('/demo')}
            >
                Try Demo Mode
            </button>
        </div>
    );
};

export default Welcome;
