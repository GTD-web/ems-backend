# Peer Evaluation Management API Reference

> 동료평가 관리 API
>
> Base Path: `/admin/performance-evaluation/peer-evaluations`

---

## 목차

- [동료평가 요청 (단일)](#동료평가-요청-단일)
- [동료평가 요청 (한 피평가자→여러 평가자)](#동료평가-요청-한-피평가자여러-평가자)
- [동료평가 요청 (한 평가자→여러 피평가자)](#동료평가-요청-한-평가자여러-피평가자)
- [동료평가 제출](#동료평가-제출)
- [평가자의 동료평가 목록 조회](#평가자의-동료평가-목록-조회)
- [동료평가 상세정보 조회](#동료평가-상세정보-조회)
- [평가자에게 할당된 피평가자 목록 조회](#평가자에게-할당된-피평가자-목록-조회)
- [동료평가 요청 취소 (단일)](#동료평가-요청-취소-단일)
- [동료평가 요청 일괄 취소](#동료평가-요청-일괄-취소)

---

## API Endpoints

### 동료평가 요청 (단일)

```typescript
POST /admin/performance-evaluation/peer-evaluations/requests
```

관리자가 평가자에게 피평가자를 평가하도록 요청(할당)합니다.

**Request Body:**

```typescript
interface RequestPeerEvaluationDto {
  evaluatorId: string; // 평가자 ID (필수)
  evaluateeId: string; // 피평가자 ID (필수)
  periodId: string; // 평가기간 ID (필수)
  requestDeadline?: Date; // 요청 마감일 (선택)
  questionIds?: string[]; // 질문 ID 목록 (선택)
  requestedBy?: string; // 요청자 ID (선택)
}
```

**Response:**

```typescript
interface PeerEvaluationResponseDto {
  id: string; // 동료평가 ID
  message: string; // 성공 메시지
}

// 응답
PeerEvaluationResponseDto;
```

**Status Codes:**

- `201`: 동료평가가 성공적으로 요청됨
- `400`: 잘못된 요청 데이터
- `404`: 평가자, 피평가자 또는 평가기간을 찾을 수 없음
- `409`: 이미 동일한 동료평가 요청이 존재함

---

### 동료평가 요청 (한 피평가자→여러 평가자)

```typescript
POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators
```

한 명의 피평가자를 여러 평가자가 평가하도록 일괄 요청합니다.

**Request Body:**

```typescript
interface RequestPeerEvaluationToMultipleEvaluatorsDto {
  evaluatorIds: string[]; // 평가자 ID 목록 (필수, 최소 1개)
  evaluateeId: string; // 피평가자 ID (필수)
  periodId: string; // 평가기간 ID (필수)
  requestDeadline?: Date; // 요청 마감일 (선택)
  questionIds?: string[]; // 질문 ID 목록 (선택)
  requestedBy?: string; // 요청자 ID (선택)
}
```

**Response:**

```typescript
interface BulkPeerEvaluationRequestResponseDto {
  results: Array<{
    evaluationId?: string; // 생성된 평가 ID (성공 시)
    evaluatorId: string; // 평가자 ID
    success: boolean; // 성공 여부
    error?: string; // 에러 메시지 (실패 시)
  }>;
  summary: {
    total: number; // 전체 요청 수
    success: number; // 성공한 요청 수
    failed: number; // 실패한 요청 수
  };
  message: string; // 전체 결과 메시지
  ids: string[]; // 성공한 평가 ID 목록 (하위 호환성)
  count: number; // 성공한 평가 개수 (하위 호환성)
}

// 응답
BulkPeerEvaluationRequestResponseDto;
```

**Status Codes:**

- `201`: 동료평가 요청들이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터
- `404`: 피평가자 또는 평가기간을 찾을 수 없음

---

### 동료평가 요청 (한 평가자→여러 피평가자)

```typescript
POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees
```

한 명의 평가자가 여러 피평가자를 평가하도록 일괄 요청합니다.

**Request Body:**

```typescript
interface RequestMultiplePeerEvaluationsDto {
  evaluatorId: string; // 평가자 ID (필수)
  evaluateeIds: string[]; // 피평가자 ID 목록 (필수, 최소 1개)
  periodId: string; // 평가기간 ID (필수)
  requestDeadline?: Date; // 요청 마감일 (선택)
  questionIds?: string[]; // 질문 ID 목록 (선택)
  requestedBy?: string; // 요청자 ID (선택)
}
```

**Response:**

```typescript
// 응답
BulkPeerEvaluationRequestResponseDto;
```

**Status Codes:**

- `201`: 동료평가 요청들이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터
- `404`: 평가자 또는 평가기간을 찾을 수 없음

---

### 동료평가 제출

```typescript
PUT /admin/performance-evaluation/peer-evaluations/:id/submit
```

동료평가를 제출합니다. 제출 후 상태가 COMPLETED로 변경됩니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 동료평가 ID |

**Request Body:**

```typescript
interface SubmitPeerEvaluationDto {
  submittedBy?: string; // 제출자 ID (선택)
}
```

**Response:**

```typescript
void; // 응답 본문 없음
```

**Status Codes:**

- `200`: 동료평가가 성공적으로 제출됨
- `400`: 잘못된 UUID 형식
- `404`: 동료평가를 찾을 수 없음
- `409`: 이미 제출된 평가임

---

### 평가자의 동료평가 목록 조회

```typescript
GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId?evaluateeId={uuid}&periodId={uuid}&projectId={uuid}&status={status}&page={number}&limit={number}
```

특정 평가자의 동료평가 목록을 필터링하여 조회합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명      |
| ------------- | ------------- | ---- | --------- |
| `evaluatorId` | string (UUID) | O    | 평가자 ID |

**Query Parameters:**

| 파라미터      | 타입          | 필수 | 설명                     | 기본값 |
| ------------- | ------------- | ---- | ------------------------ | ------ |
| `evaluateeId` | string (UUID) | X    | 피평가자 ID로 필터링     | -      |
| `periodId`    | string (UUID) | X    | 평가기간 ID로 필터링     | -      |
| `projectId`   | string (UUID) | X    | 프로젝트 ID로 필터링     | -      |
| `status`      | string        | X    | 평가 상태로 필터링       | -      |
| `page`        | number        | X    | 페이지 번호              | `1`    |
| `limit`       | number        | X    | 페이지 크기              | `10`   |

**status 가능값:**
- `PENDING`: 대기 중
- `IN_PROGRESS`: 진행 중
- `COMPLETED`: 완료됨
- `CANCELLED`: 취소됨

**Response:**

```typescript
interface PeerEvaluationListResponseDto {
  data: Array<{
    id: string; // 동료평가 ID
    evaluatorId: string; // 평가자 ID
    evaluateeId: string; // 피평가자 ID
    periodId: string; // 평가기간 ID
    projectId?: string; // 프로젝트 ID
    status: string; // 평가 상태
    requestDeadline?: Date; // 요청 마감일
    questionIds?: string[]; // 질문 ID 목록
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
PeerEvaluationListResponseDto;
```

**Status Codes:**

- `200`: 동료평가 목록 조회 성공
- `400`: 잘못된 쿼리 파라미터

---

### 동료평가 상세정보 조회

```typescript
GET /admin/performance-evaluation/peer-evaluations/:id
```

특정 동료평가의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 동료평가 ID |

**Response:**

```typescript
interface PeerEvaluationDetailResult {
  id: string; // 동료평가 ID
  evaluatorId: string; // 평가자 ID
  evaluateeId: string; // 피평가자 ID
  periodId: string; // 평가기간 ID
  projectId?: string; // 프로젝트 ID
  status: string; // 평가 상태
  requestDeadline?: Date; // 요청 마감일
  questionIds?: string[]; // 질문 ID 목록
  answers?: Array<{
    questionId: string; // 질문 ID
    score?: number; // 점수
    comment?: string; // 코멘트
  }>;
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  version: number; // 버전
}

// 응답
PeerEvaluationDetailResult;
```

**Status Codes:**

- `200`: 동료평가 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 동료평가를 찾을 수 없음

---

### 평가자에게 할당된 피평가자 목록 조회

```typescript
GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId/assigned-evaluatees?periodId={uuid}&includeCompleted={boolean}
```

특정 평가자에게 할당된 피평가자 목록을 조회합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명      |
| ------------- | ------------- | ---- | --------- |
| `evaluatorId` | string (UUID) | O    | 평가자 ID |

**Query Parameters:**

| 파라미터           | 타입          | 필수 | 설명                        | 기본값 |
| ------------------ | ------------- | ---- | --------------------------- | ------ |
| `periodId`         | string (UUID) | X    | 평가기간 ID로 필터링        | -      |
| `includeCompleted` | boolean       | X    | 완료된 평가 포함 여부       | -      |

**Response:**

```typescript
interface AssignedEvaluateeDto {
  evaluateeId: string; // 피평가자 ID
  evaluateeName: string; // 피평가자 이름
  periodId: string; // 평가기간 ID
  projectId?: string; // 프로젝트 ID
  evaluationId: string; // 동료평가 ID
  status: string; // 평가 상태
  requestDeadline?: Date; // 요청 마감일
}

// 응답
AssignedEvaluateeDto[];
```

**Status Codes:**

- `200`: 할당된 피평가자 목록 조회 성공
- `400`: 잘못된 UUID 형식

---

### 동료평가 요청 취소 (단일)

```typescript
DELETE /admin/performance-evaluation/peer-evaluations/:id
```

특정 동료평가 요청을 취소합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 동료평가 ID |

**Response:**

```typescript
void; // 응답 본문 없음
```

**Status Codes:**

- `200`: 동료평가 요청이 성공적으로 취소됨
- `400`: 잘못된 UUID 형식
- `404`: 동료평가를 찾을 수 없음
- `409`: 이미 취소되었거나 완료된 평가임

---

### 동료평가 요청 일괄 취소

```typescript
DELETE /admin/performance-evaluation/peer-evaluations/evaluatee/:evaluateeId/period/:periodId/cancel-all
```

특정 평가기간의 피평가자에 대한 모든 동료평가 요청을 일괄 취소합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명        |
| ------------- | ------------- | ---- | ----------- |
| `evaluateeId` | string (UUID) | O    | 피평가자 ID |
| `periodId`    | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface CancelPeerEvaluationsResponse {
  message: string; // 성공 메시지
  cancelledCount: number; // 취소된 평가 개수
}

// 응답
CancelPeerEvaluationsResponse;
```

**Status Codes:**

- `200`: 동료평가 요청들이 성공적으로 취소됨
- `400`: 잘못된 UUID 형식
- `404`: 평가기간 또는 피평가자를 찾을 수 없음

---

## 사용 예시

### 1. 동료평가 요청 (단일)

```typescript
const response = await fetch(
  'http://localhost:4000/admin/performance-evaluation/peer-evaluations/requests',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorId: 'evaluator-uuid',
      evaluateeId: 'evaluatee-uuid',
      periodId: 'period-uuid',
      requestDeadline: '2024-12-31T23:59:59.000Z',
      questionIds: ['question-uuid-1', 'question-uuid-2'],
      requestedBy: 'admin-user-id', // 선택사항
    }),
  },
);

const result = await response.json();
// result.id: 생성된 동료평가 ID
// result.message: 성공 메시지
```

### 2. 동료평가 요청 (한 피평가자→여러 평가자)

```typescript
// 한 직원을 여러 동료가 평가하도록 요청
const response = await fetch(
  'http://localhost:4000/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorIds: [
        'evaluator-uuid-1',
        'evaluator-uuid-2',
        'evaluator-uuid-3',
      ],
      evaluateeId: 'evaluatee-uuid',
      periodId: 'period-uuid',
      requestDeadline: '2024-12-31T23:59:59.000Z',
    }),
  },
);

const result = await response.json();
// result.summary.total: 전체 요청 수
// result.summary.success: 성공한 요청 수
// result.summary.failed: 실패한 요청 수
// result.results: 각 요청의 상세 결과
```

### 3. 동료평가 요청 (한 평가자→여러 피평가자)

```typescript
// 한 평가자가 여러 동료를 평가하도록 요청
const response = await fetch(
  'http://localhost:4000/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorId: 'evaluator-uuid',
      evaluateeIds: [
        'evaluatee-uuid-1',
        'evaluatee-uuid-2',
        'evaluatee-uuid-3',
      ],
      periodId: 'period-uuid',
    }),
  },
);

