# Evaluation Line Management API Reference

> 평가라인 관리 API
>
> Base Path: `/admin/evaluation-criteria/evaluation-lines`
>
> **인증 필수:** 모든 API 요청에 JWT 토큰이 필요합니다.

---

## 목차

- [평가자별 피평가자 조회](#평가자별-피평가자-조회)
- [직원 평가설정 통합 조회](#직원-평가설정-통합-조회)
- [1차 평가자 구성](#1차-평가자-구성)
- [2차 평가자 구성](#2차-평가자-구성)
- [평가기간별 평가자 목록 조회](#평가기간별-평가자-목록-조회)

---

## API Endpoints

### 평가자별 피평가자 조회

```typescript
GET /admin/evaluation-criteria/evaluation-lines/evaluator/:evaluatorId/employees
```

특정 평가자가 평가해야 하는 피평가자 목록을 조회합니다.

**Path Parameters:**

| 파라미터      | 타입          | 필수 | 설명      |
| ------------- | ------------- | ---- | --------- |
| `evaluatorId` | string (UUID) | O    | 평가자 ID |

**Response:**

```typescript
interface EvaluatorEmployeesResponseDto {
  evaluatorId: string; // 평가자 ID
  employees: Array<{
    employeeId: string; // 피평가자 ID
    wbsItemId?: string; // WBS 항목 ID
    evaluationLineId: string; // 평가라인 ID
    createdBy?: string; // 생성자 ID
    updatedBy?: string; // 수정자 ID
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
}

// 응답
EvaluatorEmployeesResponseDto;
```

**Status Codes:**

- `200`: 평가자별 피평가자 목록이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: 평가자를 찾을 수 없음
- `500`: 서버 내부 오류

---

### 직원 평가설정 통합 조회

```typescript
GET /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/period/:periodId/settings
```

특정 직원의 특정 평가기간에 대한 모든 평가설정을 통합 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface ProjectAssignmentInfo {
  id: string; // 할당 ID
  periodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  projectId: string; // 프로젝트 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  deletedAt?: Date; // 삭제일시
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
  version: number; // 버전
  periodName?: string; // 평가기간명
  employeeName?: string; // 직원명
  projectName?: string; // 프로젝트명
  assignedByName?: string; // 할당자명
}

interface WbsAssignmentInfo {
  id: string; // 할당 ID
  periodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  projectId: string; // 프로젝트 ID
  wbsItemId: string; // WBS 항목 ID
  assignedDate: Date; // 할당일
  assignedBy: string; // 할당자 ID
  displayOrder: number; // 표시 순서
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  deletedAt?: Date; // 삭제일시
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
  version: number; // 버전
  periodName?: string; // 평가기간명
  employeeName?: string; // 직원명
  projectName?: string; // 프로젝트명
  wbsItemTitle?: string; // WBS 항목 제목
  wbsItemCode?: string; // WBS 항목 코드
  assignedByName?: string; // 할당자명
}

interface EvaluationLineMappingInfo {
  id: string; // 매핑 ID
  employeeId: string; // 피평가자 ID
  evaluatorId: string; // 평가자 ID
  wbsItemId?: string; // WBS 항목 ID
  evaluationLineId: string; // 평가라인 ID
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}

interface EmployeeEvaluationSettingsResponseDto {
  employeeId: string; // 직원 ID
  periodId: string; // 평가기간 ID
  projectAssignments: ProjectAssignmentInfo[]; // 프로젝트 할당 목록
  wbsAssignments: WbsAssignmentInfo[]; // WBS 할당 목록
  evaluationLineMappings: EvaluationLineMappingInfo[]; // 평가라인 매핑 목록
}

// 응답
EmployeeEvaluationSettingsResponseDto;
```

**Status Codes:**

- `200`: 직원 평가설정이 성공적으로 조회됨
- `400`: 잘못된 UUID 형식
- `404`: 직원 또는 평가기간을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 1차 평가자 구성

```typescript
POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/wbs/:wbsItemId/period/:periodId/primary-evaluator
```

특정 직원의 특정 WBS 항목에 대한 1차 평가자를 구성합니다 (Upsert).

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `wbsItemId`  | string (UUID) | O    | WBS 항목 ID |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ConfigurePrimaryEvaluatorDto {
  evaluatorId: string; // 1차 평가자 ID
}
// 참고: assignedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**동작 방식:**

- WBS 할당 시 자동으로 생성된 평가라인이 있는 경우: 평가자 업데이트
- 평가라인이 없는 경우: 새로운 평가라인 및 매핑 생성
- Upsert 방식으로 동작하여 중복 생성 방지

**Response:**

```typescript
interface ConfigureEvaluatorResponseDto {
  message: string; // 결과 메시지
  createdLines: number; // 생성된 평가라인 수
  createdMappings: number; // 생성된 매핑 수
  mapping: {
    id: string; // 매핑 ID
    employeeId: string; // 피평가자 ID
    evaluatorId: string; // 평가자 ID
    wbsItemId: string; // WBS 항목 ID
    evaluationLineId: string; // 평가라인 ID
  };
}

// 응답
ConfigureEvaluatorResponseDto;
```

**Status Codes:**

- `201`: 1차 평가자 구성이 성공적으로 완료됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `404`: 직원, WBS 항목 또는 평가기간을 찾을 수 없음

---

### 2차 평가자 구성

```typescript
POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/wbs/:wbsItemId/period/:periodId/secondary-evaluator
```

특정 직원의 특정 WBS 항목에 대한 2차 평가자를 구성합니다 (Upsert).

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명        |
| ------------ | ------------- | ---- | ----------- |
| `employeeId` | string (UUID) | O    | 직원 ID     |
| `wbsItemId`  | string (UUID) | O    | WBS 항목 ID |
| `periodId`   | string (UUID) | O    | 평가기간 ID |

**Request Body:**

```typescript
interface ConfigureSecondaryEvaluatorDto {
  evaluatorId: string; // 2차 평가자 ID
}
// 참고: assignedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**동작 방식:**

- WBS 할당 시 자동으로 생성된 평가라인이 있는 경우: 평가자 업데이트
- 평가라인이 없는 경우: 새로운 평가라인 및 매핑 생성
- Upsert 방식으로 동작하여 중복 생성 방지

**Response:**

```typescript
interface ConfigureEvaluatorResponseDto {
  message: string; // 결과 메시지
  createdLines: number; // 생성된 평가라인 수
  createdMappings: number; // 생성된 매핑 수
  mapping: {
    id: string; // 매핑 ID
    employeeId: string; // 피평가자 ID
    evaluatorId: string; // 평가자 ID
    wbsItemId: string; // WBS 항목 ID
    evaluationLineId: string; // 평가라인 ID
  };
}

// 응답
ConfigureEvaluatorResponseDto;
```

**Status Codes:**

- `201`: 2차 평가자 구성이 성공적으로 완료됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `404`: 직원, WBS 항목 또는 평가기간을 찾을 수 없음

---

### 평가기간별 평가자 목록 조회

```typescript
GET /admin/evaluation-criteria/evaluation-lines/period/:periodId/evaluators?type={all|primary|secondary}
```

특정 평가기간에서 평가자로 지정된 직원 목록을 조회합니다.

**Path Parameters:**

- `periodId` (string, UUID): 평가기간 ID

**Query Parameters:**

- `type` (optional, string): 평가자 유형
  - `all` (기본값): 모든 평가자 (1차 + 2차)
  - `primary`: 1차 평가자만
  - `secondary`: 2차 평가자만

**Response:**

```typescript
interface EvaluatorsByPeriodResponseDto {
  periodId: string; // 평가기간 ID
  type: 'all' | 'primary' | 'secondary'; // 조회 유형
  evaluators: Array<{
    evaluatorId: string; // 평가자 ID
    evaluatorName: string; // 평가자 이름
    departmentName: string; // 부서명
    evaluatorType: 'primary' | 'secondary'; // 평가자 유형
    evaluateeCount: number; // 담당 피평가자 수
  }>;
}

// 응답
EvaluatorsByPeriodResponseDto;
```

**Status Codes:**

- `200`: 평가자 목록이 성공적으로 조회됨
- `400`: 잘못된 요청 (잘못된 UUID 형식, 잘못된 type 값)
- `404`: 평가기간을 찾을 수 없음

**특징:**

- 해당 평가기간의 WBS 할당 중 평가자로 지정된 직원 목록 반환
- 각 평가자가 담당하는 피평가자 수 포함
- 직원 기본 정보 포함 (이름, 부서명)
- 동일 직원이 1차/2차 평가자 역할을 모두 하는 경우 각각 별도 항목으로 반환

---

## 사용 예시

### 1. 평가자별 피평가자 조회

```typescript
const evaluatorId = 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c';
const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
);
const data = await response.json();
// data.employees: 평가자가 평가해야 하는 피평가자 목록
```

### 2. 직원 평가설정 통합 조회

```typescript
const employeeId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const periodId = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';
const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${periodId}/settings`,
);
const settings = await response.json();
// settings: 프로젝트 할당, WBS 할당, 평가라인 매핑 정보 포함
```

### 3. 1차 평가자 구성

```typescript
const employeeId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const wbsItemId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const periodId = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/primary-evaluator`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorId: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
  },
);
const result = await response.json();
// result: 평가라인 구성 결과
```

### 4. 2차 평가자 구성

```typescript
const employeeId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const wbsItemId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const periodId = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';

const response = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/secondary-evaluator`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evaluatorId: 'e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b',
    }),
  },
);
const result = await response.json();
// result: 평가라인 구성 결과
```

### 5. 평가기간별 평가자 목록 조회

```typescript
const periodId = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';

