# WBS 할당 관리

## Event Storming 맵

### 생성 시 (POST /admin/evaluation-criteria/wbs-assignments)

```
[관리자]
  │
  ▼
CreateWbsAssignment (💙 COMMAND)
  └─ employeeId, wbsItemId, projectId, periodId
  │
  ▼
WbsAssignmentBusinessService (🟡 AGGREGATE)
  │
  ├─ WBS 할당 생성
  │  └─ CreateWbsAssignmentCommand 실행
  │     │
  │     ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │     │  └─ 할당생성비즈니스규칙검증한다()
  │     │     ├─ 프로젝트 할당 선행 조건 검증
  │     │     │  └─ 해당 직원-프로젝트-평가기간에 프로젝트 할당이 있어야 함
  │     │     ├─ WBS 항목 존재 여부 검증
  │     │     ├─ 직원 존재 여부 검증
  │     │     ├─ 평가기간 상태 검증
  │     │     │  └─ 완료된 평가기간에는 할당 생성 불가
  │     │     └─ 중복 할당 검증
  │     │        └─ 같은 (periodId, employeeId, projectId, wbsItemId) 조합 불가
  │     │
  │     └─ EvaluationWbsAssignmentService (🟡 AGGREGATE)
  │         │
  │         ├─ 같은 직원-프로젝트-평가기간의 마지막 displayOrder 조회
  │         ├─ displayOrder 자동 설정 (마지막 순서 + 1)
  │         │
  │         └─ EvaluationWbsAssignment Entity 생성
  │             │
  │             ├─ periodId, employeeId, projectId, wbsItemId 설정
  │             ├─ assignedDate = 현재 시간
  │             ├─ assignedBy 설정
  │             └─ displayOrder 설정
  │             │
  │             ▼
  │         Repository.save()
  │             │
  │             ▼
  │         가중치 재계산 (🟣 POLICY)
  │             └─ 직원_평가기간_가중치를_재계산한다()
  │                └─ 해당 직원의 해당 평가기간 모든 WBS 할당 가중치 재계산
  │
  ├─ WBS 평가기준 자동 생성 (🟣 POLICY)
  │  │
  │  ├─ 특정_WBS항목의_평가기준을_조회한다()
  │  │
  │  └─ 평가기준이 없는 경우
  │     │
  │     └─ WBS_평가기준을_생성한다()
  │        └─ criteria: '' (빈 문자열)
  │        └─ importance: 5 (기본 중요도)
  │        │
  │        ▼
  │    WbsEvaluationCriteriaCreated (🟠 EVENT)
  │
  ├─ 평가라인 자동 구성 (🟣 POLICY)
  │  │
  │  └─ 평가라인을_자동으로_구성한다()
  │     └─ 직원의 관리자와 프로젝트 PM을 평가자로 설정
  │     │
  │     ├─ 1차 평가자 (관리자) 평가라인 조회/생성
  │     ├─ 2차 평가자 (PM) 평가라인 조회/생성
  │     └─ 평가라인 매핑 생성
  │        │
  │        ▼
  │    EvaluationLineConfigured (🟠 EVENT)
  │
  └─ WBS별 평가라인 구성 (🟣 POLICY)
      │
      └─ 직원_WBS별_평가라인을_구성한다()
         └─ 해당 WBS 항목에 할당된 다른 직원들을 동료 평가자로 설정
         │
         ├─ 동료 평가 라인 조회/생성 (1차 평가자)
         ├─ 상급자 평가 라인 조회/생성 (2차 평가자)
         └─ 평가라인 매핑 생성
            │
            ▼
        WbsEvaluationLineConfigured (🟠 EVENT)
            │
            ▼
        WbsAssignmentCreated (🟠 EVENT)
```

### 취소 시 (DELETE /admin/evaluation-criteria/wbs-assignments/:id)

