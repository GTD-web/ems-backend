# WBS 자기평가 변경 시 Dashboard API 영향 분석

## 개요

WBS 자기평가가 **입력/수정/제출/초기화** 되었을 때, `dashboard.controller.ts`의 각 엔드포인트에서 영향받는 필드와 검증 항목을 정리합니다.

---

## 영향받는 엔드포인트 및 필드

### 1. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}` 
**`getEmployeeEvaluationPeriodStatus`**

#### 영향받는 필드

```typescript
{
  selfEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalMappingCount: number,                          // ✅ 영향받음 (전체 WBS 할당 수)
    completedMappingCount: number,                      // ✅ 영향받음 (제출된 자기평가 수)
    isEditable: boolean,                                // ⚠️ editableStatus에서 가져옴 (간접 영향)
    totalScore: number | null,                         // ✅ 영향받음 (가중치 기반 총점)
    grade: string | null                               // ✅ 영향받음 (등급)
  }
}
```

#### 검증 시나리오

- **자기평가 입력 시**:
  - `selfEvaluation.status`가 `'in_progress'` 또는 `'complete'`로 변경되는지 확인
  - `selfEvaluation.completedMappingCount`가 증가하는지 확인 (제출된 경우)
  - `selfEvaluation.totalScore`와 `grade`가 계산되는지 확인 (모든 자기평가 제출 완료 시)

- **자기평가 제출 시**:
  - `selfEvaluation.completedMappingCount`가 증가하는지 확인
  - `selfEvaluation.status`가 `'complete'`로 변경되는지 확인 (모든 자기평가 제출 완료 시)
  - `selfEvaluation.totalScore`와 `grade`가 계산되는지 확인

