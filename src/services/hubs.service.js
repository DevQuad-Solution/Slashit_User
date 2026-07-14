import { getDataAPI, postDataAPI } from "../lib/axios";

// GET /hub/ — public
// Response 200: { data: [{ state, cityCount }] }
export const getStates = () => getDataAPI("/hub/").then((r) => r.data);

// GET /hub/:state — public
// Response 200: { data: [{ city, hubCount }] }
export const getCities = (state) =>
  getDataAPI(`/hub/${encodeURIComponent(state)}`).then((r) => r.data);

// GET /hub/:state/:city — public
// Response 200: { data: [{ _id, name, city, state, address, attendant }] }
export const getHubs = (state, city) =>
  getDataAPI(
    `/hub/${encodeURIComponent(state)}/${encodeURIComponent(city)}`,
  ).then((r) => r.data);

// GET /hub/:hubId/ratings — public
// Response 200: { data: { statistics: { totalRatings, averageRating, fiveStarPercent, starCounts }, reviews: [...] } }
export const getHubRatings = (hubId) =>
  getDataAPI(`/hub/${hubId}/ratings`).then((r) => r.data);

// POST /hub/:hubId/rating — authenticated
// Body: { rating, comment, slashId }
// rating must be 1-5
export const rateHub = (hubId, rating, comment, slashId) =>
  postDataAPI(`/hub/${hubId}/rating`, { rating, comment, slashId }).then(
    (r) => r.data,
  );
