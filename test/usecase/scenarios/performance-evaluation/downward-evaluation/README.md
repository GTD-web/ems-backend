# 하향평가 관리 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- downward-evaluation-management (하향평가 관리)
- evaluation-period (평가기간 관리)
- evaluation-criteria (프로젝트/WBS 할당)
- evaluation-line (평가라인 설정)
- performance-evaluation (WBS 자기평가 관리)
- dashboard (대시보드 조회)

---

## 시나리오 작성 가이드

모든 시나리오는 다음 순서로 선행 조건을 설정해야 합니다:
1. **시드 데이터 생성**: 직원, 부서, 프로젝트, WBS 항목 등 기본 데이터 생성
2. **평가기간 생성**: `POST /admin/evaluation-periods`
3. **평가기간 시작**: `POST /admin/evaluation-periods/{id}/start`
4. **프로젝트 할당**: `POST /admin/evaluation-criteria/project-assignments`
5. **WBS 할당**: `POST /admin/evaluation-criteria/wbs-assignments`
6. **평가라인 설정**: `POST /admin/evaluation-line/mappings` (1차/2차 평가자 매핑)
7. **WBS 자기평가 완료**: 하향평가를 작성하려면 먼저 자기평가가 제출되어야 함
   - `POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}` (자기평가 저장)
   - `PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-all` (자기평가 제출)

위 선행 조건이 완료된 후 하향평가 관련 시나리오를 검증합니다.

---

## 하향평가 기본 관리

### 선행 조건 설정
- 시드 데이터 생성 (직원, 부서, 프로젝트, WBS 항목)
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정 - 1차/2차 평가자 매핑)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (WBS 자기평가 완료)

### 1차 하향평가 저장 (신규 생성)

- POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (1차 하향평가 저장)
    - **저장 검증**
        - evaluateeId, periodId, wbsId, evaluatorId로 1차 하향평가 저장
        - downwardEvaluationContent, downwardEvaluationScore 입력
        - selfEvaluationId 연결 (자기평가와 연동)
        - 저장된 하향평가 ID 반환 확인
        - HTTP 200 응답 확인
    - **대시보드 API 저장 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인
                - primaryDownwardEvaluation.totalMappingCount 확인 (전체 WBS 할당 수)
                - primaryDownwardEvaluation.completedMappingCount 확인 (제출 전이므로 변경 없음)
                - primaryDownwardEvaluation.isEditable 확인 (editableStatus에서 가져옴)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **해당 WBS의 primaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].primaryDownwardEvaluation.primaryDownwardEvaluationId가 생성되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.evaluationContent가 반영되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.score가 반영되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 false인지 확인 (미제출 상태)
                - projects[].wbsList[].primaryDownwardEvaluation.isEditable 확인
                - projects[].wbsList[].primaryDownwardEvaluation.submittedAt이 null인지 확인
            - **summary 검증**
                - summary.completedPrimaryDownwardEvaluations가 변경되지 않는지 확인 (제출 전)
                - summary.primaryDownwardEvaluation.totalScore가 null인지 확인 (모든 1차 하향평가 제출 전)
                - summary.primaryDownwardEvaluation.grade가 null인지 확인 (모든 1차 하향평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.status가 'in_progress'인지 확인
                - primaryDownwardEvaluation.completedMappingCount가 변경되지 않는지 확인 (제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status (평가자 담당 대상자 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.status가 'in_progress'인지 확인
                - primaryDownwardEvaluation.totalMappingCount 확인

### 1차 하향평가 수정 (제출 전)

- POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (1차 하향평가 저장 - 기존 수정)
    - **수정 검증**
        - 동일한 evaluateeId, periodId, wbsId, evaluatorId 조합으로 재저장
        - downwardEvaluationContent, downwardEvaluationScore 수정
        - 동일한 하향평가 ID 반환 확인 (Upsert 방식)
        - HTTP 200 응답 확인
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 primaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].primaryDownwardEvaluation.evaluationContent가 업데이트되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.score가 업데이트되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 false인지 확인 (제출 상태 유지)
                - projects[].wbsList[].primaryDownwardEvaluation.primaryDownwardEvaluationId가 동일한지 확인 (같은 ID)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - primaryDownwardEvaluation.completedMappingCount가 변경되지 않는지 확인 (제출 전)

### 1차 하향평가 제출 (단일)

- PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/submit (1차 하향평가 제출)
    - **제출 검증**
        - 1차 하향평가 ID로 제출
        - HTTP 204 응답 확인
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 1 증가하는지 확인
                - primaryDownwardEvaluation.status 확인
                    - 모든 1차 하향평가 제출 완료 시: 'complete'
                    - 일부만 제출된 경우: 'in_progress'
                - primaryDownwardEvaluation.totalScore 확인
                    - 모든 1차 하향평가 제출 완료 시: 계산된 점수 (가중치 기반)
                    - 일부만 제출된 경우: null
                - primaryDownwardEvaluation.grade 확인
                    - 모든 1차 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status (평가자 담당 대상자 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 1 증가하는지 확인
                - primaryDownwardEvaluation.status 확인 (complete 또는 in_progress)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 primaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 true로 변경되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.submittedAt이 기록되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.evaluationContent 유지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.score 유지 확인
            - **summary.primaryDownwardEvaluation 검증**
                - summary.completedPrimaryDownwardEvaluations가 1 증가하는지 확인
                - summary.primaryDownwardEvaluation.totalScore 확인
                    - 모든 1차 하향평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - summary.primaryDownwardEvaluation.grade 확인
                    - 모든 1차 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 1 증가하는지 확인
                - primaryDownwardEvaluation.status 확인 (complete 또는 in_progress)

### 1차 하향평가 수정 (제출 후)

- POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (제출된 1차 하향평가 수정)
    - **수정 검증**
        - 제출된 1차 하향평가를 다시 저장하여 수정
        - downwardEvaluationContent, downwardEvaluationScore 수정
        - HTTP 200 응답 확인
        - isCompleted가 true로 유지되는지 확인 (제출 상태 유지)
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 primaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].primaryDownwardEvaluation.evaluationContent가 업데이트되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.score가 업데이트되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 true로 유지되는지 확인 (제출 상태 유지)
                - projects[].wbsList[].primaryDownwardEvaluation.submittedAt이 유지되는지 확인
            - **summary 검증**
                - summary.completedPrimaryDownwardEvaluations가 변경되지 않는지 확인 (제출 상태 유지)
                - summary.primaryDownwardEvaluation.totalScore와 grade가 재계산되는지 확인 (모든 1차 하향평가 제출 완료 시)

### 1차 하향평가 미제출 상태로 변경 (Reset)

- PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/reset (1차 하향평가 미제출)
    - **미제출 처리 검증**
        - 1차 하향평가 ID로 미제출 상태로 변경
        - HTTP 204 응답 확인
    - **대시보드 API 미제출 처리 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 감소하는지 확인
                - primaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인 (일부만 미제출 처리된 경우)
                - primaryDownwardEvaluation.totalScore와 grade가 재계산되거나 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status (평가자 담당 대상자 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 감소하는지 확인
                - primaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 primaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 false로 변경되는지 확인
                - projects[].wbsList[].primaryDownwardEvaluation.evaluationContent와 score가 유지되는지 확인 (내용 유지)
            - **summary.primaryDownwardEvaluation 검증**
                - summary.completedPrimaryDownwardEvaluations가 감소하는지 확인
                - summary.primaryDownwardEvaluation.totalScore와 grade가 재계산되거나 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 감소하는지 확인
                - primaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인

---

## 2차 하향평가 관리

### 선행 조건 설정
- 1차 하향평가와 동일한 선행 조건
- 2차 평가자가 평가라인에 매핑되어 있어야 함

### 2차 하향평가 저장 (신규 생성)

- POST /admin/performance-evaluation/downward-evaluations/secondary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (2차 하향평가 저장)
    - **저장 검증**
        - evaluateeId, periodId, wbsId, evaluatorId로 2차 하향평가 저장
        - downwardEvaluationContent, downwardEvaluationScore 입력
        - selfEvaluationId 연결 (자기평가와 연동)
        - 저장된 하향평가 ID 반환 확인
        - HTTP 200 응답 확인
    - **대시보드 API 저장 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **secondaryDownwardEvaluation 객체 검증**
                - secondaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인
                - secondaryDownwardEvaluation.totalMappingCount 확인
                - secondaryDownwardEvaluation.completedMappingCount 확인 (제출 전이므로 변경 없음)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 secondaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].secondaryDownwardEvaluation.secondaryDownwardEvaluationId가 생성되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.evaluationContent가 반영되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.score가 반영되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 false인지 확인

### 2차 하향평가 수정 (제출 전)

- POST /admin/performance-evaluation/downward-evaluations/secondary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (2차 하향평가 저장 - 기존 수정)
    - **수정 검증**
        - 동일한 evaluateeId, periodId, wbsId, evaluatorId 조합으로 재저장
        - downwardEvaluationContent, downwardEvaluationScore 수정
        - 동일한 하향평가 ID 반환 확인 (Upsert 방식)
        - HTTP 200 응답 확인
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 secondaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].secondaryDownwardEvaluation.evaluationContent가 업데이트되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.score가 업데이트되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 false인지 확인

### 2차 하향평가 제출 (단일)

- PATCH /admin/performance-evaluation/downward-evaluations/secondary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/submit (2차 하향평가 제출)
    - **제출 검증**
        - 2차 하향평가 ID로 제출
        - HTTP 204 응답 확인
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **secondaryDownwardEvaluation 객체 검증**
                - secondaryDownwardEvaluation.completedMappingCount가 1 증가하는지 확인
                - secondaryDownwardEvaluation.status 확인
                    - 모든 2차 하향평가 제출 완료 시: 'complete'
                    - 일부만 제출된 경우: 'in_progress'
                - secondaryDownwardEvaluation.totalScore 확인
                    - 모든 2차 하향평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - secondaryDownwardEvaluation.grade 확인
                    - 모든 2차 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 secondaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 true로 변경되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.submittedAt이 기록되는지 확인
            - **summary.secondaryDownwardEvaluation 검증**
                - summary.completedSecondaryDownwardEvaluations가 1 증가하는지 확인
                - summary.secondaryDownwardEvaluation.totalScore와 grade 확인

### 2차 하향평가 수정 (제출 후)

- POST /admin/performance-evaluation/downward-evaluations/secondary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (제출된 2차 하향평가 수정)
    - **수정 검증**
        - 제출된 2차 하향평가를 다시 저장하여 수정
        - downwardEvaluationContent, downwardEvaluationScore 수정
        - HTTP 200 응답 확인
        - isCompleted가 true로 유지되는지 확인
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 secondaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].secondaryDownwardEvaluation.evaluationContent가 업데이트되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.score가 업데이트되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 true로 유지되는지 확인
            - **summary 검증**
                - summary.secondaryDownwardEvaluation.totalScore와 grade가 재계산되는지 확인

