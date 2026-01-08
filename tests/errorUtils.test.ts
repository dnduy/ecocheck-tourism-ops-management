/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/api';
import { getErrorMessage } from '../services/errorUtils';

describe('getErrorMessage', () => {
  it('prefers ApiError validation messages', () => {
    const error = new ApiError('Fallback', 422, { name: ['Tên không hợp lệ'] });
    expect(getErrorMessage(error)).toBe('Tên không hợp lệ');
  });

  it('uses ApiError message when no validation present', () => {
    const error = new ApiError('Phiên hết hạn', 401);
    expect(getErrorMessage(error)).toBe('Phiên hết hạn');
  });

  it('falls back to provided default', () => {
    const message = getErrorMessage(null, 'Mặc định');
    expect(message).toBe('Mặc định');
  });
});
