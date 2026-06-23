import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirect to /login if not authenticated
// Redirect to /onboarding if authenticated but no hub selected
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: '#64748b' }}>Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.hubId) return <Navigate to="/onboarding" replace />;
  return children;
}

// Redirect to /home if already logged in
export function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user?.hubId) return <Navigate to="/home" replace />;
  return children;
}
