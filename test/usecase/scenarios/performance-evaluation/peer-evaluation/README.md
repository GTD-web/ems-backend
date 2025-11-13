# 동료평가 관리 시나리오

## 식별된 검증해야하는 시나리오

각 하이라키별 시나리오 엔드포인트 순서대로 검증이 되어야 함.

사용되는 컨트롤러
- peer-evaluation-management (동료평가 관리)
- evaluation-period (평가기간 관리)
- evaluation-question (평가질문 관리)

---

## 시나리오 작성 가이드

모든 시나리오는 다음 순서로 선행 조건을 설정해야 합니다:
1. **시드 데이터 생성**: 직원, 부서, 평가질문 등 기본 데이터 생성
2. **평가기간 생성**: `POST /admin/evaluation-periods`
3. **평가기간 시작**: `POST /admin/evaluation-periods/{id}/start`
4. **평가질문 생성** (선택): `POST /admin/evaluation-questions` (동료평가 질문)

위 선행 조건이 완료된 후 동료평가 관련 시나리오를 검증합니다.

---

## 동료평가 기본 관리

### 선행 조건 설정
- 시드 데이터 생성 (직원, 부서)
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-questions (평가질문 생성 - 선택)

### 동료평가 요청 (단일)

- POST /admin/performance-evaluation/peer-evaluations/requests (동료평가 요청)
    - **요청 검증**
        - evaluatorId, evaluateeId, periodId로 동료평가 요청 생성
        - 평가 상태는 PENDING으로 생성됨
        - 요청 마감일(requestDeadline) 설정 가능
        - 평가질문(questionIds) 매핑 가능
        - 요청자(requestedBy) 기록 가능
        - HTTP 201 응답 확인
        - 생성된 동료평가 ID 반환 확인
    - **응답 구조 검증**
        - id 필드가 UUID 형식인지 확인
        - message 필드가 포함되는지 확인
    - **동일 평가자가 여러 피평가자 평가 가능**
        - 한 평가자가 여러 피평가자를 평가하도록 요청 가능
    - **여러 평가자가 한 피평가자 평가 가능**
        - 한 피평가자를 여러 평가자가 평가하도록 요청 가능

### 동료평가 요청 (일괄 - 한 피평가자 → 여러 평가자)

- POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators (일괄 요청)
    - **요청 검증**
        - evaluatorIds(배열), evaluateeId, periodId로 일괄 요청 생성
        - 모든 평가 상태는 PENDING으로 생성됨
        - HTTP 201 응답 확인
    - **응답 구조 검증**
        - results 배열에 각 요청 결과 포함
        - summary 객체에 total, success, failed 개수 포함
        - message 필드 포함
        - 성공/실패 정보가 각 결과에 포함됨
    - **부분 성공 처리**
        - 일부 평가자가 존재하지 않아도 나머지는 성공적으로 생성됨
    - **하위 호환성 필드**
        - ids 배열 (deprecated) 포함
        - count 필드 (deprecated) 포함

### 동료평가 요청 (일괄 - 한 평가자 → 여러 피평가자)

- POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees (일괄 요청)
    - **요청 검증**
        - evaluatorId, evaluateeIds(배열), periodId로 일괄 요청 생성
        - 모든 평가 상태는 PENDING으로 생성됨
        - HTTP 201 응답 확인
    - **응답 구조 검증**
        - results 배열에 각 요청 결과 포함
        - summary 객체에 total, success, failed 개수 포함
        - message 필드 포함
    - **부분 성공 처리**
        - 일부 피평가자가 존재하지 않아도 나머지는 성공적으로 생성됨

---

## 동료평가 답변 작성

### 선행 조건 설정
- 동료평가 요청이 생성되어 있어야 함
- 평가질문이 매핑되어 있어야 함

### 답변 저장/업데이트 (Upsert)

- POST /admin/performance-evaluation/peer-evaluations/{id}/answers (답변 저장)
    - **저장 검증**
        - peerEvaluationId, answers 배열로 답변 저장
        - 기존 답변이 있으면 업데이트
        - 기존 답변이 없으면 신규 저장
        - PENDING 상태였다면 자동으로 IN_PROGRESS로 변경
        - HTTP 201 응답 확인
    - **응답 구조 검증**
        - savedCount: 저장/업데이트된 답변 개수
        - message 필드 포함
    - **매핑되지 않은 질문 처리**
        - 동료평가에 매핑되지 않은 질문의 답변은 무시됨
    - **점수(score) 처리**
        - score는 선택 사항 (1-5 범위)
        - score 없이 답변만 저장 가능

---

## 동료평가 제출

### 선행 조건 설정
- 동료평가 요청이 생성되어 있어야 함
- 평가질문이 매핑되어 있어야 함
- 모든 질문에 답변이 작성되어 있어야 함

### 동료평가 제출

