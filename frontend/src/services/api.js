import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================
// API SERVICES
// ============================================

export const authAPI = {
  login: (email, password) => 
    api.post('/api/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/api/auth/register', userData),
};

export const productAPI = {
  getProducts: () => api.get('/api/products'),
  
  addProduct: (productData) => 
    api.post('/api/products', productData),
};

export const orderAPI = {
  getOrders: () => api.get('/api/orders'),
  
  createOrder: (orderData) => 
    api.post('/api/orders', orderData),
  
  updateOrderStatus: (orderId, status) => 
    api.put(`/api/orders/${orderId}`, { status }),
};

export const mlAPI = {
  predictDemand: (data) => 
    api.post('/api/prediction', data),
  
  getPredictionHistory: () => 
    api.get('/api/prediction/history'),
};

export const routeAPI = {
  optimizeRoutes: (data) => 
    api.post('/api/optimize', data),
};

export const pricingAPI = {
  calculatePrice: (data) => 
    api.post('/api/pricing', data),
};

export const paymentAPI = {
  initiatePayment: (data) => 
    api.post('/api/payments/initiate', data),
  
  confirmPayment: (paymentId) => 
    api.post(`/api/payments/${paymentId}/confirm`),
  
  getPaymentHistory: () => 
    api.get('/api/payments/history'),
};

export const metricsAPI = {
  getCO2Metrics: () => 
    api.get('/api/metrics/co2'),
  
  getDashboardMetrics: () => 
    api.get('/api/metrics/dashboard'),
};

export default api;
