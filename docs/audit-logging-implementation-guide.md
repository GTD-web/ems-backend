# Audit 로깅 구현 가이드

## 개요

서비스에 들어오는 모든 HTTP 요청과 반환되는 응답을 audit 로그로 저장하는 방법을 정리합니다.

**구현 방식:** Interceptor 방식 ✅

**운영 환경:** 서버리스 환경 (비동기 처리 불가, 동기 처리 필요)

**구조:** Context 기반 구조 (재사용 가능한 비즈니스 로직)

---

## 구현 방식: Interceptor + Context 구조

### Interceptor 방식의 특징

- **NestJS 표준 방식**: NestJS의 표준 Interceptor 패턴 사용
- **요청/응답 캡처**: 요청과 응답을 모두 캡처 가능
- **에러 처리**: 에러 발생 시에도 로깅 가능
- **재사용 가능**: Context 서비스로 재사용 가능한 구조
- **전역 적용**: `APP_INTERCEPTOR`로 전역 적용 가능
- **동기 처리**: 서버리스 환경에 맞춘 동기 처리

### 구조

```
src/
├── domain/
│   └── common/
│       └── audit-log/                    # Audit 로그 도메인
│           ├── audit-log.entity.ts        # Audit 로그 엔티티
│           ├── audit-log.service.ts       # Audit 로그 도메인 서비스
│           └── audit-log.module.ts         # Audit 로그 도메인 모듈
├── context/
│   └── audit-log-context/                 # Audit 로그 컨텍스트 (재사용 가능)
│       ├── audit-log-context.module.ts    # Audit 로그 컨텍스트 모듈
│       ├── audit-log-context.service.ts   # Audit 로그 컨텍스트 서비스
│       ├── handlers/                      # CQRS 핸들러 (선택적)
│       │   └── create-audit-log.handler.ts
│       └── interfaces/
│           └── audit-log-context.interface.ts
└── interface/
    └── interceptors/
        └── audit-log.interceptor.ts       # Audit 로깅 인터셉터
```

### 구현 단계

#### 1단계: Audit 로그 엔티티 생성 (Domain Layer)

**위치:** `src/domain/common/audit-log/`

**저장할 정보:**
- 요청 정보
  - HTTP 메서드 (GET, POST, PUT, DELETE 등)
  - 요청 URL/경로
  - 요청 헤더 (Authorization 제외 또는 마스킹)
  - 요청 본문 (Body)
  - 쿼리 파라미터
  - IP 주소
  - User-Agent
- 응답 정보
  - HTTP 상태 코드
  - 응답 본문
  - 응답 시간
- 사용자 정보
  - 사용자 ID
  - 사용자 이메일
  - 사용자 이름
  - 직원 번호
- 메타 정보
  - 요청 시작 시간
  - 요청 종료 시간
  - 처리 시간 (duration, ms)
  - 요청 ID (추적용)

#### 2단계: Audit 로그 도메인 서비스 생성 (Domain Layer)

**위치:** `src/domain/common/audit-log/`

- Audit 로그 엔티티 CRUD 작업
- 데이터베이스 직접 접근
- 도메인 로직만 포함

#### 3단계: Audit 로그 컨텍스트 서비스 생성 (Context Layer)

**위치:** `src/context/audit-log-context/`

- Audit 로그 생성 비즈니스 로직
- 도메인 서비스 호출
- 재사용 가능한 인터페이스 제공
- CQRS 패턴 적용 (선택적)

**주요 메서드:**
- `audit로그를생성한다(auditLogData: CreateAuditLogDto): Promise<AuditLog>`

#### 4단계: Interceptor 구현 (Interface Layer)

**위치:** `src/interface/interceptors/`

- 요청 정보 캡처
- 응답 정보 캡처
- 사용자 정보 추출
- Audit 로그 컨텍스트 서비스 호출
- **동기 처리** (서버리스 환경)

#### 5단계: 전역 적용