- POST /admin/performance-evaluation/peer-evaluations/{id}/submit (동료평가 제출)
    - **제출 검증**
        - 동료평가 ID로 제출
        - HTTP 200 응답 확인
    - **상태 변경 검증**
        - isCompleted가 true로 변경
        - status가 적절히 변경 (IN_PROGRESS → SUBMITTED 등)
        - completedAt에 제출 시각 기록
        - updatedAt 갱신
    - **제출 조건 검증**
        - 모든 매핑된 질문에 답변이 있어야 제출 가능
        - 답변이 없으면 400 에러
        - 이미 제출된 평가 재제출 시 400 에러

---

## 동료평가 조회

### 선행 조건 설정
- 동료평가 요청이 생성되어 있어야 함

### 동료평가 목록 조회 (통합)

- GET /admin/performance-evaluation/peer-evaluations (통합 목록 조회)
    - **조회 검증**
        - evaluatorId, evaluateeId, periodId, status로 필터링 지원
        - 페이지네이션 지원 (page, limit)
        - HTTP 200 응답 확인
    - **응답 구조 검증**
        - evaluations: 평가 상세 목록 배열
        - page, limit, total 필드 포함
        - 각 평가에 상세 정보 포함 (평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록)
    - **필터 조합**
        - evaluatorId만: 평가자 기준 필터링
        - evaluateeId만: 피평가자 기준 필터링
        - 둘 다: 복합 필터링
        - 둘 다 없음: 전체 목록

### 평가자의 동료평가 목록 조회 (Deprecated)

- GET /admin/performance-evaluation/peer-evaluations/evaluator/{evaluatorId} (평가자별 목록 조회)
    - **⚠️ Deprecated**: GET /?evaluatorId={evaluatorId} 사용 권장
    - **조회 검증**
        - evaluatorId로 해당 평가자의 동료평가 목록 조회
        - evaluateeId, periodId, status 필터 지원
        - 페이지네이션 지원
        - HTTP 200 응답 확인

### 피평가자의 동료평가 목록 조회 (Deprecated)

- GET /admin/performance-evaluation/peer-evaluations/evaluatee/{evaluateeId} (피평가자별 목록 조회)
    - **⚠️ Deprecated**: GET /?evaluateeId={evaluateeId} 사용 권장
    - **조회 검증**
        - evaluateeId로 해당 피평가자의 동료평가 목록 조회
        - evaluatorId, periodId, status 필터 지원
        - 페이지네이션 지원
        - HTTP 200 응답 확인

### 모든 평가자의 동료평가 목록 조회 (Deprecated)

- GET /admin/performance-evaluation/peer-evaluations/evaluator (전체 목록 조회)
    - **⚠️ Deprecated**: GET / 사용 권장
    - **조회 검증**
        - 모든 평가자의 동료평가 목록 조회
        - evaluateeId, periodId 필터 지원
        - 페이지네이션 지원
        - HTTP 200 응답 확인

### 동료평가 상세 조회

- GET /admin/performance-evaluation/peer-evaluations/{id} (상세 조회)
    - **조회 검증**
        - 동료평가 ID로 상세정보 조회
        - HTTP 200 응답 확인
    - **응답 구조 검증**
        - 평가기간 정보 객체 포함 (id, name, startDate, endDate, status)
        - 평가자 정보 객체 포함 (id, name, employeeNumber, email, departmentId, status)
        - 피평가자 정보 객체 포함
        - 평가자/피평가자 부서 정보 객체 포함
        - 매핑자 정보 객체 포함
        - 평가 상태 및 완료 여부 정보 포함
        - 할당된 평가질문 목록 포함 (표시 순서대로 정렬)
        - 각 질문의 답변 정보 포함 (답변이 있는 경우)

### 평가자에게 할당된 피평가자 목록 조회

- GET /admin/performance-evaluation/peer-evaluations/evaluator/{evaluatorId}/assigned-evaluatees (할당된 피평가자 목록)
    - **조회 검증**
        - evaluatorId로 평가자에게 할당된 피평가자 목록 조회
        - periodId로 특정 평가기간 필터링 가능
        - includeCompleted로 완료된 평가 포함 여부 설정 (기본: false)
        - HTTP 200 응답 확인
    - **응답 구조 검증**
        - 배열 형태로 직접 반환 (페이지네이션 없음)
        - 각 항목에 평가 정보 + 피평가자 정보 + 부서 정보 + 요청자 정보 포함
        - evaluationId, evaluateeId, periodId, status, isCompleted 포함
        - completedAt, requestDeadline, mappedDate, isActive 포함
        - evaluatee, evaluateeDepartment, mappedBy 객체 포함
    - **정렬 기준**
        - 미완료 평가 우선
        - 매핑일 최신순

---

## 동료평가 취소

### 선행 조건 설정
- 동료평가 요청이 생성되어 있어야 함

### 동료평가 요청 취소 (단일)

