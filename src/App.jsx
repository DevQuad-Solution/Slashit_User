/**
 * App.jsx — User application routing shell.
 *
 * This file contains only:
 *  1. Global CSS
 *  2. Toast notification system
 *  3. Protected / FlagRoute guards
 *  4. Route registration
 *
 * All page logic lives in src/features/<feature>/pages/<Page>.jsx
 * All shared UI lives in src/components/ui/index.jsx
 * All layout components live in src/components/layout/
 */

import { useState, useEffect, useRef, useContext, createContext } from 'react';
import { BottomNav, SupportChat } from './components/layout/BottomNav';
import { AppSidebar } from './components/layout/AppSidebar';
import QRCode from 'qrcode';
import { toast, _wireToast } from './toast.js';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  MOCK_USER, MOCK_SLASHES, MOCK_PRODUCTS, FOOD_PACKAGES, MOCK_HUBS,
  MOCK_TRANSACTIONS, MOCK_NOTIFICATIONS, MOCK_LEADERBOARD, LEADERBOARD_CONFIG,
  PLANS, HOSTELS, CATEGORIES, BANTER_MESSAGES, fmt, delay, fromNow, timeUntil
} from './data.js';
import { storage, getFlags, getPlatformConfig, getAdminProducts, getAdminPackages, getAdminPlans, getAdminHubs, getLeaderboardConfig, getAdminHostels, pollStorage, chatStorage, msgStorage, pushBrowserNotif, requestPushPermission } from './storage.js';
import { api, setToken, getToken, clearToken } from './api.js';
import { mapUser, extractUser, normalizePhone } from './utils/session';

// ── Page imports ──────────────────────────────────────────────────────────────
import { SplashPage }       from './features/auth/pages/SplashPage';
import { LoginPage }        from './features/auth/pages/LoginPage';
import { SignupPage }       from './features/auth/pages/SignupPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { JoinLandingPage }  from './features/auth/pages/JoinLandingPage';
import { OnboardingPage }   from './features/hub/pages/OnboardingPage';
import { HomePage }         from './features/home/pages/HomePage';
import { SearchPage }       from './features/home/pages/SearchPage';
import { MessagesPage }     from './features/home/pages/MessagesPage';
import { CreatePage }       from './features/slashes/pages/CreatePage';
import { SlashDetailPage }  from './features/slashes/pages/SlashDetailPage';
import { MySlashesPage }    from './features/slashes/pages/MySlashesPage';
import { AllPackagesPage }  from './features/packages/pages/AllPackagesPage';
import { PackageDetailPage } from './features/packages/pages/PackageDetailPage';
import { LeaderboardPage }  from './features/leaderboard/pages/LeaderboardPage';
import { WalletPage }       from './features/wallet/pages/WalletPage';
import { FundWalletPage }   from './features/wallet/pages/FundWalletPage';
import { NotificationsPage } from './features/notifications/pages/NotificationsPage';
import { KYCPage }          from './features/kyc/pages/KYCPage';
import { ChangeHubPage }    from './features/profile/pages/ChangeHubPage';
import { ProfilePage }      from './features/profile/pages/ProfilePage';
import { ReferralPage }     from './features/referral/pages/ReferralPage';
import { UserSettingsPage } from './features/settings/pages/UserSettingsPage';
import { SubscriptionPage } from './features/settings/pages/SubscriptionPage';
import { TermsPage }        from './features/static/pages/TermsPage';
import { PrivacyPage }      from './features/static/pages/PrivacyPage';
import { RefundPolicyPage } from './features/static/pages/RefundPolicyPage';
import { FAQPage }          from './features/static/pages/FAQPage';