- `APP_INTERCEPTOR`로 전역 적용
- 특정 경로 제외 옵션 (예: health check, swagger)

---

## 구현 시 고려사항

### 1. **서버리스 환경 고려사항**

- **동기 처리**: 서버리스 환경에서는 비동기 처리가 불가능하므로 동기 처리 필요
- **타임아웃 고려**: Audit 로깅이 메인 요청 타임아웃에 영향을 주지 않도록 최적화
- **빠른 처리**: 데이터베이스 저장 시간을 최소화하여 메인 요청 처리 시간에 영향 최소화
- **에러 처리**: Audit 로깅 실패 시에도 메인 요청은 정상 처리되도록 에러 핸들링

### 2. **데이터 보안**

- **민감 정보 마스킹**: 
  - 비밀번호, 토큰 등 민감 정보는 마스킹 처리
  - Authorization 헤더는 제외하거나 마스킹
- **개인정보 보호**:
  - GDPR, 개인정보보호법 준수
  - 필요시 로그 보관 기간 설정

### 3. **데이터 크기 관리**

- **대용량 응답 처리**:
  - 응답 본문 크기 제한 (예: 10KB 이상은 요약만 저장)
  - 파일 업로드/다운로드는 제외
- **로그 보관 정책**:
  - 오래된 로그 자동 삭제 (예: 1년 이상)
  - 중요 로그만 장기 보관

### 4. **필터링 및 제외**

- **제외할 경로**:
  - Health check (`/health`)
  - Swagger 문서 (`/admin/api-docs`, `/user/api-docs`)
  - 정적 파일 서빙
- **선택적 로깅**:
  - 특정 엔드포인트만 로깅
  - 특정 사용자만 로깅

### 5. **에러 처리**

- **로깅 실패 시**: 메인 요청 처리에는 영향 없도록 try-catch로 감싸서 처리
- **에러 로깅**: Audit 로깅 실패 시 일반 로그로 기록 (무한 루프 방지)
- **재시도 없음**: 서버리스 환경에서는 재시도 로직 없이 실패 시 무시

### 6. **데이터베이스 설계**

- **인덱스 설계**:
  - 사용자 ID, 요청 시간, URL 등에 인덱스
  - 조회 성능 최적화를 위한 복합 인덱스 고려
- **파티셔닝 고려**:
  - 날짜별 파티셔닝으로 성능 향상 (선택적)
- **별도 데이터베이스**:
  - 대량 로그는 별도 DB로 분리 고려 (선택적)
- **트랜잭션 최소화**:
  - 서버리스 환경에서는 트랜잭션 시간을 최소화하여 타임아웃 방지

---

## 예상 저장 데이터 예시

### 예시 1: POST 요청 (Body 포함)

```json
{
  "id": "uuid",
  "requestMethod": "POST",
  "requestUrl": "/admin/performance-evaluation/wbs-self-evaluations/employee/123/wbs/456/period/789",
  "requestPath": "/admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/wbs/:wbsItemId/period/:periodId",
  "requestHeaders": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0..."
  },
  "requestBody": {
    "selfEvaluationContent": "자기평가 내용",
    "selfEvaluationScore": 100
  },
  "requestQuery": {},
  "requestIp": "192.168.1.100",
  "responseStatusCode": 200,
  "responseBody": {
    "id": "eval-123",
    "status": "completed"
  },
  "userId": "user-123",
  "userEmail": "user@example.com",
  "userName": "홍길동",
  "employeeNumber": "EMP001",
  "requestStartTime": "2024-01-01T10:00:00.000Z",
  "requestEndTime": "2024-01-01T10:00:00.150Z",
  "duration": 150,
  "requestId": "req-uuid",
  "createdAt": "2024-01-01T10:00:00.150Z"
}
```

### 예시 2: GET 요청 (Query 파라미터 포함)

**요청 URL:** `GET /admin/performance-evaluation/wbs-self-evaluations/employee/123?periodId=789&page=1&limit=10&status=completed`

