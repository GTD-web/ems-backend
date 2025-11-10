# 하향평가 변경 시 Dashboard API 영향 분석

## 개요

하향평가(1차/2차)가 **입력/수정/제출/초기화** 되었을 때, `dashboard.controller.ts`의 각 엔드포인트에서 영향받는 필드와 검증 항목을 정리합니다.

---

## 영향받는 엔드포인트 및 필드

### 1. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}` 
**`getEmployeeEvaluationPeriodStatus`**

#### 영향받는 필드

```typescript
{
  primaryDownwardEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalMappingCount: number,                          // ✅ 영향받음 (전체 WBS 할당 수)
    completedMappingCount: number,                      // ✅ 영향받음 (제출된 1차 하향평가 수)
    isEditable: boolean,                                // ⚠️ editableStatus에서 가져옴 (간접 영향)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  },
  secondaryDownwardEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalMappingCount: number,                          // ✅ 영향받음 (전체 WBS 할당 수)
    completedMappingCount: number,                      // ✅ 영향받음 (제출된 2차 하향평가 수)
    isEditable: boolean,                                // ⚠️ editableStatus에서 가져옴 (간접 영향)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  }
}
```

#### 검증 시나리오

- **1차 하향평가 입력 시**:
  - `primaryDownwardEvaluation.status`가 `'in_progress'` 또는 `'complete'`로 변경되는지 확인
  - `primaryDownwardEvaluation.completedMappingCount`가 증가하는지 확인 (제출된 경우)
  - `primaryDownwardEvaluation.totalScore`와 `grade`가 계산되는지 확인 (모든 1차 하향평가 제출 완료 시)

- **1차 하향평가 제출 시**:
  - `primaryDownwardEvaluation.completedMappingCount`가 증가하는지 확인
  - `primaryDownwardEvaluation.status`가 `'complete'`로 변경되는지 확인 (모든 1차 하향평가 제출 완료 시)
  - `primaryDownwardEvaluation.totalScore`와 `grade`가 계산되는지 확인

- **1차 하향평가 미제출 처리 시**:
  - `primaryDownwardEvaluation.completedMappingCount`가 감소하는지 확인
  - `primaryDownwardEvaluation.status`가 `'in_progress'`로 변경되는지 확인 (일부만 미제출 처리된 경우)
  - `primaryDownwardEvaluation.totalScore`와 `grade`가 재계산되거나 `null`로 변경되는지 확인

- **2차 하향평가도 동일한 검증 수행** (secondaryDownwardEvaluation 객체)

---

### 2. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data`
**`getEmployeeAssignedData`**

#### 영향받는 필드

```typescript
{
  projects: [
    {
      wbsList: [
        {
          primaryDownwardEvaluation: {
            primaryDownwardEvaluationId?: string,       // ✅ 영향받음
            evaluationContent?: string,                 // ✅ 영향받음
            score?: number,                             // ✅ 영향받음
            isCompleted: boolean,                       // ✅ 영향받음 (제출 여부)
            isEditable: boolean,                        // ⚠️ editableStatus에서 가져옴 (간접 영향)
            submittedAt?: Date,                        // ✅ 영향받음 (제출 시)
            evaluatorId?: string,                      // ✅ 영향받음
            evaluatorName?: string                     // ✅ 영향받음
          },
          secondaryDownwardEvaluation: {
            secondaryDownwardEvaluationId?: string,     // ✅ 영향받음
            evaluationContent?: string,                 // ✅ 영향받음
            score?: number,                             // ✅ 영향받음
            isCompleted: boolean,                       // ✅ 영향받음 (제출 여부)
            isEditable: boolean,                        // ⚠️ editableStatus에서 가져옴 (간접 영향)
            submittedAt?: Date,                        // ✅ 영향받음 (제출 시)
            evaluatorId?: string,                      // ✅ 영향받음
            evaluatorName?: string                     // ✅ 영향받음
          }
        }
      ]
    }
  ],
  summary: {
    completedPrimaryDownwardEvaluations: number,        // ✅ 영향받음 (제출된 1차 하향평가 수)
    completedSecondaryDownwardEvaluations: number,      // ✅ 영향받음 (제출된 2차 하향평가 수)
    primaryDownwardEvaluation: {
      totalScore: number | null,                       // ✅ 영향받음 (가중치 기반 총점)
      grade: string | null                             // ✅ 영향받음 (등급)
    },
    secondaryDownwardEvaluation: {
      totalScore: number | null,                       // ✅ 영향받음 (가중치 기반 총점)
      grade: string | null                             // ✅ 영향받음 (등급)
    }
  }
}
```

#### 검증 시나리오

