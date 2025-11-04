# 산출물(Deliverable) 관리 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- performance-evaluation (산출물 관리)
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

위 선행 조건이 완료된 후 산출물 관련 시나리오를 검증합니다.

---

## 산출물 기본 관리

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

### 산출물 생성 (신규 생성)

- POST /admin/performance-evaluation/deliverables (산출물 생성)
    - **생성 검증**
        - name, type, employeeId, wbsItemId로 산출물 생성
        - description, filePath 선택적으로 입력
        - 생성된 산출물 ID 반환 확인
        - HTTP 201 응답 확인
        - 응답에서 isActive가 true인지 확인
        - 응답에서 mappedDate가 설정되었는지 확인 (employeeId가 있을 경우)
        - 응답에서 createdAt이 설정되었는지 확인
    - **대시보드 API 생성 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **해당 WBS의 deliverables 배열 검증**
                - projects[].wbsList[].deliverables 배열에 생성된 산출물이 포함되는지 확인
                - projects[].wbsList[].deliverables[].id가 생성된 산출물 ID와 일치하는지 확인
                - projects[].wbsList[].deliverables[].name이 입력한 값과 일치하는지 확인
                - projects[].wbsList[].deliverables[].type이 입력한 값과 일치하는지 확인
                - projects[].wbsList[].deliverables[].description이 입력한 값과 일치하는지 확인
                - projects[].wbsList[].deliverables[].filePath가 입력한 값과 일치하는지 확인
                - projects[].wbsList[].deliverables[].employeeId가 입력한 값과 일치하는지 확인
                - projects[].wbsList[].deliverables[].isActive가 true인지 확인
                - projects[].wbsList[].deliverables[].mappedDate가 설정되었는지 확인
                - projects[].wbsList[].deliverables[].createdAt이 설정되었는지 확인
                - 산출물이 생성일시 내림차순으로 정렬되어 있는지 확인
        - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
            - 해당 WBS 항목의 산출물 목록에 생성된 산출물이 포함되는지 확인
            - 응답의 deliverables 배열에 생성된 산출물이 포함되는지 확인
        - GET /admin/performance-evaluation/deliverables/employee/{employeeId} (직원별 산출물 조회)
            - 해당 직원의 산출물 목록에 생성된 산출물이 포함되는지 확인
            - 응답의 deliverables 배열에 생성된 산출물이 포함되는지 확인

### 산출물 수정

- PUT /admin/performance-evaluation/deliverables/{id} (산출물 수정)
    - **수정 검증**
        - 산출물 ID로 수정
        - name, description, type, filePath 수정 가능
        - employeeId, wbsItemId 재할당 가능
        - isActive 상태 변경 가능
        - 수정된 산출물 정보 반환 확인
        - HTTP 200 응답 확인
        - 응답에서 updatedAt이 변경되었는지 확인
        - 응답에서 version이 증가하는지 확인
    - **대시보드 API 수정 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 deliverables 배열 검증**
                - projects[].wbsList[].deliverables[].name이 업데이트되는지 확인
                - projects[].wbsList[].deliverables[].description이 업데이트되는지 확인
                - projects[].wbsList[].deliverables[].type이 업데이트되는지 확인
                - projects[].wbsList[].deliverables[].filePath가 업데이트되는지 확인
                - projects[].wbsList[].deliverables[].isActive가 업데이트되는지 확인
                - projects[].wbsList[].deliverables[].id가 동일한지 확인 (같은 ID)
        - GET /admin/performance-evaluation/deliverables/{id} (산출물 상세 조회)
            - 수정된 정보가 반영되었는지 확인
            - updatedAt이 변경되었는지 확인
            - version이 증가했는지 확인

### 산출물 삭제 (소프트 삭제)