### 2차 하향평가 미제출 상태로 변경 (Reset)

- PATCH /admin/performance-evaluation/downward-evaluations/secondary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/reset (2차 하향평가 미제출)
    - **미제출 처리 검증**
        - 2차 하향평가 ID로 미제출 상태로 변경
        - HTTP 204 응답 확인
    - **대시보드 API 미제출 처리 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **secondaryDownwardEvaluation 객체 검증**
                - secondaryDownwardEvaluation.completedMappingCount가 감소하는지 확인
                - secondaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인
                - secondaryDownwardEvaluation.totalScore와 grade가 재계산되거나 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 secondaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 false로 변경되는지 확인
                - projects[].wbsList[].secondaryDownwardEvaluation.evaluationContent와 score가 유지되는지 확인
            - **summary 검증**
                - summary.completedSecondaryDownwardEvaluations가 감소하는지 확인

---

## 하향평가 목록 및 상세 조회

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)
- POST /admin/performance-evaluation/downward-evaluations/... (하향평가 저장)

### 평가자별 하향평가 목록 조회

- GET /admin/performance-evaluation/downward-evaluations/evaluator/{evaluatorId} (평가자별 하향평가 목록 조회)
    - **조회 검증**
        - evaluatorId로 해당 평가자가 작성한 하향평가 목록 조회
        - periodId, evaluateeId, wbsId 필터링 지원
        - evaluationType 필터링 지원 ('primary' 또는 'secondary')
        - isCompleted 필터링 지원 (제출 여부)
        - page, limit 페이징 지원
        - HTTP 200 응답 확인
        - 응답 배열에 하향평가 정보 포함 확인
    - **응답 구조 검증**
        - 각 항목에 id, evaluateeId, evaluatorId, wbsId, periodId, evaluationType, isCompleted 포함 확인
        - 제출된 하향평가의 경우 submittedAt 포함 확인
        - evaluationContent와 score 포함 확인

