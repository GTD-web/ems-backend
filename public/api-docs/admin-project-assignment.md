# Project Assignment Management API Reference

> 프로젝트 할당 관리 API
>
> Base Path: `/admin/evaluation-criteria/project-assignments`

---

## 목차

- [프로젝트 할당 생성](#프로젝트-할당-생성)
- [프로젝트 할당 목록 조회](#프로젝트-할당-목록-조회)
- [프로젝트 할당 상세 조회](#프로젝트-할당-상세-조회)
- [직원의 프로젝트 할당 조회](#직원의-프로젝트-할당-조회)
- [프로젝트의 할당된 직원 조회](#프로젝트의-할당된-직원-조회)
- [할당되지 않은 직원 목록 조회](#할당되지-않은-직원-목록-조회)
- [프로젝트 대량 할당](#프로젝트-대량-할당)
- [프로젝트 할당 취소](#프로젝트-할당-취소)
- [프로젝트 할당 순서 변경](#프로젝트-할당-순서-변경)

---

## API Endpoints

### 프로젝트 할당 생성

```typescript
POST / admin / evaluation - criteria / project - assignments;
```

평가기간에 직원을 프로젝트에 할당합니다.

**Request Body:**

```typescript
interface CreateProjectAssignmentDto {
  employeeId: string; // 직원 ID (UUID)
  projectId: string; // 프로젝트 ID (UUID)
  periodId: string; // 평가기간 ID (UUID)
}
// 참고: assignedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**Response:**

```typescript
interface ProjectAssignmentResponseDto {
  id: string; // 할당 ID
  employeeId: string; // 직원 ID
  projectId: string; // 프로젝트 ID
  periodId: string; // 평가기간 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
ProjectAssignmentResponseDto;
```

**Status Codes:**

- `201`: 프로젝트 할당이 성공적으로 생성됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `409`: 중복된 할당 (이미 동일한 조합으로 할당됨)
- `500`: 서버 내부 오류

---

### 프로젝트 할당 목록 조회

```typescript
GET /admin/evaluation-criteria/project-assignments?employeeId={uuid}&projectId={uuid}&periodId={uuid}&page={number}&limit={number}
```

다양한 필터 조건으로 프로젝트 할당 목록을 조회합니다.

**Query Parameters:**

| 파라미터         | 타입            | 필수 | 설명           | 기본값 |
| ---------------- | --------------- | ---- | -------------- | ------ |
| `employeeId`     | string (UUID)   | X    | 직원 ID        | -      |
| `projectId`      | string (UUID)   | X    | 프로젝트 ID    | -      |
| `periodId`       | string (UUID)   | X    | 평가기간 ID    | -      |
| `page`           | number          | X    | 페이지 번호    | `1`    |
| `limit`          | number          | X    | 페이지 크기    | `10`   |
| `orderBy`        | string          | X    | 정렬 기준 필드 | -      |
| `orderDirection` | 'ASC' \| 'DESC' | X    | 정렬 방향      | -      |

**Response:**

```typescript
interface ProjectAssignmentListResponseDto {
  data: ProjectAssignmentResponseDto[]; // 할당 목록
  total: number; // 전체 개수
  page: number; // 현재 페이지
  limit: number; // 페이지 크기
  totalPages: number; // 전체 페이지 수
}

// 응답
ProjectAssignmentListResponseDto;
```

**Status Codes:**

- `200`: 프로젝트 할당 목록이 성공적으로 조회됨
- `400`: 잘못된 요청 (잘못된 UUID 형식, 음수 페이징 값 등)
- `500`: 서버 내부 오류

---

### 프로젝트 할당 상세 조회

```typescript
GET /admin/evaluation-criteria/project-assignments/:id
```

특정 프로젝트 할당의 상세 정보를 조회합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명    |
| -------- | ------------- | ---- | ------- |
| `id`     | string (UUID) | O    | 할당 ID |

**Response:**

```typescript
interface ProjectAssignmentDetailResponseDto {
  id: string; // 할당 ID
  employeeId: string; // 직원 ID
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
  project?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  period?: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
  };
}

// 응답
ProjectAssignmentDetailResponseDto;
```

**Status Codes:**

- `200`: 프로젝트 할당 상세 정보가 성공적으로 조회됨
- `404`: 할당을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 직원의 프로젝트 할당 조회

```typescript
GET /admin/evaluation-criteria/project-assignments/employee/:employeeId/period/:periodId
```

특정 평가기간에 직원에게 할당된 프로젝트 목록을 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface EmployeeProjectsResponseDto {
  employeeId: string; // 직원 ID
  periodId: string; // 평가기간 ID
  projects: Array<{
    assignmentId: string; // 할당 ID
    projectId: string; // 프로젝트 ID
    projectName: string; // 프로젝트명
    projectCode: string; // 프로젝트 코드
    assignedDate: Date; // 할당일
    displayOrder: number; // 표시 순서
  }>;
}

// 응답
EmployeeProjectsResponseDto;
```

**Status Codes:**

- `200`: 직원의 프로젝트 할당 목록이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: 직원 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 프로젝트의 할당된 직원 조회

```typescript
GET /admin/evaluation-criteria/project-assignments/project/:projectId/period/:periodId
```

특정 평가기간에 프로젝트에 할당된 직원 목록을 조회합니다.

**Path Parameters:**

| 파라미터    | 타입          | 필수 | 설명        |
| ----------- | ------------- | ---- | ----------- |
| `projectId` | string (UUID) | O    | 프로젝트 ID |
| `periodId`  | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface ProjectEmployeesResponseDto {
  projectId: string; // 프로젝트 ID
  periodId: string; // 평가기간 ID
  employees: Array<{
    assignmentId: string; // 할당 ID
    employeeId: string; // 직원 ID
    employeeName: string; // 직원명
    employeeNumber: string; // 사번
    departmentName?: string; // 부서명
    assignedDate: Date; // 할당일
    displayOrder: number; // 표시 순서
  }>;
}

// 응답
ProjectEmployeesResponseDto;
```

**Status Codes:**

- `200`: 프로젝트의 할당된 직원 목록이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: 프로젝트 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 할당되지 않은 직원 목록 조회

```typescript
GET /admin/evaluation-criteria/project-assignments/unassigned?periodId={uuid}&projectId={uuid}
```

특정 평가기간에 프로젝트가 할당되지 않은 직원 목록을 조회합니다.

**Query Parameters:**

| 파라미터    | 타입          | 필수 | 설명                             |
| ----------- | ------------- | ---- | -------------------------------- |
| `periodId`  | string (UUID) | O    | 평가기간 ID                      |
| `projectId` | string (UUID) | X    | 프로젝트 ID (특정 프로젝트 제외) |

**Response:**

```typescript
interface UnassignedEmployeesResponseDto {
  periodId: string; // 평가기간 ID
  employees: Array<{
    employeeId: string; // 직원 ID
    employeeName: string; // 직원명
    employeeNumber: string; // 사번
    departmentName?: string; // 부서명
    rankName?: string; // 직책명
  }>;
}

// 응답
UnassignedEmployeesResponseDto;
```

**Status Codes:**

- `200`: 할당되지 않은 직원 목록이 성공적으로 조회됨
- `400`: 잘못된 요청 (필수 파라미터 누락, 잘못된 UUID 형식)
- `404`: 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 프로젝트 대량 할당

```typescript
POST / admin / evaluation - criteria / project - assignments / bulk;
```

여러 직원을 프로젝트에 한 번에 할당합니다.

**Request Body:**

```typescript
interface BulkCreateProjectAssignmentDto {
  assignments: Array<{
    employeeId: string; // 직원 ID (UUID)
    projectId: string; // 프로젝트 ID (UUID)
    periodId: string; // 평가기간 ID (UUID)
    assignedBy?: string; // 할당자 ID (숨김 필드, 자동 설정)
  }>; // 최소 1개 이상
}
```

**Response:**

```typescript
// 응답
ProjectAssignmentResponseDto[] // 생성된 할당 목록
```

**Status Codes:**

- `201`: 프로젝트 대량 할당이 성공적으로 완료됨
- `400`: 잘못된 요청 데이터 (빈 배열, 필수 필드 누락, 잘못된 UUID 형식)
- `409`: 일부 할당이 중복됨 (부분 성공 가능)
- `500`: 서버 내부 오류

---

### 프로젝트 할당 취소

```typescript
DELETE /admin/evaluation-criteria/project-assignments/:id
```

특정 프로젝트 할당을 취소합니다 (소프트 삭제).

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

- `204`: 프로젝트 할당이 성공적으로 취소됨
- `404`: 할당을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 프로젝트 할당 순서 변경

```typescript
PATCH /admin/evaluation-criteria/project-assignments/:id/order?direction={up|down}
```

프로젝트 할당의 표시 순서를 변경합니다.

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
interface ChangeProjectAssignmentOrderBodyDto {
  updatedBy?: string; // 수정자 ID (숨김 필드, 자동 설정)
}
```

**Response:**

```typescript
interface ProjectAssignmentResponseDto {
  id: string; // 할당 ID
  employeeId: string; // 직원 ID
  projectId: string; // 프로젝트 ID
  periodId: string; // 평가기간 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 변경된 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

// 응답
ProjectAssignmentResponseDto;
```

**Status Codes:**

- `200`: 할당 순서가 성공적으로 변경됨
- `400`: 잘못된 요청 (잘못된 direction 값)
- `404`: 할당을 찾을 수 없음
- `500`: 서버 내부 오류

---

## 사용 예시

### 1. 프로젝트 할당 생성

```typescript
const response = await fetch(
  'http://localhost:4000/admin/evaluation-criteria/project-assignments',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      projectId: '123e4567-e89b-12d3-a456-426614174001',
      periodId: '123e4567-e89b-12d3-a456-426614174002',
    }),
  },
);
const assignment = await response.json();
```

### 2. 프로젝트 할당 목록 조회 (필터링)

```typescript
const employeeId = '123e4567-e89b-12d3-a456-426614174000';
const periodId = '123e4567-e89b-12d3-a456-426614174002';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/project-assignments?employeeId=${employeeId}&periodId=${periodId}&page=1&limit=10`,
);
const result = await response.json();
// result.data: 할당 목록
// result.total: 전체 개수
```

### 3. 직원의 프로젝트 할당 조회

```typescript
const employeeId = '123e4567-e89b-12d3-a456-426614174000';
const periodId = '123e4567-e89b-12d3-a456-426614174002';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/project-assignments/employee/${employeeId}/period/${periodId}`,
);
const employeeProjects = await response.json();
// employeeProjects.projects: 할당된 프로젝트 목록
```

### 4. 프로젝트 대량 할당

```typescript
const response = await fetch(
  'http://localhost:4000/admin/evaluation-criteria/project-assignments/bulk',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignments: [
        {
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          periodId: '123e4567-e89b-12d3-a456-426614174002',
        },
        {
          employeeId: '223e4567-e89b-12d3-a456-426614174003',
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          periodId: '123e4567-e89b-12d3-a456-426614174002',
        },
      ],
    }),
  },
);
const assignments = await response.json();
```

### 5. 프로젝트 할당 취소

```typescript
const assignmentId = '323e4567-e89b-12d3-a456-426614174004';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/project-assignments/${assignmentId}`,
  {
    method: 'DELETE',
  },
);
// 204 No Content 응답
```

### 6. 프로젝트 할당 순서 변경

```typescript
const assignmentId = '323e4567-e89b-12d3-a456-426614174004';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/project-assignments/${assignmentId}/order?direction=up`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  },
);
const updatedAssignment = await response.json();
// updatedAssignment.displayOrder: 변경된 순서
```

---

## 참고사항

### 할당 순서 관리

- **displayOrder**: 각 할당의 표시 순서를 관리하는 필드
- **자동 할당**: 새 할당 생성 시 가장 마지막 순서로 자동 배정
- **순서 변경**: up/down 방향으로 인접한 항목과 순서 교환

### 대량 할당 특징

- **트랜잭션 처리**: 모든 할당이 성공하거나 모두 실패 (All or Nothing)
- **중복 검사**: 각 할당에 대해 중복 여부 확인
- **성능 최적화**: 배치 처리로 성능 향상

### 필터링 조합

- **단일 필터**: employeeId, projectId, periodId 각각 사용 가능
- **복합 필터**: 여러 필터를 조합하여 정확한 결과 조회
- **페이징**: 대용량 데이터 처리를 위한 페이지네이션 지원

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/evaluation-criteria/project-assignment-api-reference.md`
