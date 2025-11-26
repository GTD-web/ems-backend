# WBS 자기평가 초기화 (Reset) 테스트 시나리오

## 개요

WBS 자기평가의 제출 상태를 미제출 상태로 변경(초기화)하는 기능을 테스트합니다.
이 기능은 1차 평가자가 관리자에게 제출한 자기평가를 다시 미제출 상태로 되돌립니다.

## 테스트 대상 엔드포인트

### 1. 직원의 전체 WBS 자기평가 초기화

**엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/reset`

**설명**: 특정 직원의 특정 평가기간에 대한 모든 관리자 제출 완료된 WBS 자기평가를 미제출 상태로 변경

**응답 구조**:
```json
{
  "resetCount": 2,
  "failedCount": 1,
  "totalCount": 5,
  "resetEvaluations": [
    {
      "evaluationId": "550e8400-e29b-41d4-a716-446655440001",
      "wbsItemId": "550e8400-e29b-41d4-a716-446655440010",
      "selfEvaluationContent": "이번 분기 목표를 성공적으로 달성했습니다.",
      "selfEvaluationScore": 100,
      "performanceResult": "WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.",
      "wasSubmittedToManager": true
    }
  ],
  "failedResets": [
    {
      "evaluationId": "550e8400-e29b-41d4-a716-446655440005",
      "wbsItemId": "550e8400-e29b-41d4-a716-446655440015",
      "reason": "데이터베이스 제약 조건 위반으로 초기화에 실패했습니다."
    }
  ]
}
```

### 2. 프로젝트별 WBS 자기평가 초기화

**엔드포인트**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/reset`

**설명**: 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 관리자 제출 완료된 WBS 자기평가를 미제출 상태로 변경

**응답 구조**: 동일

## 테스트 시나리오

### 1. 직원의 전체 WBS 자기평가 초기화

#### 시나리오 1-1: 관리자에게 제출된 평가들을 미제출 상태로 변경한다

**준비 단계**:
1. 3개의 WBS 자기평가 작성
2. 각 평가를 1차 평가자에게 제출
3. 각 평가를 관리자에게 제출

**실행**:
- 직원의 전체 WBS 자기평가 초기화 요청

**검증**:
- `resetCount`: 3 (모두 초기화됨)
- `failedCount`: 0
- `totalCount`: 3
- `resetEvaluations`: 3개의 평가 정보 포함
  - 각 평가의 `evaluationId`, `wbsItemId`, `selfEvaluationContent`, `selfEvaluationScore`, `performanceResult` 확인
  - `wasSubmittedToManager`: true
- `failedResets`: 빈 배열
- 각 평가의 실제 상태 확인:
  - `submittedToManager`: false
  - `submittedToManagerAt`: null
  - `submittedToEvaluator`: false (함께 초기화됨)
  - `submittedToEvaluatorAt`: null

#### 시나리오 1-2: 이미 미제출 상태인 평가는 스킵하고 결과에 포함하지 않는다

**준비 단계**:
1. 3개의 WBS 자기평가 작성
2. 제출하지 않음 (미제출 상태 유지)

**실행**:
- 직원의 전체 WBS 자기평가 초기화 요청

**검증**:
- `resetCount`: 0 (이미 미제출 상태)
- `failedCount`: 0
- `totalCount`: 3
- `resetEvaluations`: 빈 배열
- `failedResets`: 빈 배열

#### 시나리오 1-3: 일부만 제출된 경우 제출된 평가만 초기화한다

**준비 단계**:
1. 3개의 WBS 자기평가 작성
2. 첫 2개만 1차 평가자와 관리자에게 제출
3. 세 번째는 미제출 상태 유지

**실행**:
- 직원의 전체 WBS 자기평가 초기화 요청

**검증**:
- `resetCount`: 2
- `failedCount`: 0
- `totalCount`: 3
- `resetEvaluations`: 2개의 평가 정보 포함
- 초기화된 평가 ID 확인
- 초기화된 평가는 미제출 상태
- 제출하지 않은 평가는 그대로 미제출 상태

#### 시나리오 1-4: 초기화할 자기평가가 없으면 에러를 반환한다

**준비 단계**:
- 자기평가를 작성하지 않음

**실행**:
- 직원의 전체 WBS 자기평가 초기화 요청

**검증**:
- HTTP 상태 코드: 400 Bad Request

#### 시나리오 1-5: 1차 평가자에게만 제출된 평가는 초기화하지 않는다

