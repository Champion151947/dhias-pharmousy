// The API and the storefront are served from the same origin in production, so
// a relative base is all that is needed. Vite proxies this in development.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function parse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Request failed');
    error.status = response.status;
    error.code = data.error?.code;
    error.details = data.error?.details;
    throw error;
  }
  return data;
}

async function request(path, options = {}) {
  return parse(
    await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json', ...options.headers },
    }),
  );
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export const productsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')),
    ).toString();
    return api.get(`/products${q ? `?${q}` : ''}`);
  },
  get: (idOrSlug) => api.get(`/products/${idOrSlug}`),
  categories: () => api.get('/products/categories/list'),
  suggestions: (q) => api.get(`/products/search/suggest?q=${encodeURIComponent(q)}`),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart/items', { product_id: productId, quantity }),
  update: (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/items/${productId}`),
  clear: () => api.delete('/cart'),
  reorder: () => api.post('/cart/reorder'),
};

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  signup: (name, email, phone, password) => api.post('/auth/signup', { name, email, phone, password }),
  google: (name, email, picture) => api.post('/auth/google', { name, email, picture }),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.patch('/auth/me', data),
  requestOtp: (phone, name) => api.post('/auth/otp/request', { phone, name }),
  verifyOtp: (phone, code, name) => api.post('/auth/otp/verify', { phone, code, name }),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  list: () => api.get('/orders/mine'),
  get: (id) => api.get(`/orders/${id}`),
  track: (orderNo) => api.get(`/orders/track/${orderNo}`),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
};

export const addressesApi = {
  list: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.post(`/addresses/${id}/default`),
};

export const adminApi = {
  overview: () => api.get('/admin/overview'),
  products: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/products${q ? `?${q}` : ''}`);
  },
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  setStock: (id, stock) => api.patch(`/admin/products/${id}/stock`, { stock }),
  orders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/orders${q ? `?${q}` : ''}`);
  },
  order: (id) => api.get(`/admin/orders/${id}`),
  setOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  coupons: () => api.get('/admin/coupons'),
  banners: () => api.get('/admin/banners'),
  prescriptions: (status) =>
    api.get(`/admin/prescriptions${status ? `?status=${status}` : ''}`),
};

export const prescriptionsApi = {
  list: () => api.get('/prescriptions'),
  upload: (file, meta = {}) => {
    const formData = new FormData();
    formData.append('prescription', file);
    for (const [key, value] of Object.entries(meta)) {
      if (value) formData.append(key, value);
    }
    return request('/prescriptions', { method: 'POST', body: formData });
  },
  delete: (id) => api.delete(`/prescriptions/${id}`),
  fileUrl: (id) => `${API_BASE}/prescriptions/${id}/file`,
};

export const siteApi = {
  get: () => api.get('/site'),
  banners: (placement) =>
    api.get(`/site/banners${placement ? `?placement=${placement}` : ''}`),
};
