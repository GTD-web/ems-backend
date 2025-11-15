# 평가 활동 내역 검증 시나리오

## 개요

평가 활동 내역은 평가기간 피평가자 기준으로 일어난 모든 평가 활동을 기록합니다.
- WBS 자기평가 제출
- 하향평가 제출
- 산출물 생성/수정/삭제
- 단계 승인 상태 변경
- 재작성 완료
- 평가기준 제출

사용되는 컨트롤러
- evaluation-activity-log (활동 내역 조회)
- performance-evaluation (자기평가, 하향평가, 산출물 관리)
- step-approval (단계 승인 관리)
- revision-request (재작성 요청 관리)
- evaluation-criteria (평가기준 관리)

---

## 시나리오 작성 가이드

모든 시나리오는 다음 순서로 선행 조건을 설정해야 합니다:
1. **평가기간 생성**: `POST /admin/evaluation-periods`
2. **평가기간 시작**: `POST /admin/evaluation-periods/{id}/start`
3. **프로젝트 할당**: `POST /admin/evaluation-criteria/project-assignments`
4. **WBS 할당**: `POST /admin/evaluation-criteria/wbs-assignments`
5. **평가라인 매핑 생성**: 
   - `POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/primary-evaluator` (1차 평가자 구성)
   - `POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}/secondary-evaluator` (2차 평가자 구성)

위 선행 조건이 완료된 후 활동 내역 검증 시나리오를 실행합니다.

---

## 활동 내역 조회 API

### 기본 조회 엔드포인트
- `GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}` (평가기간 피평가자 기준 활동 내역 조회)
  - Query Parameters:
    - `activityType` (선택): 활동 유형 필터링
      - `wbs_self_evaluation`: WBS 자기평가
      - `downward_evaluation`: 하향평가
      - `peer_evaluation`: 동료평가
      - `additional_evaluation`: 추가 평가
      - `deliverable`: 산출물
      - `evaluation_status`: 평가 상태
      - `step_approval`: 단계 승인
      - `revision_request`: 재작성 요청
      - `evaluation_criteria`: 평가기준
    - `startDate` (선택): 활동 시작일 (ISO 8601 형식)
    - `endDate` (선택): 활동 종료일 (ISO 8601 형식)
    - `page` (선택): 페이지 번호 (기본값: 1)
    - `limit` (선택): 페이지 크기 (기본값: 20)

### 응답 구조
```typescript
{
  items: Array<{
    id: string;
    periodId: string;
    employeeId: string;
    activityType: string;
    activityAction: string;
    activityTitle?: string;
    activityDescription?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    performedBy: string;
    performedByName?: string;
    activityMetadata?: Record<string, any>;
    activityDate: Date;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }>;
  total: number;
  page: number;
  limit: number;
}
```

---

## 시나리오 1: WBS 자기평가 제출 활동 내역 검증

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 작성)

### 시나리오 1-1: 자기평가 관리자 제출 시 활동 내역 생성

