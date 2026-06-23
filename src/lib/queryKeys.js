/**
 * React Query key factory
 * Centralised here so:
 * - invalidations are consistent
 * - no string typos
 * - easy to find all queries for a domain
 *
 * Convention: arrays so React Query can do partial key matching on invalidation.
 * e.g. queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.all() })
 *      will invalidate both list and detail queries.
 */

export const QUERY_KEYS = {
  // Auth
  AUTH: {
    me: () => ['auth', 'me'],
  },

  // Slashes
  SLASHES: {
    all:    ()         => ['slashes'],
    list:   (params)   => ['slashes', 'list', params],
    search: (params)   => ['slashes', 'search', params],
    detail: (id)       => ['slashes', 'detail', id],
    qr:     (id)       => ['slashes', 'qr', id],
  },

  // Products
  PRODUCTS: {
    list: () => ['products', 'list'],
  },

  // Hubs
  HUBS: {
    states:  ()              => ['hubs', 'states'],
    cities:  (state)         => ['hubs', 'cities', state],
    list:    (state, city)   => ['hubs', 'list', state, city],
    ratings: (hubId)         => ['hubs', 'ratings', hubId],
  },

  // Transactions
  TRANSACTIONS: {
    list: (page, limit) => ['transactions', 'list', page, limit],
  },

  // Notifications
  NOTIFICATIONS: {
    mine: () => ['notifications', 'mine'],
  },

  // AI Radar
  AI: {
    radar: (hubId) => ['ai', 'radar', hubId],
  },
};
