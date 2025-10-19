# WBS Self-Evaluation Management API Reference

> WBS 자기평가 관리 API
>
> Base Path: `/admin/performance-evaluation/wbs-self-evaluations`

---

## 목차

- [WBS 자기평가 저장](#wbs-자기평가-저장)
- [WBS 자기평가 제출 (단일)](#wbs-자기평가-제출-단일)
- [직원의 전체 WBS 자기평가 제출](#직원의-전체-wbs-자기평가-제출)
- [WBS 자기평가 미제출 상태로 변경 (단일)](#wbs-자기평가-미제출-상태로-변경-단일)
- [직원의 전체 WBS 자기평가 미제출 상태로 변경](#직원의-전체-wbs-자기평가-미제출-상태로-변경)
- [프로젝트별 WBS 자기평가 제출](#프로젝트별-wbs-자기평가-제출)
- [프로젝트별 WBS 자기평가 미제출 상태로 변경](#프로젝트별-wbs-자기평가-미제출-상태로-변경)
- [직원의 자기평가 목록 조회](#직원의-자기평가-목록-조회)
- [WBS 자기평가 상세정보 조회](#wbs-자기평가-상세정보-조회)
- [WBS 자기평가 내용 초기화 (단일)](#wbs-자기평가-내용-초기화-단일)
- [직원의 전체 WBS 자기평가 내용 초기화](#직원의-전체-wbs-자기평가-내용-초기화)
- [프로젝트별 WBS 자기평가 내용 초기화](#프로젝트별-wbs-자기평가-내용-초기화)

---

## API Endpoints

### WBS 자기평가 저장

```typescript
POST /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/wbs/:wbsItemId/period/:periodId
```

WBS 자기평가를 저장합니다. Upsert 방식으로 동작하여 이미 존재하면 수정, 없으면 생성합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `wbsItemId`  | string (UUID) | O    | WBS 항목 ID |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface CreateWbsSelfEvaluationDto {
  selfEvaluationContent?: string; // 자기평가 내용 (선택)
  selfEvaluationScore?: number; // 자기평가 점수 (선택, 0~maxSelfEvaluationRate, 기본 최대 120)
  performanceResult?: string; // 성과 실적 (선택)
  createdBy?: string; // 생성자 ID (선택)
}
```

**Response:**

```typescript
interface WbsSelfEvaluationResponseDto {
  id: string; // 자기평가 ID
  periodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  wbsItemId: string; // WBS 항목 ID
  selfEvaluationContent?: string; // 자기평가 내용
  selfEvaluationScore?: number; // 자기평가 점수
  performanceResult?: string; // 성과 실적
  isCompleted: boolean; // 제출 완료 여부
  evaluationDate: Date; // 평가 일자
  completedAt?: Date; // 제출 일시
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  version: number; // 버전
}

// 응답
WbsSelfEvaluationResponseDto;
```

**Status Codes:**

- `200`: WBS 자기평가가 성공적으로 저장됨
- `400`: 잘못된 요청 데이터 (점수 범위 초과, UUID 형식 오류 등)
- `404`: 직원, WBS 항목 또는 평가기간을 찾을 수 없음

---

### WBS 자기평가 제출 (단일)

```typescript
PUT /admin/performance-evaluation/wbs-self-evaluations/:id/submit
```

특정 WBS 자기평가를 제출합니다. 제출 후 isCompleted가 true로 변경됩니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 자기평가 ID |

**Request Body:**

```typescript
interface SubmitWbsSelfEvaluationDto {
  submittedBy?: string; // 제출자 ID (선택)
}
```

**Response:**

```typescript
// 응답
WbsSelfEvaluationResponseDto;
```

**Status Codes:**

- `200`: WBS 자기평가가 성공적으로 제출됨
- `400`: 잘못된 UUID 형식
- `404`: 자기평가를 찾을 수 없음
- `409`: 이미 제출된 평가임

---

### 직원의 전체 WBS 자기평가 제출

```typescript
PUT /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/submit-all
```

특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 한 번에 제출합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface SubmitAllWbsSelfEvaluationsResponseDto {
  submittedCount: number; // 제출된 평가 개수
  message: string; // 성공 메시지
}

// 응답
SubmitAllWbsSelfEvaluationsResponseDto;
```

**Status Codes:**

- `200`: 모든 WBS 자기평가가 성공적으로 제출됨
- `400`: 잘못된 UUID 형식
- `404`: 직원 또는 평가기간을 찾을 수 없음

---

### WBS 자기평가 미제출 상태로 변경 (단일)

```typescript
PATCH /admin/performance-evaluation/wbs-self-evaluations/:id/reset
```

특정 WBS 자기평가를 미제출 상태로 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 자기평가 ID |

**Response:**

```typescript
// 응답
WbsSelfEvaluationResponseDto;
```

**Status Codes:**

- `200`: WBS 자기평가가 성공적으로 미제출 상태로 변경됨
- `400`: 잘못된 UUID 형식
- `404`: 자기평가를 찾을 수 없음

---

### 직원의 전체 WBS 자기평가 미제출 상태로 변경

```typescript
PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/reset-all
```

특정 직원의 특정 평가기간에 대한 모든 완료된 WBS 자기평가를 미제출 상태로 변경합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface ResetAllWbsSelfEvaluationsResponseDto {
  resetCount: number; // 미제출로 변경된 평가 개수
  message: string; // 성공 메시지
}

// 응답
ResetAllWbsSelfEvaluationsResponseDto;
```

**Status Codes:**

- `200`: 모든 WBS 자기평가가 성공적으로 미제출 상태로 변경됨
- `400`: 잘못된 UUID 형식
- `404`: 직원 또는 평가기간을 찾을 수 없음

---

### 프로젝트별 WBS 자기평가 제출

```typescript
PUT /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/submit
```

특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 한 번에 제출합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |
| `projectId`  | string (UUID) | O    | 프로젝트 ID |

**Response:**

```typescript
interface SubmitWbsSelfEvaluationsByProjectResponseDto {
  submittedCount: number; // 제출된 평가 개수
  message: string; // 성공 메시지
}

// 응답
SubmitWbsSelfEvaluationsByProjectResponseDto;
```

**Status Codes:**

- `200`: 프로젝트별 WBS 자기평가가 성공적으로 제출됨
- `400`: 잘못된 UUID 형식
- `404`: 직원, 평가기간 또는 프로젝트를 찾을 수 없음

---

### 프로젝트별 WBS 자기평가 미제출 상태로 변경

```typescript
PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/reset
```

특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 완료된 WBS 자기평가를 미제출 상태로 변경합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |
| `projectId`  | string (UUID) | O    | 프로젝트 ID |

**Response:**

```typescript
interface ResetWbsSelfEvaluationsByProjectResponseDto {
  resetCount: number; // 미제출로 변경된 평가 개수
  message: string; // 성공 메시지
}

// 응답
ResetWbsSelfEvaluationsByProjectResponseDto;
```

**Status Codes:**

- `200`: 프로젝트별 WBS 자기평가가 성공적으로 미제출 상태로 변경됨
- `400`: 잘못된 UUID 형식
- `404`: 직원, 평가기간 또는 프로젝트를 찾을 수 없음

---

### 직원의 자기평가 목록 조회

```typescript
GET /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId?periodId={uuid}&projectId={uuid}&page={number}&limit={number}
```

특정 직원의 자기평가 목록을 필터링하여 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명    |
| ------------ | ------------- | ---- | ------- |
| `employeeId` | string (UUID) | O    | 직원 ID |

**Query Parameters:**

| 파라미터    | 타입          | 필수 | 설명                 | 기본값 |
| ----------- | ------------- | ---- | -------------------- | ------ |
| `periodId`  | string (UUID) | X    | 평가기간 ID로 필터링 | -      |
| `projectId` | string (UUID) | X    | 프로젝트 ID로 필터링 | -      |
| `page`      | number        | X    | 페이지 번호          | `1`    |
| `limit`     | number        | X    | 페이지 크기          | `10`   |

**Response:**

```typescript
interface EmployeeSelfEvaluationsResponseDto {
  data: WbsSelfEvaluationResponseDto[]; // 자기평가 목록
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
EmployeeSelfEvaluationsResponseDto;
```

**Status Codes:**

- `200`: 자기평가 목록 조회 성공
- `400`: 잘못된 쿼리 파라미터

---

### WBS 자기평가 상세정보 조회

```typescript
GET /admin/performance-evaluation/wbs-self-evaluations/:id
```

특정 WBS 자기평가의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 자기평가 ID |

**Response:**

```typescript
interface WbsSelfEvaluationDetailResponseDto {
  id: string; // 자기평가 ID
  periodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  wbsItemId: string; // WBS 항목 ID
  projectId?: string; // 프로젝트 ID
  selfEvaluationContent?: string; // 자기평가 내용
  selfEvaluationScore?: number; // 자기평가 점수
  performanceResult?: string; // 성과 실적
  isCompleted: boolean; // 제출 완료 여부
  evaluationDate: Date; // 평가 일자
  completedAt?: Date; // 제출 일시
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  version: number; // 버전
  // 연관 정보
  wbsItem?: {
    name: string; // WBS 항목명
    description?: string; // 설명
  };
  project?: {
    name: string; // 프로젝트명
    code: string; // 프로젝트 코드
  };
}

// 응답
WbsSelfEvaluationDetailResponseDto;
```

**Status Codes:**

- `200`: 자기평가 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 자기평가를 찾을 수 없음

---

### WBS 자기평가 내용 초기화 (단일)

```typescript
PATCH /admin/performance-evaluation/wbs-self-evaluations/:id/clear
```

특정 WBS 자기평가의 내용(selfEvaluationContent, selfEvaluationScore, performanceResult)을 초기화합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 자기평가 ID |

**Response:**

```typescript
// 응답
WbsSelfEvaluationResponseDto;
```

**Status Codes:**

- `200`: 자기평가 내용이 성공적으로 초기화됨
- `400`: 잘못된 UUID 형식
- `404`: 자기평가를 찾을 수 없음

---

### 직원의 전체 WBS 자기평가 내용 초기화

```typescript
PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/clear-all
```

특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가 내용을 초기화합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface ClearAllWbsSelfEvaluationsResponseDto {
  clearedCount: number; // 초기화된 평가 개수
  message: string; // 성공 메시지
}

// 응답
ClearAllWbsSelfEvaluationsResponseDto;
```

**Status Codes:**

- `200`: 모든 자기평가 내용이 성공적으로 초기화됨
- `400`: 잘못된 UUID 형식
- `404`: 직원 또는 평가기간을 찾을 수 없음

---

### 프로젝트별 WBS 자기평가 내용 초기화

```typescript
PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/clear
```

특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가 내용을 초기화합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |
| `projectId`  | string (UUID) | O    | 프로젝트 ID |

**Response:**

```typescript
interface ClearWbsSelfEvaluationsByProjectResponseDto {
  clearedCount: number; // 초기화된 평가 개수
  message: string; // 성공 메시지
}

// 응답
ClearWbsSelfEvaluationsByProjectResponseDto;
```

**Status Codes:**

- `200`: 프로젝트별 자기평가 내용이 성공적으로 초기화됨
- `400`: 잘못된 UUID 형식
- `404`: 직원, 평가기간 또는 프로젝트를 찾을 수 없음

---

## 사용 예시

### 1. WBS 자기평가 저장 (신규 생성)

```typescript
const employeeId = 'employee-uuid';
const wbsItemId = 'wbs-item-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selfEvaluationContent: 'WBS 항목에 대한 자기평가 내용입니다.',
      selfEvaluationScore: 95, // 달성률 95%
      performanceResult: '예상 일정보다 빠르게 완료했습니다.',
      createdBy: 'employee-uuid', // 선택사항
    }),
  },
);

const result = await response.json();
// result.id: 생성된 자기평가 ID
// result.isCompleted: false (제출 전)
```

### 2. WBS 자기평가 수정 (Upsert)

```typescript
// 이미 존재하는 평가를 수정
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selfEvaluationScore: 110, // 달성률 110%로 수정
      performanceResult: '예상보다 월등히 빠르게 완료했습니다.',
    }),
  },
);

const result = await response.json();
// 동일한 ID로 수정됨, version 증가
```

### 3. 직원의 전체 WBS 자기평가 제출

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/period/${periodId}/submit-all`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

const result = await response.json();
// result.submittedCount: 제출된 평가 개수
// result.message: 성공 메시지
```

### 4. 프로젝트별 WBS 자기평가 제출

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';
const projectId = 'project-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/period/${periodId}/project/${projectId}/submit`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

const result = await response.json();
// result.submittedCount: 해당 프로젝트의 제출된 평가 개수
```

### 5. 직원의 자기평가 목록 조회

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';

// 특정 평가기간의 자기평가만 조회
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}?periodId=${periodId}&page=1&limit=20`,
);

const result = await response.json();
// result.data: 자기평가 목록
// result.total: 전체 개수
```

### 6. WBS 자기평가 내용 초기화

```typescript
const evaluationId = 'evaluation-uuid';

// 평가 내용만 초기화 (제출 상태는 유지)
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

const result = await response.json();
// result.selfEvaluationContent: null
// result.selfEvaluationScore: null
// result.performanceResult: null
// result.isCompleted: 유지 (변경 없음)
```

### 7. 직원의 전체 WBS 자기평가 미제출 상태로 변경

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/period/${periodId}/reset-all`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

const result = await response.json();
// result.resetCount: 미제출로 변경된 평가 개수
// result.message: 성공 메시지
```

---

## 참고사항

### Upsert 동작

- **직원-WBS항목-평가기간 조합**으로 유일성 보장
- **신규 생성**: 해당 조합의 평가가 없으면 생성 (version: 1)
- **수정**: 이미 존재하면 업데이트 (version 증가)
- 매 수정마다 `updatedAt` 갱신, `createdAt`은 유지

### 평가 점수 (selfEvaluationScore)

- **범위**: 0 ~ 평가기간의 `maxSelfEvaluationRate` (기본값: 120)
- **의미**: 달성률 (%) - 100%는 목표 달성, 120%는 목표 대비 120% 달성
- **예시**: 0, 50, 80, 100, 110, 120
- 범위 초과 시 400 에러 발생

### 제출 프로세스

1. **평가 작성**: POST로 평가 저장 (isCompleted: false)
2. **수정**: 여러 번 수정 가능 (Upsert)
3. **제출**: PUT (submit)으로 제출 (isCompleted: true)
4. **제출 후**: completedAt 자동 기록

### 제출/미제출/초기화 차이

- **제출 (submit)**: isCompleted를 true로 변경, completedAt 기록
- **미제출 (reset)**: isCompleted를 false로 변경, completedAt 제거
- **초기화 (clear)**: 평가 내용만 삭제 (content, score, result), isCompleted는 유지

### 일괄 작업

세 가지 범위의 일괄 작업 지원:

1. **직원별 일괄** (employee + period):
   - 해당 직원의 모든 WBS 자기평가에 적용
   - 엔드포인트: `/employee/:employeeId/period/:periodId/{action}`

2. **프로젝트별 일괄** (employee + period + project):
   - 해당 직원의 특정 프로젝트 WBS 자기평가에만 적용
   - 엔드포인트: `/employee/:employeeId/period/:periodId/project/:projectId/{action}`

3. **단일** (id):
   - 특정 WBS 자기평가 하나에만 적용
   - 엔드포인트: `/:id/{action}`

### 버전 관리 (Optimistic Locking)

- `version` 필드로 낙관적 잠금 구현
- 매 수정마다 version 증가
- 동시성 제어에 활용

### WBS 항목

- WBS (Work Breakdown Structure): 프로젝트 작업 분해 구조
- 각 WBS 항목은 프로젝트의 세부 작업을 나타냄
- 직원은 자신에게 할당된 WBS 항목에 대해 자기평가 작성

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/performance-evaluation/wbs-self-evaluation-api-reference.md`
