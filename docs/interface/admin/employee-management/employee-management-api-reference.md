# Employee Management API Reference

> 관리자용 직원 관리 API
>
> Base Path: `/admin/employees`
>
> **인증 필수:** 모든 API 요청에 JWT 토큰이 필요합니다.

---

## 목차

- [부서 하이라키 구조 조회](#부서-하이라키-구조-조회)
- [직원 목록 포함 부서 하이라키 조회](#직원-목록-포함-부서-하이라키-조회)
- [전체 직원 목록 조회](#전체-직원-목록-조회)
- [제외된 직원 목록 조회](#제외된-직원-목록-조회)
- [직원 조회 목록에서 제외](#직원-조회-목록에서-제외)
- [직원 조회 목록에 포함](#직원-조회-목록에-포함)

---

## API Endpoints

### 부서 하이라키 구조 조회

```typescript
GET / admin / employees / departments / hierarchy;
```

전체 부서 구조를 하이라키(계층) 형태로 반환합니다.

**Response:**

```typescript
interface DepartmentHierarchyDto {
  id: string; // 부서 UUID
  name: string; // 부서명
  code: string; // 부서 코드
  order: number; // 정렬 순서
  parentDepartmentId: string | null; // 상위 부서의 외부 시스템 ID
  level: number; // 계층 레벨 (루트=0, 하위로 갈수록 1씩 증가)
  depth: number; // 하위 부서의 최대 깊이 (leaf 노드=0)
  childrenCount: number; // 직계 하위 부서 개수
  totalDescendants: number; // 모든 하위 부서(직계 + 손자 이하) 개수
  subDepartments: DepartmentHierarchyDto[]; // 하위 부서 배열 (재귀적 구조)
}

// 응답
DepartmentHierarchyDto[]
```

**Status Codes:**

- `200`: 부서 하이라키 구조 정상 반환
- `500`: 서버 내부 오류

---

### 직원 목록 포함 부서 하이라키 조회

```typescript
GET /admin/employees/departments/hierarchy-with-employees
```

전체 부서 구조를 하이라키 형태로 반환하며, 각 부서별 소속 직원 목록을 포함합니다.

**Response:**

```typescript
interface EmployeeSummaryDto {
  id: string; // 직원 UUID
  employeeNumber: string; // 사번
  name: string; // 이름
  email: string; // 이메일
  rankName: string | null; // 직책명
  rankCode: string | null; // 직책 코드
  rankLevel: number | null; // 직책 레벨
  isActive: boolean; // 재직 여부
}

interface DepartmentHierarchyWithEmployeesDto {
  id: string; // 부서 UUID
  name: string; // 부서명
  code: string; // 부서 코드
  order: number; // 정렬 순서
  parentDepartmentId: string | null; // 상위 부서의 외부 시스템 ID
  level: number; // 계층 레벨
  depth: number; // 하위 부서의 최대 깊이
  childrenCount: number; // 직계 하위 부서 개수
  totalDescendants: number; // 모든 하위 부서 개수
  employeeCount: number; // 부서 소속 직원 수
  employees: EmployeeSummaryDto[]; // 부서 소속 직원 목록
  subDepartments: DepartmentHierarchyWithEmployeesDto[]; // 하위 부서 배열
}

// 응답
DepartmentHierarchyWithEmployeesDto[]
```

**Status Codes:**

- `200`: 직원 목록을 포함한 부서 하이라키 정상 반환
- `500`: 서버 내부 오류

---

### 전체 직원 목록 조회

```typescript
GET /admin/employees?includeExcluded={boolean}&departmentId={uuid}
```

전체 직원 목록을 조회합니다. 기본적으로 조회 대상에서 제외되지 않은 직원만 반환됩니다.

**Query Parameters:**

| 파라미터          | 타입          | 필수 | 설명                            | 기본값  |
| ----------------- | ------------- | ---- | ------------------------------- | ------- |
| `includeExcluded` | boolean       | X    | 제외된 직원 포함 여부           | `false` |
| `departmentId`    | string (UUID) | X    | 부서 ID (특정 부서 직원만 조회) | -       |

**동작 방식:**

- 기본값 (`includeExcluded=false`): `isExcludedFromList=false`인 직원만 반환
- `includeExcluded=true`: 제외 상태와 무관하게 모든 직원 반환
- `departmentId` 쿼리로 부서별 필터링 가능

**Response:**

```typescript
interface EmployeeDto {
  // 기본 정보
  id: string; // 직원 ID (UUID)
  employeeNumber: string; // 직원 번호
  name: string; // 이름
  email: string; // 이메일

  // 조직 정보
  rankName?: string; // 직책명
  rankCode?: string; // 직책 코드
  rankLevel?: number; // 직책 레벨
  departmentName?: string; // 부서명
  departmentCode?: string; // 부서 코드

  // 상태 정보
  isActive: boolean; // 재직 여부
  isExcludedFromList: boolean; // 목록 조회 제외 여부

  // 제외 정보 (제외된 경우에만)
  excludeReason?: string; // 조회 제외 사유
  excludedBy?: string; // 조회 제외 설정자
  excludedAt?: Date; // 조회 제외 설정 일시

  // 타임스탬프
  createdAt: Date; // 생성 일시
  updatedAt: Date; // 수정 일시
}

// 응답
EmployeeDto[]
```

**Status Codes:**

- `200`: 직원 목록 정상 반환
- `400`: 잘못된 요청 파라미터
- `500`: 서버 내부 오류

---

### 제외된 직원 목록 조회

```typescript
GET / admin / employees / excluded;
```

조회에서 제외된 직원 목록을 조회합니다. `isExcludedFromList=true`인 직원들만 반환합니다.

**Response:**

```typescript
interface EmployeeDto {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  rankName?: string;
  rankCode?: string;
  rankLevel?: number;
  departmentName?: string;
  departmentCode?: string;
  isActive: boolean;
  isExcludedFromList: boolean; // 항상 true
  excludeReason?: string; // 제외 사유 (반드시 포함)
  excludedBy?: string; // 제외 설정자 (반드시 포함)
  excludedAt?: Date; // 제외 설정 일시 (반드시 포함)
  createdAt: Date;
  updatedAt: Date;
}

// 응답
EmployeeDto[]
```

**Status Codes:**

- `200`: 제외된 직원 목록 정상 반환 (없으면 빈 배열)
- `500`: 서버 내부 오류

---

### 직원 조회 목록에서 제외

```typescript
PATCH /admin/employees/:id/exclude
```

직원을 일반 조회 목록에서 제외합니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명    |
| -------- | ------------- | ---- | ------- |
| `id`     | string (UUID) | O    | 직원 ID |

**Request Body:**

```typescript
interface ExcludeEmployeeFromListDto {
  excludeReason: string; // 조회 제외 사유 (최대 500자, 필수)
}

// 참고: excludedBy는 JWT 토큰에서 자동으로 추출되어 설정됩니다.
```

**동작 방식:**

- 직원의 `isExcludedFromList`를 `true`로 설정
- `excludeReason`, `excludedBy`, `excludedAt` 정보 저장
- 처리자 정보(`excludedBy`)는 JWT 토큰의 인증된 사용자에서 자동으로 추출
- 이미 제외된 직원 재제외 시 정보 업데이트 (Upsert)

**Response:**

```typescript
interface EmployeeDto {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  rankName?: string;
  rankCode?: string;
  rankLevel?: number;
  departmentName?: string;
  departmentCode?: string;
  isActive: boolean;
  isExcludedFromList: boolean; // true
  excludeReason?: string;
  excludedBy?: string;
  excludedAt?: Date; // 제외 설정 시간
  createdAt: Date;
  updatedAt: Date;
}

// 응답
EmployeeDto;
```

**Status Codes:**

- `200`: 직원이 조회 목록에서 제외됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `404`: 직원을 찾을 수 없음
- `500`: 서버 내부 오류

---

### 직원 조회 목록에 포함

```typescript
PATCH /admin/employees/:id/include
```

제외되었던 직원을 다시 일반 조회 목록에 포함시킵니다.

**Path Parameters:**

| 파라미터 | 타입          | 필수 | 설명    |
| -------- | ------------- | ---- | ------- |
| `id`     | string (UUID) | O    | 직원 ID |

**Request Body:**

```typescript
// 요청 바디 불필요
// 처리자 정보는 JWT 토큰에서 자동으로 추출됩니다.
```

**동작 방식:**

- 직원의 `isExcludedFromList`를 `false`로 설정
- `excludeReason`, `excludedBy`, `excludedAt`을 `null`로 초기화
- 처리자 정보는 JWT 토큰의 인증된 사용자에서 자동으로 추출
- 제외되지 않은 직원에 대해서도 멱등성 보장 (정상 처리)

**Response:**

```typescript
interface EmployeeDto {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  rankName?: string;
  rankCode?: string;
  rankLevel?: number;
  departmentName?: string;
  departmentCode?: string;
  isActive: boolean;
  isExcludedFromList: boolean; // false
  excludeReason?: string | null; // null
  excludedBy?: string | null; // null
  excludedAt?: Date | null; // null
  createdAt: Date;
  updatedAt: Date;
}

// 응답
EmployeeDto;
```

**Status Codes:**

- `200`: 직원이 조회 목록에 포함됨
- `400`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 UUID 형식)
- `404`: 직원을 찾을 수 없음
- `500`: 서버 내부 오류

---

## 주요 데이터 타입

### EmployeeDto

```typescript
interface EmployeeDto {
  // 기본 식별 정보
  id: string; // 고유 식별자 (UUID)
  employeeNumber: string; // 직원 번호
  name: string; // 직원명
  email: string; // 이메일

  // 연락처 및 개인 정보
  phoneNumber?: string; // 전화번호
  dateOfBirth?: Date; // 생년월일
  gender?: 'MALE' | 'FEMALE'; // 성별
  hireDate?: Date; // 입사일

  // 조직 정보
  status: '재직중' | '휴직중' | '퇴사'; // 직원 상태
  departmentId?: string; // 부서 ID (외부 시스템)
  departmentName?: string; // 부서명
  departmentCode?: string; // 부서 코드
  positionId?: string; // 직급 ID (외부 시스템)
  rankId?: string; // 직책 ID (외부 시스템)
  rankName?: string; // 직책명
  rankCode?: string; // 직책 코드
  rankLevel?: number; // 직책 레벨
  managerId?: string; // 매니저 ID (외부 시스템)

  // 제외 관련 정보
  isExcludedFromList: boolean; // 목록 조회 제외 여부
  excludeReason?: string | null; // 조회 제외 사유
  excludedBy?: string | null; // 조회 제외 설정자
  excludedAt?: Date | null; // 조회 제외 설정 일시

  // 외부 시스템 연동 정보
  externalId: string; // 외부 시스템 ID
  externalCreatedAt: Date; // 외부 시스템 생성일
  externalUpdatedAt: Date; // 외부 시스템 수정일
  lastSyncAt?: Date; // 마지막 동기화 시간

  // BaseEntity 필드
  createdAt: Date; // 생성 일시
  updatedAt: Date; // 수정 일시
  deletedAt?: Date; // 삭제 일시 (소프트 삭제)
  createdBy?: string; // 생성자 ID
  updatedBy?: string; // 수정자 ID
  version: number; // 버전 (낙관적 잠금용)

  // 조인된 정보 필드
  positionName?: string; // 직급 이름
  managerName?: string; // 매니저 이름

  // 계산된 필드 (읽기 전용)
  readonly isDeleted: boolean; // 삭제된 상태 여부
  readonly isNew: boolean; // 새로 생성된 항목 여부
  readonly isActive: boolean; // 재직중 여부
  readonly isOnLeave: boolean; // 휴직중 여부
  readonly isResigned: boolean; // 퇴사 여부
  readonly isMale: boolean; // 남성 여부
  readonly isFemale: boolean; // 여성 여부
  readonly yearsOfService: number; // 근속 연수
  readonly needsSync: boolean; // 동기화 필요 여부
}
```

### DepartmentHierarchyDto

```typescript
interface DepartmentHierarchyDto {
  id: string; // 부서 UUID
  name: string; // 부서명
  code: string; // 부서 코드
  order: number; // 정렬 순서
  parentDepartmentId: string | null; // 상위 부서의 외부 시스템 ID
  level: number; // 계층 레벨 (루트=0)
  depth: number; // 하위 부서의 최대 깊이 (leaf=0)
  childrenCount: number; // 직계 하위 부서 개수
  totalDescendants: number; // 모든 하위 부서 개수
  subDepartments: DepartmentHierarchyDto[]; // 하위 부서 배열 (재귀)
}
```

### DepartmentHierarchyWithEmployeesDto

```typescript
interface DepartmentHierarchyWithEmployeesDto {
  id: string; // 부서 UUID
  name: string; // 부서명
  code: string; // 부서 코드
  order: number; // 정렬 순서
  parentDepartmentId: string | null; // 상위 부서 ID
  level: number; // 계층 레벨
  depth: number; // 하위 부서의 최대 깊이
  childrenCount: number; // 직계 하위 부서 개수
  totalDescendants: number; // 모든 하위 부서 개수
  employeeCount: number; // 부서 소속 직원 수
  employees: EmployeeSummaryDto[]; // 부서 소속 직원 목록
  subDepartments: DepartmentHierarchyWithEmployeesDto[]; // 하위 부서 배열
}
```

### EmployeeSummaryDto

```typescript
interface EmployeeSummaryDto {
  id: string; // 직원 UUID
  employeeNumber: string; // 사번
  name: string; // 이름
  email: string; // 이메일
  rankName: string | null; // 직책명
  rankCode: string | null; // 직책 코드
  rankLevel: number | null; // 직책 레벨
  isActive: boolean; // 재직 여부
}
```

---

## 사용 예시

### 1. 전체 직원 목록 조회 (제외되지 않은 직원만)

```typescript
const response = await fetch('http://localhost:4000/admin/employees');
const employees = await response.json();
// 모든 employees[i].isExcludedFromList === false
```

### 2. 제외된 직원 포함하여 전체 조회

```typescript
const response = await fetch(
  'http://localhost:4000/admin/employees?includeExcluded=true',
);
const allEmployees = await response.json();
// 제외된 직원과 일반 직원 모두 포함
```

### 3. 특정 부서의 직원 목록 조회

```typescript
const departmentId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(
  `http://localhost:4000/admin/employees?departmentId=${departmentId}`,
);
const departmentEmployees = await response.json();
```

### 4. 직원을 조회 목록에서 제외

```typescript
const employeeId = '123e4567-e89b-12d3-a456-426614174001';
const response = await fetch(
  `http://localhost:4000/admin/employees/${employeeId}/exclude`,
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_JWT_TOKEN', // JWT 토큰 필수
    },
    body: JSON.stringify({
      excludeReason: '퇴사 예정',
      // excludedBy는 JWT 토큰에서 자동으로 추출됩니다
    }),
  },
);
const excludedEmployee = await response.json();
// excludedEmployee.isExcludedFromList === true
```

### 5. 직원을 조회 목록에 다시 포함

```typescript
const employeeId = '123e4567-e89b-12d3-a456-426614174001';
const response = await fetch(
  `http://localhost:4000/admin/employees/${employeeId}/include`,
  {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN', // JWT 토큰 필수
    },
    // 요청 바디 불필요 (처리자 정보는 JWT에서 자동 추출)
  },
);
const includedEmployee = await response.json();
// includedEmployee.isExcludedFromList === false
// includedEmployee.excludeReason === null
```

### 6. 부서 하이라키 조회

```typescript
const response = await fetch(
  'http://localhost:4000/admin/employees/departments/hierarchy',
);
const hierarchy = await response.json();
// hierarchy는 트리 구조의 부서 배열
```

### 7. 직원 정보를 포함한 부서 하이라키 조회

```typescript
const response = await fetch(
  'http://localhost:4000/admin/employees/departments/hierarchy-with-employees',
);
const hierarchyWithEmployees = await response.json();
// 각 부서의 employees 배열에 소속 직원 목록 포함
```

### 8. 제외된 직원 목록만 조회

```typescript
const response = await fetch('http://localhost:4000/admin/employees/excluded');
const excludedEmployees = await response.json();
// 모든 excludedEmployees[i].isExcludedFromList === true
```

---

## 참고사항

### 직원 조회 필터링 동작

- **기본 동작**: 일반 직원 목록 조회 시 `isExcludedFromList=false`인 직원만 반환
- **제외된 직원 포함**: `includeExcluded=true` 쿼리 파라미터 사용
- **제외된 직원 전용**: `/excluded` 엔드포인트 사용

### 제외 처리 특징

- **Upsert 동작**: 이미 제외된 직원을 재제외하면 제외 정보가 업데이트됩니다.
- **멱등성**: 이미 포함된 직원을 다시 포함해도 에러 없이 정상 동작합니다.
- **정보 초기화**: 포함 처리 시 `excludeReason`, `excludedBy`, `excludedAt`이 모두 `null`로 초기화됩니다.

### 계층 구조 정보

- **level**: 루트 부서는 `0`, 하위로 갈수록 `1`씩 증가
- **depth**: 해당 부서 아래 하위 부서의 최대 깊이 (leaf 노드는 `0`)
- **childrenCount**: 직계 하위 부서 개수
- **totalDescendants**: 모든 하위 부서(직계 + 손자 이하) 개수

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-19  
**문서 경로**: `docs/interface/admin/employee-management/api-reference.md`