- **1차 하향평가 입력 시**:
  - 해당 WBS의 `projects[].wbsList[].primaryDownwardEvaluation.primaryDownwardEvaluationId`가 생성되는지 확인
  - `projects[].wbsList[].primaryDownwardEvaluation.evaluationContent`가 반영되는지 확인
  - `projects[].wbsList[].primaryDownwardEvaluation.score`가 반영되는지 확인
  - `projects[].wbsList[].primaryDownwardEvaluation.isCompleted`가 `false`인지 확인 (미제출 상태)
  - `summary.completedPrimaryDownwardEvaluations`가 변경되지 않는지 확인 (제출 전)

- **1차 하향평가 제출 시**:
  - `projects[].wbsList[].primaryDownwardEvaluation.isCompleted`가 `true`로 변경되는지 확인
  - `projects[].wbsList[].primaryDownwardEvaluation.submittedAt`이 기록되는지 확인
  - `summary.completedPrimaryDownwardEvaluations`가 증가하는지 확인
  - `summary.primaryDownwardEvaluation.totalScore`와 `grade`가 계산되는지 확인 (모든 1차 하향평가 제출 완료 시)

- **1차 하향평가 수정 시**:
  - `projects[].wbsList[].primaryDownwardEvaluation.evaluationContent`가 업데이트되는지 확인
  - `projects[].wbsList[].primaryDownwardEvaluation.score`가 업데이트되는지 확인
  - 제출된 상태에서 수정 시 `isCompleted`가 유지되는지 확인 (제출 상태 유지)

- **1차 하향평가 미제출 처리 시**:
  - `projects[].wbsList[].primaryDownwardEvaluation.isCompleted`가 `false`로 변경되는지 확인
  - 제출 상태였던 경우 `evaluationContent`와 `score`가 유지되는지 확인
  - `summary.completedPrimaryDownwardEvaluations`가 감소하는지 확인
  - `summary.primaryDownwardEvaluation.totalScore`와 `grade`가 재계산되거나 `null`로 변경되는지 확인

- **2차 하향평가도 동일한 검증 수행** (secondaryDownwardEvaluation 객체)

---

### 3. `GET /admin/dashboard/{evaluationPeriodId}/my-assigned-data`
**`getMyAssignedData`**

#### 영향받는 필드

`getEmployeeAssignedData`와 동일하지만, 평가자 정보가 자신인 경우에만 표시됩니다.

#### 검증 시나리오

- `getEmployeeAssignedData`와 동일한 검증 항목 적용
- 현재 로그인한 사용자가 평가자인 경우에만 하향평가 정보 표시 확인

---

### 4. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/complete-status`
**`getEmployeeCompleteStatus`**

#### 영향받는 필드

