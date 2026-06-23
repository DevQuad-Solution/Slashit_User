import { axiosClient } from '../lib/axios';

// POST /auth/
// Body: { fullName, phoneNumber, email, password }
// Response 201: { message: "Email Sent, verify code next!" }
export const signup = (data) =>
  axiosClient.post('/auth/', data).then((r) => r.data);

// POST /auth/verify-code
// Body: { email, code, reason }
// reason values: "signup" | "forgotPassword" | "emailVerification"
// Response 200: { data: "jwt-token-string" }
export const verifyCode = (email, code, reason) =>
  axiosClient.post('/auth/verify-code', { email, code, reason }).then((r) => r.data);

// POST /auth/onboarding
// Body: { token, email, hubId }
// token = jwt string returned from verifyCode
// Response 200: { data: { user: { ...fields, userAccountDetails }, accessToken } }
export const onboarding = (token, email, hubId) =>
  axiosClient.post('/auth/onboarding', { token, email, hubId }).then((r) => r.data);

// POST /auth/signin
// Body: { identifier, password }
// Response 200: { data: { user: {...}, accessToken } }
export const signin = (identifier, password) =>
  axiosClient.post('/auth/signin', { identifier, password }).then((r) => r.data);

// POST /auth/code
// Body: { email, reason }
// reason values: "signup" | "forgotPassword" | "emailVerification"
// Response 200: { message: "Verification Code will be sent to your mail, if it exists!" }
export const sendCode = (email, reason) =>
  axiosClient.post('/auth/code', { email, reason }).then((r) => r.data);

// POST /auth/reset-password
// Body: { token, newPassword }
// token = jwt string returned from verifyCode with reason "forgotPassword"
// Response 200: { message: "Password updated successfully!" }
export const resetPassword = (token, newPassword) =>
  axiosClient.post('/auth/reset-password', { token, newPassword }).then((r) => r.data);

// GET /auth/me
// Response 200: { data: { _id, name, email, phone, role, kyc, userAccountDetails, hub, walletBalance } }
export const getMe = () =>
  axiosClient.get('/auth/me').then((r) => r.data);

// POST /auth/kyc — multipart/form-data
// Fields: nin (string 11 chars), image (File), consent (boolean)
// Response 200: { data: { verified, kycStatus, walletBalance, verificationDetails, user } }
export const submitKyc = (nin, imageFile, consent) => {
  const form = new FormData();
  form.append('nin', nin);
  form.append('image', imageFile);
  form.append('consent', consent);
  return axiosClient
    .post('/auth/kyc', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};
