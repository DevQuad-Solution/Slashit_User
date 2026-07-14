import {
  getDataAPI,
  postDataAPI,
  putDataAPI,
  patchDataAPI,
  deleteDataAPI,
} from "../lib/axios";

// GET /slash/?category&page&limit
// Response 200: { data: { slashes: [...], page, total, totalPages } }
export const getSlashes = (params = {}) =>
  getDataAPI("/slash/", { params }).then((r) => r.data);

// GET /slash/search?query&category&page&limit
// Response 200: { data: { slashes: [...], page, total, totalPages } }
export const searchSlashes = (params = {}) =>
  getDataAPI("/slash/search", { params }).then((r) => r.data);

// GET /slash/:id
// Response 200: { data: { _id, product, hub, joined, status, timeLimit, createdAt } }
export const getSlash = (id) => getDataAPI(`/slash/${id}`).then((r) => r.data);

// POST /slash/
// Body: { productId, timeLimit, hubId }
// Response 200: { data: { slash: {...}, aiLaunchMessage } }
export const createSlash = (productId, timeLimit, hubId) =>
  postDataAPI("/slash/", { productId, timeLimit, hubId }).then((r) => r.data);

// POST /slash/:id — join slash
// Response 200: { data: { _id, joined: [...] } }
export const joinSlash = (id) =>
  postDataAPI(`/slash/${id}`).then((r) => r.data);

// PATCH /slash/:id — leave slash
// Response 200: { data: { _id, joined: [] } }
export const leaveSlash = (id) =>
  patchDataAPI(`/slash/${id}`).then((r) => r.data);

// PUT /slash/:id — edit slash timeLimit only
// Body: { timeLimit }
// Response 200: { data: { _id, timeLimit } }
export const editSlash = (id, timeLimit) =>
  putDataAPI(`/slash/${id}`, { timeLimit }).then((r) => r.data);

// DELETE /slash/:id — delete own slash
// Response 200: { message: "Slash deleted successfully!" }
export const deleteSlash = (id) =>
  deleteDataAPI(`/slash/${id}`).then((r) => r.data);

// GET /slash/qr?id=slashId
// Response 200: { data: { qrCode, claimCode, claimed } }
export const getSlashQR = (id) =>
  getDataAPI("/slash/qr", { params: { id } }).then((r) => r.data);

// POST /slash/qr — verify QR code
// Body: { qrCode }
// Response 200: { data: { slash, claimed } }
export const verifyQR = (qrCode) =>
  postDataAPI("/slash/qr", { qrCode }).then((r) => r.data);

// POST /slash/claim — verify claim code
// Body: { code }
// Response 200: { data: { slash, claimed } }
export const verifyClaim = (code) =>
  postDataAPI("/slash/claim", { code }).then((r) => r.data);