#### 1-1-1. 자기평가 제출 전 활동 내역 확인
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=wbs_self_evaluation`
  - **검증**
    - 제출 전에는 활동 내역이 없거나 이전 제출 내역만 존재
    - `activityAction`이 `submitted`인 항목이 없거나 이전 제출 내역만 존재

#### 1-1-2. 자기평가 제출
- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-all (전체 제출)
  - **제출 검증**
    - HTTP 200 응답 확인
    - 제출 결과 확인

#### 1-1-3. 자기평가 제출 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=wbs_self_evaluation`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `wbs_self_evaluation`인지 확인
    - `activityAction`이 `submitted`인지 확인
    - `activityTitle`이 `"WBS 자기평가 제출"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인 (예: "{이름}님이 WBS 자기평가를 제출했습니다.")
    - `relatedEntityType`이 `wbs_self_evaluation`인지 확인
    - `performedBy`가 제출자 ID와 일치하는지 확인
    - `performedByName`이 제출자 이름과 일치하는지 확인
    - `activityDate`가 현재 시간과 유사한지 확인
    - `periodId`와 `employeeId`가 올바른지 확인
  - **정렬 검증**
    - `activityDate` 기준 내림차순 정렬 확인
    - 동일 시간일 경우 `createdAt` 기준 내림차순 정렬 확인

### 시나리오 1-2: 자기평가 1차 평가자 제출 시 활동 내역 생성

#### 1-2-1. 자기평가 1차 평가자 제출
- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-to-evaluator (1차 평가자 제출)
  - **제출 검증**
    - HTTP 200 응답 확인

#### 1-2-2. 자기평가 1차 평가자 제출 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=wbs_self_evaluation`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `wbs_self_evaluation`인지 확인
    - `activityAction`이 `submitted`인지 확인
    - `activityTitle`이 `"WBS 자기평가 제출 (1차 평가자)"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `performedBy`가 제출자 ID와 일치하는지 확인

### 시나리오 1-3: 자기평가 1차 평가자 제출 취소 시 활동 내역 생성

#### 1-3-1. 자기평가 1차 평가자 제출 취소
- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/reset-to-evaluator (1차 평가자 제출 취소)
  - **취소 검증**
    - HTTP 200 응답 확인

#### 1-3-2. 자기평가 1차 평가자 제출 취소 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=wbs_self_evaluation`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `wbs_self_evaluation`인지 확인
    - `activityAction`이 `cancelled`인지 확인
    - `activityTitle`이 `"WBS 자기평가 제출 취소 (1차 평가자)"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `performedBy`가 취소자 ID와 일치하는지 확인

---

## 시나리오 2: 하향평가 제출 활동 내역 검증

### 선행 조건 설정
- 시나리오 1의 선행 조건 완료
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 작성)
- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (자기평가 제출)
- PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary (1차 하향평가 저장)
- PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary (2차 하향평가 저장)

### 시나리오 2-1: 하향평가 일괄 제출 시 활동 내역 생성

#### 2-1-1. 하향평가 일괄 제출 전 활동 내역 확인
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=downward_evaluation`
  - **검증**
    - 제출 전에는 활동 내역이 없거나 이전 제출 내역만 존재

#### 2-1-2. 하향평가 일괄 제출
- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/bulk-submit (일괄 제출)
  - Body:
    - `evaluatorId`: 평가자 ID
    - `evaluationType`: `primary` 또는 `secondary`
  - **제출 검증**
    - HTTP 200 응답 확인
    - `submittedCount`, `skippedCount`, `failedCount` 확인

#### 2-1-3. 하향평가 일괄 제출 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=downward_evaluation`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `downward_evaluation`인지 확인
    - `activityAction`이 `submitted`인지 확인
    - `activityTitle`이 `"1차 하향평가 일괄 제출"` 또는 `"2차 하향평가 일괄 제출"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityType`이 `downward_evaluation`인지 확인
    - `performedBy`가 제출자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `evaluatorId`가 평가자 ID와 일치하는지 확인
      - `evaluationType`이 `primary` 또는 `secondary`인지 확인
      - `submittedCount`가 제출된 개수와 일치하는지 확인
      - `skippedCount`가 건너뛴 개수와 일치하는지 확인
      - `failedCount`가 실패한 개수와 일치하는지 확인
      - `submittedIds` 배열이 존재하는지 확인
      - `bulkOperation`이 `true`인지 확인

---

## 시나리오 3: 산출물 관리 활동 내역 검증

### 선행 조건 설정
- 시나리오 1의 선행 조건 완료

### 시나리오 3-1: 산출물 생성 시 활동 내역 생성

#### 3-1-1. 산출물 생성 전 활동 내역 확인
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=deliverable`
  - **검증**
    - 생성 전에는 활동 내역이 없거나 이전 생성 내역만 존재

#### 3-1-2. 산출물 생성
- POST /admin/performance-evaluation/deliverables (산출물 생성)
  - Body:
    - `name`: 산출물 이름
    - `type`: 산출물 유형
    - `employeeId`: 직원 ID
    - `wbsItemId`: WBS 항목 ID
    - `description`: 설명 (선택)
    - `filePath`: 파일 경로 (선택)
  - **생성 검증**
    - HTTP 200 응답 확인
    - 생성된 산출물 ID 확인

#### 3-1-3. 산출물 생성 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=deliverable`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `deliverable`인지 확인
    - `activityAction`이 `created`인지 확인
    - `activityTitle`이 `"산출물 생성"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityType`이 `deliverable`인지 확인
    - `relatedEntityId`가 생성된 산출물 ID와 일치하는지 확인
    - `performedBy`가 생성자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `deliverableName`이 산출물 이름과 일치하는지 확인
      - `deliverableType`이 산출물 유형과 일치하는지 확인
      - `wbsItemId`가 WBS 항목 ID와 일치하는지 확인

