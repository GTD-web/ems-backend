# Evaluation Target Management API Reference

> 평가 대상 관리 API
>
> Base Path: `/admin/evaluation-periods`
>
> **인증 필수:** 모든 API 요청에 JWT 토큰이 필요합니다.

---

## 목차

- [평가 대상자 등록](#평가-대상자-등록)
- [평가 대상자 대량 등록](#평가-대상자-대량-등록)
- [평가 대상 제외](#평가-대상-제외)
- [평가 대상 포함 (제외 취소)](#평가-대상-포함-제외-취소)
- [평가기간의 평가 대상자 조회](#평가기간의-평가-대상자-조회)
- [제외된 평가 대상자 조회](#제외된-평가-대상자-조회)
- [직원의 평가기간 맵핑 조회](#직원의-평가기간-맵핑-조회)
- [평가 대상 여부 확인](#평가-대상-여부-확인)
- [평가 대상자 등록 해제](#평가-대상자-등록-해제)
- [평가기간의 모든 대상자 등록 해제](#평가기간의-모든-대상자-등록-해제)

---

## API Endpoints

### 평가 대상자 등록

```typescript
POST /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId
```

특정 평가기간에 직원을 평가 대상자로 등록합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Request Body:**

```typescript
interface RegisterEvaluationTargetDto {
  createdBy: string; // 생성자 ID (필수)
}
```

**Response:**

```typescript
interface EvaluationTargetMappingDto {
  id: string; // 맵핑 ID
  evaluationPeriodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  isExcluded: boolean; // 제외 여부 (기본값: false)
  excludeReason?: string; // 제외 사유
  excludedBy?: string; // 제외 처리자 ID
  excludedAt?: Date; // 제외 일시
  createdBy: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
EvaluationTargetMappingDto;
```

**Status Codes:**

- `201`: 평가 대상자 등록 성공
- `400`: 잘못된 요청 (UUID 형식 오류, 필수 필드 누락)
- `404`: 평가기간 또는 직원을 찾을 수 없음
- `409`: 이미 등록된 평가 대상자

---

### 평가 대상자 대량 등록

```typescript
POST /admin/evaluation-periods/:evaluationPeriodId/targets/bulk
```

특정 평가기간에 여러 직원을 평가 대상자로 대량 등록합니다. 이미 등록된 직원은 자동으로 포함됩니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface RegisterBulkEvaluationTargetsDto {
  employeeIds: string[]; // 직원 ID 배열 (최소 1개 이상)
}
// 참고: createdBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
// 응답
EvaluationTargetMappingDto[] // 등록된 맵핑 목록 (기존 + 신규)
```

**Status Codes:**

- `201`: 평가 대상자 대량 등록 성공
- `400`: 잘못된 요청 (빈 배열, UUID 형식 오류, 필수 필드 누락)
- `404`: 평가기간을 찾을 수 없음

---

### 평가 대상 제외

```typescript
PATCH /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId/exclude
```

특정 평가기간에서 직원을 평가 대상에서 제외합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Request Body:**

```typescript
interface ExcludeEvaluationTargetDto {
  excludeReason: string; // 제외 사유 (필수)
}
// 참고: excludedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
// 응답
EvaluationTargetMappingDto;
```

**Status Codes:**

- `200`: 평가 대상 제외 성공
- `400`: 잘못된 요청 (UUID 형식 오류, 필수 필드 누락)
- `404`: 평가 대상자로 등록되지 않음
- `409`: 이미 제외된 대상자

---

### 평가 대상 포함 (제외 취소)

```typescript
PATCH /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId/include
```

제외된 평가 대상자를 다시 포함시킵니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Request Body:**

```typescript
interface IncludeEvaluationTargetDto {
  updatedBy: string; // 수정자 ID (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationTargetMappingDto;
```

**Status Codes:**

- `200`: 평가 대상 포함 성공
- `400`: 잘못된 요청 (UUID 형식 오류, 필수 필드 누락)
- `404`: 평가 대상자로 등록되지 않음 또는 제외되지 않음

---

### 평가기간의 평가 대상자 조회

```typescript
GET /admin/evaluation-periods/:evaluationPeriodId/targets?includeExcluded={boolean}
```

특정 평가기간의 평가 대상자 목록을 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Query Parameters:**

| 파라미터          | 타입    | 필수 | 설명                    | 기본값  |
| ----------------- | ------- | ---- | ----------------------- | ------- |
| `includeExcluded` | boolean | X    | 제외된 대상자 포함 여부 | `false` |

**Response:**

```typescript
interface EvaluationTargetsResponseDto {
  evaluationPeriodId: string; // 평가기간 ID
  targets: Array<{
    id: string; // 맵핑 ID
    isExcluded: boolean; // 제외 여부
    excludeReason?: string; // 제외 사유
    excludedBy?: string; // 제외 처리자 ID
    excludedAt?: Date; // 제외 일시
    createdBy: string; // 생성자 ID
    updatedBy?: string; // 수정자 ID
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
}

// 응답
EvaluationTargetsResponseDto;
```

**Status Codes:**

- `200`: 평가 대상자 목록 조회 성공
- `400`: 잘못된 요청
- `404`: 평가기간을 찾을 수 없음

---

### 제외된 평가 대상자 조회

```typescript
GET /admin/evaluation-periods/:evaluationPeriodId/targets/excluded
```

특정 평가기간에서 제외된 평가 대상자 목록만 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
// 응답
EvaluationTargetsResponseDto;
```

**Status Codes:**

- `200`: 제외된 대상자 목록 조회 성공
- `400`: 잘못된 요청
- `404`: 평가기간을 찾을 수 없음

---

### 직원의 평가기간 맵핑 조회

```typescript
GET /admin/evaluation-periods/employee/:employeeId
```

특정 직원이 속한 모든 평가기간 맵핑을 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명    |
| ------------ | ------------- | ---- | ------- |
| `employeeId` | string (UUID) | O    | 직원 ID |

**Response:**

```typescript
interface EmployeeEvaluationPeriodsResponseDto {
  employee: {
    id: string; // 직원 ID
    employeeNumber: string; // 사번
    name: string; // 이름
    email: string; // 이메일
    status: string; // 상태
  };
  mappings: Array<{
    id: string; // 맵핑 ID
    evaluationPeriodId: string; // 평가기간 ID
    isExcluded: boolean; // 제외 여부
    excludeReason?: string; // 제외 사유
    excludedBy?: string; // 제외 처리자 ID
    excludedAt?: Date; // 제외 일시
    createdBy: string; // 생성자 ID
    updatedBy?: string; // 수정자 ID
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
}

// 응답
EmployeeEvaluationPeriodsResponseDto;
```

**Status Codes:**

- `200`: 직원의 평가기간 맵핑 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 직원을 찾을 수 없음

---

### 평가 대상 여부 확인

```typescript
GET /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId/check
```

특정 직원이 특정 평가기간의 평가 대상자인지 확인합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Response:**

```typescript
interface EvaluationTargetStatusResponseDto {
  isEvaluationTarget: boolean; // 평가 대상 여부
  evaluationPeriodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
}

// 응답
EvaluationTargetStatusResponseDto;
```

**Status Codes:**

- `200`: 평가 대상 여부 확인 성공
- `400`: 잘못된 UUID 형식

---

### 평가 대상자 등록 해제

```typescript
DELETE /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId
```

특정 직원의 평가 대상자 등록을 해제합니다 (하드 삭제).

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Response:**

```typescript
interface UnregisterEvaluationTargetResponse {
  success: boolean; // 작업 성공 여부
}

// 응답
UnregisterEvaluationTargetResponse;
```

**Status Codes:**

- `200`: 평가 대상자 등록 해제 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가 대상자를 찾을 수 없음

---

### 평가기간의 모든 대상자 등록 해제

```typescript
DELETE /admin/evaluation-periods/:evaluationPeriodId/targets
```

특정 평가기간의 모든 평가 대상자 등록을 해제합니다 (하드 삭제).

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface UnregisterAllEvaluationTargetsResponse {
  deletedCount: number; // 삭제된 대상자 수
}

// 응답
UnregisterAllEvaluationTargetsResponse;
```

**Status Codes:**

- `200`: 모든 평가 대상자 등록 해제 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간을 찾을 수 없음

---

## 사용 예시

### 1. 평가 대상자 등록

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';
const employeeId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      createdBy: 'admin-user-id',
    }),
  },
);
const mapping = await response.json();
```

### 2. 평가 대상자 대량 등록

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeIds: [
        '223e4567-e89b-12d3-a456-426614174001',
        '323e4567-e89b-12d3-a456-426614174002',
        '423e4567-e89b-12d3-a456-426614174003',
      ],
      createdBy: 'admin-user-id',
    }),
  },
);
const mappings = await response.json();
// mappings: 등록된 모든 맵핑 목록 (기존 + 신규)
```

### 3. 평가 대상 제외

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';
const employeeId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/exclude`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      excludeReason: '퇴사 예정',
      excludedBy: 'admin-user-id',
    }),
  },
);
const excludedMapping = await response.json();
```

### 4. 평가 대상 포함 (제외 취소)

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';
const employeeId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/include`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updatedBy: 'admin-user-id',
    }),
  },
);
const includedMapping = await response.json();
```

### 5. 평가기간의 평가 대상자 조회

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';

// 제외된 대상자는 제외하고 조회
const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets`,
);
const targets = await response.json();

