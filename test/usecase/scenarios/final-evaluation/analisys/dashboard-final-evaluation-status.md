# 대시보드 최종평가 상태 분석

## 개요

이 문서는 대시보드 컨트롤러(`DashboardController`)에서 최종평가와 관련된 정보를 반환하는 엔드포인트를 분석하고, 최종평가를 진행할 때 대시보드의 어떤 값들을 확인해야 하는지 정리합니다.

---

## 1. 최종평가 관련 대시보드 엔드포인트

### 1.1 평가기간별 최종평가 목록 조회

**엔드포인트**: `GET /admin/dashboard/:evaluationPeriodId/final-evaluations`

**요약**: 특정 평가기간에 등록된 모든 직원의 최종평가를 조회합니다.

**경로 파라미터**:
- `evaluationPeriodId`: 평가기간 ID (UUID)

**응답** (`DashboardFinalEvaluationsByPeriodResponseDto`, 200 OK):
```typescript
{
  period: PeriodInfoDto;                    // 평가기간 정보
  evaluations: EmployeeEvaluationItemDto[];  // 직원별 최종평가 목록
}
```

**평가기간 정보 구조** (`PeriodInfoDto`):
```typescript
{
  id: string;              // 평가기간 ID
  name: string;            // 평가기간명
  startDate: Date;         // 평가기간 시작일
  endDate: Date | null;    // 평가기간 종료일
}
```

**직원별 최종평가 항목 구조** (`EmployeeEvaluationItemDto`):
```typescript
{
  employee: EmployeeInfoDto;    // 직원 정보
  evaluation: EvaluationInfoDto; // 최종평가 정보
}
```

**직원 정보 구조** (`EmployeeInfoDto`):
```typescript
{
  id: string;                    // 직원 ID
  name: string;                   // 직원명
  employeeNumber: string;         // 직원 사번
  email: string;                  // 이메일
  departmentName: string | null;  // 부서명
  rankName: string | null;        // 직책명
}
```

**최종평가 정보 구조** (`EvaluationInfoDto`):
```typescript
{
  id: string;                    // 최종평가 ID
  evaluationGrade: string;       // 평가등급 (S, A, B, C, D 등)
  jobGrade: string;             // 직무등급 (T1, T2, T3)
  jobDetailedGrade: string;      // 직무 상세등급 (u, n, a)
  finalComments: string | null;  // 최종 평가 의견
  isConfirmed: boolean;          // 확정 여부
  confirmedAt: Date | null;      // 확정일시
  confirmedBy: string | null;    // 확정자 ID
  createdAt: Date;              // 생성일시
  updatedAt: Date;              // 수정일시
}
```

**동작**:
- 평가기간 정보를 최상단에 한 번만 제공
- 각 직원별 최종평가 정보를 배열로 제공
- 직원 사번 오름차순으로 정렬
- 제외된 직원(isExcluded=true)은 결과에서 자동 제거
- 삭제된 최종평가는 조회되지 않음
- 평가기간이 존재하지 않으면 404 에러

**테스트 케이스**:
- 첫 번째 평가기간의 최종평가 목록 조회 성공
- 열 번째 평가기간의 최종평가 목록 조회 성공
- 평가기간 정보 검증 (id, name, startDate, endDate)
- 직원 정보 검증 (id, name, employeeNumber, email, departmentName, rankName)
- 최종평가 정보 검증 (id, evaluationGrade, jobGrade, jobDetailedGrade, isConfirmed, createdAt, updatedAt)
- 직원 사번 오름차순 정렬 확인
- 존재하지 않는 평가기간 조회 시 404 에러
- 잘못된 UUID 형식으로 요청 시 400 에러
- 응답 구조 검증 (period와 evaluations 필드 포함)

**성능**:
- 대용량 데이터 (100명): 평균 ~25ms (목표 2,000ms 대비 98.8% 빠름)
- 연속 조회: 평균 14ms로 매우 안정적인 응답 속도 유지
- 병렬 조회: 5건 동시 조회 시 평균 11ms/요청으로 효율적 처리 (56% 성능 향상)
- 메모리 효율성: 30회 반복 조회 후 메모리 감소 (-41MB, 가비지 컬렉션 효과적)
- 데이터 정합성: 100명의 직원 최종평가를 정확히 조회 및 정렬
- 테스트 환경: 직원 100명, 최종평가 100건 (확정 77%, 미확정 23%)

---

### 1.2 직원별 최종평가 목록 조회

**엔드포인트**: `GET /admin/dashboard/employees/:employeeId/final-evaluations`

**요약**: 특정 직원의 모든 평가기간에 대한 최종평가를 조회합니다.

**경로 파라미터**:
- `employeeId`: 직원 ID (UUID)