- **자기평가 내용 초기화 시**:
  - `selfEvaluation.completedMappingCount`가 감소하는지 확인 (제출 상태였던 경우)
  - `selfEvaluation.status`가 `'in_progress'`로 변경되는지 확인 (일부만 초기화된 경우)
  - `selfEvaluation.totalScore`와 `grade`가 재계산되거나 `null`로 변경되는지 확인

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
          selfEvaluation: {
            selfEvaluationId?: string,                  // ✅ 영향받음
            evaluationContent?: string,                 // ✅ 영향받음
            score?: number,                             // ✅ 영향받음
            isCompleted: boolean,                       // ✅ 영향받음 (제출 여부)
            isEditable: boolean,                        // ⚠️ editableStatus에서 가져옴 (간접 영향)
            submittedAt?: Date                         // ✅ 영향받음 (제출 시)
          }
        }
      ]
    }
  ],
  summary: {
    completedSelfEvaluations: number,                   // ✅ 영향받음 (제출된 자기평가 수)
    selfEvaluation: {
      totalScore: number | null,                       // ✅ 영향받음 (가중치 기반 총점)
      grade: string | null                             // ✅ 영향받음 (등급)
    }
  }
}
```

#### 검증 시나리오

- **자기평가 입력 시**:
  - 해당 WBS의 `projects[].wbsList[].selfEvaluation.selfEvaluationId`가 생성되는지 확인
  - `projects[].wbsList[].selfEvaluation.evaluationContent`가 반영되는지 확인
  - `projects[].wbsList[].selfEvaluation.score`가 반영되는지 확인
  - `projects[].wbsList[].selfEvaluation.isCompleted`가 `false`인지 확인 (미제출 상태)
  - `summary.completedSelfEvaluations`가 변경되지 않는지 확인 (제출 전)

- **자기평가 제출 시**:
  - `projects[].wbsList[].selfEvaluation.isCompleted`가 `true`로 변경되는지 확인
  - `projects[].wbsList[].selfEvaluation.submittedAt`이 기록되는지 확인
  - `summary.completedSelfEvaluations`가 증가하는지 확인
  - `summary.selfEvaluation.totalScore`와 `grade`가 계산되는지 확인 (모든 자기평가 제출 완료 시)

- **자기평가 수정 시**:
  - `projects[].wbsList[].selfEvaluation.evaluationContent`가 업데이트되는지 확인
  - `projects[].wbsList[].selfEvaluation.score`가 업데이트되는지 확인
  - 제출된 상태에서 수정 시 `isCompleted`가 유지되는지 확인 (제출 상태 유지)

- **자기평가 내용 초기화 시**:
  - `projects[].wbsList[].selfEvaluation.evaluationContent`가 `null`로 변경되는지 확인
  - `projects[].wbsList[].selfEvaluation.score`가 `null`로 변경되는지 확인
  - 제출 상태였던 경우 `isCompleted`가 `false`로 변경되고 `submittedAt`이 `null`로 변경되는지 확인
  - `summary.completedSelfEvaluations`가 감소하는지 확인
  - `summary.selfEvaluation.totalScore`와 `grade`가 재계산되거나 `null`로 변경되는지 확인

---

### 3. `GET /admin/dashboard/{evaluationPeriodId}/my-assigned-data`
**`getMyAssignedData`**

#### 영향받는 필드

`getEmployeeAssignedData`와 동일하지만, 하향평가 정보는 제거됩니다.

#### 검증 시나리오

- `getEmployeeAssignedData`와 동일한 검증 항목 적용
- 추가로 하향평가 정보(`primaryDownwardEvaluation`, `secondaryDownwardEvaluation`)가 제거되어 있는지 확인

---

### 4. `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/complete-status`
**`getEmployeeCompleteStatus`**

#### 영향받는 필드

```typescript
{
  selfEvaluation: {
    status: 'complete' | 'in_progress' | 'none',        // ✅ 영향받음
    totalCount: number,                                // ✅ 영향받음 (전체 WBS 할당 수)
    completedCount: number,                             // ✅ 영향받음 (제출된 자기평가 수)
    isEditable: boolean,                               // ⚠️ editableStatus에서 가져옴 (간접 영향)
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

#### 영향받는 필드

응답 배열의 각 항목에서:
```typescript
[
  {
    employeeId: string,
    selfEvaluation: {
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

- 특정 직원의 자기평가 변경 시 해당 직원의 정보만 업데이트되는지 확인
- 다른 직원의 정보는 영향받지 않는지 확인
- 배열에서 해당 직원 정보를 찾아 필드가 올바르게 반영되는지 확인

---

### 6. `GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status`
**`getMyEvaluationTargetsStatus`**

#### 영향받는 필드

**이 엔드포인트는 자기평가 정보를 포함하지 않습니다.** 평가자가 자신이 담당하는 피평가자들의 현황을 조회하는 엔드포인트이므로, 자기평가 변경 시 직접적인 영향은 없습니다.

#### 검증 시나리오

- 자기평가 변경 시 이 엔드포인트의 응답이 변경되지 않는지 확인 (간접 영향 없음)

---

## 종합 검증 시나리오 체크리스트

### 시나리오 1: 자기평가 입력 (신규 생성)

**검증 항목**:
- [ ] `getEmployeeEvaluationPeriodStatus`: `selfEvaluation.status`가 `'in_progress'`로 변경
- [ ] `getEmployeeEvaluationPeriodStatus`: `selfEvaluation.completedMappingCount`는 변경 없음 (미제출)
- [ ] `getEmployeeAssignedData`: 해당 WBS의 `selfEvaluation` 객체가 생성되고 내용/점수 반영
- [ ] `getEmployeeAssignedData`: `selfEvaluation.isCompleted`가 `false`
- [ ] `getEmployeeAssignedData`: `summary.completedSelfEvaluations`는 변경 없음
- [ ] `getAllEmployeesEvaluationPeriodStatus`: 해당 직원의 `selfEvaluation.status`가 `'in_progress'`
- [ ] `getEmployeeCompleteStatus`: 통합 응답에서 위 항목들이 일관되게 반영

### 시나리오 2: 자기평가 제출 (단일)

**검증 항목**:
- [ ] `getEmployeeEvaluationPeriodStatus`: `selfEvaluation.completedMappingCount`가 1 증가
- [ ] `getEmployeeEvaluationPeriodStatus`: `selfEvaluation.status`가 `'complete'`로 변경 (모든 자기평가 제출 완료 시)
- [ ] `getEmployeeAssignedData`: 해당 WBS의 `selfEvaluation.isCompleted`가 `true`
- [ ] `getEmployeeAssignedData`: `selfEvaluation.submittedAt`이 기록됨
- [ ] `getEmployeeAssignedData`: `summary.completedSelfEvaluations`가 1 증가
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.totalScore`와 `grade`가 계산됨 (모든 자기평가 제출 완료 시)
- [ ] `getAllEmployeesEvaluationPeriodStatus`: 해당 직원의 `completedMappingCount` 증가 확인
- [ ] `getEmployeeCompleteStatus`: 통합 응답에서 위 항목들이 일관되게 반영

### 시나리오 3: 자기평가 수정 (제출 전)

**검증 항목**:
- [ ] `getEmployeeAssignedData`: `selfEvaluation.evaluationContent`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `selfEvaluation.score`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `selfEvaluation.isCompleted`는 `false` 유지
- [ ] `getEmployeeEvaluationPeriodStatus`: `selfEvaluation.completedMappingCount`는 변경 없음

### 시나리오 4: 자기평가 수정 (제출 후)

**검증 항목**:
- [ ] `getEmployeeAssignedData`: `selfEvaluation.evaluationContent`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `selfEvaluation.score`가 업데이트됨
- [ ] `getEmployeeAssignedData`: `selfEvaluation.isCompleted`는 `true` 유지 (제출 상태 유지)
- [ ] `getEmployeeAssignedData`: `summary.selfEvaluation.totalScore`와 `grade`가 재계산됨

### 시나리오 5: 자기평가 내용 초기화 (Clear)

**검증 항목**:
- [ ] `getEmployeeAssignedData`: `selfEvaluation.evaluationContent`가 `null`로 변경
- [ ] `getEmployeeAssignedData`: `selfEvaluation.score`가 `null`로 변경
- [ ] 제출 상태였던 경우 `isCompleted`가 `false`로 변경
- [ ] 제출 상태였던 경우 `submittedAt`이 `null`로 변경
- [ ] `getEmployeeEvaluationPeriodStatus`: `selfEvaluation.completedMappingCount`가 감소 (제출 상태였던 경우)
- [ ] `getEmployeeAssignedData`: `summary.completedSelfEvaluations`가 감소
- [ ] `summary.selfEvaluation.totalScore`와 `grade`가 재계산되거나 `null`로 변경

### 시나리오 6: 전체 자기평가 일괄 제출

**검증 항목**:
- [ ] 모든 WBS의 `selfEvaluation.isCompleted`가 `true`로 변경
- [ ] 모든 WBS의 `selfEvaluation.submittedAt`이 기록됨
- [ ] `summary.completedSelfEvaluations`가 전체 WBS 수와 동일해짐
- [ ] `selfEvaluation.status`가 `'complete'`로 변경
- [ ] `summary.selfEvaluation.totalScore`와 `grade`가 계산됨

### 시나리오 7: 프로젝트별 자기평가 제출

**검증 항목**:
- [ ] 해당 프로젝트의 WBS만 `isCompleted`가 `true`로 변경
- [ ] 다른 프로젝트의 WBS는 영향받지 않음
- [ ] `summary.completedSelfEvaluations`가 증가하지만 일부만 증가

### 시나리오 8: 수정 가능 상태 변경과의 연동

**검증 항목**:
- [ ] `editableStatus.isSelfEvaluationEditable`가 `false`일 때는 자기평가 수정 불가
- [ ] `isEditable` 필드가 `editableStatus.isSelfEvaluationEditable` 값과 일치하는지 확인

---

## 주의사항

1. **점수 계산 로직**:
   - `totalScore`와 `grade`는 모든 자기평가가 제출되어야 계산됨
   - 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
   - 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨

2. **상태 전환**:
   - `status: 'none'` → `'in_progress'` → `'complete'`
   - `'complete'`는 모든 자기평가가 제출된 상태
   - 일부만 제출된 경우 `'in_progress'`

3. **제출 상태 관리**:
   - `isCompleted`는 제출 여부를 나타냄
   - 내용 초기화(`Clear`) 시 제출 상태도 함께 초기화됨
   - 미제출 처리(`Reset`) 시에도 제출 상태만 변경되고 내용은 유지

4. **데이터 일관성**:
   - 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
   - `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수

---

## 테스트 작성 가이드

1. **Before/After 비교**: 자기평가 변경 전후로 각 엔드포인트를 호출하여 비교
2. **다중 엔드포인트 검증**: 하나의 변경에 대해 여러 엔드포인트를 모두 검증
3. **엣지 케이스**: 모든 자기평가 제출 완료, 일부만 제출, 초기화 등의 케이스 검증
4. **데이터 정합성**: `summary`의 집계 값과 개별 WBS 데이터의 일관성 확인