// ── Global CSS ────────────────────────────────────────────────────────────────
const CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  html,body{height:100%;overflow:hidden}
  body{background:#f0f4ff;color:#1e293b;font-family:'Inter',system-ui,sans-serif;font-size:14px;margin:0;position:relative;-webkit-font-smoothing:antialiased}
  input:not([type=checkbox]):not([type=radio]),textarea,select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;color:#1e293b;font-size:16px;width:100%;outline:none;transition:border-color .2s;font-family:inherit;-webkit-appearance:none;appearance:none}
  input[type=checkbox],input[type=radio]{-webkit-appearance:auto;appearance:auto}
  input:focus,textarea:focus,select:focus{border-color:#2563eb;background:#fff}
  button{cursor:pointer;border:none;outline:none;transition:all .15s;font-family:inherit;-webkit-tap-highlight-color:transparent}
  ::-webkit-scrollbar{width:0}
  .toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1e293b;color:#fff;border-radius:12px;padding:10px 18px;font-size:13px;font-weight:600;animation:toastIn .2s ease;white-space:nowrap;max-width:90vw}
  .toast.success{background:#1d4ed8}
  .toast.error{background:#dc2626}
  @keyframes toastIn{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin .8s linear infinite}
  a{color:inherit;text-decoration:none}
  .active-scale{transition:transform .1s} .active-scale:active{transform:scale(.97)}
  .sheet{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,.5);width:100%}
  .sheet-inner{background:#fff;border-radius:20px 20px 0 0;max-height:85vh;overflow-y:auto}
  @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .sheet-inner{animation:sheetUp .25s ease}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .pulse{animation:pulse 1.5s infinite}
  @media(max-width:380px){body{font-size:13px}input,textarea,select{font-size:16px;padding:9px 12px}}
/* Prevent overflow on all screens */
img{max-width:100%;height:auto}
table{border-collapse:collapse}
.overflow-x{overflow-x:auto;-webkit-overflow-scrolling:touch}
:root{--sidebar-w:220px}
/* Desktop layout — sidebar visible, bottom nav hidden */
@media(min-width:900px){
  .app-layout{display:flex;height:100vh;overflow:hidden}
  .app-sidebar{display:flex}
  .app-main{margin-left:var(--sidebar-w);flex:1;min-width:0;transition:margin-left .25s;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;height:100vh}
  .bottom-nav-wrap{display:none!important}
}
/* Mobile — no sidebar, show bottom nav */
@media(max-width:899px){
  .app-layout{display:block;height:100vh;overflow:hidden}
  .app-sidebar{display:none!important}
  .app-main{margin-left:0!important;width:100%;height:100vh;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
  .bottom-nav-wrap{display:block}
  .app-main-inner{padding-bottom:80px}
}
`;

// ── Toast system ──────────────────────────────────────────────────────────────
// toast exported from ./toast.js
function ToastProvider() {
  const [t, setT] = useState(null);
  _wireToast((v) => { setT(v); setTimeout(() => setT(null), 2800); });
  if (!t) return null;
  return <div className={`toast ${t.t}`}>{t.m}</div>;
}

// ── Route guards ──────────────────────────────────────────────────────────────
function Protected({ children }) {
  const session = storage.load('session', null);
  if (!session) return <Navigate to="/login" replace />;
  if (!session.hubId) {
    let bkHub = null;
    try { bkHub = JSON.parse(localStorage.getItem('slashit_hub') || 'null'); } catch (e) {}
    const stored = storage.load('session', {});
    const resolvedHubId = stored.hubId || bkHub?.id || '';
    if (resolvedHubId) {
      const patched = {
        ...session,
        hubId:   resolvedHubId,
        hubName: stored.hubName || bkHub?.name  || '',
        city:    stored.city    || bkHub?.city   || '',
        state:   stored.state   || bkHub?.state  || '',
      };
      storage.save('session', patched);
      return <AppLayout>{children}</AppLayout>;
    }
    if (window.location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }
  return <AppLayout>{children}</AppLayout>;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <AppSidebar />
      <div className="app-main">
        <div className="app-main-inner">{children}</div>
      </div>
      <div className="bottom-nav-wrap"><BottomNav /></div>
    </div>
  );
}

function FlagRoute({ flag, children }) {
  const flags = getFlags();
  if (!flags[flag]) return <Navigate to="/home" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => { requestPushPermission(); }, []);
  return (
    <>
      <style>{CSS}</style>
      <ToastProvider />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<SplashPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/terms"           element={<TermsPage />} />
          <Route path="/privacy"         element={<PrivacyPage />} />
          <Route path="/refund-policy"   element={<RefundPolicyPage />} />
          <Route path="/faq"             element={<FAQPage />} />
          <Route path="/join/:id"        element={<JoinLandingPage />} />
          <Route path="/onboarding"      element={<OnboardingPage />} />

          {/* Protected */}
          <Route path="/home"          element={<Protected><HomePage /></Protected>} />
          <Route path="/search"        element={<Protected><SearchPage /></Protected>} />
          <Route path="/create"        element={<Protected><CreatePage /></Protected>} />
          <Route path="/slash/:id"     element={<Protected><SlashDetailPage /></Protected>} />
          <Route path="/packages"      element={<Protected><FlagRoute flag="foodPackages"><AllPackagesPage /></FlagRoute></Protected>} />
          <Route path="/package/:id"   element={<Protected><FlagRoute flag="foodPackages"><PackageDetailPage /></FlagRoute></Protected>} />
          <Route path="/leaderboard"   element={<Protected><FlagRoute flag="hosteLeaderboard"><LeaderboardPage /></FlagRoute></Protected>} />
          <Route path="/wallet"        element={<Protected><WalletPage /></Protected>} />
          <Route path="/wallet/fund"   element={<Protected><FlagRoute flag="walletFunding"><FundWalletPage /></FlagRoute></Protected>} />
          <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
          <Route path="/kyc"           element={<Protected><KYCPage /></Protected>} />
          <Route path="/change-hub"    element={<Protected><ChangeHubPage /></Protected>} />
          <Route path="/profile"       element={<Protected><ProfilePage /></Protected>} />
          <Route path="/slashes"       element={<Protected><MySlashesPage /></Protected>} />
          <Route path="/subscription"  element={<Protected><FlagRoute flag="paidPlanPackages"><SubscriptionPage /></FlagRoute></Protected>} />
          <Route path="/referral"      element={<Protected><FlagRoute flag="referralProgram"><ReferralPage /></FlagRoute></Protected>} />
          <Route path="/settings"      element={<Protected><UserSettingsPage /></Protected>} />
          <Route path="/messages"      element={<Protected><MessagesPage /></Protected>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
