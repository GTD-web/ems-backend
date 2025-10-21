# Evaluation Question Management API Reference

> 평가 질문 관리 API
>
> Base Path: `/admin/performance-evaluation/evaluation-questions`
>
> **인증 필수:** 모든 API 요청에 JWT 토큰이 필요합니다.

---

## 목차

### 질문 그룹 관리

- [질문 그룹 생성](#질문-그룹-생성)
- [질문 그룹 수정](#질문-그룹-수정)
- [질문 그룹 삭제](#질문-그룹-삭제)
- [질문 그룹 목록 조회](#질문-그룹-목록-조회)
- [기본 질문 그룹 조회](#기본-질문-그룹-조회)
- [질문 그룹 조회](#질문-그룹-조회)

### 평가 질문 관리

- [평가 질문 생성](#평가-질문-생성)
- [평가 질문 수정](#평가-질문-수정)
- [평가 질문 삭제](#평가-질문-삭제)
- [평가 질문 조회](#평가-질문-조회)
- [평가 질문 목록 조회](#평가-질문-목록-조회)
- [평가 질문 복사](#평가-질문-복사)

### 질문-그룹 매핑 관리

- [그룹에 질문 추가](#그룹에-질문-추가)
- [그룹에 여러 질문 추가](#그룹에-여러-질문-추가)
- [그룹 내 질문 순서 재정의](#그룹-내-질문-순서-재정의)
- [그룹에서 질문 제거](#그룹에서-질문-제거)
- [질문 순서 위로 이동](#질문-순서-위로-이동)
- [질문 순서 아래로 이동](#질문-순서-아래로-이동)
- [그룹의 질문 목록 조회](#그룹의-질문-목록-조회)
- [질문이 속한 그룹 목록 조회](#질문이-속한-그룹-목록-조회)

---

## 질문 그룹 관리

### 질문 그룹 생성

```typescript
POST / admin / performance -
  evaluation / evaluation -
  questions / question -
  groups;
```

평가 질문을 그룹으로 관리하기 위한 질문 그룹을 생성합니다.

**Request Body:**

```typescript
interface CreateQuestionGroupDto {
  name: string; // 그룹명 (필수, 중복 불가)
  isDefault?: boolean; // 기본 그룹 여부 (선택)
}
```

**참고:** 생성자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
interface SuccessResponseDto {
  id: string; // 질문 그룹 ID
  message: string; // 성공 메시지
}

// 응답
SuccessResponseDto;
```

**Status Codes:**

- `201`: 질문 그룹이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터 (그룹명 누락, 빈 문자열 등)
- `409`: 이미 동일한 그룹명이 존재함

---

### 질문 그룹 수정

```typescript
PATCH /admin/performance-evaluation/evaluation-questions/question-groups/:id
```

질문 그룹 정보를 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 질문 그룹 ID |

**Request Body:**

```typescript
interface UpdateQuestionGroupDto {
  name?: string; // 그룹명 (선택)
  isDefault?: boolean; // 기본 그룹 여부 (선택)
}
```

**참고:** 수정자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `200`: 질문 그룹이 성공적으로 수정됨
- `400`: 잘못된 요청 데이터
- `404`: 질문 그룹을 찾을 수 없음
- `409`: 이미 동일한 그룹명이 존재함

---

### 질문 그룹 삭제

```typescript
DELETE /admin/performance-evaluation/evaluation-questions/question-groups/:id
```

질문 그룹을 삭제합니다 (Soft Delete).

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 질문 그룹 ID |

**Request Body:**

요청 바디 불필요 (삭제자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
void; // 응답 본문 없음 (204 No Content)
```

**Status Codes:**

- `204`: 질문 그룹이 성공적으로 삭제됨
- `400`: 잘못된 UUID 형식
- `403`: 기본 그룹은 삭제 불가
- `404`: 질문 그룹을 찾을 수 없음

---

### 질문 그룹 목록 조회

```typescript
GET / admin / performance -
  evaluation / evaluation -
  questions / question -
  groups;
```

모든 질문 그룹 목록을 조회합니다.

**Response:**

```typescript
interface QuestionGroupResponseDto {
  id: string; // 질문 그룹 ID
  name: string; // 그룹명
  isDefault: boolean; // 기본 그룹 여부
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
QuestionGroupResponseDto[];
```

**Status Codes:**

- `200`: 질문 그룹 목록 조회 성공

---

### 기본 질문 그룹 조회

```typescript
GET /admin/performance-evaluation/evaluation-questions/question-groups/default
```

기본으로 설정된 질문 그룹을 조회합니다.

**Response:**

```typescript
// 응답
QuestionGroupResponseDto;
```

**Status Codes:**

- `200`: 기본 질문 그룹 조회 성공
- `404`: 기본 질문 그룹이 설정되지 않음

---

### 질문 그룹 조회

```typescript
GET /admin/performance-evaluation/evaluation-questions/question-groups/:id
```

특정 질문 그룹의 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 질문 그룹 ID |

**Response:**

```typescript
// 응답
QuestionGroupResponseDto;
```

**Status Codes:**

- `200`: 질문 그룹 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 질문 그룹을 찾을 수 없음

---

## 평가 질문 관리

### 평가 질문 생성

```typescript
POST / admin / performance - evaluation / evaluation - questions;
```

새로운 평가 질문을 생성합니다.

**Request Body:**

```typescript
interface CreateEvaluationQuestionDto {
  text: string; // 질문 내용 (필수)
  minScore?: number; // 최소 점수 (선택, 기본값: 1)
  maxScore?: number; // 최대 점수 (선택, 기본값: 5)
  groupId?: string; // 질문 그룹 ID (선택)
  displayOrder?: number; // 표시 순서 (선택, 기본값: 0)
}
```

**참고:** 생성자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `201`: 평가 질문이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터
- `404`: 질문 그룹을 찾을 수 없음

---

### 평가 질문 수정

```typescript
PATCH /admin/performance-evaluation/evaluation-questions/:id
```

평가 질문 정보를 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 평가 질문 ID |

**Request Body:**

```typescript
interface UpdateEvaluationQuestionDto {
  text?: string; // 질문 내용 (선택)
  minScore?: number; // 최소 점수 (선택)
  maxScore?: number; // 최대 점수 (선택)
}
```

**참고:** 수정자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `200`: 평가 질문이 성공적으로 수정됨
- `400`: 잘못된 요청 데이터
- `404`: 평가 질문을 찾을 수 없음

---

### 평가 질문 삭제

```typescript
DELETE /admin/performance-evaluation/evaluation-questions/:id
```

평가 질문을 삭제합니다 (Soft Delete).

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 평가 질문 ID |

**Request Body:**

요청 바디 불필요 (삭제자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
void; // 응답 본문 없음 (204 No Content)
```

**Status Codes:**

- `204`: 평가 질문이 성공적으로 삭제됨
- `400`: 잘못된 UUID 형식
- `404`: 평가 질문을 찾을 수 없음

---

### 평가 질문 조회

```typescript
GET /admin/performance-evaluation/evaluation-questions/:id
```

특정 평가 질문의 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 평가 질문 ID |

**Response:**

```typescript
interface EvaluationQuestionResponseDto {
  id: string; // 평가 질문 ID
  text: string; // 질문 내용
  minScore: number; // 최소 점수
  maxScore: number; // 최대 점수
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
EvaluationQuestionResponseDto;
```

**Status Codes:**

- `200`: 평가 질문 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가 질문을 찾을 수 없음

---

### 평가 질문 목록 조회

```typescript
GET / admin / performance - evaluation / evaluation - questions;
```

모든 평가 질문 목록을 조회합니다.

**Response:**

```typescript
// 응답
EvaluationQuestionResponseDto[];
```

**Status Codes:**

- `200`: 평가 질문 목록 조회 성공

---

### 평가 질문 복사

```typescript
POST /admin/performance-evaluation/evaluation-questions/:id/copy
```

기존 평가 질문을 복사하여 새로운 질문을 생성합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명         |
| -------- | ------------- | ---- | ------------ |
| `id`     | string (UUID) | O    | 평가 질문 ID |

**Request Body:**

요청 바디 불필요 (복사자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
// 응답
SuccessResponseDto; // 복사된 새 질문의 ID 반환
```

**Status Codes:**

- `201`: 평가 질문이 성공적으로 복사됨
- `400`: 잘못된 UUID 형식
- `404`: 평가 질문을 찾을 수 없음

---

## 질문-그룹 매핑 관리

### 그룹에 질문 추가

```typescript
POST / admin / performance -
  evaluation / evaluation -
  questions / question -
  group -
  mappings;
```

질문 그룹에 평가 질문을 추가합니다.

**Request Body:**

```typescript
interface AddQuestionToGroupDto {
  groupId: string; // 질문 그룹 ID (필수)
  questionId: string; // 평가 질문 ID (필수)
  displayOrder?: number; // 표시 순서 (선택, 기본값: 0)
}
```

**참고:** 생성자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `201`: 질문이 그룹에 성공적으로 추가됨
- `400`: 잘못된 요청 데이터
- `404`: 질문 그룹 또는 평가 질문을 찾을 수 없음
- `409`: 이미 해당 그룹에 질문이 추가되어 있음

---

### 그룹에 여러 질문 추가

```typescript
POST / admin / performance -
  evaluation / evaluation -
  questions / question -
  group -
  mappings / bulk;
```

질문 그룹에 여러 평가 질문을 한 번에 추가합니다.

**Request Body:**

```typescript
interface AddMultipleQuestionsToGroupDto {
  groupId: string; // 질문 그룹 ID (필수)
  questionIds: string[]; // 평가 질문 ID 목록 (필수, 최소 1개)
  startDisplayOrder?: number; // 시작 표시 순서 (선택, 기본값: 0)
}
```

**참고:** 생성자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
interface BatchSuccessResponseDto {
  ids: string[]; // 생성된 매핑 ID 목록
  message: string; // 성공 메시지
  successCount: number; // 성공한 개수
  totalCount: number; // 전체 요청 개수
}

// 응답
BatchSuccessResponseDto;
```

**Status Codes:**

- `201`: 질문들이 그룹에 성공적으로 추가됨
- `400`: 잘못된 요청 데이터 (빈 배열 등)
- `404`: 질문 그룹을 찾을 수 없음

---

### 그룹 내 질문 순서 재정의

```typescript
PATCH / admin / performance -
  evaluation / evaluation -
  questions / question -
  group -
  mappings / reorder;
```

질문 그룹 내 질문들의 표시 순서를 재정의합니다.

**Request Body:**

```typescript
interface ReorderGroupQuestionsDto {
  groupId: string; // 질문 그룹 ID (필수)
  questionIds: string[]; // 정렬된 평가 질문 ID 목록 (필수, 순서대로)
}
```

**참고:** 수정자 정보는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `200`: 질문 순서가 성공적으로 재정의됨
- `400`: 잘못된 요청 데이터
- `404`: 질문 그룹을 찾을 수 없음

---

### 그룹에서 질문 제거

```typescript
DELETE /admin/performance-evaluation/evaluation-questions/question-group-mappings/:mappingId
```

질문 그룹에서 평가 질문을 제거합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명    |
| ----------- | ------------- | ---- | ------- |
| `mappingId` | string (UUID) | O    | 매핑 ID |

**Request Body:**

요청 바디 불필요 (삭제자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
void; // 응답 본문 없음 (204 No Content)
```

**Status Codes:**

- `204`: 질문이 그룹에서 성공적으로 제거됨
- `400`: 잘못된 UUID 형식
- `404`: 매핑을 찾을 수 없음

---

### 질문 순서 위로 이동

```typescript
PATCH /admin/performance-evaluation/evaluation-questions/question-group-mappings/:mappingId/move-up
```

질문의 표시 순서를 한 단계 위로 이동합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명    |
| ----------- | ------------- | ---- | ------- |
| `mappingId` | string (UUID) | O    | 매핑 ID |

**Request Body:**

요청 바디 불필요 (수정자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `200`: 질문 순서가 성공적으로 이동됨
- `400`: 잘못된 UUID 형식 또는 이미 최상위 순서
- `404`: 매핑을 찾을 수 없음

---

### 질문 순서 아래로 이동

```typescript
PATCH /admin/performance-evaluation/evaluation-questions/question-group-mappings/:mappingId/move-down
```

질문의 표시 순서를 한 단계 아래로 이동합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명    |
| ----------- | ------------- | ---- | ------- |
| `mappingId` | string (UUID) | O    | 매핑 ID |

**Request Body:**

요청 바디 불필요 (수정자 정보는 JWT 토큰에서 자동으로 추출됩니다)

**Response:**

```typescript
// 응답
SuccessResponseDto;
```

**Status Codes:**

- `200`: 질문 순서가 성공적으로 이동됨
- `400`: 잘못된 UUID 형식 또는 이미 최하위 순서
- `404`: 매핑을 찾을 수 없음

---

### 그룹의 질문 목록 조회

```typescript
GET /admin/performance-evaluation/evaluation-questions/question-groups/:groupId/questions
```

특정 질문 그룹에 속한 질문 목록을 조회합니다.

**Path Parameters:**

| 파라미터  | 타입          | 필수 | 설명         |
| --------- | ------------- | ---- | ------------ |
| `groupId` | string (UUID) | O    | 질문 그룹 ID |

**Response:**

```typescript
interface QuestionGroupMappingResponseDto {
  id: string; // 매핑 ID
  groupId: string; // 질문 그룹 ID
  questionId: string; // 평가 질문 ID
  displayOrder: number; // 표시 순서
  question: EvaluationQuestionResponseDto; // 질문 정보
  createdAt: Date; // 생성일시
}

// 응답
QuestionGroupMappingResponseDto[]; // displayOrder로 정렬됨
```

**Status Codes:**

- `200`: 질문 목록 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 질문 그룹을 찾을 수 없음

---

### 질문이 속한 그룹 목록 조회

```typescript
GET /admin/performance-evaluation/evaluation-questions/:questionId/groups
```

특정 평가 질문이 속한 질문 그룹 목록을 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명         |
| ------------ | ------------- | ---- | ------------ |
| `questionId` | string (UUID) | O    | 평가 질문 ID |

**Response:**

```typescript
// 응답
QuestionGroupMappingResponseDto[]; // 질문이 속한 그룹 목록
```

**Status Codes:**

- `200`: 그룹 목록 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가 질문을 찾을 수 없음

---

## 사용 예시

### 1. 질문 그룹 생성 및 기본 그룹 설정

```typescript
// 일반 질문 그룹 생성
const response1 = await fetch(
  'http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-groups',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
    body: JSON.stringify({
      name: '2024년 상반기 평가 질문',
      isDefault: false,
    }),
  },
);

// 기본 질문 그룹으로 생성
const response2 = await fetch(
  'http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-groups',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
    body: JSON.stringify({
      name: '기본 평가 질문 그룹',
      isDefault: true, // 기본 그룹으로 설정
    }),
  },
);
```

### 2. 평가 질문 생성

```typescript
const response = await fetch(
  'http://localhost:4000/admin/performance-evaluation/evaluation-questions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
    body: JSON.stringify({
      text: '업무 수행 능력이 우수합니까?',
      minScore: 1,
      maxScore: 5,
      groupId: 'group-uuid', // 선택사항
      displayOrder: 1,
    }),
  },
);

const result = await response.json();
// result.id: 생성된 질문 ID
```

### 3. 그룹에 여러 질문 추가

```typescript
const groupId = 'group-uuid';

const response = await fetch(
  'http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-group-mappings/bulk',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
    body: JSON.stringify({
      groupId: groupId,
      questionIds: ['question-uuid-1', 'question-uuid-2', 'question-uuid-3'],
      startDisplayOrder: 0, // 0부터 시작
    }),
  },
);

const result = await response.json();
// result.ids: 생성된 매핑 ID 목록
// result.successCount: 성공한 개수
```

### 4. 그룹 내 질문 순서 재정의

```typescript
const groupId = 'group-uuid';

// 원하는 순서대로 질문 ID 배열 구성
const response = await fetch(
  'http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-group-mappings/reorder',
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
    body: JSON.stringify({
      groupId: groupId,
      questionIds: [
        'question-uuid-3', // 첫 번째로 표시
        'question-uuid-1', // 두 번째로 표시
        'question-uuid-2', // 세 번째로 표시
      ],
    }),
  },
);
```

### 5. 그룹의 질문 목록 조회

```typescript
const groupId = 'group-uuid';

const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-groups/${groupId}/questions`,
);

const questions = await response.json();
// questions: displayOrder 순으로 정렬된 질문 목록
// 각 항목에는 question 정보 포함
```

### 6. 평가 질문 복사

```typescript
const questionId = 'question-uuid';

// 기존 질문을 복사하여 새 질문 생성
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-questions/${questionId}/copy`,
  {
    method: 'POST',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const result = await response.json();
// result.id: 복사된 새 질문의 ID
```

### 7. 질문 순서 조정

```typescript
const mappingId = 'mapping-uuid';

// 위로 이동
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-group-mappings/${mappingId}/move-up`,
  {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

// 아래로 이동
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-questions/question-group-mappings/${mappingId}/move-down`,
  {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);
```

---

## 참고사항

### 질문 그룹 (Question Group)

- **목적**: 평가 질문을 그룹으로 분류하여 관리
- **기본 그룹**: `isDefault=true`로 설정된 그룹, 시스템에서 기본적으로 사용
- **그룹명**: 중복 불가, 빈 문자열 또는 공백만 포함 불가
- **기본 그룹 삭제**: 기본 그룹은 삭제 불가 (403 에러)

### 평가 질문 (Evaluation Question)

- **질문 내용**: `text` 필드에 평가 질문의 내용 작성
- **점수 범위**: `minScore` ~ `maxScore` 설정 (기본값: 1~5)
- **복사 기능**: 기존 질문을 복사하여 유사한 질문 빠르게 생성 가능
- **질문 재사용**: 한 질문을 여러 그룹에 추가 가능

### 질문-그룹 매핑 (Question-Group Mapping)

- **매핑**: 질문과 그룹의 다대다 관계를 나타냄
- **표시 순서**: `displayOrder` 필드로 그룹 내 질문의 표시 순서 관리
- **순서 조정**:
  - `move-up`: 한 단계 위로 (displayOrder 감소)
  - `move-down`: 한 단계 아래로 (displayOrder 증가)
  - `reorder`: 전체 순서를 한 번에 재정의

### 일괄 작업

- **여러 질문 추가**: 한 번에 여러 질문을 그룹에 추가 가능
- **순서 자동 설정**: `startDisplayOrder`부터 순차적으로 증가하며 자동 설정
- **부분 실패**: 일부 질문이 이미 그룹에 있어도 나머지는 추가됨

### 질문 점수 설정

- **minScore**: 평가 가능한 최소 점수 (예: 1점)
- **maxScore**: 평가 가능한 최대 점수 (예: 5점)
- **점수 범위 예시**:
  - 1~5점: 일반적인 5점 척도
  - 0~10점: 10점 척도
  - 1~100점: 100점 만점 척도

### Soft Delete

- 질문 그룹과 평가 질문은 Soft Delete로 처리
- 삭제된 항목은 조회 목록에서 제외되지만 DB에는 유지
- 이력 관리 및 복구 가능

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/performance-evaluation/evaluation-question-api-reference.md`
