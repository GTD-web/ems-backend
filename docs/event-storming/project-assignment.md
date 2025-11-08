# 프로젝트 할당 관리

## Event Storming 맵

### 생성 시 (POST /admin/evaluation-criteria/project-assignments)

```
[관리자]
  │
  ▼
CreateProjectAssignment (💙 COMMAND)
  └─ employeeId, projectId, periodId
  │
  ▼
CreateProjectAssignmentCommand (💙 COMMAND)
  │
  ▼
CreateProjectAssignmentHandler (🟡 AGGREGATE)
  │
  ├─ 프로젝트 존재 여부 검증
  ├─ 평가기간 존재 여부 검증
  ├─ 평가기간 상태 검증 (🟣 POLICY)
  │  └─ 완료된 평가기간에는 할당 생성 불가
  │
  └─ EvaluationProjectAssignmentService (🟡 AGGREGATE)
      │
      ├─ 비즈니스 규칙 검증 (🟣 POLICY)
      │  └─ 할당생성비즈니스규칙검증한다()
      │     ├─ 중복 할당 검증
      │     │  └─ 같은 (periodId, employeeId, projectId) 조합 불가
      │     └─ 평가기간 유효성 검증
      │
      ├─ displayOrder 자동 계산
      │  └─ 최대_순서를_조회한다() + 1
      │
      └─ EvaluationProjectAssignment Entity 생성
          │
          ├─ periodId, employeeId, projectId 설정
          ├─ assignedDate = 현재 시간
          ├─ assignedBy 설정
          └─ displayOrder 설정
          │
          ▼
      Repository.save()
          │
          ▼
      ProjectAssignmentCreated (🟠 EVENT)
```

### 취소 시 (DELETE /admin/evaluation-criteria/project-assignments/:id)

```
[관리자]
  │
  ▼
CancelProjectAssignment (💙 COMMAND)
  └─ assignmentId
  │
  ▼
CancelProjectAssignmentCommand (💙 COMMAND)
  │
  ▼
EvaluationProjectAssignmentService (🟡 AGGREGATE)
  │
  ├─ 기존 할당 조회
  ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │  └─ 할당삭제비즈니스규칙검증한다()
  │     └─ 평가 기준이 설정된 경우 삭제 불가
  │
  └─ 소프트 삭제
      │
      ├─ 메타데이터를_업데이트한다(deletedBy)
      └─ Repository.softDelete()
      │
      ▼
  ProjectAssignmentCancelled (🟠 EVENT)
```

### 순서 변경 시 (PATCH /admin/evaluation-criteria/project-assignments/:id/order)

```
[관리자]
  │
  ▼
ChangeProjectAssignmentOrder (💙 COMMAND)
  └─ assignmentId, direction (up/down)
  │
  ▼
ChangeProjectAssignmentOrderCommand (💙 COMMAND)
  │
  ▼
EvaluationProjectAssignmentService (🟡 AGGREGATE)
  │
  ├─ 기존 할당 조회
  ├─ 같은 직원-평가기간의 모든 할당 조회
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
  ProjectAssignmentOrderChanged (🟠 EVENT)
```

### 대량 할당 시 (POST /admin/evaluation-criteria/project-assignments/bulk)

```
[관리자]
  │
  ▼
BulkCreateProjectAssignments (💙 COMMAND)
  └─ assignments: Array<{employeeId, projectId, periodId}>
  │
  ▼
BulkCreateProjectAssignmentsCommand (💙 COMMAND)
  │
  ▼
EvaluationCriteriaManagementService (🟡 AGGREGATE)
  │
  └─ 각 할당에 대해 순차 처리
      │
      ├─ CreateProjectAssignmentCommand 실행
      │  └─ 중복 검증, displayOrder 계산 등
      │
      └─ 결과 수집
          │
          ▼
      ProjectAssignmentsBulkCreated (🟠 EVENT)
          └─ results: Array<ProjectAssignmentDto>
```

## 핵심 요소

### 💙 COMMAND
- `CreateProjectAssignment`: 프로젝트 할당 생성
- `CancelProjectAssignment`: 프로젝트 할당 취소
- `ChangeProjectAssignmentOrder`: 프로젝트 할당 순서 변경
- `BulkCreateProjectAssignments`: 프로젝트 대량 할당

### 🟠 EVENT
- `ProjectAssignmentCreated`: 프로젝트 할당 생성 완료
- `ProjectAssignmentCancelled`: 프로젝트 할당 취소 완료
- `ProjectAssignmentOrderChanged`: 프로젝트 할당 순서 변경 완료
- `ProjectAssignmentsBulkCreated`: 프로젝트 대량 할당 완료

### 🟡 AGGREGATE
- `EvaluationProjectAssignment`: 도메인 모델
- `EvaluationProjectAssignmentService`: 도메인 서비스
- `CreateProjectAssignmentHandler`: 커맨드 핸들러

### 🟣 POLICY
- **할당생성비즈니스규칙검증한다**
  - 중복 할당 방지: 같은 (periodId, employeeId, projectId) 조합 불가
  - 평가기간 유효성 검증

- **할당삭제비즈니스규칙검증한다**
  - 평가 기준이 설정된 경우 삭제 불가

- **평가기간 상태 검증**
  - 완료된 평가기간에는 할당 생성 불가

## 프로세스 플로우

### 생성 시
1. Controller → DTO 변환 (employeeId, projectId, periodId)
2. Command Handler → 프로젝트/평가기간 존재 여부 검증
3. Domain Service → 비즈니스 규칙 검증 (중복 검증)
4. displayOrder 자동 계산 (최대값 + 1)
5. Entity 생성 → Repository 저장
6. DTO 반환

### 취소 시
1. Controller → assignmentId 추출
2. Domain Service → 기존 할당 조회
3. 비즈니스 규칙 검증 (평가 기준 설정 여부)
4. 소프트 삭제 (softDelete)
5. 완료

### 순서 변경 시
1. Controller → assignmentId, direction 추출
2. Domain Service → 같은 직원-평가기간의 모든 할당 조회
3. 현재 할당과 위/아래 할당 찾기
4. 순서 교환 (displayOrder 교환)
5. Repository 저장
6. DTO 반환

## 핵심 포인트

- **중복 방지**: 같은 (periodId, employeeId, projectId) 조합으로 중복 할당 불가
- **displayOrder 자동 계산**: 할당 생성 시 최대값 + 1로 자동 설정
- **순서 변경**: 위/아래 할당과 displayOrder 교환
- **소프트 삭제**: 실제 삭제가 아닌 deletedAt 설정
- **평가 기준 연동**: 평가 기준이 설정된 경우 삭제 불가