**쿼리 파라미터**:
- `startDate` (선택): 조회 시작일 (평가기간 시작일 기준, YYYY-MM-DD 형식)
- `endDate` (선택): 조회 종료일 (평가기간 시작일 기준, YYYY-MM-DD 형식)

**응답** (`EmployeeFinalEvaluationListResponseDto`, 200 OK):
```typescript
{
  employee: EmployeeBasicInfoDto;      // 직원 정보
  finalEvaluations: FinalEvaluationItemDto[]; // 최종평가 목록 (평가기간별)
}
```

**직원 정보 구조** (`EmployeeBasicInfoDto`):
```typescript
{
  id: string;                    // 직원 ID
  name: string;                   // 직원명
  employeeNumber: string;         // 직원 사번
  email: string;                  // 이메일
  departmentName: string | null;  // 부서명
  rankName: string | null;        // 직책명
}
```

**최종평가 항목 구조** (`FinalEvaluationItemDto`):
```typescript
{
  id: string;                    // 최종평가 ID
  period: EvaluationPeriodInfoDto; // 평가기간 정보
  evaluationGrade: string;       // 평가등급 (S, A, B, C, D 등)
  jobGrade: string;             // 직무등급 (T1, T2, T3)
  jobDetailedGrade: string;      // 직무 상세등급 (u, n, a)
  finalComments: string | null;  // 최종 평가 의견
  isConfirmed: boolean;          // 확정 여부
  confirmedAt: Date | null;      // 확정일시
  confirmedBy: string | null;    // 확정자 ID
  createdAt: Date;              // 생성일시
  updatedAt: Date;              // 수정일시
}
```

**평가기간 정보 구조** (`EvaluationPeriodInfoDto`):
```typescript
{
  id: string;              // 평가기간 ID
  name: string;            // 평가기간명
  startDate: Date;         // 평가기간 시작일
  endDate: Date | null;    // 평가기간 종료일
}
```

**동작**:
- 직원 정보를 최상단에 한 번만 제공
- 각 평가기간별 최종평가 정보를 배열로 제공 (평가기간 정보 포함)
- 평가기간 시작일 내림차순으로 정렬 (최신순)
- startDate, endDate로 날짜 범위 필터링 가능 (평가기간 시작일 기준)
- 날짜 범위를 지정하지 않으면 모든 평가기간의 최종평가 조회
- 직원이 존재하지 않으면 404 에러

**테스트 케이스**:
- 직원의 모든 평가기간 최종평가 조회 성공
- 여러 직원의 최종평가 조회 (데이터 일관성 확인)
- 최종평가 시간순 정렬 확인 (평가기간 시작일 내림차순)
- startDate 필터: 특정 날짜 이후 평가만 조회
- endDate 필터: 특정 날짜 이전 평가만 조회
- startDate & endDate 필터: 특정 기간 내 평가만 조회
- 미래 날짜 필터: 빈 배열 반환
- 최종평가가 하나도 없는 직원 조회 (빈 배열 반환)
- 여러 평가기간에 걸친 평가 등급 분포 확인
- 평가 확정 상태 확인 (isConfirmed 필드)
- 존재하지 않는 직원 조회 시 404 에러
- 잘못된 UUID 형식으로 요청 시 400 에러
- 잘못된 날짜 형식으로 요청 시 400 에러
- 동시에 여러 직원 조회 성능 테스트 (5명, 2초 이내)

---

### 1.3 전체 직원별 최종평가 목록 조회

**엔드포인트**: `GET /admin/dashboard/final-evaluations`

**요약**: 지정한 날짜 범위 내 평가기간의 모든 직원 최종평가를 조회합니다.

**쿼리 파라미터**:
- `startDate` (선택): 조회 시작일 (평가기간 시작일 기준, YYYY-MM-DD 형식)
- `endDate` (선택): 조회 종료일 (평가기간 시작일 기준, YYYY-MM-DD 형식)

**응답** (`AllEmployeesFinalEvaluationsResponseDto`, 200 OK):
```typescript
{
  evaluationPeriods: PeriodBasicDto[];              // 평가기간 목록 (시작일 내림차순)
  employees: EmployeeWithFinalEvaluationsDto[];      // 직원별 최종평가 목록 (사번 오름차순)
}
```

**평가기간 정보 구조** (`PeriodBasicDto`):
```typescript
{
  id: string;              // 평가기간 ID
  name: string;            // 평가기간명
  startDate: Date;         // 평가기간 시작일
  endDate: Date | null;    // 평가기간 종료일
}
```

**직원별 최종평가 구조** (`EmployeeWithFinalEvaluationsDto`):
```typescript
{
  employee: EmployeeBasicDto;                        // 직원 정보
  finalEvaluations: (FinalEvaluationBasicDto | null)[]; // 최종평가 목록 (평가기간 배열 순서와 매칭)
}
```

