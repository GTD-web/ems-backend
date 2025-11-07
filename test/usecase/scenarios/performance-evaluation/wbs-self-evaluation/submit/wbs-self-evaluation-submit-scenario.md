# WBS 자기평가 제출 시나리오

## 개요

WBS 자기평가의 제출 프로세스를 검증하는 시나리오입니다.
- 피평가자 → 1차 평가자 제출
- 1차 평가자 → 관리자 제출
- 제출 상태 원복 (취소)

사용되는 컨트롤러
- performance-evaluation (WBS 자기평가 관리)
- evaluation-period (평가기간 관리)
- evaluation-criteria (프로젝트/WBS 할당)
- dashboard (대시보드 조회)

---

## 시나리오 작성 가이드

모든 시나리오는 다음 순서로 선행 조건을 설정해야 합니다:
1. **평가기간 생성**: `POST /admin/evaluation-periods`
2. **평가기간 시작**: `POST /admin/evaluation-periods/{id}/start`
3. **프로젝트 할당**: `POST /admin/evaluation-criteria/project-assignments`
4. **WBS 할당**: `POST /admin/evaluation-criteria/wbs-assignments`

위 선행 조건이 완료된 후 WBS 자기평가 제출 관련 시나리오를 검증합니다.

---

## 자기평가 제출 프로세스

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

### 시나리오 1: 피평가자 → 1차 평가자 제출

#### 1-1. 자기평가 작성 및 저장

- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (WBS 자기평가 저장)
    - **저장 검증**
        - employeeId, wbsItemId, periodId로 자기평가 저장
        - selfEvaluationContent (자기평가 내용) 입력
        - selfEvaluationScore (성과당성률) 입력
        - performanceResult (성과 결과) 입력
        - 저장된 자기평가 ID 반환 확인
        - HTTP 200 응답 확인
    - **대시보드 API 저장 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **selfEvaluation 객체 검증**
                - selfEvaluation.status가 'in_progress'로 변경되는지 확인 (일부만 작성된 경우)
                - selfEvaluation.totalMappingCount 확인 (전체 WBS 할당 수)
                - selfEvaluation.completedMappingCount 확인 (제출 전이므로 변경 없음)
                - selfEvaluation.isSubmittedToEvaluator가 false인지 확인 (미제출 상태)
                - selfEvaluation.totalScore가 null인지 확인 (모든 자기평가 제출 전)
                - selfEvaluation.grade가 null인지 확인 (모든 자기평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)**
            - **summary.selfEvaluation 검증**
                - summary.completedSelfEvaluations가 변경되지 않는지 확인 (제출 전)
                - summary.selfEvaluation.totalSelfEvaluations가 1인지 확인 (저장된 자기평가 수)
                - summary.selfEvaluation.submittedToEvaluatorCount는 0인지 확인 (미제출 상태)
                - summary.selfEvaluation.isSubmittedToEvaluator가 false인지 확인 (미제출 상태)
                - summary.selfEvaluation.submittedToManagerCount는 0인지 확인 (미제출 상태)
                - summary.selfEvaluation.isSubmittedToManager가 false인지 확인 (미제출 상태)
                - summary.selfEvaluation.totalScore가 null인지 확인 (모든 자기평가 제출 전)
                - summary.selfEvaluation.grade가 null인지 확인 (모든 자기평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **selfEvaluation 객체 검증**
                - selfEvaluation.status가 'in_progress'인지 확인
                - selfEvaluation.completedMappingCount가 변경되지 않는지 확인 (제출 전)
                - selfEvaluation.isSubmittedToEvaluator가 false인지 확인

#### 1-2. 피평가자 → 1차 평가자 제출

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator (WBS 자기평가 제출 - 피평가자 → 1차 평가자)
    - **제출 검증**
        - 자기평가 ID로 1차 평가자에게 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedToEvaluator가 true로 변경되었는지 확인
        - 응답에서 submittedToEvaluatorAt이 기록되었는지 확인 (Date 타입)
        - 응답에서 submittedToManager가 false인지 확인 (아직 관리자 제출 전)
        - 응답에서 submittedToManagerAt이 null인지 확인
        - 응답에서 selfEvaluationContent가 유지되는지 확인 (내용 유지)
        - 응답에서 selfEvaluationScore가 유지되는지 확인 (성과당성률 유지)
        - 응답에서 performanceResult가 유지되는지 확인 (성과 결과 유지)
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **selfEvaluation 객체 검증**
                - selfEvaluation.isSubmittedToEvaluator 확인
                    - 전체 자기평가가 1개인 경우: true
                    - 전체 자기평가가 여러 개인 경우: false (일부만 제출)
                - selfEvaluation.completedMappingCount는 변경 없음 확인 (관리자 제출 전이므로)
                - selfEvaluation.status가 'in_progress'인지 확인 (관리자 제출 전)
                - selfEvaluation.totalScore가 null인지 확인 (관리자 제출 전)
                - selfEvaluation.grade가 null인지 확인 (관리자 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)**
            - **summary.selfEvaluation 검증**
                - summary.selfEvaluation.submittedToEvaluatorCount가 1 증가하는지 확인
                - summary.selfEvaluation.isSubmittedToEvaluator 확인
                    - 전체 자기평가가 1개인 경우: true
                    - 전체 자기평가가 여러 개인 경우: false
                - summary.selfEvaluation.submittedToManagerCount는 0인지 확인
                - summary.selfEvaluation.isSubmittedToManager가 false인지 확인
                - summary.completedSelfEvaluations는 변경 없음 확인 (관리자 제출 전)
                - summary.selfEvaluation.totalScore가 null인지 확인
                - summary.selfEvaluation.grade가 null인지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **selfEvaluation 객체 검증**
                - selfEvaluation.isSubmittedToEvaluator 확인
                    - 전체 자기평가가 1개인 경우: true
                    - 전체 자기평가가 여러 개인 경우: false
                - selfEvaluation.completedMappingCount는 변경 없음 확인

---

### 시나리오 2: 1차 평가자 제출 취소 (원복)

#### 2-1. 1차 평가자 제출 취소

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/reset-to-evaluator (WBS 자기평가 취소 - 피평가자 → 1차 평가자 제출 취소)
    - **취소 검증**
        - 자기평가 ID로 1차 평가자 제출 취소
        - HTTP 200 응답 확인
        - 응답에서 submittedToEvaluator가 false로 변경되었는지 확인
        - 응답에서 submittedToEvaluatorAt이 유지되는지 확인 (Reset 시 제출 일시는 유지)
        - 응답에서 submittedToManager가 false인지 확인 (관리자 제출 상태 유지 또는 초기 상태)
        - 응답에서 submittedToManagerAt이 null인지 확인
        - 응답에서 selfEvaluationContent가 유지되는지 확인 (내용 유지)
        - 응답에서 selfEvaluationScore가 유지되는지 확인 (성과당성률 유지)
        - 응답에서 performanceResult가 유지되는지 확인 (성과 결과 유지)
    - **대시보드 API 취소 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **selfEvaluation 객체 검증**
                - selfEvaluation.isSubmittedToEvaluator가 false로 변경되는지 확인
                - selfEvaluation.completedMappingCount는 변경 없음 확인 (관리자 제출 상태와 무관)
                - selfEvaluation.status가 'in_progress'인지 확인
                - selfEvaluation.totalScore가 null인지 확인
                - selfEvaluation.grade가 null인지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)**
            - **summary.selfEvaluation 검증**
                - summary.selfEvaluation.submittedToEvaluatorCount가 감소하는지 확인 (1 → 0)
                - summary.selfEvaluation.isSubmittedToEvaluator가 false로 변경되는지 확인
                - summary.selfEvaluation.submittedToManagerCount는 0인지 확인
                - summary.selfEvaluation.isSubmittedToManager가 false인지 확인
                - summary.completedSelfEvaluations는 변경 없음 확인
                - summary.selfEvaluation.totalScore가 null인지 확인
                - summary.selfEvaluation.grade가 null인지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **selfEvaluation 객체 검증**
                - selfEvaluation.isSubmittedToEvaluator가 false로 변경되는지 확인
                - selfEvaluation.completedMappingCount는 변경 없음 확인

---

### 시나리오 3: 1차 평가자 → 관리자 제출

#### 3-1. 피평가자 → 1차 평가자 제출 (재제출)

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator (WBS 자기평가 제출 - 피평가자 → 1차 평가자)
    - **재제출 검증**
        - 자기평가 ID로 1차 평가자에게 재제출
        - HTTP 200 응답 확인
        - 응답에서 submittedToEvaluator가 true로 변경되었는지 확인
        - 응답에서 submittedToEvaluatorAt이 새로 기록되었는지 확인 (재제출 시 일시 갱신)
        - 응답에서 submittedToManager가 false인지 확인 (아직 관리자 제출 전)
    - **대시보드 API 재제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - selfEvaluation.isSubmittedToEvaluator가 true로 변경되는지 확인