```typescript
{
  primaryDownwardEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalCount: number,                                // ✅ 영향받음 (전체 WBS 할당 수)
    completedCount: number,                             // ✅ 영향받음 (제출된 1차 하향평가 수)
    isEditable: boolean,                               // ⚠️ editableStatus에서 가져옴 (간접 영향)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  },
  secondaryDownwardEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalCount: number,                                // ✅ 영향받음 (전체 WBS 할당 수)
    completedCount: number,                             // ✅ 영향받음 (제출된 2차 하향평가 수)
    isEditable: boolean,                               // ⚠️ editableStatus에서 가져옴 (간접 영향)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  },
  projects: {
    items: [
      {
        wbsList: [
          {
            primaryDownwardEvaluation: {
              // getEmployeeAssignedData와 동일한 필드
            },
            secondaryDownwardEvaluation: {
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

#### 영향받는 필드

응답 배열의 각 항목에서:
```typescript
[
  {
    employeeId: string,
    primaryDownwardEvaluation: {
      status: 'complete' | 'in_progress' | 'none',      // ✅ 영향받음
      totalMappingCount: number,                       // ✅ 영향받음
      completedMappingCount: number,                   // ✅ 영향받음
      isEditable: boolean,                             // ⚠️ editableStatus에서 가져옴
      totalScore: number | null,                       // ✅ 영향받음
      grade: string | null                             // ✅ 영향받음
    },
    secondaryDownwardEvaluation: {
      status: 'complete' | 'in_progress' | 'none',      // ✅ 영향받음
      totalMappingCount: number,                       // ✅ 영향받음
      completedMappingCount: number,                   // ✅ 영향받음
      isEditable: boolean,                             // ⚠️ editableStatus에서 가져옴
      totalScore: number | null,                       // ✅ 영향받음
      grade: string | null                             // ✅ 영향받음
    }
  }
]
```

#### 검증 시나리오

- 특정 직원의 하향평가 변경 시 해당 직원의 정보만 업데이트되는지 확인
- 다른 직원의 정보는 영향받지 않는지 확인
- 배열에서 해당 직원 정보를 찾아 필드가 올바르게 반영되는지 확인

---

### 6. `GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status`
**`getMyEvaluationTargetsStatus`**

#### 영향받는 필드

응답 배열의 각 항목에서:
```typescript
[
  {
    employeeId: string,
    primaryDownwardEvaluation: {
      status: 'complete' | 'in_progress' | 'none',      // ✅ 영향받음
      totalMappingCount: number,                       // ✅ 영향받음
      completedMappingCount: number,                   // ✅ 영향받음
      isEditable: boolean,                             // ⚠️ editableStatus에서 가져옴
      totalScore: number | null,                       // ✅ 영향받음
      grade: string | null                             // ✅ 영향받음
    },
    secondaryDownwardEvaluation: {
      status: 'complete' | 'in_progress' | 'none',      // ✅ 영향받음
      totalMappingCount: number,                       // ✅ 영향받음
      completedMappingCount: number,                   // ✅ 영향받음
      isEditable: boolean,                             // ⚠️ editableStatus에서 가져옴
      totalScore: number | null,                       // ✅ 영향받음
      grade: string | null                             // ✅ 영향받음
    }
  }
]
```

#### 검증 시나리오

- 평가자가 담당하는 피평가자의 하향평가 상태 변경 시 해당 피평가자의 정보가 업데이트되는지 확인
- 평가자가 1차 하향평가를 작성할 경우 primaryDownwardEvaluation 필드가 업데이트되는지 확인
- 평가자가 2차 하향평가를 작성할 경우 secondaryDownwardEvaluation 필드가 업데이트되는지 확인
- 다른 평가자의 평가는 영향받지 않는지 확인

---

## 종합 검증 시나리오 체크리스트

### 시나리오 1: 1차 하향평가 입력 (신규 생성)

**검증 항목**:
- [ ] `getEmployeeEvaluationPeriodStatus`: `primaryDownwardEvaluation.status`가 `'in_progress'`로 변경
- [ ] `getEmployeeEvaluationPeriodStatus`: `primaryDownwardEvaluation.completedMappingCount`는 변경 없음 (미제출)
- [ ] `getEmployeeAssignedData`: 해당 WBS의 `primaryDownwardEvaluation` 객체가 생성되고 내용/점수 반영
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.isCompleted`가 `false`
- [ ] `getEmployeeAssignedData`: `summary.completedPrimaryDownwardEvaluations`는 변경 없음
- [ ] `getAllEmployeesEvaluationPeriodStatus`: 해당 직원의 `primaryDownwardEvaluation.status`가 `'in_progress'`
- [ ] `getMyEvaluationTargetsStatus`: 평가자의 담당 대상자 목록에서 해당 직원의 `primaryDownwardEvaluation.status`가 `'in_progress'`
- [ ] `getEmployeeCompleteStatus`: 통합 응답에서 위 항목들이 일관되게 반영

### 시나리오 2: 1차 하향평가 제출 (단일)

**검증 항목**:
- [ ] `getEmployeeEvaluationPeriodStatus`: `primaryDownwardEvaluation.completedMappingCount`가 1 증가
- [ ] `getEmployeeEvaluationPeriodStatus`: `primaryDownwardEvaluation.status`가 `'complete'`로 변경 (모든 1차 하향평가 제출 완료 시)
- [ ] `getEmployeeAssignedData`: 해당 WBS의 `primaryDownwardEvaluation.isCompleted`가 `true`
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.submittedAt`이 기록됨
- [ ] `getEmployeeAssignedData`: `summary.completedPrimaryDownwardEvaluations`가 1 증가
- [ ] `getEmployeeAssignedData`: `summary.primaryDownwardEvaluation.totalScore`와 `grade`가 계산됨 (모든 1차 하향평가 제출 완료 시)
- [ ] `getAllEmployeesEvaluationPeriodStatus`: 해당 직원의 `completedMappingCount` 증가 확인
- [ ] `getMyEvaluationTargetsStatus`: 평가자의 담당 대상자 목록에서 해당 직원의 `completedMappingCount` 증가 확인
- [ ] `getEmployeeCompleteStatus`: 통합 응답에서 위 항목들이 일관되게 반영

### 시나리오 3: 1차 하향평가 수정 (제출 전)

**검증 항목**:
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.evaluationContent`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.score`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.isCompleted`는 `false` 유지
- [ ] `getEmployeeEvaluationPeriodStatus`: `primaryDownwardEvaluation.completedMappingCount`는 변경 없음

### 시나리오 4: 1차 하향평가 수정 (제출 후)

