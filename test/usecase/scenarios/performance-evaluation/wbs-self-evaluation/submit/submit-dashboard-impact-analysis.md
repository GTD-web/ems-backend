# WBS 자기평가 제출 시 Dashboard API 영향도 분석

## 개요

WBS 자기평가가 **제출**되었을 때, `dashboard.controller.ts`의 각 엔드포인트에서 영향받는 필드와 검증 항목을 정리합니다.

## 자기평가 제출 프로세스

### 1단계: 피평가자 → 1차 평가자 제출
- **변경 필드**: `submittedToEvaluator = true`, `submittedToEvaluatorAt = new Date()`
- **엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator`

### 2단계: 1차 평가자 → 관리자 제출
- **변경 필드**: `submittedToManager = true`, `submittedToManagerAt = new Date()`
- **전제 조건**: `submittedToEvaluator = true` (1차 평가자에게 먼저 제출되어야 함)
- **엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit`

---

## 영향받는 대시보드 엔드포인트

### 1. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}`
**`getEmployeeEvaluationPeriodStatus`**

#### 제출 시 변경되는 필드

```typescript
{
  selfEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalMappingCount: number,                          // ✅ 영향받음 (전체 WBS 할당 수)
    completedMappingCount: number,                      // ✅ 영향받음 (관리자 제출 완료 수)
    submittedToEvaluatorCount: number,                  // ✅ 영향받음 (1차 평가자 제출 수)
    isSubmittedToEvaluator: boolean,                   // ✅ 영향받음 (전체 1차 평가자 제출 여부)
    submittedToManagerCount: number,                    // ✅ 영향받음 (관리자 제출 수)
    isSubmittedToManager: boolean,                      // ✅ 영향받음 (전체 관리자 제출 여부)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  }
}
```

#### 제출 단계별 영향

**피평가자 → 1차 평가자 제출 시:**
- `submittedToEvaluatorCount` 증가
- `isSubmittedToEvaluator` 계산 (모든 자기평가가 1차 평가자에게 제출되었는지)
- `completedMappingCount`는 변경 없음 (관리자 제출 전)
- `status`는 `'in_progress'` 유지 (관리자 제출 전)
- `totalScore`, `grade`는 `null` 유지 (관리자 제출 전)

**1차 평가자 → 관리자 제출 시:**
- `submittedToManagerCount` 증가
- `completedMappingCount` 증가 (`submittedToManager = true`인 자기평가 수)
- `isSubmittedToManager` 계산 (모든 자기평가가 관리자에게 제출되었는지)
- `status`가 `'complete'`로 변경 (모든 자기평가가 관리자에게 제출 완료 시)
- `totalScore`, `grade` 계산 (모든 자기평가가 관리자에게 제출 완료 시)

#### 검증 시나리오

- **피평가자 → 1차 평가자 제출 시**:
  - `submittedToEvaluatorCount`가 1 증가하는지 확인
  - `isSubmittedToEvaluator`가 `true`로 변경되는지 확인 (전체 자기평가가 1개인 경우)
  - `completedMappingCount`는 변경 없음 확인
  - `status`는 `'in_progress'` 유지 확인
  - `totalScore`, `grade`는 `null` 유지 확인

- **1차 평가자 → 관리자 제출 시**:
  - `submittedToManagerCount`가 1 증가하는지 확인
  - `completedMappingCount`가 1 증가하는지 확인
  - `isSubmittedToManager`가 `true`로 변경되는지 확인 (전체 자기평가가 1개인 경우)
  - `status`가 `'complete'`로 변경되는지 확인 (모든 자기평가 제출 완료 시)
  - `totalScore`와 `grade`가 계산되는지 확인 (모든 자기평가 제출 완료 시)

---

### 2. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data`
**`getEmployeeAssignedData`**

#### 제출 시 변경되는 필드

