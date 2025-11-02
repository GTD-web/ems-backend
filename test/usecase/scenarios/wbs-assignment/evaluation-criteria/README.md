# 평가기준 및 평가라인 자동 생성 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- wbs-assignment-management
- wbs-evaluation-criteria-management
- evaluation-line-management
- project-assignment-management
- employee-management
- evaluation-period
- dashboard

> **사용 가능한 API**:
> - ✅ `/admin/employees` - 전체 직원 목록 조회 (특정 직원 정보는 목록에서 필터링)
> - ✅ `/admin/evaluation-criteria/project-assignments/available-projects` - 할당 가능한 프로젝트 목록 조회 (특정 프로젝트 정보는 목록에서 필터링)
> - ✅ `/admin/evaluation-criteria/evaluation-lines/period/{periodId}/evaluators` - 평가기간별 평가자 목록 조회
> - ✅ `/admin/evaluation-criteria/evaluation-lines/evaluator/{evaluatorId}/employees` - 평가자별 피평가자 조회
> - ✅ `/admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/settings` - 직원 평가설정 통합 조회 (평가라인 매핑 정보 포함)

- **평가기준 자동 생성 관리**
    - POST /admin/evaluation-periods (평가기간 생성)
    - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
    - POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성 - 선행 조건)
    - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
        - **평가기준 자동 생성 검증**
            - GET /admin/evaluation-criteria/wbs-evaluation-criteria (WBS 평가기준 조회)
                - wbsItemId로 할당 후 평가기준 조회
                - 빈 평가기준이 자동으로 생성되었는지 확인
                - criteria 필드 존재 확인 (빈 문자열 가능)
                - importance 필드가 기본값(5)으로 설정되었는지 확인
                - wbsItemId가 정확히 일치하는지 확인
        - **대시보드 API를 통한 평가항목 상태 검증**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (직원 평가기간 현황 조회)
                - employee 정보 존재 확인
                - employeeId 일치 확인
                - **평가항목 상태 검증**
                    - evaluationCriteria 객체 존재 확인
                    - evaluationCriteria.status가 'complete'인지 확인 (WBS 할당 완료)
                    - evaluationCriteria.assignedProjectCount 확인
                    - evaluationCriteria.assignedWbsCount 확인

- **평가기준 정보 조회 검증**
    - POST /admin/evaluation-periods (평가기간 생성)
    - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
    - POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
    - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
        - **대시보드 API를 통한 직원 할당 데이터 조회**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
                - projects 배열 존재 확인
                - projects 배열 길이가 0보다 큼
                - **프로젝트 정보 검증**
                    - 할당한 projectId에 해당하는 프로젝트 존재 확인
                    - projectName, projectCode 정보 일치 확인
                - **WBS 목록 검증**
                    - 해당 프로젝트의 wbsList 배열 존재 확인
                    - wbsList 배열 길이가 0보다 큼
                    - 할당한 wbsItemId에 해당하는 WBS 존재 확인
                    - wbsId, wbsName, wbsCode 정보 일치 확인
                - **평가기준 정보 검증**
                    - WBS의 criteria 배열 존재 확인
                    - criteria가 배열 타입인지 확인
                    - criteria 배열에 요소가 있는지 확인 (자동 생성된 평가기준)
                    - 평가기준의 criterionId, criteria, importance 필드 존재 확인
                    - > **참고**: criteria 배열의 id 필드는 `criterionId`로 명명됨

- **평가기준 중요도(importance) 기반 가중치(weight) 자동 계산**
    - POST /admin/evaluation-periods (평가기간 생성)
    - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
    - POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
    - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성 - 첫 번째)
    - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성 - 두 번째)
    - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성 - 세 번째)
        - **평가기준 중요도(importance) 설정**
            - GET /admin/evaluation-criteria/wbs-evaluation-criteria (첫 번째 WBS 평가기준 조회)
                - wbsItemId로 필터링하여 평가기준 ID 조회
            - POST /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/{wbsItemId} (평가기준 Upsert)
                - criteria 내용 유지
                - importance를 3으로 설정
            - GET /admin/evaluation-criteria/wbs-evaluation-criteria (두 번째 WBS 평가기준 조회)
                - wbsItemId로 필터링하여 평가기준 ID 조회
            - POST /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/{wbsItemId} (평가기준 Upsert)
                - criteria 내용 유지
                - importance를 5로 설정
            - GET /admin/evaluation-criteria/wbs-evaluation-criteria (세 번째 WBS 평가기준 조회)
                - wbsItemId로 필터링하여 평가기준 ID 조회
            - POST /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/{wbsItemId} (평가기준 Upsert)
                - criteria 내용 유지
                - importance를 2로 설정
        - **가중치 재계산 트리거**
            - POST /admin/evaluation-criteria/wbs-assignments (추가 WBS 할당 생성하여 가중치 재계산 트리거)
            - DELETE /admin/evaluation-criteria/wbs-assignments/wbs-item/{wbsItemId} (추가 WBS 할당 취소로 가중치 재계산)
                - employeeId, projectId, periodId를 body로 전달
                - 할당 취소와 동시에 남은 WBS들의 가중치 자동 재계산
        - **대시보드 API를 통한 가중치 검증**
            - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
                - projects[].wbsList 배열의 각 WBS 확인
                - **가중치 계산 공식 검증**
                    - importance 합계 계산: 3 + 5 + 2 = 10
                    - 첫 번째 WBS weight: (3 / 10) * 100 = 30%
                    - 두 번째 WBS weight: (5 / 10) * 100 = 50%
                    - 세 번째 WBS weight: (2 / 10) * 100 = 20%
                - **가중치 합계 검증**
                    - 모든 WBS의 weight 합계가 100인지 확인
                    - 각 WBS의 weight가 importance 비율과 일치하는지 확인
                - **가중치 소수점 처리 검증**
                    - weight 값이 소수점을 포함할 수 있음
                    - toBeCloseTo() 메서드로 근사값 비교 (소수점 1자리)