**검증 항목**:
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.evaluationContent`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.score`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.isCompleted`는 `true` 유지 (제출 상태 유지)
- [ ] `getEmployeeAssignedData`: `summary.primaryDownwardEvaluation.totalScore`와 `grade`가 재계산됨

### 시나리오 5: 1차 하향평가 미제출 처리 (Reset)

**검증 항목**:
- [ ] `getEmployeeAssignedData`: `primaryDownwardEvaluation.isCompleted`가 `false`로 변경
- [ ] 제출 상태였던 경우 `evaluationContent`와 `score`가 유지됨
- [ ] `getEmployeeEvaluationPeriodStatus`: `primaryDownwardEvaluation.completedMappingCount`가 감소 (제출 상태였던 경우)
- [ ] `getEmployeeAssignedData`: `summary.completedPrimaryDownwardEvaluations`가 감소
- [ ] `summary.primaryDownwardEvaluation.totalScore`와 `grade`가 재계산되거나 `null`로 변경

### 시나리오 6: 전체 1차 하향평가 일괄 제출

**검증 항목**:
- [ ] 모든 WBS의 `primaryDownwardEvaluation.isCompleted`가 `true`로 변경
- [ ] 모든 WBS의 `primaryDownwardEvaluation.submittedAt`이 기록됨
- [ ] `summary.completedPrimaryDownwardEvaluations`가 전체 WBS 수와 동일해짐
- [ ] `primaryDownwardEvaluation.status`가 `'complete'`로 변경
- [ ] `summary.primaryDownwardEvaluation.totalScore`와 `grade`가 계산됨

### 시나리오 7: 2차 하향평가 관련 시나리오

- [ ] 시나리오 1~6과 동일한 검증을 `secondaryDownwardEvaluation` 객체에 대해 수행
- [ ] 1차 하향평가와 2차 하향평가는 독립적으로 관리되는지 확인
- [ ] 1차 하향평가 변경 시 2차 하향평가에 영향이 없는지 확인
- [ ] 2차 하향평가 변경 시 1차 하향평가에 영향이 없는지 확인

### 시나리오 8: 수정 가능 상태 변경과의 연동

**검증 항목**:
- [ ] `editableStatus.isPrimaryDownwardEvaluationEditable`가 `false`일 때는 1차 하향평가 수정 불가
- [ ] `editableStatus.isSecondaryDownwardEvaluationEditable`가 `false`일 때는 2차 하향평가 수정 불가
- [ ] `isEditable` 필드가 `editableStatus`의 해당 값과 일치하는지 확인

---

## 주의사항

1. **점수 계산 로직**:
   - `totalScore`와 `grade`는 **모든 해당 유형의 하향평가가 제출되어야** 계산됨
   - 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
   - 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨
   - 1차 하향평가와 2차 하향평가는 독립적으로 계산됨

2. **상태 전환**:
   - `status: 'none'` → `'in_progress'` → `'complete'`
   - `'complete'`는 모든 해당 유형의 하향평가가 제출된 상태
   - 일부만 제출된 경우 `'in_progress'`
   - 1차 하향평가와 2차 하향평가는 각각 독립적인 상태를 가짐

3. **제출 상태 관리**:
   - `isCompleted`는 제출 여부를 나타냄
   - 미제출 처리(`Reset`) 시:
     - 제출 상태(`isCompleted`)만 false로 변경됨
     - 내용(`evaluationContent`, `score`)은 유지됨

4. **데이터 일관성**:
   - 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
   - `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수
   - 1차 하향평가와 2차 하향평가는 별도로 관리되므로 각각의 일관성을 확인해야 함

5. **평가자 정보**:
   - 1차 하향평가와 2차 하향평가는 각각 다른 평가자가 작성할 수 있음
   - 평가자 정보(`evaluatorId`, `evaluatorName`)는 평가라인에서 매핑된 정보를 사용함

6. **자기평가와의 연동**:
   - 하향평가는 자기평가와 연동되어야 함 (`selfEvaluationId`)
   - 자기평가가 제출되지 않은 경우 하향평가 작성 불가
   - 자기평가와 하향평가는 독립적으로 관리되지만 연동 관계를 유지해야 함

---

## 테스트 작성 가이드

1. **Before/After 비교**: 하향평가 변경 전후로 각 엔드포인트를 호출하여 비교
2. **다중 엔드포인트 검증**: 하나의 변경에 대해 여러 엔드포인트를 모두 검증
3. **엣지 케이스**: 모든 하향평가 제출 완료, 일부만 제출, 초기화 등의 케이스 검증
4. **데이터 정합성**: `summary`의 집계 값과 개별 WBS 데이터의 일관성 확인
5. **1차/2차 독립성 검증**: 1차 하향평가 변경 시 2차 하향평가에 영향이 없는지, 그 반대도 확인
6. **평가자별 독립성 검증**: 한 평가자의 하향평가 변경이 다른 평가자의 하향평가에 영향이 없는지 확인









