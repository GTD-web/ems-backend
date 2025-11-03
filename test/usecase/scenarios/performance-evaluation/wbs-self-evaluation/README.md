# WBS 자기평가 관리 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

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

위 선행 조건이 완료된 후 WBS 자기평가 관련 시나리오를 검증합니다.

---

## WBS 자기평가 기본 관리

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

### 자기평가 저장 (신규 생성)

- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (WBS 자기평가 저장)
    - **저장 검증**
        - employeeId, wbsItemId, periodId로 자기평가 저장
        - selfEvaluationContent, selfEvaluationScore, performanceResult 입력
        - 저장된 자기평가 ID 반환 확인
        - HTTP 200 응답 확인
    - **대시보드 API 저장 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **selfEvaluation 객체 검증**
                - selfEvaluation.status가 'in_progress'로 변경되는지 확인 (일부만 작성된 경우)
                - selfEvaluation.totalMappingCount 확인 (전체 WBS 할당 수)
                - selfEvaluation.completedMappingCount 확인 (제출 전이므로 변경 없음)
                - selfEvaluation.isEditable 확인 (editableStatus에서 가져옴)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **해당 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.selfEvaluationId가 생성되는지 확인
                - projects[].wbsList[].selfEvaluation.evaluationContent가 반영되는지 확인
                - projects[].wbsList[].selfEvaluation.score가 반영되는지 확인
                - projects[].wbsList[].selfEvaluation.isCompleted가 false인지 확인 (미제출 상태)
                - projects[].wbsList[].selfEvaluation.isEditable 확인
                - projects[].wbsList[].selfEvaluation.submittedAt이 null인지 확인
            - **summary 검증**
                - summary.completedSelfEvaluations가 변경되지 않는지 확인 (제출 전)
                - summary.selfEvaluation.totalScore가 null인지 확인 (모든 자기평가 제출 전)
                - summary.selfEvaluation.grade가 null인지 확인 (모든 자기평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **selfEvaluation 객체 검증**
                - selfEvaluation.status가 'in_progress'인지 확인
                - selfEvaluation.completedMappingCount가 변경되지 않는지 확인 (제출 전)

### 자기평가 수정 (제출 전)

- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (WBS 자기평가 저장 - 기존 수정)
    - **수정 검증**
        - 동일한 employeeId, wbsItemId, periodId 조합으로 재저장
        - selfEvaluationContent, selfEvaluationScore, performanceResult 수정
        - 동일한 자기평가 ID 반환 확인 (Upsert 방식)
        - HTTP 200 응답 확인
        - version이 증가하는지 확인
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.evaluationContent가 업데이트되는지 확인
                - projects[].wbsList[].selfEvaluation.score가 업데이트되는지 확인
                - projects[].wbsList[].selfEvaluation.isCompleted가 false인지 확인 (제출 상태 유지)
                - projects[].wbsList[].selfEvaluation.selfEvaluationId가 동일한지 확인 (같은 ID)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - selfEvaluation.completedMappingCount가 변경되지 않는지 확인 (제출 전)

### 자기평가 제출 (단일)

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (WBS 자기평가 제출)
    - **제출 검증**
        - 자기평가 ID로 제출
        - HTTP 200 응답 확인
        - 응답에서 isCompleted가 true로 변경되었는지 확인
        - 응답에서 completedAt이 기록되었는지 확인
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 1 증가하는지 확인
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
            - **해당 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.isCompleted가 true로 변경되는지 확인
                - projects[].wbsList[].selfEvaluation.submittedAt이 기록되는지 확인
                - projects[].wbsList[].selfEvaluation.evaluationContent 유지 확인
                - projects[].wbsList[].selfEvaluation.score 유지 확인
            - **summary 검증**
                - summary.completedSelfEvaluations가 1 증가하는지 확인
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
                - selfEvaluation.status 확인 (complete 또는 in_progress)

### 자기평가 수정 (제출 후)

- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (제출된 자기평가 수정)
    - **수정 검증**
        - 제출된 자기평가를 다시 저장하여 수정
        - selfEvaluationContent, selfEvaluationScore, performanceResult 수정
        - HTTP 200 응답 확인
        - isCompleted가 true로 유지되는지 확인 (제출 상태 유지)
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.evaluationContent가 업데이트되는지 확인
                - projects[].wbsList[].selfEvaluation.score가 업데이트되는지 확인
                - projects[].wbsList[].selfEvaluation.isCompleted가 true로 유지되는지 확인 (제출 상태 유지)
                - projects[].wbsList[].selfEvaluation.submittedAt이 유지되는지 확인
            - **summary 검증**
                - summary.completedSelfEvaluations가 변경되지 않는지 확인 (제출 상태 유지)
                - summary.selfEvaluation.totalScore와 grade가 재계산되는지 확인 (모든 자기평가 제출 완료 시)

### 자기평가 내용 초기화 (Clear)

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/clear (WBS 자기평가 내용 초기화)
    - **초기화 검증**
        - 자기평가 ID로 내용 초기화
        - HTTP 200 응답 확인
        - 응답에서 evaluationContent, score가 null로 변경되었는지 확인
        - 제출 상태였던 경우 isCompleted가 false로 변경되고 completedAt이 null로 변경되는지 확인
    - **대시보드 API 초기화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.evaluationContent가 null로 변경되는지 확인
                - projects[].wbsList[].selfEvaluation.score가 null로 변경되는지 확인
                - 제출 상태였던 경우:
                    - projects[].wbsList[].selfEvaluation.isCompleted가 false로 변경되는지 확인
                    - projects[].wbsList[].selfEvaluation.submittedAt이 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **selfEvaluation 객체 검증**
                - 제출 상태였던 경우: selfEvaluation.completedMappingCount가 감소하는지 확인
                - selfEvaluation.status 확인
                    - 모든 자기평가가 초기화된 경우: 'none' 또는 'in_progress'
                    - 일부만 초기화된 경우: 'in_progress'
                - selfEvaluation.totalScore와 grade 확인
                    - 모든 자기평가가 초기화된 경우: null
                    - 일부만 초기화된 경우: 재계산 또는 null
            - **summary 검증**
                - 제출 상태였던 경우: summary.completedSelfEvaluations가 감소하는지 확인
                - summary.selfEvaluation.totalScore와 grade가 재계산되거나 null로 변경되는지 확인

### 자기평가 미제출 상태로 변경 (Reset)

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/reset (WBS 자기평가 미제출)
    - **미제출 처리 검증**
        - 자기평가 ID로 미제출 상태로 변경
        - HTTP 200 응답 확인
        - 응답에서 isCompleted가 false로 변경되었는지 확인
        - 응답에서 completedAt이 null로 변경되었는지 확인
        - 응답에서 evaluationContent와 score가 유지되는지 확인 (내용 유지)
    - **대시보드 API 미제출 처리 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 감소하는지 확인
                - selfEvaluation.status가 'in_progress'로 변경되는지 확인 (일부만 미제출 처리된 경우)
                - selfEvaluation.totalScore와 grade가 재계산되거나 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.isCompleted가 false로 변경되는지 확인
                - projects[].wbsList[].selfEvaluation.submittedAt이 null로 변경되는지 확인
                - projects[].wbsList[].selfEvaluation.evaluationContent와 score가 유지되는지 확인 (내용 유지)
            - **summary 검증**
                - summary.completedSelfEvaluations가 감소하는지 확인
                - summary.selfEvaluation.totalScore와 grade가 재계산되거나 null로 변경되는지 확인

---

## 자기평가 목록 및 상세 조회

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 저장)

