# 평가기간 수정 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- evaluation-period

- **평기기간 수정**
    - PATCH /admin/evaluation-periods/{id}/basic-info 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/start-date 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/evaluation-setup-deadline
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/performance-deadline 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/self-evaluation-deadline 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/peer-evaluation-deadline 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/grade-ranges 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/settings/criteria-permission 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/settings/self-evaluation-permission 
    - GET /admin/evaluation-periods/{id} 
    - PATCH /admin/evaluation-periods/{id}/settings/final-evaluation-permission
    - GET /admin/evaluation-periods/{id}
    - PATCH /admin/evaluation-periods/{id}/settings/manual-permissions
    - GET /admin/evaluation-periods/{id}

