import { ApiConfig, ApiResponse } from '../types';
import { API_CONFIG, ERROR_CONFIG } from '../config/app';

class ApiClient {
  private config: ApiConfig;
  private authToken: string | null = null;

  constructor(config: ApiConfig = API_CONFIG) {
    this.config = config;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const headers = {
        ...this.config.headers,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...options.headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      if (retryCount < ERROR_CONFIG.MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, ERROR_CONFIG.RETRY_DELAY)
        );
        return this.request(endpoint, options, retryCount + 1);
      }

      return {
        data: null as T,
        error: error as Error,
        status: 500,
      };
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(); 