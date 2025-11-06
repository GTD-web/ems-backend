# 감사로그 자동 저장 시나리오

## 식별된 검증해야하는 시나리오

각 API 요청이 들어올 때 자동으로 감사로그가 저장되는지 검증합니다.

사용되는 컨트롤러
- audit-log (감사로그 조회)
- evaluation-period (평가기간 관리)
- performance-evaluation (성과평가 관리)
- evaluation-criteria (평가 기준 관리)
- dashboard (대시보드 조회)

---

## 시나리오 작성 가이드

모든 시나리오는 다음 순서로 검증합니다:
1. **API 요청 전송**: 다양한 엔드포인트에 요청 전송
2. **감사로그 자동 저장 검증**: 각 요청에 대해 감사로그가 자동으로 저장되었는지 확인
3. **감사로그 내용 검증**: 저장된 감사로그의 요청/응답 데이터가 올바른지 확인
4. **감사로그 조회 검증**: 감사로그 조회 API를 통해 저장된 로그를 확인

---

## 감사로그 자동 저장 기본 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)

### GET 요청 감사로그 자동 저장

- GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'GET'인지 확인
                - requestUrl이 '/admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status'를 포함하는지 확인
                - responseStatusCode가 200인지 확인
                - response가 정의되어 있는지 확인

- GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'GET'인지 확인
                - requestUrl이 '/admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data'를 포함하는지 확인
                - responseStatusCode가 200인지 확인
                - response가 정의되어 있는지 확인

- GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'GET'인지 확인
                - requestUrl이 '/admin/dashboard/{evaluationPeriodId}/employees/status'를 포함하는지 확인
                - responseStatusCode가 200인지 확인
                - response가 정의되어 있는지 확인

- GET /admin/audit-logs?page=1&limit=10&userId=test-user-id (감사로그 목록 조회 - 쿼리 파라미터 포함)
    - **감사로그 자동 저장 검증**
        - 요청 전송 시 쿼리 파라미터 포함
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestQuery가 정의되어 있는지 확인
                - requestQuery.page가 정의되어 있는지 확인
                - requestQuery.limit가 정의되어 있는지 확인
                - requestUrl에 쿼리 파라미터가 포함되어 있는지 확인

### POST 요청 감사로그 자동 저장

- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (WBS 자기평가 저장)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'POST'인지 확인
                - requestUrl이 '/admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}'를 포함하는지 확인
                - requestBody가 올바르게 저장되었는지 확인
                    - selfEvaluationContent 확인
                    - selfEvaluationScore 확인
                - responseStatusCode가 200인지 확인
                - response.id가 정의되어 있는지 확인
                - response가 정의되어 있는지 확인

- POST /admin/evaluation-periods (평가기간 생성)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'POST'인지 확인
                - requestUrl이 '/admin/evaluation-periods'를 포함하는지 확인
                - requestBody가 올바르게 저장되었는지 확인
                - responseStatusCode가 201인지 확인
                - response.id가 정의되어 있는지 확인
                - response가 정의되어 있는지 확인

### PATCH 요청 감사로그 자동 저장

- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator (WBS 자기평가 제출 - 피평가자 → 1차 평가자)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'PATCH'인지 확인
                - requestUrl이 '/admin/performance-evaluation/wbs-self-evaluations/{id}/submit-to-evaluator'를 포함하는지 확인
                - responseStatusCode가 200인지 확인
                - response가 정의되어 있는지 확인

### DELETE 요청 감사로그 자동 저장

- DELETE /admin/evaluation-periods/{id} (평가기간 삭제)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 감사로그가 자동으로 저장되었는지 확인
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - requestMethod가 'DELETE'인지 확인
                - requestUrl이 '/admin/evaluation-periods/{id}'를 포함하는지 확인
                - responseStatusCode가 200인지 확인
                - auditLog가 정의되어 있는지 확인

### 에러 응답 감사로그 자동 저장

- GET /admin/dashboard/{invalidPeriodId}/employees/{employeeId}/status (잘못된 UUID 형식으로 요청)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 에러 응답(400) 반환 (ParseUUID 데코레이터가 잘못된 UUID 형식으로 인해 BadRequestException 발생)
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - responseStatusCode가 400인지 확인
                - responseBody.message가 '올바른 UUID 형식이어야 합니다'를 포함하는지 확인
                - responseBody가 정의되어 있는지 확인
                - 에러 응답도 감사로그에 저장되었는지 확인

- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{invalidEmployeeId}/wbs/{wbsItemId}/period/{periodId} (존재하지 않는 직원으로 요청)
    - **감사로그 자동 저장 검증**
        - 요청 전송 후 에러 응답(400) 반환
        - GET /admin/audit-logs (감사로그 목록 조회)
            - **저장된 감사로그 검증**
                - responseStatusCode가 400인지 확인
                - auditLog가 정의되어 있는지 확인

---

## 감사로그 조회 기능 검증

### 감사로그 목록 조회 (필터링)

- GET /admin/audit-logs (감사로그 목록 조회 - 전체)
    - **조회 검증**
        - page, limit 파라미터로 페이징 확인
        - total, items, page, limit 응답 구조 확인
        - items.length가 0보다 큰지 확인
        - total이 0보다 큰지 확인
        - page가 1인지 확인
        - limit가 10인지 확인

- GET /admin/audit-logs?userId={userId} (사용자 ID로 필터링)
    - **조회 검증**
        - userId로 필터링된 결과만 반환되는지 확인
        - 모든 반환된 항목의 userId가 일치하는지 확인
        - items.length가 0보다 큰지 확인

