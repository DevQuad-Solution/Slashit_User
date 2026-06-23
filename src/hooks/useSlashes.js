import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';
import {
  getSlashes,
  searchSlashes,
  getSlash,
  createSlash,
  joinSlash,
  leaveSlash,
  editSlash,
  deleteSlash,
  getSlashQR,
  verifyQR,
  verifyClaim,
} from '../services/slashes.service';

export const useGetSlashes = (params = {}, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.SLASHES.list(params),
    queryFn:  () => getSlashes(params).then((r) => r.data),
    ...options,
  });

export const useSearchSlashes = (params = {}, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.SLASHES.search(params),
    queryFn:  () => searchSlashes(params).then((r) => r.data),
    enabled:  !!params.query,
    ...options,
  });

export const useGetSlash = (id, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.SLASHES.detail(id),
    queryFn:  () => getSlash(id).then((r) => r.data),
    enabled:  !!id,
    ...options,
  });

export const useGetSlashQR = (id, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.SLASHES.qr(id),
    queryFn:  () => getSlashQR(id).then((r) => r.data),
    enabled:  !!id,
    ...options,
  });

export const useCreateSlash = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, timeLimit, hubId }) => createSlash(productId, timeLimit, hubId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.all() }),
  });
};

export const useJoinSlash = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => joinSlash(id),
    onSuccess:  (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.all() });
    },
  });
};

export const useLeaveSlash = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => leaveSlash(id),
    onSuccess:  (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.all() });
    },
  });
};

export const useEditSlash = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, timeLimit }) => editSlash(id, timeLimit),
    onSuccess:  (_, { id }) => qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.detail(id) }),
  });
};

export const useDeleteSlash = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteSlash(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SLASHES.all() }),
  });
};

export const useVerifyQR    = () => useMutation({ mutationFn: (qrCode) => verifyQR(qrCode) });
export const useVerifyClaim = () => useMutation({ mutationFn: (code)   => verifyClaim(code) });
