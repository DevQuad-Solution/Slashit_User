/**
 * DeletionZone
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

export function DeletionZone({ user, nav }) {
  const { logout: contextLogout } = useSession();
  const [delInput, setDelInput] = useState('');
  const [delConfirmOpen, setDelConfirmOpen] = useState(false);
  const [delDone, setDelDone] = useState(false);
  if (delDone) return (
    <div style={{background:'#fef9c3',borderRadius:12,padding:'12px 14px',fontSize:13,color:'#78350f',fontWeight:600}}>
      ✅ Deletion request submitted. Our team will process it within 30 days.
    </div>
  );
  return (
    <div style={{paddingTop:20,borderTop:'1px solid #f1f5f9'}}>
      <div style={{fontSize:13,fontWeight:700,color:'#dc2626',marginBottom:6}}>Danger Zone</div>
      <div style={{fontSize:12,color:'#64748b',marginBottom:14,lineHeight:1.5}}>Requesting account deletion will disable your account. A compliance review will be done before permanent deletion (up to 30 days).</div>
      {delConfirmOpen ? (
        <div style={{background:'#fef2f2',border:'1.5px solid #fecaca',borderRadius:14,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#dc2626',marginBottom:8}}>Type DELETE to confirm</div>
          <input value={delInput} onChange={e=>setDelInput(e.target.value)} placeholder="DELETE"
            style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`2px solid ${delInput==='DELETE'?'#dc2626':'#e2e8f0'}`,fontSize:14,fontWeight:700,letterSpacing:2,boxSizing:'border-box',marginBottom:12}}/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{setDelConfirmOpen(false);setDelInput('');}}
              style={{flex:1,padding:'10px',borderRadius:10,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontWeight:700,fontSize:13,cursor:'pointer'}}>Cancel</button>
            <button disabled={delInput!=='DELETE'} onClick={()=>{
              try {
                const reqs = JSON.parse(localStorage.getItem('slashit_admin_deletion_requests')||'[]');
                reqs.unshift({ id:'del-'+Date.now(), userId:user.id, name:user.name, email:user.email, requestedAt:new Date().toISOString(), status:'pending' });
                localStorage.setItem('slashit_admin_deletion_requests', JSON.stringify(reqs));
              } catch(e) {}
              storage.save('session', {...user, isSuspended:true, deletionRequested:true});
              storage.remove('session');
              contextLogout();
              setDelDone(true);
              setTimeout(()=>nav('/login'),1800);
            }} style={{flex:2,padding:'10px',borderRadius:10,border:'none',background:delInput==='DELETE'?'#dc2626':'#e2e8f0',color:delInput==='DELETE'?'#fff':'#94a3b8',fontWeight:700,fontSize:13,cursor:delInput==='DELETE'?'pointer':'default',opacity:delInput==='DELETE'?1:.6}}>
              Request Deletion
            </button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setDelConfirmOpen(true)}
          style={{background:'none',color:'#dc2626',fontWeight:700,padding:'10px 0',border:'none',fontSize:13,textDecoration:'underline',cursor:'pointer'}}>
          Request Account Deletion
        </button>
      )}
    </div>
  );
}