### 자기평가 목록 조회

- GET /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId} (직원의 자기평가 목록 조회)
    - **조회 검증**
        - employeeId로 자기평가 목록 조회
        - periodId, projectId 필터링 지원
        - page, limit 페이징 지원
        - HTTP 200 응답 확인
        - 응답 배열에 자기평가 정보 포함 확인
    - **응답 구조 검증**
        - 각 항목에 id, wbsItemId, periodId, isCompleted, createdAt, updatedAt 포함 확인
        - 제출된 자기평가의 경우 completedAt 포함 확인

### 자기평가 상세 조회

- GET /admin/performance-evaluation/wbs-self-evaluations/{id} (WBS 자기평가 상세정보 조회)
    - **조회 검증**
        - 자기평가 ID로 상세정보 조회
        - HTTP 200 응답 확인
        - 응답에 평가기간, 직원, WBS 항목 정보 포함 확인
    - **응답 구조 검증**
        - id, wbsItemId, periodId, employeeId, isCompleted, createdAt, updatedAt 포함 확인
        - evaluationPeriod 객체 포함 확인 (id, name, startDate, endDate, status)
        - employee 객체 포함 확인 (id, employeeNumber, name, email)
        - wbsItem 객체 포함 확인 (id, wbsCode, title, status, projectId)
        - 제출된 자기평가의 경우 completedAt 포함 확인