```typescript
{
  projects: [
    {
      wbsList: [
        {
          selfEvaluation: {
            selfEvaluationId?: string,                  // ✅ 영향받음
            evaluationContent?: string,                 // ✅ 영향받음
            score?: number,                             // ✅ 영향받음
            submittedToEvaluator?: boolean,             // ✅ 영향받음 (1차 평가자 제출 여부)
            submittedToEvaluatorAt?: Date,              // ✅ 영향받음 (1차 평가자 제출 일시)
            submittedToManager?: boolean,               // ✅ 영향받음 (관리자 제출 여부)
            submittedToManagerAt?: Date,                // ✅ 영향받음 (관리자 제출 일시)
            isCompleted: boolean,                       // ✅ 영향받음 (관리자 제출 여부)
            isEditable: boolean,                        // ⚠️ editableStatus에서 가져옴 (간접 영향)
          }
        }
      ]
    }
  ],
  summary: {
    completedSelfEvaluations: number,                   // ✅ 영향받음 (관리자 제출 완료 수)
    selfEvaluation: {
      totalSelfEvaluations: number,                     // ✅ 영향받음 (전체 자기평가 수)
      submittedToEvaluatorCount: number,                // ✅ 영향받음 (1차 평가자 제출 수)
      submittedToManagerCount: number,                 // ✅ 영향받음 (관리자 제출 수)
      isSubmittedToEvaluator: boolean,                  // ✅ 영향받음 (전체 1차 평가자 제출 여부)
      isSubmittedToManager: boolean,                   // ✅ 영향받음 (전체 관리자 제출 여부)
      totalScore: number | null,                       // ✅ 영향받음 (가중치 기반 총점)
      grade: string | null                             // ✅ 영향받음 (등급)
    }
  }
}
```

#### 제출 단계별 영향

**피평가자 → 1차 평가자 제출 시:**
- 해당 WBS의 `selfEvaluation.submittedToEvaluator`가 `true`로 변경
- `selfEvaluation.submittedToEvaluatorAt`이 기록됨
- `summary.selfEvaluation.submittedToEvaluatorCount` 증가
- `summary.selfEvaluation.isSubmittedToEvaluator` 계산
- `selfEvaluation.isCompleted`는 `false` 유지 (관리자 제출 전)
- `summary.completedSelfEvaluations`는 변경 없음

**1차 평가자 → 관리자 제출 시:**
- 해당 WBS의 `selfEvaluation.submittedToManager`가 `true`로 변경
- `selfEvaluation.submittedToManagerAt`이 기록됨
- `selfEvaluation.isCompleted`가 `true`로 변경
- `summary.selfEvaluation.submittedToManagerCount` 증가
- `summary.completedSelfEvaluations` 증가
- `summary.selfEvaluation.isSubmittedToManager` 계산
- `summary.selfEvaluation.totalScore`, `grade` 계산 (모든 자기평가 제출 완료 시)

#### 검증 시나리오

- **피평가자 → 1차 평가자 제출 시**:
  - 해당 WBS의 `selfEvaluation.submittedToEvaluator`가 `true`로 변경되는지 확인
  - `selfEvaluation.submittedToEvaluatorAt`이 기록되는지 확인
  - `summary.selfEvaluation.submittedToEvaluatorCount`가 1 증가하는지 확인
  - `summary.selfEvaluation.isSubmittedToEvaluator`가 `true`로 변경되는지 확인 (전체 자기평가가 1개인 경우)
  - `selfEvaluation.isCompleted`는 `false` 유지 확인
  - `summary.completedSelfEvaluations`는 변경 없음 확인