**직원 정보 구조** (`EmployeeBasicDto`):
```typescript
{
  id: string;                    // 직원 ID
  name: string;                   // 직원명
  employeeNumber: string;         // 직원 사번
  email: string;                  // 이메일
  departmentName: string | null;  // 부서명
  rankName: string | null;        // 직책명
}
```

**최종평가 정보 구조** (`FinalEvaluationBasicDto`):
```typescript
{
  id: string;                    // 최종평가 ID
  evaluationGrade: string;       // 평가등급 (S, A, B, C, D 등)
  jobGrade: string;             // 직무등급 (T1, T2, T3)
  jobDetailedGrade: string;      // 직무 상세등급 (u, n, a)
  finalComments: string | null;  // 최종 평가 의견
  isConfirmed: boolean;          // 확정 여부
  confirmedAt: Date | null;      // 확정일시
  confirmedBy: string | null;    // 확정자 ID
  createdAt: Date;              // 생성일시
  updatedAt: Date;              // 수정일시
}
```

**동작**:
- 날짜 범위로 필터링된 평가기간 목록을 최상단에 제공 (시작일 내림차순)
- 각 직원별로 평가기간 순서에 맞는 최종평가 배열 제공 (사번 오름차순)
- 평가기간 배열과 최종평가 배열의 인덱스가 일치 (특정 평가기간에 평가 없으면 null)
- 제외된 직원(isExcluded=true)은 결과에서 자동 제거
- 삭제된 최종평가는 조회되지 않음

**참고**: `finalEvaluations` 배열의 인덱스는 `evaluationPeriods` 배열의 인덱스와 일치합니다. 특정 평가기간에 평가가 없으면 해당 위치에 null이 들어갑니다.

**테스트 케이스**:
- 기본 조회: 모든 직원의 모든 평가기간 최종평가 조회 성공
- 기간 필터: startDate만 지정하여 해당 날짜 이후 평가기간 조회
- 기간 필터: endDate만 지정하여 해당 날짜 이전 평가기간 조회
- 기간 필터: startDate와 endDate 모두 지정하여 기간 범위 내 조회
- 평가기간 검증 (id, name, startDate, endDate 필드 포함)
- 직원 검증 (id, name, employeeNumber, email 필드 포함)
- 최종평가 정보 검증 (id, evaluationGrade, jobGrade, isConfirmed 등)
- 평가기간 시작일 내림차순 정렬 확인 (최신순)
- 직원 사번 오름차순 정렬 확인
- 배열 길이 일치 확인 (finalEvaluations 배열 길이 = evaluationPeriods 배열 길이)
- null 처리 확인 (평가가 없는 평가기간은 null)
- 전체 조회와 평가기간별 조회 결과 일관성 확인
- 직원별 조회와 전체 조회 결과 일관성 확인
- 잘못된 날짜 형식으로 요청 시 400 에러
- 응답 구조 검증 (evaluationPeriods와 employees 필드 포함)

**성능**:
- 초대용량 데이터 (100명 x 10개 평가기간): 평균 ~55ms (목표 5,000ms 대비 98.9% 빠름)
- 연속 조회: 평균 48ms로 매우 안정적인 응답 속도 유지 (변동폭 8.3%)
- 병렬 조회: 5건 동시 조회 시 평균 29ms/요청으로 효율적 처리 (40% 성능 향상)
- 날짜 필터링: 31ms로 매우 빠른 응답 (1개 평가기간, 85명 조회)
- 메모리 효율성: 30회 반복 조회 후 66MB 증가로 안정적 (초대용량 데이터)
- 데이터 정합성: 100명 x 10개 평가기간 = 1,000건의 복잡한 매트릭스 정확히 조회
- 확장성: 평가기간 3개→10개 (3.3배) 증가 시 응답 시간 27ms→55ms (2배) 로 선형 이하 확장
- 테스트 환경: 직원 100명, 평가기간 10개 (2015-2024년), 매핑 1,000건, 최종평가 800건 (확정 71%, 미확정 29%, null 20%)

---

### 1.4 직원의 평가기간 현황 조회

**엔드포인트**: `GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status`

**요약**: 직원의 평가기간 현황을 조회합니다.

**경로 파라미터**:
- `evaluationPeriodId`: 평가기간 ID (UUID)
- `employeeId`: 직원 ID (UUID)

**응답** (`EmployeeEvaluationPeriodStatusResponseDto`, 200 OK):
```typescript
{
  // ... 기타 필드
  finalEvaluation: FinalEvaluationInfoDto;  // ⭐ 최종평가 정보
}
```

**최종평가 정보 구조** (`FinalEvaluationInfoDto`):
```typescript
{
  status: 'complete' | 'in_progress' | 'none';  // 최종평가 진행 상태
  evaluationGrade: string | null;              // 평가등급 (S, A, B, C, D 등)
  jobGrade: string | null;                     // 직무등급 (T1, T2, T3)
  jobDetailedGrade: string | null;            // 직무 상세등급 (u, n, a)
  isConfirmed: boolean;                        // 확정 여부
  confirmedAt: Date | null;                    // 확정일시
}
```

