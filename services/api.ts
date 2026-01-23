// API Base utilities with authentication
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';
const API_TIMEOUT_MS = 12000;

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  body?: any;

  constructor(message: string, status: number, errors?: Record<string, string[]>, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.body = body;
  }
}

const parseMessage = (errorData: any, status: number) => {
  if (!errorData) return '';
  if (typeof errorData === 'string') return errorData;
  if (errorData.message) return errorData.message;
  if (errorData.error) return errorData.error;
  if (errorData.errors) {
    const first = Object.values(errorData.errors).flat()[0];
    if (first) return String(first);
  }
  if (status === 404) return 'Không tìm thấy tài nguyên';
  return '';
};

export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit & { data?: any } = {}
): Promise<T> => {
  const { data, ...fetchOptions } = options;
  const token = localStorage.getItem('api_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(fetchOptions.headers as HeadersInit)
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });

    // Handle 401 - dispatch event and clear token
    if (response.status === 401) {
      localStorage.removeItem('api_token');
      localStorage.removeItem('current_user');
      
      // Dispatch custom event instead of hard redirect
      window.dispatchEvent(new CustomEvent('tokenExpired', {
        detail: { message: 'Phiên đăng nhập hết hạn' }
      }));
      
      throw new ApiError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.', 401);
    }

    // Handle 403
    if (response.status === 403) {
      throw new ApiError('Bạn không có quyền thực hiện hành động này', 403);
    }

    // Handle other errors
    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch (_err) {
        // ignore JSON parse errors, use fallback
      }
      const message = parseMessage(errorData, response.status) || `API error: ${response.status}`;
      throw new ApiError(message, response.status, errorData?.errors, errorData);
    }

    try {
      return await response.json();
    } catch (_err) {
      // Some endpoints may return empty body on success
      return undefined as unknown as T;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Yêu cầu quá thời gian, vui lòng thử lại.', 0);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Không kết nối được máy chủ', 0);
  } finally {
    clearTimeout(timeoutId);
  }
};

// Specific HTTP methods
export const apiGet = <T = any>(endpoint: string) =>
  apiCall<T>(endpoint, { method: 'GET' });

export const apiPost = <T = any>(endpoint: string, data?: any) =>
  apiCall<T>(endpoint, { method: 'POST', data });

export const apiPatch = <T = any>(endpoint: string, data?: any) =>
  apiCall<T>(endpoint, { method: 'PATCH', data });

export const apiPut = <T = any>(endpoint: string, data?: any) =>
  apiCall<T>(endpoint, { method: 'PUT', data });

export const apiDelete = <T = any>(endpoint: string) =>
  apiCall<T>(endpoint, { method: 'DELETE' });
