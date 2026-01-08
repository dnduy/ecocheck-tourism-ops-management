import { ApiError } from './api';

export const getErrorMessage = (err: unknown, fallback = 'Đã có lỗi xảy ra') => {
  if (err instanceof ApiError) {
    const validation = err.errors && Object.values(err.errors).flat();
    if (validation && validation.length) return validation[0];
    if (err.message) return err.message;
  }

  if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message || fallback;
  }

  if (typeof err === 'string' && err.trim()) return err;

  return fallback;
};
