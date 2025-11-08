# 대시보드 동료평가 상태 분석

## 개요

이 문서는 대시보드 컨트롤러(`DashboardController`)에서 동료평가와 관련된 정보를 반환하는 엔드포인트를 분석하고, 동료평가를 진행할 때 대시보드의 어떤 값들을 확인해야 하는지 정리합니다.

---

## 1. 동료평가 관련 대시보드 엔드포인트

### 1.1 직원의 평가기간 현황 조회

**엔드포인트**: `GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status`

**요약**: 직원의 평가기간 현황을 조회합니다.

**경로 파라미터**:
- `evaluationPeriodId`: 평가기간 ID (UUID)
- `employeeId`: 직원 ID (UUID)

**응답** (`EmployeeEvaluationPeriodStatusResponseDto`, 200 OK):
```typescript
{
  // ... 기타 필드
  peerEvaluation: PeerEvaluationInfoDto;  // ⭐ 동료평가 진행 정보
}
```

**동료평가 정보 구조** (`PeerEvaluationInfoDto`):
```typescript
{
  status: 'complete' | 'in_progress' | 'none';  // 동료평가 진행 상태
  totalRequestCount: number;                    // 총 동료평가 요청 수
  completedRequestCount: number;               // 완료된 동료평가 수
}
```

---