#### 3-2. 1차 평가자 → 관리자 제출

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (WBS 자기평가 제출 - 1차 평가자 → 관리자)
    - **제출 검증**
        - 자기평가 ID로 관리자에게 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedToManager가 true로 변경되었는지 확인
        - 응답에서 submittedToManagerAt이 기록되었는지 확인 (Date 타입)
        - 응답에서 submittedToEvaluator 확인
            - 피평가자가 먼저 제출한 경우: true (이미 제출된 상태 유지)
            - 피평가자가 제출하지 않은 경우: true (자동으로 제출한 것으로 처리됨)
        - 응답에서 submittedToEvaluatorAt 확인
            - 피평가자가 먼저 제출한 경우: 기존 일시 유지
            - 피평가자가 제출하지 않은 경우: 새로 기록됨 (자동으로 제출한 것으로 처리됨)
        - 응답에서 selfEvaluationContent가 유지되는지 확인 (내용 유지)
        - 응답에서 selfEvaluationScore가 유지되는지 확인 (성과당성률 유지)
        - 응답에서 performanceResult가 유지되는지 확인 (성과 결과 유지)
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 1 증가하는지 확인
                - selfEvaluation.isSubmittedToEvaluator 확인
                    - 피평가자가 먼저 제출한 경우: true (1차 평가자 제출 상태 유지)
                    - 피평가자가 제출하지 않은 경우: true (자동으로 제출한 것으로 처리됨)
                - selfEvaluation.status 확인
                    - 모든 자기평가 제출 완료 시: 'complete'
                    - 일부만 제출된 경우: 'in_progress'
                - selfEvaluation.totalScore 확인
                    - 모든 자기평가 제출 완료 시: 계산된 점수 (가중치 기반)
                    - 일부만 제출된 경우: null
                - selfEvaluation.grade 확인
                    - 모든 자기평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)**
            - **summary.selfEvaluation 검증**
                - summary.completedSelfEvaluations가 1 증가하는지 확인 (submittedToManagerCount와 동일)
                - summary.selfEvaluation.submittedToManagerCount가 1 증가하는지 확인
                - summary.selfEvaluation.isSubmittedToManager 확인
                    - 전체 자기평가가 1개인 경우: true
                    - 전체 자기평가가 여러 개인 경우: false
                - summary.selfEvaluation.submittedToEvaluatorCount 확인
                    - 피평가자가 먼저 제출한 경우: 유지 (1차 평가자 제출 상태 유지)
                    - 피평가자가 제출하지 않은 경우: 1 증가 (자동으로 제출한 것으로 처리됨)
                - summary.selfEvaluation.isSubmittedToEvaluator 확인
                    - 피평가자가 먼저 제출한 경우: true (1차 평가자 제출 상태 유지)
                    - 피평가자가 제출하지 않은 경우: true (자동으로 제출한 것으로 처리됨)
                - summary.selfEvaluation.totalScore 확인
                    - 모든 자기평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - summary.selfEvaluation.grade 확인
                    - 모든 자기평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 1 증가하는지 확인
                - selfEvaluation.isSubmittedToEvaluator가 true인지 확인
                - selfEvaluation.status 확인
                    - 모든 자기평가 제출 완료 시: 'complete'
                    - 일부만 제출된 경우: 'in_progress'
                - selfEvaluation.totalScore 확인
                    - 모든 자기평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - selfEvaluation.grade 확인
                    - 모든 자기평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null

#### 3-3. 1차 평가자 → 관리자 제출 (피평가자가 먼저 제출하지 않은 경우)

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (WBS 자기평가 제출 - 1차 평가자 → 관리자)
    - **제출 검증**
        - 자기평가 저장 후 피평가자가 1차 평가자에게 제출하지 않은 상태에서 관리자에게 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedToManager가 true로 변경되었는지 확인
        - 응답에서 submittedToManagerAt이 기록되었는지 확인 (Date 타입)
        - 응답에서 submittedToEvaluator가 true로 자동 설정되었는지 확인 (자동으로 제출한 것으로 처리됨)
        - 응답에서 submittedToEvaluatorAt이 새로 기록되었는지 확인 (자동으로 제출한 것으로 처리됨)
        - 응답에서 selfEvaluationContent가 유지되는지 확인 (내용 유지)
        - 응답에서 selfEvaluationScore가 유지되는지 확인 (성과당성률 유지)
        - 응답에서 performanceResult가 유지되는지 확인 (성과 결과 유지)
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 1 증가하는지 확인
                - selfEvaluation.isSubmittedToEvaluator가 true인지 확인 (자동으로 제출한 것으로 처리됨)
                - selfEvaluation.status가 'complete'인지 확인 (모든 자기평가 제출 완료 시)
                - selfEvaluation.totalScore가 계산되었는지 확인
                - selfEvaluation.grade가 계산되었는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)**
            - **summary.selfEvaluation 검증**
                - summary.completedSelfEvaluations가 1 증가하는지 확인
                - summary.selfEvaluation.submittedToManagerCount가 1 증가하는지 확인
                - summary.selfEvaluation.isSubmittedToManager가 true인지 확인
                - summary.selfEvaluation.submittedToEvaluatorCount가 1 증가하는지 확인 (자동으로 제출한 것으로 처리됨)
                - summary.selfEvaluation.isSubmittedToEvaluator가 true인지 확인 (자동으로 제출한 것으로 처리됨)
                - summary.selfEvaluation.totalScore가 계산되었는지 확인
                - summary.selfEvaluation.grade가 계산되었는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 1 증가하는지 확인
                - selfEvaluation.isSubmittedToEvaluator가 true인지 확인 (자동으로 제출한 것으로 처리됨)
                - selfEvaluation.status가 'complete'인지 확인
                - selfEvaluation.totalScore가 계산되었는지 확인
                - selfEvaluation.grade가 계산되었는지 확인

