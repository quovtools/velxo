import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...customOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) searchParams.append(key, String(val));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && !(customOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject JWT from localStorage
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Inject admin console password when present (admin pages)
  if (typeof window !== 'undefined') {
    const adminPassword = sessionStorage.getItem('velxo_admin_password');
    if (adminPassword) headers.set('x-admin-password', adminPassword);
  }

  const config: RequestInit = { ...customOptions, headers };

  // Retry once — handles Render cold-start timeouts
  const fetchWithRetry = async (attempt: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (attempt < 2 && (err.name === 'AbortError' || err.message === 'Failed to fetch')) {
        console.warn(`[API] Attempt ${attempt} failed for ${url}, retrying...`);
        await new Promise((r) => setTimeout(r, 2000));
        return fetchWithRetry(attempt + 1);
      }
      console.error('[API] Network error on', url, err);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The server may be starting up — please try again.');
      }
      throw new Error(`Cannot reach the server. (${err.message})`);
    }
  };

  const response = await fetchWithRetry(1);

  let responseData: any;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const rawMessage = responseData?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : rawMessage || (typeof responseData === 'string' ? responseData : 'Something went wrong');
    const err = new Error(message) as any;
    err.status = response.status;
    err.data = responseData;
    throw err;
  }

  return responseData;
}

export interface EscrowData {
  id: string;
  status: string;
  amount: number | string;
  currency: string;
  paymentLink?: string | null;
  paymentMethod?: 'FLUTTERWAVE' | 'PAYMENT_IO' | null;
  order?: any;
}

export async function getEscrowByOrder(orderId: string): Promise<EscrowData> {
  return api.get<EscrowData>(`/escrow/order/${orderId}`);
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  postFormData: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