### 시나리오 3-2: 산출물 수정 시 활동 내역 생성

#### 3-2-1. 산출물 수정
- PUT /admin/performance-evaluation/deliverables/{id} (산출물 수정)
  - Body:
    - `name`: 수정된 산출물 이름 (선택)
    - `type`: 수정된 산출물 유형 (선택)
    - `description`: 수정된 설명 (선택)
  - **수정 검증**
    - HTTP 200 응답 확인

#### 3-2-2. 산출물 수정 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=deliverable`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `deliverable`인지 확인
    - `activityAction`이 `updated`인지 확인
    - `activityTitle`이 `"산출물 수정"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityId`가 수정된 산출물 ID와 일치하는지 확인
    - `performedBy`가 수정자 ID와 일치하는지 확인

### 시나리오 3-3: 산출물 삭제 시 활동 내역 생성

#### 3-3-1. 산출물 삭제
- DELETE /admin/performance-evaluation/deliverables/{id} (산출물 삭제)
  - **삭제 검증**
    - HTTP 200 응답 확인

#### 3-3-2. 산출물 삭제 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=deliverable`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `deliverable`인지 확인
    - `activityAction`이 `deleted`인지 확인
    - `activityTitle`이 `"산출물 삭제"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityId`가 삭제된 산출물 ID와 일치하는지 확인
    - `performedBy`가 삭제자 ID와 일치하는지 확인

---

## 시나리오 4: 단계 승인 상태 변경 활동 내역 검증

### 선행 조건 설정
- 시나리오 1의 선행 조건 완료
- POST /admin/evaluation-criteria/evaluation-criteria (평가기준 제출) (평가기준 설정 단계의 경우)

### 시나리오 4-1: 평가기준 설정 승인 시 활동 내역 생성

#### 4-1-1. 평가기준 설정 승인 전 활동 내역 확인
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=step_approval`
  - **검증**
    - 승인 전에는 활동 내역이 없거나 이전 승인 내역만 존재

#### 4-1-2. 평가기준 설정 승인
- PATCH /admin/step-approval/evaluation-criteria/{mappingId}/approve (평가기준 설정 승인)
  - Body:
    - `revisionComment`: 재작성 요청 코멘트 (선택)
  - **승인 검증**
    - HTTP 200 응답 확인

#### 4-1-3. 평가기준 설정 승인 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=step_approval`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `step_approval`인지 확인
    - `activityAction`이 `approved`인지 확인
    - `activityTitle`이 `"평가기준 설정 승인"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityType`이 `step_approval`인지 확인
    - `performedBy`가 승인자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `step`이 `criteria`인지 확인
      - `status`가 `approved`인지 확인
      - `revisionComment`가 존재하는 경우 확인

### 시나리오 4-2: 평가기준 설정 재작성 요청 시 활동 내역 생성

#### 4-2-1. 평가기준 설정 재작성 요청
- PATCH /admin/step-approval/evaluation-criteria/{mappingId}/revision-request (평가기준 설정 재작성 요청)
  - Body:
    - `revisionComment`: 재작성 요청 코멘트 (필수)
  - **재작성 요청 검증**
    - HTTP 200 응답 확인

