# Evaluation Editable Status Management API Reference

> 평가 수정 가능 상태 관리 API
>
> Base Path: `/admin/performance-evaluation/evaluation-editable-status`

---

## 목차

- [평가 수정 가능 상태 변경](#평가-수정-가능-상태-변경)

---

## API Endpoints

### 평가 수정 가능 상태 변경

```typescript
PATCH /admin/performance-evaluation/evaluation-editable-status/:mappingId?evaluationType={type}&isEditable={boolean}
```

특정 직원의 평가 수정 가능 상태를 변경합니다. 각 평가 타입별로 독립적으로 수정 가능 여부를 제어할 수 있습니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명                  |
| ----------- | ------------- | ---- | --------------------- |
| `mappingId` | string (UUID) | O    | 평가기간-직원 맵핑 ID |

**Query Parameters:**

| 파라미터         | 타입   | 필수 | 설명           | 가능값                                    |
| ---------------- | ------ | ---- | -------------- | ----------------------------------------- |
| `evaluationType` | string | O    | 평가 타입      | `self`, `primary`, `secondary`, `all`     |
| `isEditable`     | string | O    | 수정 가능 여부 | `true`, `false`, `1`, `0`, `yes`, `no` 등 |

**Request Body:**

```typescript
interface UpdateEvaluationEditableStatusDto {
  updatedBy?: string; // 수정자 ID (선택사항)
}
```

**Response:**

```typescript
interface EvaluationEditableStatusResponseDto {
  id: string; // 맵핑 ID
  evaluationPeriodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  isSelfEvaluationEditable: boolean; // 자기평가 수정 가능 여부
  isPrimaryEvaluationEditable: boolean; // 1차평가 수정 가능 여부
  isSecondaryEvaluationEditable: boolean; // 2차평가 수정 가능 여부
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
EvaluationEditableStatusResponseDto;
```

**평가 타입 (evaluationType):**

- `self`: 자기평가 수정 가능 상태만 변경
- `primary`: 1차평가 수정 가능 상태만 변경
- `secondary`: 2차평가 수정 가능 상태만 변경
- `all`: 모든 평가 수정 가능 상태 일괄 변경

**Status Codes:**

- `200`: 평가 수정 가능 상태가 성공적으로 변경됨
- `400`: 잘못된 요청 (필수 파라미터 누락, UUID 형식 오류, 잘못된 평가 타입, 잘못된 boolean 값 등)
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 평가기간-직원 맵핑을 찾을 수 없음
- `500`: 서버 내부 오류

---

## 사용 예시

### 1. 자기평가 수정 가능 상태 변경

```typescript
const mappingId = '550e8400-e29b-41d4-a716-446655440000';

// 자기평가만 수정 가능하도록 설정
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=self&isEditable=true`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updatedBy: 'admin-user-id', // 선택사항
    }),
  },
);

const result = await response.json();
// result.isSelfEvaluationEditable: true로 변경됨
```

### 2. 1차평가 수정 가능 상태 변경

```typescript
const mappingId = '550e8400-e29b-41d4-a716-446655440000';

// 1차평가만 수정 가능하도록 설정
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=primary&isEditable=true`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}), // updatedBy 생략 가능
  },
);

const result = await response.json();
// result.isPrimaryEvaluationEditable: true로 변경됨
```

### 3. 모든 평가 수정 불가능하도록 일괄 변경

```typescript
const mappingId = '550e8400-e29b-41d4-a716-446655440000';

// 평가 종료 시 모든 평가 잠금
const response = await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=all&isEditable=false`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updatedBy: 'admin-user-id',
    }),
  },
);

const result = await response.json();
// result.isSelfEvaluationEditable: false
// result.isPrimaryEvaluationEditable: false
// result.isSecondaryEvaluationEditable: false
```

### 4. 순차적 잠금 시나리오 (평가 진행 단계별)

```typescript
const mappingId = '550e8400-e29b-41d4-a716-446655440000';

// 1단계: 자기평가만 수정 가능
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=self&isEditable=true`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

// 2단계: 자기평가 잠금, 1차평가 수정 가능
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=self&isEditable=false`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=primary&isEditable=true`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

// 3단계: 1차평가 잠금, 2차평가 수정 가능
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=primary&isEditable=false`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=secondary&isEditable=true`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);

// 4단계: 평가 종료, 모든 평가 잠금
await fetch(
  `http://localhost:4000/admin/performance-evaluation/evaluation-editable-status/${mappingId}?evaluationType=all&isEditable=false`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);
```

---

## 참고사항

### 평가 타입 (Evaluation Type)

- **self**: 자기평가 (직원 본인이 작성)
- **primary**: 1차평가 (직속 상사가 작성)
- **secondary**: 2차평가 (2차 상사가 작성)
- **all**: 모든 평가 타입 일괄 적용

### 수정 가능 여부 (isEditable)

허용되는 값:

- `true`, `1`, `yes`, `on` → 수정 가능
- `false`, `0`, `no`, `off` → 수정 불가능

엄격한 검증: 위에 나열된 값 외의 입력은 400 에러 발생

### 평가 진행 단계별 잠금 전략

1. **평가 시작**: 자기평가만 수정 가능 (`self=true`, others=`false`)
2. **1차평가 시작**: 자기평가 잠금, 1차평가 수정 가능 (`primary=true`, others=`false`)
3. **2차평가 시작**: 1차평가 잠금, 2차평가 수정 가능 (`secondary=true`, others=`false`)
4. **평가 종료**: 모든 평가 잠금 (all=`false`)

### 독립적 변경

각 평가 타입은 서로 독립적으로 변경 가능합니다:

- 자기평가를 잠그더라도 1차/2차평가는 영향 없음
- 1차평가를 잠그더라도 자기평가/2차평가는 영향 없음
- `all` 타입을 사용하면 모든 평가 타입을 동시에 변경

### 타임스탬프 동작

- **createdAt**: 맵핑 생성 시각, 변경되지 않음
- **updatedAt**: 상태 변경 시마다 자동으로 현재 시각으로 갱신

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/performance-evaluation/evaluation-editable-status-api-reference.md`
