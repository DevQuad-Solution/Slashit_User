/**
 * Session utilities
 * Functions for normalizing backend API responses into our session shape.
 * Used by Login, Onboarding, Signup, and Splash flows.
 *
 * IMPORTANT: Do not rename backend field names.
 * The backend returns `userAccountDetails`, `kyc.status`, `hub` as ObjectId, etc.
 */

/**
 * extractUser
 * Extracts the user object from /auth/me or /auth/signin responses.
 * These two endpoints return different shapes:
 *   /auth/me:    { data: { name, kyc, ... } }            — data IS the user
 *   /auth/signin: { data: { user: { ... }, accessToken } } — data.user is the user
 */
export const extractUser = (res) => {
  if (!res?.data) return null;
  // signin/onboarding shape — data.user is nested
  if (res.data.user && typeof res.data.user === 'object' && res.data.user.name) {
    return res.data.user;
  }
  // me shape — data itself is the user
  if (res.data.name || res.data._id || res.data.email) return res.data;
  return null;
};

/**
 * mapUser
 * Maps raw backend user data to the internal session shape.
 * Always merges onto `prev` so existing fields (like hubId) are preserved
 * when the backend response omits them.
 */
export const mapUser = (raw, prev = {}) => {
  if (!raw) return prev;
  const acct = raw.userAccountDetails || {};
  return {
    ...prev, ...raw,
    id:            raw._id          || raw.id           || prev.id,
    name:          raw.name         || raw.fullName      || prev.name         || '',
    email:         raw.email        || prev.email        || '',
    phone:         raw.phone        || raw.phoneNumber   || prev.phone        || '',
    walletBalance: raw.walletBalance ?? prev.walletBalance ?? 0,
    // KYC: backend returns kyc.status in title case ("Unverified", "Verified", "Pending")
    // we normalise to lowercase internally
    kycStatus:     (raw.kyc?.status || raw.kycStatus || prev.kycStatus || 'unverified').toLowerCase(),
    plan:          raw.plan         || raw.subscription  || prev.plan         || 'free',
    referralCode:  raw.referralCode || prev.referralCode || '',
    // hub field from backend is a plain ObjectId string
    hubId:         raw.hub          || raw.hubId         || raw.hub?._id     || prev.hubId   || '',
    hubName:       raw.hub?.name    || raw.hubName       || prev.hubName     || '',
    city:          raw.hub?.city    || raw.city          || prev.city        || '',
    state:         raw.hub?.state   || raw.state         || prev.state       || '',
    // Account details live under userAccountDetails
    accountNumber: acct.accountNumber || acct.number    || prev.accountNumber || '',
    accountBank:   acct.bankName      || acct.bank      || prev.accountBank   || 'Wema bank',
    accountName:   acct.accountName   || acct.name      || prev.accountName   || '',
    accountRef:    acct.accountRef    || prev.accountRef || '',
  };
};

/**
 * normalizePhone
 * Converts Nigerian phone numbers to +234 international format.
 */
export const normalizePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+234' + digits.slice(1);
  if (digits.startsWith('234') && digits.length === 13) return '+' + digits;
  return phone;
};
