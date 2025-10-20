# WBS Evaluation Criteria Management API Reference

> WBS 평가기준 관리 API
>
> Base Path: `/admin/evaluation-criteria/wbs-evaluation-criteria`

---

## 목차

- [WBS 평가기준 목록 조회](#wbs-평가기준-목록-조회)
- [WBS 평가기준 상세 조회](#wbs-평가기준-상세-조회)
- [WBS 항목별 평가기준 조회](#wbs-항목별-평가기준-조회)
- [WBS 평가기준 저장 (Upsert)](#wbs-평가기준-저장-upsert)
- [WBS 평가기준 삭제](#wbs-평가기준-삭제)
- [WBS 항목 평가기준 전체 삭제](#wbs-항목-평가기준-전체-삭제)

---

## API Endpoints

### WBS 평가기준 목록 조회

```typescript
GET /admin/evaluation-criteria/wbs-evaluation-criteria?wbsItemId={uuid}&criteriaSearch={string}&criteriaExact={string}
```

필터 조건에 따라 WBS 평가기준 목록을 조회합니다.

**Query Parameters:**

| 파라미터         | 타입          | 필수 | 설명                        |
| ---------------- | ------------- | ---- | --------------------------- |
| `wbsItemId`      | string (UUID) | X    | WBS 항목 ID                 |
| `criteriaSearch` | string        | X    | 평가기준 검색어 (부분 일치) |
| `criteriaExact`  | string        | X    | 평가기준 검색어 (완전 일치) |

**Response:**

```typescript
interface WbsEvaluationCriteriaDto {
  id: string; // 평가기준 ID
  wbsItemId: string; // WBS 항목 ID
  criteria: string; // 평가기준 내용
  weight?: number; // 가중치
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
WbsEvaluationCriteriaDto[]
```

**Status Codes:**

- `200`: WBS 평가기준 목록이 성공적으로 조회됨
- `400`: 잘못된 요청
- `500`: 서버 내부 오류

---

### WBS 평가기준 상세 조회

```typescript
GET /admin/evaluation-criteria/wbs-evaluation-criteria/:id
```

특정 WBS 평가기준의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기준 ID |

**Response:**

```typescript
interface WbsEvaluationCriteriaDetailDto {
  id: string; // 평가기준 ID
  wbsItemId: string; // WBS 항목 ID
  criteria: string; // 평가기준 내용
  weight?: number; // 가중치
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  deletedAt?: Date; // 삭제일시
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID

  // 조인된 정보
  wbsItem?: {
    id: string;
    title: string;
    code: string;
    description?: string;
  };
}

// 응답
WbsEvaluationCriteriaDetailDto | null;
```

**Status Codes:**

- `200`: WBS 평가기준 상세 정보가 성공적으로 조회됨
- `404`: 평가기준을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 항목별 평가기준 조회

```typescript
GET /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId
```

특정 WBS 항목의 모든 평가기준을 조회합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `wbsItemId` | string (UUID) | O    | WBS 항목 ID |

**Response:**

```typescript
interface WbsItemEvaluationCriteriaResponseDto {
  wbsItemId: string; // WBS 항목 ID
  criteria: Array<{
    id: string; // 평가기준 ID
    criteria: string; // 평가기준 내용
    weight?: number; // 가중치
    displayOrder: number; // 표시 순서
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
}

// 응답
WbsItemEvaluationCriteriaResponseDto;
```

**Status Codes:**

- `200`: WBS 항목의 평가기준 목록이 성공적으로 조회됨 (없으면 빈 배열)
- `400`: 잘못된 UUID 형식
- `404`: WBS 항목을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 평가기준 저장 (Upsert)

```typescript
POST /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId
```

WBS 항목의 평가기준을 저장합니다 (Upsert: wbsItemId 기준으로 자동 생성/수정).

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `wbsItemId` | string (UUID) | O    | WBS 항목 ID |

**Request Body:**

```typescript
interface UpsertWbsEvaluationCriteriaBodyDto {
  criteria: string; // 평가기준 내용
  weight?: number; // 가중치
}
// 참고: actionBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**동작 방식:**

- 해당 WBS 항목에 평가기준이 없으면: 새로 생성
- 이미 평가기준이 존재하면: 기존 평가기준 업데이트
- Upsert 방식으로 동작하여 중복 생성 방지

**Response:**

```typescript
interface WbsEvaluationCriteriaDto {
  id: string; // 평가기준 ID
  wbsItemId: string; // WBS 항목 ID
  criteria: string; // 평가기준 내용
  weight?: number; // 가중치
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
WbsEvaluationCriteriaDto;
```

**Status Codes:**

- `201`: WBS 평가기준이 성공적으로 저장됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `404`: WBS 항목을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 평가기준 삭제

```typescript
DELETE /admin/evaluation-criteria/wbs-evaluation-criteria/:id
```

특정 WBS 평가기준을 삭제합니다 (소프트 삭제).

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기준 ID |

**Response:**

```typescript
interface DeleteWbsEvaluationCriteriaResponseDto {
  success: boolean; // 삭제 성공 여부
}

// 응답
DeleteWbsEvaluationCriteriaResponseDto;
```

**Status Codes:**

- `200`: WBS 평가기준이 성공적으로 삭제됨
- `404`: 평가기준을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 항목 평가기준 전체 삭제

```typescript
DELETE /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId
```

특정 WBS 항목의 모든 평가기준을 삭제합니다 (소프트 삭제).

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `wbsItemId` | string (UUID) | O    | WBS 항목 ID |

**Response:**

```typescript
interface DeleteWbsItemEvaluationCriteriaResponseDto {
  success: boolean; // 삭제 성공 여부
}

// 응답
DeleteWbsItemEvaluationCriteriaResponseDto;
```

**Status Codes:**

- `200`: WBS 항목의 평가기준이 성공적으로 삭제됨
- `404`: WBS 항목을 찾을 수 없음
- `500`: 서버 내부 오류

---

## 사용 예시

### 1. WBS 항목별 평가기준 조회

```typescript
const wbsItemId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
);
const data = await response.json();
// data.criteria: 평가기준 목록
```

### 2. WBS 평가기준 저장 (Upsert)

```typescript
const wbsItemId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      criteria: '업무 완성도 및 품질',
      weight: 30,
    }),
  },
);
const savedCriteria = await response.json();
```

### 3. WBS 평가기준 목록 조회 (검색)

```typescript
const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-evaluation-criteria?criteriaSearch=완성도`,
);
const criteriaList = await response.json();
// '완성도'를 포함하는 모든 평가기준 조회
```

### 4. WBS 평가기준 상세 조회

```typescript
const criteriaId = '323e4567-e89b-12d3-a456-426614174005';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-evaluation-criteria/${criteriaId}`,
);
const criteriaDetail = await response.json();
```

### 5. WBS 평가기준 삭제

```typescript
const criteriaId = '323e4567-e89b-12d3-a456-426614174005';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-evaluation-criteria/${criteriaId}`,
  {
    method: 'DELETE',
  },
);
const result = await response.json();
// result.success: true
```

### 6. WBS 항목 평가기준 전체 삭제

```typescript
const wbsItemId = '223e4567-e89b-12d3-a456-426614174001';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
  {
    method: 'DELETE',
  },
);
const result = await response.json();
// result.success: true
```

---

## 참고사항

### Upsert 동작

- **wbsItemId 기준**: 동일한 WBS 항목에 대해 평가기준이 이미 있으면 업데이트
- **멱등성 보장**: 동일한 요청을 여러 번 보내도 안전
- **자동 생성**: WBS 항목에 평가기준이 없으면 자동으로 생성

### 평가기준 검색

- **criteriaSearch**: 평가기준 내용에서 부분 일치 검색 (LIKE)
- **criteriaExact**: 평가기준 내용 완전 일치 검색 (=)
- **wbsItemId**: 특정 WBS 항목의 평가기준만 조회

### 가중치 관리

- **weight**: 평가기준의 가중치 (선택 사항)
- **합계 관리**: 한 WBS 항목 내 모든 평가기준의 가중치 합계가 100이 되도록 관리 권장
- **displayOrder**: 표시 순서 (자동 관리됨)

### 삭제 방식

- **소프트 삭제**: 실제 데이터는 유지되고 `deletedAt` 타임스탬프만 설정됨
- **복구 가능**: 필요 시 삭제된 평가기준 복구 가능
- **전체 삭제**: WBS 항목의 모든 평가기준을 한 번에 삭제 가능

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/evaluation-criteria/wbs-evaluation-criteria-api-reference.md`