---

### 1.5 직원의 평가 현황 및 할당 데이터 통합 조회

**엔드포인트**: `GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/complete-status`

**요약**: 직원의 평가 진행 현황과 실제 할당 데이터를 한 번에 조회합니다.

**경로 파라미터**:
- `evaluationPeriodId`: 평가기간 ID (UUID)
- `employeeId`: 직원 ID (UUID)

**응답** (`EmployeeCompleteStatusResponseDto`, 200 OK):
```typescript
{
  evaluationPeriod: EvaluationPeriodInfoDto;
  employee: EmployeeInfoDto;
  isEvaluationTarget: boolean;
  exclusionInfo: ExclusionInfoDto;
  evaluationLine: EvaluationLineWithEvaluatorsDto;
  wbsCriteria: WbsCriteriaStatusDto;
  performance: PerformanceStatusDto;
  selfEvaluation: SelfEvaluationStatusDto;
  primaryDownwardEvaluation: DownwardEvaluationStatusDto;
  secondaryDownwardEvaluation: DownwardEvaluationStatusDto;
  peerEvaluation: PeerEvaluationInfoDto;
  finalEvaluation: FinalEvaluationInfoDto;  // ⭐ 최종평가 정보
  projects: ProjectsWithCountDto;
}
```

**최종평가 정보 구조** (`FinalEvaluationInfoDto`):
```typescript
{
  status: 'complete' | 'in_progress' | 'none';  // 최종평가 진행 상태
  evaluationGrade: string | null;              // 평가등급 (S, A, B, C, D 등)
  jobGrade: string | null;                     // 직무등급 (T1, T2, T3)
  jobDetailedGrade: string | null;            // 직무 상세등급 (u, n, a)
  isConfirmed: boolean;                        // 확정 여부
  confirmedAt: Date | null;                    // 확정일시
}
```

---

## 2. 최종평가 상태 값 분석

### 2.1 최종평가 상태 (`status`)

최종평가 진행 상태는 다음 세 가지 값 중 하나입니다:

| 상태 | 값 | 의미 | 조건 |
|------|-----|------|------|
| **미작성** | `none` | 최종평가가 작성되지 않음 | 최종평가 레코드가 없음 |
| **작성중** | `in_progress` | 최종평가가 작성되었으나 확정되지 않음 | 최종평가 레코드가 있고 `isConfirmed === false` |
| **완료** | `complete` | 최종평가가 작성되고 확정됨 | 최종평가 레코드가 있고 `isConfirmed === true` |

**상태 계산 로직**:
```typescript
// 최종평가 상태 계산
function 최종평가_상태를_계산한다(
  finalEvaluation: FinalEvaluation | null,
): FinalEvaluationStatus {
  // 최종평가가 없으면 미작성
  if (!finalEvaluation) {
    return 'none';
  }
  
  // 확정되었으면 완료
  if (finalEvaluation.isConfirmed) {
    return 'complete';
  }
  
  // 작성되었으나 확정되지 않았으면 작성중
  return 'in_progress';
}
```

---

### 2.2 최종평가 등급 정보

최종평가에는 다음 등급 정보가 포함됩니다:

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `evaluationGrade` | `string \| null` | 평가등급 | "S", "A", "B", "C", "D" |
| `jobGrade` | `string \| null` | 직무등급 | "T1", "T2", "T3", "T4", "T5" |
| `jobDetailedGrade` | `string \| null` | 직무 상세등급 | "u" (낮음), "n" (중간), "a" (높음) |

**참고**: 최종평가가 작성되지 않았거나 일부 필드가 입력되지 않은 경우 `null`이 반환됩니다.

---

### 2.3 최종평가 확정 정보

최종평가 확정 정보는 다음 필드로 제공됩니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `isConfirmed` | `boolean` | 확정 여부 |
| `confirmedAt` | `Date \| null` | 확정일시 |
| `confirmedBy` | `string \| null` | 확정자 ID (일부 엔드포인트에서만 제공) |

**확정 상태**:
- `isConfirmed === false`: 미확정 (수정 가능)
- `isConfirmed === true`: 확정됨 (수정 불가)

---

## 3. 최종평가 진행 시 확인해야 할 대시보드 값

### 3.1 최종평가 작성 전 확인 사항

**참고**: 현재 구현에서는 최종평가 작성 시 다른 평가 항목(자기평가, 하향평가, 동료평가) 완료 여부를 검증하지 않습니다. 따라서 다른 평가 항목이 완료되지 않아도 최종평가를 작성할 수 있습니다.

최종평가를 작성하기 전에 다음 값들을 확인할 수 있습니다 (선택사항):

