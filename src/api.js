// src/api.js - DEPRECATED: Use services instead
// This file is kept for backward compatibility but will be removed in future
import {
  getDataAPI,
  postDataAPI,
  putDataAPI,
  patchDataAPI,
  deleteDataAPI,
  postMediaAPI,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "./lib/axios";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = getAuthToken;
export const setToken = setAuthToken;
export const clearToken = clearAuthToken;

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    signup: (data) => postDataAPI("/auth/", data),
    signin: (email, password) =>
      postDataAPI("/auth/signin", { identifier: email, password }),
    adminSignin: (email, password) =>
      postDataAPI("/auth/admin/signin", { identifier: email, password }),
    attendantSignin: (identifier, password) =>
      postDataAPI("/auth/attendant/signin", { identifier, password }),
    sendCode: (email, reason) => postDataAPI("/auth/code", { email, reason }),
    verifyCode: (email, code, reason) =>
      postDataAPI("/auth/verify-code", { email, code, reason }),
    onboarding: (token, email, hubId) =>
      postDataAPI("/auth/onboarding", { token, email, hubId }),
    resetPassword: (token, newPassword) =>
      postDataAPI("/auth/reset-password", { token, newPassword }),
    resetPasswordWithEmail: (email, newPassword) =>
      postDataAPI("/auth/reset-password", { email, newPassword }),
    resetPasswordWithCode: (email, code, newPassword) =>
      postDataAPI("/auth/reset-password", { email, code, newPassword }),
    submitKyc: (formData) => postMediaAPI("/auth/kyc", formData),
    me: () => getDataAPI("/auth/me"),
  },

  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    getAll: () => getDataAPI("/products"),
    create: (data) => postDataAPI("/products", data),
    updateStatus: (productId, status) =>
      putDataAPI("/products/status", { productId, status }),
  },

  // ── Slashes ───────────────────────────────────────────────────────────────
  slashes: {
    getMySlashes: () => getDataAPI("/slash/"),
    search: (query = "", page = 1, limit = 20) =>
      getDataAPI(
        `/slash/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      ),
    create: (productId, timeLimit, hubId) =>
      postDataAPI("/slash/", { productId, timeLimit, hubId }),
    join: (id) => postDataAPI(`/slash/${id}`),
    leave: (id) => patchDataAPI(`/slash/${id}`),
    getQR: (id) => getDataAPI(`/slash/qr?id=${id}`),
    verifyQR: (qrCode) => postDataAPI("/slash/qr", { qrCode }),
    verifyClaim: (code) => postDataAPI("/slash/claim", { code }),
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  hubs: {
    getStates: () => getDataAPI("/hub/"),
    getCities: (state) => getDataAPI(`/hub/${encodeURIComponent(state)}`),
    getHubs: (state, city) =>
      getDataAPI(
        `/hub/${encodeURIComponent(state)}/${encodeURIComponent(city)}`,
      ),
    getRatings: (hubId) => getDataAPI(`/hub/${hubId}/ratings`),
    rate: (hubId, rating, comment) =>
      postDataAPI(`/hub/${hubId}/rating`, { rating, comment }),
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  transactions: {
    getAll: (page = 1, limit = 20) =>
      getDataAPI(`/transaction?page=${page}&limit=${limit}`),
    getPage: (page = 1, limit = 20) =>
      getDataAPI(`/transaction?page=${page}&limit=${limit}`),
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    getAll: () => getDataAPI("/notifications"),
    getMine: () => getDataAPI("/notifications/me"),
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: {
    getStats: () => getDataAPI("/admin/stats"),
    getUsers: (page = 1, limit = 50) =>
      getDataAPI(`/admin/users?page=${page}&limit=${limit}`),
    searchUsers: (query) =>
      getDataAPI(`/admin/users/search?query=${encodeURIComponent(query)}`),
    getUser: (id) => getDataAPI(`/admin/users/${id}`),
    suspendUser: (id) => patchDataAPI(`/admin/users/${id}/suspend`),
    searchSlashes: (
      query = "",
      hubId = "",
      status = "",
      page = 1,
      limit = 50,
    ) =>
      getDataAPI(
        `/admin/slashes/search?query=${encodeURIComponent(query)}&hubId=${hubId}&status=${status}&page=${page}&limit=${limit}`,
      ),
    dissolveSlash: (id) => deleteDataAPI(`/admin/slashes/${id}/dissolve`),
    getHubs: (query = "", status = "", page = 1, limit = 50) =>
      getDataAPI(
        `/admin/hubs?query=${encodeURIComponent(query)}&status=${status}&page=${page}&limit=${limit}`,
      ),
    createHub: (data) => postDataAPI("/admin/hubs", data),
    getHub: (id) => getDataAPI(`/admin/hubs/${id}`),
    updateHubStatus: (hubId, status) =>
      patchDataAPI("/admin/hubs/status", { hubId, status }),
    getAttendants: () => getDataAPI("/admin/attendants"),
    createAttendant: (data) => postDataAPI("/admin/attendants", data),
    resetPin: (id) => patchDataAPI(`/admin/attendants/${id}/pin`, {}),
    updateAttendantStatus: (attendantId, status) =>
      patchDataAPI("/admin/attendants/status", { attendantId, status }),
    assignAttendant: (hubId, attendantId) =>
      postDataAPI("/admin/hubs/attendant", { hubId, attendantId }),
  },

  // ── Attendant ─────────────────────────────────────────────────────────────
  attendant: {
    getDashboard: () => getDataAPI("/attendant/dashboard"),
  },
};

export default api;
