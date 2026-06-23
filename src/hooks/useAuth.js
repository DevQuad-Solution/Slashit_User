import { useMutation, useQuery } from '@tanstack/react-query';
import {
  signup,
  verifyCode,
  onboarding,
  signin,
  sendCode,
  resetPassword,
  getMe,
  submitKyc,
} from '../services/auth.service';

export const QUERY_KEYS = {
  ME: 'auth.me',
};

// POST /auth/ — register
export const useSignup = () =>
  useMutation({ mutationFn: (data) => signup(data) });

// POST /auth/verify-code
// reason: "signup" | "forgotPassword" | "emailVerification"
export const useVerifyCode = () =>
  useMutation({
    mutationFn: ({ email, code, reason }) => verifyCode(email, code, reason),
  });

// POST /auth/onboarding
export const useOnboarding = () =>
  useMutation({
    mutationFn: ({ token, email, hubId }) => onboarding(token, email, hubId),
  });

// POST /auth/signin
export const useSignin = () =>
  useMutation({
    mutationFn: ({ identifier, password }) => signin(identifier, password),
  });

// POST /auth/code
// reason: "signup" | "forgotPassword" | "emailVerification"
export const useSendCode = () =>
  useMutation({
    mutationFn: ({ email, reason }) => sendCode(email, reason),
  });

// POST /auth/reset-password
// Takes token (from verifyCode) + newPassword
export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ token, newPassword }) => resetPassword(token, newPassword),
  });

// GET /auth/me
export const useGetMe = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.ME],
    queryFn: () => getMe().then((r) => r.data),
    ...options,
  });

// POST /auth/kyc
export const useSubmitKyc = () =>
  useMutation({
    mutationFn: ({ nin, imageFile, consent }) => submitKyc(nin, imageFile, consent),
  });