```json
{
  "id": "uuid",
  "requestMethod": "GET",
  "requestUrl": "/admin/performance-evaluation/wbs-self-evaluations/employee/123?periodId=789&page=1&limit=10&status=completed",
  "requestPath": "/admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId",
  "requestHeaders": {
    "user-agent": "Mozilla/5.0...",
    "accept": "application/json"
  },
  "requestBody": null,
  "requestQuery": {
    "periodId": "789",
    "page": "1",
    "limit": "10",
    "status": "completed"
  },
  "requestIp": "192.168.1.100",
  "responseStatusCode": 200,
  "responseBody": {
    "evaluations": [
      {
        "id": "eval-123",
        "status": "completed"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "userId": "user-123",
  "userEmail": "user@example.com",
  "userName": "홍길동",
  "employeeNumber": "EMP001",
  "requestStartTime": "2024-01-01T10:00:00.000Z",
  "requestEndTime": "2024-01-01T10:00:00.050Z",
  "duration": 50,
  "requestId": "req-uuid",
  "createdAt": "2024-01-01T10:00:00.050Z"
}
```

### 예시 3: GET 요청 (복잡한 Query 파라미터)

**요청 URL:** `GET /admin/evaluation-period?startDate=2024-01-01&endDate=2024-12-31&status=active&sortBy=createdAt&sortOrder=desc&page=1&limit=20`

```json
{
  "id": "uuid",
  "requestMethod": "GET",
  "requestUrl": "/admin/evaluation-period?startDate=2024-01-01&endDate=2024-12-31&status=active&sortBy=createdAt&sortOrder=desc&page=1&limit=20",
  "requestPath": "/admin/evaluation-period",
  "requestHeaders": {
    "user-agent": "Mozilla/5.0...",
    "accept": "application/json"
  },
  "requestBody": null,
  "requestQuery": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "status": "active",
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "page": "1",
    "limit": "20"
  },
  "requestIp": "192.168.1.100",
  "responseStatusCode": 200,
  "responseBody": {
    "periods": [
      {
        "id": "period-123",
        "name": "2024년 상반기 평가",
        "status": "active"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  },
  "userId": "user-123",
  "userEmail": "user@example.com",
  "userName": "홍길동",
  "employeeNumber": "EMP001",
  "requestStartTime": "2024-01-01T10:00:00.000Z",
  "requestEndTime": "2024-01-01T10:00:00.080Z",
  "duration": 80,
  "requestId": "req-uuid",
  "createdAt": "2024-01-01T10:00:00.080Z"
}
```

---

## 구현 순서

1. **Domain Layer 구현**
   - Audit 로그 엔티티 생성 (`src/domain/common/audit-log/`)
   - Audit 로그 도메인 서비스 구현
   - Audit 로그 도메인 모듈 생성

2. **Context Layer 구현**
   - Audit 로그 컨텍스트 서비스 구현 (`src/context/audit-log-context/`)
   - Audit 로그 컨텍스트 모듈 생성
   - Domain Context Module에 등록

3. **Interface Layer 구현**
   - Audit 로그 인터셉터 구현 (`src/interface/interceptors/`)
   - 요청/응답 캡처 로직 구현
   - 사용자 정보 추출 로직 구현

4. **전역 적용**
   - `APP_INTERCEPTOR`로 전역 적용
   - 특정 경로 제외 설정

5. **테스트**
   - 다양한 시나리오 테스트
   - 에러 케이스 테스트
   - 성능 테스트

6. **모니터링**
   - 로그 저장 성능 모니터링
   - 타임아웃 발생 여부 확인

---

## Context 구조 패턴

### Context 서비스 인터페이스 예시

```typescript
// src/context/audit-log-context/interfaces/audit-log-context.interface.ts

export interface CreateAuditLogDto {
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

export interface CreateAuditLogResult {
  id: string;
  createdAt: Date;
}
```

### Context 서비스 사용 예시

