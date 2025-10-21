# Deliverable Management API Reference

산출물 관리 API 기술 레퍼런스

---

## 목차

1. [API 개요](#api-개요)
2. [인증 및 권한](#인증-및-권한)
3. [API 엔드포인트](#api-엔드포인트)
4. [데이터 모델](#데이터-모델)
5. [에러 처리](#에러-처리)
6. [테스트 케이스](#테스트-케이스)

---

## API 개요

### Base URL

```
/admin/performance-evaluation/deliverables
```

### 버전 정보

- **API Version**: 1.0.0
- **NestJS Controller**: `DeliverableManagementController`
- **Swagger Tag**: `C-5. 관리자 - 성과평가 - 산출물`

### 기술 스택

- **Framework**: NestJS
- **ORM**: TypeORM
- **Pattern**: CQRS (Command Query Responsibility Segregation)
- **Validation**: class-validator, class-transformer

---

## 인증 및 권한

### 인증 방식

```
Bearer Token Authentication
Authorization: Bearer <token>
```

### 필요 권한

- 산출물 생성/수정/삭제: `ADMIN` 권한
- 산출물 조회: `ADMIN` 또는 `MANAGER` 권한

---

## API 엔드포인트

### 1. 산출물 생성

```http
POST /admin/performance-evaluation/deliverables
```

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```typescript
interface CreateDeliverableDto {
  name: string; // 산출물명 (필수)
  type: DeliverableType; // 산출물 유형 (필수)
  employeeId: string; // 직원 ID - UUID (필수)
  wbsItemId: string; // WBS 항목 ID - UUID (필수)
  description?: string; // 산출물 설명 (선택)
  filePath?: string; // 파일 경로 (선택)
  createdBy?: string; // 생성자 ID - 자동 설정
}
```

**Response: 201 Created**

```typescript
interface DeliverableResponseDto {
  id: string;
  name: string;
  description?: string;
  type: DeliverableType;
  filePath?: string;
  employeeId?: string;
  wbsItemId?: string;
  mappedDate?: Date;
  mappedBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}
```

**비즈니스 로직:**

1. DTO 유효성 검증 (class-validator)
2. 직원 및 WBS 항목 존재 여부 확인
3. 산출물 생성 (`performanceEvaluationService.산출물을_생성한다`)
4. 자동으로 `isActive: true` 설정
5. `createdBy`를 인증된 사용자 ID로 설정
6. 산출물-직원-WBS 매핑 생성

---

### 2. 산출물 수정

```http
PUT /admin/performance-evaluation/deliverables/:id
```

**Path Parameters:**

| 파라미터 | 타입   | 설명                  |
| -------- | ------ | --------------------- |
| id       | string | 산출물 ID (UUID 형식) |

**Request Body:**

```typescript
interface UpdateDeliverableDto {
  name?: string; // 산출물명
  type?: DeliverableType; // 산출물 유형
  description?: string; // 산출물 설명
  filePath?: string; // 파일 경로
  employeeId?: string; // 직원 ID (재할당)
  wbsItemId?: string; // WBS 항목 ID (재할당)
  isActive?: boolean; // 활성 상태
  updatedBy?: string; // 수정자 ID - 자동 설정
}
```

**Response: 200 OK**

```typescript
DeliverableResponseDto;
```

**비즈니스 로직:**

1. 산출물 ID로 기존 산출물 조회
2. 존재하지 않으면 404 에러
3. 제공된 필드만 업데이트
4. `employeeId` 또는 `wbsItemId` 변경 시 매핑 업데이트
5. `updatedBy`를 인증된 사용자 ID로 설정
6. `version` 자동 증가

---

### 3. 산출물 삭제

```http
DELETE /admin/performance-evaluation/deliverables/:id
```

**Path Parameters:**

| 파라미터 | 타입   | 설명                  |
| -------- | ------ | --------------------- |
| id       | string | 산출물 ID (UUID 형식) |

**Response: 204 No Content**

**비즈니스 로직:**

1. 산출물 ID로 조회
2. 소프트 삭제 (`deletedAt` 설정)
3. `deletedBy`를 인증된 사용자 ID로 설정
4. 실제 데이터는 DB에 유지

---

### 4. 산출물 상세 조회

```http
GET /admin/performance-evaluation/deliverables/:id
```

**Response: 200 OK**

```typescript
DeliverableResponseDto;
```

**비즈니스 로직:**

1. 산출물 ID로 조회
2. 매핑 정보 포함 (직원, WBS 항목)
3. 삭제된 산출물도 조회 가능 (관리자 권한)

---

### 5. 직원별 산출물 조회

```http
GET /admin/performance-evaluation/deliverables/employee/:employeeId
```

**Path Parameters:**

| 파라미터   | 타입   | 설명                |
| ---------- | ------ | ------------------- |
| employeeId | string | 직원 ID (UUID 형식) |

**Query Parameters:**

| 파라미터   | 타입    | 필수 | 기본값 | 설명               |
| ---------- | ------- | ---- | ------ | ------------------ |
| activeOnly | boolean | ❌   | true   | 활성 산출물만 조회 |

**Response: 200 OK**

```typescript
interface DeliverableListResponseDto {
  deliverables: DeliverableResponseDto[];
  total: number;
}
```

**비즈니스 로직:**

1. 직원 ID로 산출물 조회
2. `activeOnly=true`일 때 `isActive: true`인 것만 조회
3. `activeOnly=false`일 때 비활성 산출물도 포함
4. 삭제된 산출물 제외 (`deletedAt IS NULL`)
5. 최신순 정렬 (`createdAt DESC`)

---

### 6. WBS 항목별 산출물 조회

```http
GET /admin/performance-evaluation/deliverables/wbs/:wbsItemId
```

**Path Parameters:**

| 파라미터  | 타입   | 설명                    |
| --------- | ------ | ----------------------- |
| wbsItemId | string | WBS 항목 ID (UUID 형식) |

**Query Parameters:**

| 파라미터   | 타입    | 필수 | 기본값 | 설명               |
| ---------- | ------- | ---- | ------ | ------------------ |
| activeOnly | boolean | ❌   | true   | 활성 산출물만 조회 |

**Response: 200 OK**

```typescript
DeliverableListResponseDto;
```

**비즈니스 로직:**

직원별 조회와 동일, WBS 항목 ID 기준

---

### 7. 벌크 산출물 생성

```http
POST /admin/performance-evaluation/deliverables/bulk
```

**Request Body:**

```typescript
interface BulkCreateDeliverablesDto {
  deliverables: CreateDeliverableDto[]; // 최소 1개 이상 (필수)
}
```

**Response: 201 Created**

```typescript
interface BulkCreateResultDto {
  successCount: number; // 성공 개수
  failedCount: number; // 실패 개수
  createdIds: string[]; // 생성된 산출물 ID 목록
  failedItems: Array<{
    data: Partial<CreateDeliverableDto>;
    error: string;
  }>;
}
```

**비즈니스 로직:**

1. 각 산출물을 개별적으로 생성 시도
2. 개별 실패 시 해당 항목만 실패로 기록
3. 나머지는 계속 처리
4. 트랜잭션 없음 (개별 성공/실패)
5. 성공/실패 결과 및 실패 원인 반환

---

### 8. 벌크 산출물 삭제

```http
DELETE /admin/performance-evaluation/deliverables/bulk
```

**Request Body:**

```typescript
interface BulkDeleteDeliverablesDto {
  deliverableIds: string[]; // 최소 1개 이상의 UUID (필수)
}
```

**Response: 200 OK**

```typescript
interface BulkDeleteResultDto {
  successCount: number; // 성공 개수
  failedCount: number; // 실패 개수
  failedIds: Array<{
    id: string;
    error: string;
  }>;
}
```

**비즈니스 로직:**

1. 각 산출물을 개별적으로 삭제 시도
2. 존재하지 않는 ID는 실패로 기록
3. 나머지는 계속 처리
4. 소프트 삭제 방식
5. 성공/실패 결과 및 실패 ID 반환

---

## 데이터 모델

### DeliverableType Enum

```typescript
enum DeliverableType {
  DOCUMENT = 'document', // 문서
  CODE = 'code', // 코드
  DESIGN = 'design', // 디자인
  REPORT = 'report', // 보고서
  PRESENTATION = 'presentation', // 프레젠테이션
  OTHER = 'other', // 기타
}
```

### Deliverable Entity

```typescript
class Deliverable {
  id: string; // UUID
  name: string; // 산출물명
  description?: string; // 산출물 설명
  type: DeliverableType; // 산출물 유형
  filePath?: string; // 파일 경로
  employeeId?: string; // 직원 ID
  wbsItemId?: string; // WBS 항목 ID
  mappedDate?: Date; // 매핑일
  mappedBy?: string; // 매핑자 ID
  isActive: boolean; // 활성 상태
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  deletedAt?: Date; // 삭제일시
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
  deletedBy?: string; // 삭제자 ID
  version: number; // 낙관적 잠금 버전
}
```

### 데이터베이스 스키마

**Table: `deliverables`**

```sql
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500),
  employee_id UUID,
  wbs_item_id UUID,
  mapped_date TIMESTAMP,
  mapped_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  version INTEGER DEFAULT 1,

  CONSTRAINT fk_deliverable_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id),

  CONSTRAINT fk_deliverable_wbs
    FOREIGN KEY (wbs_item_id)
    REFERENCES wbs_items(id)
);

-- 인덱스
CREATE INDEX idx_deliverables_employee ON deliverables(employee_id);
CREATE INDEX idx_deliverables_wbs ON deliverables(wbs_item_id);
CREATE INDEX idx_deliverables_is_active ON deliverables(is_active);
CREATE INDEX idx_deliverables_deleted_at ON deliverables(deleted_at);
```

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 설명                  | 발생 시나리오                 |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | 조회 성공, 벌크 삭제 성공     |
| 201  | Created               | 생성 성공, 벌크 생성 성공     |
| 204  | No Content            | 삭제 성공                     |
| 400  | Bad Request           | 유효성 검증 실패, 잘못된 UUID |
| 401  | Unauthorized          | 인증 실패                     |
| 403  | Forbidden             | 권한 부족                     |
| 404  | Not Found             | 리소스를 찾을 수 없음         |
| 409  | Conflict              | 중복 데이터, 버전 충돌        |
| 500  | Internal Server Error | 서버 내부 오류                |

### 에러 응답 형식

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

**예시:**

```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "type must be a valid enum value"],
  "error": "Bad Request",
  "timestamp": "2024-01-15T09:00:00.000Z",
  "path": "/admin/performance-evaluation/deliverables"
}
```

### 커스텀 예외

```typescript
// 산출물을 찾을 수 없음
class DeliverableNotFoundException extends NotFoundException {
  constructor(deliverableId: string) {
    super(`산출물을 찾을 수 없습니다. (id: ${deliverableId})`);
  }
}

// 직원을 찾을 수 없음
class EmployeeNotFoundException extends NotFoundException {
  constructor(employeeId: string) {
    super(`직원을 찾을 수 없습니다. (id: ${employeeId})`);
  }
}

// WBS 항목을 찾을 수 없음
class WbsItemNotFoundException extends NotFoundException {
  constructor(wbsItemId: string) {
    super(`WBS 항목을 찾을 수 없습니다. (id: ${wbsItemId})`);
  }
}
```

---

## 테스트 케이스

### 단위 테스트 (Unit Tests)

**파일:** `deliverable-management.controller.spec.ts`

```typescript
describe('DeliverableManagementController', () => {
  describe('createDeliverable', () => {
    it('산출물을 생성할 수 있어야 한다', async () => {
      // Given
      const dto: CreateDeliverableDto = {
        name: 'API 설계 문서',
        type: DeliverableType.DOCUMENT,
        employeeId: 'emp-001',
        wbsItemId: 'wbs-001',
      };

      // When
      const result = await controller.createDeliverable(dto, mockUser);

      // Then
      expect(result.id).toBeDefined();
      expect(result.name).toBe('API 설계 문서');
      expect(result.isActive).toBe(true);
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidDto = { name: 'API 설계 문서' } as any;

      // When & Then
      await expect(
        controller.createDeliverable(invalidDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDeliverable', () => {
    it('산출물을 수정할 수 있어야 한다', async () => {
      // Given
      const dto: UpdateDeliverableDto = {
        name: '수정된 API 설계 문서',
      };

      // When
      const result = await controller.updateDeliverable(
        'id-123',
        dto,
        mockUser,
      );

      // Then
      expect(result.name).toBe('수정된 API 설계 문서');
    });
  });

  describe('deleteDeliverable', () => {
    it('산출물을 삭제할 수 있어야 한다', async () => {
      // When & Then
      await expect(
        controller.deleteDeliverable('id-123', mockUser),
      ).resolves.not.toThrow();
    });
  });

  describe('getEmployeeDeliverables', () => {
    it('직원별 산출물을 조회할 수 있어야 한다', async () => {
      // When
      const result = await controller.getEmployeeDeliverables('emp-001', {
        activeOnly: true,
      });

      // Then
      expect(result.deliverables).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });
});
```

### E2E 테스트 (End-to-End Tests)

**파일:** `deliverable-management.e2e-spec.ts`

```typescript
describe('POST /admin/performance-evaluation/deliverables', () => {
  it('산출물을 생성할 수 있어야 한다', () => {
    return request(app.getHttpServer())
      .post('/admin/performance-evaluation/deliverables')
      .send({
        name: 'API 설계 문서',
        type: 'document',
        employeeId: employeeId,
        wbsItemId: wbsItemId,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe('API 설계 문서');
      });
  });
});

describe('GET /admin/performance-evaluation/deliverables/employee/:employeeId', () => {
  it('직원별 산출물을 조회할 수 있어야 한다', () => {
    return request(app.getHttpServer())
      .get(`/admin/performance-evaluation/deliverables/employee/${employeeId}`)
      .query({ activeOnly: true })
      .expect(200)
      .expect((res) => {
        expect(res.body.deliverables).toBeDefined();
        expect(res.body.total).toBeDefined();
      });
  });
});
```

### 성능 테스트

**벌크 생성 성능:**

```typescript
describe('Bulk Operations Performance', () => {
  it('100개의 산출물을 3초 이내에 생성할 수 있어야 한다', async () => {
    // Given
    const deliverables = Array.from({ length: 100 }, (_, i) => ({
      name: `산출물 ${i + 1}`,
      type: DeliverableType.DOCUMENT,
      employeeId: 'emp-001',
      wbsItemId: `wbs-${i + 1}`,
    }));

    // When
    const startTime = Date.now();
    const result = await controller.bulkCreateDeliverables(
      { deliverables },
      mockUser,
    );
    const duration = Date.now() - startTime;

    // Then
    expect(result.successCount).toBe(100);
    expect(duration).toBeLessThan(3000); // 3초 이내
  });
});
```

---

## 변경 이력

| 버전  | 날짜       | 변경 내용          |
| ----- | ---------- | ------------------ |
| 1.0.0 | 2024-01-15 | 초기 API 문서 작성 |

---

## 참고 자료

### 관련 문서

- [API 사용 가이드](../../../../public/api-docs/admin-deliverable.md)
- [도메인 모델 명세](../../../database-tables-specification.md)
- [WBS 할당 API](./wbs-assignment-api-reference.md)

### 소스 코드

- **Controller**: `src/interface/admin/performance-evaluation/deliverable-management.controller.ts`
- **Service**: `src/context/performance-evaluation-context/performance-evaluation.service.ts`
- **Entity**: `src/domain/core/deliverable/deliverable.entity.ts`
- **DTO**: `src/interface/admin/performance-evaluation/dto/deliverable.dto.ts`

---

**작성일**: 2024-01-15
**최종 수정일**: 2024-01-15
**작성자**: Development Team