- DELETE /admin/performance-evaluation/deliverables/{id} (산출물 삭제)
    - **삭제 검증**
        - 산출물 ID로 삭제
        - HTTP 204 응답 확인 (응답 본문 없음)
    - **대시보드 API 삭제 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 deliverables 배열 검증**
                - projects[].wbsList[].deliverables 배열에서 삭제된 산출물이 제외되는지 확인 (삭제된 산출물은 조회되지 않음)
                - 삭제되지 않은 산출물만 표시되는지 확인
        - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
            - 삭제된 산출물이 목록에서 제외되는지 확인 (activeOnly=true 기본값)
            - activeOnly=false로 조회 시에도 삭제된 산출물이 조회되지 않는지 확인 (deletedAt IS NULL 조건)
        - GET /admin/performance-evaluation/deliverables/employee/{employeeId} (직원별 산출물 조회)
            - 삭제된 산출물이 목록에서 제외되는지 확인
        - GET /admin/performance-evaluation/deliverables/{id} (산출물 상세 조회)
            - 삭제된 산출물 조회 시 404 에러 발생 확인

### 산출물 비활성화

- PUT /admin/performance-evaluation/deliverables/{id} (산출물 수정 - isActive=false)
    - **비활성화 검증**
        - isActive를 false로 설정
        - HTTP 200 응답 확인
        - 응답에서 isActive가 false인지 확인
    - **대시보드 API 비활성화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **해당 WBS의 deliverables 배열 검증**
                - projects[].wbsList[].deliverables 배열에서 비활성화된 산출물이 제외되는지 확인 (isActive=false인 산출물은 조회되지 않음)
                - 활성 상태인 산출물만 표시되는지 확인
        - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=true (WBS 항목별 산출물 조회 - 활성만)
            - 비활성화된 산출물이 목록에서 제외되는지 확인
        - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=false (WBS 항목별 산출물 조회 - 전체)
            - 비활성화된 산출물이 목록에 포함되는지 확인 (삭제되지 않은 경우)
        - GET /admin/performance-evaluation/deliverables/{id} (산출물 상세 조회)
            - 비활성화된 산출물도 상세 조회 가능한지 확인 (isActive=false이지만 deletedAt IS NULL)

---

## 산출물 목록 및 상세 조회

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/deliverables (산출물 여러 개 생성)

### 직원별 산출물 조회

- GET /admin/performance-evaluation/deliverables/employee/{employeeId} (직원별 산출물 조회)
    - **조회 검증**
        - employeeId로 산출물 목록 조회
        - activeOnly 파라미터로 필터링 지원 (기본값: true)
        - HTTP 200 응답 확인
        - 응답 배열에 산출물 정보 포함 확인
    - **응답 구조 검증**
        - 각 항목에 id, name, type, employeeId, wbsItemId, isActive, createdAt 포함 확인
        - description, filePath, mappedDate, mappedBy 선택적 포함 확인
        - 삭제된 산출물(deletedAt IS NOT NULL)은 제외 확인
        - activeOnly=true일 때 비활성 산출물(isActive=false) 제외 확인
        - activeOnly=false일 때 비활성 산출물도 포함 확인 (삭제되지 않은 경우)
        - total 필드에 총 개수 포함 확인

### WBS 항목별 산출물 조회

- GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
    - **조회 검증**
        - wbsItemId로 산출물 목록 조회
        - activeOnly 파라미터로 필터링 지원 (기본값: true)
        - HTTP 200 응답 확인
        - 응답 배열에 산출물 정보 포함 확인
    - **응답 구조 검증**
        - 각 항목에 id, name, type, wbsItemId, employeeId, isActive, createdAt 포함 확인
        - description, filePath, mappedDate, mappedBy 선택적 포함 확인
        - 삭제된 산출물은 제외 확인
        - activeOnly=true일 때 비활성 산출물 제외 확인
        - activeOnly=false일 때 비활성 산출물도 포함 확인
        - 산출물이 생성일시 내림차순으로 정렬되어 있는지 확인
        - total 필드에 총 개수 포함 확인

### 산출물 상세 조회