#### 4-2-2. 평가기준 설정 재작성 요청 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=step_approval`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `step_approval`인지 확인
    - `activityAction`이 `revision_requested`인지 확인
    - `activityTitle`이 `"평가기준 설정 재작성 요청"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `performedBy`가 요청자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `step`이 `criteria`인지 확인
      - `status`가 `revision_requested`인지 확인
      - `revisionComment`가 재작성 요청 코멘트와 일치하는지 확인

### 시나리오 4-3: 자기평가 승인 시 활동 내역 생성

#### 4-3-1. 자기평가 승인
- PATCH /admin/step-approval/self-evaluation/{mappingId}/approve (자기평가 승인)
  - Body:
    - `revisionComment`: 재작성 요청 코멘트 (선택)
  - **승인 검증**
    - HTTP 200 응답 확인

#### 4-3-2. 자기평가 승인 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=step_approval`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `step_approval`인지 확인
    - `activityAction`이 `approved`인지 확인
    - `activityTitle`이 `"자기평가 승인"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `performedBy`가 승인자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `step`이 `self`인지 확인
      - `status`가 `approved`인지 확인

### 시나리오 4-4: 1차 하향평가 승인 시 활동 내역 생성

#### 4-4-1. 1차 하향평가 승인
- PATCH /admin/step-approval/primary-downward-evaluation/{mappingId}/approve (1차 하향평가 승인)
  - Body:
    - `revisionComment`: 재작성 요청 코멘트 (선택)
  - **승인 검증**
    - HTTP 200 응답 확인

#### 4-4-2. 1차 하향평가 승인 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=step_approval`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `step_approval`인지 확인
    - `activityAction`이 `approved`인지 확인
    - `activityTitle`이 `"1차 하향평가 승인"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `performedBy`가 승인자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `step`이 `primary`인지 확인
      - `status`가 `approved`인지 확인

### 시나리오 4-5: 2차 하향평가 승인 시 활동 내역 생성

#### 4-5-1. 2차 하향평가 승인
- PATCH /admin/step-approval/secondary-downward-evaluation/{mappingId}/approve (2차 하향평가 승인)
  - Body:
    - `revisionComment`: 재작성 요청 코멘트 (선택)
  - **승인 검증**
    - HTTP 200 응답 확인

#### 4-5-2. 2차 하향평가 승인 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=step_approval`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `step_approval`인지 확인
    - `activityAction`이 `approved`인지 확인
    - `activityTitle`이 `"2차 하향평가 승인"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `performedBy`가 승인자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `step`이 `secondary`인지 확인
      - `status`가 `approved`인지 확인
      - `evaluatorId`가 평가자 ID와 일치하는지 확인 (2차 평가자는 다중 지원)

---

## 시나리오 5: 재작성 완료 활동 내역 검증

### 선행 조건 설정
- 시나리오 1의 선행 조건 완료
- 재작성 요청이 생성된 상태

### 시나리오 5-1: 재작성 완료 응답 제출 시 활동 내역 생성

#### 5-1-1. 재작성 완료 응답 제출 전 활동 내역 확인
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=revision_request`
  - **검증**
    - 재작성 완료 전에는 활동 내역이 없거나 이전 완료 내역만 존재

#### 5-1-2. 재작성 완료 응답 제출
- POST /admin/revision-requests/{requestId}/complete (재작성 완료 응답 제출)
  - Body:
    - `responseComment`: 응답 코멘트
  - **제출 검증**
    - HTTP 200 응답 확인

#### 5-1-3. 재작성 완료 응답 제출 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=revision_request`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `revision_request`인지 확인
    - `activityAction`이 `revision_completed`인지 확인
    - `activityTitle`이 단계별로 다른지 확인
      - `criteria`: `"평가기준 설정 재작성 완료"`
      - `self`: `"자기평가 재작성 완료"`
      - `primary`: `"1차 하향평가 재작성 완료"`
      - `secondary`: `"2차 하향평가 재작성 완료"`
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityType`이 `revision_request`인지 확인
    - `relatedEntityId`가 재작성 요청 ID와 일치하는지 확인
    - `performedBy`가 응답자 ID와 일치하는지 확인
    - `activityMetadata` 검증
      - `step`이 단계와 일치하는지 확인 (`criteria`, `self`, `primary`, `secondary`)
      - `responseComment`가 응답 코멘트와 일치하는지 확인
      - `allCompleted`가 모든 수신자가 완료했는지 여부인지 확인

---

## 시나리오 6: 평가기준 제출 활동 내역 검증

### 선행 조건 설정
- 시나리오 1의 선행 조건 완료

### 시나리오 6-1: 평가기준 제출 시 활동 내역 생성

#### 6-1-1. 평가기준 제출 전 활동 내역 확인
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=evaluation_criteria`
  - **검증**
    - 제출 전에는 활동 내역이 없거나 이전 제출 내역만 존재

#### 6-1-2. 평가기준 제출
- POST /admin/evaluation-criteria/evaluation-criteria (평가기준 제출)
  - Body:
    - `periodId`: 평가기간 ID
    - `employeeId`: 직원 ID
  - **제출 검증**
    - HTTP 200 응답 확인

#### 6-1-3. 평가기준 제출 후 활동 내역 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=evaluation_criteria`
  - **활동 내역 생성 검증**
    - 최신 활동 내역이 생성되었는지 확인
    - `activityType`이 `evaluation_criteria`인지 확인
    - `activityAction`이 `submitted`인지 확인
    - `activityTitle`이 `"평가기준 제출"`인지 확인
    - `activityDescription`이 자동 생성되었는지 확인
    - `relatedEntityType`이 `evaluation_criteria`인지 확인
    - `performedBy`가 제출자 ID와 일치하는지 확인

