// ─── SlashIt API Service ──────────────────────────────────────────────────────
// Base URL — swap to http://localhost:5004 for local dev
// const BASE = "http://localhost:5004/api";
const BASE = 'https://slashit-g2og.onrender.com/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('slashit_token');
export const setToken = (t) => localStorage.setItem('slashit_token', t);
export const clearToken = () => localStorage.removeItem('slashit_token');

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function req(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch(networkErr) {
    // "Failed to fetch" — server may be starting up (Render free tier sleeps)
    throw new Error('Cannot reach server. It may be starting up — wait a few seconds and retry.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 401 = token expired — clear session and redirect to login (mirrors Axios interceptor)
    if (res.status === 401) {
      localStorage.removeItem('slashit_token');
      localStorage.removeItem('slashit_session');
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/forgot')) {
        window.location.href = '/login';
      }
    }
    const msg = data?.message || data?.description || data?.error || `Server error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const get  = (path, auth) => req('GET', path, null, auth);
const post = (path, body, auth) => req('POST', path, body, auth);
const put  = (path, body, auth) => req('PUT', path, body, auth);
const patch = (path, body, auth) => req('PATCH', path, body, auth);
const del  = (path, auth) => req('DELETE', path, null, auth);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
export const api = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    signup:       (data) => post('/auth/', data, false),
    signin:       (email, password) => post('/auth/signin', { identifier: email, password }, false),
    adminSignin:  (email, password) => post('/auth/admin/signin', { identifier: email, password }, false),
    attendantSignin: (identifier, password) => post('/auth/attendant/signin', { identifier, password }, false),
    sendCode:     (email, reason) => post('/auth/code', { email, reason }, false),
    verifyCode:   (email, code, reason) => post('/auth/verify-code', { email, code, reason }, false),
    onboarding:   (token, email, hubId) => post('/auth/onboarding', { token, email, hubId }, false),
    resetPassword:(token, newPassword) => post('/auth/reset-password', { token, newPassword }, false),
    // spec: reset-password body is { email, newPassword } — no token needed
    resetPasswordWithEmail:(email, newPassword) => post('/auth/reset-password', { email, newPassword }, false),
    // Fallback: some backends use email+code+newPassword instead of JWT token
    resetPasswordWithCode:(email, code, newPassword) => post('/auth/reset-password', { email, code, newPassword }, false),
    // POST /auth/kyc — multipart/form-data
    // FormData fields: nin (string, 11 chars), image (File), consent (boolean as string "true")
    // Response: { data: { verified, kycStatus, walletBalance, verificationDetails, user } }
    //
    // NOTE: Uses raw fetch() intentionally — multipart/form-data requires the browser to
    // set its own Content-Type header (with boundary). Axios or manual headers would break
    // the boundary string and cause a 400 from the backend. This is the only permitted
    // exception to centralized-Axios usage in this codebase.
    submitKyc: (formData) => {
      const token = getToken();
      return fetch(`${BASE}/auth/kyc`, {
        method: 'POST',
        // No Content-Type header — browser sets it automatically with the correct boundary
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      }).then(async r => {
        const d = await r.json().catch(() => ({}));
        if (r.status === 401) {
          localStorage.removeItem('slashit_token');
          localStorage.removeItem('slashit_session');
          window.location.href = '/login';
        }
        if (!r.ok) throw new Error(d?.message || `KYC error (${r.status})`);
        return d;
      });
    },
    me:           () => get('/auth/me'),
  },

  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    getAll: () => get('/products', false),
    create: (data) => post('/products', data),
    updateStatus: (productId, status) => put('/products/status', { productId, status }),
  },

  // ── Slashes ───────────────────────────────────────────────────────────────
  slashes: {
    getMySlashes: () => get('/slash/'),
    search:       (query = '', page = 1, limit = 20) =>
      get(`/slash/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
    create:       (productId, timeLimit, hubId) =>
      post('/slash/', { productId, timeLimit, hubId }),
    join:         (id) => post(`/slash/${id}`),
    leave:        (id) => patch(`/slash/${id}`),
    getQR:        (id) => get(`/slash/qr?id=${id}`),
    verifyQR:     (qrCode) => post('/slash/qr', { qrCode }),
    verifyClaim:  (code) => post('/slash/claim', { code }),
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  hubs: {
    getStates:    () => get('/hub/', false),
    getCities:    (state) => get(`/hub/${encodeURIComponent(state)}`, false),
    getHubs:      (state, city) =>
      get(`/hub/${encodeURIComponent(state)}/${encodeURIComponent(city)}`, false),
    getRatings:   (hubId) => get(`/hub/${hubId}/ratings`),
    rate:         (hubId, rating, comment) =>
      post(`/hub/${hubId}/rating`, { rating, comment }),
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  // GET /api/transaction?page=1&limit=20 — returns transaction history (Monnify)
  transactions: {
    getAll:  (page=1, limit=20) => get(`/transaction?page=${page}&limit=${limit}`),
    getPage: (page=1, limit=20) => get(`/transaction?page=${page}&limit=${limit}`),
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    getAll: () => get('/notifications'),
    getMine: () => get('/notifications/me'),
  },

  // ── Admin — Users ─────────────────────────────────────────────────────────
  admin: {
    getStats:    () => get('/admin/stats'),
    getUsers:    (page = 1, limit = 50) =>
      get(`/admin/users?page=${page}&limit=${limit}`),
    searchUsers: (query) =>
      get(`/admin/users/search?query=${encodeURIComponent(query)}`),
    getUser:     (id) => get(`/admin/users/${id}`),
    suspendUser: (id) => patch(`/admin/users/${id}/suspend`),

    // Admin — Slashes
    searchSlashes: (query='', hubId='', status='', page=1, limit=50) =>
      get(`/admin/slashes/search?query=${encodeURIComponent(query)}&hubId=${hubId}&status=${status}&page=${page}&limit=${limit}`),
    dissolveSlash: (id) => del(`/admin/slashes/${id}/dissolve`),

    // Admin — Hubs
    getHubs:     (query='', status='', page=1, limit=50) =>
      get(`/admin/hubs?query=${encodeURIComponent(query)}&status=${status}&page=${page}&limit=${limit}`),
    createHub:   (data) => post('/admin/hubs', data),
    getHub:      (id) => get(`/admin/hubs/${id}`),
    updateHubStatus: (hubId, status) => patch('/admin/hubs/status', { hubId, status }),

    // Admin — Attendants
    getAttendants:   () => get('/admin/attendants'),
    createAttendant: (data) => post('/admin/attendants', data),
    resetPin:        (id) => patch(`/admin/attendants/${id}/pin`, {}),
    updateAttendantStatus: (attendantId, status) => patch('/admin/attendants/status', { attendantId, status }),
    assignAttendant: (hubId, attendantId) => post('/admin/hubs/attendant', { hubId, attendantId }),
  },

  // ── Attendant ─────────────────────────────────────────────────────────────
  attendant: {
    getDashboard: () => get('/attendant/dashboard'),
  },
};

export default api;
