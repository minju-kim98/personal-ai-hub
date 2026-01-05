import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token } = response.data;
          useAuthStore.getState().setTokens(access_token, refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post("/auth/register", { email, password, name }),

  logout: () => api.post("/auth/logout"),
};

export const userApi = {
  getMe: () => api.get("/users/me"),
  updateMe: (data: { name?: string }) => api.patch("/users/me", data),
  updateSettings: (settings: Record<string, unknown>) =>
    api.patch("/users/me/settings", settings),
};

export const documentApi = {
  list: (params?: {
    category?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => api.get("/documents", { params }),

  get: (id: string) => api.get(`/documents/${id}`),

  upload: (file: File, category: string, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (title) formData.append("title", title);

    return api.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (id: string, data: { category?: string; title?: string }) =>
    api.patch(`/documents/${id}`, data),

  delete: (id: string) => api.delete(`/documents/${id}`),

  download: (id: string) =>
    api.get(`/documents/${id}/download`, { responseType: "blob" }),
};

export const aiApi = {
  // Cover Letter
  createCoverLetter: (data: {
    company_name: string;
    job_posting: string;
    document_ids?: string[];
    additional_instructions?: string;
  }) => api.post("/ai/cover-letter", data),

  getCoverLetterStatus: (sessionId: string) =>
    api.get(`/ai/cover-letter/${sessionId}`),

  getCoverLetterResult: (sessionId: string) =>
    api.get(`/ai/cover-letter/${sessionId}/result`),

  // Weekly Report
  createWeeklyReport: (data: {
    tasks_completed: string;
    next_week_plan?: string;
    boss_preferences?: string;
  }) => api.post("/ai/weekly-report", data),

  getWeeklyReport: (sessionId: string) =>
    api.get(`/ai/weekly-report/${sessionId}`),

  // Proposal
  createProposal: (data: {
    idea: string;
    target_market?: string;
    budget_range?: string;
    special_requirements?: string;
  }) => api.post("/ai/proposal", data),

  getProposalStatus: (sessionId: string) =>
    api.get(`/ai/proposal/${sessionId}`),

  getProposalResult: (sessionId: string) =>
    api.get(`/ai/proposal/${sessionId}/result`),

  // Translate
  translateText: (data: {
    translation_type: string;
    target_language: string;
    content: string;
    context?: string;
  }) => api.post("/ai/translate/text", data),

  translateSrt: (file: File, targetLanguage: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_language", targetLanguage);

    return api.post("/ai/translate/srt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  writeEmail: (data: {
    target_language: string;
    context: string;
    key_points: string;
  }) => api.post("/ai/translate/email", data),

  // Travel
  createTravelPlan: (data: {
    travel_type: "travel" | "date";
    start_date: string;
    end_date: string;
    departure: string;
    destination: string;
    interests?: string[];
    budget_range?: string;
    companions?: string;
    special_requests?: string;
  }) => api.post("/ai/travel", data),

  getTravelPlan: (sessionId: string) => api.get(`/ai/travel/${sessionId}`),
};

export const economyApi = {
  // News
  listNews: (params?: { category?: string; page?: number; size?: number }) =>
    api.get("/economy/news", { params }),

  getNews: (id: string) => api.get(`/economy/news/${id}`),

  // Stocks
  listStocks: () => api.get("/economy/stocks"),
  addStock: (symbol: string, name?: string) =>
    api.post("/economy/stocks", { symbol, name }),
  removeStock: (symbol: string) => api.delete(`/economy/stocks/${symbol}`),

  // Expenses
  listExpenses: (params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
  }) => api.get("/economy/expenses", { params }),

  addExpense: (data: {
    amount: number;
    category?: string;
    description?: string;
    expense_date: string;
  }) => api.post("/economy/expenses", data),

  deleteExpense: (id: string) => api.delete(`/economy/expenses/${id}`),

  // Settings
  getSettings: () => api.get("/economy/settings"),
  updateSettings: (settings: Record<string, unknown>) =>
    api.patch("/economy/settings", settings),
};

export default api;
