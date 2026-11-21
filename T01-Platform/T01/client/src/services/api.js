import axios from 'axios';

// Same-origin in dev (Vite proxy) and prod (Express serves the build). Auth = httpOnly cookie.
const api = axios.create({ baseURL: '/api', withCredentials: true });

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgot: (email) => api.post('/auth/forgot-password', { email }),
  reset: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};
export const productAPI = {
  featured: () => api.get('/products/featured'),
  list: (params) => api.get('/products', { params }),
  get: (slug) => api.get(`/products/${slug}`),
};
export const contentAPI = { get: (key) => api.get(`/content/${key}`) };
export const orderAPI = {
  checkout: (productId) => api.post('/orders/checkout', { productId }),
  status: (orderId) => api.get(`/orders/${orderId}/status`),
  mine: () => api.get('/orders/my'),
  mockPay: (orderId, success) => api.post(`/orders/${orderId}/mock-pay`, { success }),
};
export const libraryAPI = {
  list: () => api.get('/library'),
  open: (productId) => api.get(`/library/${productId}/open`),
  read: (slug) => api.get(`/library/read/${slug}`),
  setTask: (slug, blockId, done) => api.put(`/library/read/${slug}/task`, { blockId, done }),
  answerQuiz: (slug, blockId, choice) => api.post(`/library/read/${slug}/quiz`, { blockId, choice }),
};
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle-status`),
  orders: (params) => api.get('/admin/orders', { params }),
  verifyOrder: (orderId) => api.post(`/admin/orders/${orderId}/verify`),
  products: () => api.get('/admin/products'),
  saveProduct: (id, formData) =>
    id ? api.put(`/admin/products/${id}`, formData) : api.post('/admin/products', formData),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getContent: (id) => api.get(`/admin/products/${id}/content`),
  saveProductContent: (id, chapters) => api.put(`/admin/products/${id}/content`, { chapters }),
  saveContent: (key, data) => api.put(`/admin/content/${key}`, { data }),
};

export default api;
