/**
 * Audit 로그 관련 타입 정의
 */

/**
 * Audit 로그 DTO
 */
export interface AuditLogDto {
  // BaseEntity 필드들
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;

  // Audit 로그 필드들
  requestMethod: string;
  requestUrl: string;
  requestPath?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  requestQuery?: Record<string, any>;
  requestIp?: string;
  responseStatusCode: number;
  responseBody?: any;
  userId?: string;
  userEmail?: string;
  userName?: string;
  employeeNumber?: string;
  requestStartTime: Date;
  requestEndTime: Date;
  duration: number;
  requestId?: string;
}
