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
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await signIn(email, password);
            setSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (err: unknown) {
            console.error('Login error:', err);
            setLoading(false);

            // Handle AbortError - this is a known Supabase issue, retry the request
            if (err instanceof Error && err.name === 'AbortError') {
                // AbortError can happen due to Supabase client issues
                // Show a user-friendly message and suggest retry
                setError('Connection was interrupted. Please try again.');
                return;
            }

            // Extract error message from various error types
            let msg = 'An unexpected error occurred. Please try again.';
            if (err && typeof err === 'object') {
                // AuthApiError or similar objects have a message property
                if ('message' in err && typeof err.message === 'string') {
                    msg = err.message;
                } else if ('error_description' in err && typeof err.error_description === 'string') {
                    msg = err.error_description;
                }
            }

            // Translate common errors to user-friendly messages
            if (msg.includes('Invalid login credentials')) {
                setError('Incorrect email or password. Please try again.');
            } else if (msg.includes('Email not confirmed')) {
                setError('Please check your inbox and verify your email address before logging in.');
            } else if (msg.includes('Invalid email')) {
                setError('Please enter a valid email address.');
            } else if (msg.includes('aborted') || msg.includes('AbortError')) {
                setError('Connection was interrupted. Please try again.');
            } else {
                setError(msg);
            }
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
            <form className="auth-form glass-card" onSubmit={handleSubmit} style={{ padding: '28px', borderRadius: '20px' }}>
                {error && (
                    <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flexShrink: 0 }}>⚠️</div>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="auth-success" style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        padding: '16px',
                        borderRadius: '14px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        <div style={{ flexShrink: 0 }}>✅</div>
                        <span>{success}</span>
                    </div>
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

                {/* Forgot Password Link */}
                <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                    <Link
                        to="/forgot-password"
                        style={{
                            fontSize: '13px',
                            color: 'var(--color-primary-light)',
                            textDecoration: 'none'
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            alert('Password reset coming soon! Contact support for now.');
                        }}
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                >
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div>
                            <span>Signing in...</span>
                        </div>
                    ) : 'Sign In'}
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    margin: '24px 0',
                    color: 'var(--text-muted)',
                    fontSize: '13px'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                    <span>or continue with</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                </div>

                {/* Social Login Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={() => signInWithGoogle()}
                        className="glass-button"
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-glass)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        onClick={() => signInWithApple()}
                        className="glass-button"
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-glass)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        Apple
                    </button>
                </div>
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

