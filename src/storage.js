// ─── Persistent Storage Utility (User) ────────────────────────────────────────
const NS = 'slashit_user_';
const ADMIN_NS = 'slashit_admin_';

export const storage = {
  save: (key, data) => {
    try { localStorage.setItem(NS + key, JSON.stringify(data)); } catch(e) {}
  },
  load: (key, fallback) => {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  },
  remove: (key) => {
    try { localStorage.removeItem(NS + key); } catch(e) {}
  },
};

function loadAdmin(key, fallback) {
  try {
    const raw = localStorage.getItem(ADMIN_NS + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch(e) { return fallback; }
}

// ─── Feature Flags ────────────────────────────────────────────────────────────
// ── Backend flag keys (must match FLAG_KEYS in admin constants) ─────────────
// The admin writes these keys to localStorage 'slashit_admin_settings_flags'.
// We read the same key names here and also expose user-facing aliases for
// FlagRoute checks in App.jsx.
const BACKEND_FLAG_DEFAULTS = {
  hosteLeaderboard: true,  // → flag 'hosteLeaderboard' in FlagRoute
  banterBoard:      true,
  referralProgram:  true,  // → flag 'referralProgram'
  paidPlanPackages: true,  // → flag 'paidPlanPackages'
  foodPackages:     true,
  walletFunding:    true,
  transportation:   true,
};

export function getFlags() {
  // Returns backend flag keys PLUS legacy aliases so older UI code doesn't break.
  // Backend keys: hosteLeaderboard, banterBoard, referralProgram, paidPlanPackages,
  //               foodPackages, walletFunding, transportation
  // Legacy aliases added here: leaderboard, referrals, studentPlans
  // insurance is NOT a backend flag — it's always true (controlled by insuranceRate config)
  try {
    const raw = localStorage.getItem(ADMIN_NS + 'settings_flags');
    const base = { ...BACKEND_FLAG_DEFAULTS };
    if (raw) {
      const parsed = JSON.parse(raw);
      // parsed may be { hosteLeaderboard: { enabled: false }, ... } (admin SettingsPage shape)
      // or { hosteLeaderboard: false, ... } (API response shape)
      Object.keys(BACKEND_FLAG_DEFAULTS).forEach(k => {
        if (parsed[k] !== undefined) {
          base[k] = typeof parsed[k] === 'object' ? (parsed[k].enabled ?? true) : Boolean(parsed[k]);
        }
      });
    }
    // ── Legacy aliases ─────────────────────────────────────────────────────────
    // UI code that still reads F.leaderboard / F.referrals / F.studentPlans
    // maps to the canonical backend keys so those sections still render.
    base.leaderboard   = base.hosteLeaderboard;
    base.referrals     = base.referralProgram;
    base.studentPlans  = base.paidPlanPackages;
    base.studentPackages = base.paidPlanPackages;
    // insurance is not a backend flag — rate>0 means it's active.
    // Set to true as a safe default so UI charge breakdowns show correctly.
    base.insurance     = true;
    return base;
  } catch(e) {
    return {
      ...BACKEND_FLAG_DEFAULTS,
      leaderboard:     true,
      referrals:       true,
      studentPlans:    true,
      studentPackages: true,
      insurance:       true,
    };
  }
}

// ─── Platform Config ──────────────────────────────────────────────────────────
const DEFAULT_PLATFORM_CONFIG = {
  processingFee: 100,
  maxSlashDurationHours: 72,
  minSlotsPerSlash: 2,
  maxSlotsPerSlash: 20,
  minWalletFund: 100,
  cancellationPenaltyPct: 7,
  insuranceRate: 1,
  defaultTransportFee: 500,
};

export function getPlatformConfig() {
  try {
    const raw = localStorage.getItem(ADMIN_NS + 'platform_config');
    if (!raw) return DEFAULT_PLATFORM_CONFIG;
    return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(raw) };
  } catch(e) { return DEFAULT_PLATFORM_CONFIG; }
}

// ─── Admin-managed data readers ───────────────────────────────────────────────
export function getAdminProducts(fallback = []) {
  return loadAdmin('products', fallback).filter(p => p.isActive);
}
export function getAdminPackages(fallback = []) {
  return loadAdmin('foodpackages', fallback).filter(p => p.isActive);
}
export function getAdminPlans(fallback = []) {
  return loadAdmin('plans', fallback);
}
export function getAdminHubs(fallback = []) {
  return loadAdmin('hubs', fallback).filter(h => h.isActive);
}
export function getLeaderboardConfig(fallback = {}) {
  return loadAdmin('lb_config', fallback);
}
export function getAdminHostels(fallback = []) {
  return loadAdmin('hostels', fallback).filter(h => h.isActive);
}

// ─── Hub Support Chat ─────────────────────────────────────────────────────────
export const chatStorage = {
  key: (hubId) => `slashit_hub_chat_${hubId}`,
  load: (hubId) => {
    try { return JSON.parse(localStorage.getItem(`slashit_hub_chat_${hubId}`) || '[]'); } catch(e) { return []; }
  },
  save: (hubId, msgs) => {
    try { localStorage.setItem(`slashit_hub_chat_${hubId}`, JSON.stringify(msgs)); } catch(e) {}
  },
  send: (hubId, msg) => {
    try {
      const existing = chatStorage.load(hubId);
      chatStorage.save(hubId, [msg, ...existing]);
    } catch(e) {}
  },
};

// ─── Per-user slash message inbox ─────────────────────────────────────────────
export const msgStorage = {
  load: (userId) => {
    try { return JSON.parse(localStorage.getItem(`slashit_user_messages_${userId}`) || '[]'); } catch(e) { return []; }
  },
  save: (userId, msgs) => {
    try { localStorage.setItem(`slashit_user_messages_${userId}`, JSON.stringify(msgs)); } catch(e) {}
  },
  push: (userId, msg) => {
    try { msgStorage.save(userId, [msg, ...msgStorage.load(userId)]); } catch(e) {}
  },
  markRead: (userId, msgId) => {
    msgStorage.save(userId, msgStorage.load(userId).map(m => m.id === msgId ? { ...m, isRead: true } : m));
  },
  markAllRead: (userId) => {
    msgStorage.save(userId, msgStorage.load(userId).map(m => ({ ...m, isRead: true })));
  },
};

// ─── Poll Storage ─────────────────────────────────────────────────────────────
const SHARED_POLLS_KEY = ADMIN_NS + 'polls';
export const pollStorage = {
  load: () => {
    try { return JSON.parse(localStorage.getItem(SHARED_POLLS_KEY) || '[]'); } catch(e) { return []; }
  },
  save: (polls) => {
    try { localStorage.setItem(SHARED_POLLS_KEY, JSON.stringify(polls)); } catch(e) {}
  },
  add: (poll) => { pollStorage.save([poll, ...pollStorage.load()]); },
  update: (pollId, changes) => {
    pollStorage.save(pollStorage.load().map(p => p.id === pollId ? { ...p, ...changes } : p));
  },
};

// ─── Browser Push Notification ────────────────────────────────────────────────
// Fires an OS-level popup when tab is open or backgrounded.
export function pushBrowserNotif(title, body, icon = '/logo.jpg') {
  try {
    if (!('Notification' in window)) return;
    const doSend = () => {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
      }
    };
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') new Notification(title, { body, icon });
      });
    } else {
      doSend();
    }
  } catch(e) {}
}

// ─── Request push permission on app load ─────────────────────────────────────
export function requestPushPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch(e) {}
}
