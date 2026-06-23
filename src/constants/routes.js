/**
 * Route configuration for the SlashIt user app.
 *
 * ROUTE_PATHS — string constants used in navigation calls.
 * ROUTE_META  — metadata (title, auth requirement, feature flag) per route.
 *
 * Usage:
 *   import { ROUTE_PATHS } from '../../constants/routes';
 *   nav(ROUTE_PATHS.HOME);
 *
 * Adding a new route:
 *   1. Add path to ROUTE_PATHS
 *   2. Add meta to ROUTE_META
 *   3. Register route in App.jsx
 *   4. Create page file in features/<feature>/pages/
 */

export const ROUTE_PATHS = {
  // Public routes
  SPLASH:          '/',
  LOGIN:           '/login',
  SIGNUP:          '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  TERMS:           '/terms',
  PRIVACY:         '/privacy',
  REFUND_POLICY:   '/refund-policy',
  FAQ:             '/faq',
  JOIN:            '/join/:id',
  ONBOARDING:      '/onboarding',

  // Protected routes
  HOME:            '/home',
  SEARCH:          '/search',
  CREATE:          '/create',
  SLASH_DETAIL:    '/slash/:id',
  PACKAGES:        '/packages',
  PACKAGE_DETAIL:  '/package/:id',
  LEADERBOARD:     '/leaderboard',
  WALLET:          '/wallet',
  WALLET_FUND:     '/wallet/fund',
  NOTIFICATIONS:   '/notifications',
  KYC:             '/kyc',
  CHANGE_HUB:      '/change-hub',
  PROFILE:         '/profile',
  MY_SLASHES:      '/slashes',
  SUBSCRIPTION:    '/subscription',
  REFERRAL:        '/referral',
  SETTINGS:        '/settings',
  MESSAGES:        '/messages',
};

// Build parameterised paths
export const buildPath = {
  slashDetail:   (id) => `/slash/${id}`,
  packageDetail: (id) => `/package/${id}`,
  join:          (id) => `/join/${id}`,
};