### 하향평가 상세 조회

- GET /admin/performance-evaluation/downward-evaluations/{id} (하향평가 상세정보 조회)
    - **조회 검증**
        - 하향평가 ID로 상세정보 조회
        - HTTP 200 응답 확인
        - 응답에 평가기간, 직원, WBS 항목, 평가자 정보 포함 확인
    - **응답 구조 검증**
        - id, evaluateeId, evaluatorId, wbsId, periodId, evaluationType 포함 확인
        - evaluationContent, score 포함 확인
        - isCompleted, createdAt, updatedAt 포함 확인
        - evaluationPeriod 객체 포함 확인 (id, name, startDate, endDate, status)
        - evaluatee 객체 포함 확인 (id, employeeNumber, name, email)
        - evaluator 객체 포함 확인 (id, employeeNumber, name, email)
        - wbsItem 객체 포함 확인 (id, wbsCode, title, status, projectId)
        - selfEvaluation 객체 포함 확인 (자기평가 연동 정보)
        - 제출된 하향평가의 경우 submittedAt 포함 확인

---

## 하향평가 일괄 제출 및 초기화

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)
- POST /admin/performance-evaluation/downward-evaluations/... (하향평가 여러 개 저장)

### 피평가자의 전체 하향평가 일괄 제출 (1차)

- PATCH /admin/performance-evaluation/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/bulk-submit?evaluationType=primary (피평가자의 전체 1차 하향평가 제출)
    - **일괄 제출 검증**
        - evaluateeId, periodId, evaluatorId로 모든 1차 하향평가를 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedCount, skippedCount, failedCount 포함 확인
        - submittedIds 배열에 제출된 하향평가 ID 포함 확인
        - skippedIds 배열에 건너뛴 하향평가 ID 포함 확인 (있는 경우)
        - failedItems 배열에 실패한 하향평가 정보 포함 확인 (있는 경우)
    - **대시보드 API 일괄 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 전체 WBS 수와 동일해지는지 확인
                - primaryDownwardEvaluation.status가 'complete'로 변경되는지 확인
                - primaryDownwardEvaluation.totalScore가 계산되는지 확인 (가중치 기반)
                - primaryDownwardEvaluation.grade가 계산되는지 확인 (등급 기준)
        - GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status (평가자 담당 대상자 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 전체 WBS 수와 동일해지는지 확인
                - primaryDownwardEvaluation.status가 'complete'로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 primaryDownwardEvaluation 객체 검증**
                - 모든 projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 true로 변경되는지 확인
                - 모든 projects[].wbsList[].primaryDownwardEvaluation.submittedAt이 기록되는지 확인
            - **summary.primaryDownwardEvaluation 검증**
                - summary.completedPrimaryDownwardEvaluations가 전체 WBS 수와 동일해지는지 확인
                - summary.primaryDownwardEvaluation.totalScore가 계산되는지 확인
                - summary.primaryDownwardEvaluation.grade가 계산되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 전체 WBS 수와 동일해지는지 확인
                - primaryDownwardEvaluation.status가 'complete'로 변경되는지 확인

### 피평가자의 전체 하향평가 일괄 제출 (2차)

- PATCH /admin/performance-evaluation/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/bulk-submit?evaluationType=secondary (피평가자의 전체 2차 하향평가 제출)
    - **일괄 제출 검증**
        - evaluateeId, periodId, evaluatorId로 모든 2차 하향평가를 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedCount, skippedCount, failedCount 포함 확인
    - **대시보드 API 일괄 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **secondaryDownwardEvaluation 객체 검증**
                - secondaryDownwardEvaluation.completedMappingCount가 전체 WBS 수와 동일해지는지 확인
                - secondaryDownwardEvaluation.status가 'complete'로 변경되는지 확인
                - secondaryDownwardEvaluation.totalScore가 계산되는지 확인
                - secondaryDownwardEvaluation.grade가 계산되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 secondaryDownwardEvaluation 객체 검증**
                - 모든 projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 true로 변경되는지 확인
                - 모든 projects[].wbsList[].secondaryDownwardEvaluation.submittedAt이 기록되는지 확인
            - **summary 검증**
                - summary.completedSecondaryDownwardEvaluations가 전체 WBS 수와 동일해지는지 확인
                - summary.secondaryDownwardEvaluation.totalScore와 grade가 계산되는지 확인

### 피평가자의 전체 하향평가 일괄 초기화 (1차)

- PATCH /admin/performance-evaluation/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/bulk-reset?evaluationType=primary (피평가자의 전체 1차 하향평가 초기화)
    - **일괄 초기화 검증**
        - evaluateeId, periodId, evaluatorId로 모든 1차 하향평가를 초기화
        - HTTP 200 응답 확인
        - 응답에서 resetCount, skippedCount, failedCount 포함 확인
        - resetIds 배열에 초기화된 하향평가 ID 포함 확인
    - **대시보드 API 일괄 초기화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **primaryDownwardEvaluation 객체 검증**
                - primaryDownwardEvaluation.completedMappingCount가 0으로 변경되는지 확인
                - primaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인
                - primaryDownwardEvaluation.totalScore와 grade가 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 primaryDownwardEvaluation 객체 검증**
                - 모든 projects[].wbsList[].primaryDownwardEvaluation.isCompleted가 false로 변경되는지 확인
            - **summary 검증**
                - summary.completedPrimaryDownwardEvaluations가 0으로 변경되는지 확인
                - summary.primaryDownwardEvaluation.totalScore와 grade가 null로 변경되는지 확인

### 피평가자의 전체 하향평가 일괄 초기화 (2차)

- PATCH /admin/performance-evaluation/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/bulk-reset?evaluationType=secondary (피평가자의 전체 2차 하향평가 초기화)
    - **일괄 초기화 검증**
        - evaluateeId, periodId, evaluatorId로 모든 2차 하향평가를 초기화
        - HTTP 200 응답 확인
        - 응답에서 resetCount, skippedCount, failedCount 포함 확인
    - **대시보드 API 일괄 초기화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **secondaryDownwardEvaluation 객체 검증**
                - secondaryDownwardEvaluation.completedMappingCount가 0으로 변경되는지 확인
                - secondaryDownwardEvaluation.status가 'in_progress'로 변경되는지 확인
                - secondaryDownwardEvaluation.totalScore와 grade가 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 secondaryDownwardEvaluation 객체 검증**
                - 모든 projects[].wbsList[].secondaryDownwardEvaluation.isCompleted가 false로 변경되는지 확인
            - **summary 검증**
                - summary.completedSecondaryDownwardEvaluations가 0으로 변경되는지 확인

---

## 하향평가 상태 변경 및 대시보드 일관성 검증

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)