```
[관리자]
  │
  ▼
CancelWbsAssignment (💙 COMMAND)
  └─ assignmentId
  │
  ▼
WbsAssignmentBusinessService.WBS_할당을_취소한다() (🟡 AGGREGATE)
  │
  ├─ 1. 할당 정보 조회 (평가기준 정리를 위해)
  │  └─ EvaluationWbsAssignmentService.ID로_조회한다()
  │
  ├─ 2. 할당이 없으면 조기 반환 (멱등성 보장)
  │
  └─ 3. EvaluationCriteriaManagementService.WBS_할당을_취소한다() 호출
      │
      └─ CancelWbsAssignmentCommand 실행
          │
          ▼
      CancelWbsAssignmentHandler (🟡 AGGREGATE)
          │
          ├─ 할당 조회
          ├─ 멱등성 보장 (할당이 없으면 조용히 성공 처리)
          ├─ 비즈니스 규칙 검증 (🟣 POLICY)
          │  └─ 평가기간 상태 검증
          │     └─ 완료된 평가기간에는 할당 취소 불가
          │
          ├─ EvaluationWbsAssignmentService.삭제한다()
          │  └─ 하드 삭제 (Repository.delete)
          │
          └─ 가중치 재계산 (🟣 POLICY)
             └─ 직원_평가기간_가중치를_재계산한다()
             │
             ▼
         WbsAssignmentCancelled (🟠 EVENT)
             │
             ▼
         (Context Service 호출 완료, Business Service로 복귀)
             │
             ▼
  ├─ 4. 평가라인 매핑 삭제 (🟣 POLICY)
  │  └─ 해당 WBS의 평가라인 매핑 삭제
  │
  └─ 5. WBS 평가기준 정리 (🟣 POLICY)
     │
     ├─ 해당 WBS에 다른 할당이 있는지 확인
     │
     └─ 마지막 할당인 경우
        │
        └─ WBS_항목의_평가기준을_전체삭제한다()
           │
           ▼
       WbsEvaluationCriteriaDeleted (🟠 EVENT)
```

### 순서 변경 시 (PATCH /admin/evaluation-criteria/wbs-assignments/:id/order)

```
[관리자]
  │
  ▼
ChangeWbsAssignmentOrder (💙 COMMAND)
  └─ assignmentId, direction (up/down)
  │
  ▼
ChangeWbsAssignmentOrderCommand (💙 COMMAND)
  │
  ▼
EvaluationWbsAssignmentService (🟡 AGGREGATE)
  │
  ├─ 기존 할당 조회
  ├─ 같은 직원-프로젝트-평가기간의 모든 할당 조회
  ├─ 현재 할당의 순서 확인
  ├─ 방향에 따라 위/아래 할당 찾기
  │
  └─ 순서 교환
      │
      ├─ 현재 할당.순서를_변경한다(위 할당의 순서)
      ├─ 위 할당.순서를_변경한다(현재 할당의 순서)
      └─ 메타데이터 업데이트
      │
      ▼
  Repository.save([현재 할당, 위 할당])
      │
      ▼
  WbsAssignmentOrderChanged (🟠 EVENT)
```

### 대량 할당 시 (POST /admin/evaluation-criteria/wbs-assignments/bulk)

```
[관리자]
  │
  ▼
BulkCreateWbsAssignments (💙 COMMAND)
  └─ assignments: Array<{employeeId, wbsItemId, projectId, periodId}>
  │
  ▼
BulkCreateWbsAssignmentsCommand (💙 COMMAND)
  │
  ▼
BulkCreateWbsAssignmentHandler (🟡 AGGREGATE)
  │
  └─ 각 할당에 대해 순차 처리
      │
      ├─ CreateWbsAssignmentCommand 실행
      │  └─ 중복 검증, displayOrder 계산, 가중치 재계산 등
      │
      └─ 결과 수집
          │
          ▼
      WbsAssignmentsBulkCreated (🟠 EVENT)
          └─ results: Array<WbsAssignmentDto>
```

### WBS 생성하면서 할당 시 (POST /admin/evaluation-criteria/wbs-assignments/create-and-assign)

