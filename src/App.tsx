import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout';
import { Feed, Dashboard, Network, Purchases, Search, Reviews, Settings, AdminDashboard, Notifications, Welcome, Login, Signup } from './pages';

// Protected route wrapper - non-blocking async loading
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Don't block - if still loading, show the content anyway
  // The AuthContext will redirect if needed once auth is determined
  if (!loading && !user) {
    return <Navigate to="/welcome" replace />;
  }

  // Show content immediately while auth loads in background
  return <>{children}</>;
};

// Public route - redirects to home if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Don't block on public routes - show content immediately
  // Only redirect once we KNOW user is logged in
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  // Show content immediately
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
      <Route path="/search" element={
        <ProtectedRoute>
          <Layout><Search /></Layout>
        </ProtectedRoute>
      } />
      {/* Profile / Dashboard */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/network" element={
        <ProtectedRoute>
          <Layout><Network /></Layout>
        </ProtectedRoute>
      } />
      {/* Reviews/Discuss */}
      <Route path="/reviews" element={
        <ProtectedRoute>
          <Layout><Reviews /></Layout>
        </ProtectedRoute>
      } />
      {/* Notifications */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout><Notifications /></Layout>
        </ProtectedRoute>
      } />

      {/* Purchases */}
      <Route path="/purchases" element={
        <ProtectedRoute>
          <Layout><Purchases /></Layout>
        </ProtectedRoute>
      } />
      {/* Settings */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      {/* Admin Dashboard */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      {/* Redirects */}

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

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
