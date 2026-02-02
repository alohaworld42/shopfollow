import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { ToastContainer } from '../common';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="app-layout">
            <Header />
            <main className="app-main">
                <div className="content-container">
                    {children}
                </div>
            </main>
            <BottomNav />
            <ToastContainer />
        </div>
    );
};

export default Layout;
