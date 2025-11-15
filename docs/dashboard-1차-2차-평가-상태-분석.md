# `/admin/dashboard/{evaluationPeriodId}/employees/status` 엔드포인트
## 1차 평가와 2차 평가 상태 제공 방식 분석

## 개요

`/admin/dashboard/{evaluationPeriodId}/employees/status` 엔드포인트는 평가기간의 모든 직원 현황을 조회하며, 각 직원의 1차 평가(PRIMARY)와 2차 평가(SECONDARY) 상태를 제공합니다.

## 엔드포인트 구조

### 컨트롤러
- **파일**: `src/interface/admin/dashboard/dashboard.controller.ts`
- **메서드**: `getAllEmployeesEvaluationPeriodStatus()`
- **데코레이터**: `@GetAllEmployeesEvaluationPeriodStatus()`
- **경로**: `GET /admin/dashboard/{evaluationPeriodId}/employees/status`

### 처리 흐름

```
Controller → Service → Query Handler → Individual Status Handler
```

1. **Controller**: `DashboardController.getAllEmployeesEvaluationPeriodStatus()`
2. **Service**: `DashboardService.평가기간의_모든_피평가자_현황을_조회한다()`
3. **Query Handler**: `GetAllEmployeesEvaluationPeriodStatusHandler`
4. **Individual Handler**: 각 직원별로 `GetEmployeeEvaluationPeriodStatusHandler` 호출 (병렬 처리)

## 응답 DTO 구조

### `EmployeeEvaluationPeriodStatusResponseDto`

```typescript
{
  // ... 기타 필드 ...
  
  // 하향평가 진행 정보
  downwardEvaluation: {
    // 1차 평가 정보
    primary: PrimaryDownwardEvaluationDto,
    
    // 2차 평가 정보
    secondary: SecondaryDownwardEvaluationDto
  },
  
  // 단계별 확인 상태 정보
  stepApproval: StepApprovalInfoDto
}
```

## 1차 평가 (Primary) 상태 제공

### DTO 구조: `PrimaryDownwardEvaluationDto`

```typescript
{
  // 평가자 정보
  evaluator: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
  } | null;
  
  // 통합 상태 (진행 상태 + 승인 상태)
  status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
  
  // 평가 대상 WBS 수
  assignedWbsCount: number;
  
  // 완료된 평가 수
  completedEvaluationCount: number;
  
  // 제출 여부
  isSubmitted: boolean;
  
  // 가중치 기반 총점 (0-100)
  totalScore: number | null;
  
  // 평가기간 등급 기준에 따른 등급 (예: S+, A-, B 등)
  grade: string | null;
}
```

### 상태 계산 로직

#### 1. 진행 상태 계산 (`하향평가_상태를_조회한다`)

```typescript
// 평가자별_하향평가_상태를_조회한다() 함수에서 계산
- assignedWbsCount === 0 → 'none'
- downwardEvaluations.length === 0 → 'none'
- completedEvaluationCount >= assignedWbsCount → 'complete'
- completedEvaluationCount > 0 || downwardEvaluations.length > 0 → 'in_progress'
```

#### 2. 통합 상태 계산 (`하향평가_통합_상태를_계산한다`)

```typescript
// 진행 상태와 승인 상태를 통합
function 하향평가_통합_상태를_계산한다(
  downwardStatus: 'none' | 'in_progress' | 'complete',
  approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed'
): 통합상태 {
  if (downwardStatus === 'none') return 'none';
  if (downwardStatus === 'in_progress') return 'in_progress';
  // downwardStatus === 'complete'인 경우 승인 상태 반환
  return approvalStatus;
}
```

#### 3. 승인 상태 조회

```typescript
// stepApproval.primaryEvaluationStatus에서 조회
// 기본값: 'pending'
const approvalStatus = stepApproval?.primaryEvaluationStatus ?? 'pending';
```

### 1차 평가자 조회 로직

```typescript
// 1. PRIMARY 평가라인 조회
const primaryLine = await evaluationLineRepository.findOne({
  where: {
    evaluatorType: EvaluatorType.PRIMARY,
    deletedAt: IsNull(),
  },
});

// 2. PRIMARY 평가자 조회 (직원별 고정 담당자)
// wbsItemId가 null인 매핑만 조회 (1차 평가자는 WBS와 무관)
const primaryMapping = await evaluationLineMappingRepository
  .createQueryBuilder('mapping')
  .where('mapping.evaluationPeriodId = :evaluationPeriodId', { evaluationPeriodId })
  .andWhere('mapping.employeeId = :employeeId', { employeeId })
  .andWhere('mapping.evaluationLineId = :lineId', { lineId: primaryLine.id })
  .andWhere('mapping.wbsItemId IS NULL') // 1차 평가자는 WBS와 무관
  .andWhere('mapping.deletedAt IS NULL')
  .orderBy('mapping.createdAt', 'ASC')
  .limit(1)
  .getOne();
```