```
[관리자]
  │
  ▼
CreateAndAssignWbs (💙 COMMAND)
  └─ title, projectId, employeeId, periodId
  │
  ▼
WbsAssignmentBusinessService (🟡 AGGREGATE)
  │
  ├─ WBS 항목 생성 (코드 자동 생성 포함)
  │  │
  │  └─ WBS_항목을_생성하고_코드를_자동_생성한다()
  │     │
  │     ├─ WBS 코드 자동 생성 (🟣 POLICY)
  │     │  └─ WBS_코드를_자동_생성한다()
  │     │     ├─ 프로젝트 내 기존 WBS 개수 조회
  │     │     └─ "WBS-001", "WBS-002" 형식으로 순차 생성
  │     │
  │     └─ WBS 항목 생성
  │         │
  │         ├─ CreateWbsItemCommand 실행
  │         │
  │         └─ WbsItemService (🟡 AGGREGATE)
  │             │
  │             ├─ WBS 코드 중복 검증 (🟣 POLICY)
  │             │  └─ 같은 프로젝트 내 동일 코드 불가
  │             │
  │             └─ WbsItem Entity 생성
  │                 │
  │                 ├─ wbsCode 설정 (자동 생성된 코드)
  │                 ├─ title 설정
  │                 ├─ status = PENDING
  │                 ├─ level = 1 (최상위 항목)
  │                 ├─ assignedToId = employeeId
  │                 ├─ projectId 설정
  │                 └─ progressPercentage = 0
  │                 │
  │                 ▼
  │             Repository.save()
  │                 │
  │                 ▼
  │             WbsItemCreated (🟠 EVENT)
  │
  └─ WBS 할당 생성
      │
      └─ WBS를_할당한다()
         └─ 생성된 wbsItemId로 할당 생성
         │
         ├─ WBS 할당 생성 (CreateWbsAssignmentCommand)
         │  └─ 비즈니스 규칙 검증, displayOrder 계산, 가중치 재계산
         │
         ├─ WBS 평가기준 자동 생성 (🟣 POLICY)
         │  └─ 평가기준이 없으면 빈 평가기준 생성
         │
         ├─ 평가라인 자동 구성 (🟣 POLICY)
         │  └─ 관리자(1차), PM(2차) 평가자 설정
         │
         └─ WBS별 평가라인 구성 (🟣 POLICY)
            └─ 동료 평가자 설정
            │
            ▼
        WbsCreatedAndAssigned (🟠 EVENT)
            └─ wbsItem, assignment 반환
```

### 초기화 시

#### 평가기간의 WBS 할당 초기화 (DELETE /admin/evaluation-criteria/wbs-assignments/period/:periodId)

```
[관리자]
  │
  ▼
ResetPeriodWbsAssignments (💙 COMMAND)
  └─ periodId
  │
  ▼
WbsAssignmentBusinessService.평가기간의_WBS_할당을_초기화한다() (🟡 AGGREGATE)
  │
  ├─ 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
  │  └─ EvaluationCriteriaManagementService.WBS_할당_목록을_조회한다()
  │
  └─ 2. EvaluationCriteriaManagementService.평가기간의_WBS_할당을_초기화한다() 호출
      │
      └─ ResetPeriodWbsAssignmentsCommand 실행
          │
          ▼
      ResetPeriodWbsAssignmentsHandler (🟡 AGGREGATE)
          │
          └─ EvaluationWbsAssignmentService.평가기간_할당_전체삭제한다()
             └─ 하드 삭제 (Repository.delete)
             │
             ▼
         WbsAssignmentsReset (🟠 EVENT)
             │
             ▼
         (Context Service 호출 완료, Business Service로 복귀)
             │
             ▼
  └─ 3. 고아 평가기준 정리 (🟣 POLICY)
     └─ 할당이 없는 WBS 항목의 평가기준 자동 삭제
```

#### 프로젝트의 WBS 할당 초기화 (DELETE /admin/evaluation-criteria/wbs-assignments/project/:projectId/period/:periodId)

```
[관리자]
  │
  ▼
ResetProjectWbsAssignments (💙 COMMAND)
  └─ projectId, periodId
  │
  ▼
WbsAssignmentBusinessService.프로젝트의_WBS_할당을_초기화한다() (🟡 AGGREGATE)
  │
  ├─ 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
  │  └─ EvaluationCriteriaManagementService.WBS_할당_목록을_조회한다()
  │
  └─ 2. EvaluationCriteriaManagementService.프로젝트의_WBS_할당을_초기화한다() 호출
      │
      └─ ResetProjectWbsAssignmentsCommand 실행
          │
          ▼
      ResetProjectWbsAssignmentsHandler (🟡 AGGREGATE)
          │
          ├─ 해당 프로젝트-평가기간의 모든 할당 조회
          │  └─ EvaluationWbsAssignmentService.필터_조회한다()
          │
          └─ 각 할당에 대해 삭제
              │
              └─ EvaluationWbsAssignmentService.삭제한다()
                 └─ 하드 삭제 (Repository.delete)
                 │
                 ▼
             WbsAssignmentsReset (🟠 EVENT)
                 │
                 ▼
             (Context Service 호출 완료, Business Service로 복귀)
                 │
                 ▼
  └─ 3. 고아 평가기준 정리 (🟣 POLICY)
     └─ 할당이 없는 WBS 항목의 평가기준 자동 삭제
```