```typescript
// src/context/audit-log-context/audit-log-context.service.ts

@Injectable()
export class AuditLogContextService {
  constructor(
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Audit 로그를 생성한다
   */
  async audit로그를생성한다(
    data: CreateAuditLogDto,
  ): Promise<CreateAuditLogResult> {
    // 비즈니스 로직 처리
    const auditLog = await this.auditLogService.생성한다(data);
    return {
      id: auditLog.id,
      createdAt: auditLog.createdAt,
    };
  }
}
```

### Interceptor에서 Context 서비스 사용

```typescript
// src/interface/interceptors/audit-log.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogContextService } from '@context/audit-log-context';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly auditLogContextService: AuditLogContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const startTime = new Date();
    const requestId = this.generateRequestId();
    
    // 요청 정보 추출
    const requestMethod = request.method;
    const requestUrl = request.originalUrl || request.url;
    const requestPath = request.route?.path || request.path;
    const requestHeaders = this.sanitizeHeaders(request.headers);
    const requestBody = this.sanitizeBody(request.body);
    const requestQuery = request.query || {}; // Query 파라미터 자동 추출
    const requestIp = this.getClientIp(request);
    const user = request['user']; // JwtAuthGuard에서 주입된 사용자 정보
    
    return next.handle().pipe(
      tap(async (data) => {
        // 정상 응답 처리
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        
        try {
          await this.auditLogContextService.audit로그를생성한다({
            requestMethod,
            requestUrl,
            requestPath,
            requestHeaders,
            requestBody,
            requestQuery, // 자동으로 추출된 Query 파라미터
            requestIp,
            responseStatusCode: response.statusCode,
            responseBody: this.sanitizeBody(data),
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            employeeNumber: user?.employeeNumber,
            requestStartTime: startTime,
            requestEndTime: endTime,
            duration,
            requestId,
          });
        } catch (error) {
          // Audit 로깅 실패 시에도 메인 요청은 정상 처리
          this.logger.error('Audit 로그 생성 실패', error);
        }
      }),
      catchError(async (error) => {
        // 에러 응답 처리
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        
        try {
          await this.auditLogContextService.audit로그를생성한다({
            requestMethod,
            requestUrl,
            requestPath,
            requestHeaders,
            requestBody,
            requestQuery, // 자동으로 추출된 Query 파라미터
            requestIp,
            responseStatusCode: error.status || 500,
            responseBody: this.sanitizeError(error),
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            employeeNumber: user?.employeeNumber,
            requestStartTime: startTime,
            requestEndTime: endTime,
            duration,
            requestId,
          });
        } catch (logError) {
          // Audit 로깅 실패 시에도 메인 요청은 정상 처리
          this.logger.error('Audit 로그 생성 실패', logError);
        }
        
        throw error;
      }),
    );
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 클라이언트 IP 주소 추출
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * 헤더 정제 (민감 정보 제거)
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const excludeHeaders = ['authorization', 'cookie'];
    
    Object.keys(headers).forEach((key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        sanitized[key] = headers[key];
      }
    });
    
    return sanitized;
  }

  /**
   * 본문 정제 (대용량 데이터 제한)
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;
    
    const bodyString = JSON.stringify(body);
    const maxSize = 10 * 1024; // 10KB
    
    if (bodyString.length > maxSize) {
      return {
        _truncated: true,
        _size: bodyString.length,
        _message: 'Response body too large, truncated',
      };
    }
    
    return body;
  }

  /**
   * 에러 정보 정제
   */
  private sanitizeError(error: any): any {
    return {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      name: error.name,
    };
  }
}
```

### requestQuery 자동 추출 예시

Interceptor에서 `request.query`를 자동으로 추출하여 저장합니다:

**요청 예시:**
```
GET /admin/evaluation-period?periodId=789&page=1&limit=10&status=active
```

**자동 추출된 requestQuery:**
```typescript
{
  periodId: "789",
  page: "1",
  limit: "10",
  status: "active"
}
```

