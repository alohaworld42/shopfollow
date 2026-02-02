import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <button className="auth-back" onClick={() => navigate('/welcome')}>
                <ArrowLeft size={20} />
            </button>

            <div className="auth-header">
                <div className="auth-logo">
                    <ShoppingBag size={32} />
                </div>
                <h1>Welcome back</h1>
                <p>Sign in to your CartConnect account</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="auth-error">{error}</div>
                )}

                <div className="auth-field">
                    <label htmlFor="email">Email</label>
                    <div className="auth-input-wrapper">
                        <Mail size={18} />
                        <input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-field">
                    <label htmlFor="password">Password</label>
                    <div className="auth-input-wrapper">
                        <Lock size={18} />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="auth-toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    Don't have an account?{' '}
                    <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
