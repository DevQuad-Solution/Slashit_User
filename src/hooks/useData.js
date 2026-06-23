import { useQuery, useMutation } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';
import { STALE } from '../constants';
import { getStates, getCities, getHubs, getHubRatings, rateHub } from '../services/hubs.service';
import { getProducts } from '../services/products.service';
import { getTransactions, getMyNotifications, getRadarDeals } from '../services/misc.service';

// ── Hubs ──────────────────────────────────────────────────────────────────────
export const useGetStates = (options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.HUBS.states(),
    queryFn:  () => getStates().then((r) => r.data),
    staleTime: STALE.TEN_MIN,
    ...options,
  });

export const useGetCities = (state, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.HUBS.cities(state),
    queryFn:  () => getCities(state).then((r) => r.data),
    enabled:  !!state,
    staleTime: STALE.TEN_MIN,
    ...options,
  });

export const useGetHubs = (state, city, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.HUBS.list(state, city),
    queryFn:  () => getHubs(state, city).then((r) => r.data),
    enabled:  !!state && !!city,
    staleTime: STALE.FIVE_MIN,
    ...options,
  });

export const useGetHubRatings = (hubId, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.HUBS.ratings(hubId),
    queryFn:  () => getHubRatings(hubId).then((r) => r.data),
    enabled:  !!hubId,
    ...options,
  });

export const useRateHub = () =>
  useMutation({
    mutationFn: ({ hubId, rating, comment, slashId }) => rateHub(hubId, rating, comment, slashId),
  });

// ── Products ──────────────────────────────────────────────────────────────────
export const useGetProducts = (options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.list(),
    queryFn:  () => getProducts().then((r) => r.data),
    staleTime: STALE.FIVE_MIN,
    ...options,
  });

// ── Transactions ──────────────────────────────────────────────────────────────
export const useGetTransactions = (page = 1, limit = 20, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.TRANSACTIONS.list(page, limit),
    queryFn:  () => getTransactions(page, limit).then((r) => r.data),
    ...options,
  });

// ── Notifications ─────────────────────────────────────────────────────────────
export const useGetMyNotifications = (options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS.mine(),
    queryFn:  () => getMyNotifications().then((r) => r.data),
    ...options,
  });

// ── AI Radar ──────────────────────────────────────────────────────────────────
export const useGetRadarDeals = (hubId, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.AI.radar(hubId),
    queryFn:  () => getRadarDeals(hubId).then((r) => r.data),
    enabled:  !!hubId,
    staleTime: STALE.ONE_MIN,
    ...options,
  });