### 하향평가 상태 전환 시나리오 (1차)

- **전체 상태 전환 흐름: none → in_progress → complete → in_progress → none**
- **1단계: 초기 상태 (none)**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **primaryDownwardEvaluation 객체 검증**
            - primaryDownwardEvaluation.status = 'none' 확인
            - primaryDownwardEvaluation.totalMappingCount = 할당된 WBS 수 확인
            - primaryDownwardEvaluation.completedMappingCount = 0 확인
            - primaryDownwardEvaluation.totalScore = null 확인
            - primaryDownwardEvaluation.grade = null 확인
- **2단계: 하향평가 작성 시작 (none → in_progress)**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (1차 하향평가 저장)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **primaryDownwardEvaluation 객체 검증**
            - primaryDownwardEvaluation.status = 'in_progress' 확인
            - primaryDownwardEvaluation.completedMappingCount = 0 확인 (제출 전)
- **3단계: 모든 하향평가 제출 완료 (in_progress → complete)**
    - PATCH /admin/performance-evaluation/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/bulk-submit?evaluationType=primary (전체 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **primaryDownwardEvaluation 객체 검증**
            - primaryDownwardEvaluation.status = 'complete' 확인
            - primaryDownwardEvaluation.completedMappingCount = 전체 WBS 수와 동일 확인
            - primaryDownwardEvaluation.totalScore가 계산되는지 확인
            - primaryDownwardEvaluation.grade가 계산되는지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **summary 검증**
            - summary.completedPrimaryDownwardEvaluations = 전체 WBS 수와 동일 확인
            - summary.primaryDownwardEvaluation.totalScore가 계산되는지 확인
            - summary.primaryDownwardEvaluation.grade가 계산되는지 확인
- **4단계: 하향평가 미제출 처리 (complete → in_progress)**
    - PATCH /admin/performance-evaluation/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/bulk-reset?evaluationType=primary (전체 미제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **primaryDownwardEvaluation 객체 검증**
            - primaryDownwardEvaluation.status = 'in_progress' 확인
            - primaryDownwardEvaluation.completedMappingCount = 0 확인
            - primaryDownwardEvaluation.totalScore = null 확인
            - primaryDownwardEvaluation.grade = null 확인

### 하향평가 상태 전환 시나리오 (2차)

- **2차 하향평가도 1차와 동일한 상태 전환 흐름을 따름**
- **차이점**:
    - secondaryDownwardEvaluation 객체를 사용
    - evaluationType=secondary로 지정

---

## 대시보드 API 일관성 검증

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)
- POST /admin/performance-evaluation/downward-evaluations/... (하향평가 저장 및 제출)

### 다중 엔드포인트 일관성 검증

- **하향평가 저장 후 일관성 검증**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (1차 하향평가 저장)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - primaryDownwardEvaluation.status, completedMappingCount 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - 해당 WBS의 primaryDownwardEvaluation 정보 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
        - 배열에서 해당 직원의 primaryDownwardEvaluation 정보 기록
    - GET /admin/dashboard/{evaluationPeriodId}/my-evaluation-targets/{evaluatorId}/status (평가자 담당 대상자 현황 조회)
        - 배열에서 해당 직원의 primaryDownwardEvaluation 정보 기록
    - **일관성 검증**
        - 모든 엔드포인트의 primaryDownwardEvaluation.status가 일치하는지 확인
        - 모든 엔드포인트의 completedMappingCount가 일치하는지 확인
        - assigned-data의 개별 WBS 정보와 status의 집계 정보가 일치하는지 확인

- **하향평가 제출 후 일관성 검증**
    - PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/submit (1차 하향평가 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - primaryDownwardEvaluation.status, completedMappingCount, totalScore, grade 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - 해당 WBS의 primaryDownwardEvaluation.isCompleted, submittedAt 기록
        - summary.completedPrimaryDownwardEvaluations, summary.primaryDownwardEvaluation.totalScore, grade 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/complete-status (통합 조회)
        - primaryDownwardEvaluation.status, completedCount, totalScore, grade 기록
    - **일관성 검증**
        - 모든 엔드포인트의 primaryDownwardEvaluation.status가 일치하는지 확인
        - 모든 엔드포인트의 completedMappingCount/completedCount가 일치하는지 확인
        - summary.completedPrimaryDownwardEvaluations와 completedMappingCount가 일치하는지 확인
        - 모든 엔드포인트의 totalScore가 일치하는지 확인
        - 모든 엔드포인트의 grade가 일치하는지 확인

---

## 수정 가능 상태와의 연동 검증

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)
- POST /admin/performance-evaluation/downward-evaluations/... (하향평가 저장)

### 수정 가능 상태 변경 및 하향평가 수정 영향 검증

- **1차 하향평가 수정 가능 상태 변경**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/status (mappingId 조회)
        - 응답 배열에서 해당 직원의 mappingId 기록
    - PATCH /admin/performance-evaluation/evaluation-editable-status/{mappingId}?evaluationType=primaryDownward&isEditable=false (1차 하향평가 수정불가로 변경)
        - HTTP 200 응답 확인
    - **대시보드 API 수정 가능 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **editableStatus 객체 검증**
                - editableStatus.isPrimaryDownwardEvaluationEditable이 false인지 확인
            - **개별 WBS의 primaryDownwardEvaluation 객체 검증**
                - projects[].wbsList[].primaryDownwardEvaluation.isEditable이 false인지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - evaluationPeriod.editableStatus.isPrimaryDownwardEvaluationEditable이 false인지 확인
            - primaryDownwardEvaluation.isEditable이 false인지 확인
- **수정 불가 상태에서 하향평가 수정 시도**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (1차 하향평가 수정 시도)
        - HTTP 403 Forbidden 또는 422 UnprocessableEntity 응답 확인
        - 수정이 거부되는지 확인
- **수정 가능 상태 복원 후 하향평가 수정**
    - PATCH /admin/performance-evaluation/evaluation-editable-status/{mappingId}?evaluationType=primaryDownward&isEditable=true (1차 하향평가 수정가능으로 변경)
        - HTTP 200 응답 확인
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId} (1차 하향평가 수정)
        - HTTP 200 응답 확인
        - 수정이 성공하는지 확인
    - **대시보드 API 수정 가능 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - editableStatus.isPrimaryDownwardEvaluationEditable이 true인지 확인
            - projects[].wbsList[].primaryDownwardEvaluation.isEditable이 true인지 확인