### 점수 및 등급 계산

```typescript
// 모든 1차 하향평가가 완료된 경우에만 점수와 등급 계산
if (
  primaryStatus.assignedWbsCount > 0 &&
  primaryStatus.completedEvaluationCount === primaryStatus.assignedWbsCount
) {
  // 가중치 기반 총점 계산
  primaryTotalScore = await 가중치_기반_1차_하향평가_점수를_계산한다(...);
  
  // 등급 조회
  if (primaryTotalScore !== null) {
    primaryGrade = await 하향평가_등급을_조회한다(...);
  }
}
```

## 2차 평가 (Secondary) 상태 제공

### DTO 구조: `SecondaryDownwardEvaluationDto`

```typescript
{
  // 2차 평가 전체 통합 상태 (모든 평가자 통합)
  status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
  
  // 2차 평가자 목록 (여러 명 가능)
  evaluators: SecondaryEvaluatorDto[];
  
  // 모든 2차 평가자가 제출했는지 통합 상태
  isSubmitted: boolean;
  
  // 가중치 기반 2차 하향평가 총점 (0-100)
  totalScore: number | null;
  
  // 평가기간 등급 기준에 따른 2차 하향평가 등급
  grade: string | null;
}
```

### 개별 평가자 정보: `SecondaryEvaluatorDto`

```typescript
{
  // 평가자 정보
  evaluator: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
  };
  
  // 통합 상태 (진행 상태 + 승인 상태)
  status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
  
  // 평가 대상 WBS 수
  assignedWbsCount: number;
  
  // 완료된 평가 수
  completedEvaluationCount: number;
  
  // 제출 여부
  isSubmitted: boolean;
}
```

### 상태 계산 로직

#### 1. 개별 평가자 진행 상태 계산

```typescript
// 특정_평가자의_하향평가_상태를_조회한다() 함수에서 계산
// 1차 평가와 동일한 로직 사용
```

#### 2. 개별 평가자 통합 상태 계산

```typescript
// 각 평가자별로 진행 상태와 승인 상태를 통합
secondary.evaluators.map((evaluatorInfo) => {
  // 해당 평가자의 승인 정보 찾기
  const approvalInfo = secondaryEvaluationStatusesWithEvaluatorInfo.find(
    (s) => s.evaluatorId === evaluatorInfo.evaluator.id,
  );
  
  return {
    ...evaluatorInfo,
    status: 하향평가_통합_상태를_계산한다(
      evaluatorInfo.status,
      approvalInfo?.status ?? 'pending',
    ),
  };
})
```

#### 3. 2차 평가 전체 통합 상태 계산 (`이차평가_전체_상태를_계산한다`)

```typescript
function 이차평가_전체_상태를_계산한다(
  evaluatorStatuses: Array<통합상태>
): 통합상태 {
  // 1. 평가자가 없거나 모두 none인 경우
  if (evaluatorStatuses.length === 0 || evaluatorStatuses.every(s => s === 'none')) {
    return 'none';
  }
  
  // 2. 하나라도 none이 아니고 in_progress 이상인 상태가 있는 경우
  const hasInProgress = evaluatorStatuses.some(s => s === 'in_progress' || s === 'complete');
  if (hasInProgress && evaluatorStatuses.some(s => s === 'none' || s === 'in_progress')) {
    return 'in_progress';
  }
  
  // 3. 모두 complete 이상인 경우
  if (allCompleteOrAbove) {
    // revision_requested가 하나라도 있으면 최우선
    if (evaluatorStatuses.some(s => s === 'revision_requested')) {
      return 'revision_requested';
    }
    // 모두 pending인 경우
    if (evaluatorStatuses.every(s => s === 'pending')) {
      return 'pending';
    }
    // revision_completed가 하나라도 있으면
    if (evaluatorStatuses.some(s => s === 'revision_completed')) {
      return 'revision_completed';
    }
    // 모두 approved인 경우
    if (evaluatorStatuses.every(s => s === 'approved')) {
      return 'approved';
    }
    // 혼합 상태 → pending 반환
    return 'pending';
  }
  
  return 'in_progress';
}
```

#### 4. 2차 평가자별 승인 상태 조회