1. **다른 평가 항목 완료 여부 (참고용)**
   - `selfEvaluation.status === 'complete'`: 자기평가 완료 여부
   - `primaryDownwardEvaluation.status === 'complete'`: 1차 하향평가 완료 여부
   - `secondaryDownwardEvaluation.status === 'complete'`: 2차 하향평가 완료 여부
   - `peerEvaluation.status === 'complete'`: 동료평가 완료 여부

2. **최종평가 현재 상태**
   - `finalEvaluation.status`: 현재 최종평가 상태 확인
   - `finalEvaluation.isConfirmed`: 확정 여부 확인

3. **평가기간 상태**
   - `evaluationPeriod.status`: 평가기간이 진행 중인지 확인

**확인 방법** (참고용 - 실제 검증은 하지 않음):
```typescript
// GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/complete-status
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 다른 평가 항목 완료 여부 확인 (참고용)
const allEvaluationsCompleted = 
  status.selfEvaluation.status === 'complete' &&
  status.primaryDownwardEvaluation.status === 'complete' &&
  status.secondaryDownwardEvaluation.status === 'complete' &&
  status.peerEvaluation.status === 'complete';

// 최종평가 작성 가능 여부 확인 (확정되지 않은 경우만 수정 가능)
const isWritable = 
  status.finalEvaluation.status === 'none' || 
  (status.finalEvaluation.status === 'in_progress' && !status.finalEvaluation.isConfirmed);
```

---

### 3.2 최종평가 작성 중 확인 사항

최종평가를 작성하는 동안 다음 값들을 확인해야 합니다:

1. **최종평가 상태 변경**
   - `finalEvaluation.status`: `none` → `in_progress` 변경 확인

2. **등급 정보 입력**
   - `finalEvaluation.evaluationGrade`: 평가등급 입력 확인
   - `finalEvaluation.jobGrade`: 직무등급 입력 확인
   - `finalEvaluation.jobDetailedGrade`: 직무 상세등급 입력 확인

3. **확정 전 상태**
   - `finalEvaluation.isConfirmed`: `false` 유지 확인
   - `finalEvaluation.confirmedAt`: `null` 유지 확인

**확인 방법**:
```typescript
// 최종평가 저장 후 상태 확인
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 상태 변경 확인
expect(status.finalEvaluation.status).toBe('in_progress');
expect(status.finalEvaluation.isConfirmed).toBe(false);
expect(status.finalEvaluation.evaluationGrade).toBeDefined();
expect(status.finalEvaluation.jobGrade).toBeDefined();
expect(status.finalEvaluation.jobDetailedGrade).toBeDefined();
```

---

### 3.3 최종평가 확정 후 확인 사항

최종평가를 확정한 후 다음 값들을 확인해야 합니다:

1. **최종평가 상태 변경**
   - `finalEvaluation.status`: `in_progress` → `complete` 변경 확인

2. **확정 정보**
   - `finalEvaluation.isConfirmed`: `true` 변경 확인
   - `finalEvaluation.confirmedAt`: 확정일시 설정 확인

3. **등급 정보 유지**
   - `finalEvaluation.evaluationGrade`: 평가등급 유지 확인
   - `finalEvaluation.jobGrade`: 직무등급 유지 확인
   - `finalEvaluation.jobDetailedGrade`: 직무 상세등급 유지 확인

**확인 방법**:
```typescript
// 최종평가 확정 후 상태 확인
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 상태 변경 확인
expect(status.finalEvaluation.status).toBe('complete');
expect(status.finalEvaluation.isConfirmed).toBe(true);
expect(status.finalEvaluation.confirmedAt).toBeDefined();
expect(status.finalEvaluation.evaluationGrade).toBeDefined();
expect(status.finalEvaluation.jobGrade).toBeDefined();
expect(status.finalEvaluation.jobDetailedGrade).toBeDefined();
```

---

### 3.4 최종평가 확정 취소 후 확인 사항

최종평가 확정을 취소한 후 다음 값들을 확인해야 합니다:

1. **최종평가 상태 변경**
   - `finalEvaluation.status`: `complete` → `in_progress` 변경 확인

2. **확정 정보 초기화**
   - `finalEvaluation.isConfirmed`: `false` 변경 확인
   - `finalEvaluation.confirmedAt`: `null` 변경 확인

3. **등급 정보 유지**
   - `finalEvaluation.evaluationGrade`: 평가등급 유지 확인
   - `finalEvaluation.jobGrade`: 직무등급 유지 확인
   - `finalEvaluation.jobDetailedGrade`: 직무 상세등급 유지 확인

**확인 방법**:
```typescript
// 최종평가 확정 취소 후 상태 확인
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 상태 변경 확인
expect(status.finalEvaluation.status).toBe('in_progress');
expect(status.finalEvaluation.isConfirmed).toBe(false);
expect(status.finalEvaluation.confirmedAt).toBeNull();
expect(status.finalEvaluation.evaluationGrade).toBeDefined();
expect(status.finalEvaluation.jobGrade).toBeDefined();
expect(status.finalEvaluation.jobDetailedGrade).toBeDefined();
```

