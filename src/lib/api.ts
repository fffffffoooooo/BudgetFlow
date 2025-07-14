import { toast } from 'sonner';

export const api = {
  // Base URL for your API
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',

  // Fetch wrapper with error handling
  async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      toast.error(error.message || 'Failed to fetch data');
      throw new Error(error.message || 'Failed to fetch data');
    }
    
    return response.json();
  },

  // Example API methods
  get: async (endpoint: string) => api.fetch(endpoint, { method: 'GET' }),
  post: async (endpoint: string, body: any) => api.fetch(endpoint, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  put: async (endpoint: string, body: any) => api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  delete: async (endpoint: string) => api.fetch(endpoint, { method: 'DELETE' }),
};