- **1차 평가자 → 관리자 제출 시**:
  - 해당 WBS의 `selfEvaluation.submittedToManager`가 `true`로 변경되는지 확인
  - `selfEvaluation.submittedToManagerAt`이 기록되는지 확인
  - `selfEvaluation.isCompleted`가 `true`로 변경되는지 확인
  - `summary.selfEvaluation.submittedToManagerCount`가 1 증가하는지 확인
  - `summary.completedSelfEvaluations`가 1 증가하는지 확인
  - `summary.selfEvaluation.isSubmittedToManager`가 `true`로 변경되는지 확인 (전체 자기평가가 1개인 경우)
  - `summary.selfEvaluation.totalScore`와 `grade`가 계산되는지 확인 (모든 자기평가 제출 완료 시)

---

### 3. `GET /admin/dashboard/{evaluationPeriodId}/my-assigned-data`
**`getMyAssignedData`**

#### 제출 시 변경되는 필드

`getEmployeeAssignedData`와 동일하지만, 하향평가 정보는 제거됩니다.

#### 검증 시나리오

- `getEmployeeAssignedData`와 동일한 검증 항목 적용
- 추가로 하향평가 정보(`primaryDownwardEvaluation`, `secondaryDownwardEvaluation`)가 제거되어 있는지 확인

---

### 4. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/complete-status`
**`getEmployeeCompleteStatus`**

#### 제출 시 변경되는 필드

```typescript
{
  selfEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalCount: number,                                // ✅ 영향받음 (전체 WBS 할당 수)
    completedCount: number,                           // ✅ 영향받음 (관리자 제출 완료 수)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  },
  projects: {
    items: [
      {
        wbsList: [
          {
            selfEvaluation: {
              // getEmployeeAssignedData와 동일한 필드
            }
          }
        ]
      }
    ]
  }
}
```

#### 검증 시나리오

- `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`의 검증 시나리오 통합
- 두 엔드포인트의 데이터가 일관성 있게 반영되는지 확인

---

### 5. `GET /admin/dashboard/{evaluationPeriodId}/employees/status`
**`getAllEmployeesEvaluationPeriodStatus`**

#### 제출 시 변경되는 필드

응답 배열의 각 항목에서:
```typescript
[
  {
    employeeId: string,
    selfEvaluation: {
      status: 'complete' | 'in_progress' | 'none',      // ✅ 영향받음
      totalMappingCount: number,                       // ✅ 영향받음
      completedMappingCount: number,                  // ✅ 영향받음
      submittedToEvaluatorCount: number,              // ✅ 영향받음
      isSubmittedToEvaluator: boolean,                 // ✅ 영향받음
      submittedToManagerCount: number,                  // ✅ 영향받음
      isSubmittedToManager: boolean,                   // ✅ 영향받음
      totalScore: number | null,                       // ✅ 영향받음
      grade: string | null                             // ✅ 영향받음
    }
  }
]
```

#### 검증 시나리오

- 특정 직원의 자기평가 제출 시 해당 직원의 정보만 업데이트되는지 확인
- 다른 직원의 정보는 영향받지 않는지 확인
- 배열에서 해당 직원 정보를 찾아 필드가 올바르게 반영되는지 확인

---

### 6. `GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status`
**`getMyEvaluationTargetsStatus`**

#### 제출 시 변경되는 필드

응답 배열의 각 항목에서:
```typescript
[
  {
    employeeId: string,
    selfEvaluation: {
      status: 'complete' | 'in_progress' | 'none',      // ✅ 영향받음
      totalMappingCount: number,                       // ✅ 영향받음
      completedMappingCount: number,                  // ✅ 영향받음
      submittedToEvaluatorCount: number,               // ✅ 영향받음
      isSubmittedToEvaluator: boolean,                  // ✅ 영향받음
      submittedToManagerCount: number,                  // ✅ 영향받음
      isSubmittedToManager: boolean,                   // ✅ 영향받음
      totalScore: number | null,                       // ✅ 영향받음
      grade: string | null                             // ✅ 영향받음
    }
  }
]
```

#### 검증 시나리오

- 평가자가 담당하는 피평가자의 자기평가 제출 시 해당 피평가자 정보가 업데이트되는지 확인
- 다른 피평가자의 정보는 영향받지 않는지 확인

