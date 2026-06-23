/**
 * useSession
 * Drop-in replacement for the legacy `currentUser` module variable.
 *
 * Every page that previously did:
 *   const [user, setUser] = useState(() => storage.load('session', {}));
 *   currentUser = updated; storage.save('session', updated); setUser(updated);
 *
 * Now does:
 *   const { session, updateSession, logout } = useSession();
 *
 * updateSession({ walletBalance: 5000 }) — merges patch, persists, triggers rerender.
 * updateSession(prev => ({ ...prev, kycStatus: 'verified' })) — functional form.
 */
import { useAuth } from '../context/AuthContext';
import { storage } from '../storage';

export function useSession() {
  const { user, updateUser, logout } = useAuth();

  // Fallback to localStorage for components rendered before AuthContext hydrates
  const session = user || storage.load('session', null) || {};

  // Write to both storage keys so Protected (reads slashit_user_session)
  // and AuthContext (reads slashit_session) stay in sync after any update.
  const updateSession = (patch) => {
    updateUser(patch); // updates AuthContext state + saves to 'slashit_session'
    // Also persist to 'slashit_user_session' which Protected reads directly
    const current = user || storage.load('session', {}) || {};
    const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
    storage.save('session', next);
  };

  return {
    session,
    updateSession,
    logout,
    isLoggedIn: !!user,
    hubId:   session.hubId   || '',
    userId:  session.id      || session._id || '',
    name:    session.name    || '',
    email:   session.email   || '',
    kycStatus: (session.kycStatus || 'unverified').toLowerCase(),
    walletBalance: session.walletBalance ?? 0,
  };
}