---

## 자기평가 일괄 제출 및 초기화

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 여러 개 저장)

### 직원의 전체 자기평가 제출

- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-all (직원의 전체 WBS 자기평가 제출)
    - **일괄 제출 검증**
        - employeeId, periodId로 모든 자기평가 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedCount, failedCount, totalCount 포함 확인
        - completedEvaluations 배열에 제출된 자기평가 정보 포함 확인
        - failedEvaluations 배열에 실패한 자기평가 정보 포함 확인 (있는 경우)
    - **대시보드 API 일괄 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 전체 WBS 수와 동일해지는지 확인
                - selfEvaluation.status가 'complete'로 변경되는지 확인
                - selfEvaluation.totalScore가 계산되는지 확인 (가중치 기반)
                - selfEvaluation.grade가 계산되는지 확인 (등급 기준)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 selfEvaluation 객체 검증**
                - 모든 projects[].wbsList[].selfEvaluation.isCompleted가 true로 변경되는지 확인
                - 모든 projects[].wbsList[].selfEvaluation.submittedAt이 기록되는지 확인
            - **summary 검증**
                - summary.completedSelfEvaluations가 전체 WBS 수와 동일해지는지 확인
                - summary.selfEvaluation.totalScore가 계산되는지 확인
                - summary.selfEvaluation.grade가 계산되는지 확인

### 프로젝트별 자기평가 제출

- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/project/{projectId}/submit (프로젝트별 WBS 자기평가 제출)
    - **프로젝트별 제출 검증**
        - employeeId, periodId, projectId로 특정 프로젝트의 모든 자기평가 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedCount, failedCount, totalCount 포함 확인
    - **대시보드 API 프로젝트별 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 프로젝트의 WBS만 제출 상태 확인**
                - 해당 프로젝트의 projects[].wbsList[].selfEvaluation.isCompleted가 true로 변경되는지 확인
                - 다른 프로젝트의 WBS는 영향받지 않는지 확인
            - **summary 검증**
                - summary.completedSelfEvaluations가 증가하지만 일부만 증가하는지 확인
                - summary.selfEvaluation.totalScore와 grade가 null인지 확인 (일부만 제출된 경우)

### 직원의 전체 자기평가 내용 초기화

- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/clear (직원의 전체 WBS 자기평가 내용 초기화)
    - **일괄 초기화 검증**
        - employeeId, periodId로 모든 자기평가 내용 초기화
        - HTTP 200 응답 확인
        - 응답에서 clearedCount, clearedEvaluations 포함 확인
    - **대시보드 API 일괄 초기화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 0으로 변경되는지 확인 (제출 상태였던 경우)
                - selfEvaluation.status가 'none' 또는 'in_progress'로 변경되는지 확인
                - selfEvaluation.totalScore와 grade가 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 selfEvaluation 객체 검증**
                - 모든 projects[].wbsList[].selfEvaluation.evaluationContent가 null로 변경되는지 확인
                - 모든 projects[].wbsList[].selfEvaluation.score가 null로 변경되는지 확인
                - 제출 상태였던 경우 isCompleted가 false로 변경되고 submittedAt이 null로 변경되는지 확인
            - **summary 검증**
                - summary.completedSelfEvaluations가 0으로 변경되는지 확인 (제출 상태였던 경우)
                - summary.selfEvaluation.totalScore와 grade가 null로 변경되는지 확인

### 프로젝트별 자기평가 내용 초기화

- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/project/{projectId}/clear (프로젝트별 WBS 자기평가 내용 초기화)
    - **프로젝트별 초기화 검증**
        - employeeId, periodId, projectId로 특정 프로젝트의 모든 자기평가 내용 초기화
        - HTTP 200 응답 확인
        - 응답에서 clearedCount, clearedEvaluations 포함 확인
    - **대시보드 API 프로젝트별 초기화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 프로젝트의 WBS만 초기화 확인**
                - 해당 프로젝트의 projects[].wbsList[].selfEvaluation.evaluationContent가 null로 변경되는지 확인
                - 다른 프로젝트의 WBS는 영향받지 않는지 확인

### 직원의 전체 자기평가 미제출 처리

- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/reset (직원의 전체 WBS 자기평가 미제출)
    - **일괄 미제출 처리 검증**
        - employeeId, periodId로 모든 제출된 자기평가 미제출 상태로 변경
        - HTTP 200 응답 확인
        - 응답에서 resetCount, resetEvaluations 포함 확인
    - **대시보드 API 일괄 미제출 처리 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - **selfEvaluation 객체 검증**
                - selfEvaluation.completedMappingCount가 0으로 변경되는지 확인
                - selfEvaluation.status가 'in_progress'로 변경되는지 확인
                - selfEvaluation.totalScore와 grade가 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **모든 WBS의 selfEvaluation 객체 검증**
                - 모든 projects[].wbsList[].selfEvaluation.isCompleted가 false로 변경되는지 확인
                - 모든 projects[].wbsList[].selfEvaluation.submittedAt이 null로 변경되는지 확인
                - projects[].wbsList[].selfEvaluation.evaluationContent와 score가 유지되는지 확인 (내용 유지)
            - **summary 검증**
                - summary.completedSelfEvaluations가 0으로 변경되는지 확인
                - summary.selfEvaluation.totalScore와 grade가 null로 변경되는지 확인

---

## 자기평가 상태 변경 및 대시보드 일관성 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성)

### 자기평가 상태 전환 시나리오

- **전체 상태 전환 흐름: none → in_progress → complete → in_progress → none**
- **1단계: 초기 상태 (none)**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'none' 확인
            - selfEvaluation.totalMappingCount = 할당된 WBS 수 확인
            - selfEvaluation.completedMappingCount = 0 확인
            - selfEvaluation.totalScore = null 확인
            - selfEvaluation.grade = null 확인
- **2단계: 자기평가 작성 시작 (none → in_progress)**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 저장)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'in_progress' 확인
            - selfEvaluation.completedMappingCount = 0 확인 (제출 전)