- **2차 하향평가도 동일한 검증 수행**
    - evaluationType을 'secondaryDownward'로 변경하여 동일한 시나리오 검증

---

## 여러 직원의 하향평가 독립성 검증

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (직원 1, 직원 2 각각 프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (직원 1, 직원 2 각각 WBS 할당 생성)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)

### 직원별 독립적 하향평가 관리 검증

- **직원 1의 하향평가 저장 및 제출**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{employeeId1}/period/{periodId}/wbs/{wbsId1} (직원 1 하향평가 저장)
    - PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{employeeId1}/period/{periodId}/wbs/{wbsId1}/submit (직원 1 하향평가 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId1} (직원 1 평가기간 현황 조회)
        - primaryDownwardEvaluation.status = 'complete' 확인
        - primaryDownwardEvaluation.completedMappingCount = 1 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId2} (직원 2 평가기간 현황 조회)
        - primaryDownwardEvaluation.status = 'none' 또는 'in_progress' 확인 (직원 1의 변경이 영향없음)
        - primaryDownwardEvaluation.completedMappingCount = 0 확인 (직원 1의 변경이 영향없음)
- **직원 2의 하향평가 저장 및 제출**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{employeeId2}/period/{periodId}/wbs/{wbsId2} (직원 2 하향평가 저장)
    - PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{employeeId2}/period/{periodId}/wbs/{wbsId2}/submit (직원 2 하향평가 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId2} (직원 2 평가기간 현황 조회)
        - primaryDownwardEvaluation.status = 'complete' 확인
        - primaryDownwardEvaluation.completedMappingCount = 1 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId1} (직원 1 평가기간 현황 조회)
        - primaryDownwardEvaluation.status = 'complete' 확인 (직원 2의 변경이 영향없음)
        - primaryDownwardEvaluation.completedMappingCount = 1 확인 (직원 2의 변경이 영향없음)
