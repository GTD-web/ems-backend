# Final Evaluation Management API Reference

> 최종평가 관리 API
>
> Base Path: `/admin/performance-evaluation/final-evaluations`

---

## 목차

- [최종평가 저장 (Upsert)](#최종평가-저장-upsert)
- [최종평가 확정](#최종평가-확정)
- [최종평가 확정 취소](#최종평가-확정-취소)
- [최종평가 조회](#최종평가-조회)
- [최종평가 목록 조회](#최종평가-목록-조회)
- [직원-평가기간별 최종평가 조회](#직원-평가기간별-최종평가-조회)

---

## API Endpoints

### 최종평가 저장 (Upsert)

```typescript
POST /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId
```

직원과 평가기간 조합으로 최종평가를 저장합니다. 이미 존재하면 수정, 없으면 생성됩니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpsertFinalEvaluationDto {
  evaluationGrade: string; // 평가등급 (예: S, A, B, C, D) (필수)
  jobGrade: JobGrade; // 직무등급 (필수)
  jobDetailedGrade: JobDetailedGrade; // 직무 상세등급 (필수)
  finalComments?: string; // 최종 평가 의견 (선택)
  actionBy?: string; // 작업자 ID (선택)
}

enum JobGrade {
  T1 = 'T1',
  T2 = 'T2',
  T3 = 'T3',
}

enum JobDetailedGrade {
  a = 'a',
  n = 'n',
  u = 'u',
}
```

**Response:**

```typescript
interface FinalEvaluationResponseDto {
  id: string; // 최종평가 ID
  message: string; // 성공 메시지
}

// 응답
FinalEvaluationResponseDto;
```

**Status Codes:**

- `201`: 최종평가가 성공적으로 저장됨
- `400`: 잘못된 요청 데이터
- `422`: 확정된 평가는 수정할 수 없음

---

### 최종평가 확정

```typescript
POST /admin/performance-evaluation/final-evaluations/:id/confirm
```

최종평가를 확정합니다. 확정 후에는 수정/삭제가 불가능합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 최종평가 ID |

**Request Body:**

```typescript
interface ConfirmFinalEvaluationDto {
  confirmedBy: string; // 확정자 ID (필수)
}
```

**Response:**

```typescript
interface ConfirmFinalEvaluationResponse {
  message: string; // 성공 메시지
}

// 응답
ConfirmFinalEvaluationResponse;
```

**Status Codes:**

- `200`: 최종평가가 성공적으로 확정됨
- `400`: 잘못된 요청 데이터
- `404`: 최종평가를 찾을 수 없음
- `409`: 이미 확정된 평가임

---

### 최종평가 확정 취소

```typescript
POST /admin/performance-evaluation/final-evaluations/:id/cancel-confirmation
```

최종평가의 확정 상태를 취소합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 최종평가 ID |

**Request Body:**

```typescript
interface CancelConfirmationDto {
  updatedBy: string; // 수정자 ID (필수)
}
```

**Response:**

```typescript
interface CancelConfirmationResponse {
  message: string; // 성공 메시지
}

// 응답
CancelConfirmationResponse;
```

**Status Codes:**

- `200`: 확정 취소가 성공적으로 완료됨
- `400`: 잘못된 요청 데이터
- `404`: 최종평가를 찾을 수 없음
- `409`: 확정되지 않은 평가임

---

### 최종평가 조회

```typescript
GET /admin/performance-evaluation/final-evaluations/:id
```

특정 최종평가의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 최종평가 ID |

**Response:**

```typescript
interface FinalEvaluationDetailDto {
  id: string; // 최종평가 ID
  employeeId: string; // 직원 ID
  periodId: string; // 평가기간 ID
  evaluationGrade: string; // 평가등급
  jobGrade: JobGrade; // 직무등급
  jobDetailedGrade: JobDetailedGrade; // 직무 상세등급
  finalComments?: string; // 최종 평가 의견
  isConfirmed: boolean; // 확정 여부
  confirmedAt?: Date; // 확정 일시
  confirmedBy?: string; // 확정자 ID
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  version: number; // 버전
}

// 응답
FinalEvaluationDetailDto;
```

**Status Codes:**

- `200`: 최종평가 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 최종평가를 찾을 수 없음

---

### 최종평가 목록 조회

```typescript
GET /admin/performance-evaluation/final-evaluations?employeeId={uuid}&periodId={uuid}&evaluationGrade={string}&jobGrade={JobGrade}&jobDetailedGrade={JobDetailedGrade}&confirmedOnly={boolean}&page={number}&limit={number}
```

필터 조건에 맞는 최종평가 목록을 조회합니다.

**Query Parameters:**

| 파라미터           | 타입             | 필수 | 설명                     | 기본값 |
| ------------------ | ---------------- | ---- | ------------------------ | ------ |
| `employeeId`       | string (UUID)    | X    | 직원 ID로 필터링         | -      |
| `periodId`         | string (UUID)    | X    | 평가기간 ID로 필터링     | -      |
| `evaluationGrade`  | string           | X    | 평가등급으로 필터링      | -      |
| `jobGrade`         | JobGrade         | X    | 직무등급으로 필터링      | -      |
| `jobDetailedGrade` | JobDetailedGrade | X    | 직무 상세등급으로 필터링 | -      |
| `confirmedOnly`    | boolean          | X    | 확정된 평가만 조회       | -      |
| `page`             | number           | X    | 페이지 번호              | `1`    |
| `limit`            | number           | X    | 페이지 크기              | `10`   |

**Response:**

```typescript
interface FinalEvaluationListResponseDto {
  data: FinalEvaluationDetailDto[]; // 최종평가 목록
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
FinalEvaluationListResponseDto;
```

**Status Codes:**

- `200`: 최종평가 목록 조회 성공
- `400`: 잘못된 쿼리 파라미터

---

### 직원-평가기간별 최종평가 조회

```typescript
GET /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId
```

특정 직원의 특정 평가기간 최종평가를 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
// 응답
FinalEvaluationDetailDto | null; // 평가가 없으면 null
```

**Status Codes:**

- `200`: 최종평가 조회 성공 (없으면 null 반환)
- `400`: 잘못된 UUID 형식

---

## 사용 예시

### 1. 최종평가 저장 (신규 생성)

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluationGrade: 'A',
      jobGrade: 'T2',
      jobDetailedGrade: 'n',
      finalComments: '전반적으로 우수한 성과를 보였습니다.',
      actionBy: 'admin-user-id', // 선택사항
    }),
  },
);

const result = await response.json();
// result.id: 생성된 최종평가 ID
// result.message: 성공 메시지
```

### 2. 최종평가 수정 (Upsert)

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';

// 이미 존재하는 평가를 수정
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluationGrade: 'S',
      jobGrade: 'T3',
      jobDetailedGrade: 'u', // 상향
      finalComments: '탁월한 성과와 리더십을 보였습니다.',
    }),
  },
);

const result = await response.json();
```

### 3. 최종평가 확정

```typescript
const evaluationId = '345e6789-e89b-12d3-a456-426614174002';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations/${evaluationId}/confirm`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirmedBy: 'admin-user-id',
    }),
  },
);