- **3단계: 모든 자기평가 제출 완료 (in_progress → complete)**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-all (전체 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'complete' 확인
            - selfEvaluation.completedMappingCount = 전체 WBS 수와 동일 확인
            - selfEvaluation.totalScore가 계산되는지 확인 (가중치 기반)
            - selfEvaluation.grade가 계산되는지 확인 (등급 기준)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **summary 검증**
            - summary.completedSelfEvaluations = 전체 WBS 수와 동일 확인
            - summary.selfEvaluation.totalScore가 계산되는지 확인
            - summary.selfEvaluation.grade가 계산되는지 확인
- **4단계: 자기평가 미제출 처리 (complete → in_progress)**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/reset (전체 미제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'in_progress' 확인
            - selfEvaluation.completedMappingCount = 0 확인
            - selfEvaluation.totalScore = null 확인
            - selfEvaluation.grade = null 확인
- **5단계: 자기평가 내용 초기화 (in_progress → none)**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/clear (전체 초기화)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'none' 또는 'in_progress' 확인 (할당은 남아있으므로)
            - selfEvaluation.totalMappingCount = 할당된 WBS 수 확인 (변경 없음)
            - selfEvaluation.completedMappingCount = 0 확인
            - selfEvaluation.totalScore = null 확인
            - selfEvaluation.grade = null 확인

---

## 대시보드 API 일관성 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 저장 및 제출)

### 다중 엔드포인트 일관성 검증

- **자기평가 저장 후 일관성 검증**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 저장)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - selfEvaluation.status, completedMappingCount 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - 해당 WBS의 selfEvaluation 정보 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
        - 배열에서 해당 직원의 selfEvaluation 정보 기록
    - **일관성 검증**
        - 세 엔드포인트의 selfEvaluation.status가 일치하는지 확인
        - 세 엔드포인트의 completedMappingCount가 일치하는지 확인
        - assigned-data의 개별 WBS 정보와 status의 집계 정보가 일치하는지 확인

- **자기평가 제출 후 일관성 검증**
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (자기평가 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - selfEvaluation.status, completedMappingCount, totalScore, grade 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - 해당 WBS의 selfEvaluation.isCompleted, submittedAt 기록
        - summary.completedSelfEvaluations, summary.selfEvaluation.totalScore, grade 기록
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/complete-status (통합 조회)
        - selfEvaluation.status, completedCount, totalScore, grade 기록
    - **일관성 검증**
        - 세 엔드포인트의 selfEvaluation.status가 일치하는지 확인
        - 세 엔드포인트의 completedMappingCount/completedCount가 일치하는지 확인
        - summary.completedSelfEvaluations와 completedMappingCount가 일치하는지 확인
        - 세 엔드포인트의 totalScore가 일치하는지 확인
        - 세 엔드포인트의 grade가 일치하는지 확인

---

## 수정 가능 상태와의 연동 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 저장)

### 수정 가능 상태 변경 및 자기평가 수정 영향 검증

- **자기평가 수정 가능 상태 변경**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/status (mappingId 조회)
        - 응답 배열에서 해당 직원의 mappingId 기록
    - PATCH /admin/performance-evaluation/evaluation-editable-status/{mappingId}?evaluationType=self&isEditable=false (자기평가 수정불가로 변경)
        - HTTP 200 응답 확인
    - **대시보드 API 수정 가능 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **editableStatus 객체 검증**
                - editableStatus.isSelfEvaluationEditable이 false인지 확인
            - **개별 WBS의 selfEvaluation 객체 검증**
                - projects[].wbsList[].selfEvaluation.isEditable이 false인지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
            - evaluationPeriod.editableStatus.isSelfEvaluationEditable이 false인지 확인
            - selfEvaluation.isEditable이 false인지 확인
- **수정 불가 상태에서 자기평가 수정 시도**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 수정 시도)
        - HTTP 403 Forbidden 또는 422 UnprocessableEntity 응답 확인
        - 수정이 거부되는지 확인
- **수정 가능 상태 복원 후 자기평가 수정**
    - PATCH /admin/performance-evaluation/evaluation-editable-status/{mappingId}?evaluationType=self&isEditable=true (자기평가 수정가능으로 변경)
        - HTTP 200 응답 확인
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 수정)
        - HTTP 200 응답 확인
        - 수정이 성공하는지 확인
    - **대시보드 API 수정 가능 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - editableStatus.isSelfEvaluationEditable이 true인지 확인
            - projects[].wbsList[].selfEvaluation.isEditable이 true인지 확인

---

## 여러 직원의 자기평가 독립성 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (직원 1, 직원 2 각각 프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (직원 1, 직원 2 각각 WBS 할당 생성)

### 직원별 독립적 자기평가 관리 검증

- **직원 1의 자기평가 저장 및 제출**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId1}/wbs/{wbsItemId1}/period/{periodId} (직원 1 자기평가 저장)
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (직원 1 자기평가 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId1} (직원 1 평가기간 현황 조회)
        - selfEvaluation.status = 'complete' 확인
        - selfEvaluation.completedMappingCount = 1 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId2} (직원 2 평가기간 현황 조회)
        - selfEvaluation.status = 'none' 또는 'in_progress' 확인 (직원 1의 변경이 영향없음)
        - selfEvaluation.completedMappingCount = 0 확인 (직원 1의 변경이 영향없음)
- **직원 2의 자기평가 저장 및 제출**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId2}/wbs/{wbsItemId2}/period/{periodId} (직원 2 자기평가 저장)
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (직원 2 자기평가 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId2} (직원 2 평가기간 현황 조회)
        - selfEvaluation.status = 'complete' 확인
        - selfEvaluation.completedMappingCount = 1 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId1} (직원 1 평가기간 현황 조회)
        - selfEvaluation.status = 'complete' 확인 (직원 2의 변경이 영향없음)
        - selfEvaluation.completedMappingCount = 1 확인 (직원 2의 변경이 영향없음)