### 1.2 직원의 평가 현황 및 할당 데이터 통합 조회

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
  peerEvaluation: PeerEvaluationInfoDto;  // ⭐ 동료평가 진행 정보
  finalEvaluation: FinalEvaluationInfoDto;
  projects: ProjectsWithCountDto;
}
```

**동료평가 정보 구조** (`PeerEvaluationInfoDto`):
```typescript
{
  status: 'complete' | 'in_progress' | 'none';  // 동료평가 진행 상태
  totalRequestCount: number;                    // 총 동료평가 요청 수
  completedRequestCount: number;               // 완료된 동료평가 수
}
```

---

## 2. 동료평가 상태 값 분석

### 2.1 동료평가 상태 (`status`)

동료평가 진행 상태는 다음 세 가지 값 중 하나입니다:

| 상태 | 값 | 의미 | 조건 |
|------|-----|------|------|
| **요청 가능** | `none` | 동료평가 요청이 없음 | `totalRequestCount === 0` |
| **입력중** | `in_progress` | 동료평가가 존재하나 일부만 완료되거나 진행중 | `totalRequestCount > 0 && completedRequestCount < totalRequestCount` |
| **완료** | `complete` | 모든 동료평가가 완료됨 | `totalRequestCount > 0 && completedRequestCount === totalRequestCount` |

**상태 계산 로직**:
```typescript
// 동료평가 상태 계산
function 동료평가_상태를_계산한다(
  totalRequestCount: number,
  completedRequestCount: number,
): PeerEvaluationStatus {
  // 동료평가 요청이 없으면 요청가능
  if (totalRequestCount === 0) {
    return 'none';
  }

  // 모든 동료평가가 완료되었으면 완료
  if (completedRequestCount === totalRequestCount) {
    return 'complete';
  }

  // 일부만 완료되었거나 진행중
  return 'in_progress';
}
```

---

### 2.2 총 동료평가 요청 수 (`totalRequestCount`)

**의미**: 피평가자에게 할당된 활성화된 동료평가 요청의 총 개수

**계산 조건**:
- `periodId`: 평가기간 ID와 일치
- `evaluateeId`: 피평가자 ID와 일치
- `isActive = true`: 활성화된 요청만
- `status != 'cancelled'`: 취소된 요청 제외
- `deletedAt IS NULL`: 삭제되지 않은 요청만

**조회 쿼리**:
```typescript
const totalRequestCount = await peerEvaluationRepository.count({
  where: {
    periodId: evaluationPeriodId,
    evaluateeId: employeeId,
    isActive: true,
    status: Not(DomainPeerEvaluationStatus.CANCELLED),
    deletedAt: IsNull(),
  },
});
```

---

### 2.3 완료된 동료평가 수 (`completedRequestCount`)

**의미**: 피평가자에게 할당된 동료평가 요청 중 완료된 개수

**계산 조건**:
- `periodId`: 평가기간 ID와 일치
- `evaluateeId`: 피평가자 ID와 일치
- `isActive = true`: 활성화된 요청만
- `isCompleted = true`: 완료된 요청만
- `status != 'cancelled'`: 취소된 요청 제외
- `deletedAt IS NULL`: 삭제되지 않은 요청만

**조회 쿼리**:
```typescript
const completedRequestCount = await peerEvaluationRepository.count({
  where: {
    periodId: evaluationPeriodId,
    evaluateeId: employeeId,
    isActive: true,
    isCompleted: true,
    status: Not(DomainPeerEvaluationStatus.CANCELLED),
    deletedAt: IsNull(),
  },
});
```

---

## 3. 동료평가 진행 시 확인해야 할 대시보드 값

### 3.1 동료평가 요청 전 확인 사항

동료평가를 요청하기 전에 다음 값들을 확인해야 합니다:

#### ✅ 필수 확인 사항

1. **평가 대상 여부** (`isEvaluationTarget`)
   - `true`: 평가 대상이므로 동료평가 요청 가능
   - `false`: 평가 대상이 아니므로 동료평가 요청 불가

2. **평가기간 상태** (`evaluationPeriod.status`)
   - 평가기간이 활성화되어 있어야 동료평가 요청 가능
   - `IN_PROGRESS` 상태여야 함

3. **현재 평가 단계** (`evaluationPeriod.currentPhase`)
   - 동료평가 단계에 해당하는지 확인
   - 평가 단계가 동료평가 단계가 아니면 요청 불가

#### ⚠️ 권장 확인 사항

4. **기존 동료평가 상태** (`peerEvaluation.status`)
   - `none`: 동료평가 요청이 없으므로 새로 요청 가능
   - `in_progress`: 기존 요청이 진행 중이므로 추가 요청 가능
   - `complete`: 모든 동료평가가 완료되었으므로 추가 요청 여부 확인 필요

5. **기존 동료평가 요청 수** (`peerEvaluation.totalRequestCount`)
   - 이미 요청된 동료평가 수 확인
   - 필요한 평가자 수와 비교하여 추가 요청 여부 결정

---

### 3.2 동료평가 진행 중 확인 사항

동료평가가 진행 중일 때 다음 값들을 확인해야 합니다:

#### ✅ 필수 확인 사항

1. **동료평가 진행 상태** (`peerEvaluation.status`)
   - `in_progress`: 진행 중이므로 평가자들이 답변 작성 중
   - `complete`: 모든 동료평가가 완료되었으므로 다음 단계로 진행 가능

2. **완료된 동료평가 수** (`peerEvaluation.completedRequestCount`)
   - 현재 완료된 동료평가 수 확인
   - 진행률 계산: `(completedRequestCount / totalRequestCount) * 100`

3. **총 동료평가 요청 수** (`peerEvaluation.totalRequestCount`)
   - 전체 요청 수 확인
   - 완료 수와 비교하여 진행 상황 파악

#### ⚠️ 권장 확인 사항

4. **평가기간 마감일** (`evaluationPeriod.endDate`)
   - 평가기간 마감일 확인
   - 마감일 전에 모든 동료평가가 완료되어야 함

5. **다음 단계 진행 가능 여부**
   - `peerEvaluation.status === 'complete'`이면 최종평가 단계로 진행 가능
   - 다른 평가 항목(자기평가, 하향평가)도 완료되었는지 확인

---

### 3.3 동료평가 완료 후 확인 사항

동료평가가 완료된 후 다음 값들을 확인해야 합니다:

#### ✅ 필수 확인 사항

1. **동료평가 완료 상태** (`peerEvaluation.status`)
   - `complete`: 모든 동료평가가 완료되었음을 확인
   - 다음 단계(최종평가)로 진행 가능

2. **완료된 동료평가 수** (`peerEvaluation.completedRequestCount`)
   - `completedRequestCount === totalRequestCount` 확인
   - 모든 요청이 완료되었는지 검증

#### ⚠️ 권장 확인 사항

3. **최종평가 진행 가능 여부** (`finalEvaluation.status`)
   - 동료평가 완료 후 최종평가 단계로 진행 가능
   - `finalEvaluation.status` 확인하여 최종평가 작성 가능 여부 확인

4. **다른 평가 항목 완료 여부**
   - 자기평가 완료 여부 (`selfEvaluation.status === 'complete'`)
   - 하향평가 완료 여부 (`primaryDownwardEvaluation.status === 'complete'`, `secondaryDownwardEvaluation.status === 'complete'`)
   - 모든 평가 항목이 완료되어야 최종평가 작성 가능

---

## 4. 동료평가 상태별 워크플로우

### 4.1 상태: `none` (요청 가능)

**상황**: 동료평가 요청이 없는 상태

**확인 사항**:
- ✅ `isEvaluationTarget === true`: 평가 대상인지 확인
- ✅ `evaluationPeriod.status === 'IN_PROGRESS'`: 평가기간이 진행 중인지 확인
- ✅ `evaluationPeriod.currentPhase`: 동료평가 단계인지 확인

**다음 단계**:
1. 동료평가 요청 생성
   - `POST /admin/performance-evaluation/peer-evaluations/requests`
   - 평가자와 피평가자 지정
   - 평가 질문 할당 (선택)

**예상 결과**:
- `peerEvaluation.status` → `in_progress`
- `peerEvaluation.totalRequestCount` → 요청한 개수만큼 증가
- `peerEvaluation.completedRequestCount` → 0

---

### 4.2 상태: `in_progress` (입력중)

**상황**: 동료평가 요청이 있고 일부만 완료된 상태

**확인 사항**:
- ✅ `peerEvaluation.totalRequestCount`: 전체 요청 수 확인
- ✅ `peerEvaluation.completedRequestCount`: 완료된 수 확인
- ✅ 진행률: `(completedRequestCount / totalRequestCount) * 100`

**다음 단계**:
1. 미완료 동료평가 확인
   - `GET /admin/performance-evaluation/peer-evaluations?evaluateeId={employeeId}&periodId={periodId}&status=pending`
   - 미완료 평가 목록 조회

2. 평가자에게 진행 상황 알림 (필요 시)
   - 미완료 평가자에게 알림 전송

3. 추가 동료평가 요청 (필요 시)
   - `POST /admin/performance-evaluation/peer-evaluations/requests`
   - 추가 평가자 지정

**예상 결과**:
- 모든 평가가 완료되면 `peerEvaluation.status` → `complete`
- `peerEvaluation.completedRequestCount` → `totalRequestCount`와 동일

---

### 4.3 상태: `complete` (완료)

**상황**: 모든 동료평가가 완료된 상태

**확인 사항**:
- ✅ `peerEvaluation.status === 'complete'`: 완료 상태 확인
- ✅ `peerEvaluation.completedRequestCount === peerEvaluation.totalRequestCount`: 모든 요청 완료 확인
- ✅ `finalEvaluation.status`: 최종평가 진행 가능 여부 확인

**다음 단계**:
1. 최종평가 작성 가능 여부 확인
   - 자기평가 완료 여부 확인
   - 하향평가 완료 여부 확인
   - 모든 평가 항목 완료 시 최종평가 작성

2. 동료평가 결과 확인
   - `GET /admin/performance-evaluation/peer-evaluations?evaluateeId={employeeId}&periodId={periodId}`
   - 완료된 동료평가 목록 조회

**예상 결과**:
- 최종평가 단계로 진행 가능
- `finalEvaluation.status` → `in_progress` 또는 `complete`

---

## 5. 동료평가 상태 확인 체크리스트

### 5.1 동료평가 요청 전 체크리스트

- [ ] `isEvaluationTarget === true` (평가 대상 여부)
- [ ] `evaluationPeriod.status === 'IN_PROGRESS'` (평가기간 진행 중)
- [ ] `evaluationPeriod.currentPhase` (동료평가 단계 확인)
- [ ] `peerEvaluation.status` (기존 요청 상태 확인)
- [ ] `peerEvaluation.totalRequestCount` (기존 요청 수 확인)

---

### 5.2 동료평가 진행 중 체크리스트

- [ ] `peerEvaluation.status === 'in_progress'` (진행 중 상태)
- [ ] `peerEvaluation.totalRequestCount` (전체 요청 수)
- [ ] `peerEvaluation.completedRequestCount` (완료된 수)
- [ ] 진행률 계산: `(completedRequestCount / totalRequestCount) * 100`
- [ ] `evaluationPeriod.endDate` (평가기간 마감일 확인)

---

### 5.3 동료평가 완료 후 체크리스트

- [ ] `peerEvaluation.status === 'complete'` (완료 상태)
- [ ] `peerEvaluation.completedRequestCount === peerEvaluation.totalRequestCount` (모든 요청 완료)
- [ ] `selfEvaluation.status === 'complete'` (자기평가 완료)
- [ ] `primaryDownwardEvaluation.status === 'complete'` (1차 하향평가 완료)
- [ ] `secondaryDownwardEvaluation.status === 'complete'` (2차 하향평가 완료)
- [ ] `finalEvaluation.status` (최종평가 진행 가능 여부)

---

## 6. 동료평가 상태와 다른 평가 항목의 관계

### 6.1 평가 진행 순서

일반적인 평가 진행 순서:

```
1. 평가기준 설정 (criteriaSetup)
   ↓
