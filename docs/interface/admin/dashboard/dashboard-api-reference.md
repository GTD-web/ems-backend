# Dashboard API Reference

> 관리자용 대시보드 API
>
> Base Path: `/admin/dashboard`
>
> **인증 필수:** 모든 API 요청에 JWT 토큰이 필요합니다.

---

## 목차

- [직원의 평가기간 현황 조회](#직원의-평가기간-현황-조회)
- [평가기간의 모든 직원 현황 조회](#평가기간의-모든-직원-현황-조회)
- [내가 담당하는 평가 대상자 현황 조회](#내가-담당하는-평가-대상자-현황-조회)
- [사용자 할당 정보 조회](#사용자-할당-정보-조회)
- [나의 할당 정보 조회](#나의-할당-정보-조회)
- [담당자의 피평가자 할당 정보 조회](#담당자의-피평가자-할당-정보-조회)
- [평가기간별 최종평가 목록 조회](#평가기간별-최종평가-목록-조회)
- [직원별 최종평가 목록 조회](#직원별-최종평가-목록-조회)
- [전체 직원별 최종평가 목록 조회](#전체-직원별-최종평가-목록-조회)

---

## API Endpoints

### 직원의 평가기간 현황 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status
```

특정 평가기간에서 특정 직원의 평가 참여 현황을 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Response:**

```typescript
interface EmployeeEvaluationPeriodStatusResponseDto {
  mappingId: string; // 맵핑 ID
  evaluationPeriodId: string; // 평가기간 ID
  employeeId: string; // 직원 ID
  isEvaluationTarget: boolean; // 평가 대상 여부

  evaluationPeriod: {
    id: string; // 평가기간 ID
    name: string; // 평가기간 이름
    status: string; // 상태
    currentPhase: string; // 현재 단계
    startDate: Date; // 시작일
    endDate?: Date; // 종료일
  } | null;

  employee: {
    id: string; // 직원 ID
    name: string; // 직원명
    employeeNumber: string; // 사번
    email: string; // 이메일
    departmentName?: string; // 부서명
    rankName?: string; // 직급명
  } | null;

  exclusionInfo: {
    isExcluded: boolean; // 제외 여부
    excludeReason?: string | null; // 제외 사유
    excludedAt?: Date | null; // 제외 일시
  };

  evaluationCriteria: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    assignedProjectCount: number; // 할당된 프로젝트 수
    assignedWbsCount: number; // 할당된 WBS 수
  };

  wbsCriteria: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    wbsWithCriteriaCount: number; // 평가기준이 있는 WBS 수
  };

  evaluationLine: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    hasPrimaryEvaluator: boolean; // 1차 평가자 존재 여부
    hasSecondaryEvaluator: boolean; // 2차 평가자 존재 여부
  };

  performanceInput: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    totalWbsCount: number; // 전체 WBS 수
    inputCompletedCount: number; // 입력 완료 수
  };

  selfEvaluation: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    totalMappingCount: number; // 전체 맵핑 수
    completedMappingCount: number; // 완료 맵핑 수
    isEditable: boolean; // 수정 가능 여부
    averageScore: number | null; // 평균 점수
  };

  downwardEvaluation: {
    primary: {
      evaluatorId: string | null; // 1차 평가자 ID
      status: 'complete' | 'in_progress' | 'none'; // 상태
      assignedWbsCount: number; // 할당된 WBS 수
      completedEvaluationCount: number; // 완료된 평가 수
      isEditable: boolean; // 수정 가능 여부
      averageScore: number | null; // 평균 점수
    };
    secondary: {
      evaluators: Array<{
        evaluatorId: string; // 2차 평가자 ID
        status: 'complete' | 'in_progress' | 'none'; // 상태
        assignedWbsCount: number; // 할당된 WBS 수
        completedEvaluationCount: number; // 완료된 평가 수
      }>;
      isEditable: boolean; // 수정 가능 여부
      averageScore: number | null; // 평균 점수
    };
  };

  peerEvaluation: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    totalRequestCount: number; // 전체 요청 수
    completedRequestCount: number; // 완료 요청 수
  };

  finalEvaluation: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    evaluationGrade: string | null; // 평가 등급
    jobGrade: string | null; // 직무 등급 (T1, T2, T3)
    jobDetailedGrade: string | null; // 직무 상세 등급
    isConfirmed: boolean; // 확정 여부
    confirmedAt: Date | null; // 확정 일시
  };
}

// 응답
EmployeeEvaluationPeriodStatusResponseDto;
```

**Status Codes:**

- `200`: 현황 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간 또는 직원을 찾을 수 없음

**성능 지표:**

- 평균 응답 시간: ~30ms

---

### 평가기간의 모든 직원 현황 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/employees/status
```

특정 평가기간에 등록된 모든 직원의 평가 참여 현황을 배열로 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
// 응답
EmployeeEvaluationPeriodStatusResponseDto[]; // 위 1번 API와 동일한 구조의 배열
```

**Status Codes:**

- `200`: 현황 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간을 찾을 수 없음

**성능 지표:**

- 100명: 평균 ~709ms
- 200명: 평균 ~1,420ms
- 300명: 평균 ~2,133ms

---

### 내가 담당하는 평가 대상자 현황 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/my-evaluation-targets/status
```

로그인한 평가자가 자신이 담당하는 피평가자들의 평가 현황을 배열로 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**참고:** 평가자 ID는 JWT 토큰에서 자동으로 추출됩니다.

**Response:**

```typescript
interface MyEvaluationTargetStatusResponseDto {
  employeeId: string; // 직원 ID
  isEvaluationTarget: boolean; // 평가 대상 여부

  exclusionInfo: {
    isExcluded: boolean; // 제외 여부
    excludeReason: string | null; // 제외 사유
    excludedAt: Date | null; // 제외 일시
  };

  evaluationCriteria: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    assignedProjectCount: number; // 할당된 프로젝트 수
    assignedWbsCount: number; // 할당된 WBS 수
  };

  wbsCriteria: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    wbsWithCriteriaCount: number; // 평가기준이 있는 WBS 수
  };

  evaluationLine: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    hasPrimaryEvaluator: boolean; // 1차 평가자 존재 여부
    hasSecondaryEvaluator: boolean; // 2차 평가자 존재 여부
  };

  performanceInput: {
    status: 'complete' | 'in_progress' | 'none'; // 상태
    totalWbsCount: number; // 전체 WBS 수
    inputCompletedCount: number; // 입력 완료 수
  };

  myEvaluatorTypes: string[]; // ['PRIMARY'] or ['SECONDARY'] or ['PRIMARY', 'SECONDARY']

  downwardEvaluation: {
    isPrimary: boolean; // 1차 평가자 여부
    isSecondary: boolean; // 2차 평가자 여부
    primaryStatus: {
      assignedWbsCount: number; // 할당된 WBS 수
      completedEvaluationCount: number; // 완료된 평가 수
      isEditable: boolean; // 수정 가능 여부
      averageScore: number | null; // 평균 점수
    } | null;
    secondaryStatus: {
      assignedWbsCount: number; // 할당된 WBS 수
      completedEvaluationCount: number; // 완료된 평가 수
      isEditable: boolean; // 수정 가능 여부
      averageScore: number | null; // 평균 점수
    } | null;
  };
}

// 응답
MyEvaluationTargetStatusResponseDto[];
```

**Status Codes:**

- `200`: 현황 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간 또는 평가자를 찾을 수 없음

**성능 지표:**

- 소규모 (4명): 평균 ~60ms
- 대규모 (100명): 평균 ~1,226ms

---

### 사용자 할당 정보 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data
```

특정 직원의 평가기간 내 할당된 모든 정보를 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `employeeId`         | string (UUID) | O    | 직원 ID     |

**Response:**

```typescript
interface EmployeeAssignedDataResponseDto {
  evaluationPeriod: {
    id: string; // 평가기간 ID
    name: string; // 평가기간 이름
    startDate: Date; // 시작일
    endDate?: Date; // 종료일
    status: string; // 상태
    description?: string; // 설명
    criteriaSettingEnabled: boolean; // 평가기준 설정 가능 여부
    selfEvaluationSettingEnabled: boolean; // 자기평가 설정 가능 여부
    finalEvaluationSettingEnabled: boolean; // 최종평가 설정 가능 여부
    maxSelfEvaluationRate: number; // 최대 자기평가 비율
  };

  employee: {
    id: string; // 직원 ID
    employeeNumber: string; // 사번
    name: string; // 직원명
    email: string; // 이메일
    phoneNumber?: string; // 전화번호
    departmentId: string; // 부서 ID
    departmentName?: string; // 부서명
    status: string; // 상태
  };

  projects: Array<{
    projectId: string; // 프로젝트 ID
    projectName: string; // 프로젝트 이름
    projectCode: string; // 프로젝트 코드
    assignedAt: Date; // 할당 일시
    wbsList: Array<{
      wbsId: string; // WBS ID
      wbsName: string; // WBS 이름
      wbsCode: string; // WBS 코드
      projectId: string; // 프로젝트 ID
      projectName: string; // 프로젝트 이름
      weight: number; // 가중치
      assignedAt: Date; // 할당 일시
      criteria: Array<{
        criterionId: string; // 평가기준 ID
        criteria: string; // 평가기준 내용
        createdAt: Date; // 생성 일시
      }>;
      performance?: {
        performanceResult?: string; // 성과 실적
        isCompleted: boolean; // 완료 여부
        completedAt?: Date; // 완료 일시
      } | null;
      selfEvaluation?: {
        selfEvaluationId?: string; // 자기평가 ID
        evaluationContent?: string; // 평가 내용
        score?: number; // 점수
        isCompleted: boolean; // 완료 여부
        isEditable: boolean; // 수정 가능 여부
        submittedAt?: Date; // 제출 일시
      } | null;
      primaryDownwardEvaluation?: {
        downwardEvaluationId?: string; // 하향평가 ID
        evaluatorId?: string; // 평가자 ID
        evaluatorName?: string; // 평가자 이름
        evaluationContent?: string; // 평가 내용
        score?: number; // 점수
        isCompleted: boolean; // 완료 여부
        isEditable: boolean; // 수정 가능 여부
        submittedAt?: Date; // 제출 일시
      } | null;
      secondaryDownwardEvaluation?: {
        downwardEvaluationId?: string; // 하향평가 ID
        evaluatorId?: string; // 평가자 ID
        evaluatorName?: string; // 평가자 이름
        evaluationContent?: string; // 평가 내용
        score?: number; // 점수
        isCompleted: boolean; // 완료 여부
        isEditable: boolean; // 수정 가능 여부
        submittedAt?: Date; // 제출 일시
      } | null;
    }>;
  }>;

  summary: {
    totalProjects: number; // 전체 프로젝트 수
    totalWbs: number; // 전체 WBS 수
    completedPerformances: number; // 완료된 성과 수
    completedSelfEvaluations: number; // 완료된 자기평가 수
  };
}

// 응답
EmployeeAssignedDataResponseDto;
```

**Status Codes:**

- `200`: 할당 정보 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간 또는 직원을 찾을 수 없음

**성능 지표:**

- 소규모 (WBS ~11개): 평균 ~18ms
- 대용량 (WBS ~119개): 평균 ~252ms

---

### 나의 할당 정보 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/my-assigned-data
```

현재 로그인한 사용자의 평가기간 내 할당된 모든 정보를 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Request Headers:**

| 헤더          | 값                     | 필수 | 설명            |
| ------------- | ---------------------- | ---- | --------------- |
| Authorization | Bearer `<accessToken>` | O    | JWT 액세스 토큰 |

**Response:**

```typescript
// 응답 구조는 "사용자 할당 정보 조회"와 동일
EmployeeAssignedDataResponseDto;
```

**Status Codes:**

- `200`: 할당 정보 조회 성공
- `400`: 잘못된 UUID 형식
- `401`: 인증 실패 (토큰 없음, 잘못된 토큰)
- `404`: 평가기간 또는 사용자를 찾을 수 없음

**비즈니스 로직:**

1. **JWT 토큰 검증 및 사용자 추출**

   ```typescript
   const user = request.user; // JWT Guard에서 주입된 사용자 정보
   const employeeId = user.id; // 현재 로그인한 사용자 ID
   ```

2. **평가기간 존재 여부 확인**

   ```typescript
   const period =
     await evaluationPeriodService.ID로_조회한다(evaluationPeriodId);
   if (!period) {
     throw new NotFoundException('평가기간을 찾을 수 없습니다.');
   }
   ```

3. **사용자 할당 정보 조회**

   ```typescript
   const assignedData = await dashboardService.사용자_할당_정보를_조회한다(
     evaluationPeriodId,
     employeeId, // JWT에서 추출한 사용자 ID
   );
   ```

4. **응답 반환**
   - 평가기간 정보, 직원 정보, 할당된 프로젝트/WBS, 평가기준, 성과, 자기평가, 하향평가 포함
   - 데이터 요약 정보 제공

**주요 차이점:**

| 구분        | 사용자 할당 정보 조회             | 나의 할당 정보 조회       |
| ----------- | --------------------------------- | ------------------------- |
| 엔드포인트  | `.../:employeeId/assigned-data`   | `.../my-assigned-data`    |
| 사용자 지정 | URL 파라미터로 employeeId 전달    | JWT 토큰에서 자동 추출    |
| 사용 목적   | 관리자가 특정 직원 정보 조회      | 사용자가 본인 정보 조회   |
| 권한 필요   | 관리자 권한 (다른 직원 조회 가능) | 일반 사용자 권한 (본인만) |
| URL 보안    | 직원 ID가 URL에 노출됨            | 직원 ID가 토큰에만 존재   |
| 인증 방식   | JWT + employeeId 검증             | JWT 토큰만으로 완전 인증  |

**보안 고려사항:**

- JWT 토큰에서 사용자 ID를 추출하므로 URL 조작 불가능
- 사용자는 본인의 정보만 조회 가능 (다른 사용자 정보 접근 차단)
- 관리자가 특정 직원 정보를 조회하려면 별도의 `GetEmployeeAssignedData` 엔드포인트 사용

**사용 시나리오:**

1. **직원 본인의 평가 현황 확인**
   - 로그인 후 본인에게 할당된 프로젝트/WBS 확인
   - 완료해야 할 자기평가 목록 확인

2. **모바일 앱 또는 개인 대시보드**
   - 사용자 ID를 URL에 노출하지 않고 안전하게 조회
   - 토큰 기반 자동 인증으로 편리한 UX 제공

3. **마이 페이지**
   - 사용자별 맞춤 정보 제공
   - 할당된 업무 및 평가 현황 한눈에 확인

**테스트 케이스:**

- 정상 조회: 유효한 JWT 토큰으로 자신의 할당 정보 조회 성공 (200)
- 응답 필드 포함: evaluationPeriod, employee, projects, summary 필드 반환
- 프로젝트/WBS 할당: 할당된 프로젝트와 WBS 정보 조회 성공
- 평가기준 포함: WBS별 평가기준이 올바르게 반환됨
- 성과 포함: 등록된 성과 정보가 포함됨
- 자기평가 포함: 등록된 자기평가 정보가 포함됨
- 하향평가 포함: 등록된 하향평가 정보가 포함됨
- 요약 정보 정확성: summary 카운트가 실제 데이터와 일치
- 할당 없음: 할당이 없는 경우 빈 배열 반환 (200)
- 토큰 없음: Authorization 헤더 없이 요청 시 401 에러
- 잘못된 토큰: 유효하지 않은 JWT 토큰으로 요청 시 401 에러
- 존재하지 않는 평가기간: 404 에러
- 잘못된 UUID: 잘못된 평가기간 UUID 형식으로 요청 시 400 에러

---

### 담당자의 피평가자 할당 정보 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data
```

평가자가 담당하는 특정 피평가자의 평가기간 내 할당된 모든 정보를 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |
| `evaluatorId`        | string (UUID) | O    | 평가자 ID   |
| `employeeId`         | string (UUID) | O    | 피평가자 ID |

**Response:**

```typescript
interface EvaluatorAssignedEmployeesDataResponseDto {
  evaluationPeriod: {
    id: string; // 평가기간 ID
    name: string; // 평가기간 이름
    startDate: Date; // 시작일
    endDate?: Date; // 종료일
    status: string; // 상태
    // ... 기타 평가기간 정보
  };

  evaluator: {
    id: string; // 평가자 ID
    employeeNumber: string; // 사번
    name: string; // 평가자 이름
    email: string; // 이메일
    departmentName?: string; // 부서명
    status: string; // 상태
  };

  evaluatee: {
    employee: {
      id: string; // 피평가자 ID
      employeeNumber: string; // 사번
      name: string; // 피평가자 이름
      email: string; // 이메일
      departmentName?: string; // 부서명
      status: string; // 상태
    };
    projects: Array<{
      // EmployeeAssignedDataResponseDto의 projects와 동일한 구조
    }>;
    summary: {
      totalProjects: number; // 전체 프로젝트 수
      totalWbs: number; // 전체 WBS 수
      completedPerformances: number; // 완료된 성과 수
      completedSelfEvaluations: number; // 완료된 자기평가 수
    };
  };
}

// 응답
EvaluatorAssignedEmployeesDataResponseDto;
```

**Status Codes:**

- `200`: 할당 정보 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간, 평가자 또는 피평가자를 찾을 수 없거나 평가자가 담당하지 않는 피평가자

**성능 지표:**

- 평균 응답 시간: ~100ms

---

### 평가기간별 최종평가 목록 조회

```typescript
GET /admin/dashboard/:evaluationPeriodId/final-evaluations
```

특정 평가기간에 등록된 모든 직원의 최종평가를 조회합니다.

**Path Parameters:**

| 파라미터             | 타입          | 필수 | 설명        |
| -------------------- | ------------- | ---- | ----------- |
| `evaluationPeriodId` | string (UUID) | O    | 평가기간 ID |

**Response:**

```typescript
interface DashboardFinalEvaluationsByPeriodResponseDto {
  period: {
    id: string; // 평가기간 ID
    name: string; // 평가기간 이름
    startDate: Date; // 시작일
    endDate: Date | null; // 종료일
  };

  evaluations: Array<{
    employee: {
      id: string; // 직원 ID
      name: string; // 직원명
      employeeNumber: string; // 사번
      email: string; // 이메일
      departmentName: string | null; // 부서명
      rankName: string | null; // 직급명
    };
    evaluation: {
      id: string; // 최종평가 ID
      evaluationGrade: string; // 평가 등급
      jobGrade: string; // 직무 등급 (T1, T2, T3)
      jobDetailedGrade: string; // 직무 상세 등급 (a, n, u)
      finalComments: string | null; // 최종 코멘트
      isConfirmed: boolean; // 확정 여부
      confirmedAt: Date | null; // 확정 일시
      confirmedBy: string | null; // 확정자 ID
      createdAt: Date; // 생성일시
      updatedAt: Date; // 수정일시
    };
  }>;
}

// 응답
DashboardFinalEvaluationsByPeriodResponseDto;
```

**Status Codes:**

- `200`: 최종평가 목록 조회 성공
- `400`: 잘못된 UUID 형식
- `404`: 평가기간을 찾을 수 없음

**성능 지표:**

- 대용량 (100명): 평균 ~25ms

---

### 직원별 최종평가 목록 조회

```typescript
GET /admin/dashboard/employees/:employeeId/final-evaluations?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}
```

특정 직원의 모든 평가기간에 대한 최종평가를 조회합니다.

**Path Parameters:**

| 파라미터     | 타입          | 필수 | 설명    |
| ------------ | ------------- | ---- | ------- |
| `employeeId` | string (UUID) | O    | 직원 ID |

**Query Parameters:**

| 파라미터    | 타입          | 필수 | 설명                                           |
| ----------- | ------------- | ---- | ---------------------------------------------- |
| `startDate` | string (Date) | X    | 조회 시작일 (평가기간 시작일 기준, YYYY-MM-DD) |
| `endDate`   | string (Date) | X    | 조회 종료일 (평가기간 시작일 기준, YYYY-MM-DD) |

**Response:**

```typescript
interface EmployeeFinalEvaluationListResponseDto {
  employee: {
    id: string; // 직원 ID
    name: string; // 직원명
    employeeNumber: string; // 사번
    email: string; // 이메일
    departmentName: string | null; // 부서명
    rankName: string | null; // 직급명
  };

  finalEvaluations: Array<{
    id: string; // 최종평가 ID
    period: {
      id: string; // 평가기간 ID
      name: string; // 평가기간 이름
      startDate: Date; // 시작일
      endDate: Date | null; // 종료일
    };
    evaluationGrade: string; // 평가 등급
    jobGrade: string; // 직무 등급 (T1, T2, T3)
    jobDetailedGrade: string; // 직무 상세 등급
    finalComments: string | null; // 최종 코멘트
    isConfirmed: boolean; // 확정 여부
    confirmedAt: Date | null; // 확정 일시
    confirmedBy: string | null; // 확정자 ID
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  }>;
}

// 응답
EmployeeFinalEvaluationListResponseDto;
```

**Status Codes:**

- `200`: 최종평가 목록 조회 성공
- `400`: 잘못된 UUID 형식 또는 날짜 형식
- `404`: 직원을 찾을 수 없음

---

### 전체 직원별 최종평가 목록 조회

```typescript
GET /admin/dashboard/final-evaluations?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}
```

지정한 날짜 범위 내 평가기간의 모든 직원 최종평가를 조회합니다.

**Query Parameters:**

| 파라미터    | 타입          | 필수 | 설명                                           |
| ----------- | ------------- | ---- | ---------------------------------------------- |
| `startDate` | string (Date) | X    | 조회 시작일 (평가기간 시작일 기준, YYYY-MM-DD) |
| `endDate`   | string (Date) | X    | 조회 종료일 (평가기간 시작일 기준, YYYY-MM-DD) |

**Response:**

```typescript
interface AllEmployeesFinalEvaluationsResponseDto {
  evaluationPeriods: Array<{
    id: string; // 평가기간 ID
    name: string; // 평가기간 이름
    startDate: Date; // 시작일
    endDate: Date | null; // 종료일
  }>;

