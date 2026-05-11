// AeroNetB API client
const API_BASE = '/api';

const api = {
  token: null,

  setToken(t) { this.token = t; },

  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (this.token) opts.headers['Authorization'] = `Bearer ${this.token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  },

  get:    (path)        => api.request('GET',    path),
  post:   (path, body)  => api.request('POST',   path, body),
  patch:  (path, body)  => api.request('PATCH',  path, body),
  delete: (path)        => api.request('DELETE', path),

  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  me:    ()                => api.get('/auth/me'),

  // Suppliers
  getSuppliers:           ()   => api.get('/suppliers'),
  getSupplier:            (id) => api.get(`/suppliers/${id}`),
  getSupplierPerformance: (id) => api.get(`/suppliers/${id}/performance`),
  createSupplier:         (d)  => api.post('/suppliers', d),

  // Parts
  getParts: () => api.get('/parts'),

  // Orders
  getOrders:       ()         => api.get('/orders'),
  getOrder:        (id)       => api.get(`/orders/${id}`),
  createOrder:     (d)        => api.post('/orders', d),
  updateOrderStatus:(id,status)=>api.patch(`/orders/${id}/status`, { status }),

  // Shipments
  getShipments:    ()         => api.get('/orders/shipments/all'),
  getShipment:     (id)       => api.get(`/orders/shipments/${id}`),
  addShipmentUpdate:(id,d)    => api.post(`/orders/shipments/${id}/updates`, d),

  // QC Reports
  getQCReports:    (params)   => api.get('/qc-reports' + (params ? '?' + new URLSearchParams(params) : '')),
  getQCReport:     (id)       => api.get(`/qc-reports/${id}`),
  createQCReport:  (d)        => api.post('/qc-reports', d),
  addQCVersion:    (id, d)    => api.patch(`/qc-reports/${id}`, d),

  // Certifications
  getCertifications:  ()      => api.get('/certifications'),
  createCertification:(d)     => api.post('/certifications', d),
  approveCertification:(id)   => api.post(`/certifications/${id}/approve`, {}),

  // IoT
  getIoTDevices:   ()         => api.get('/iot/devices'),
  getIoTLogs:      (devId, h) => api.get(`/iot/logs/${devId}?hours=${h||24}`),

  // Dashboard stats
  getDashboardStats: ()       => api.get('/dashboard/stats'),

  // Audit log
  getAuditLog: ()             => api.get('/audit-log'),
};
