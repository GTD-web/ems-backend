# 재작성 요청 관리 시나리오

## 개요

재작성 요청은 단계 승인 과정에서 평가자가 피평가자의 평가 내용에 대해 재작성을 요청할 때 생성됩니다.
이 문서는 재작성 요청과 관련된 모든 시나리오를 정의합니다.

## 사용되는 컨트롤러

- `revision-request` (재작성 요청 관리)
- `step-approval` (단계 승인 관리)
- `performance-evaluation` (평가 제출)
- `evaluation-period` (평가기간 관리)
- `evaluation-criteria` (프로젝트/WBS 할당)

---

## 재작성 요청 생성 흐름

재작성 요청은 단계 승인 API를 통해 `revision_requested` 상태로 변경할 때 자동으로 생성됩니다.

### 재작성 요청이 생성되는 시점

1. **평가기준 설정 단계**: `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/criteria`
   - status: `revision_requested`
   - revisionComment: 재작성 요청 사유 (필수)

2. **자기평가 단계**: `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/self`
   - status: `revision_requested`
   - revisionComment: 재작성 요청 사유 (필수)

3. **1차 하향평가 단계**: `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/primary`
   - status: `revision_requested`
   - revisionComment: 재작성 요청 사유 (필수)

4. **2차 하향평가 단계**: `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/secondary/{evaluatorId}`
   - status: `revision_requested`
   - revisionComment: 재작성 요청 사유 (필수)

---

## 시나리오 1: 자기평가 재작성 요청 및 완료

### 선행 조건 설정

- 시드 데이터 생성 (직원, 부서, 프로젝트, WBS 항목)
- `POST /admin/evaluation-periods` (평가기간 생성)
- `POST /admin/evaluation-periods/{id}/start` (평가기간 시작)
- `POST /admin/evaluation-criteria/project-assignments` (프로젝트 할당 생성)
- `POST /admin/evaluation-criteria/wbs-assignments` (WBS 할당 생성)
- WBS 자기평가 제출 완료

### 1-1. 자기평가 재작성 요청 생성

- **단계 승인 API를 통한 재작성 요청 생성**
  - `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/self`
    - **요청 검증**
      - status: `revision_requested`
      - revisionComment: "자기평가 내용을 보완해주세요."
      - HTTP 200 응답 확인
    - **재작성 요청 생성 검증**
      - 내부적으로 **2개의 재작성 요청**이 생성됨
      - 요청 1: 피평가자에게 (`recipientType: 'evaluatee'`)
      - 요청 2: 1차 평가자에게 (`recipientType: 'primary_evaluator'`)
      - step: `self`
      - isRead: false (미읽음 상태)
      - isCompleted: false (미완료 상태)

### 1-2. 재작성 요청 목록 조회 (관리자)

- `GET /admin/revision-requests?evaluationPeriodId={periodId}&employeeId={employeeId}`
  - **조회 검증**
    - HTTP 200 응답 확인
    - 응답 배열에 생성된 재작성 요청 포함 확인
  - **응답 구조 검증** (자기평가는 2개의 요청)
    - 피평가자 요청:
      - `recipientId`: 피평가자 ID
      - `recipientType`: `evaluatee`
      - `step`: `self`
      - `comment`: "자기평가 내용을 보완해주세요."
      - `isRead`: false
      - `isCompleted`: false
      - `approvalStatus`: `revision_requested`
    - 1차 평가자 요청:
      - `recipientId`: 1차 평가자 ID
      - `recipientType`: `primary_evaluator`
      - `step`: `self`
      - `comment`: "자기평가 내용을 보완해주세요."
      - `isRead`: false
      - `isCompleted`: false
      - `approvalStatus`: `revision_requested`

### 1-3. 내 재작성 요청 목록 조회 (직원)

- `GET /admin/revision-requests/me?evaluationPeriodId={periodId}`
  - **조회 검증**
    - CurrentUser로 직원(피평가자) ID 전달
    - HTTP 200 응답 확인
    - 자신에게 할당된 재작성 요청만 조회됨 (피평가자로서 받은 요청 1개)
  - **응답 구조 검증**
    - 응답 배열에 자신의 재작성 요청만 포함
    - 다른 수신자(1차 평가자)의 재작성 요청은 조회되지 않음

### 1-4. 읽지 않은 재작성 요청 수 조회