- GET /admin/performance-evaluation/deliverables/{id} (산출물 상세 조회)
    - **조회 검증**
        - 산출물 ID로 상세정보 조회
        - HTTP 200 응답 확인
        - 응답에 모든 필드 포함 확인
    - **응답 구조 검증**
        - id, name, description, type, filePath, employeeId, wbsItemId 포함 확인
        - mappedDate, mappedBy, isActive 포함 확인
        - createdAt, updatedAt, deletedAt 포함 확인
        - createdBy, updatedBy, version 포함 확인
    - **에러 케이스 검증**
        - 존재하지 않는 ID로 조회 시 404 에러 확인
        - 잘못된 형식의 ID로 조회 시 400 에러 확인

---

## 산출물 벌크 작업

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성)

### 벌크 산출물 생성

- POST /admin/performance-evaluation/deliverables/bulk (벌크 산출물 생성)
    - **벌크 생성 검증**
        - 여러 산출물을 한 번에 생성
        - HTTP 201 응답 확인
        - 응답에서 successCount, failedCount 포함 확인
        - 응답에서 createdIds 배열에 생성된 산출물 ID 목록 포함 확인
        - 응답에서 failedItems 배열에 실패한 항목 정보 포함 확인 (있는 경우)
    - **대시보드 API 벌크 생성 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **각 WBS의 deliverables 배열 검증**
                - 각 WBS 항목에 생성된 산출물이 포함되는지 확인
                - 생성된 모든 산출물이 해당 WBS의 deliverables 배열에 포함되는지 확인
                - 산출물이 생성일시 내림차순으로 정렬되어 있는지 확인
        - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
            - 각 WBS 항목에 생성된 산출물이 포함되는지 확인
            - total 필드에 생성된 산출물 개수가 반영되는지 확인

### 벌크 산출물 삭제

- DELETE /admin/performance-evaluation/deliverables/bulk (벌크 산출물 삭제)
    - **벌크 삭제 검증**
        - 여러 산출물을 한 번에 삭제
        - HTTP 200 응답 확인
        - 응답에서 successCount, failedCount 포함 확인
        - 응답에서 failedIds 배열에 실패한 산출물 ID 목록 포함 확인 (있는 경우)
    - **대시보드 API 벌크 삭제 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - **각 WBS의 deliverables 배열 검증**
                - 삭제된 산출물이 모든 WBS의 deliverables 배열에서 제외되는지 확인
                - 삭제되지 않은 산출물만 표시되는지 확인
        - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
            - 삭제된 산출물이 목록에서 제외되는지 확인
            - total 필드에 삭제된 산출물 개수가 반영되는지 확인

---

## 산출물 대시보드 일관성 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/deliverables (산출물 생성)

### 다중 엔드포인트 일관성 검증

- **산출물 생성 후 일관성 검증**
    - POST /admin/performance-evaluation/deliverables (산출물 생성)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - 해당 WBS의 deliverables 배열에서 산출물 정보 기록
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
        - deliverables 배열에서 산출물 정보 기록
    - GET /admin/performance-evaluation/deliverables/employee/{employeeId} (직원별 산출물 조회)
        - deliverables 배열에서 산출물 정보 기록
    - GET /admin/performance-evaluation/deliverables/{id} (산출물 상세 조회)
        - 산출물 상세 정보 기록
    - **일관성 검증**
        - 세 엔드포인트의 산출물 ID가 일치하는지 확인
        - 세 엔드포인트의 산출물 name이 일치하는지 확인
        - 세 엔드포인트의 산출물 type이 일치하는지 확인
        - assigned-data의 WBS별 산출물 정보와 wbs별 조회의 정보가 일치하는지 확인
        - 상세 조회의 모든 필드가 정확한지 확인