---

## 4. 최종평가 상태별 워크플로우

### 4.1 `none` (미작성)

**상태**: 최종평가가 작성되지 않음

**조건**:
- 최종평가 레코드가 없음

**다음 단계**:
- 다른 평가 항목(자기평가, 하향평가, 동료평가)이 모두 완료되면 최종평가 작성 가능
- 최종평가 작성 → `in_progress` 상태로 전환

**확인 방법**:
```typescript
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);
expect(status.finalEvaluation.status).toBe('none');
expect(status.finalEvaluation.evaluationGrade).toBeNull();
expect(status.finalEvaluation.isConfirmed).toBe(false);
```

---

### 4.2 `in_progress` (작성중)

**상태**: 최종평가가 작성되었으나 확정되지 않음

**조건**:
- 최종평가 레코드가 있고 `isConfirmed === false`

**다음 단계**:
- 최종평가 수정 가능
- 최종평가 확정 → `complete` 상태로 전환
- 최종평가 삭제 → `none` 상태로 전환 (일부 구현에서)

**확인 방법**:
```typescript
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);
expect(status.finalEvaluation.status).toBe('in_progress');
expect(status.finalEvaluation.evaluationGrade).toBeDefined();
expect(status.finalEvaluation.isConfirmed).toBe(false);
expect(status.finalEvaluation.confirmedAt).toBeNull();
```

---

### 4.3 `complete` (완료)

**상태**: 최종평가가 작성되고 확정됨

**조건**:
- 최종평가 레코드가 있고 `isConfirmed === true`

**다음 단계**:
- 최종평가 수정 불가 (확정된 평가는 수정 불가)
- 최종평가 확정 취소 → `in_progress` 상태로 전환

**확인 방법**:
```typescript
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);
expect(status.finalEvaluation.status).toBe('complete');
expect(status.finalEvaluation.evaluationGrade).toBeDefined();
expect(status.finalEvaluation.isConfirmed).toBe(true);
expect(status.finalEvaluation.confirmedAt).toBeDefined();
```

---

## 5. 최종평가 상태 확인 체크리스트

### 5.1 최종평가 작성 전 체크리스트

**참고**: 현재 구현에서는 다른 평가 항목 완료 여부를 검증하지 않습니다.

- [ ] 최종평가 현재 상태 확인 (`finalEvaluation.status`)
- [ ] 확정 여부 확인 (`finalEvaluation.isConfirmed === false`인 경우만 수정 가능)
- [ ] 평가기간 진행 중 여부 확인 (`evaluationPeriod.status === 'in_progress'`)

**선택사항 (참고용)**:
- [ ] 자기평가 완료 여부 확인 (`selfEvaluation.status === 'complete'`) - 검증하지 않음
- [ ] 1차 하향평가 완료 여부 확인 (`primaryDownwardEvaluation.status === 'complete'`) - 검증하지 않음
- [ ] 2차 하향평가 완료 여부 확인 (`secondaryDownwardEvaluation.status === 'complete'`) - 검증하지 않음
- [ ] 동료평가 완료 여부 확인 (`peerEvaluation.status === 'complete'`) - 검증하지 않음

---

### 5.2 최종평가 작성 중 체크리스트

- [ ] 최종평가 상태 변경 확인 (`finalEvaluation.status === 'in_progress'`)
- [ ] 평가등급 입력 확인 (`finalEvaluation.evaluationGrade`)
- [ ] 직무등급 입력 확인 (`finalEvaluation.jobGrade`)
- [ ] 직무 상세등급 입력 확인 (`finalEvaluation.jobDetailedGrade`)
- [ ] 확정 전 상태 확인 (`finalEvaluation.isConfirmed === false`)

---

### 5.3 최종평가 확정 후 체크리스트

- [ ] 최종평가 상태 변경 확인 (`finalEvaluation.status === 'complete'`)
- [ ] 확정 여부 확인 (`finalEvaluation.isConfirmed === true`)
- [ ] 확정일시 확인 (`finalEvaluation.confirmedAt`)
- [ ] 등급 정보 유지 확인 (`evaluationGrade`, `jobGrade`, `jobDetailedGrade`)

---

### 5.4 최종평가 확정 취소 후 체크리스트

- [ ] 최종평가 상태 변경 확인 (`finalEvaluation.status === 'in_progress'`)
- [ ] 확정 여부 초기화 확인 (`finalEvaluation.isConfirmed === false`)
- [ ] 확정일시 초기화 확인 (`finalEvaluation.confirmedAt === null`)
- [ ] 등급 정보 유지 확인 (`evaluationGrade`, `jobGrade`, `jobDetailedGrade`)

