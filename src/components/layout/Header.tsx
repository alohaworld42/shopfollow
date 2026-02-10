import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="app-header">
            <div className="app-header-inner">
                {/* Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                }} onClick={() => navigate('/')}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ShoppingBag size={18} color="white" strokeWidth={2} />
                    </div>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: 'var(--text-primary)',
                    }}>
                        ShopFollow
                    </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => navigate('/search')}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            background: 'none',
                            border: 'none',
                            transition: 'color 0.15s',
                        }}
                    >
                        <Search size={20} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