```typescript
// 평가자들별_2차평가_단계승인_상태를_조회한다() 함수에서 조회
// 각 평가자별로 재작성 요청 정보와 승인 상태를 조회

// 재작성 요청이 있는 경우
if (statusInfo && statusInfo.revisionRequestId !== null) {
  if (statusInfo.isCompleted) {
    finalStatus = 'revision_completed';
  } else {
    finalStatus = 'revision_requested';
  }
} else {
  // 재작성 요청이 없는 경우, stepApproval 상태 확인
  if (stepApproval?.secondaryEvaluationStatus === 'approved') {
    finalStatus = 'approved';
  } else {
    finalStatus = 'pending';
  }
}
```

### 2차 평가자 조회 로직

```typescript
// 1. SECONDARY 평가라인 조회
const secondaryLine = await evaluationLineRepository.findOne({
  where: {
    evaluatorType: EvaluatorType.SECONDARY,
    deletedAt: IsNull(),
  },
});

// 2. SECONDARY 평가자들 조회 (여러 명 가능)
// 한 직원이 여러 WBS를 가질 경우, 여러 평가라인 매핑이 존재할 수 있음
const secondaryMappings = await evaluationLineMappingRepository
  .createQueryBuilder('mapping')
  .where('mapping.evaluationPeriodId = :evaluationPeriodId', { evaluationPeriodId })
  .andWhere('mapping.employeeId = :employeeId', { employeeId })
  .andWhere('mapping.evaluationLineId = :lineId', { lineId: secondaryLine.id })
  .andWhere('mapping.deletedAt IS NULL')
  .orderBy('mapping.createdAt', 'ASC')
  .getMany();

// 3. 중복된 evaluatorId 제거
const uniqueEvaluatorIds = [
  ...new Set(
    secondaryMappings.map((m) => m.evaluatorId).filter((id) => !!id),
  ),
];

// 4. 각 평가자별 하향평가 상태 조회 (병렬 처리)
const secondaryStatuses = await Promise.all(
  uniqueEvaluatorIds.map(async (evaluatorId) => {
    const status = await 특정_평가자의_하향평가_상태를_조회한다(...);
    // 평가자 정보 조회 및 반환
  }),
);
```

### 점수 및 등급 계산

```typescript
// 모든 2차 평가자의 평가가 완료되었는지 확인
const allSecondaryEvaluationsCompleted = secondaryStatuses.every(
  (status) =>
    status.assignedWbsCount > 0 &&
    status.completedEvaluationCount === status.assignedWbsCount,
);

if (secondaryEvaluators.length > 0 && allSecondaryEvaluationsCompleted) {
  // 가중치 기반 총점 계산
  secondaryTotalScore = await 가중치_기반_2차_하향평가_점수를_계산한다(...);
  
  // 등급 조회
  if (secondaryTotalScore !== null) {
    secondaryGrade = await 하향평가_등급을_조회한다(...);
  }
}
```

## 단계별 확인 상태 (Step Approval)

### 1차 평가 승인 상태

```typescript
stepApproval: {
  primaryEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
  primaryEvaluationApprovedBy: string | null;
  primaryEvaluationApprovedAt: Date | null;
}
```

### 2차 평가 승인 상태

```typescript
stepApproval: {
  // 평가자별 단계 승인 상태 정보
  secondaryEvaluationStatuses: SecondaryEvaluationStatusDto[];
  
  // 2차 평가 전체 통합 상태 (하위 호환성)
  secondaryEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
  secondaryEvaluationApprovedBy: string | null;
  secondaryEvaluationApprovedAt: Date | null;
}
```

### 2차 평가자별 상세 승인 정보: `SecondaryEvaluationStatusDto`

```typescript
{
  evaluatorId: string;
  evaluatorName: string;
  evaluatorEmployeeNumber: string;
  evaluatorEmail: string;
  status: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
  approvedBy: string | null;
  approvedAt: Date | null;
  revisionRequestId: string | null;
  revisionComment: string | null;
  isRevisionCompleted: boolean;
  revisionCompletedAt: Date | null;
  responseComment: string | null;
}
```

## 주요 차이점

### 1차 평가 (Primary)

1. **평가자 수**: 1명 (직원별 고정 담당자)
2. **WBS 관계**: WBS와 무관 (`wbsItemId IS NULL`)
3. **상태 구조**: 단일 객체 (`primary`)
4. **승인 상태**: 단일 승인 상태 (`stepApproval.primaryEvaluationStatus`)

### 2차 평가 (Secondary)

1. **평가자 수**: 여러 명 가능 (WBS별로 다른 평가자 가능)
2. **WBS 관계**: WBS별로 다른 평가자 할당 가능
3. **상태 구조**: 배열 구조 (`secondary.evaluators[]`)
4. **승인 상태**: 평가자별 개별 승인 상태 (`stepApproval.secondaryEvaluationStatuses[]`)
5. **전체 통합 상태**: 모든 평가자의 상태를 통합하여 계산