- `GET /admin/revision-requests/me/unread-count`
  - **조회 검증**
    - CurrentUser로 직원(피평가자) ID 전달
    - HTTP 200 응답 확인
    - `unreadCount`: 1 (피평가자로서 받은 요청 1개)

### 1-5. 재작성 요청 읽음 처리

- `PATCH /admin/revision-requests/{requestId}/read`
  - **읽음 처리 검증**
    - CurrentUser로 직원 ID 전달
    - HTTP 200 응답 확인
  - **읽음 상태 확인**
    - `GET /admin/revision-requests?requestId={requestId}` 호출
    - `isRead`: true
    - `readAt`: 읽음 처리 시각 (not null)
  - **읽지 않은 요청 수 감소 확인**
    - `GET /admin/revision-requests/me/unread-count` 호출
    - `unreadCount`: 0 (1 → 0)

### 1-6. 재작성 완료 응답 제출

- `PATCH /admin/revision-requests/{requestId}/complete`
  - **완료 응답 제출 검증**
    - CurrentUser로 직원 ID 전달
    - `responseComment`: "자기평가 내용을 수정하여 재제출하였습니다."
    - HTTP 200 응답 확인
  - **완료 상태 확인**
    - `GET /admin/revision-requests?requestId={requestId}` 호출
    - `isCompleted`: true
    - `completedAt`: 완료 처리 시각 (not null)
    - `responseComment`: "자기평가 내용을 수정하여 재제출하였습니다."
  - **단계 승인 상태 확인**
    - 재작성 완료 후 단계 승인 상태가 `pending`으로 자동 변경됨
    - `GET /admin/dashboard/{periodId}/employees/{employeeId}` 호출
    - `selfEvaluation.approvalStatus`: `pending`

---

## 시나리오 2: 1차 하향평가 재작성 요청 및 완료

### 선행 조건 설정

- 시나리오 1과 동일한 선행 조건
- 자기평가 승인 완료
- 1차 하향평가 제출 완료

### 2-1. 1차 하향평가 재작성 요청 생성

- **단계 승인 API를 통한 재작성 요청 생성**
  - `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/primary`
    - **요청 검증**
      - status: `revision_requested`
      - revisionComment: "1차 하향평가 점수를 재검토해주세요."
      - HTTP 200 응답 확인
    - **재작성 요청 생성 검증**
      - 내부적으로 재작성 요청이 생성됨
      - 수신자(recipient)는 1차 평가자(primaryEvaluatorId)
      - recipientType: `primary_evaluator`
      - step: `primary`
      - isRead: false
      - isCompleted: false

### 2-2. 1차 평가자가 재작성 요청 목록 조회

- `GET /admin/revision-requests/me?evaluationPeriodId={periodId}&step=primary`
  - **조회 검증**
    - CurrentUser로 1차 평가자 ID 전달
    - HTTP 200 응답 확인
    - 자신에게 할당된 1차 하향평가 재작성 요청만 조회됨

### 2-3. 1차 평가자가 재작성 완료 응답 제출

- `PATCH /admin/revision-requests/{requestId}/complete`
  - **완료 응답 제출 검증**
    - CurrentUser로 1차 평가자 ID 전달
    - `responseComment`: "1차 하향평가 점수를 재검토하여 수정하였습니다."
    - HTTP 200 응답 확인
  - **완료 상태 확인**
    - `isCompleted`: true
    - `completedAt`: not null
    - 단계 승인 상태가 `pending`으로 자동 변경됨

---

## 시나리오 3: 2차 하향평가 재작성 요청 및 완료 (다중 평가자)

### 선행 조건 설정

- 시나리오 2와 동일한 선행 조건
- 1차 하향평가 승인 완료
- 2차 하향평가 제출 완료 (여러 2차 평가자가 제출)

### 3-1. 2차 하향평가 재작성 요청 생성 (특정 평가자)

- **단계 승인 API를 통한 재작성 요청 생성**
  - `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/secondary/{evaluatorId}`
    - **요청 검증**
      - status: `revision_requested`
      - revisionComment: "2차 하향평가 내용을 보완해주세요."
      - HTTP 200 응답 확인
    - **재작성 요청 생성 검증**
      - 내부적으로 재작성 요청이 생성됨
      - 수신자(recipient)는 해당 2차 평가자(evaluatorId)
      - recipientType: `secondary_evaluator`
      - step: `secondary`