- **전체 직원 현황 조회 검증**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
        - 응답 배열에서 직원 1 정보 조회
            - selfEvaluation.status = 'complete' 확인
            - selfEvaluation.completedMappingCount = 1 확인
        - 응답 배열에서 직원 2 정보 조회
            - selfEvaluation.status = 'complete' 확인
            - selfEvaluation.completedMappingCount = 1 확인
        - 두 직원의 정보가 독립적으로 관리되는지 확인

---

## 점수 및 등급 계산 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성, gradeRanges 설정 포함)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성, 가중치 포함)

### 점수 및 등급 계산 검증 시나리오

- **일부 자기평가 제출 시 점수/등급 미계산 검증**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId1}/period/{periodId} (자기평가 1 저장)
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (자기평가 1 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'in_progress' 확인 (일부만 제출)
            - selfEvaluation.totalScore = null 확인 (모든 자기평가 제출 전)
            - selfEvaluation.grade = null 확인 (모든 자기평가 제출 전)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - summary.selfEvaluation.totalScore = null 확인
        - summary.selfEvaluation.grade = null 확인
- **모든 자기평가 제출 완료 시 점수/등급 계산 검증**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId2}/period/{periodId} (자기평가 2 저장)
    - PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (자기평가 2 제출)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - **selfEvaluation 객체 검증**
            - selfEvaluation.status = 'complete' 확인 (모든 자기평가 제출 완료)
            - selfEvaluation.totalScore가 계산되는지 확인 (가중치 기반, 0-100 범위)
            - selfEvaluation.grade가 계산되는지 확인 (등급 기준에 따라 S, A, B, C, D 등)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - summary.selfEvaluation.totalScore가 계산되는지 확인
        - summary.selfEvaluation.grade가 계산되는지 확인
        - summary.selfEvaluation.totalScore와 selfEvaluation.totalScore가 일치하는지 확인
        - summary.selfEvaluation.grade와 selfEvaluation.grade가 일치하는지 확인
- **점수 재계산 검증 (자기평가 수정 후)**
    - POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId1}/period/{periodId} (자기평가 1 수정)
        - score 값을 변경하여 저장
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId} (개별 직원 평가기간 현황 조회)
        - selfEvaluation.totalScore가 재계산되는지 확인
        - selfEvaluation.grade가 재계산되는지 확인 (점수 변경에 따라 등급도 변경 가능)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - summary.selfEvaluation.totalScore가 재계산되는지 확인
        - summary.selfEvaluation.grade가 재계산되는지 확인

---

## 주의사항 및 검증 포인트

### 1. 선행 조건 순서 준수
- 모든 시나리오는 평가기간 생성 → 평가기간 시작 → 프로젝트 할당 → WBS 할당 순서를 반드시 따라야 함
- 프로젝트 할당 없이 WBS 할당 불가
- WBS 할당 없이 자기평가 저장 불가 (할당된 WBS에만 자기평가 작성 가능)

### 2. 점수 및 등급 계산 조건
- `totalScore`와 `grade`는 **모든 자기평가가 제출되어야** 계산됨
- 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
- 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨

### 3. 상태 전환 규칙
- `status: 'none'` → `'in_progress'` → `'complete'`
- `'complete'`는 모든 자기평가가 제출된 상태
- 일부만 제출된 경우 `'in_progress'`

### 4. 제출 상태 관리
- `isCompleted`는 제출 여부를 나타냄
- 내용 초기화(`Clear`) 시 제출 상태도 함께 초기화됨
- 미제출 처리(`Reset`) 시에는 제출 상태만 변경되고 내용은 유지됨

### 5. 데이터 일관성
- 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
- `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수

### 6. 수정 가능 상태 연동
- `editableStatus.isSelfEvaluationEditable`이 `false`일 때는 자기평가 수정 불가
- 개별 WBS의 `selfEvaluation.isEditable`은 `editableStatus.isSelfEvaluationEditable` 값과 일치해야 함