**저장되는 데이터:**
```json
{
  "requestQuery": {
    "periodId": "789",
    "page": "1",
    "limit": "10",
    "status": "active"
  }
}
```

**주의사항:**
- Express의 `request.query`는 모든 값을 문자열로 반환합니다
- 숫자나 boolean 타입이 필요한 경우, 저장 후 조회 시 변환 필요
- 배열 파라미터는 자동으로 배열로 변환됩니다 (예: `?ids=1&ids=2` → `["1", "2"]`)

---

## 감사 로그 조회 기능 구현

### 조회 기능 구조

```
src/
├── context/audit-log-context/
│   ├── handlers/
│   │   └── queries/
│   │       ├── get-audit-log-list.handler.ts  # 목록 조회 핸들러
│   │       └── get-audit-log-detail.handler.ts  # 상세 조회 핸들러
│   ├── interfaces/
│   │   └── audit-log-context.interface.ts     # 인터페이스 정의
│   └── audit-log-context.service.ts           # 조회 컨텍스트 서비스
└── interface/admin/
    └── audit-log/
        ├── audit-log.controller.ts             # 조회 컨트롤러
        └── dto/
            ├── get-audit-log-list-query.dto.ts
            └── audit-log-response.dto.ts
```

### 1단계: Context Layer - 인터페이스 정의

```typescript
// src/context/audit-log-context/interfaces/audit-log-context.interface.ts

export interface AuditLogFilter {
  userId?: string;
  userEmail?: string;
  employeeNumber?: string;
  requestMethod?: string;
  requestUrl?: string;
  responseStatusCode?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogListResult {
  items: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
}
```

### 2단계: Context Layer - 조회 핸들러 구현

```typescript
// src/context/audit-log-context/handlers/queries/get-audit-log-list.handler.ts

export class GetAuditLogListQuery {
  constructor(
    public readonly filter: AuditLogFilter,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

@QueryHandler(GetAuditLogListQuery)
export class GetAuditLogListHandler
  implements IQueryHandler<GetAuditLogListQuery, AuditLogListResult>
{
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async execute(query: GetAuditLogListQuery): Promise<AuditLogListResult> {
    // QueryBuilder로 필터링 및 페이징 처리
  }
}
```

```typescript
// src/context/audit-log-context/handlers/queries/get-audit-log-detail.handler.ts

export class GetAuditLogDetailQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetAuditLogDetailQuery)
export class GetAuditLogDetailHandler
  implements IQueryHandler<GetAuditLogDetailQuery, AuditLogDto | null>
{
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async execute(query: GetAuditLogDetailQuery): Promise<AuditLogDto | null> {
    // ID로 상세 조회
  }
}
```

### 3단계: Context Layer - 서비스 메서드

```typescript
// src/context/audit-log-context/audit-log-context.service.ts

@Injectable()
export class AuditLogContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async audit로그목록을_조회한다(
    filter: AuditLogFilter,
    page: number = 1,
    limit: number = 10,
  ): Promise<AuditLogListResult> {
    const query = new GetAuditLogListQuery(filter, page, limit);
    return await this.queryBus.execute(query);
  }

  async audit로그상세를_조회한다(id: string): Promise<AuditLogDto | null> {
    const query = new GetAuditLogDetailQuery(id);
    return await this.queryBus.execute(query);
  }
}
```

### 4단계: Interface Layer - 컨트롤러

```typescript
// src/interface/admin/audit-log/audit-log.controller.ts

@ApiTags('A-0-5. 관리자 - 감사 로그')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditLogController {
  constructor(
    private readonly auditLogContextService: AuditLogContextService,
  ) {}

  @Get()
  async getAuditLogs(
    @Query() query: GetAuditLogListQueryDto,
  ): Promise<AuditLogListResponseDto> {
    // 필터 변환 및 Context 서비스 호출
  }

  @Get(':id')
  async getAuditLogDetail(
    @Param('id') id: string,
  ): Promise<AuditLogResponseDto> {
    // Context 서비스 호출 및 에러 처리
  }
}
```