2. 성과 입력 (performance)
   ↓
3. 자기평가 (selfEvaluation)
   ↓
4. 하향평가 (primaryDownwardEvaluation, secondaryDownwardEvaluation)
   ↓
5. 동료평가 (peerEvaluation) ⭐
   ↓
6. 최종평가 (finalEvaluation)
```

### 6.2 동료평가와 다른 평가 항목의 의존성

| 평가 항목 | 동료평가와의 관계 | 설명 |
|----------|-----------------|------|
| **자기평가** | 독립적 | 동료평가와 독립적으로 진행 가능 |
| **하향평가** | 독립적 | 동료평가와 독립적으로 진행 가능 |
| **최종평가** | 의존적 | 동료평가 완료 후 진행 가능 |

**최종평가 진행 조건**:
- ✅ 자기평가 완료 (`selfEvaluation.status === 'complete'`)
- ✅ 하향평가 완료 (`primaryDownwardEvaluation.status === 'complete'`, `secondaryDownwardEvaluation.status === 'complete'`)
- ✅ **동료평가 완료** (`peerEvaluation.status === 'complete'`) ⭐

---

## 7. 대시보드 값 확인 예시

### 7.1 동료평가 요청 전 확인

```typescript
// 대시보드 조회
const status = await dashboardService.직원의_평가기간_현황을_조회한다(
  evaluationPeriodId,
  employeeId,
);