- GET /admin/audit-logs?requestMethod=POST (HTTP 메서드로 필터링)
    - **조회 검증**
        - requestMethod가 'POST'인 항목만 반환되는지 확인
        - 모든 반환된 항목의 requestMethod가 'POST'인지 확인
        - items.length가 0보다 큰지 확인

### 감사로그 상세 조회

- GET /admin/audit-logs/{id} (감사로그 상세 조회)
    - **조회 검증**
        - 저장된 감사로그 ID로 상세 정보 조회
        - 모든 필드가 올바르게 반환되는지 확인
            - id 확인
            - requestMethod 확인
            - requestUrl 확인
            - responseStatusCode 확인
            - requestId 확인
            - requestIp 확인
            - requestStartTime 확인
            - requestEndTime 확인
            - duration이 0 이상인지 확인

---

## 감사로그 메타데이터 검증

### 요청 ID 생성 검증

- 여러 요청 전송 후 감사로그 조회
    - **요청 ID 검증**
        - 각 요청마다 고유한 requestId가 생성되었는지 확인
        - requestId 형식이 올바른지 확인 (예: 'req-xxx-xxx')

### 사용자 정보 저장 검증

- 인증된 사용자로 요청 전송 후 감사로그 조회
    - **사용자 정보 검증**
        - userId가 올바르게 저장되었는지 확인
        - userEmail이 올바르게 저장되었는지 확인
        - userName이 올바르게 저장되었는지 확인
        - employeeNumber가 올바르게 저장되었는지 확인

### 요청 시간 및 지속 시간 검증

- 요청 전송 후 감사로그 조회
    - **시간 정보 검증**
        - requestStartTime이 올바르게 기록되었는지 확인
        - requestEndTime이 올바르게 기록되었는지 확인
        - duration이 올바르게 계산되었는지 확인
        - duration이 양수인지 확인
        - requestEndTime이 requestStartTime보다 이후인지 확인

### IP 주소 저장 검증

- 요청 전송 후 감사로그 조회
    - **IP 주소 검증**
        - requestIp가 올바르게 기록되었는지 확인
        - requestIp 형식이 올바른지 확인 (IPv4 또는 IPv6)

### 헤더 정보 저장 검증

- POST 요청 전송 후 감사로그 조회
    - **헤더 정보 검증**
        - requestHeaders가 올바르게 저장되었는지 확인
        - content-type이 올바르게 저장되었는지 확인
        - authorization 헤더가 마스킹되었는지 확인 (민감 정보 보호)

### 요청/응답 본문 저장 검증

- POST 요청 전송 후 감사로그 조회
    - **요청 본문 검증**
        - requestBody가 올바르게 저장되었는지 확인
        - JSON 형식이 올바르게 저장되었는지 확인
    - **응답 본문 검증**
        - responseBody가 올바르게 저장되었는지 확인
        - JSON 형식이 올바르게 저장되었는지 확인

### 쿼리 파라미터 저장 검증

- GET 요청 전송 시 쿼리 파라미터 포함 후 감사로그 조회
    - **쿼리 파라미터 검증**
        - requestQuery가 올바르게 저장되었는지 확인
        - 모든 쿼리 파라미터가 포함되었는지 확인
        - requestUrl에 쿼리 파라미터가 포함되어 있는지 확인

---

## 감사로그 성능 검증

### 동시 요청 처리 검증

- 여러 요청을 동시에 전송 후 감사로그 조회
    - **동시 처리 검증**
        - 모든 요청에 대해 감사로그가 저장되었는지 확인
        - 각 요청마다 고유한 requestId가 생성되었는지 확인

### 대량 요청 처리 검증

- 많은 수의 요청을 순차적으로 전송 후 감사로그 조회
    - **대량 처리 검증**
        - 모든 요청에 대해 감사로그가 저장되었는지 확인
        - 감사로그 조회 시 페이징이 올바르게 동작하는지 확인
        - total 개수가 올바른지 확인

---

## 감사로그 보안 검증

### 민감 정보 마스킹 검증

- POST 요청 전송 시 민감 정보 포함 후 감사로그 조회
    - **민감 정보 마스킹 검증**
        - password 필드가 마스킹되었는지 확인
        - authorization 헤더가 마스킹되었는지 확인
        - 기타 민감 정보가 마스킹되었는지 확인

### 접근 권한 검증

- GET /admin/audit-logs (감사로그 목록 조회)
    - **접근 권한 검증**
        - 관리자 권한이 필요한지 확인
        - 일반 사용자가 접근 시 403 응답 확인
    - **감사로그 자동 저장 검증**
        - 권한 오류도 감사로그에 저장되었는지 확인
        - responseStatusCode가 403인지 확인

---

## 감사로그 연속성 검증

### 요청 체인 검증

- 평가기간 생성 → 시작 → 프로젝트 할당 → WBS 할당 → 자기평가 저장 순서로 요청 전송
    - **연속성 검증**
        - 각 요청마다 감사로그가 저장되었는지 확인
        - 요청 순서가 올바르게 기록되었는지 확인
        - 각 요청의 requestId가 고유한지 확인
        - 이전 요청의 결과가 다음 요청에 영향을 주는지 확인 (비즈니스 로직 검증)

### 트랜잭션 검증

- 하나의 비즈니스 프로세스에 여러 API 요청이 포함된 경우
    - **트랜잭션 검증**
        - 각 API 요청마다 감사로그가 저장되었는지 확인
        - 요청 간의 관계가 올바르게 기록되었는지 확인
        - 요청 순서가 올바르게 기록되었는지 확인