- **산출물 수정 후 일관성 검증**
    - PUT /admin/performance-evaluation/deliverables/{id} (산출물 수정)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - 해당 WBS의 deliverables 배열에서 수정된 산출물 정보 기록
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
        - deliverables 배열에서 수정된 산출물 정보 기록
    - GET /admin/performance-evaluation/deliverables/{id} (산출물 상세 조회)
        - 수정된 산출물 상세 정보 기록
    - **일관성 검증**
        - 세 엔드포인트의 수정된 필드가 일치하는지 확인
        - assigned-data와 wbs별 조회의 정보가 일치하는지 확인
        - 상세 조회의 updatedAt이 변경되었는지 확인

---

## 산출물 상태 변경 및 필터링 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

### 산출물 상태 전환 시나리오

- **전체 상태 전환 흐름: 생성 → 활성 → 비활성 → 삭제**
- **1단계: 산출물 생성 (활성 상태)**
    - POST /admin/performance-evaluation/deliverables (산출물 생성)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **deliverables 배열 검증**
            - projects[].wbsList[].deliverables[].isActive = true 확인
            - 삭제되지 않은 산출물이 포함되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=true (활성만 조회)
        - 생성된 산출물이 목록에 포함되는지 확인
- **2단계: 산출물 비활성화 (활성 → 비활성)**
    - PUT /admin/performance-evaluation/deliverables/{id} (isActive=false로 수정)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **deliverables 배열 검증**
            - projects[].wbsList[].deliverables 배열에서 비활성화된 산출물이 제외되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=true (활성만 조회)
        - 비활성화된 산출물이 목록에서 제외되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=false (전체 조회)
        - 비활성화된 산출물이 목록에 포함되는지 확인
    - GET /admin/performance-evaluation/deliverables/{id} (상세 조회)
        - isActive가 false인지 확인
- **3단계: 산출물 활성화 (비활성 → 활성)**
    - PUT /admin/performance-evaluation/deliverables/{id} (isActive=true로 수정)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **deliverables 배열 검증**
            - projects[].wbsList[].deliverables 배열에 활성화된 산출물이 포함되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=true (활성만 조회)
        - 활성화된 산출물이 목록에 포함되는지 확인
- **4단계: 산출물 삭제 (활성 → 삭제)**
    - DELETE /admin/performance-evaluation/deliverables/{id} (산출물 삭제)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **deliverables 배열 검증**
            - projects[].wbsList[].deliverables 배열에서 삭제된 산출물이 제외되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
        - 삭제된 산출물이 목록에서 제외되는지 확인 (activeOnly와 무관하게 deletedAt IS NULL 조건)
    - GET /admin/performance-evaluation/deliverables/{id} (상세 조회)
        - 삭제된 산출물 조회 시 404 에러 확인

---

## 여러 직원의 산출물 독립성 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (직원 1, 직원 2 각각 프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (직원 1, 직원 2 각각 WBS 할당 생성)

### 직원별 독립적 산출물 관리 검증

- **직원 1의 산출물 생성 및 관리**
    - POST /admin/performance-evaluation/deliverables (직원 1 산출물 생성)
        - employeeId: employeeId1, wbsItemId: wbsItemId1
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId1}/assigned-data (직원 1 할당 데이터 조회)
        - 직원 1의 WBS에 생성된 산출물이 포함되는지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId2}/assigned-data (직원 2 할당 데이터 조회)
        - 직원 2의 WBS에는 직원 1의 산출물이 포함되지 않는지 확인
    - GET /admin/performance-evaluation/deliverables/employee/{employeeId1} (직원 1 산출물 조회)
        - 직원 1의 산출물만 조회되는지 확인
    - GET /admin/performance-evaluation/deliverables/employee/{employeeId2} (직원 2 산출물 조회)
        - 직원 2의 산출물 목록이 비어있거나 다른 산출물인지 확인