// 동료평가 요청 가능 여부 확인
if (!status.isEvaluationTarget) {
  throw new Error('평가 대상이 아닙니다.');
}

if (status.evaluationPeriod.status !== 'IN_PROGRESS') {
  throw new Error('평가기간이 진행 중이 아닙니다.');
}

if (status.peerEvaluation.status === 'complete') {
  console.log('모든 동료평가가 완료되었습니다.');
  console.log(`완료된 동료평가: ${status.peerEvaluation.completedRequestCount}/${status.peerEvaluation.totalRequestCount}`);
}

// 동료평가 요청 생성
if (status.peerEvaluation.status === 'none' || status.peerEvaluation.status === 'in_progress') {
  await peerEvaluationService.동료평가를_요청한다({
    evaluatorId: 'evaluator-id',
    evaluateeId: employeeId,
    periodId: evaluationPeriodId,
    questionIds: ['question-id-1', 'question-id-2'],
  });
}
```

---

### 7.2 동료평가 진행 중 확인

```typescript
// 대시보드 조회
const status = await dashboardService.직원의_평가기간_현황을_조회한다(
  evaluationPeriodId,
  employeeId,
);

// 동료평가 진행 상황 확인
if (status.peerEvaluation.status === 'in_progress') {
  const progressRate = 
    (status.peerEvaluation.completedRequestCount / status.peerEvaluation.totalRequestCount) * 100;
  
  console.log(`동료평가 진행률: ${progressRate.toFixed(1)}%`);
  console.log(`완료: ${status.peerEvaluation.completedRequestCount}/${status.peerEvaluation.totalRequestCount}`);
  
  // 미완료 동료평가 조회
  const incompleteEvaluations = await peerEvaluationService.동료평가_목록을_조회한다({
    evaluateeId: employeeId,
    periodId: evaluationPeriodId,
    status: 'pending',
  });
  
  console.log(`미완료 동료평가 수: ${incompleteEvaluations.length}`);
}
```

---

### 7.3 동료평가 완료 후 확인

```typescript
// 대시보드 조회
const status = await dashboardService.직원의_평가기간_현황을_조회한다(
  evaluationPeriodId,
  employeeId,
);

