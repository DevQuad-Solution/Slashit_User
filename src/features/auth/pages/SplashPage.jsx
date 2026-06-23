/**
 * Splash
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

export function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const init = async () => {
      // Load persisted session — canonical source of truth
      const session = storage.load('session', null);
      if (!session) { nav('/login'); return; }

      const justOnboarded = localStorage.getItem('slashit_just_onboarded');
      if (justOnboarded) {
        localStorage.removeItem('slashit_just_onboarded');
      } else {
        // Refresh session from backend for returning users
        try {
          const res = await api.auth.me();
          const user = res.data?.user || res.data;
          if (user) {
            let bkHub = null;
            try { bkHub = JSON.parse(localStorage.getItem('slashit_hub')||'null'); } catch(e){}
            const merged = {
              ...session, ...user,
              id:      user._id    || user.id          || session.id,
              hubId:   user.hubId  || user.hub?._id    || user.hub || session.hubId  || bkHub?.id   || '',
              hubName: user.hubName|| user.hub?.name   || session.hubName || bkHub?.name  || '',
              city:    user.city   || user.hub?.city   || session.city    || bkHub?.city  || '',
              state:   user.state  || user.hub?.state  || session.state   || bkHub?.state || '',
            };
            storage.save('session', merged);
          }
        } catch(e) { /* use cached session */ }
      }
      // Check effective hubId after potential refresh
      const current = storage.load('session', {});
      const effectiveHubId = current.hubId || '';
      if (effectiveHubId) {
        nav('/home');
      } else {
        nav('/onboarding');
      }
    };
    const t = setTimeout(init, 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1e3a8a,#2563eb)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ width:96, height:96, borderRadius:24, overflow:'hidden', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 40px rgba(0,0,0,.3)' }}>
        <img src="/logo.jpg" alt="SlashIt" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'-1px' }}>SlashIt</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,.7)', marginTop:4 }}>Group buying for students</div>
      </div>
      <div className="spin" style={{ width:24, height:24, border:'3px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', marginTop:24 }}/>
    </div>
  );
}

// Re-export alias so App.jsx can import { SplashPage }
export { Splash as SplashPage };