### 3-2. 2차 평가자가 재작성 요청 목록 조회

- `GET /admin/revision-requests/me?evaluationPeriodId={periodId}&step=secondary`
  - **조회 검증**
    - CurrentUser로 2차 평가자 ID 전달
    - HTTP 200 응답 확인
    - 자신에게 할당된 2차 하향평가 재작성 요청만 조회됨

### 3-3. 2차 평가자가 재작성 완료 응답 제출

- `PATCH /admin/revision-requests/{requestId}/complete`
  - **완료 응답 제출 검증**
    - CurrentUser로 2차 평가자 ID 전달
    - `responseComment`: "2차 하향평가 내용을 보완하였습니다."
    - HTTP 200 응답 확인
  - **완료 상태 확인**
    - `isCompleted`: true
    - `completedAt`: not null
    - 해당 평가자의 단계 승인 상태가 `pending`으로 자동 변경됨

---

## 시나리오 4: 관리자용 재작성 완료 응답 제출 (평가자 대신)

### 선행 조건 설정

- 시나리오 2와 동일한 선행 조건
- 1차 하향평가 재작성 요청 생성 완료

### 4-1. 관리자가 평가자 대신 재작성 완료 응답 제출

- `PATCH /admin/revision-requests/period/{periodId}/employee/{employeeId}/evaluator/{evaluatorId}/complete?step=primary`
  - **완료 응답 제출 검증**
    - `responseComment`: "관리자가 대신 재작성 완료 처리합니다."
    - HTTP 200 응답 확인
  - **완료 상태 확인**
    - `GET /admin/revision-requests?evaluationPeriodId={periodId}&employeeId={employeeId}&step=primary` 호출
    - 해당 평가자의 재작성 요청 `isCompleted`: true
    - `completedAt`: not null
    - `responseComment`: "관리자가 대신 재작성 완료 처리합니다."
  - **단계 승인 상태 확인**
    - 단계 승인 상태가 `pending`으로 자동 변경됨

---

## 시나리오 5: 필터링 및 검색 기능 검증

### 선행 조건 설정

- 여러 평가기간, 직원, 단계에 대한 재작성 요청 여러 개 생성

### 5-1. 평가기간별 필터링

- `GET /admin/revision-requests?evaluationPeriodId={periodId}`
  - **검증**
    - 해당 평가기간의 재작성 요청만 조회됨
    - 다른 평가기간의 재작성 요청은 조회되지 않음

### 5-2. 직원별 필터링

- `GET /admin/revision-requests?employeeId={employeeId}`
  - **검증**
    - 해당 직원의 재작성 요청만 조회됨
    - 다른 직원의 재작성 요청은 조회되지 않음

### 5-3. 단계별 필터링

- `GET /admin/revision-requests?step=self`
  - **검증**
    - 자기평가 단계의 재작성 요청만 조회됨
- `GET /admin/revision-requests?step=primary`
  - **검증**
    - 1차 하향평가 단계의 재작성 요청만 조회됨
- `GET /admin/revision-requests?step=secondary`
  - **검증**
    - 2차 하향평가 단계의 재작성 요청만 조회됨

### 5-4. 읽음 상태별 필터링

- `GET /admin/revision-requests?isRead=false`
  - **검증**
    - 미읽음 상태의 재작성 요청만 조회됨
- `GET /admin/revision-requests?isRead=true`
  - **검증**
    - 읽음 상태의 재작성 요청만 조회됨

### 5-5. 완료 상태별 필터링

- `GET /admin/revision-requests?isCompleted=false`
  - **검증**
    - 미완료 상태의 재작성 요청만 조회됨
- `GET /admin/revision-requests?isCompleted=true`
  - **검증**
    - 완료 상태의 재작성 요청만 조회됨

### 5-6. 복합 필터링

- `GET /admin/revision-requests?evaluationPeriodId={periodId}&step=self&isCompleted=false`
  - **검증**
    - 조건을 모두 만족하는 재작성 요청만 조회됨

---

## 시나리오 6: 재작성 요청 상태 전환 흐름 검증

### 선행 조건 설정

- 시나리오 1과 동일한 선행 조건
- 자기평가 제출 완료