## 상태 제공 조건

### 상태 종류 및 제공 조건

#### 1. `none` - 평가 대상 없음

**제공 조건:**
- 평가자(`evaluator`)가 지정되지 않은 경우
- 할당된 WBS 수(`assignedWbsCount`)가 0인 경우
- 하향평가(`DownwardEvaluation`)가 하나도 생성되지 않은 경우

**1차 평가:**
```typescript
// 평가자가 없거나 할당된 WBS가 없으면
if (assignedWbsCount === 0 || downwardEvaluations.length === 0) {
  status = 'none';
}
```

**2차 평가:**
```typescript
// 평가자가 없거나 모든 평가자의 상태가 none인 경우
if (evaluatorStatuses.length === 0 || evaluatorStatuses.every(s => s === 'none')) {
  return 'none';
}
```

#### 2. `in_progress` - 평가 진행 중

**제공 조건:**
- 평가자가 지정되어 있고
- 할당된 WBS가 있지만
- 완료된 평가 수(`completedEvaluationCount`)가 할당된 WBS 수(`assignedWbsCount`)보다 적은 경우
- 또는 하향평가가 일부만 완료된 경우

**1차 평가:**
```typescript
// 할당된 WBS가 있고, 완료된 평가가 일부만 있거나 하향평가가 존재하지만 완료되지 않은 경우
if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
  status = 'in_progress';
}
```

**2차 평가:**
```typescript
// 하나라도 none이 아니고 in_progress 이상인 상태가 있는 경우
const hasInProgress = evaluatorStatuses.some(s => s === 'in_progress' || s === 'complete');
if (hasInProgress && evaluatorStatuses.some(s => s === 'none' || s === 'in_progress')) {
  return 'in_progress';
}
```

**통합 상태 계산:**
```typescript
// 진행 상태가 in_progress이면 통합 상태도 in_progress
if (downwardStatus === 'in_progress') {
  return 'in_progress';
}
```

#### 3. `complete` - 평가 완료 (진행 상태만)

**제공 조건:**
- 할당된 WBS 수만큼 모든 하향평가가 완료된 경우
- **주의**: `complete`는 진행 상태에서만 사용되며, 통합 상태에서는 승인 상태(`pending`, `approved` 등)로 변환됨

**1차/2차 평가:**
```typescript
// 할당된 WBS 수만큼 하향평가가 완료되었으면
if (completedEvaluationCount >= assignedWbsCount) {
  status = 'complete';
}
```

**통합 상태 변환:**
```typescript
// 진행 상태가 complete이면 승인 상태로 변환
if (downwardStatus === 'complete') {
  return approvalStatus; // pending, approved, revision_requested, revision_completed 중 하나
}
```

#### 4. `pending` - 평가 완료, 승인 대기

**제공 조건:**
- 진행 상태가 `complete`이고
- 승인 상태가 `pending`인 경우
- 또는 2차 평가에서 모든 평가자가 `pending`인 경우

**1차 평가:**
```typescript
// 진행 상태가 complete이고 승인 상태가 pending인 경우
const status = 하향평가_통합_상태를_계산한다(
  'complete', // 진행 상태
  'pending'   // 승인 상태 (stepApproval.primaryEvaluationStatus)
);
// 결과: 'pending'
```

**2차 평가:**
```typescript
// 모든 평가자의 통합 상태가 pending인 경우
if (evaluatorStatuses.every(s => s === 'pending')) {
  return 'pending';
}
// 또는 혼합 상태 (pending + approved 등)인 경우도 pending 반환
```

**기본값:**
```typescript
// 승인 상태가 명시되지 않은 경우 기본값으로 pending 사용
const approvalStatus = stepApproval?.primaryEvaluationStatus ?? 'pending';
```

#### 5. `approved` - 승인 완료

**제공 조건:**
- 진행 상태가 `complete`이고
- 승인 상태가 `approved`인 경우
- 또는 2차 평가에서 모든 평가자가 `approved`인 경우

**1차 평가:**
```typescript
// 진행 상태가 complete이고 승인 상태가 approved인 경우
const status = 하향평가_통합_상태를_계산한다(
  'complete',  // 진행 상태
  'approved'   // 승인 상태 (stepApproval.primaryEvaluationStatus)
);
// 결과: 'approved'
```

**2차 평가:**
```typescript
// 모든 평가자의 통합 상태가 approved인 경우
if (evaluatorStatuses.every(s => s === 'approved')) {
  return 'approved';
}
```

