# WBS 자기평가 Reset 테스트 워크플로우

## 정상적인 제출 및 초기화 흐름

### 1단계: 자기평가 작성 (Upsert)
**엔드포인트**: `POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}`

**요청 Body**:
```json
{
  "selfEvaluationContent": "자기평가 내용",
  "selfEvaluationScore": 100,
  "performanceResult": "성과 결과"
}
```

**응답 확인**:
```json
{
  "id": "평가ID",
  "submittedToEvaluator": false,  // ← 아직 미제출
  "submittedToManager": false     // ← 아직 미제출
}
```

---

### 2단계: 1차 평가자에게 제출 (Submit to Evaluator)
**엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator`

**응답 확인**:
```json
{
  "id": "평가ID",
  "submittedToEvaluator": true,       // ← 제출됨 ✅
  "submittedToEvaluatorAt": "2024-01-15T10:00:00Z",
  "submittedToManager": false         // ← 아직 관리자에게는 미제출
}
```

---

### 3단계: 관리자에게 제출 (Submit to Manager)
**엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit`

**응답 확인**:
```json
{
  "id": "평가ID",
  "submittedToEvaluator": true,
  "submittedToEvaluatorAt": "2024-01-15T10:00:00Z",
  "submittedToManager": true,         // ← 관리자에게 제출됨 ✅
  "submittedToManagerAt": "2024-01-15T15:00:00Z"
}
```

---

### 4단계: 초기화 (Reset) - **이제 가능!**
**엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/reset`

**응답 (성공)**:
```json
{
  "resetCount": 1,              // ← 1개 초기화됨 ✅
  "failedCount": 0,
  "totalCount": 1,
  "resetEvaluations": [
    {
      "evaluationId": "평가ID",
      "wbsItemId": "WBS항목ID",
      "selfEvaluationContent": "자기평가 내용",
      "selfEvaluationScore": 100,
      "performanceResult": "성과 결과",
      "wasSubmittedToManager": true   // ← 초기화 전에 제출되어 있었음
    }
  ],
  "failedResets": []
}
```

**초기화 후 상태 확인** (GET으로 조회):
```json
{
  "id": "평가ID",
  "submittedToEvaluator": false,      // ← 미제출로 변경됨 ✅
  "submittedToEvaluatorAt": null,
  "submittedToManager": false,        // ← 미제출로 변경됨 ✅
  "submittedToManagerAt": null
}
```

---

## 현재 상황 분석

**현재 응답**:
```json
{
  "resetCount": 0,        // ← 초기화된 평가 없음
  "failedCount": 0,
  "totalCount": 1,        // ← 평가는 1개 있음
  "resetEvaluations": [], // ← 비어있음
  "failedResets": []
}
```

**원인**: 해당 평가가 **관리자에게 제출되지 않은 상태**

**확인 방법**:
1. 평가 상세 조회: `GET /admin/performance-evaluation/wbs-self-evaluations/{id}`
2. `submittedToManager` 필드 확인
   - `false`이면 → 관리자에게 미제출 상태 (Reset 불가)
   - `true`이면 → Reset 가능

---

## Swagger 테스트 순서 (완전한 플로우)

### 준비 사항
- `employeeId`: 직원 ID
- `wbsItemId`: WBS 항목 ID
- `periodId`: 평가기간 ID

### Step 1: 자기평가 작성
```
POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}

Body:
{
  "selfEvaluationContent": "테스트 자기평가",
  "selfEvaluationScore": 100,
  "performanceResult": "테스트 성과"
}

→ 응답에서 "id" 복사 (이후 단계에서 사용)
```

### Step 2: 1차 평가자에게 제출
```
PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator

→ submittedToEvaluator: true 확인
```

### Step 3: 관리자에게 제출
```
PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit

→ submittedToManager: true 확인
```

### Step 4: 초기화 (Reset)
```
PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/reset

→ resetCount: 1
→ resetEvaluations 배열에 평가 정보 포함됨
```

### Step 5: 초기화 확인
```
GET /admin/performance-evaluation/wbs-self-evaluations/{id}

→ submittedToEvaluator: false
→ submittedToManager: false
→ 타임스탬프: null
```

---

## 주의사항

❌ **이렇게 하면 Reset 안 됨**:
- 자기평가만 작성하고 제출하지 않음
- 1차 평가자에게만 제출하고 관리자에게는 제출하지 않음

✅ **이렇게 해야 Reset 됨**:
- 반드시 **관리자에게 제출**까지 완료해야 함
- `submittedToManager: true` 상태여야 Reset 가능

---

## 로그 확인 방법

Handler에서 스킵되는 경우 다음 로그가 출력됩니다:
```
이미 관리자에게 미제출 상태 스킵 - ID: {평가ID}
```

이 로그가 보이면 해당 평가가 관리자에게 제출되지 않은 상태입니다.

---

## 관련 파일

- E2E 테스트: `wbs-self-evaluation-reset.e2e-spec.ts`
- 테스트 시나리오: `README.md`
- 컨트롤러: `src/interface/admin/performance-evaluation/wbs-self-evaluation-management.controller.ts`
- Handler: `src/context/performance-evaluation-context/handlers/self-evaluation/commands/reset-all-wbs-self-evaluations.handler.ts`