#### 직원의 WBS 할당 초기화 (DELETE /admin/evaluation-criteria/wbs-assignments/employee/:employeeId/period/:periodId)

```
[관리자]
  │
  ▼
ResetEmployeeWbsAssignments (💙 COMMAND)
  └─ employeeId, periodId
  │
  ▼
WbsAssignmentBusinessService.직원의_WBS_할당을_초기화한다() (🟡 AGGREGATE)
  │
  ├─ 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
  │  └─ EvaluationCriteriaManagementService.WBS_할당_목록을_조회한다()
  │
  └─ 2. EvaluationCriteriaManagementService.직원의_WBS_할당을_초기화한다() 호출
      │
      └─ ResetEmployeeWbsAssignmentsCommand 실행
          │
          ▼
      ResetEmployeeWbsAssignmentsHandler (🟡 AGGREGATE)
          │
          ├─ 해당 직원-평가기간의 모든 할당 조회
          │  └─ EvaluationWbsAssignmentService.필터_조회한다()
          │
          └─ 각 할당에 대해 삭제
              │
              └─ EvaluationWbsAssignmentService.삭제한다()
                 └─ 하드 삭제 (Repository.delete)
                 │
                 ▼
             WbsAssignmentsReset (🟠 EVENT)
                 │
                 ▼
             (Context Service 호출 완료, Business Service로 복귀)
                 │
                 ▼
  └─ 3. 고아 평가기준 정리 (🟣 POLICY)
     └─ 할당이 없는 WBS 항목의 평가기준 자동 삭제
```

## 핵심 요소

### 💙 COMMAND
- `CreateWbsAssignment`: WBS 할당 생성
- `CancelWbsAssignment`: WBS 할당 취소
- `ChangeWbsAssignmentOrder`: WBS 할당 순서 변경
- `BulkCreateWbsAssignments`: WBS 대량 할당
- `CreateAndAssignWbs`: WBS 생성하면서 할당
- `ResetPeriodWbsAssignments`: 평가기간의 WBS 할당 초기화
- `ResetProjectWbsAssignments`: 프로젝트의 WBS 할당 초기화
- `ResetEmployeeWbsAssignments`: 직원의 WBS 할당 초기화

### 🟠 EVENT
- `WbsItemCreated`: WBS 항목 생성 완료
- `WbsAssignmentCreated`: WBS 할당 생성 완료
- `WbsEvaluationCriteriaCreated`: WBS 평가기준 자동 생성 완료
- `EvaluationLineConfigured`: 평가라인 자동 구성 완료
- `WbsEvaluationLineConfigured`: WBS별 평가라인 구성 완료
- `WbsCreatedAndAssigned`: WBS 생성 및 할당 완료
- `WbsAssignmentCancelled`: WBS 할당 취소 완료
- `WbsEvaluationCriteriaDeleted`: WBS 평가기준 삭제 완료 (마지막 할당 취소 시)
- `WbsAssignmentOrderChanged`: WBS 할당 순서 변경 완료
- `WbsAssignmentsBulkCreated`: WBS 대량 할당 완료
- `WbsAssignmentsReset`: WBS 할당 초기화 완료 (평가기간/프로젝트/직원별)

### 🟡 AGGREGATE
- `EvaluationWbsAssignment`: 도메인 모델
- `EvaluationWbsAssignmentService`: 도메인 서비스
- `WbsItem`: WBS 항목 도메인 모델
- `WbsItemService`: WBS 항목 도메인 서비스
- `CreateWbsAssignmentHandler`: 커맨드 핸들러
- `CancelWbsAssignmentHandler`: 할당 취소 커맨드 핸들러
- `EvaluationCriteriaManagementService`: 컨텍스트 서비스
- `ResetPeriodWbsAssignmentsHandler`: 평가기간 할당 초기화 핸들러
- `ResetProjectWbsAssignmentsHandler`: 프로젝트 할당 초기화 핸들러
- `ResetEmployeeWbsAssignmentsHandler`: 직원 할당 초기화 핸들러
- `WbsAssignmentBusinessService`: 비즈니스 서비스

