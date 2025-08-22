export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    pagination?: {
      current_page: number;
      total_pages: number;
      total_items: number;
    };
  };
}

export class ResponseUtil {
  static success<T>(data: T, meta?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  static error(code: string, message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  static paginated<T>(
    data: T[], 
    total: number, 
    page: number, 
    limit: number
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total
        }
      }
    };
  }
}

export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PROJECT_NOT_OPEN: 'PROJECT_NOT_OPEN',
  PROPOSAL_ALREADY_EXISTS: 'PROPOSAL_ALREADY_EXISTS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  MILESTONE_NOT_READY: 'MILESTONE_NOT_READY',
  CONTRACT_NOT_ACTIVE: 'CONTRACT_NOT_ACTIVE'
};
