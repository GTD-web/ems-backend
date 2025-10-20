# WBS Assignment Management API Reference

> WBS 할당 관리 API
>
> Base Path: `/admin/evaluation-criteria/wbs-assignments`

---

## 목차

- [WBS 할당 생성](#wbs-할당-생성)
- [WBS 할당 목록 조회](#wbs-할당-목록-조회)
- [WBS 할당 상세 조회](#wbs-할당-상세-조회)
- [직원의 WBS 할당 조회](#직원의-wbs-할당-조회)
- [프로젝트의 WBS 할당 조회](#프로젝트의-wbs-할당-조회)
- [WBS 항목의 할당된 직원 조회](#wbs-항목의-할당된-직원-조회)
- [할당되지 않은 WBS 항목 조회](#할당되지-않은-wbs-항목-조회)
- [WBS 대량 할당](#wbs-대량-할당)
- [WBS 할당 취소](#wbs-할당-취소)
- [평가기간의 WBS 할당 초기화](#평가기간의-wbs-할당-초기화)
- [프로젝트의 WBS 할당 초기화](#프로젝트의-wbs-할당-초기화)
- [직원의 WBS 할당 초기화](#직원의-wbs-할당-초기화)
- [WBS 할당 순서 변경](#wbs-할당-순서-변경)

---

## API Endpoints

### WBS 할당 생성

```typescript
POST / admin / evaluation - criteria / wbs - assignments;
```

평가기간에 직원을 WBS 항목에 할당합니다.

**Request Body:**

```typescript
interface CreateWbsAssignmentDto {
  employeeId: string; // 직원 ID (UUID)
  wbsItemId: string; // WBS 항목 ID (UUID)
  projectId: string; // 프로젝트 ID (UUID)
  periodId: string; // 평가기간 ID (UUID)
}
// 참고: assignedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
interface WbsAssignmentResponseDto {
  id: string; // 할당 ID
  employeeId: string; // 직원 ID
  wbsItemId: string; // WBS 항목 ID
  projectId: string; // 프로젝트 ID
  periodId: string; // 평가기간 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
WbsAssignmentResponseDto;
```

**Status Codes:**

- `201`: WBS 할당이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `409`: 중복된 할당
- `500`: 서버 내부 오류

---

### WBS 할당 목록 조회

```typescript
GET /admin/evaluation-criteria/wbs-assignments?employeeId={uuid}&wbsItemId={uuid}&projectId={uuid}&periodId={uuid}&page={number}&limit={number}
```

다양한 필터 조건으로 WBS 할당 목록을 조회합니다.

**Query Parameters:**

| 파라미터         | 타입            | 필수 | 설명           | 기본값 |
| ---------------- | --------------- | ---- | -------------- | ------ |
| `employeeId`     | string (UUID)   | X    | 직원 ID        | -      |
| `wbsItemId`      | string (UUID)   | X    | WBS 항목 ID    | -      |
| `projectId`      | string (UUID)   | X    | 프로젝트 ID    | -      |
| `periodId`       | string (UUID)   | X    | 평가기간 ID    | -      |
| `page`           | number          | X    | 페이지 번호    | `1`    |
| `limit`          | number          | X    | 페이지 크기    | `10`   |
| `orderBy`        | string          | X    | 정렬 기준 필드 | -      |
| `orderDirection` | 'ASC' \| 'DESC' | X    | 정렬 방향      | -      |

**Response:**

```typescript
interface WbsAssignmentListResponseDto {
  data: WbsAssignmentResponseDto[]; // 할당 목록
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
WbsAssignmentListResponseDto;
```

**Status Codes:**

- `200`: WBS 할당 목록이 성공적으로 조회됨
- `400`: 잘못된 요청
- `500`: 서버 내부 오류

---

### WBS 할당 상세 조회

```typescript
GET /admin/evaluation-criteria/wbs-assignments/detail?employeeId={uuid}&wbsItemId={uuid}&projectId={uuid}&periodId={uuid}
```

특정 조건의 WBS 할당 상세 정보를 조회합니다.

**Query Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `wbsItemId`  | string (UUID) | O    | WBS 항목 ID |
| `projectId`  | string (UUID) | O    | 프로젝트 ID |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface WbsAssignmentDetailResponseDto {
  id: string; // 할당 ID
  employeeId: string; // 직원 ID
  wbsItemId: string; // WBS 항목 ID
  projectId: string; // 프로젝트 ID
  periodId: string; // 평가기간 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  deletedAt?: Date; // 삭제일시

  // 조인된 정보
  employee?: {
    id: string;
    name: string;
    employeeNumber: string;
    departmentName?: string;
  };
  wbsItem?: {
    id: string;
    title: string;
    code: string;
    description?: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
  period?: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
  };
}

// 응답
WbsAssignmentDetailResponseDto;
```

**Status Codes:**

- `200`: WBS 할당 상세 정보가 성공적으로 조회됨
- `404`: WBS 할당을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 직원의 WBS 할당 조회

```typescript
GET /admin/evaluation-criteria/wbs-assignments/employee/:employeeId/period/:periodId
```

특정 평가기간에 직원에게 할당된 WBS 항목 목록을 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface EmployeeWbsAssignmentsResponseDto {
  wbsAssignments: Array<{
    assignmentId: string; // 할당 ID
    wbsItemId: string; // WBS 항목 ID
    wbsItemTitle: string; // WBS 항목 제목
    wbsItemCode: string; // WBS 항목 코드
    projectId: string; // 프로젝트 ID
    projectName: string; // 프로젝트명
    assignedDate: Date; // 할당일
    displayOrder: number; // 표시 순서
  }>;
}

// 응답
EmployeeWbsAssignmentsResponseDto;
```

**Status Codes:**

- `200`: 직원의 WBS 할당 목록이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: 직원 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 프로젝트의 WBS 할당 조회

```typescript
GET /admin/evaluation-criteria/wbs-assignments/project/:projectId/period/:periodId
```

특정 평가기간에 프로젝트의 WBS 할당 목록을 조회합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `projectId` | string (UUID) | O    | 프로젝트 ID |
| `periodId`  | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface ProjectWbsAssignmentsResponseDto {
  wbsAssignments: Array<{
    assignmentId: string; // 할당 ID
    wbsItemId: string; // WBS 항목 ID
    wbsItemTitle: string; // WBS 항목 제목
    wbsItemCode: string; // WBS 항목 코드
    employeeId: string; // 직원 ID
    employeeName: string; // 직원명
    employeeNumber: string; // 사번
    assignedDate: Date; // 할당일
    displayOrder: number; // 표시 순서
  }>;
}

// 응답
ProjectWbsAssignmentsResponseDto;
```

**Status Codes:**

- `200`: 프로젝트의 WBS 할당 목록이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: 프로젝트 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 항목의 할당된 직원 조회

```typescript
GET /admin/evaluation-criteria/wbs-assignments/wbs-item/:wbsItemId/period/:periodId
```

특정 평가기간에 WBS 항목에 할당된 직원 목록을 조회합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `wbsItemId` | string (UUID) | O    | WBS 항목 ID |
| `periodId`  | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface WbsItemAssignmentsResponseDto {
  wbsAssignments: Array<{
    assignmentId: string; // 할당 ID
    employeeId: string; // 직원 ID
    employeeName: string; // 직원명
    employeeNumber: string; // 사번
    departmentName?: string; // 부서명
    projectId: string; // 프로젝트 ID
    projectName: string; // 프로젝트명
    assignedDate: Date; // 할당일
    displayOrder: number; // 표시 순서
  }>;
}

// 응답
WbsItemAssignmentsResponseDto;
```

**Status Codes:**

- `200`: WBS 항목의 할당된 직원 목록이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: WBS 항목 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 할당되지 않은 WBS 항목 조회

```typescript
GET /admin/evaluation-criteria/wbs-assignments/unassigned?projectId={uuid}&periodId={uuid}&employeeId={uuid}
```

특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목 목록을 조회합니다.

**Query Parameters:**

| 파라미터     | 타입          | 필수 | 설명                          |
| ------------ | ------------- | ---- | ----------------------------- |
| `projectId`  | string (UUID) | O    | 프로젝트 ID                   |
| `periodId`   | string (UUID) | O    | 평가기간 ID                   |
| `employeeId` | string (UUID) | X    | 직원 ID (특정 직원 기준 조회) |

**Response:**

```typescript
interface UnassignedWbsItemsResponseDto {
  wbsItems: Array<{
    wbsItemId: string; // WBS 항목 ID
    wbsItemTitle: string; // WBS 항목 제목
    wbsItemCode: string; // WBS 항목 코드
    wbsItemDescription?: string; // WBS 항목 설명
  }>;
}

// 응답
UnassignedWbsItemsResponseDto;
```

**Status Codes:**

- `200`: 할당되지 않은 WBS 항목 목록이 성공적으로 조회됨
- `400`: 잘못된 요청
- `404`: 프로젝트 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 대량 할당

```typescript
POST / admin / evaluation - criteria / wbs - assignments / bulk;
```

여러 WBS 항목을 한 번에 할당합니다.

**Request Body:**

```typescript
interface BulkCreateWbsAssignmentDto {
  assignments: Array<{
    employeeId: string; // 직원 ID (UUID)
    wbsItemId: string; // WBS 항목 ID (UUID)
    projectId: string; // 프로젝트 ID (UUID)
    periodId: string; // 평가기간 ID (UUID)
    assignedBy?: string; // 할당자 ID (숨김 필드, 자동 설정)
  }>; // 최소 1개 이상
}
```

**Response:**

```typescript
// 응답
WbsAssignmentResponseDto[] // 생성된 할당 목록
```

**Status Codes:**

- `201`: WBS 대량 할당이 성공적으로 완료됨
- `400`: 잘못된 요청 데이터
- `409`: 일부 할당이 중복됨
- `500`: 서버 내부 오류

---

### WBS 할당 취소

```typescript
DELETE /admin/evaluation-criteria/wbs-assignments/:id
```

특정 WBS 할당을 취소합니다 (소프트 삭제).

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명    |
| -------- | ------------- | ---- | ------- |
| `id`     | string (UUID) | O    | 할당 ID |

**Response:**

```typescript
// 응답 없음 (204 No Content)
void
```

**Status Codes:**

- `204`: WBS 할당이 성공적으로 취소됨
- `404`: 할당을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 평가기간의 WBS 할당 초기화

```typescript
DELETE /admin/evaluation-criteria/wbs-assignments/period/:periodId/reset
```

특정 평가기간의 모든 WBS 할당을 초기화합니다.

**Path Parameters:**

| 파라미터   | 타입          | 필수 | 설명        |
| ---------- | ------------- | ---- | ----------- |
| `periodId` | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ResetWbsAssignmentsDto {
  resetBy?: string; // 초기화 처리자 ID (숨김 필드, 자동 설정)
}
```

**Response:**

```typescript
// 응답 없음 (204 No Content)
void
```

**Status Codes:**

- `204`: 평가기간의 WBS 할당이 성공적으로 초기화됨
- `404`: 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 프로젝트의 WBS 할당 초기화

```typescript
DELETE /admin/evaluation-criteria/wbs-assignments/project/:projectId/period/:periodId/reset
```

특정 평가기간의 특정 프로젝트의 모든 WBS 할당을 초기화합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `projectId` | string (UUID) | O    | 프로젝트 ID |
| `periodId`  | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ResetWbsAssignmentsDto {
  resetBy?: string; // 초기화 처리자 ID
}
```

**Response:**

```typescript
// 응답 없음 (204 No Content)
void
```

**Status Codes:**

- `204`: 프로젝트의 WBS 할당이 성공적으로 초기화됨
- `404`: 프로젝트 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 직원의 WBS 할당 초기화

```typescript
DELETE /admin/evaluation-criteria/wbs-assignments/employee/:employeeId/period/:periodId/reset
```

특정 평가기간의 특정 직원의 모든 WBS 할당을 초기화합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ResetWbsAssignmentsDto {
  resetBy?: string; // 초기화 처리자 ID
}
```

**Response:**

```typescript
// 응답 없음 (204 No Content)
void
```

**Status Codes:**

- `204`: 직원의 WBS 할당이 성공적으로 초기화됨
- `404`: 직원 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### WBS 할당 순서 변경

```typescript
PATCH /admin/evaluation-criteria/wbs-assignments/:id/order?direction={up|down}
```

WBS 할당의 표시 순서를 변경합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명    |
| -------- | ------------- | ---- | ------- |
| `id`     | string (UUID) | O    | 할당 ID |

**Query Parameters:**

| 파라미터    | 타입           | 필수 | 설명                               |
| ----------- | -------------- | ---- | ---------------------------------- |
| `direction` | 'up' \| 'down' | O    | 이동 방향 (up: 위로, down: 아래로) |

**Request Body:**

```typescript
interface ChangeWbsAssignmentOrderBodyDto {
  updatedBy?: string; // 수정자 ID (숨김 필드, 자동 설정)
}
```

**Response:**

```typescript
interface WbsAssignmentResponseDto {
  id: string; // 할당 ID
  employeeId: string; // 직원 ID
  wbsItemId: string; // WBS 항목 ID
  projectId: string; // 프로젝트 ID
  periodId: string; // 평가기간 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 변경된 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
WbsAssignmentResponseDto;
```

**Status Codes:**

- `200`: 할당 순서가 성공적으로 변경됨
- `400`: 잘못된 요청
- `404`: 할당을 찾을 수 없음
- `500`: 서버 내부 오류

---

## 사용 예시

### 1. WBS 할당 생성

```typescript
const response = await fetch(
  'http://localhost:4000/admin/evaluation-criteria/wbs-assignments',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      wbsItemId: '223e4567-e89b-12d3-a456-426614174001',
      projectId: '323e4567-e89b-12d3-a456-426614174002',
      periodId: '423e4567-e89b-12d3-a456-426614174003',
    }),
  },
);
const assignment = await response.json();
```

### 2. 직원의 WBS 할당 조회

```typescript
const employeeId = '123e4567-e89b-12d3-a456-426614174000';
const periodId = '423e4567-e89b-12d3-a456-426614174003';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId}`,
);
const employeeWbs = await response.json();
// employeeWbs.wbsAssignments: 할당된 WBS 목록
```

### 3. WBS 대량 할당

```typescript
const response = await fetch(
  'http://localhost:4000/admin/evaluation-criteria/wbs-assignments/bulk',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignments: [
        {
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          wbsItemId: '223e4567-e89b-12d3-a456-426614174001',
          projectId: '323e4567-e89b-12d3-a456-426614174002',
          periodId: '423e4567-e89b-12d3-a456-426614174003',
        },
        {
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          wbsItemId: '223e4567-e89b-12d3-a456-426614174004',
          projectId: '323e4567-e89b-12d3-a456-426614174002',
          periodId: '423e4567-e89b-12d3-a456-426614174003',
        },
      ],
    }),
  },
);
const assignments = await response.json();
```

### 4. 평가기간의 WBS 할당 초기화

```typescript
const periodId = '423e4567-e89b-12d3-a456-426614174003';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/wbs-assignments/period/${periodId}/reset`,
  {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);
// 204 No Content 응답
```

---

## 참고사항

### WBS 할당 자동 기능

- **평가라인 자동 생성**: WBS 할당 시 1차/2차 평가라인이 자동으로 생성됨
- **평가기준 연동**: WBS 항목의 평가기준과 자동 연결됨

### 초기화 기능

- **평가기간 초기화**: 해당 평가기간의 모든 WBS 할당 삭제
- **프로젝트 초기화**: 특정 프로젝트의 WBS 할당만 삭제
- **직원 초기화**: 특정 직원의 WBS 할당만 삭제
- **트랜잭션 처리**: 초기화 실패 시 롤백 보장

### 순서 관리

- **displayOrder**: 동일 프로젝트/직원 내에서의 WBS 항목 표시 순서
- **자동 정렬**: 새 할당 생성 시 가장 마지막 순서로 자동 배정

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/evaluation-criteria/wbs-assignment-api-reference.md`