### 🟣 POLICY
- **할당생성비즈니스규칙검증한다**
  - 프로젝트 할당 선행 조건: 해당 직원-프로젝트-평가기간에 프로젝트 할당이 있어야 함
  - 중복 할당 방지: 같은 (periodId, employeeId, projectId, wbsItemId) 조합 불가
  - 완료된 평가기간에는 할당 생성 불가

- **WBS 코드 자동 생성**
  - 프로젝트 내 기존 WBS 개수 조회
  - "WBS-001", "WBS-002" 형식으로 순차 생성
  - 같은 프로젝트 내 코드 중복 방지

- **WBS 항목 생성 검증**
  - WBS 코드 중복 검증: 같은 프로젝트 내 동일 코드 불가
  - 상위 WBS 항목 검증: parentWbsId가 있는 경우 상위 항목 존재 여부 확인
  - 레벨 검증: 최상위 항목은 level 1, 하위 항목은 상위 항목 level + 1

- **가중치 재계산**
  - 할당 생성/취소 시 해당 직원의 해당 평가기간 모든 WBS 할당 가중치 재계산
  - 직원별 WBS 중요도 기반 자동 계산

- **할당삭제비즈니스규칙검증한다**
  - 완료된 평가기간에는 할당 취소 불가
  - 현재는 특별한 제약 없이 삭제 허용 (초기화 기능은 관리자 권한으로 수행)
  - **참고**: 평가기준이 설정되어 있어도 삭제 가능 (평가기준 설정 여부는 삭제 제약 조건이 아님)

- **WBS 평가기준 정리**
  - 할당 취소 시 해당 WBS에 다른 할당이 있는지 확인
  - 마지막 할당 취소 시 평가기준 자동 삭제 (해당 WBS에 더 이상 할당이 없으므로)

- **초기화 기능**
  - 평가기간별 초기화: 해당 평가기간의 모든 WBS 할당 일괄 삭제
  - 프로젝트별 초기화: 해당 프로젝트-평가기간의 모든 WBS 할당 일괄 삭제
  - 직원별 초기화: 해당 직원-평가기간의 모든 WBS 할당 일괄 삭제
  - 고아 평가기준 정리: 초기화 후 할당이 없는 WBS 항목의 평가기준 자동 삭제

## 프로세스 플로우

### 생성 시
1. Controller → DTO 변환 (employeeId, wbsItemId, projectId, periodId)
2. Business Service → WBS 할당 생성
   - Command Handler → 비즈니스 규칙 검증 (프로젝트 할당 선행 조건, 중복 검증)
   - Domain Service → displayOrder 자동 계산 (같은 프로젝트-평가기간 내 최대값 + 1)
   - Entity 생성 → Repository 저장
   - 가중치 재계산 (해당 직원-평가기간 모든 WBS 할당)
3. Business Service → WBS 평가기준 자동 생성
   - 평가기준 조회 → 없는 경우 빈 평가기준 생성 (criteria: '', importance: 5)
4. Business Service → 평가라인 자동 구성
   - 직원의 관리자와 프로젝트 PM을 평가자로 설정
   - 평가라인 조회/생성 및 매핑 생성
5. Business Service → WBS별 평가라인 구성
   - 해당 WBS 항목에 할당된 다른 직원들을 동료 평가자로 설정
   - 평가라인 조회/생성 및 매핑 생성
6. DTO 반환

### 취소 시
1. Controller → assignmentId 추출
2. Business Service → WBS_할당을_취소한다() 호출
3. Context Service → CancelWbsAssignmentCommand 실행
4. Command Handler → 기존 할당 조회
5. 멱등성 보장 (할당이 없으면 조용히 성공 처리)
6. 비즈니스 규칙 검증 (완료된 평가기간 여부)
7. Domain Service → 하드 삭제 (Repository.delete)
8. 가중치 재계산 (해당 직원-평가기간 모든 WBS 할당)
9. Business Service → 평가라인 매핑 삭제 (해당 WBS의 평가라인 매핑)
10. Business Service → WBS 평가기준 정리
    - 해당 WBS에 다른 할당이 있는지 확인
    - 마지막 할당인 경우 평가기준 자동 삭제
11. 완료

### 순서 변경 시
1. Controller → assignmentId, direction 추출
2. Domain Service → 같은 직원-프로젝트-평가기간의 모든 할당 조회
3. 현재 할당과 위/아래 할당 찾기
4. 순서 교환 (displayOrder 교환)
5. Repository 저장
6. DTO 반환