---

## 시나리오 7: 활동 내역 필터링 및 조회 검증

### 시나리오 7-1: 활동 유형별 필터링

#### 7-1-1. 활동 유형별 조회
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=wbs_self_evaluation`
  - **검증**
    - 모든 항목의 `activityType`이 `wbs_self_evaluation`인지 확인
    - 다른 활동 유형의 항목이 포함되지 않는지 확인

- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `activityType=deliverable`
  - **검증**
    - 모든 항목의 `activityType`이 `deliverable`인지 확인
    - 다른 활동 유형의 항목이 포함되지 않는지 확인

### 시나리오 7-2: 날짜 범위 필터링

#### 7-2-1. 날짜 범위로 조회
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: 
    - `startDate=2024-01-01T00:00:00Z`
    - `endDate=2024-01-31T23:59:59Z`
  - **검증**
    - 모든 항목의 `activityDate`가 `startDate` 이후인지 확인
    - 모든 항목의 `activityDate`가 `endDate` 이전인지 확인
    - 범위 밖의 항목이 포함되지 않는지 확인

### 시나리오 7-3: 페이지네이션

#### 7-3-1. 페이지네이션 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `page=1&limit=10`
  - **검증**
    - 응답의 `items` 배열 길이가 `limit` 이하인지 확인
    - 응답의 `page`가 요청한 페이지 번호와 일치하는지 확인
    - 응답의 `limit`이 요청한 페이지 크기와 일치하는지 확인
    - 응답의 `total`이 전체 개수와 일치하는지 확인

- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query: `page=2&limit=10`
  - **검증**
    - 두 번째 페이지의 항목이 첫 번째 페이지와 다른지 확인
    - 항목이 중복되지 않는지 확인

### 시나리오 7-4: 복합 필터링

#### 7-4-1. 활동 유형 + 날짜 범위 필터링
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - Query:
    - `activityType=wbs_self_evaluation`
    - `startDate=2024-01-01T00:00:00Z`
    - `endDate=2024-01-31T23:59:59Z`
  - **검증**
    - 모든 항목의 `activityType`이 `wbs_self_evaluation`인지 확인
    - 모든 항목의 `activityDate`가 지정된 날짜 범위 내인지 확인

---

## 시나리오 8: 활동 내역 통합 검증

### 시나리오 8-1: 전체 평가 프로세스 활동 내역 검증

#### 8-1-1. 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당)
- POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/primary-evaluator (1차 평가자 구성)

#### 8-1-2. 평가기준 제출
- POST /admin/evaluation-criteria/evaluation-criteria (평가기준 제출)
- **활동 내역 검증**
  - `activityType=evaluation_criteria`, `activityAction=submitted` 항목 생성 확인

#### 8-1-3. 자기평가 제출
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 작성)
- PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-all (자기평가 제출)
- **활동 내역 검증**
  - `activityType=wbs_self_evaluation`, `activityAction=submitted` 항목 생성 확인

#### 8-1-4. 산출물 생성
- POST /admin/performance-evaluation/deliverables (산출물 생성)
- **활동 내역 검증**
  - `activityType=deliverable`, `activityAction=created` 항목 생성 확인

#### 8-1-5. 하향평가 제출
- PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary (1차 하향평가 저장)
- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/bulk-submit (1차 하향평가 일괄 제출)
- **활동 내역 검증**
  - `activityType=downward_evaluation`, `activityAction=submitted` 항목 생성 확인
  - `activityMetadata`에 `evaluationType=primary` 확인

#### 8-1-6. 단계 승인
- PATCH /admin/step-approval/self-evaluation/{mappingId}/approve (자기평가 승인)
- **활동 내역 검증**
  - `activityType=step_approval`, `activityAction=approved` 항목 생성 확인
  - `activityMetadata.step=self` 확인

#### 8-1-7. 전체 활동 내역 조회 및 검증
- GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}
  - **검증**
    - 모든 활동 내역이 시간순으로 정렬되어 있는지 확인
    - 각 활동 유형별로 적절한 활동 내역이 생성되었는지 확인
    - `activityDescription`이 자동 생성되어 있는지 확인
    - `performedByName`이 올바르게 설정되어 있는지 확인

---

## 주의사항 및 검증 포인트

### 1. 활동 내역 자동 생성
- **자동 설명 생성**: `activityDescription`이 제공되지 않은 경우 자동 생성
  - 형식: "{performedByName}님이 {activityTitle}을(를) {activityAction}했습니다."
  - 예: "홍길동님이 WBS 자기평가를 제출했습니다."
- **수행자 이름 자동 조회**: `performedByName`이 제공되지 않은 경우 직원 서비스를 통해 자동 조회

### 2. 활동 내역 생성 시점
- **비즈니스 레이어에서 생성**: 모든 활동 내역은 business 레이어에서 생성
- **에러 처리**: 활동 내역 기록 실패 시에도 메인 작업은 정상 처리 (try-catch로 감싸서 처리)
- **비동기 처리**: 활동 내역 기록은 메인 작업과 독립적으로 처리

### 3. 활동 내역 데이터 구조
- **필수 필드**: `periodId`, `employeeId`, `activityType`, `activityAction`, `performedBy`
- **선택 필드**: `activityTitle`, `activityDescription`, `relatedEntityType`, `relatedEntityId`, `activityMetadata`
- **메타데이터**: 활동 유형별로 다른 메타데이터 구조
  - 하향평가: `evaluatorId`, `evaluationType`, `submittedCount`, `bulkOperation` 등
  - 산출물: `deliverableName`, `deliverableType`, `wbsItemId` 등
  - 단계 승인: `step`, `status`, `revisionComment`, `evaluatorId` 등
  - 재작성 완료: `step`, `responseComment`, `allCompleted` 등

### 4. 정렬 규칙
- **기본 정렬**: `activityDate` 기준 내림차순 (최신순)
- **보조 정렬**: 동일 시간일 경우 `createdAt` 기준 내림차순

### 5. 필터링 규칙
- **활동 유형 필터**: `activityType`으로 특정 활동 유형만 조회
- **날짜 범위 필터**: `startDate`와 `endDate`로 기간 필터링
- **복합 필터**: 여러 필터를 동시에 적용 가능

### 6. 페이지네이션
- **기본값**: `page=1`, `limit=20`
- **정렬 후 페이지네이션**: 정렬된 결과를 기준으로 페이지네이션 적용

### 7. 활동 유형별 특성
- **WBS 자기평가**: 제출, 취소 액션 지원
- **하향평가**: 일괄 제출 시 메타데이터에 상세 정보 포함
- **산출물**: 생성, 수정, 삭제 액션 지원
- **단계 승인**: 승인, 재작성 요청 액션 지원
- **재작성 완료**: 단계별로 다른 제목 사용
- **평가기준**: 제출 액션만 지원

### 8. 동료평가 활동 내역
- **현재 미구현**: 동료평가 관련 활동 내역 생성 로직은 현재 구현되지 않음
- **향후 구현 예정**: 동료평가 요청, 제출 시 활동 내역 생성 예정

### 9. 데이터 일관성
- **피평가자 기준**: 모든 활동 내역은 피평가자(`employeeId`) 기준으로 기록
- **평가기간 기준**: 평가기간(`periodId`)별로 활동 내역 관리
- **수행자 정보**: `performedBy`와 `performedByName`이 일치해야 함

### 10. 활동 내역 조회 권한
- **관리자 권한**: 활동 내역 조회는 관리자 권한 필요
- **피평가자 기준**: 특정 피평가자의 활동 내역만 조회 가능

---

## 테스트 작성 가이드

1. **Before/After 비교**: 활동 전후로 활동 내역을 조회하여 비교
2. **단계별 검증**: 각 단계마다 활동 내역이 올바르게 생성되는지 확인
3. **필터링 검증**: 다양한 필터 조합으로 정확한 결과가 반환되는지 확인
4. **페이지네이션 검증**: 페이지네이션이 올바르게 작동하는지 확인
5. **데이터 구조 검증**: 각 활동 유형별로 메타데이터 구조가 올바른지 확인
6. **자동 생성 검증**: `activityDescription`과 `performedByName`이 자동 생성되는지 확인
7. **정렬 검증**: 활동 내역이 시간순으로 정렬되는지 확인
8. **에러 처리 검증**: 활동 내역 기록 실패 시에도 메인 작업이 정상 처리되는지 확인