**승인 상태 조회:**
```typescript
// stepApproval에서 승인 상태 확인
if (stepApproval?.primaryEvaluationStatus === 'approved') {
  finalStatus = 'approved';
}
```

#### 6. `revision_requested` - 재작성 요청됨

**제공 조건:**
- 진행 상태가 `complete`이고
- 재작성 요청(`EvaluationRevisionRequest`)이 생성되었지만
- 재작성이 아직 완료되지 않은 경우
- 또는 2차 평가에서 하나라도 `revision_requested`인 경우 (최우선)

**1차 평가:**
```typescript
// 재작성 요청이 있고 아직 완료되지 않은 경우
if (statusInfo && statusInfo.revisionRequestId !== null) {
  if (!statusInfo.isCompleted) {
    finalStatus = 'revision_requested';
  }
}
```

**2차 평가:**
```typescript
// 하나라도 revision_requested가 있으면 최우선
if (evaluatorStatuses.some(s => s === 'revision_requested')) {
  return 'revision_requested';
}
```

**재작성 요청 확인:**
```typescript
// 재작성 요청 정보 조회
const statusInfo = await 평가자들별_2차평가_단계승인_상태를_조회한다(...);
if (statusInfo && statusInfo.revisionRequestId !== null) {
  if (!statusInfo.isCompleted) {
    finalStatus = 'revision_requested';
  }
}
```

#### 7. `revision_completed` - 재작성 완료

**제공 조건:**
- 진행 상태가 `complete`이고
- 재작성 요청이 있었고
- 재작성이 완료된 경우 (`isRevisionCompleted === true`)
- 또는 2차 평가에서 하나라도 `revision_completed`인 경우

**1차 평가:**
```typescript
// 재작성 요청이 있고 완료된 경우
if (statusInfo && statusInfo.revisionRequestId !== null) {
  if (statusInfo.isCompleted) {
    finalStatus = 'revision_completed';
  }
}
```

**2차 평가:**
```typescript
// revision_completed가 하나라도 있으면
if (evaluatorStatuses.some(s => s === 'revision_completed')) {
  return 'revision_completed';
}
```

**재작성 완료 확인:**
```typescript
// 재작성 요청 정보에서 완료 여부 확인
if (statusInfo && statusInfo.revisionRequestId !== null) {
  if (statusInfo.isCompleted) {
    finalStatus = 'revision_completed';
  }
}
```

### 통합 상태 계산 흐름

#### 1차 평가 통합 상태 계산

```
진행 상태 (downwardStatus)
  ↓
├─ none → none
├─ in_progress → in_progress
└─ complete → 승인 상태 (approvalStatus)
              ├─ pending
              ├─ approved
              ├─ revision_requested
              └─ revision_completed
```

#### 2차 평가 통합 상태 계산

```
각 평가자별 통합 상태 계산
  ↓
전체 평가자 상태 배열
  ↓
├─ 모두 none → none
├─ 하나라도 in_progress → in_progress
└─ 모두 complete 이상
    ├─ 하나라도 revision_requested → revision_requested (최우선)
    ├─ 모두 pending → pending
    ├─ 하나라도 revision_completed → revision_completed
    ├─ 모두 approved → approved
    └─ 혼합 상태 → pending
```

### 상태 우선순위

#### 1차 평가 통합 상태 우선순위

1. `none` - 평가 대상 없음 (진행 상태 우선)
2. `in_progress` - 평가 진행 중 (진행 상태 우선)
3. `pending` - 평가 완료, 승인 대기 (승인 상태)
4. `revision_requested` - 재작성 요청됨 (승인 상태)
5. `revision_completed` - 재작성 완료 (승인 상태)
6. `approved` - 승인 완료 (승인 상태)

#### 2차 평가 전체 통합 상태 우선순위

1. `none` - 평가 대상 없음
2. `in_progress` - 평가 진행 중
3. `revision_requested` - 하나라도 있으면 최우선
4. `pending` - 모두 pending이거나 혼합 상태
5. `revision_completed` - 하나라도 있으면
6. `approved` - 모두 approved인 경우

## 관련 파일

### 핸들러
- `src/context/dashboard-context/handlers/queries/get-all-employees-evaluation-period-status.query.ts`
- `src/context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/get-employee-evaluation-period-status.handler.ts`

### 유틸리티
- `src/context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/downward-evaluation.utils.ts`
- `src/context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/downward-evaluation-score.utils.ts`

### DTO
- `src/interface/admin/dashboard/dto/employee-evaluation-period-status.dto.ts`

### 컨트롤러
- `src/interface/admin/dashboard/dashboard.controller.ts`

