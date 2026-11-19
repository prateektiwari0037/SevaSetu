import axios from 'axios';

const TOKEN_KEY = 'sevasetu_token';
const USER_KEY = 'sevasetu_user';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight refresh: concurrent 401s share one /auth/refresh call.
// The backend issues an httpOnly refresh cookie on login/register (Member 1's auth).
let refreshPromise = null;
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/v1/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const newToken = res.data?.data?.token;
        if (!newToken) throw new Error('No token in refresh response');
        localStorage.setItem(TOKEN_KEY, newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const AUTH_PATHS_WITHOUT_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const toApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  const apiError = new Error(message);
  apiError.status = error.response?.status;
  apiError.errors = error.response?.data?.errors || null;
  return apiError;
};

// Response interceptor to unwrap data and handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config || {};
    const isAuthPath = AUTH_PATHS_WITHOUT_REFRESH.some((p) => original.url?.startsWith(p));

    if (error.response?.status === 401 && !original._retried && !isAuthPath && localStorage.getItem(TOKEN_KEY)) {
      original._retried = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
        return api(original);
      } catch {
        // fall through to session-expired handling
      }
    }

    if (error.response?.status === 401 && !isAuthPath) {
      // Clear token if invalid or expired
      if (localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(toApiError(error));
  }
);

export default api;
