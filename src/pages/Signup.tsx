import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

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

    const passwordChecks = {
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /[0-9]/.test(password)
    };

    const isPasswordValid = passwordChecks.length && passwordChecks.letter && passwordChecks.number;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isPasswordValid) {
            setError('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password, name);
            navigate('/');
        } catch (err) {
            setError('Could not create account. Please try again.');
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
                <h1>Create Account</h1>
                <p>Join CartConnect today</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="auth-error">{error}</div>
                )}

                <div className="auth-field">
                    <label htmlFor="name">Display Name</label>
                    <div className="auth-input-wrapper">
                        <User size={18} />
                        <input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>

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

                    {password.length > 0 && (
                        <div className="auth-password-checks">
                            <div className={`auth-check ${passwordChecks.length ? 'valid' : ''}`}>
                                <Check size={14} /> At least 8 characters
                            </div>
                            <div className={`auth-check ${passwordChecks.letter ? 'valid' : ''}`}>
                                <Check size={14} /> Contains a letter
                            </div>
                            <div className={`auth-check ${passwordChecks.number ? 'valid' : ''}`}>
                                <Check size={14} /> Contains a number
                            </div>
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="auth-input-wrapper">
                        <Lock size={18} />
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {confirmPassword.length > 0 && (
                            <span className={`auth-match-indicator ${passwordsMatch ? 'valid' : 'invalid'}`}>
                                {passwordsMatch ? '✓' : '✗'}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading || !isPasswordValid || !passwordsMatch}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

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