- **전체 직원 현황 조회 검증**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
        - 응답 배열에서 직원 1 정보 조회
            - primaryDownwardEvaluation.status = 'complete' 확인
            - primaryDownwardEvaluation.completedMappingCount = 1 확인
        - 응답 배열에서 직원 2 정보 조회
            - primaryDownwardEvaluation.status = 'complete' 확인
            - primaryDownwardEvaluation.completedMappingCount = 1 확인
        - 두 직원의 정보가 독립적으로 관리되는지 확인

---

## 점수 및 등급 계산 검증

### 선행 조건 설정
- 시드 데이터 생성
- POST /admin/evaluation-periods (평가기간 생성, gradeRanges 설정 포함)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성, 가중치 포함)
- POST /admin/evaluation-line/mappings (평가라인 설정)
- POST /admin/performance-evaluation/wbs-self-evaluations/... (자기평가 완료)

### 점수 및 등급 계산 검증 시나리오 (1차 하향평가)

- **일부 하향평가 제출 시 점수/등급 미계산 검증**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId1} (1차 하향평가 1 저장)
    - PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId1}/submit (1차 하향평가 1 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **primaryDownwardEvaluation 객체 검증**
            - primaryDownwardEvaluation.status = 'in_progress' 확인 (일부만 제출)
            - primaryDownwardEvaluation.totalScore = null 확인 (모든 1차 하향평가 제출 전)
            - primaryDownwardEvaluation.grade = null 확인 (모든 1차 하향평가 제출 전)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - summary.primaryDownwardEvaluation.totalScore = null 확인
        - summary.primaryDownwardEvaluation.grade = null 확인
- **모든 하향평가 제출 완료 시 점수/등급 계산 검증**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId2} (1차 하향평가 2 저장)
    - PATCH /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId2}/submit (1차 하향평가 2 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **primaryDownwardEvaluation 객체 검증**
            - primaryDownwardEvaluation.status = 'complete' 확인 (모든 1차 하향평가 제출 완료)
            - primaryDownwardEvaluation.totalScore가 계산되는지 확인 (가중치 기반, 0-100 범위)
            - primaryDownwardEvaluation.grade가 계산되는지 확인 (등급 기준에 따라 S, A, B, C, D 등)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - summary.primaryDownwardEvaluation.totalScore가 계산되는지 확인
        - summary.primaryDownwardEvaluation.grade가 계산되는지 확인
        - summary.primaryDownwardEvaluation.totalScore와 primaryDownwardEvaluation.totalScore가 일치하는지 확인
        - summary.primaryDownwardEvaluation.grade와 primaryDownwardEvaluation.grade가 일치하는지 확인
- **점수 재계산 검증 (하향평가 수정 후)**
    - POST /admin/performance-evaluation/downward-evaluations/primary/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId1} (1차 하향평가 1 수정)
        - score 값을 변경하여 저장
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - primaryDownwardEvaluation.totalScore가 재계산되는지 확인
        - primaryDownwardEvaluation.grade가 재계산되는지 확인 (점수 변경에 따라 등급도 변경 가능)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - summary.primaryDownwardEvaluation.totalScore가 재계산되는지 확인
        - summary.primaryDownwardEvaluation.grade가 재계산되는지 확인

