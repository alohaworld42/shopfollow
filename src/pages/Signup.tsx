import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Password validation
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const passwordsMatch = password === confirmPassword && password.length > 0;
    const isValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch && name && email;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setError('');
        setLoading(true);

        try {
            await signUp(email, password, name);
            navigate('/');
        } catch (err) {
            setError('Failed to create account. Please try again.');
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
            </form>

            {/* Footer */}
            <div className="auth-footer">
                <p>
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