### 초기화 시

#### 평가기간의 WBS 할당 초기화
1. Controller → periodId 추출
2. Command Handler → 해당 평가기간의 모든 할당 조회
3. Domain Service → 각 할당에 대해 삭제 (평가기간_할당_전체삭제한다)
4. 가중치 재계산 (각 직원-평가기간별)
5. Business Service → 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 자동 삭제)
6. 완료

#### 프로젝트의 WBS 할당 초기화
1. Controller → projectId, periodId 추출
2. Command Handler → 해당 프로젝트-평가기간의 모든 할당 조회
3. Domain Service → 각 할당에 대해 삭제
4. 가중치 재계산 (각 직원-평가기간별)
5. Business Service → 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 자동 삭제)
6. 완료

#### 직원의 WBS 할당 초기화
1. Controller → employeeId, periodId 추출
2. Command Handler → 해당 직원-평가기간의 모든 할당 조회
3. Domain Service → 각 할당에 대해 삭제
4. 가중치 재계산 (해당 직원-평가기간)
5. Business Service → 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 자동 삭제)
6. 완료

### WBS 생성하면서 할당 시
1. Controller → title, projectId, employeeId, periodId 추출
2. Business Service → WBS 항목 생성
   - WBS 코드 자동 생성: 프로젝트 내 기존 WBS 개수 조회하여 "WBS-001" 형식으로 생성
   - WBS 항목 생성: status=PENDING, level=1, assignedToId=employeeId
   - WBS 코드 중복 검증
3. Business Service → WBS 할당 생성
   - 생성된 wbsItemId로 할당 생성
   - 비즈니스 규칙 검증 (프로젝트 할당 선행 조건, 중복 검증)
   - displayOrder 자동 계산
   - 가중치 재계산
4. Business Service → WBS 평가기준 자동 생성
   - 평가기준 조회 → 없는 경우 빈 평가기준 생성
5. Business Service → 평가라인 자동 구성
   - 관리자(1차), PM(2차) 평가자 설정
6. Business Service → WBS별 평가라인 구성
   - 동료 평가자 설정
7. DTO 반환 (wbsItem, assignment)

## 핵심 포인트

- **프로젝트 할당 선행 조건**: WBS 할당 전에 해당 직원-프로젝트-평가기간에 프로젝트 할당이 있어야 함
- **중복 방지**: 같은 (periodId, employeeId, projectId, wbsItemId) 조합으로 중복 할당 불가
- **displayOrder 자동 계산**: 같은 프로젝트-평가기간 내에서 마지막 순서 + 1로 자동 설정
- **가중치 자동 재계산**: 할당 생성/취소 시 해당 직원의 해당 평가기간 모든 WBS 할당 가중치 재계산
- **WBS 코드 자동 생성**: WBS 생성 시 프로젝트 내 기존 WBS 개수를 조회하여 "WBS-001", "WBS-002" 형식으로 순차 생성
- **WBS 기본값 설정**: status=PENDING, level=1(최상위), assignedToId=employeeId, progressPercentage=0
- **평가기준 자동 생성**: WBS 할당 시 해당 WBS 항목에 평가기준이 없으면 빈 평가기준 자동 생성 (criteria: '', importance: 5)
- **평가라인 자동 구성**: WBS 할당 시 직원의 관리자(1차 평가자)와 프로젝트 PM(2차 평가자)을 평가자로 자동 설정
- **WBS별 평가라인 구성**: 해당 WBS 항목에 할당된 다른 직원들을 동료 평가자로 자동 설정
- **순서 변경**: 위/아래 할당과 displayOrder 교환
- **하드 삭제**: 실제 삭제 (Repository.delete)
- **멱등성 보장**: 할당이 없어도 조용히 성공 처리
- **평가기준 자동 정리**: 마지막 할당 취소 시 해당 WBS의 평가기준도 자동 삭제
- **평가기준과 삭제 제약**: 평가기준이 설정되어 있어도 할당 취소 가능 (평가기준 설정 여부는 삭제 제약 조건이 아님)
- **초기화 기능**: 평가기간/프로젝트/직원별로 WBS 할당을 일괄 초기화 가능
- **고아 평가기준 정리**: 초기화 후 할당이 없는 WBS 항목의 평가기준 자동 삭제

