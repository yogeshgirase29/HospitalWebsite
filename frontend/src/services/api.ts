import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    showLoader?: boolean;
    hideLoader?: boolean;
    metadata?: {
      loaderActive?: boolean;
      requestId?: string;
    };
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type LoadingListener = (isLoading: boolean) => void;
const listeners = new Set<LoadingListener>();

export const addLoadingListener = (listener: LoadingListener) => {
  listeners.add(listener);
};

export const removeLoadingListener = (listener: LoadingListener) => {
  listeners.delete(listener);
};

const activeRequestIds = new Set<string>();
let lastLoadingState = false;

const updateLoading = (config: any, isStart: boolean) => {
  if (!config) return;
  if (!config.metadata) {
    config.metadata = {};
  }
  
  if (isStart) {
    if (!config.metadata.requestId) {
      config.metadata.requestId = Math.random().toString(36).substring(2, 11);
    }
    activeRequestIds.add(config.metadata.requestId);
  } else {
    if (config.metadata.requestId) {
      activeRequestIds.delete(config.metadata.requestId);
    }
  }

  const loading = activeRequestIds.size > 0;
  if (loading !== lastLoadingState) {
    lastLoadingState = loading;
    listeners.forEach(cb => cb(loading));
  }
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial for sessions/cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  config => {
    // Attach JWT token if present
    const adminToken = sessionStorage.getItem('adminToken');
    const employeeToken = sessionStorage.getItem('employeeToken');
    const compounderToken = sessionStorage.getItem('compounderToken');
    const token = adminToken || employeeToken || compounderToken;
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isWrite = ['post', 'put', 'patch', 'delete'].includes(config.method || '');
    const showLoader = config.showLoader || (isWrite && !config.hideLoader);
    
    if (showLoader) {
      config.metadata = config.metadata || {};
      config.metadata.loaderActive = true;
      updateLoading(config, true);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    if (response.config.metadata?.loaderActive) {
      updateLoading(response.config, false);
    }
    return response;
  },
  error => {
    if (error.config?.metadata?.loaderActive) {
      updateLoading(error.config, false);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/admin/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/admin/logout');
    return response.data;
  },
  checkSession: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/admin/current-admin', config);
    return response.data;
  }
};

// Doctors API
export const doctorsApi = {
  getAll: async (availableOnly = false, config?: AxiosRequestConfig) => {
    const url = availableOnly ? '/api/doctors?available=true' : '/api/doctors';
    const response = await api.get(url, config);
    return response.data;
  },
  getById: async (id: string, config?: AxiosRequestConfig) => {
    const response = await api.get(`/api/doctors/${id}`, config);
    return response.data;
  },
  create: async (formData: FormData) => {
    const response = await api.post('/api/doctors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  update: async (id: string, formData: FormData) => {
    const response = await api.put(`/api/doctors/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/doctors/${id}`);
    return response.data;
  },
  toggleStatus: async (id: string) => {
    const response = await api.patch(`/api/doctors/${id}/status`);
    return response.data;
  },
  getLeaves: async (doctorId: string) => {
    const response = await api.get(`/api/doctors/${doctorId}/leaves`);
    return response.data;
  },
  addLeave: async (doctorId: string, data: any) => {
    const response = await api.post(`/api/doctors/${doctorId}/leaves`, data);
    return response.data;
  },
  updateLeave: async (doctorId: string, leaveId: string, data: any) => {
    const response = await api.put(`/api/doctors/${doctorId}/leaves/${leaveId}`, data);
    return response.data;
  },
  deleteLeave: async (doctorId: string, leaveId: string) => {
    const response = await api.delete(`/api/doctors/${doctorId}/leaves/${leaveId}`);
    return response.data;
  },
  getCalendarStatus: async (doctorId: string, month: string) => {
    const response = await api.get(`/api/doctors/${doctorId}/calendar`, { params: { month } });
    return response.data;
  }
};

// Departments API
export const departmentsApi = {
  getAll: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/departments', config);
    return response.data;
  },
  create: async (formData: FormData) => {
    const response = await api.post('/api/departments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  update: async (id: string, formData: FormData) => {
    const response = await api.put(`/api/departments/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/departments/${id}`);
    return response.data;
  }
};

// Appointments API
export const appointmentsApi = {
  create: async (data: any) => {
    const response = await api.post('/api/appointments', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },
  getAll: async (params?: { search?: string; status?: string; department?: string; doctor?: string; date?: string }, config?: AxiosRequestConfig) => {
    const response = await api.get('/api/appointments', { params, ...config });
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/api/appointments/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/appointments/${id}`);
    return response.data;
  },
  getStatus: async (appointmentId: string, config?: AxiosRequestConfig) => {
    const response = await api.get(`/api/appointments/status/${appointmentId}`, { showLoader: true, ...config });
    return response.data;
  },
  getAvailableSlots: async (doctorId: string, date: string, config?: AxiosRequestConfig) => {
    const response = await api.get(`/api/appointments/available-slots`, {
      params: { doctorId, date },
      ...config
    });
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/api/appointments/${id}/status`, { status });
    return response.data;
  },
  search: async (appointmentId: string, config?: AxiosRequestConfig) => {
    const response = await api.get(`/api/appointments/search`, {
      params: { appointmentId },
      ...config
    });
    return response.data;
  },
  downloadPdf: async (id: string, appointmentId: string, config?: AxiosRequestConfig) => {
    const response = await api.get(`/api/appointments/${id}/pdf`, {
      responseType: 'blob',
      showLoader: true,
      ...config
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment_${appointmentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
  printPdf: async (id: string, config?: AxiosRequestConfig) => {
    const response = await api.get(`/api/appointments/${id}/pdf`, {
      responseType: 'blob',
      showLoader: true,
      ...config
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
};

// News API
export const newsApi = {
  getAll: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/news', config);
    return response.data;
  },
  create: async (formData: FormData) => {
    const response = await api.post('/api/news', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  update: async (id: string, formData: FormData) => {
    const response = await api.put(`/api/news/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/news/${id}`);
    return response.data;
  }
};

// Testimonials API
export const testimonialsApi = {
  getAll: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/testimonials', config);
    return response.data;
  },
  create: async (formData: FormData) => {
    const response = await api.post('/api/testimonials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  update: async (id: string, formData: FormData) => {
    const response = await api.put(`/api/testimonials/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/testimonials/${id}`);
    return response.data;
  }
};

// Gallery API
export const galleryApi = {
  getAll: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/gallery', config);
    return response.data;
  },
  create: async (formData: FormData) => {
    const response = await api.post('/api/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  update: async (id: string, formData: FormData) => {
    const response = await api.put(`/api/gallery/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/gallery/${id}`);
    return response.data;
  }
};

// Stats API
export const statsApi = {
  get: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/stats', config);
    return response.data;
  },
  update: async (data: any) => {
    const response = await api.put('/api/stats', data);
    return response.data;
  }
};

// Contacts API
export const contactsApi = {
  getAll: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/contacts', config);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/contacts', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/contacts/${id}`);
    return response.data;
  }
};

// Employee API
export const employeesApi = {
  login: async (credentials: any) => {
    const response = await api.post('/api/employees/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/employees/logout');
    return response.data;
  },
  checkSession: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/employees/current-employee', config);
    return response.data;
  },
  checkIn: async (data: any) => {
    const response = await api.post('/api/employees/attendance/check-in', data);
    return response.data;
  },
  checkOut: async (data: any) => {
    const response = await api.post('/api/employees/attendance/check-out', data);
    return response.data;
  },
  getHistory: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/employees/attendance/history', config);
    return response.data;
  },
  changePassword: async (data: { newPassword: string }) => {
    const response = await api.post('/api/employees/change-password', data);
    return response.data;
  }
};

// Compounder API
export const compoundersApi = {
  login: async (credentials: any) => {
    const response = await api.post('/api/compounders/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/compounders/logout');
    return response.data;
  },
  checkSession: async (config?: AxiosRequestConfig) => {
    const response = await api.get('/api/compounders/current-compounder', config);
    return response.data;
  },
  addPatient: async (data: any) => {
    const response = await api.post('/api/compounders/patients', data);
    return response.data;
  },
  getPatients: async (params?: { search?: string }) => {
    const response = await api.get('/api/compounders/patients', { params });
    return response.data;
  },
  getPatientById: async (id: string) => {
    const response = await api.get(`/api/compounders/patients/${id}`);
    return response.data;
  },
  getAppointments: async (params?: { search?: string; status?: string; date?: string }) => {
    const response = await api.get('/api/compounders/appointments', { params });
    return response.data;
  },
  generateBill: async (data: any) => {
    const response = await api.post('/api/compounders/bills', data);
    return response.data;
  },
  getBills: async (params?: { search?: string }) => {
    const response = await api.get('/api/compounders/bills', { params });
    return response.data;
  },
  getBillById: async (id: string) => {
    const response = await api.get(`/api/compounders/bills/${id}`);
    return response.data;
  },
  downloadBillPdf: async (id: string, billNumber: string) => {
    const response = await api.get(`/api/compounders/bills/${id}/pdf`, {
      responseType: 'blob',
      showLoader: true
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${billNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
  printBillPdf: async (id: string) => {
    const response = await api.get(`/api/compounders/bills/${id}/pdf`, {
      responseType: 'blob',
      showLoader: true
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
  changePassword: async (data: { newPassword: string }) => {
    const response = await api.post('/api/compounders/change-password', data);
    return response.data;
  }
};

// Admin Management API
export const adminManagementApi = {
  getEmployees: async (params?: { search?: string }) => {
    const response = await api.get('/admin/employees', { params });
    return response.data;
  },
  createEmployee: async (data: any) => {
    const response = await api.post('/admin/employees', data);
    return response.data;
  },
  updateEmployee: async (id: string, data: any) => {
    const response = await api.put(`/admin/employees/${id}`, data);
    return response.data;
  },
  toggleEmployeeStatus: async (id: string) => {
    const response = await api.patch(`/admin/employees/${id}/status`);
    return response.data;
  },
  getAttendance: async (params?: { date?: string; status?: string; employeeName?: string }) => {
    const response = await api.get('/admin/attendance', { params });
    return response.data;
  },
  getCompounders: async (params?: { search?: string }) => {
    const response = await api.get('/admin/compounders', { params });
    return response.data;
  },
  createCompounder: async (data: any) => {
    const response = await api.post('/admin/compounders', data);
    return response.data;
  },
  updateCompounder: async (id: string, data: any) => {
    const response = await api.put(`/admin/compounders/${id}`, data);
    return response.data;
  },
  toggleCompounderStatus: async (id: string) => {
    const response = await api.patch(`/admin/compounders/${id}/status`);
    return response.data;
  },
  getPatients: async (params?: { search?: string }) => {
    const response = await api.get('/admin/patients', { params });
    return response.data;
  },
  getBills: async (params?: { search?: string }) => {
    const response = await api.get('/admin/bills', { params });
    return response.data;
  },
  resetEmployeePassword: async (id: string) => {
    const response = await api.post(`/admin/employees/${id}/reset-password`);
    return response.data;
  },
  resetCompounderPassword: async (id: string) => {
    const response = await api.post(`/admin/compounders/${id}/reset-password`);
    return response.data;
  }
};

export default api;