---

## 6. 최종평가와 다른 평가 항목의 관계

### 6.1 평가 진행 순서 (권장 워크플로우)

**참고**: 현재 구현에서는 최종평가 작성 시 다른 평가 항목 완료 여부를 검증하지 않습니다. 하지만 일반적인 평가 프로세스에서는 다음 순서로 진행하는 것을 권장합니다:

```
1. 자기평가 (selfEvaluation)
   ↓
2. 1차 하향평가 (primaryDownwardEvaluation)
   ↓
3. 2차 하향평가 (secondaryDownwardEvaluation)
   ↓
4. 동료평가 (peerEvaluation)
   ↓
5. 최종평가 (finalEvaluation) ← 권장: 모든 평가 항목 완료 후 작성
```

### 6.2 의존성 관계 (현재 구현 상태)

**현재 구현**: 최종평가 작성 시 다른 평가 항목 완료 여부를 검증하지 않습니다.

```typescript
// 현재 구현에서는 다음 검증이 없음
// const canWriteFinalEvaluation = 
//   status.selfEvaluation.status === 'complete' &&
//   status.primaryDownwardEvaluation.status === 'complete' &&
//   status.secondaryDownwardEvaluation.status === 'complete' &&
//   status.peerEvaluation.status === 'complete';

// 실제로는 다음 조건만 확인됨:
// - 확정되지 않은 최종평가는 수정 가능
// - 확정된 최종평가는 수정 불가
```

### 6.3 최종평가 작성 조건 (현재 구현)

**현재 구현 상태**: 최종평가를 작성하려면 다음 조건만 만족하면 됩니다:

1. **확정되지 않은 상태**: `finalEvaluation.status === 'none'` 또는 `(finalEvaluation.status === 'in_progress' && finalEvaluation.isConfirmed === false)`
2. **필수 필드 입력**: `evaluationGrade`, `jobGrade`, `jobDetailedGrade` 필수

**참고**: 다른 평가 항목(자기평가, 하향평가, 동료평가) 완료 여부는 검증하지 않습니다.

---

## 7. 대시보드 값 확인 예시

### 7.1 최종평가 작성 전 확인

**참고**: 현재 구현에서는 다른 평가 항목 완료 여부를 검증하지 않습니다.

```typescript
// GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/complete-status
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 다른 평가 항목 완료 여부 확인 (참고용 - 실제 검증은 하지 않음)
console.log('자기평가 상태:', status.selfEvaluation.status);
console.log('1차 하향평가 상태:', status.primaryDownwardEvaluation.status);
console.log('2차 하향평가 상태:', status.secondaryDownwardEvaluation.status);
console.log('동료평가 상태:', status.peerEvaluation.status);

// 최종평가 작성 가능 여부 확인 (확정되지 않은 경우만 수정 가능)
const canWrite = 
  status.finalEvaluation.status === 'none' || 
  (status.finalEvaluation.status === 'in_progress' && !status.finalEvaluation.isConfirmed);

if (canWrite) {
  console.log('최종평가 작성/수정 가능');
} else {
  console.log('최종평가 작성/수정 불가 - 이미 확정됨');
}
```

---

### 7.2 최종평가 작성 중 확인

```typescript
// 최종평가 저장 후 상태 확인
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 상태 변경 확인
expect(status.finalEvaluation.status).toBe('in_progress');
expect(status.finalEvaluation.isConfirmed).toBe(false);
expect(status.finalEvaluation.evaluationGrade).toBe('A');
expect(status.finalEvaluation.jobGrade).toBe('T2');
expect(status.finalEvaluation.jobDetailedGrade).toBe('N');
```

---

### 7.3 최종평가 확정 후 확인

```typescript
// 최종평가 확정 후 상태 확인
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 상태 변경 확인
expect(status.finalEvaluation.status).toBe('complete');
expect(status.finalEvaluation.isConfirmed).toBe(true);
expect(status.finalEvaluation.confirmedAt).toBeDefined();
expect(status.finalEvaluation.evaluationGrade).toBe('A');
expect(status.finalEvaluation.jobGrade).toBe('T2');
expect(status.finalEvaluation.jobDetailedGrade).toBe('N');
```

---

### 7.4 최종평가 확정 취소 후 확인

```typescript
// 최종평가 확정 취소 후 상태 확인
const status = await getEmployeeCompleteStatus(evaluationPeriodId, employeeId);

// 상태 변경 확인
expect(status.finalEvaluation.status).toBe('in_progress');
expect(status.finalEvaluation.isConfirmed).toBe(false);
expect(status.finalEvaluation.confirmedAt).toBeNull();
expect(status.finalEvaluation.evaluationGrade).toBe('A');
expect(status.finalEvaluation.jobGrade).toBe('T2');
expect(status.finalEvaluation.jobDetailedGrade).toBe('N');
```

---