- **평가라인 자동 구성 관리**
    - **1차 평가자 (관리자) 자동 구성 검증**
        - POST /admin/evaluation-periods (평가기간 생성)
        - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
        - GET /admin/employees (전체 직원 목록 조회)
            - 목록에서 employeeId로 직원 찾기
            - managerId 필드 존재 여부 확인
            - managerId가 null이면 1차 평가자 미구성 예상
        - POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
        - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
            - **1차 평가자 자동 설정 검증**
                - GET /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/settings (직원 평가설정 통합 조회)
                    - evaluationLineMappings 배열에서 wbsItemId가 null인 매핑 조회 (1차 평가자)
                    - evaluatorId가 직원의 managerId와 일치하는지 확인
                    - 관리자가 없는 경우 1차 평가자 미구성 확인
                - 또는 GET /admin/evaluation-criteria/evaluation-lines/period/{periodId}/evaluators?type=primary (1차 평가자 목록 조회)
                    - evaluatorType이 'primary'인 평가자 목록 확인
                    - 특정 직원의 1차 평가자 확인 가능
    - **2차 평가자 (PM) 자동 구성 검증**
        - POST /admin/evaluation-periods (평가기간 생성)
        - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
        - GET /admin/evaluation-criteria/project-assignments/available-projects (할당 가능한 프로젝트 목록 조회)
            - periodId로 필터링하여 프로젝트 목록 조회
            - 목록에서 projectId로 프로젝트 찾기
            - managerId 필드 존재 여부 확인 (PM ID)
            - managerId가 null이면 2차 평가자 미구성 예상
        - POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
        - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
            - **2차 평가자 자동 설정 검증**
                - GET /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/settings (직원 평가설정 통합 조회)
                    - evaluationLineMappings 배열에서 wbsItemId가 있는 매핑 조회 (2차 평가자)
                    - 해당 wbsItemId와 일치하는 매핑 존재 확인
                    - evaluatorId가 프로젝트의 managerId와 일치하는지 확인
                    - PM이 없는 경우 2차 평가자 미구성 확인
                - 또는 GET /admin/evaluation-criteria/evaluation-lines/period/{periodId}/evaluators?type=secondary (2차 평가자 목록 조회)
                    - evaluatorType이 'secondary'인 평가자 목록 확인
    - **여러 WBS 할당 시 평가라인 구성 검증**
        - POST /admin/evaluation-periods (평가기간 생성)
        - POST /admin/evaluation-periods/{id}/start (평가기간 시작)
        - POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
        - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성 - 첫 번째)
        - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성 - 두 번째)
        - POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성 - 세 번째)
            - **1차 평가자 중복 방지 검증**
                - GET /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/settings (직원 평가설정 통합 조회)
                    - evaluationLineMappings 배열에서 wbsItemId가 null인 매핑 개수 확인
                    - Upsert 방식으로 1차 평가자가 1명만 구성되었는지 확인 (wbsItemId=null 매핑이 1개만 존재)
                    - 여러 WBS를 할당해도 동일한 1차 평가자 유지 확인
                - 또는 GET /admin/evaluation-criteria/evaluation-lines/period/{periodId}/evaluators?type=primary (1차 평가자 목록 조회)
                    - 해당 직원을 평가하는 primary 평가자가 1명만 존재하는지 확인
            - **WBS별 2차 평가자 구성 검증**
                - GET /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/settings (직원 평가설정 통합 조회)
                    - evaluationLineMappings 배열에서 wbsItemId가 있는 매핑들 조회
                    - 첫 번째 WBS에 대한 매핑 존재 확인 (wbsItemId 일치)
                    - 두 번째 WBS에 대한 매핑 존재 확인 (wbsItemId 일치)
                    - 세 번째 WBS에 대한 매핑 존재 확인 (wbsItemId 일치)
                    - 각 WBS 항목마다 독립적으로 2차 평가자가 구성되었는지 확인
                - 또는 GET /admin/evaluation-criteria/evaluation-lines/period/{periodId}/evaluators?type=secondary (2차 평가자 목록 조회)
                    - 각 WBS별로 독립적인 secondary 평가자 구성 확인
