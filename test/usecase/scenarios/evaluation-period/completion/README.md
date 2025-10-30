# 평가기간 완료 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- dashboard
- evaluation-period

- **평가기간 완료**
    - POST /admin/evaluation-periods 
    - POST /admin/evaluation-periods/{id}/start 
    - GET /admin/evaluation-periods/active
        - **대시보드 조회 검증**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/status 
                - evaluationPeriod.status 확인 (in-progress)
                - evaluationPeriod.currentPhase 확인 (evaluation-setup)
                - evaluationPeriod.manualSettings.criteriaSettingEnabled 확인 (true)
                - evaluationPeriod.manualSettings.selfEvaluationSettingEnabled 확인 (false)
                - evaluationPeriod.manualSettings.finalEvaluationSettingEnabled 확인 (false)
    - POST /admin/evaluation-periods/{id}/complete
    - GET /admin/evaluation-periods/active (조회되지 않아야함)
        - **대시보드 조회 검증**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/status 
                - evaluationPeriod.status 확인 (completed)
                - evaluationPeriod.currentPhase 확인 (closure)
                - evaluationPeriod.manualSettings.criteriaSettingEnabled 확인 (false)
                - evaluationPeriod.manualSettings.selfEvaluationSettingEnabled 확인 (false)
                - evaluationPeriod.manualSettings.finalEvaluationSettingEnabled 확인 (false)