### 6-1. 재작성 요청 생성 → 읽음 → 완료 전체 흐름

- **1단계: 재작성 요청 생성**
  - `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/self` (status: `revision_requested`)
  - **검증**
    - 단계 승인 상태: `revision_requested`
    - 재작성 요청 생성: `isRead: false`, `isCompleted: false`
    - 읽지 않은 요청 수: 1

- **2단계: 재작성 요청 읽음 처리**
  - `PATCH /admin/revision-requests/{requestId}/read`
  - **검증**
    - 재작성 요청 상태: `isRead: true`, `readAt: not null`
    - 읽지 않은 요청 수: 0
    - 단계 승인 상태: `revision_requested` (변경 없음)

- **3단계: 재작성 완료 응답 제출**
  - `PATCH /admin/revision-requests/{requestId}/complete`
  - **검증**
    - 재작성 요청 상태: `isCompleted: true`, `completedAt: not null`
    - 단계 승인 상태: `revision_requested` → `pending` (자동 변경)

- **4단계: 재승인**
  - `PATCH /admin/step-approvals/{periodId}/employees/{employeeId}/self` (status: `approved`)
  - **검증**
    - 단계 승인 상태: `pending` → `approved`

---

## 주의사항 및 검증 포인트

### 1. 재작성 요청 생성 조건

- 재작성 요청은 단계 승인 상태를 `revision_requested`로 변경할 때만 생성됨
- `revisionComment`는 필수 입력 항목

### 2. 수신자(Recipient) 타입

- **평가기준 설정(`criteria`)**: 
  - 수신자 1: 피평가자 (`evaluatee`)
  - 수신자 2: 1차 평가자 (`primary_evaluator`)
- **자기평가(`self`)**: 
  - 수신자 1: 피평가자 (`evaluatee`)
  - 수신자 2: 1차 평가자 (`primary_evaluator`)
- **1차 하향평가(`primary`)**: 
  - 수신자: 1차 평가자 (`primary_evaluator`)
- **2차 하향평가(`secondary`)**: 
  - 수신자: 2차 평가자 (`secondary_evaluator`), 평가자별로 개별 요청 생성

**중요**: `criteria`와 `self` 단계의 재작성 요청은 **2개의 별도 요청**으로 생성됩니다 (피평가자 + 1차 평가자)

### 3. 읽음 처리

- 읽음 처리는 수신자만 가능
- 읽음 처리는 재작성 요청 상태에만 영향을 주며, 단계 승인 상태는 변경되지 않음

### 4. 재작성 완료 응답 제출

- 재작성 완료 응답 제출은 수신자만 가능 (관리자용 API 제외)
- 재작성 완료 후 단계 승인 상태가 자동으로 `pending`으로 변경됨
- 재승인은 별도로 단계 승인 API를 통해 수행해야 함

### 5. 2차 하향평가 재작성 요청

- 2차 하향평가는 여러 평가자가 있을 수 있으므로, 평가자별로 개별 재작성 요청이 생성됨
- 각 평가자는 자신의 재작성 요청만 조회하고 완료 처리할 수 있음

### 6. 관리자용 API

- `PATCH /admin/revision-requests/period/{periodId}/employee/{employeeId}/evaluator/{evaluatorId}/complete`
- 관리자가 평가자를 대신하여 재작성 완료 응답을 제출할 수 있음
- 평가기간, 직원, 평가자, 단계를 지정하여 호출

### 7. 필터링 기능

- 모든 필터링 옵션은 조합하여 사용 가능
- `isRead`, `isCompleted`는 boolean 타입으로 `true`/`false` 값 사용

---

## 추가 검증 사항

### 1. 활동 내역 기록

- 재작성 완료 응답 제출 시 활동 내역이 자동으로 기록됨
- 활동 내역 기록 실패 시에도 재작성 완료는 정상 처리됨

### 2. 데이터 일관성

- 재작성 요청 목록 조회 결과와 단계 승인 상태가 일치해야 함
- 읽지 않은 요청 수와 실제 미읽음 재작성 요청 수가 일치해야 함

### 3. 권한 검증

- 수신자가 아닌 사용자는 재작성 요청을 읽거나 완료 처리할 수 없음
- 내 재작성 요청 목록 조회 시 다른 사용자의 재작성 요청은 조회되지 않음

