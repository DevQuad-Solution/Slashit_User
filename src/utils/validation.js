// ── Validation helpers ────────────────────────────────────────────────────────
// Rules derived directly from backend validation error messages in the docs.
// Return format: { fieldName: 'error message' } or {} if valid.

export function validateSignup({ fullName, phoneNumber, email, password }) {
  const errors = {};
  if (!fullName || !fullName.trim()) errors.fullName = '"fullName" is required';
  else if (fullName.trim().length < 3) errors.fullName = '"fullName" must be at least 3 characters';

  if (!email || !email.trim()) errors.email = '"email" is required';
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = '"email" must be a valid email';

  if (!phoneNumber || !phoneNumber.trim()) errors.phoneNumber = '"phoneNumber" is required';
  else if (!/^\+?[0-9]{10,15}$/.test(phoneNumber.replace(/\s/g, '')))
    errors.phoneNumber = '"phoneNumber" must be a valid phone number';

  if (!password) errors.password = '"password" is required';
  else if (password.length < 6) errors.password = '"password" length must be at least 6 characters';

  return errors;
}

export function validateSignin({ identifier, password }) {
  const errors = {};
  if (!identifier || !identifier.trim()) errors.identifier = '"identifier" is required';
  if (!password) errors.password = '"password" is required';
  return errors;
}

export function validateForgotPassword({ email }) {
  const errors = {};
  if (!email || !email.trim()) errors.email = '"email" is required';
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = '"email" must be a valid email';
  return errors;
}

export function validateResetPassword({ newPassword, confirmPassword }) {
  const errors = {};
  if (!newPassword) errors.newPassword = '"newPassword" is required';
  else if (newPassword.length < 6) errors.newPassword = '"newPassword" must be at least 6 characters';
  if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function validateKyc({ nin }) {
  const errors = {};
  if (!nin || !nin.trim()) errors.nin = '"nin" is required';
  else if (nin.trim().length !== 11) errors.nin = '"nin" length must be 11 characters';
  else if (!/^\d{11}$/.test(nin.trim())) errors.nin = '"nin" must be an 11-digit number';
  return errors;
}

export function validateCreateSlash({ productId, hubId }) {
  const errors = {};
  if (!productId) errors.productId = '"productId" is required';
  if (!hubId) errors.hubId = '"hubId" is required';
  return errors;
}

export function validateHubRating({ rating }) {
  const errors = {};
  if (!rating) errors.rating = '"rating" is required';
  else if (rating < 1 || rating > 5) errors.rating = '"rating" must be between 1 and 5';
  return errors;
}

// Normalize Nigerian phone number to +234 format
export function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+234' + digits.slice(1);
  if (digits.startsWith('234') && digits.length === 13) return '+' + digits;
  if (digits.startsWith('+234')) return phone;
  return phone;
}

// Check if object has any errors
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