### 5단계: DTO 정의

```typescript
// src/interface/admin/audit-log/dto/get-audit-log-list-query.dto.ts

export class GetAuditLogListQueryDto {
  userId?: string;
  userEmail?: string;
  employeeNumber?: string;
  requestMethod?: string;
  requestUrl?: string;
  responseStatusCode?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

```typescript
// src/interface/admin/audit-log/dto/audit-log-response.dto.ts

export class AuditLogResponseDto {
  id: string;
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
  createdAt: Date;
}

export class AuditLogListResponseDto {
  items: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

### API 사용 예시

#### 1. 전체 목록 조회 (페이징)

```http
GET /admin/audit-logs?page=1&limit=10
```

**응답:**
```json
{
  "items": [
    {
      "id": "uuid",
      "requestMethod": "POST",
      "requestUrl": "/admin/performance-evaluation/wbs-self-evaluations/employee/123/wbs/456/period/789",
      "requestQuery": {},
      "responseStatusCode": 200,
      "userId": "user-123",
      "userEmail": "user@example.com",
      "userName": "홍길동",
      "employeeNumber": "EMP001",
      "requestStartTime": "2024-01-01T10:00:00.000Z",
      "requestEndTime": "2024-01-01T10:00:00.150Z",
      "duration": 150,
      "createdAt": "2024-01-01T10:00:00.150Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### 2. 사용자별 조회

```http
GET /admin/audit-logs?employeeNumber=EMP001&page=1&limit=20
```

#### 3. 기간별 조회

```http
GET /admin/audit-logs?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&page=1&limit=10
```

#### 4. HTTP 메서드별 조회

```http
GET /admin/audit-logs?requestMethod=POST&page=1&limit=10
```

#### 5. URL 패턴으로 조회

```http
GET /admin/audit-logs?requestUrl=/admin/performance-evaluation&page=1&limit=10
```

#### 6. 상태 코드별 조회

```http
GET /admin/audit-logs?responseStatusCode=200&page=1&limit=10
```

#### 7. 복합 필터 조회

```http
GET /admin/audit-logs?employeeNumber=EMP001&requestMethod=POST&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&page=1&limit=10
```

#### 8. 상세 조회

```http
GET /admin/audit-logs/{id}
```

**응답:**
```json
{
  "id": "uuid",
  "requestMethod": "POST",
  "requestUrl": "/admin/performance-evaluation/wbs-self-evaluations/employee/123/wbs/456/period/789",
  "requestPath": "/admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/wbs/:wbsItemId/period/:periodId",
  "requestHeaders": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0..."
  },
  "requestBody": {
    "selfEvaluationContent": "자기평가 내용",
    "selfEvaluationScore": 100
  },
  "requestQuery": {},
  "requestIp": "192.168.1.100",
  "responseStatusCode": 200,
  "responseBody": {
    "id": "eval-123",
    "status": "completed"
  },
  "userId": "user-123",
  "userEmail": "user@example.com",
  "userName": "홍길동",
  "employeeNumber": "EMP001",
  "requestStartTime": "2024-01-01T10:00:00.000Z",
  "requestEndTime": "2024-01-01T10:00:00.150Z",
  "duration": 150,
  "requestId": "req-uuid",
  "createdAt": "2024-01-01T10:00:00.150Z"
}
```

### 보안 고려사항

- **권한 제어**: 관리자만 조회 가능하도록 `@Roles('admin')` 적용
- **민감 정보**: 응답에서 민감한 정보는 마스킹 처리 (필요시)
- **대량 조회 제한**: `limit` 최대값 제한 (예: 최대 100)
- **인덱스 최적화**: 자주 사용하는 필터 조건에 인덱스 추가

---

## 참고 자료

- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [TypeORM Entities](https://typeorm.io/entities)
- [Context 구조 가이드](../src/context/evaluation-context-design-analysis.md)

