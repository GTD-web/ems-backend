# Downward Evaluation Management API Reference

> 하향평가 관리 API
>
> Base Path: `/admin/performance-evaluation/downward-evaluations`
>
> **인증 필수:** 모든 API 요청에 JWT 토큰이 필요합니다.

---

## 목차

- [1차 하향평가 저장](#1차-하향평가-저장)
- [2차 하향평가 저장](#2차-하향평가-저장)
- [1차 하향평가 제출](#1차-하향평가-제출)
- [2차 하향평가 제출](#2차-하향평가-제출)
- [하향평가 제출 (ID로 직접)](#하향평가-제출-id로-직접)
- [평가자의 하향평가 목록 조회](#평가자의-하향평가-목록-조회)
- [하향평가 상세정보 조회](#하향평가-상세정보-조회)

---

## API Endpoints

### 1차 하향평가 저장

```typescript
POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:projectId/primary
```

1차 하향평가를 저장합니다. Upsert 방식으로 동작하여 이미 존재하면 수정, 없으면 생성합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명        |
| ------------- | ------------- | ---- | ----------- |
| `evaluateeId` | string (UUID) | O    | 피평가자 ID |
| `periodId`    | string (UUID) | O    | 평가기간 ID |
| `projectId`   | string (UUID) | O    | 프로젝트 ID |

**Request Body:**

```typescript
interface CreatePrimaryDownwardEvaluationDto {
  evaluatorId: string; // 평가자 ID (필수)
  selfEvaluationId?: string; // 자기평가 ID (선택)
  downwardEvaluationContent?: string; // 평가 내용 (선택)
  downwardEvaluationScore?: number; // 평가 점수 (선택, 양의 정수만 허용)
}
// 참고: actionBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
interface DownwardEvaluationResponseDto {
  id: string; // 하향평가 ID
  evaluatorId: string; // 평가자 ID
  message: string; // 성공 메시지
}

// 응답
DownwardEvaluationResponseDto;
```

**평가 점수 규칙:**

- 양의 정수만 허용 (1 이상)
- 음수, 0, 소수는 허용되지 않음

**Status Codes:**

- `200`: 1차 하향평가가 성공적으로 저장됨
- `400`: 잘못된 요청 데이터
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 피평가자, 평가기간 또는 프로젝트를 찾을 수 없음

---

### 2차 하향평가 저장

```typescript
POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:projectId/secondary
```

2차 하향평가를 저장합니다. Upsert 방식으로 동작하여 이미 존재하면 수정, 없으면 생성합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명        |
| ------------- | ------------- | ---- | ----------- |
| `evaluateeId` | string (UUID) | O    | 피평가자 ID |
| `periodId`    | string (UUID) | O    | 평가기간 ID |
| `projectId`   | string (UUID) | O    | 프로젝트 ID |

**Request Body:**

```typescript
interface CreateSecondaryDownwardEvaluationDto {
  evaluatorId: string; // 평가자 ID (필수)
  selfEvaluationId?: string; // 자기평가 ID (선택)
  downwardEvaluationContent?: string; // 평가 내용 (선택)
  downwardEvaluationScore?: number; // 평가 점수 (선택, 양의 정수만 허용)
}
// 참고: actionBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
// 응답
DownwardEvaluationResponseDto;
```

**Status Codes:**

- `200`: 2차 하향평가가 성공적으로 저장됨
- `400`: 잘못된 요청 데이터
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 피평가자, 평가기간 또는 프로젝트를 찾을 수 없음

---

### 1차 하향평가 제출

```typescript
PUT /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:projectId/primary/submit
```

1차 하향평가를 제출합니다. 제출 후 isCompleted가 true로 변경되며 completedAt이 기록됩니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명        |
| ------------- | ------------- | ---- | ----------- |
| `evaluateeId` | string (UUID) | O    | 피평가자 ID |
| `periodId`    | string (UUID) | O    | 평가기간 ID |
| `projectId`   | string (UUID) | O    | 프로젝트 ID |

**Request Body:**

```typescript
interface SubmitDownwardEvaluationDto {
  evaluatorId: string; // 평가자 ID (필수)
}
// 참고: submittedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
void; // 응답 본문 없음
```

**Status Codes:**

- `200`: 1차 하향평가가 성공적으로 제출됨
- `400`: 잘못된 요청 데이터
- `404`: 하향평가를 찾을 수 없음
- `409`: 이미 제출된 평가임

---

### 2차 하향평가 제출

```typescript
PUT /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:projectId/secondary/submit
```

2차 하향평가를 제출합니다. 제출 후 isCompleted가 true로 변경되며 completedAt이 기록됩니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명        |
| ------------- | ------------- | ---- | ----------- |
| `evaluateeId` | string (UUID) | O    | 피평가자 ID |
| `periodId`    | string (UUID) | O    | 평가기간 ID |
| `projectId`   | string (UUID) | O    | 프로젝트 ID |

**Request Body:**

```typescript
interface SubmitDownwardEvaluationDto {
  evaluatorId: string; // 평가자 ID (필수)
}
// 참고: submittedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
void; // 응답 본문 없음
```

**Status Codes:**

- `200`: 2차 하향평가가 성공적으로 제출됨
- `400`: 잘못된 요청 데이터
- `404`: 하향평가를 찾을 수 없음
- `409`: 이미 제출된 평가임

---

### 하향평가 제출 (ID로 직접)

```typescript
PUT /admin/performance-evaluation/downward-evaluations/:id/submit
```

하향평가 ID로 직접 제출합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 하향평가 ID |

**Request Body:**

요청 바디 불필요 (제출자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
void; // 응답 본문 없음
```

**Status Codes:**

- `200`: 하향평가가 성공적으로 제출됨
- `400`: 잘못된 UUID 형식
- `404`: 하향평가를 찾을 수 없음
- `409`: 이미 제출된 평가임

---

### 평가자의 하향평가 목록 조회

```typescript
GET /admin/performance-evaluation/downward-evaluations/evaluator/:evaluatorId?evaluateeId={uuid}&periodId={uuid}&projectId={uuid}&evaluationType={type}&isCompleted={boolean}&page={number}&limit={number}
```

특정 평가자의 하향평가 목록을 필터링하여 조회합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명      |
| ------------- | ------------- | ---- | --------- |
| `evaluatorId` | string (UUID) | O    | 평가자 ID |

**Query Parameters:**

| 파라미터         | 타입          | 필수 | 설명                    | 기본값 |
| ---------------- | ------------- | ---- | ----------------------- | ------ |
| `evaluateeId`    | string (UUID) | X    | 피평가자 ID로 필터링    | -      |
| `periodId`       | string (UUID) | X    | 평가기간 ID로 필터링    | -      |
| `projectId`      | string (UUID) | X    | 프로젝트 ID로 필터링    | -      |
| `evaluationType` | string        | X    | 평가 타입으로 필터링    | -      |
| `isCompleted`    | boolean       | X    | 제출 완료 여부로 필터링 | -      |
| `page`           | number        | X    | 페이지 번호             | `1`    |
| `limit`          | number        | X    | 페이지 크기             | `10`   |

**evaluationType 가능값:**

- `primary`: 1차평가만
- `secondary`: 2차평가만

**Response:**

```typescript
interface DownwardEvaluationListResponseDto {
  data: Array<{
    id: string; // 하향평가 ID
    evaluatorId: string; // 평가자 ID
    evaluateeId: string; // 피평가자 ID
    periodId: string; // 평가기간 ID
    projectId: string; // 프로젝트 ID
    selfEvaluationId?: string; // 자기평가 ID
    evaluationType: 'primary' | 'secondary'; // 평가 타입
    downwardEvaluationContent?: string; // 평가 내용
    downwardEvaluationScore?: number; // 평가 점수
    isCompleted: boolean; // 제출 완료 여부
    evaluationDate: Date; // 평가 일자
    completedAt?: Date; // 제출 일시
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
DownwardEvaluationListResponseDto;
```

**Status Codes:**

- `200`: 하향평가 목록 조회 성공
- `400`: 잘못된 쿼리 파라미터

---

### 하향평가 상세정보 조회

```typescript
GET /admin/performance-evaluation/downward-evaluations/:id
```

특정 하향평가의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 하향평가 ID |

**Response:**

```typescript
interface DownwardEvaluationDetailResponseDto {
  id: string; // 하향평가 ID
  evaluatorId: string; // 평가자 ID
  evaluateeId: string; // 피평가자 ID
  periodId: string; // 평가기간 ID
  projectId: string; // 프로젝트 ID
  selfEvaluationId?: string; // 자기평가 ID
  evaluationType: 'primary' | 'secondary'; // 평가 타입
  downwardEvaluationContent?: string; // 평가 내용
  downwardEvaluationScore?: number; // 평가 점수
  isCompleted: boolean; // 제출 완료 여부
  evaluationDate: Date; // 평가 일자
  completedAt?: Date; // 제출 일시
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  version: number; // 버전
}

// 응답
DownwardEvaluationDetailResponseDto;
```

**Status Codes:**

- `200`: 하향평가 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 하향평가를 찾을 수 없음

---

## 사용 예시

### 1. 1차 하향평가 저장 (신규 생성)

```typescript
const evaluateeId = 'evaluatee-uuid';
const periodId = 'period-uuid';
const projectId = 'project-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/project/${projectId}/primary`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorId: 'evaluator-uuid', // 선택사항
      downwardEvaluationContent: '프로젝트 수행 능력이 우수합니다.',
      downwardEvaluationScore: 85,
      createdBy: 'admin-user-id', // 선택사항
    }),
  },
);

const result = await response.json();
// result.id: 생성된 하향평가 ID
// result.evaluatorId: 평가자 ID
// result.message: 성공 메시지
```

### 2. 2차 하향평가 저장

```typescript
const evaluateeId = 'evaluatee-uuid';
const periodId = 'period-uuid';
const projectId = 'project-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/project/${projectId}/secondary`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      downwardEvaluationContent: '리더십과 협업 능력이 뛰어납니다.',
      downwardEvaluationScore: 90,
    }),
  },
);

const result = await response.json();
```

### 3. 1차 하향평가 제출

```typescript
const evaluateeId = 'evaluatee-uuid';
const periodId = 'period-uuid';
const projectId = 'project-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/project/${projectId}/primary/submit`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorId: 'evaluator-uuid', // 선택사항
      submittedBy: 'admin-user-id', // 선택사항
    }),
  },
);

