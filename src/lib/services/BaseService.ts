// src/lib/services/BaseService.ts
import { ApiResponse } from '@/types/assessment';

export interface ServiceConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export abstract class BaseService {
  protected config: Required<ServiceConfig>;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 10000,
    };
  }

  protected async makeRequest<T>(
    requestFn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const result = await requestFn();
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (this.shouldRetry(error) && retryCount < this.config.maxRetries) {
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
        return this.makeRequest(requestFn, retryCount + 1);
      }
      throw this.handleError(error);
    }
  }

  private shouldRetry(error: unknown): boolean {
    // Retry on network errors, 5xx server errors, and timeouts
    if (error instanceof Error) {
      if (error.name === 'AbortError') return true;
      if (error.message.includes('network')) return true;
    }
    
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.status >= 500 && errorObj.status < 600) return true;
    }
    
    return false;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.message) {
        return new Error(errorObj.message);
      }
      if (errorObj.error) {
        return new Error(errorObj.error);
      }
    }
    
    return new Error('An unknown error occurred');
  }

  protected logError(method: string, error: unknown, context?: Record<string, any>): void {
    console.error(`[${this.constructor.name}.${method}] Error:`, error);
    if (context) {
      console.error('Context:', context);
    }
  }

  protected logInfo(method: string, message: string, data?: any): void {
    console.log(`[${this.constructor.name}.${method}] ${message}`, data || '');
  }

  protected validateResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    
    if (!response.data && !response.results) {
      throw new Error('No data received from server');
    }
    
    return (response.data || response.results) as T;
  }

  protected createApiResponse<T>(
    success: boolean,
    data?: T,
    error?: string
  ): ApiResponse<T> {
    return { success, data, error };
  }

  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return this.createApiResponse(true, data);
  }

  protected createErrorResponse<T>(error: string): ApiResponse<T> {
    return this.createApiResponse(false, undefined, error);
  }
}