- **직원 2의 산출물 생성 및 관리**
    - POST /admin/performance-evaluation/deliverables (직원 2 산출물 생성)
        - employeeId: employeeId2, wbsItemId: wbsItemId2
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId2}/assigned-data (직원 2 할당 데이터 조회)
        - 직원 2의 WBS에 생성된 산출물이 포함되는지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId1}/assigned-data (직원 1 할당 데이터 조회)
        - 직원 1의 WBS에는 직원 2의 산출물이 포함되지 않는지 확인
    - GET /admin/performance-evaluation/deliverables/employee/{employeeId2} (직원 2 산출물 조회)
        - 직원 2의 산출물만 조회되는지 확인
    - GET /admin/performance-evaluation/deliverables/employee/{employeeId1} (직원 1 산출물 조회)
        - 직원 1의 산출물 목록이 변경되지 않았는지 확인

---

## 여러 WBS의 산출물 독립성 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 여러 개 생성)

### WBS별 독립적 산출물 관리 검증

- **WBS 1의 산출물 생성 및 관리**
    - POST /admin/performance-evaluation/deliverables (WBS 1 산출물 생성)
        - wbsItemId: wbsItemId1
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId1} (WBS 1 산출물 조회)
        - WBS 1의 산출물만 조회되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId2} (WBS 2 산출물 조회)
        - WBS 2의 산출물 목록이 비어있거나 다른 산출물인지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - projects[].wbsList[0].deliverables에 WBS 1의 산출물만 포함되는지 확인
        - projects[].wbsList[1].deliverables에 WBS 1의 산출물이 포함되지 않는지 확인
- **WBS 2의 산출물 생성 및 관리**
    - POST /admin/performance-evaluation/deliverables (WBS 2 산출물 생성)
        - wbsItemId: wbsItemId2
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId2} (WBS 2 산출물 조회)
        - WBS 2의 산출물만 조회되는지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId1} (WBS 1 산출물 조회)
        - WBS 1의 산출물 목록이 변경되지 않았는지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - projects[].wbsList[0].deliverables에 WBS 1의 산출물만 포함되는지 확인
        - projects[].wbsList[1].deliverables에 WBS 2의 산출물만 포함되는지 확인

---

## 산출물 정렬 및 필터링 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

### 산출물 정렬 검증

- **여러 산출물 생성 및 정렬 검증**
    - POST /admin/performance-evaluation/deliverables (산출물 1 생성 - 시간 1)
    - POST /admin/performance-evaluation/deliverables (산출물 2 생성 - 시간 2)
    - POST /admin/performance-evaluation/deliverables (산출물 3 생성 - 시간 3)
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId} (WBS 항목별 산출물 조회)
        - **정렬 검증**
            - deliverables 배열이 생성일시 내림차순으로 정렬되어 있는지 확인
            - 가장 최근에 생성된 산출물이 배열의 첫 번째에 있는지 확인
            - 가장 오래된 산출물이 배열의 마지막에 있는지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **정렬 검증**
            - projects[].wbsList[].deliverables 배열이 생성일시 내림차순으로 정렬되어 있는지 확인
            - 가장 최근에 생성된 산출물이 배열의 첫 번째에 있는지 확인

### 산출물 필터링 검증

- **활성/비활성 산출물 필터링 검증**
    - POST /admin/performance-evaluation/deliverables (활성 산출물 1 생성)
    - POST /admin/performance-evaluation/deliverables (활성 산출물 2 생성)
    - PUT /admin/performance-evaluation/deliverables/{id} (산출물 2 비활성화)
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=true (활성만 조회)
        - **필터링 검증**
            - 활성 산출물 1만 포함되는지 확인
            - 비활성 산출물 2가 제외되는지 확인
            - total 필드가 1인지 확인
    - GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=false (전체 조회)
        - **필터링 검증**
            - 활성 산출물 1이 포함되는지 확인
            - 비활성 산출물 2가 포함되는지 확인 (삭제되지 않은 경우)
            - total 필드가 2인지 확인
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
        - **필터링 검증**
            - projects[].wbsList[].deliverables 배열에 활성 산출물 1만 포함되는지 확인
            - 비활성 산출물 2가 제외되는지 확인
