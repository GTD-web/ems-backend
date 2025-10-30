# 평가기간 설정 변경 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- dashboard
- evaluation-period

- **설정 변경**
    - **평가기간 기준 설정 수동허용**
        - POST /admin/evaluation-periods 
        - GET /admin/evaluation-periods/active 
        - PATCH /admin/evaluation-periods/{id}/settings/criteria-permission
            - **대시보드 조회 검증**
                - GET /admin/dashboard/{evaluationPeriodId}/employees/status 
                    - evaluationPeriod.currentPhase 확인 (evaluation-setup)
                    - evaluationPeriod.manualSettings.criteriaSettingEnabled 확인 (true)
                    - evaluationPeriod.manualSettings.selfEvaluationSettingEnabled 확인 (false)
                    - evaluationPeriod.manualSettings.finalEvaluationSettingEnabled 확인 (false)
    - **평가기간 자기 평가 설정 수동 허용**
        - POST /admin/evaluation-periods 
        - GET /admin/evaluation-periods/active 
        - PATCH /admin/evaluation-periods/{id}/settings/self-evaluation-permission
            - **대시보드 조회 검증**
                - GET /admin/dashboard/{evaluationPeriodId}/employees/status 
                    - evaluationPeriod.currentPhase 확인 (evaluation-setup)
                    - evaluationPeriod.manualSettings.criteriaSettingEnabled 확인 (true)
                    - evaluationPeriod.manualSettings.selfEvaluationSettingEnabled 확인 (true)
                    - evaluationPeriod.manualSettings.finalEvaluationSettingEnabled 확인 (false)
    - **평가기간 최종 평가 설정 수동 허용**
        - POST /admin/evaluation-periods 
        - GET /admin/evaluation-periods/active 
        - PATCH /admin/evaluation-periods/{id}/settings/final-evaluation-permission
            - **대시보드 조회 검증**
                - GET /admin/dashboard/{evaluationPeriodId}/employees/status 
                    - evaluationPeriod.currentPhase 확인 (evaluation-setup)
                    - evaluationPeriod.manualSettings.criteriaSettingEnabled 확인 (true)
                    - evaluationPeriod.manualSettings.selfEvaluationSettingEnabled 확인 (false)
                    - evaluationPeriod.manualSettings.finalEvaluationSettingEnabled 확인 (true)

## 하위 시나리오

### 기준 설정 권한 변경
- **폴더**: `criteria-permission/`
- **테스트 파일**: `evaluation-period-criteria-permission.e2e-spec.ts`

### 자기평가 설정 권한 변경
- **폴더**: `self-evaluation-permission/`
- **테스트 파일**: `evaluation-period-self-evaluation-permission.e2e-spec.ts`

### 최종평가 설정 권한 변경
- **폴더**: `final-evaluation-permission/`
- **테스트 파일**: `evaluation-period-final-evaluation-permission.e2e-spec.ts`