---

### 7. `GET /admin/dashboard/{evaluationPeriodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data`
**`getEvaluatorAssignedEmployeesData`**

#### 제출 시 변경되는 필드

`getEmployeeAssignedData`와 동일한 구조를 가집니다.

#### 검증 시나리오

- `getEmployeeAssignedData`와 동일한 검증 항목 적용

---

## 제출 단계별 영향도 요약

### 피평가자 → 1차 평가자 제출 (`submittedToEvaluator = true`)

| 엔드포인트 | 영향받는 필드 | 영향도 |
|-----------|--------------|--------|
| `getEmployeeEvaluationPeriodStatus` | `submittedToEvaluatorCount`, `isSubmittedToEvaluator` | 높음 |
| `getEmployeeAssignedData` | `selfEvaluation.submittedToEvaluator`, `selfEvaluation.submittedToEvaluatorAt`, `summary.selfEvaluation.submittedToEvaluatorCount`, `summary.selfEvaluation.isSubmittedToEvaluator` | 높음 |
| `getMyAssignedData` | 위와 동일 | 높음 |
| `getAllEmployeesEvaluationPeriodStatus` | `selfEvaluation.submittedToEvaluatorCount`, `selfEvaluation.isSubmittedToEvaluator` | 중간 |
| `getMyEvaluationTargetsStatus` | `selfEvaluation.submittedToEvaluatorCount`, `selfEvaluation.isSubmittedToEvaluator` | 중간 |
| `getEmployeeCompleteStatus` | `selfEvaluation` (통합) | 높음 |

### 1차 평가자 → 관리자 제출 (`submittedToManager = true`)

| 엔드포인트 | 영향받는 필드 | 영향도 |
|-----------|--------------|--------|
| `getEmployeeEvaluationPeriodStatus` | `submittedToManagerCount`, `completedMappingCount`, `isSubmittedToManager`, `status`, `totalScore`, `grade` | 높음 |
| `getEmployeeAssignedData` | `selfEvaluation.submittedToManager`, `selfEvaluation.submittedToManagerAt`, `selfEvaluation.isCompleted`, `summary.completedSelfEvaluations`, `summary.selfEvaluation.submittedToManagerCount`, `summary.selfEvaluation.isSubmittedToManager`, `summary.selfEvaluation.totalScore`, `summary.selfEvaluation.grade` | 높음 |
| `getMyAssignedData` | 위와 동일 | 높음 |
| `getAllEmployeesEvaluationPeriodStatus` | `selfEvaluation.submittedToManagerCount`, `selfEvaluation.completedMappingCount`, `selfEvaluation.isSubmittedToManager`, `selfEvaluation.status`, `selfEvaluation.totalScore`, `selfEvaluation.grade` | 중간 |
| `getMyEvaluationTargetsStatus` | 위와 동일 | 중간 |
| `getEmployeeCompleteStatus` | `selfEvaluation` (통합) | 높음 |

---

## 핵심 계산 로직

### 1. 제출 상태 계산

```typescript
// 1차 평가자 제출 여부
const submittedToEvaluatorCount = await count({
  where: {
    periodId,
    employeeId,
    submittedToEvaluator: true,
  }
});

const isSubmittedToEvaluator = 
  totalSelfEvaluations > 0 && 
  submittedToEvaluatorCount === totalSelfEvaluations;

// 관리자 제출 여부 (완료된 자기평가)
const submittedToManagerCount = await count({
  where: {
    periodId,
    employeeId,
    submittedToManager: true,
  }
});

const completedMappingCount = submittedToManagerCount;

const isSubmittedToManager = 
  totalSelfEvaluations > 0 && 
  submittedToManagerCount === totalSelfEvaluations;
```

### 2. 상태 계산

```typescript
// 자기평가 상태
if (totalMappingCount === 0) {
  status = 'none';
} else if (completedMappingCount === totalMappingCount) {
  status = 'complete';  // 모든 자기평가가 관리자에게 제출 완료
} else {
  status = 'in_progress';
}
```

