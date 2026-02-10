import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

export const Signup = () => {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle, signInWithApple } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password validation
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    // Email validation
    const validateEmail = (email: string) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    };

    const handleEmailBlur = () => {
        if (email && !validateEmail(email)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const isValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch && name && email && !emailError;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation before submit
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        if (!isValid) return;

        setError('');
        setLoading(true);

        try {
            await signUp(email, password, name);
            // Show success message - user needs to confirm email
            setSuccess(true);
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setError('');
        setLoading(true);
        try {
            if (provider === 'google') await signInWithGoogle();
            else await signInWithApple();
        } catch (err) {
            setError(getAuthErrorMessage(err));
            setLoading(false);
        }
    };

    // Success screen
    if (success) {
        // Auto redirect after 5 seconds
        setTimeout(() => navigate('/login'), 5000);

        return (
            <div className="auth-page">
                <div className="auth-header" style={{ marginTop: '60px' }}>
                    <div className="auth-logo" style={{ background: 'var(--color-success)', color: 'white' }}>
                        <CheckCircle size={28} strokeWidth={1.5} />
                    </div>
                    <h1>Check Your Email</h1>
                    <p style={{ maxWidth: '300px', margin: '0 auto', lineHeight: 1.5 }}>
                        We sent a confirmation link to <strong>{email}</strong>.
                        Click the link to activate your account.
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '16px' }}>
                        Redirecting to login in 5 seconds...
                    </p>
                </div>
                <div className="welcome-actions" style={{ marginTop: '32px' }}>
                    <button
                        className="welcome-btn welcome-btn-primary"
                        onClick={() => navigate('/login')}
                    >
                        Go to Login Now
                    </button>
                </div>
            </div>
        );
    }

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
                <h1>Create Account</h1>
                <p>Join the shopping community</p>
            </div>

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="auth-error">{error}</div>
                )}

                {/* Name */}
                <div className="auth-field">
                    <label>Full Name</label>
                    <div className="auth-input-wrapper">
                        <User size={20} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="auth-field">
                    <label>Email</label>
                    <div className="auth-input-wrapper">
                        <Mail size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError('');
                            }}
                            onBlur={handleEmailBlur}
                            placeholder="you@example.com"
                            required
                        />
                        {emailError && (
                            <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>
                                {emailError}
                            </div>
                        )}
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
                            placeholder="Create a password"
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

                    {/* Password Requirements */}
                    {password && (
                        <div className="auth-password-checks">
                            <div className={`auth-check ${hasMinLength ? 'valid' : ''}`}>
                                {hasMinLength ? <Check size={14} /> : <X size={14} />}
                                At least 8 characters
                            </div>
                            <div className={`auth-check ${hasUppercase ? 'valid' : ''}`}>
                                {hasUppercase ? <Check size={14} /> : <X size={14} />}
                                One uppercase letter
                            </div>
                            <div className={`auth-check ${hasNumber ? 'valid' : ''}`}>
                                {hasNumber ? <Check size={14} /> : <X size={14} />}
                                One number
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                    <label>Confirm Password</label>
                    <div className="auth-input-wrapper">
                        <Lock size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                        {confirmPassword && (
                            <span style={{
                                color: passwordsMatch ? 'var(--color-success)' : 'var(--color-error)',
                                fontSize: '18px',
                                fontWeight: 600
                            }}>
                                {passwordsMatch ? '✓' : '✗'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="auth-submit"
                    disabled={!isValid || loading}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
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
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-primary)' }} />
                    <span>or continue with</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-primary)' }} />
                </div>

                {/* Social Login Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.15s'
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
                        onClick={() => handleSocialLogin('apple')}
                        disabled={loading}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.15s'
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
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div >
    );
};

export default Signup;