// 성공 시 응답 본문 없음 (200 OK)
```

### 4. 하향평가 ID로 직접 제출

```typescript
const evaluationId = 'evaluation-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submittedBy: 'admin-user-id',
    }),
  },
);

// 성공 시 응답 본문 없음 (200 OK)
```

### 5. 평가자의 하향평가 목록 조회

```typescript
const evaluatorId = 'evaluator-uuid';

// 모든 하향평가 조회
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/evaluator/${evaluatorId}?page=1&limit=20`,
);

const result = await response.json();
// result.data: 하향평가 목록
// result.total: 전체 개수

// 1차평가만 조회 (제출 완료된 것만)
const responseFiltered = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/evaluator/${evaluatorId}?evaluationType=primary&isCompleted=true`,
);
```

### 6. 하향평가 상세정보 조회

```typescript
const evaluationId = 'evaluation-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/downward-evaluations/${evaluationId}`,
);

const evaluation = await response.json();
// evaluation.evaluationType: 'primary' 또는 'secondary'
// evaluation.isCompleted: 제출 완료 여부
// evaluation.downwardEvaluationScore: 평가 점수
```

---

## 참고사항

### 평가 타입 (Evaluation Type)

- **primary**: 1차 하향평가 (직속 상사)
- **secondary**: 2차 하향평가 (2차 상사)

각 타입은 독립적으로 관리되며, 동일한 피평가자-프로젝트-평가기간 조합에 대해 1차와 2차를 각각 생성할 수 있습니다.

### 평가 점수 규칙

- **허용값**: 1 이상의 양의 정수
- **금지값**: 0, 음수, 소수점
- **예시**: 1, 5, 10, 50, 85, 100, 120 등

### Upsert 동작

- **신규 생성**: 동일 조건 (evaluatorId, evaluateeId, periodId, projectId, evaluationType)의 평가가 없으면 생성
- **기존 수정**: 이미 존재하면 업데이트
- **조건**: 평가자, 피평가자, 평가기간, 프로젝트, 평가타입의 조합으로 유일성 보장

### 평가 제출 프로세스

1. **평가 작성**: POST로 평가 저장 (isCompleted: false)
2. **수정**: 여러 번 수정 가능 (Upsert)
3. **제출**: PUT (submit)으로 제출 (isCompleted: true)
4. **제출 후**: completedAt 자동 기록

### 자기평가 연결

- `selfEvaluationId` 필드로 관련 자기평가와 연결 가능
- 선택 사항이며, 연결하지 않고도 하향평가 작성 가능
- 연결 시 자기평가 내용을 참고하여 하향평가 작성 가능

### 프로젝트 기반 평가

- 하향평가는 프로젝트 단위로 작성
- 한 직원이 여러 프로젝트에 참여하는 경우 각 프로젝트별로 평가
- 각 프로젝트마다 1차/2차 평가 가능

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/performance-evaluation/downward-evaluation-api-reference.md`
