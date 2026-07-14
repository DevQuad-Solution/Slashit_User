import { getDataAPI } from "../lib/axios";

// ── Transactions ─────────────────────────────────────────────────────────────
// GET /transaction?page&limit
// Response 200: { data: { transactions: [...], pagination: { page, limit, total, pages } } }
export const getTransactions = (page = 1, limit = 20) =>
  getDataAPI("/transaction", { params: { page, limit } }).then((r) => r.data);

// ── Notifications ────────────────────────────────────────────────────────────
// GET /notifications/me
// Response 200: { data: [{ _id, title, message, createdAt }] }
export const getMyNotifications = () =>
  getDataAPI("/notifications/me").then((r) => r.data);

// ── AI Radar ────────────────────────────────────────────────────────────────
// GET /ai/radar?hubId
// Response 200: { data: { hubId, deals: [{ _id, productName, pricePerSlot, slotsLeft, radarScore, expiresAt, radarHeadline }], cachedAt } }
export const getRadarDeals = (hubId) =>
  getDataAPI("/ai/radar", { params: { hubId } }).then((r) => r.data);