  employees: Array<{
    employee: {
      id: string; // 직원 ID
      name: string; // 직원명
      employeeNumber: string; // 사번
      email: string; // 이메일
      departmentName: string | null; // 부서명
      rankName: string | null; // 직급명
    };
    finalEvaluations: Array<{
      id: string; // 최종평가 ID
      evaluationGrade: string; // 평가 등급
      jobGrade: string; // 직무 등급 (T1, T2, T3)
      jobDetailedGrade: string; // 직무 상세 등급
      finalComments: string | null; // 최종 코멘트
      isConfirmed: boolean; // 확정 여부
      confirmedAt: Date | null; // 확정 일시
      confirmedBy: string | null; // 확정자 ID
      createdAt: Date; // 생성일시
      updatedAt: Date; // 수정일시
    } | null>; // null = 해당 평가기간에 평가 없음
  }>;
}

// 응답
AllEmployeesFinalEvaluationsResponseDto;
```

**Status Codes:**

- `200`: 최종평가 목록 조회 성공
- `400`: 잘못된 날짜 형식

**성능 지표:**

- 초대용량 (100명 x 10개 평가기간): 평균 ~55ms

---

## 사용 예시

### 1. 직원의 평가기간 현황 조회

```typescript
const evaluationPeriodId = 'period-uuid';
const employeeId = 'employee-uuid';

