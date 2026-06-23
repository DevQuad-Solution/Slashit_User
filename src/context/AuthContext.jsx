/**
 * AuthContext — single source of truth for user session state.
 *
 * Provides:
 *   user              — current session object (null if not logged in)
 *   loading           — true while restoring session on mount
 *   updateUser(patch) — merge a partial update into session + persist
 *   loginFromOnboarding(data, hub) — called after POST /auth/onboarding
 *   loginFromSignin(data, prev)    — called after POST /auth/signin
 *   refreshUser(meData)            — merge fresh /auth/me data
 *   logout()                       — clear token + session + redirect
 *
 * All components should read session via:
 *   const { user, updateUser } = useAuth();
 *
 * The module-level `currentUser` variable in App.jsx is a legacy bridge
 * kept in sync by App.jsx itself during incremental migration.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAuthToken, clearAuthToken, getAuthToken } from '../lib/axios';
import { getMe } from '../services/auth.service';

const AuthContext = createContext(null);

const SESSION_KEY = 'slashit_session';

const saveSession = (user) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch {}
};
const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, _setUser] = useState(() => loadSession());
  const [loading, setLoading] = useState(false);

  // Persist user both to React state and localStorage atomically
  const persistUser = useCallback((next) => {
    _setUser(next);
    if (next) saveSession(next);
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  // On mount — if token exists but no in-memory session, restore from /auth/me
  useEffect(() => {
    const token = getAuthToken();
    if (token && !user) {
      setLoading(true);
      getMe()
        .then((res) => {
          const me = res.data;
          persistUser(me);
        })
        .catch(() => {
          clearAuthToken();
          localStorage.removeItem(SESSION_KEY);
        })
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge a partial update into the session.
  // Usage: updateUser({ walletBalance: 5000 })
  //        updateUser({ kycStatus: 'verified' })
  const updateUser = useCallback((patch) => {
    _setUser((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  }, []);

  // Called after successful POST /auth/onboarding
  // onboarding response: data: { user: {..., userAccountDetails}, accessToken }
  const loginFromOnboarding = useCallback((responseData, hubId, hubName, hubCity, hubState) => {
    const { user: backendUser, accessToken } = responseData;
    setAuthToken(accessToken);
    const session = {
      ...backendUser,
      id:            backendUser._id,
      hubId:         backendUser.hub || hubId,
      hubName:       hubName || '',
      city:          hubCity  || backendUser.city  || '',
      state:         hubState || backendUser.state || '',
      kycStatus:     (backendUser.kyc?.status || 'Unverified').toLowerCase(),
      accountNumber: backendUser.userAccountDetails?.accountNumber || '',
      accountName:   backendUser.userAccountDetails?.accountName  || '',
      accountBank:   backendUser.userAccountDetails?.bankName     || 'Wema bank',
    };
    persistUser(session);
  }, [persistUser]);

  // Called after successful POST /auth/signin
  // signin response: data: { user: {...}, accessToken }
  const loginFromSignin = useCallback((responseData, previousSession = {}) => {
    const { user: backendUser, accessToken } = responseData;
    setAuthToken(accessToken);
    const session = {
      ...previousSession,
      ...backendUser,
      id:            backendUser._id,
      kycStatus:     (backendUser.kyc?.status || 'Unverified').toLowerCase(),
      accountNumber: backendUser.userAccountDetails?.accountNumber || previousSession.accountNumber || '',
      accountName:   backendUser.userAccountDetails?.accountName  || previousSession.accountName  || '',
      accountBank:   backendUser.userAccountDetails?.bankName     || previousSession.accountBank  || 'Wema bank',
      hubId:         backendUser.hub || previousSession.hubId  || '',
      hubName:       previousSession.hubName || '',
      city:          previousSession.city    || '',
      state:         previousSession.state   || '',
    };
    persistUser(session);
  }, [persistUser]);

  // Merge fresh /auth/me data into session (preserves hub fields backend omits)
  const refreshUser = useCallback((meData) => {
    if (!meData) return;
    _setUser((prev) => {
      const next = {
        ...prev,
        ...meData,
        id:            meData._id || prev?.id,
        kycStatus:     (meData.kyc?.status || prev?.kycStatus || 'unverified').toLowerCase(),
        accountNumber: meData.userAccountDetails?.accountNumber || prev?.accountNumber || '',
        accountName:   meData.userAccountDetails?.accountName  || prev?.accountName  || '',
        accountBank:   meData.userAccountDetails?.bankName     || prev?.accountBank  || 'Wema bank',
        walletBalance: meData.walletBalance ?? prev?.walletBalance ?? 0,
        // Preserve hub fields — backend /auth/me may not return them
        hubId:   prev?.hubId   || '',
        hubName: prev?.hubName || '',
        city:    prev?.city    || '',
        state:   prev?.state   || '',
      };
      saveSession(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    localStorage.removeItem(SESSION_KEY);
    _setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, updateUser, loginFromOnboarding, loginFromSignin, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
