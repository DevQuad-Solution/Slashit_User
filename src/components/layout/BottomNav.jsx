/**
 * BottomNav
 * Fixed bottom navigation bar shown on all protected user pages.
 * Polls localStorage for unread message counts every 3 seconds.
 *
 * SupportChat
 * Floating chat sheet that opens when the 💬 button is tapped.
 * Messages are stored in chatStorage and synced across tabs.
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { storage, msgStorage, chatStorage, pushBrowserNotif } from '../../storage';

// ── SupportChat ───────────────────────────────────────────────────────────────
export function SupportChat({ onClose }) {
  const user     = storage.load('session', null);
  const hubId    = user?.hubId   || '';
  const userId   = user?.id      || 'user-001';
  const userName = user?.name    || 'You';

  const getAttendantInfo = () => {
    try {
      const hubs = JSON.parse(localStorage.getItem('slashit_admin_hubs') || '[]');
      const hub  = hubs.find(h => h.id === hubId);
      if (hub?.attendantName) return { name: hub.attendantName, hubName: hub.name };
    } catch (e) {}
    return { name: 'Hub Attendant', hubName: user?.hubName || 'Your Hub' };
  };
  const attInfo = getAttendantInfo();

  const loadMsgs = () => {
    if (!hubId) return [];
    return chatStorage.load(hubId)
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
  };

  const [messages, setMessages] = useState(loadMsgs);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (hubId) {
      try {
        const all    = chatStorage.load(hubId);
        const marked = all.map(m =>
          m.userId === userId && m.from === 'attendant' ? { ...m, isRead: true } : m
        );
        chatStorage.save(hubId, marked);
      } catch (e) {}
    }
    const iv = setInterval(() => setMessages(loadMsgs()), 3000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubId, userId]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const msg = {
      id: 'chat-' + Date.now(), hubId, userId, userName,
      from: 'user', text, sentAt: new Date().toISOString(), isRead: false,
    };
    chatStorage.send(hubId, msg);
    try {
      const log = JSON.parse(localStorage.getItem('slashit_admin_chat_log') || '[]');
      log.unshift({ ...msg, hubName: attInfo.hubName, attendantName: attInfo.name });
      localStorage.setItem('slashit_admin_chat_log', JSON.stringify(log));
    } catch (e) {}
    try {
      const hubs  = JSON.parse(localStorage.getItem('slashit_admin_hubs') || '[]');
      const hub   = hubs.find(h => h.id === hubId);
      const attId = hub?.attendantId;
      if (attId) {
        const key      = `slashit_attendant_notifs_${attId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift({
          id: 'attnotif-' + Date.now(), type: 'user_message',
          title: '💬 Message from ' + (userName.split(' ')[0] || 'Member'),
          body: text.length > 80 ? text.slice(0, 80) + '…' : text,
          isRead: false, createdAt: new Date().toISOString(), userId, userName,
        });
        localStorage.setItem(key, JSON.stringify(existing));
        pushBrowserNotif('💬 Message from ' + (userName.split(' ')[0] || 'Member'), text.slice(0, 80));
      }
    } catch (e) {}
    setMessages(loadMsgs());
    setSending(false);
  };

  const noHub = !hubId;

  return (
    <div className="sheet" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-inner" style={{ height: '75vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍💼</div>
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>{attInfo.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>{attInfo.hubName} · Hub Attendant</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
          {noHub && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
              <div style={{ fontWeight: 700, color: '#475569', fontSize: 13 }}>No hub selected</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Select a hub in your profile to chat with your hub attendant.</div>
            </div>
          )}
          {!noHub && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontWeight: 700, color: '#475569', fontSize: 13 }}>Chat with {attInfo.name}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Ask about your order, report an issue, or get help with anything at {attInfo.hubName}.</div>
            </div>
          )}
          {messages.map(m => {
            const isMe = m.from === 'user';
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {!isMe && <div style={{ width: 28, height: 28, background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🧑‍💼</div>}
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(m.sentAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <span style={{ marginLeft: 4 }}>✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div style={{ padding: '12px 16px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={noHub ? 'Select a hub first…' : `Message ${attInfo.name}…`}
            disabled={noHub}
            style={{ flex: 1, borderRadius: 24, padding: '10px 16px' }}
          />
          <button
            onClick={send}
            disabled={noHub || !input.trim() || sending}
            style={{ width: 42, height: 42, borderRadius: '50%', background: noHub || !input.trim() ? '#e2e8f0' : '#2563eb', color: noHub || !input.trim() ? '#94a3b8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all .2s' }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
const TABS = [
  { path: '/home',     icon: '🏠', label: 'Home' },
  { path: '/search',   icon: '🔍', label: 'Search' },
  { path: 'create',    icon: '⚡', label: '', create: true },
  { path: '/messages', icon: '📩', label: 'Messages' },
  { path: '/profile',  icon: '👤', label: 'Profile' },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const [showSupport, setShowSupport] = useState(false);

  const user   = storage.load('session', null);
  const userId = user?.id    || 'user-001';
  const hubId  = user?.hubId || '';

  const [unreadMsgs, setUnreadMsgs] = useState(
    () => msgStorage.load(userId).filter(m => !m.isRead).length
  );
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    const tick = () => {
      setUnreadMsgs(msgStorage.load(userId).filter(m => !m.isRead).length);
      if (hubId) {
        const chat = chatStorage
          .load(hubId)
          .filter(m => m.userId === userId && m.from === 'attendant' && !m.isRead);
        setUnreadChat(chat.length);
      }
    };
    tick();
    const iv = setInterval(tick, 3000);
    return () => clearInterval(iv);
  }, [userId, hubId]);

  return (
    <>
      <div style={{ height: 72 }} />
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderTop: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '8px 0 12px', zIndex: 40, boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>
        {TABS.map(t => {
          if (t.create) return (
            <button key="create" onClick={() => nav('/create')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(37,99,235,.4)', marginTop: -20 }}>⚡</div>
            </button>
          );
          const badge  = t.path === '/messages' ? unreadMsgs : 0;
          const active = loc.pathname === t.path;
          return (
            <button key={t.path} onClick={() => nav(t.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <span style={{ fontSize: 21, filter: active ? 'none' : 'grayscale(1)', opacity: active ? 1 : 0.6 }}>{t.icon}</span>
              {badge > 0 && (
                <div style={{ position: 'absolute', top: 0, right: '18%', width: 16, height: 16, background: '#dc2626', borderRadius: '50%', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                  {badge > 9 ? '9+' : badge}
                </div>
              )}
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#2563eb' : '#94a3b8', whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setShowSupport(true)}
        style={{ position: 'fixed', bottom: 88, right: 'max(16px, calc(50% - 215px + 16px))', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 4px 16px rgba(37,99,235,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: 'none', cursor: 'pointer', zIndex: 39 }}>
        💬
        {unreadChat > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: '#dc2626', borderRadius: '50%', fontSize: 10, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {unreadChat > 9 ? '9+' : unreadChat}
          </div>
        )}
      </button>

      {showSupport && <SupportChat onClose={() => setShowSupport(false)} />}
    </>
  );
}
