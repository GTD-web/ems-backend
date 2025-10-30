# 평가대상 관리 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- evaluation-target
- evaluation-period
- dashboard

- **평가대상 기본 관리** 
    - POST /admin/evaluation-periods (평가기간 생성)
    - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
    - POST /admin/evaluation-periods/{evaluationPeriodId}/targets/bulk (대량 등록)
        - **대시보드 조회 검증**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/status 
                - 등록된 직원들이 조회됨
                - 모든 직원의 isEvaluationTarget 확인 (true)
                - exclusionInfo.isExcluded 확인 (false) - 등록된 직원은 제외되지 않음
                - evaluationPeriod.id와 생성된 평가기간 id 일치여부 확인 
    - POST /admin/evaluation-periods/{evaluationPeriodId}/targets/{employeeId} (단일 등록)
        - 이미 등록된 직원의 중복 등록 시도 시 409 Conflict 에러 반환
    - GET /admin/evaluation-periods/{evaluationPeriodId}/targets (평가대상자 조회)
        - includeExcluded=false: 제외되지 않은 대상자만 조회
        - includeExcluded=true: 제외된 대상자도 포함하여 조회
    - GET /admin/evaluation-periods/{evaluationPeriodId}/targets/{employeeId}/check (평가대상 여부 확인)
        - 등록된 직원: isEvaluationTarget 확인 (true)
        - 등록되지 않은 직원: isEvaluationTarget 확인 (false)
    - **대량 등록 후 등록 해제 관리**
        - DELETE /admin/evaluation-periods/{evaluationPeriodId}/targets/{employeeId1} (첫 번째 직원 등록 해제)
            - success: true 반환
        - DELETE /admin/evaluation-periods/{evaluationPeriodId}/targets/{employeeId2} (두 번째 직원 등록 해제)
            - success: true 반환
        - GET /admin/evaluation-periods/{evaluationPeriodId}/targets (부분 해제 후 조회)
            - 해제된 직원들은 조회되지 않음 (소프트 삭제)
            - 남은 직원들만 조회됨
        - DELETE /admin/evaluation-periods/{evaluationPeriodId}/targets (나머지 전체 등록 해제)
            - deletedCount: 남은 대상자 수 반환
        - GET /admin/evaluation-periods/{evaluationPeriodId}/targets (최종 조회)
            - 빈 배열 반환 (모든 직원이 등록 해제됨)
        - GET /admin/evaluation-periods/{evaluationPeriodId}/targets/excluded (제외된 대상자 조회)
            - 빈 배열 반환 (등록 해제와 제외는 다른 개념)
        - **대시보드 등록 해제 검증**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/status (기본 조회)
                - 등록 해제된 직원 제외하여 조회됨 (빈 배열)
            - GET /admin/dashboard/{evaluationPeriodId}/employees/status?includeUnregistered=true (등록 해제 포함 조회)
                - 등록 해제된 직원들도 조회됨 (isEvaluationTarget: false)
                - exclusionInfo.isExcluded 확인 (false) - 등록 해제된 직원은 제외되지 않음
                - evaluationPeriod.id와 생성된 평가기간 id 일치여부 확인