### 3. 점수/등급 계산

```typescript
// 모든 자기평가가 관리자에게 제출 완료된 경우에만 계산
if (totalSelfEvaluations > 0 && completedSelfEvaluations === totalSelfEvaluations) {
  // 가중치 기반 점수 계산 (submittedToManager = true인 자기평가만 사용)
  totalScore = await 가중치_기반_자기평가_점수를_계산한다(
    evaluationPeriodId,
    employeeId,
    // submittedToManager = true인 자기평가만 조회
  );
  
  // 등급 계산
  grade = await 자기평가_등급을_조회한다(evaluationPeriodId, totalScore);
}
```

---

## 종합 검증 시나리오 체크리스트

### 시나리오 1: 피평가자 → 1차 평가자 제출 (단일)

**검증 항목**:
- [ ] `getEmployeeEvaluationPeriodStatus`: `submittedToEvaluatorCount`가 1 증가
- [ ] `getEmployeeEvaluationPeriodStatus`: `isSubmittedToEvaluator`가 `true`로 변경 (전체 자기평가가 1개인 경우)
- [ ] `getEmployeeEvaluationPeriodStatus`: `completedMappingCount`는 변경 없음
- [ ] `getEmployeeEvaluationPeriodStatus`: `status`는 `'in_progress'` 유지
- [ ] `getEmployeeAssignedData`: 해당 WBS의 `selfEvaluation.submittedToEvaluator`가 `true`로 변경
- [ ] `getEmployeeAssignedData`: `selfEvaluation.submittedToEvaluatorAt`이 기록됨
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.submittedToEvaluatorCount`가 1 증가
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.isSubmittedToEvaluator`가 `true`로 변경 (전체 자기평가가 1개인 경우)
- [ ] `getEmployeeAssignedData`: `selfEvaluation.isCompleted`는 `false` 유지
- [ ] `getAllEmployeesEvaluationPeriodStatus`: 해당 직원의 `submittedToEvaluatorCount` 증가 확인
- [ ] `getEmployeeCompleteStatus`: 통합 응답에서 위 항목들이 일관되게 반영

### 시나리오 2: 1차 평가자 → 관리자 제출 (단일)