## 8. 최종평가 목록 조회 활용

### 8.1 평가기간별 최종평가 목록 조회

**사용 사례**: 특정 평가기간의 모든 직원 최종평가를 한 번에 조회

```typescript
// GET /admin/dashboard/:evaluationPeriodId/final-evaluations
const result = await getFinalEvaluationsByPeriod(evaluationPeriodId);

// 평가기간 정보
console.log('평가기간:', result.period.name);
console.log('시작일:', result.period.startDate);
console.log('종료일:', result.period.endDate);

// 직원별 최종평가 목록
result.evaluations.forEach((item) => {
  console.log('직원:', item.employee.name);
  console.log('평가등급:', item.evaluation.evaluationGrade);
  console.log('직무등급:', item.evaluation.jobGrade);
  console.log('확정 여부:', item.evaluation.isConfirmed);
});
```

---

### 8.2 직원별 최종평가 목록 조회

**사용 사례**: 특정 직원의 모든 평가기간 최종평가를 조회

```typescript
// GET /admin/dashboard/employees/:employeeId/final-evaluations
const result = await getFinalEvaluationsByEmployee(employeeId);

// 직원 정보
console.log('직원:', result.employee.name);
console.log('사번:', result.employee.employeeNumber);

// 평가기간별 최종평가 목록
result.finalEvaluations.forEach((evaluation) => {
  console.log('평가기간:', evaluation.period.name);
  console.log('평가등급:', evaluation.evaluationGrade);
  console.log('직무등급:', evaluation.jobGrade);
  console.log('확정 여부:', evaluation.isConfirmed);
});
```

---

### 8.3 전체 직원별 최종평가 목록 조회

**사용 사례**: 여러 평가기간에 걸친 모든 직원 최종평가를 매트릭스 형태로 조회

```typescript
// GET /admin/dashboard/final-evaluations?startDate=2024-01-01&endDate=2024-12-31
const result = await getAllEmployeesFinalEvaluations({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

// 평가기간 목록
console.log('평가기간 수:', result.evaluationPeriods.length);
result.evaluationPeriods.forEach((period, index) => {
  console.log(`평가기간 ${index}:`, period.name);
});

// 직원별 최종평가 목록
result.employees.forEach((employee) => {
  console.log('직원:', employee.employee.name);
  
  // 평가기간 순서에 맞는 최종평가 배열
  employee.finalEvaluations.forEach((evaluation, index) => {
    const period = result.evaluationPeriods[index];
    if (evaluation) {
      console.log(`  ${period.name}:`, evaluation.evaluationGrade);
    } else {
      console.log(`  ${period.name}: 평가 없음`);
    }
  });
});
```

---

## 9. 주요 특징

### 9.1 최종평가 상태 관리
- 최종평가 상태는 `none`, `in_progress`, `complete` 세 가지 상태로 관리
- 확정 여부(`isConfirmed`)로 수정 가능 여부 결정
- 확정된 평가는 수정 불가, 확정 취소 후 다시 수정 가능

### 9.2 등급 정보 관리
- 평가등급, 직무등급, 직무 상세등급 정보 제공
- 최종평가가 작성되지 않았거나 일부 필드가 입력되지 않은 경우 `null` 반환

### 9.3 확정 정보 추적
- 확정 여부(`isConfirmed`)와 확정일시(`confirmedAt`) 추적
- 확정자 ID(`confirmedBy`)는 일부 엔드포인트에서만 제공

### 9.4 목록 조회 최적화
- 평가기간별, 직원별, 전체 조회 등 다양한 조회 방식 제공
- 날짜 범위 필터링 지원
- 정렬 및 인덱스 매칭으로 효율적인 데이터 제공

---

## 10. 참고사항

### 10.1 최종평가 작성 조건 (현재 구현 상태)
- **현재 구현**: 다른 평가 항목(자기평가, 하향평가, 동료평가) 완료 여부를 검증하지 않음
- **실제 검증**: 확정되지 않은 최종평가만 수정 가능 (`isConfirmed === false`)
- **필수 필드**: `evaluationGrade`, `jobGrade`, `jobDetailedGrade` 필수 입력
- **권장 워크플로우**: 다른 평가 항목이 모두 완료된 후 최종평가 작성 권장 (하지만 강제하지 않음)

### 10.2 확정된 평가 수정 불가
- 확정된 평가(`isConfirmed === true`)는 수정 불가
- 확정 취소 후 다시 수정 가능

### 10.3 목록 조회 성능
- 대용량 데이터 환경에서도 빠른 응답 시간 유지
- 평가기간별 조회: 100명 기준 평균 ~25ms
- 전체 조회: 100명 x 10개 평가기간 기준 평균 ~55ms

---

**이 문서는 대시보드 컨트롤러에서 최종평가 관련 정보를 제공하는 엔드포인트를 분석한 문서입니다.**