const result = await response.json();
```

### 4. 동료평가 제출

```typescript
const evaluationId = 'evaluation-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submittedBy: 'evaluator-user-id', // 선택사항
    }),
  },
);

// 성공 시 응답 본문 없음 (200 OK)
```

### 5. 평가자의 동료평가 목록 조회

```typescript
const evaluatorId = 'evaluator-uuid';

// 모든 동료평가 조회
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}?page=1&limit=20`,
);

const result = await response.json();
// result.data: 동료평가 목록

// 특정 평가기간의 PENDING 상태만 조회
const responseFiltered = await fetch(
  `http://localhost:4000/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}?periodId=period-uuid&status=PENDING`,
);
```

### 6. 평가자에게 할당된 피평가자 목록 조회

```typescript
const evaluatorId = 'evaluator-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees?periodId=${periodId}&includeCompleted=false`,
);

const assignedEvaluatees = await response.json();
// 미완료된 평가만 조회
// assignedEvaluatees: 할당된 피평가자 목록
```

### 7. 동료평가 요청 일괄 취소

```typescript
const evaluateeId = 'evaluatee-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluateeId}/period/${periodId}/cancel-all`,
  {
    method: 'DELETE',
  },
);

const result = await response.json();
// result.message: 성공 메시지
// result.cancelledCount: 취소된 평가 개수
```

---

## 참고사항

### 평가 상태 (Status)

- **PENDING**: 대기 중 (평가 요청만 생성됨)
- **IN_PROGRESS**: 진행 중 (평가 작성 시작)
- **COMPLETED**: 완료됨 (평가 제출 완료)
- **CANCELLED**: 취소됨 (요청이 취소됨)

### 일괄 요청 (Bulk Request)

두 가지 패턴을 지원합니다:

1. **한 피평가자 → 여러 평가자**: 한 직원을 여러 동료가 평가
   - 사용 예: 팀장이 팀원 A를 여러 동료들이 평가하도록 요청
   - 엔드포인트: `/requests/bulk/one-evaluatee-to-many-evaluators`

2. **한 평가자 → 여러 피평가자**: 한 평가자가 여러 직원을 평가
   - 사용 예: 팀원 B가 팀 내 여러 동료들을 평가하도록 요청
   - 엔드포인트: `/requests/bulk/one-evaluator-to-many-evaluatees`

### 질문 매핑 (Question Mapping)

- `questionIds` 제공 시 해당 질문들에 대해 평가 작성 요청
- 질문 ID는 평가 질문 관리 API에서 조회 가능
- 질문 없이 요청만 생성 가능 (questionIds 생략)

### 평가 취소

- **단일 취소**: 특정 평가 요청만 취소
- **일괄 취소**: 피평가자의 모든 평가 요청 취소
- 취소된 평가는 상태가 CANCELLED로 변경됨
- 이미 완료된 평가는 취소 불가

### 할당된 피평가자 조회

- 평가자가 평가해야 할 피평가자 목록 확인용
- `includeCompleted=false`로 미완료 평가만 조회 가능
- 특정 평가기간으로 필터링 가능

### 일괄 요청 응답 구조

```typescript
{
  results: [
    {
      evaluationId: 'uuid', // 성공 시
      evaluatorId: 'uuid',
      success: true
    },
    {
      evaluatorId: 'uuid',
      success: false,
      error: '평가자를 찾을 수 없습니다.' // 실패 시
    }
  ],
  summary: {
    total: 5,
    success: 4,
    failed: 1
  },
  message: '5건 중 4건의 동료평가 요청이 생성되었습니다. (실패: 1건)',
  ids: ['uuid1', 'uuid2', 'uuid3', 'uuid4'], // 성공한 평가 ID 목록
  count: 4 // 성공한 개수
}
```

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/performance-evaluation/peer-evaluation-api-reference.md`