**검증 항목**:
- [ ] `getEmployeeEvaluationPeriodStatus`: `submittedToManagerCount`가 1 증가
- [ ] `getEmployeeEvaluationPeriodStatus`: `completedMappingCount`가 1 증가
- [ ] `getEmployeeEvaluationPeriodStatus`: `isSubmittedToManager`가 `true`로 변경 (전체 자기평가가 1개인 경우)
- [ ] `getEmployeeEvaluationPeriodStatus`: `status`가 `'complete'`로 변경 (모든 자기평가 제출 완료 시)
- [ ] `getEmployeeEvaluationPeriodStatus`: `totalScore`와 `grade`가 계산됨 (모든 자기평가 제출 완료 시)
- [ ] `getEmployeeAssignedData`: 해당 WBS의 `selfEvaluation.submittedToManager`가 `true`로 변경
- [ ] `getEmployeeAssignedData`: `selfEvaluation.submittedToManagerAt`이 기록됨
- [ ] `getEmployeeAssignedData`: `selfEvaluation.isCompleted`가 `true`로 변경
- [ ] `getEmployeeAssignedData`: `summary.completedSelfEvaluations`가 1 증가
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.submittedToManagerCount`가 1 증가
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.isSubmittedToManager`가 `true`로 변경 (전체 자기평가가 1개인 경우)
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.totalScore`와 `grade`가 계산됨 (모든 자기평가 제출 완료 시)
- [ ] `getAllEmployeesEvaluationPeriodStatus`: 해당 직원의 `completedMappingCount` 증가 확인
- [ ] `getEmployeeCompleteStatus`: 통합 응답에서 위 항목들이 일관되게 반영

### 시나리오 3: 전체 자기평가 일괄 제출 (피평가자 → 1차 평가자)

**검증 항목**:
- [ ] 모든 WBS의 `selfEvaluation.submittedToEvaluator`가 `true`로 변경
- [ ] 모든 WBS의 `selfEvaluation.submittedToEvaluatorAt`이 기록됨
- [ ] `summary.selfEvaluation.submittedToEvaluatorCount`가 전체 자기평가 수와 동일해짐
- [ ] `summary.selfEvaluation.isSubmittedToEvaluator`가 `true`로 변경
- [ ] `selfEvaluation.status`는 `'in_progress'` 유지 (관리자 제출 전)

### 시나리오 4: 전체 자기평가 일괄 제출 (1차 평가자 → 관리자)

**검증 항목**:
- [ ] 모든 WBS의 `selfEvaluation.submittedToManager`가 `true`로 변경
- [ ] 모든 WBS의 `selfEvaluation.submittedToManagerAt`이 기록됨
- [ ] 모든 WBS의 `selfEvaluation.isCompleted`가 `true`로 변경
- [ ] `summary.completedSelfEvaluations`가 전체 자기평가 수와 동일해짐
- [ ] `summary.selfEvaluation.submittedToManagerCount`가 전체 자기평가 수와 동일해짐
- [ ] `summary.selfEvaluation.isSubmittedToManager`가 `true`로 변경
- [ ] `selfEvaluation.status`가 `'complete'`로 변경
- [ ] `summary.selfEvaluation.totalScore`와 `grade`가 계산됨

### 시나리오 5: 프로젝트별 자기평가 제출

**검증 항목**:
- [ ] 해당 프로젝트의 WBS만 제출 상태가 변경됨
- [ ] 다른 프로젝트의 WBS는 영향받지 않음
- [ ] `summary.completedSelfEvaluations`가 증가하지만 일부만 증가
- [ ] `summary.selfEvaluation.isSubmittedToManager`는 `false` 유지 (일부만 제출)

---

## 주의사항

1. **2단계 제출 프로세스**:
   - 피평가자 → 1차 평가자 제출 후에만 1차 평가자 → 관리자 제출 가능
   - 1차 평가자 제출 없이 관리자 제출 시도 시 에러 발생

2. **점수 계산 조건**:
   - `totalScore`와 `grade`는 모든 자기평가가 관리자에게 제출되어야 계산됨
   - 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
   - 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨
   - 점수 계산 시 `submittedToManager = true`인 자기평가만 사용

3. **상태 전환**:
   - `status: 'none'` → `'in_progress'` → `'complete'`
   - `'complete'`는 모든 자기평가가 관리자에게 제출된 상태
   - 일부만 제출된 경우 `'in_progress'`
   - 1차 평가자 제출만 완료된 경우도 `'in_progress'` (관리자 제출 전)

4. **제출 상태 관리**:
   - `isCompleted`는 관리자 제출 여부를 나타냄 (`submittedToManager = true`)
   - `submittedToEvaluator`는 1차 평가자 제출 여부를 나타냄
   - 두 제출 상태는 독립적으로 관리됨

5. **데이터 일관성**:
   - 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
   - `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수

---

## 테스트 작성 가이드

1. **Before/After 비교**: 자기평가 제출 전후로 각 엔드포인트를 호출하여 비교
2. **2단계 제출 검증**: 피평가자 → 1차 평가자 제출 후, 1차 평가자 → 관리자 제출까지 전체 프로세스 검증
3. **다중 엔드포인트 검증**: 하나의 제출에 대해 여러 엔드포인트를 모두 검증
4. **엣지 케이스**: 모든 자기평가 제출 완료, 일부만 제출, 프로젝트별 제출 등의 케이스 검증
5. **데이터 정합성**: `summary`의 집계 값과 개별 WBS 데이터의 일관성 확인

