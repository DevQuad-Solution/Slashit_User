/**
 * Leaderboard
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
import { LegalFooter } from '../../../components/layout/LegalFooter';

export function Leaderboard() {
  const nav = useNavigate(); const F = getFlags();
  const lbConfig = getLeaderboardConfig();
  const user = storage.load('session', {});
  // Load rankings from admin-registered hostels
  const adminHostels = getAdminHostels([]);
  const liveRankings = adminHostels.length > 0
    ? [...adminHostels]
        .filter(h => h.isActive)
        .sort((a,b) => (b.slashCount||0) - (a.slashCount||0))
        .map((h, i) => ({ rank: i+1, hostel: h.name, campus: h.campus||'', slashCount: h.slashCount||0, totalSaved: (h.slashCount||0)*2500, trend: i<2?'up':'neutral', trendDelta: Math.floor(Math.random()*3)+1, isCurrentUser: h.name===user.hostel }))
    : [];
  const [banterMessages, setBanterMessages] = useState(() => {
    const saved = storage.load('banter_messages', null);
    return saved || [];
  });
  const [banterInput, setBanterInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState('rankings');
  const showBanterTab = F.banterBoard;

  const saveBanter = (msgs) => { setBanterMessages(msgs); storage.save('banter_messages', msgs); };

  const postBanter = async () => {
    if (!banterInput.trim()) return;
    if (!user.hostel) { toast.error('Set your hostel first to post'); return; }
    setPosting(true); await delay(400);
    const newMsg = { id: 'b' + Date.now(), hostel: user.hostel, user: (user?.name || 'User').split(' ')[0], message: banterInput.trim(), likes: 0, reported: false, createdAt: new Date().toISOString() };
    saveBanter([newMsg, ...banterMessages]);
    setBanterInput(''); toast.success('Trash talk posted! 🔥'); setPosting(false);
  };

  const reportMessage = (msgId) => {
    const updated = banterMessages.map(m => m.id === msgId ? { ...m, reported: true, reportedAt: new Date().toISOString(), reportedBy: user.name } : m);
    saveBanter(updated);
    // Also save to admin reports storage so admin can see
    const reports = storage.load('banter_reports', []);
    const msg = banterMessages.find(m => m.id === msgId);
    if (msg && !reports.find(r => r.id === msgId)) {
      storage.save('banter_reports', [{ ...msg, reported: true, reportedAt: new Date().toISOString(), reportedBy: user.name }, ...reports]);
    }
    toast('⚑ Message reported to admin for review');
  };
  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#92400e,#d97706,#f59e0b)', padding: '52px 16px 20px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 8 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Campus Pride 🏆</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>Weekly Hostel Leaderboard</div>
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,.25)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>This week reward</div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>{lbConfig.reward || LEADERBOARD_CONFIG.reward}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)' }}>Ends in</div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{timeUntil(lbConfig.weekEndsAt || LEADERBOARD_CONFIG.weekEndsAt)}</div>
          </div>
        </div>
      </div>
      {showBanterTab && (
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#fff' }}>
          {[['rankings', 'Rankings'], ['banter', 'Banter Board']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '12px', fontSize: 13, fontWeight: 700, background: 'none', color: activeTab === id ? '#2563eb' : '#94a3b8', borderBottom: activeTab === id ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2 }}>{label}</button>
          ))}
        </div>
      )}
      <div style={{ padding: '16px 16px 90px' }}>
        {(activeTab === 'rankings' || !showBanterTab) && (
          <>
            {liveRankings.length === 0 ? (
              <Card style={{ padding:30, textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🏆</div>
                <div style={{ fontWeight:700, color:'#1e293b', marginBottom:4 }}>No Rankings Yet</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Rankings populate as admin registers hostels. Ask your admin to register your hostel!</div>
              </Card>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
                  {[liveRankings[1]||liveRankings[0], liveRankings[0], liveRankings[2]||liveRankings[0]].map((r, i) => {
                    const isFirst = i === 1;
                    if (!r) return null;
                    return (
                      <div key={r.hostel+i} style={{ flex: 1, background: r.isCurrentUser ? '#eff6ff' : isFirst ? '#fef3c7' : '#fff', borderRadius: 14, padding: '12px 8px', textAlign: 'center', height: isFirst ? 110 : 90, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: `2px solid ${r.isCurrentUser ? '#bfdbfe' : isFirst ? '#fde68a' : '#e2e8f0'}` }}>
                        <div style={{ fontSize: isFirst ? 24 : 20, marginBottom: 4 }}>{['🥇', '🥈', '🥉'][i]}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{r.hostel}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{r.slashCount} slashes</div>
                        {r.isCurrentUser && <div style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', marginTop: 2 }}>YOU</div>}
                      </div>
                    );
                  })}
                </div>
                <Card>
                  {liveRankings.map((r, i) => (
                    <div key={r.hostel+i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: i < liveRankings.length - 1 ? '1px solid #f1f5f9' : 'none', background: r.isCurrentUser ? '#eff6ff' : 'transparent' }}>
                      <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: r.rank <= 3 ? 18 : 13 }}>
                        {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                          {r.hostel} {r.isCurrentUser && <Badge label='YOU' bg='#dbeafe' color='#1d4ed8' />}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{r.campus} · {fmt(r.totalSaved)} saved</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>{r.slashCount}</div>
                        <div style={{ fontSize: 10, color: r.trend === 'up' ? '#16a34a' : r.trend === 'down' ? '#dc2626' : '#94a3b8' }}>
                          {r.trend === 'up' ? `+${r.trendDelta}` : r.trend === 'down' ? `-${r.trendDelta}` : '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </>
            )}
          </>
        )}
        {activeTab === 'banter' && showBanterTab && (
          <>
            <Card style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: 13 }}>Drop your trash talk! 🔥</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={banterInput} onChange={e => setBanterInput(e.target.value)} placeholder={user.hostel ? `Speak for ${user.hostel}…` : 'Set your hostel first'} disabled={!user.hostel} onKeyDown={e => e.key === 'Enter' && postBanter()} style={{ flex: 1, fontSize: 13, padding: '8px 12px' }} />
                <Btn size="sm" loading={posting} onClick={postBanter} disabled={!user.hostel}>Post</Btn>
              </div>
            </Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {banterMessages.filter(m => !m.adminDeleted).map(msg => (
                <Card key={msg.id} style={{ padding: 14, opacity: msg.reported ? .6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{msg.user}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>from</span>
                      <span style={{ fontWeight: 700, fontSize: 12, color: '#2563eb', marginLeft: 4 }}>{msg.hostel}</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{fromNow(msg.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>{msg.message}</div>
                  {msg.reported && <div style={{ fontSize:11, color:'#f59e0b', marginBottom:6 }}>⚑ Reported — under review</div>}
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => saveBanter(banterMessages.map(x => x.id === msg.id ? { ...x, likes: x.likes + 1 } : x))} style={{ background: '#f1f5f9', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>❤️ {msg.likes}</button>
                    {!msg.reported && (
                      <button onClick={() => reportMessage(msg.id)} style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#c2410c' }}>⚑ Report</button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { LeaderboardPage }
export { Leaderboard as LeaderboardPage };
