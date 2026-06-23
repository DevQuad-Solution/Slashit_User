// ── Storage keys ─────────────────────────────────────────────────────────────
// All localStorage keys in one place. Change here and it updates everywhere.
export const STORAGE_KEYS = {
  TOKEN:          'slashit_token',
  SESSION:        'slashit_session',
  PREFILL_EMAIL:  'slashit_prefill_email',
  SIGNUP_EMAIL:   'slashit_signup_email',
  SIGNUP_PW:      'slashit_signup_pw',
  VERIFY_TOKEN:   'slashit_verify_token',
  HUB_BACKUP:     'slashit_hub',
  PENDING_JOIN:   'slashit_pending_join',
  KYC_DRAFT_NIN:  'slashit_kyc_draft_nin',
  KYC_STARTED:    'slashit_kyc_draft_started',
};

// ── KYC status values ────────────────────────────────────────────────────────
// Backend returns kyc.status in title case — we normalise to lowercase internally
export const KYC_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING:    'pending',
  VERIFIED:   'verified',
  REJECTED:   'rejected',
};

// ── OTP reason values ────────────────────────────────────────────────────────
// Exact values the backend expects for POST /auth/code and POST /auth/verify-code
export const OTP_REASON = {
  SIGNUP:             'signup',
  FORGOT_PASSWORD:    'forgotPassword',
  EMAIL_VERIFICATION: 'emailVerification',
};

// ── Slash status values ──────────────────────────────────────────────────────
export const SLASH_STATUS = {
  OPEN:      'open',
  PURCHASING: 'purchasing',
  PICKUP:    'pickup',
  COMPLETED: 'completed',
  DISSOLVED: 'dissolved',
};

// ── Query stale times (ms) ───────────────────────────────────────────────────
export const STALE = {
  NEVER:    Infinity,
  ONE_MIN:  60 * 1000,
  FIVE_MIN: 5 * 60 * 1000,
  TEN_MIN:  10 * 60 * 1000,
};

// ── Feature flag keys ────────────────────────────────────────────────────────
// Must match backend flag_key enum exactly
export const FLAG_KEYS = {
  HOSTER_LEADERBOARD: 'hosteLeaderboard',
  BANTER_BOARD:       'banterBoard',
  REFERRAL_PROGRAM:   'referralProgram',
  PAID_PLAN_PACKAGES: 'paidPlanPackages',
  FOOD_PACKAGES:      'foodPackages',
  WALLET_FUNDING:     'walletFunding',
  TRANSPORTATION:     'transportation',
};
