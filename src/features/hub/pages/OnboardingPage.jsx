/**
 * Onboarding
 * Extracted from App.jsx. Uses useSession() instead of currentUser module variable.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { api, setToken, getToken, clearToken } from '../../../api';
import { storage, getFlags, getPlatformConfig, getAdminProducts, getAdminPackages,
         getAdminPlans, getAdminHubs, getLeaderboardConfig, getAdminHostels,
         pollStorage, chatStorage, msgStorage, pushBrowserNotif } from '../../../storage';
import { fmt, delay, fromNow, timeUntil, PLANS, CATEGORIES, BANTER_MESSAGES,
         FOOD_PACKAGES, MOCK_SLASHES, MOCK_PRODUCTS, MOCK_TRANSACTIONS,
         MOCK_NOTIFICATIONS, MOCK_LEADERBOARD, LEADERBOARD_CONFIG, HOSTELS } from '../../../data';
import { mapUser, extractUser, normalizePhone } from '../../../utils/session';
import { useSession } from '../../../hooks/useSession';
import { useAuth } from '../../../context/AuthContext';
import { Btn, Card, Input, Badge, FillBar, Modal } from '../../../components/ui';
import { toast } from '../../../toast';
import { HubPickerFlow } from '../components/HubPickerFlow';

export function Onboarding() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [phase,       setPhase]       = useState('intro'); // intro | hub
  const [selectedHub, setSelectedHub] = useState(null);
  const [saving,      setSaving]      = useState(false);

  const finishHubPick = (hub) => {
    setSelectedHub(hub);
    finish(hub);
  };

  const finish = async (hubArg) => {
    const hub = hubArg || selectedHub;
    setSaving(true);
    const session     = storage.load('session', {});
    const email       = session?.email || localStorage.getItem('slashit_signup_email') || '';
    const password    = localStorage.getItem('slashit_signup_pw') || '';
    const verifyToken = localStorage.getItem('slashit_verify_token') || '';
    if (!hub) return;

    // Save hub separately as backup — recovered in Protected if session is missing it
    localStorage.setItem('slashit_hub', JSON.stringify({ id: hub.id, name: hub.name, city: hub.city, state: hub.state }));

    // Step 1: Call onboarding API (activates account + creates wallet)
    let onboardingToken = '';
    if (email && verifyToken && verifyToken.length > 20) {
      try {
        const onboardRes = await api.auth.onboarding(verifyToken, email, hub.id);
        // Onboarding may return an accessToken we can use directly
        onboardingToken = onboardRes?.data?.accessToken
          || onboardRes?.data?.token
          || onboardRes?.data?.user?.accessToken
          || onboardRes?.accessToken || '';
      } catch(e) {
        // Non-fatal — we attempt signin next regardless
      }
    }
    localStorage.removeItem('slashit_verify_token');

    // Step 2: If onboarding gave us a token, use it directly
    // Otherwise try signin with email+password
    let signedIn = false;

    if (onboardingToken) {
      // Use the token from onboarding directly
      signedIn = true;
      setToken(onboardingToken);
      const prev = storage.load('session', {});
      const _mapped = mapUser({ email, name: prev.name || '' }, {
        ...prev, hubId: hub.id, hubName: hub.name, city: hub.city, state: hub.state,
      });
      storage.save('session', _mapped);   // write to slashit_user_session (what Protected reads)
    } else if (email && password) {
      // Onboarding didn't return a token — try signin
      // Wait for backend to finish activating the account
      await new Promise(r => setTimeout(r, 1500));
      const trySignin = async () => {
        const signinRes = await api.auth.signin(email, password);
        const token = signinRes?.data?.accessToken || signinRes?.data?.token
                    || signinRes?.data?.user?.accessToken;
        if (!token) throw new Error('No token in signin response');
        signedIn = true;
        setToken(token);
        const rawUser = extractUser(signinRes) || {};
        const resolved = mapUser(rawUser, {
          ...storage.load('session', {}),
          hubId: hub.id, hubName: hub.name, city: hub.city, state: hub.state,
        });
        storage.save('session', resolved);  // write to slashit_user_session (what Protected reads)
      };
      try {
        await trySignin();
      } catch(e) {
        // First attempt failed — wait 2s and retry once
        await new Promise(r => setTimeout(r, 2000));
        try { await trySignin(); }
        catch(e2) { toast.error('Hub saved. Please sign in to continue.'); }
      }
    }

    // Always clean up credentials after attempt
    localStorage.removeItem('slashit_signup_email');
    localStorage.removeItem('slashit_signup_pw');

    if (!signedIn) {
      // Could not sign in — hub is saved, direct user to login
      const sess = storage.load('session', {});
      storage.save('session', { ...sess, hubId: hub.id, hubName: hub.name, city: hub.city, state: hub.state });
      localStorage.setItem('slashit_prefill_email', email || '');
      // Show clear message — not "Hub set" which confuses users
      toast.success('Almost there! Sign in with your password to continue.');
      nav('/login');
      return;
    }

    // Signed in successfully
    try {
      const pending = JSON.parse(localStorage.getItem('slashit_pending_join') || 'null');
      if (pending?.slashId) {
        localStorage.removeItem('slashit_pending_join');
        nav('/slash/' + pending.slashId); return;
      }
    } catch(e) {}
    localStorage.setItem('slashit_just_onboarded', '1');
    setSaving(false);
    nav('/home');
  };

  if (phase === 'hub') {
    return (
      <div>
        <div style={{ background:'#1e3a8a', padding:'10px 20px', display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>📍 Choose Your Pickup Hub</div>
        </div>
        <HubPickerFlow onComplete={finishHubPick} onBack={() => setPhase('intro')} saving={saving} />
      </div>
    );
  }



  // Intro phase
  return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'80px 24px 40px', position:'relative', overflow:'hidden', textAlign:'center' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.08)' }}/>
        <div style={{ fontSize:64, marginBottom:16 }}>⚡</div>
        <div style={{ fontSize:26, fontWeight:900, color:'#fff', marginBottom:10 }}>Welcome to SlashIt!</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,.8)', lineHeight:1.7 }}>Pool money with other students to buy food at wholesale prices — saving 20–40% on every purchase.</div>
      </div>
      <div style={{ flex:1, padding:24, display:'flex', flexDirection:'column', gap:16 }}>
        {[
          { icon:'🏪', title:'Pick a Pickup Hub', sub:'Get orders delivered to a verified pickup station near your campus.' },
          { icon:'🔒', title:'Pay Safely via Escrow', sub:'Your money is only released after delivery is confirmed by the hub attendant.' },
          { icon:'💰', title:'Save up to 40%', sub:'Wholesale prices, shared costs — maximum savings on food and essentials.' },
        ].map(({ icon, title: t, sub: s }) => (
          <div key={t} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:44, height:44, background:'#f0fdf4', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontWeight:800, color:'#1e293b', fontSize:14, marginBottom:2 }}>{t}</div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{s}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'0 24px 32px' }}>
        <Btn full onClick={() => setPhase('hub')} style={{ fontSize:16, padding:'16px' }}>Set Your Pickup Location →</Btn>
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { OnboardingPage }
export { Onboarding as OnboardingPage };