**준비 단계**:
1. 3개의 WBS 자기평가 작성
2. 각 평가를 1차 평가자에게만 제출 (관리자에게는 미제출)

**실행**:
- 직원의 전체 WBS 자기평가 초기화 요청

**검증**:
- `resetCount`: 0
- `failedCount`: 0
- `totalCount`: 3
- `resetEvaluations`: 빈 배열
- 평가는 여전히 1차 평가자에게 제출된 상태로 유지
  - `submittedToManager`: false
  - `submittedToEvaluator`: true
  - `submittedToEvaluatorAt`: 유지

### 2. 프로젝트별 WBS 자기평가 초기화

#### 시나리오 2-1: 특정 프로젝트의 자기평가만 초기화한다

**준비 단계**:
1. 두 개의 프로젝트 할당
2. 각 프로젝트에 WBS 할당
3. 첫 번째 프로젝트: 3개의 자기평가 작성 및 제출
4. 두 번째 프로젝트: 2개의 자기평가 작성 및 제출

**실행**:
- 첫 번째 프로젝트의 자기평가만 초기화 요청

**검증**:
- `resetCount`: 3 (첫 번째 프로젝트만)
- `totalCount`: 3
- 첫 번째 프로젝트 평가는 미제출 상태
- 두 번째 프로젝트 평가는 여전히 제출 상태

## 핵심 검증 사항

### 1. 응답 구조
- `resetCount`: 실제 초기화된 평가 개수
- `failedCount`: 초기화 실패한 평가 개수
- `totalCount`: 조회된 전체 평가 개수
- `resetEvaluations`: 초기화된 평가 상세 정보 배열
- `failedResets`: 초기화 실패한 평가 정보 배열

### 2. 초기화 조건
- **초기화 대상**: `submittedToManager = true`인 평가만
- **초기화 결과**: `submittedToManager`, `submittedToEvaluator` 모두 false로 변경
- **타임스탬프**: `submittedToManagerAt`, `submittedToEvaluatorAt` 모두 null로 변경

### 3. 스킵 조건
- 이미 `submittedToManager = false`인 평가는 스킵
- 스킵된 평가는 `resetEvaluations`에 포함되지 않음
- 하지만 `totalCount`에는 포함됨

### 4. 제출 상태 변화
```
[초기화 전]
submittedToEvaluator: true
submittedToEvaluatorAt: "2024-01-15T10:00:00Z"
submittedToManager: true
submittedToManagerAt: "2024-01-15T15:00:00Z"

↓ 초기화 실행 ↓

[초기화 후]
submittedToEvaluator: false
submittedToEvaluatorAt: null
submittedToManager: false
submittedToManagerAt: null
```

## 관련 API

### 이전 단계 (테스트 준비)
- 자기평가 저장: `POST /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/wbs/:wbsItemId/period/:periodId`
- 1차 평가자 제출: `PATCH /admin/performance-evaluation/wbs-self-evaluations/:id/submit-to-evaluator`
- 관리자 제출: `PATCH /admin/performance-evaluation/wbs-self-evaluations/:id/submit`

### 검증 단계
- 상세 조회: `GET /admin/performance-evaluation/wbs-self-evaluations/:id`
- 목록 조회: `GET /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId`

## 실행 방법

```bash
# 전체 테스트 실행
npm run test:e2e -- test/usecase/scenarios/performance-evaluation/wbs-self-evaluation/reset/wbs-self-evaluation-reset.e2e-spec.ts

# 특정 시나리오만 실행
npm run test:e2e -- test/usecase/scenarios/performance-evaluation/wbs-self-evaluation/reset/wbs-self-evaluation-reset.e2e-spec.ts -t "관리자에게 제출된 평가들을 미제출 상태로 변경한다"
```

## 주의사항

1. **제출 순서**: 1차 평가자 제출 → 관리자 제출 순서를 지켜야 함
2. **동시성**: 여러 평가를 동시에 초기화할 수 있음
3. **실패 처리**: 일부 평가가 실패해도 다른 평가는 계속 처리됨
4. **상태 검증**: 초기화 후 반드시 실제 상태를 조회하여 검증

## 참고

- 컨트롤러: `src/interface/admin/performance-evaluation/wbs-self-evaluation-management.controller.ts`
- Handler: `src/context/performance-evaluation-context/handlers/self-evaluation/commands/reset-all-wbs-self-evaluations.handler.ts`
- DTO: `src/interface/common/dto/performance-evaluation/wbs-self-evaluation.dto.ts`

