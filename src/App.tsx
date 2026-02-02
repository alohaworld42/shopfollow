import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout';
import { Feed, Dashboard, Network, Inbox, Welcome, Login, Signup } from './pages';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

// Public route - redirects to home if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/welcome" element={
        <PublicRoute><Welcome /></PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute><Signup /></PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Feed /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/network" element={
        <ProtectedRoute>
          <Layout><Network /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/inbox" element={
        <ProtectedRoute>
          <Layout><Inbox /></Layout>
        </ProtectedRoute>
      } />

      {/* Demo mode - auto login */}
      <Route path="/demo" element={<DemoRedirect />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

// Demo redirect component
const DemoRedirect = () => {
  const { signIn } = useAuth();

  // Auto sign in with demo credentials
  signIn('demo@cartconnect.app', 'demo').catch(() => {
    // Already in demo mode via AuthContext
  });

  return <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
