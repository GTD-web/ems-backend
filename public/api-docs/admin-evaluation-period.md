# Evaluation Period Management API Reference

> 평가기간 관리 API
>
> Base Path: `/admin/evaluation-periods`

---

## 목차

- [활성 평가 기간 조회](#활성-평가-기간-조회)
- [평가 기간 목록 조회](#평가-기간-목록-조회)
- [평가 기간 상세 조회](#평가-기간-상세-조회)
- [평가 기간 생성](#평가-기간-생성)
- [평가 기간 시작](#평가-기간-시작)
- [평가 기간 완료](#평가-기간-완료)
- [평가 기간 기본 정보 수정](#평가-기간-기본-정보-수정)
- [평가 기간 일정 수정](#평가-기간-일정-수정)
- [평가 기간 시작일 수정](#평가-기간-시작일-수정)
- [평가설정 단계 마감일 수정](#평가설정-단계-마감일-수정)
- [업무 수행 단계 마감일 수정](#업무-수행-단계-마감일-수정)
- [자기 평가 단계 마감일 수정](#자기-평가-단계-마감일-수정)
- [하향동료평가 단계 마감일 수정](#하향동료평가-단계-마감일-수정)
- [평가 기간 등급 구간 수정](#평가-기간-등급-구간-수정)
- [평가 기준 설정 수동 허용 변경](#평가-기준-설정-수동-허용-변경)
- [자기 평가 설정 수동 허용 변경](#자기-평가-설정-수동-허용-변경)
- [최종 평가 설정 수동 허용 변경](#최종-평가-설정-수동-허용-변경)
- [전체 수동 허용 설정 변경](#전체-수동-허용-설정-변경)
- [평가 기간 삭제](#평가-기간-삭제)

---

## API Endpoints

### 활성 평가 기간 조회

```typescript
GET /admin/evaluation-periods/active
```

오직 상태가 'in-progress'인 평가 기간만 반환합니다.

**Response:**

```typescript
interface EvaluationPeriodDto {
  id: string; // 평가기간 ID
  name: string; // 평가기간명
  status: 'waiting' | 'in-progress' | 'completed'; // 평가기간 상태
  startDate: Date; // 시작일
  evaluationSetupDeadline?: Date; // 평가설정 단계 마감일
  performanceDeadline?: Date; // 업무 수행 단계 마감일
  selfEvaluationDeadline?: Date; // 자기 평가 단계 마감일
  peerEvaluationDeadline: Date; // 하향/동료평가 단계 마감일
  description?: string; // 설명
  maxSelfEvaluationRate: number; // 최대 자기평가 달성률
  allowCriteriaManualSetting: boolean; // 평가기준 수동 설정 허용
  allowSelfEvaluationManualSetting: boolean; // 자기평가 수동 설정 허용
  allowFinalEvaluationManualSetting: boolean; // 최종평가 수동 설정 허용
  gradeRanges: Array<{
    grade: string; // 등급
    minRange: number; // 최소 범위
    maxRange: number; // 최대 범위
  }>;
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
}

// 응답
EvaluationPeriodDto[];
```

**Status Codes:**

- `200`: 활성 평가 기간 목록이 성공적으로 조회됨 (없으면 빈 배열)

---

### 평가 기간 목록 조회

```typescript
GET /admin/evaluation-periods?page={number}&limit={number}
```

모든 상태의 평가 기간을 페이징하여 조회합니다.

**Query Parameters:**

| 파라미터 | 타입   | 필수 | 설명         | 기본값 |
| -------- | ------ | ---- | ------------ | ------ |
| `page`   | number | X    | 페이지 번호  | `1`    |
| `limit`  | number | X    | 페이지 크기  | `10`   |

**Response:**

```typescript
interface EvaluationPeriodListResponseDto {
  data: EvaluationPeriodDto[]; // 평가 기간 목록
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
EvaluationPeriodListResponseDto;
```

**Status Codes:**

- `200`: 평가 기간 목록이 성공적으로 조회됨
- `400`: 잘못된 페이징 파라미터
- `500`: 서버 내부 오류

---

### 평가 기간 상세 조회

```typescript
GET /admin/evaluation-periods/:id
```

특정 평가 기간의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
// 응답
EvaluationPeriodDto | null;
```

**Status Codes:**

- `200`: 평가 기간 상세 정보가 조회됨 (없으면 null 반환)
- `400`: 잘못된 UUID 형식
- `500`: 서버 내부 오류

---

### 평가 기간 생성

```typescript
POST /admin/evaluation-periods
```

새로운 평가 기간을 생성합니다.

**Request Body:**

```typescript
interface CreateEvaluationPeriodDto {
  name: string; // 평가기간명 (필수)
  startDate: Date; // 시작일 (필수)
  peerEvaluationDeadline: Date; // 하향/동료평가 단계 마감일 (필수)
  description?: string; // 설명
  maxSelfEvaluationRate?: number; // 최대 자기평가 달성률 (기본값: 120)
  gradeRanges?: Array<{
    grade: string; // 등급
    minRange: number; // 최소 범위
    maxRange: number; // 최대 범위
  }>;
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `201`: 평가 기간이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터
- `409`: 중복된 평가 기간명 또는 겹치는 날짜 범위
- `500`: 서버 내부 오류

---

### 평가 기간 시작

```typescript
POST /admin/evaluation-periods/:id/start
```

대기 중인 평가 기간을 시작하여 'in-progress' 상태로 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface EvaluationPeriodActionResponse {
  success: boolean; // 작업 성공 여부
}

// 응답
EvaluationPeriodActionResponse;
```

**Status Codes:**

- `200`: 평가 기간이 성공적으로 시작됨
- `400`: 잘못된 UUID 형식
- `404`: 평가 기간을 찾을 수 없음
- `422`: 평가 기간을 시작할 수 없는 상태 (이미 시작됨 또는 완료됨)
- `500`: 서버 내부 오류

---

### 평가 기간 완료

```typescript
POST /admin/evaluation-periods/:id/complete
```

진행 중인 평가 기간을 완료하여 'completed' 상태로 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface EvaluationPeriodActionResponse {
  success: boolean; // 작업 성공 여부
}

// 응답
EvaluationPeriodActionResponse;
```

**Status Codes:**

- `200`: 평가 기간이 성공적으로 완료됨
- `400`: 잘못된 UUID 형식
- `404`: 평가 기간을 찾을 수 없음
- `422`: 평가 기간을 완료할 수 없는 상태 (대기 중이거나 이미 완료됨)
- `500`: 서버 내부 오류

---

### 평가 기간 기본 정보 수정

```typescript
PATCH /admin/evaluation-periods/:id/basic-info
```

평가 기간의 기본 정보 (이름, 설명, 달성률)를 부분 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateEvaluationPeriodBasicDto {
  name?: string; // 평가기간명
  description?: string; // 설명
  maxSelfEvaluationRate?: number; // 최대 자기평가 달성률 (100-200)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 기본 정보가 성공적으로 수정됨
- `400`: 잘못된 요청 데이터
- `404`: 평가 기간을 찾을 수 없음
- `409`: 중복된 평가 기간명
- `422`: 완료된 평가 기간은 수정 불가
- `500`: 서버 내부 오류

---

### 평가 기간 일정 수정

```typescript
PATCH /admin/evaluation-periods/:id/schedule
```

평가 기간의 모든 일정을 부분 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateEvaluationPeriodScheduleDto {
  startDate?: Date; // 시작일
  evaluationSetupDeadline?: Date; // 평가설정 단계 마감일
  performanceDeadline?: Date; // 업무 수행 단계 마감일
  selfEvaluationDeadline?: Date; // 자기 평가 단계 마감일
  peerEvaluationDeadline?: Date; // 하향/동료평가 단계 마감일
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 일정이 성공적으로 수정됨
- `400`: 잘못된 날짜 형식 또는 날짜 순서 위반
- `404`: 평가 기간을 찾을 수 없음
- `422`: 완료된 평가 기간은 수정 불가
- `500`: 서버 내부 오류

---

### 평가 기간 시작일 수정

```typescript
PATCH /admin/evaluation-periods/:id/start-date
```

평가 기간의 시작일만 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateEvaluationPeriodStartDateDto {
  startDate: Date; // 시작일 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 시작일이 성공적으로 수정됨
- `400`: 잘못된 날짜 형식
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 평가설정 단계 마감일 수정

```typescript
PATCH /admin/evaluation-periods/:id/evaluation-setup-deadline
```

평가설정 단계의 마감일만 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateEvaluationSetupDeadlineDto {
  evaluationSetupDeadline: Date; // 평가설정 단계 마감일 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 마감일이 성공적으로 수정됨
- `400`: 잘못된 날짜 형식
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 업무 수행 단계 마감일 수정

```typescript
PATCH /admin/evaluation-periods/:id/performance-deadline
```

업무 수행 단계의 마감일만 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdatePerformanceDeadlineDto {
  performanceDeadline: Date; // 업무 수행 단계 마감일 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 마감일이 성공적으로 수정됨
- `400`: 잘못된 날짜 형식
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 자기 평가 단계 마감일 수정

```typescript
PATCH /admin/evaluation-periods/:id/self-evaluation-deadline
```

자기 평가 단계의 마감일만 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateSelfEvaluationDeadlineDto {
  selfEvaluationDeadline: Date; // 자기 평가 단계 마감일 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 마감일이 성공적으로 수정됨
- `400`: 잘못된 날짜 형식
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 하향동료평가 단계 마감일 수정

```typescript
PATCH /admin/evaluation-periods/:id/peer-evaluation-deadline
```

하향/동료평가 단계의 마감일만 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdatePeerEvaluationDeadlineDto {
  peerEvaluationDeadline: Date; // 하향/동료평가 단계 마감일 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 마감일이 성공적으로 수정됨
- `400`: 잘못된 날짜 형식
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 평가 기간 등급 구간 수정

```typescript
PATCH /admin/evaluation-periods/:id/grade-ranges
```

평가 기간의 등급 구간을 수정합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateGradeRangesDto {
  gradeRanges: Array<{
    grade: string; // 등급
    minRange: number; // 최소 범위
    maxRange: number; // 최대 범위
  }>;
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 등급 구간이 성공적으로 수정됨
- `400`: 잘못된 등급 구간 데이터
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 평가 기준 설정 수동 허용 변경

```typescript
PATCH /admin/evaluation-periods/:id/criteria-setting-permission
```

평가 기준 설정의 수동 허용 여부를 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ManualPermissionSettingDto {
  allowManualSetting: boolean; // 수동 설정 허용 여부 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 설정이 성공적으로 변경됨
- `400`: 잘못된 요청 데이터
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 자기 평가 설정 수동 허용 변경

```typescript
PATCH /admin/evaluation-periods/:id/self-evaluation-setting-permission
```

자기 평가 설정의 수동 허용 여부를 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ManualPermissionSettingDto {
  allowManualSetting: boolean; // 수동 설정 허용 여부 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 설정이 성공적으로 변경됨
- `400`: 잘못된 요청 데이터
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 최종 평가 설정 수동 허용 변경

```typescript
PATCH /admin/evaluation-periods/:id/final-evaluation-setting-permission
```

최종 평가 설정의 수동 허용 여부를 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ManualPermissionSettingDto {
  allowManualSetting: boolean; // 수동 설정 허용 여부 (필수)
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 설정이 성공적으로 변경됨
- `400`: 잘못된 요청 데이터
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 전체 수동 허용 설정 변경

```typescript
PATCH /admin/evaluation-periods/:id/manual-setting-permissions
```

모든 수동 허용 설정을 한 번에 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface UpdateManualSettingPermissionsDto {
  allowCriteriaManualSetting?: boolean; // 평가기준 수동 설정 허용
  allowSelfEvaluationManualSetting?: boolean; // 자기평가 수동 설정 허용
  allowFinalEvaluationManualSetting?: boolean; // 최종평가 수동 설정 허용
}
```

**Response:**

```typescript
// 응답
EvaluationPeriodDto;
```

**Status Codes:**

- `200`: 설정이 성공적으로 변경됨
- `400`: 잘못된 요청 데이터
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 평가 기간 삭제

```typescript
DELETE /admin/evaluation-periods/:id
```

평가 기간을 삭제합니다 (소프트 삭제).

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명        |
| -------- | ------------- | ---- | ----------- |
| `id`     | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface EvaluationPeriodActionResponse {
  success: boolean; // 작업 성공 여부
}

// 응답
EvaluationPeriodActionResponse;
```

**Status Codes:**

- `200`: 평가 기간이 성공적으로 삭제됨
- `400`: 잘못된 UUID 형식
- `404`: 평가 기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

## 사용 예시

### 1. 활성 평가 기간 조회

```typescript
const response = await fetch(
  'http://localhost:4000/admin/evaluation-periods/active',
);
const activePeriods = await response.json();
// activePeriods: 진행 중인 평가 기간 목록
```

### 2. 평가 기간 목록 조회 (페이징)

```typescript
const response = await fetch(
  'http://localhost:4000/admin/evaluation-periods?page=1&limit=10',
);
const result = await response.json();
// result.data: 평가 기간 목록
// result.total: 전체 개수
// result.totalPages: 전체 페이지 수
```

### 3. 평가 기간 생성

```typescript
const response = await fetch('http://localhost:4000/admin/evaluation-periods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '2024년 상반기 평가',
    startDate: '2024-01-01T00:00:00.000Z',
    peerEvaluationDeadline: '2024-06-30T23:59:59.000Z',
    description: '2024년 상반기 성과 평가',
    maxSelfEvaluationRate: 120,
    gradeRanges: [
      { grade: 'S+', minRange: 95, maxRange: 100 },
      { grade: 'S', minRange: 90, maxRange: 94.99 },
      { grade: 'A+', minRange: 85, maxRange: 89.99 },
      { grade: 'A', minRange: 80, maxRange: 84.99 },
      { grade: 'B+', minRange: 75, maxRange: 79.99 },
    ],
  }),
});
const period = await response.json();
```

### 4. 평가 기간 시작

```typescript
const periodId = '123e4567-e89b-12d3-a456-426614174000';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${periodId}/start`,
  {
    method: 'POST',
  },
);
const result = await response.json();
// result.success: true
```

### 5. 평가 기간 기본 정보 수정

```typescript
const periodId = '123e4567-e89b-12d3-a456-426614174000';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${periodId}/basic-info`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '2024년 상반기 성과평가 (수정)',
      description: '수정된 설명',
      maxSelfEvaluationRate: 130,
    }),
  },
);
const updatedPeriod = await response.json();
```

### 6. 평가 기간 일정 수정

```typescript
const periodId = '123e4567-e89b-12d3-a456-426614174000';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-periods/${periodId}/schedule`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: '2024-01-15T00:00:00.000Z',
      evaluationSetupDeadline: '2024-02-28T23:59:59.000Z',
      performanceDeadline: '2024-04-30T23:59:59.000Z',
      selfEvaluationDeadline: '2024-05-31T23:59:59.000Z',
      peerEvaluationDeadline: '2024-06-30T23:59:59.000Z',
    }),
  },
);
const updatedPeriod = await response.json();
```

---

## 참고사항

### 평가 기간 상태

- **waiting**: 대기 중 (생성 직후)
- **in-progress**: 진행 중 (시작 후)
- **completed**: 완료됨

### 평가 단계 순서

1. **평가설정 단계** (evaluationSetupDeadline)
2. **업무 수행 단계** (performanceDeadline)
3. **자기 평가 단계** (selfEvaluationDeadline)
4. **하향/동료평가 단계** (peerEvaluationDeadline)

### 수동 허용 설정

- **allowCriteriaManualSetting**: 평가기준을 수동으로 설정 가능
- **allowSelfEvaluationManualSetting**: 자기평가를 수동으로 설정 가능
- **allowFinalEvaluationManualSetting**: 최종평가를 수동으로 설정 가능

### 등급 구간 설정

- 각 등급의 범위(minRange ~ maxRange)는 겹치지 않아야 함
- 전체 범위는 0~100 사이여야 함
- 일반적으로 7~10개 등급으로 구성 (S+, S, A+, A, B+, B, C 등)

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/evaluation-period/evaluation-period-api-reference.md`