// 제외된 대상자 포함하여 조회
const responseWithExcluded = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets?includeExcluded=true`,
);
const allTargets = await responseWithExcluded.json();
```

### 6. 직원의 평가기간 맵핑 조회

```typescript
const employeeId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/employee/${employeeId}`,
);
const result = await response.json();
// result.employee: 직원 정보
// result.mappings: 직원이 속한 모든 평가기간 맵핑
```

### 7. 평가 대상 여부 확인

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';
const employeeId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/check`,
);
const status = await response.json();
// status.isEvaluationTarget: true/false
```

### 8. 평가 대상자 등록 해제

```typescript
const evaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';
const employeeId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
  {
    method: 'DELETE',
  },
);
const result = await response.json();
// result.success: true
```

---

## 참고사항

### 제외 vs 등록 해제

- **제외 (exclude)**: 소프트 삭제, isExcluded 플래그를 true로 설정, 이력 보존
- **등록 해제 (unregister)**: 하드 삭제, 맵핑 레코드를 완전히 삭제, 이력 삭제

### 대량 등록 특징

- 이미 등록된 직원도 배열에 포함 가능 (중복 제외)
- 신규 직원만 등록하고 기존 + 신규 전체 맵핑을 반환
- 트랜잭션 처리로 일부 실패 시 전체 롤백

### 제외 사유 관리

- 제외 시 반드시 사유(excludeReason)를 기록
- 제외 처리자(excludedBy)와 제외 시각(excludedAt) 자동 기록
- 포함 시 제외 정보 모두 초기화 (null로 설정)

### 평가 대상자 조회

- `includeExcluded=false` (기본값): 제외되지 않은 대상자만
- `includeExcluded=true`: 제외된 대상자 포함
- `/targets/excluded` 엔드포인트: 제외된 대상자만

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/evaluation-period/evaluation-target-api-reference.md`