---

## 종합 검증 시나리오

### 시나리오 4: 전체 제출 프로세스 통합 검증

#### 4-1. 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

#### 4-2. 자기평가 작성 및 제출 전체 프로세스

1. **자기평가 작성**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}
        - selfEvaluationContent: "자기평가 내용"
        - selfEvaluationScore: 85 (성과당성률)
        - performanceResult: "성과 결과"
    - **검증**: submittedToEvaluator = false, submittedToManager = false

2. **피평가자 → 1차 평가자 제출**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator
    - **검증**: submittedToEvaluator = true, submittedToEvaluatorAt 기록, submittedToManager = false

3. **1차 평가자 제출 취소 (원복)**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/reset-to-evaluator
    - **검증**: submittedToEvaluator = false, submittedToEvaluatorAt 유지, submittedToManager = false

4. **피평가자 → 1차 평가자 재제출**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator
    - **검증**: submittedToEvaluator = true, submittedToEvaluatorAt 새로 기록

5. **1차 평가자 → 관리자 제출**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit
    - **검증**: submittedToManager = true, submittedToManagerAt 기록, submittedToEvaluator = true 유지

6. **대시보드 API 통합 검증**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}
        - selfEvaluation.completedMappingCount = 1
        - selfEvaluation.isSubmittedToEvaluator = true
        - selfEvaluation.status = 'complete' (전체 자기평가가 1개인 경우)
        - selfEvaluation.totalScore 계산됨 (모든 자기평가 제출 완료 시)
        - selfEvaluation.grade 계산됨 (모든 자기평가 제출 완료 시)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data
        - wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)
        - summary.completedSelfEvaluations = 1
        - summary.selfEvaluation.submittedToManagerCount = 1
        - summary.selfEvaluation.isSubmittedToManager = true
        - summary.selfEvaluation.totalScore 계산됨
        - summary.selfEvaluation.grade 계산됨

---

## 주의사항 및 검증 포인트

### 1. 제출 프로세스 순서
- 피평가자 → 1차 평가자 제출 후에만 1차 평가자 → 관리자 제출 가능
- 1차 평가자 제출 없이 관리자 제출 시도 시 에러 발생 (400 Bad Request)

### 2. 제출 상태 관리
- `submittedToEvaluator`: 1차 평가자 제출 여부
- `submittedToManager`: 관리자 제출 여부 (완료된 자기평가)
- 두 제출 상태는 독립적으로 관리됨
- `isCompleted`는 `submittedToManager = true`인 경우에만 `true`

### 3. 제출 취소 (Reset) 동작
- `reset-to-evaluator`: 1차 평가자 제출 취소
    - `submittedToEvaluator`만 `false`로 변경
    - `submittedToEvaluatorAt`은 유지 (Reset 시 제출 일시는 유지)
    - 내용(`selfEvaluationContent`, `selfEvaluationScore`, `performanceResult`)은 유지
    - `submittedToManager`는 영향받지 않음

### 4. 점수 및 등급 계산 조건
- `totalScore`와 `grade`는 **모든 자기평가가 관리자에게 제출되어야** 계산됨
- 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
- 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨

### 5. 상태 전환 규칙
- `status: 'none'` → `'in_progress'` → `'complete'`
- `'complete'`는 모든 자기평가가 관리자에게 제출된 상태
- 일부만 제출된 경우 `'in_progress'`
- 1차 평가자 제출만 완료된 경우도 `'in_progress'` (관리자 제출 전)

### 6. 데이터 일관성
- 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
- `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수

---

## 테스트 작성 가이드

1. **Before/After 비교**: 제출 전후로 각 엔드포인트를 호출하여 비교
2. **2단계 제출 검증**: 피평가자 → 1차 평가자 제출 후, 1차 평가자 → 관리자 제출까지 전체 프로세스 검증
3. **원복 검증**: 제출 취소 시 상태가 올바르게 원복되는지 확인
4. **다중 엔드포인트 검증**: 하나의 제출에 대해 여러 엔드포인트를 모두 검증
5. **엣지 케이스**: 모든 자기평가 제출 완료, 일부만 제출, 제출 취소 등의 케이스 검증
6. **데이터 정합성**: `summary`의 집계 값과 개별 WBS 데이터의 일관성 확인