// 모든 평가자 조회 (기본값)
const allResponse = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/period/${periodId}/evaluators`,
);
const allData = await allResponse.json();
// allData.evaluators: 1차 + 2차 평가자 모두 포함

// 1차 평가자만 조회
const primaryResponse = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/period/${periodId}/evaluators?type=primary`,
);
const primaryData = await primaryResponse.json();
// primaryData.evaluators: 1차 평가자만 포함

// 2차 평가자만 조회
const secondaryResponse = await fetch(
  `http://localhost:4000/admin/evaluation-criteria/evaluation-lines/period/${periodId}/evaluators?type=secondary`,
);
const secondaryData = await secondaryResponse.json();
// secondaryData.evaluators: 2차 평가자만 포함
```

---

## 참고사항

### 평가라인 구성 특징

- **Upsert 동작**: 이미 존재하는 평가라인이 있으면 업데이트, 없으면 생성
- **자동 생성**: WBS 할당 시 1차/2차 평가라인이 자동으로 생성됨
- **멱등성 보장**: 동일한 요청을 여러 번 보내도 안전하게 처리됨

### 평가설정 통합 조회

- **프로젝트 할당**: 직원이 할당된 프로젝트 목록
- **WBS 할당**: 직원이 할당된 WBS 항목 목록
- **평가라인 매핑**: 직원에 대한 1차/2차 평가자 매핑 정보

### 평가자 구분

- **1차 평가자**: Primary Evaluator (직속 상관 등)
- **2차 평가자**: Secondary Evaluator (간접 평가자)

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/evaluation-criteria/evaluation-line-api-reference.md`
