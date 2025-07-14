declare module '@/lib/api' {
  export interface ApiResponse {
    [key: string]: any;
  }

  export interface ApiConfig {
    baseUrl: string;
    fetch(endpoint: string, options?: RequestInit): Promise<ApiResponse>;
    get(endpoint: string): Promise<ApiResponse>;
    post(endpoint: string, body: any): Promise<ApiResponse>;
    put(endpoint: string, body: any): Promise<ApiResponse>;
    delete(endpoint: string): Promise<ApiResponse>;
  }

  export const api: ApiConfig;
}