const result = await response.json();
// result.message: '최종평가가 성공적으로 확정되었습니다.'
```

### 4. 최종평가 확정 취소

```typescript
const evaluationId = '345e6789-e89b-12d3-a456-426614174002';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations/${evaluationId}/cancel-confirmation`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updatedBy: 'admin-user-id',
    }),
  },
);

const result = await response.json();
```

### 5. 최종평가 조회

```typescript
const evaluationId = '345e6789-e89b-12d3-a456-426614174002';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations/${evaluationId}`,
);

const evaluation = await response.json();
// evaluation.evaluationGrade: 평가등급
// evaluation.isConfirmed: 확정 여부
```

### 6. 최종평가 목록 조회 (필터 적용)

```typescript
// 특정 평가기간의 확정된 평가만 조회
const periodId = 'period-uuid';
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations?periodId=${periodId}&confirmedOnly=true&page=1&limit=20`,
);

const result = await response.json();
// result.data: 최종평가 목록
// result.total: 전체 개수
// result.totalPages: 전체 페이지 수
```

### 7. 직원-평가기간별 최종평가 조회

```typescript
const employeeId = 'employee-uuid';
const periodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
);

const evaluation = await response.json();
// 평가가 없으면 null 반환
if (evaluation) {
  console.log('평가등급:', evaluation.evaluationGrade);
}
```

---

## 참고사항

### 직무등급 (JobGrade)

- **T1**: 일반급
- **T2**: 선임급
- **T3**: 책임급

### 직무 상세등급 (JobDetailedGrade)

- **a**: 상향
- **n**: 유지
- **u**: 하향

### 평가등급 (EvaluationGrade)

일반적으로 사용되는 등급:

- **S, S+**: 최우수
- **A, A+**: 우수
- **B, B+**: 양호
- **C**: 보통
- **D**: 미흡

### 평가 확정 프로세스

1. **평가 작성**: Upsert로 평가 저장 (isConfirmed: false)
2. **검토 및 수정**: 필요시 여러 번 수정 가능
3. **확정**: Confirm으로 평가 확정 (isConfirmed: true)
4. **확정 후**: 수정/삭제 불가능
5. **확정 취소**: 필요시 CancelConfirmation으로 확정 취소

### Upsert 동작

- **직원-평가기간 조합**으로 유일성 보장
- **신규 생성**: 해당 조합의 평가가 없으면 생성
- **수정**: 이미 존재하면 업데이트
- **확정된 평가**: 수정 시도 시 422 에러

### 버전 관리

- `version` 필드로 낙관적 잠금(Optimistic Locking) 구현
- 확정/취소 시 version 증가
- 동시성 제어에 활용

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/performance-evaluation/final-evaluation-api-reference.md`