// 동료평가 완료 확인
if (status.peerEvaluation.status === 'complete') {
  console.log('✅ 모든 동료평가가 완료되었습니다.');
  console.log(`완료된 동료평가: ${status.peerEvaluation.completedRequestCount}/${status.peerEvaluation.totalRequestCount}`);
  
  // 최종평가 진행 가능 여부 확인
  const canProceedToFinalEvaluation = 
    status.selfEvaluation.status === 'complete' &&
    status.primaryDownwardEvaluation.status === 'complete' &&
    status.secondaryDownwardEvaluation.status === 'complete' &&
    status.peerEvaluation.status === 'complete';
  
  if (canProceedToFinalEvaluation) {
    console.log('✅ 최종평가 작성 가능');
  } else {
    console.log('⚠️ 다른 평가 항목이 완료되지 않았습니다.');
    console.log(`- 자기평가: ${status.selfEvaluation.status}`);
    console.log(`- 1차 하향평가: ${status.primaryDownwardEvaluation.status}`);
    console.log(`- 2차 하향평가: ${status.secondaryDownwardEvaluation.status}`);
  }
}
```

---

## 8. 요약

### 8.1 동료평가 관련 대시보드 엔드포인트

| 엔드포인트 | 경로 | 동료평가 정보 포함 |
|-----------|------|------------------|
| 직원의 평가기간 현황 조회 | `GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status` | ✅ `peerEvaluation` |
| 직원의 평가 현황 및 할당 데이터 통합 조회 | `GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/complete-status` | ✅ `peerEvaluation` |

### 8.2 동료평가 상태 값

| 필드 | 타입 | 의미 |
|------|------|------|
| `status` | `'complete' \| 'in_progress' \| 'none'` | 동료평가 진행 상태 |
| `totalRequestCount` | `number` | 총 동료평가 요청 수 |
| `completedRequestCount` | `number` | 완료된 동료평가 수 |

### 8.3 동료평가 진행 시 확인해야 할 값

1. **요청 전**: `isEvaluationTarget`, `evaluationPeriod.status`, `evaluationPeriod.currentPhase`, `peerEvaluation.status`
2. **진행 중**: `peerEvaluation.status`, `peerEvaluation.totalRequestCount`, `peerEvaluation.completedRequestCount`, 진행률
3. **완료 후**: `peerEvaluation.status === 'complete'`, `peerEvaluation.completedRequestCount === peerEvaluation.totalRequestCount`, 다른 평가 항목 완료 여부

### 8.4 동료평가 상태별 다음 단계

- **`none`**: 동료평가 요청 생성
- **`in_progress`**: 미완료 동료평가 확인 및 진행 상황 모니터링
- **`complete`**: 최종평가 단계로 진행 (다른 평가 항목도 완료된 경우)

