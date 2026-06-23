/**
 * HubPickerFlow
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
import { buildLocationTree } from '../../../utils/locationTree';

export function HubPickerFlow({ onComplete, onBack, title = 'Set Your Pickup Location', sub = 'Select your primary pickup station to see deals near you' }) {
  const [allHubs, setAllHubs] = useState([]);
  const [loadingHubs, setLoadingHubs] = useState(true);

  useEffect(() => {
    const fetchHubs = async () => {
      setLoadingHubs(true);
      const hubList = [];
      const sleep = ms => new Promise(r => setTimeout(r, ms));

      // Helper: fetch with auto-retry on 429
      const safeFetch = async (fn, retries=3) => {
        for (let i=0; i<retries; i++) {
          try {
            const res = await fn();
            return res;
          } catch(e) {
            if (e.message?.includes('429') || e.message?.includes('Too many')) {
              await sleep(3000 * (i+1)); // 3s, 6s, 9s
            } else throw e;
          }
        }
        throw new Error('Max retries reached');
      };

      try {
        const statesRes = await safeFetch(() => api.hubs.getStates());
        const statesList = statesRes.data || [];
        if (!Array.isArray(statesList) || statesList.length === 0) {
          setLoadingHubs(false); return;
        }

        for (const stateObj of statesList) {
          const stateName = stateObj.state || stateObj.name;
          if (!stateName) continue;

          let citiesList = [];
          try {
            await sleep(1500);
            const citiesRes = await safeFetch(() => api.hubs.getCities(stateName));
            citiesList = citiesRes.data || [];
          } catch(e) { continue; }

          for (const cityObj of citiesList) {
            const cityName = cityObj.city || cityObj.name;
            if (!cityName) continue;
            try {
              await sleep(2000);
              const hubsRes = await safeFetch(() => api.hubs.getHubs(stateName, cityName));
              (hubsRes.data || []).forEach(h => hubList.push({
                ...h, id: h._id||h.id, state: stateName, city: cityName,
              }));
            } catch(e) { /* skip this hub — missing state/city data */ }
          }
        }

        if (hubList.length > 0) {
          setAllHubs(hubList);
          try { localStorage.setItem('slashit_hubs_backup', JSON.stringify(hubList)); } catch(e) {}
        } else {
          // Nothing fetched — use backup if available
          try {
            const backup = JSON.parse(localStorage.getItem('slashit_hubs_backup') || '[]');
            if (backup.length > 0) setAllHubs(backup);
          } catch(e) {}
        }
      } catch(e) {
        toast.error('Could not load hubs. Check your connection.');
        try {
          const backup = JSON.parse(localStorage.getItem('slashit_hubs_backup') || '[]');
          if (backup.length > 0) setAllHubs(backup);
        } catch(e2) {}
      } finally {
        setLoadingHubs(false);
      }
    };
    fetchHubs();
  }, []);

  const tree = buildLocationTree(allHubs);
  const states = Object.keys(tree).sort();
  const [locStep, setLocStep] = useState('state'); // state | city | hub
  const [selState, setSelState] = useState('');
  const [selCity, setSelCity] = useState('');

  const cities = selState && tree[selState] ? Object.keys(tree[selState]).sort() : [];
  const hubs = selState && selCity && tree[selState]?.[selCity] ? tree[selState][selCity] : [];

  const stepNums = { state: 1, city: 2, hub: 3 };
  const stepLabels = ['State', 'City', 'Hub'];

  const pickState = s => { setSelState(s); setSelCity(''); setLocStep('city'); };
  const pickCity = c => { setSelCity(c); setLocStep('hub'); };
  const pickHub = h => onComplete(h);
  const goBack = () => {
    if (locStep === 'hub') { setLocStep('city'); return; }
    if (locStep === 'city') { setLocStep('state'); setSelState(''); return; }
    onBack && onBack();
  };

  const LocationRow = ({ icon, title: t, sub: s, onClick }) => (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', marginBottom:10, cursor:'pointer', transition:'all .15s' }}>
      <div style={{ width:40, height:40, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'#1e293b' }}>{t}</div>
        {s && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{s}</div>}
      </div>
      <span style={{ color:'#94a3b8', fontSize:18 }}>›</span>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column' }}>
      {/* Green header */}
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 28px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.08)' }}/>
        <button onClick={goBack} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:14, display:'block' }}>←</button>
        <div style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.75)' }}>{sub}</div>
        {/* Step breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:16 }}>
          {stepLabels.map((l, i) => {
            const n = i + 1;
            const cur = stepNums[locStep];
            const done = cur > n;
            const active = cur === n;
            return (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, background: done?'#166534':active?'#fff':'rgba(255,255,255,.3)', border: done||active?'2px solid #fff':'2px solid rgba(255,255,255,.4)', color: done||active?done?'#fff':'#15803d':'rgba(255,255,255,.6)' }}>
                    {done ? '✓' : n}
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color: active?'#fff':'rgba(255,255,255,.55)' }}>{l}</span>
                </div>
                {i < 2 && <div style={{ width:20, height:1, background:'rgba(255,255,255,.3)', margin:'0 4px' }}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px' }}>
        {locStep === 'state' && (
          <>
            {loadingHubs && (
              <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>
                <span className="spin" style={{ width:28, height:28, border:'3px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', display:'inline-block', marginBottom:12 }}/><br/>
                Loading pickup locations…
              </div>
            )}
            {!loadingHubs && states.length === 0 && (
              <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📍</div>
                <div style={{ fontWeight:700, color:'#1e293b', marginBottom:6 }}>No hubs in your area yet</div>
                <div style={{ fontSize:13, lineHeight:1.5 }}>Your campus has not launched yet. Check back soon or contact support.</div>
              </div>
            )}
            {!loadingHubs && states.map(s => (
              <LocationRow key={s} icon="📍" title={s} sub={`${Object.keys(tree[s]).length} ${Object.keys(tree[s]).length===1?'city':'cities'} available`} onClick={() => pickState(s)}/>
            ))}
          </>
        )}
        {locStep === 'city' && (
          <>
            {cities.map(c => (
              <LocationRow key={c} icon="🏙️" title={c} sub={`${tree[selState][c].length} hub${tree[selState][c].length!==1?'s':''} available`} onClick={() => pickCity(c)}/>
            ))}
          </>
        )}
        {locStep === 'hub' && (
          <>
            {hubs.length === 0 && (
              <div style={{ textAlign:'center', padding:40 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>❌</div>
                <div style={{ fontWeight:700, color:'#1e293b', marginBottom:6 }}>No Hubs Available</div>
                <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>There are no verified pickup stations in {selCity} yet. Try selecting a different city.</div>
                <Btn style={{ marginTop:16 }} onClick={() => setLocStep('city')}>Choose Another City</Btn>
              </div>
            )}
            {hubs.map(h => (
              <div key={h.id} onClick={() => pickHub(h)} style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:16, marginBottom:10, cursor:'pointer' }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:44, height:44, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏪</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:'#1e293b', marginBottom:2 }}>{h.name}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{h.address}</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      {h.rating > 0 && <span style={{ fontSize:12, color:'#d97706', fontWeight:600 }}>⭐ {h.rating}</span>}
                      {h.attendantName && <span style={{ fontSize:12, color:'#64748b' }}>Attendant: {h.attendantName}</span>}
                      {h.transportFee !== undefined && (
                        <span style={{ fontSize:11, fontWeight:700, background: h.transportFee > 0 ? '#fef3c7' : '#dcfce7', color: h.transportFee > 0 ? '#92400e' : '#15803d', borderRadius:6, padding:'2px 7px' }}>
                          🚚 {h.transportFee > 0 ? `+${fmt(h.transportFee)}/slot transport` : 'Free transport'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color:'#94a3b8', fontSize:18 }}>›</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
