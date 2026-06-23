import { axiosClient } from '../lib/axios';

// GET /hub/ — public
// Response 200: { data: [{ state, cityCount }] }
export const getStates = () =>
  axiosClient.get('/hub/').then((r) => r.data);

// GET /hub/:state — public
// Response 200: { data: [{ city, hubCount }] }
export const getCities = (state) =>
  axiosClient.get(`/hub/${encodeURIComponent(state)}`).then((r) => r.data);

// GET /hub/:state/:city — public
// Response 200: { data: [{ _id, name, city, state, address, attendant }] }
export const getHubs = (state, city) =>
  axiosClient
    .get(`/hub/${encodeURIComponent(state)}/${encodeURIComponent(city)}`)
    .then((r) => r.data);

// GET /hub/:hubId/ratings — public
// Response 200: { data: { statistics: { totalRatings, averageRating, fiveStarPercent, starCounts }, reviews: [...] } }
export const getHubRatings = (hubId) =>
  axiosClient.get(`/hub/${hubId}/ratings`).then((r) => r.data);

// POST /hub/:hubId/rating — authenticated
// Body: { rating, comment, slashId }
// rating must be 1-5
export const rateHub = (hubId, rating, comment, slashId) =>
  axiosClient.post(`/hub/${hubId}/rating`, { rating, comment, slashId }).then((r) => r.data);