- DELETE /admin/performance-evaluation/peer-evaluations/{id} (요청 취소)
    - **취소 검증**
        - 동료평가 ID로 요청 취소
        - HTTP 204 응답 확인
    - **상태 변경 검증**
        - 평가 상태가 "cancelled"로 변경
        - 작성 중이거나 완료된 평가도 취소 가능
        - 평가자는 더 이상 해당 평가를 볼 수 없음

### 피평가자의 모든 동료평가 요청 취소 (일괄)

- DELETE /admin/performance-evaluation/peer-evaluations/evaluatee/{evaluateeId}/period/{periodId}/cancel-all (일괄 취소)
    - **취소 검증**
        - evaluateeId, periodId로 모든 동료평가 요청 일괄 취소
        - HTTP 200 응답 확인
    - **응답 구조 검증**
        - message 필드 포함
        - cancelledCount: 취소된 평가 개수
    - **일괄 취소 동작**
        - 해당 피평가자의 모든 평가 요청이 취소됨
        - 완료된 평가도 취소 가능
        - 모든 평가 상태가 "cancelled"로 변경
    - **격리성 검증**
        - 다른 피평가자의 평가는 영향받지 않음

---

## 에러 처리 및 검증

### 잘못된 요청 데이터 (400 Bad Request)

- **UUID 형식 검증**
    - 잘못된 형식의 evaluatorId로 요청 시 400 에러
    - 잘못된 형식의 evaluateeId로 요청 시 400 에러
    - 잘못된 형식의 periodId로 요청 시 400 에러
- **필수 필드 누락**
    - evaluatorId 누락 시 400 에러
    - evaluateeId 누락 시 400 에러
    - periodId 누락 시 400 에러
- **빈 배열 검증**
    - evaluatorIds 빈 배열로 요청 시 400 에러
    - evaluateeIds 빈 배열로 요청 시 400 에러
- **답변 검증**
    - answers 배열이 비어있거나 누락 시 400 에러
    - questionId 또는 answer 누락 시 400 에러

### 리소스를 찾을 수 없음 (404 Not Found)

- **존재하지 않는 리소스**
    - 존재하지 않는 evaluatorId로 요청 시 404 에러
    - 존재하지 않는 evaluateeId로 요청 시 404 에러
    - 존재하지 않는 periodId로 요청 시 404 에러
    - 존재하지 않는 동료평가 ID로 조회 시 404 에러
- **취소된 동료평가**
    - 취소된 동료평가에 답변 저장 시 404 에러

---

## 주의사항 및 검증 포인트

### 1. 선행 조건 순서 준수
- 모든 시나리오는 다음 순서를 반드시 따라야 함:
  1. 시드 데이터 생성
  2. 평가기간 생성
  3. 평가기간 시작
  4. 평가질문 생성 (선택)
  5. 동료평가 요청 생성
- 평가기간이 시작되지 않으면 동료평가 요청 불가

### 2. 평가질문 매핑
- questionIds를 제공하면 해당 질문들이 동료평가에 매핑됨
- questionIds를 생략하면 질문 없이 요청만 생성됨
- 매핑되지 않은 질문의 답변은 자동으로 무시됨

### 3. 상태 전환 규칙
- `status: 'pending'` → `'in_progress'` → `'submitted'` → `'completed'`
- `PENDING`: 요청 생성 직후
- `IN_PROGRESS`: 답변 작성 시작
- `SUBMITTED`: 제출 완료
- `CANCELLED`: 취소됨

### 4. 제출 조건
- `isCompleted`는 제출 여부를 나타냄
- 제출하려면 모든 매핑된 질문에 답변이 있어야 함
- 이미 제출된 평가는 재제출 불가

### 5. 데이터 일관성
- 동일한 평가자-피평가자-평가기간 조합으로 중복 요청 가능
- 각 요청은 독립적인 평가로 관리됨
- 취소된 평가는 조회되지 않음

### 6. 일괄 요청 처리
- 일괄 요청 시 부분 성공 지원
- 일부 리소스가 존재하지 않아도 나머지는 성공적으로 생성됨
- results 배열에서 각 요청의 성공/실패 정보 확인 가능

### 7. 응답 구조
- 상세 조회 시 평가기간, 평가자, 피평가자, 부서, 매핑자 정보가 객체로 포함됨
- ID 중복 제거: 객체로 제공되는 정보의 ID는 별도 필드로 제공하지 않음
- 할당된 평가질문 목록은 표시 순서대로 정렬됨

### 8. 하위 호환성
- 일괄 요청 응답에 ids, count 필드 포함 (deprecated 예정)
- deprecated 엔드포인트 대신 통합 엔드포인트 사용 권장
  - `GET /evaluator/{evaluatorId}` → `GET /?evaluatorId={evaluatorId}`
  - `GET /evaluatee/{evaluateeId}` → `GET /?evaluateeId={evaluateeId}`
  - `GET /evaluator` → `GET /`