### 점수 및 등급 계산 검증 시나리오 (2차 하향평가)

- **2차 하향평가도 1차와 동일한 점수/등급 계산 검증 수행**
- **차이점**:
    - secondaryDownwardEvaluation 객체를 사용
    - evaluationType=secondary로 지정

---

## 주의사항 및 검증 포인트

### 1. 선행 조건 순서 준수
- 모든 시나리오는 다음 순서를 반드시 따라야 함:
  1. 시드 데이터 생성
  2. 평가기간 생성
  3. 평가기간 시작
  4. 프로젝트 할당
  5. WBS 할당
  6. 평가라인 설정 (1차/2차 평가자 매핑)
  7. WBS 자기평가 완료
- 평가라인 설정 없이 하향평가 불가
- WBS 할당 없이 하향평가 불가 (할당된 WBS에만 하향평가 작성 가능)
- 자기평가가 제출되지 않은 WBS에는 하향평가 작성 불가

### 2. 점수 및 등급 계산 조건
- `totalScore`와 `grade`는 **모든 해당 유형의 하향평가가 제출되어야** 계산됨
- 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
- 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨
- 1차 하향평가와 2차 하향평가는 독립적으로 계산됨

### 3. 상태 전환 규칙
- `status: 'none'` → `'in_progress'` → `'complete'`
- `'complete'`는 모든 해당 유형의 하향평가가 제출된 상태
- 일부만 제출된 경우 `'in_progress'`
- 1차 하향평가와 2차 하향평가는 각각 독립적인 상태를 가짐

### 4. 제출 상태 관리
- `isCompleted`는 제출 여부를 나타냄
- 미제출 처리(`Reset`) 시:
    - 제출 상태(`isCompleted`)만 false로 변경됨
    - 내용(`evaluationContent`, `score`)은 유지됨

### 5. 데이터 일관성
- 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
- `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수
- 1차 하향평가와 2차 하향평가는 별도로 관리되므로 각각의 일관성을 확인해야 함

### 6. 수정 가능 상태 연동
- `editableStatus.isPrimaryDownwardEvaluationEditable`이 `false`일 때는 1차 하향평가 수정 불가
- `editableStatus.isSecondaryDownwardEvaluationEditable`이 `false`일 때는 2차 하향평가 수정 불가
- 개별 WBS의 `primaryDownwardEvaluation.isEditable`은 `editableStatus.isPrimaryDownwardEvaluationEditable` 값과 일치해야 함
- 개별 WBS의 `secondaryDownwardEvaluation.isEditable`은 `editableStatus.isSecondaryDownwardEvaluationEditable` 값과 일치해야 함

### 7. 평가라인 매핑
- 1차 평가자와 2차 평가자는 평가라인에서 관리됨
- 평가라인에 매핑되지 않은 평가자는 하향평가 작성 불가
- 평가라인 매핑 정보는 `GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data`에서 확인 가능

### 8. 자기평가와의 연동
- 하향평가는 자기평가와 연동되어야 함 (`selfEvaluationId`)
- 자기평가가 제출되지 않은 경우 하향평가 작성 불가
- 자기평가와 하향평가는 독립적으로 관리되지만 연동 관계를 유지해야 함