const response = await fetch(
  `http://localhost:4000/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const status = await response.json();
// status.evaluationPeriod: 평가기간 정보
// status.employee: 직원 정보
// status.selfEvaluation: 자기평가 현황
// status.downwardEvaluation: 하향평가 현황
// status.finalEvaluation: 최종평가 현황
```

### 2. 평가기간의 모든 직원 현황 조회

```typescript
const evaluationPeriodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/dashboard/${evaluationPeriodId}/employees/status`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const allStatuses = await response.json();
// allStatuses: 모든 직원의 평가 현황 배열
console.log(`전체 직원 수: ${allStatuses.length}`);
```

### 3. 내가 담당하는 평가 대상자 현황 조회

```typescript
const evaluationPeriodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/status`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN', // JWT 토큰 필수
    },
  },
);

const myTargets = await response.json();
// myTargets: 내가 담당하는 피평가자 목록
// 평가자 ID는 JWT 토큰에서 자동으로 추출됩니다
myTargets.forEach((target) => {
  console.log(`평가자 유형: ${target.myEvaluatorTypes.join(', ')}`);
});
```

### 4. 사용자 할당 정보 조회

```typescript
const evaluationPeriodId = 'period-uuid';
const employeeId = 'employee-uuid';

const response = await fetch(
  `http://localhost:4000/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const assignedData = await response.json();
// assignedData.projects: 할당된 프로젝트 목록
// assignedData.summary: 요약 정보
console.log(`전체 프로젝트: ${assignedData.summary.totalProjects}`);
console.log(`전체 WBS: ${assignedData.summary.totalWbs}`);
```

### 5. 나의 할당 정보 조회

```typescript
const evaluationPeriodId = 'period-uuid';
// JWT 토큰에서 자동으로 사용자 ID 추출 (employeeId 파라미터 불필요)

const response = await fetch(
  `http://localhost:4000/admin/dashboard/${evaluationPeriodId}/my-assigned-data`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const myAssignedData = await response.json();
// myAssignedData.employee: 본인 정보
// myAssignedData.projects: 할당된 프로젝트 목록
// myAssignedData.summary: 요약 정보
console.log(`내 이름: ${myAssignedData.employee.name}`);
console.log(`내 프로젝트 수: ${myAssignedData.summary.totalProjects}`);
console.log(
  `완료한 자기평가: ${myAssignedData.summary.completedSelfEvaluations}`,
);
```

### 6. 평가기간별 최종평가 목록 조회

```typescript
const evaluationPeriodId = 'period-uuid';

const response = await fetch(
  `http://localhost:4000/admin/dashboard/${evaluationPeriodId}/final-evaluations`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const finalEvaluations = await response.json();
// finalEvaluations.period: 평가기간 정보
// finalEvaluations.evaluations: 최종평가 목록
console.log(`최종평가 수: ${finalEvaluations.evaluations.length}`);
```

### 7. 직원별 최종평가 목록 조회 (날짜 필터)

```typescript
const employeeId = 'employee-uuid';

const response = await fetch(
  `http://localhost:4000/admin/dashboard/employees/${employeeId}/final-evaluations?startDate=2024-01-01&endDate=2024-12-31`,
  {
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
    },
  },
);

const result = await response.json();
// result.employee: 직원 정보
// result.finalEvaluations: 최종평가 목록 (최신순)
console.log(`평가 횟수: ${result.finalEvaluations.length}`);
```

---

## 참고사항

### 상태 타입 (Status)

- **complete**: 완료됨
- **in_progress**: 설정 중 또는 진행 중
- **none**: 미존재 또는 미설정

### 직무 등급 (JobGrade)

- **T1**: 일반급
- **T2**: 선임급
- **T3**: 책임급

### 직무 상세 등급 (JobDetailedGrade)

- **a**: 상향
- **n**: 유지
- **u**: 하향

### 평가자 유형 (EvaluatorType)

- **PRIMARY**: 1차 평가자 (직속 상사)
- **SECONDARY**: 2차 평가자 (2차 상사)

### 성능 최적화

대시보드 API는 대용량 데이터 조회를 위해 최적화되어 있습니다:

- 제외된 직원은 자동으로 결과에서 제외
- 직원 사번 오름차순 정렬
- 평가기간 시작일 내림차순 정렬 (최신순)
- 필요한 데이터만 JOIN하여 조회

### 날짜 형식

- **날짜 형식**: `YYYY-MM-DD` (예: `2024-01-01`)
- **날짜 시간 형식**: ISO 8601 (예: `2024-01-01T00:00:00.000Z`)

---

**API 버전**: v1  
**마지막 업데이트**: 2025-10-20  
**문서 경로**: `docs/interface/admin/dashboard/dashboard-api-reference.md`
