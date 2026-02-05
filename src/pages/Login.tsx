import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
    const navigate = useNavigate();
    const { signIn, signInWithGoogle, signInWithApple } = useAuth();

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
            console.error(err);
            setError((err as Error).message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Back Button */}
            <button
                className="auth-back"
                onClick={() => navigate('/welcome')}
            >
                <ArrowLeft size={20} />
            </button>

            {/* Header */}
            <div className="auth-header">
                <div className="auth-logo">
                    <ShoppingBag size={28} strokeWidth={1.5} />
                </div>
                <h1>Welcome Back</h1>
                <p>Sign in to continue</p>
            </div>

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="auth-error">{error}</div>
                )}

                {/* Email */}
                <div className="auth-field">
                    <label>Email</label>
                    <div className="auth-input-wrapper">
                        <Mail size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="auth-field">
                    <label>Password</label>
                    <div className="auth-input-wrapper">
                        <Lock size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            className="auth-toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            {/* Footer */}
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

