# 평가기간 날짜 생성 및 수정

## Event Storming 맵

### 생성 시 (POST /admin/evaluation-periods)

```
[관리자]
  │
  ▼
CreateEvaluationPeriod (💙 COMMAND)
  └─ startDate (필수)
  └─ peerEvaluationDeadline (필수)
  │
  ▼
EvaluationPeriodService (🟡 AGGREGATE)
  │
  ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │  └─ 세부일정검증한다()
  │     ├─ 시작일 검증
  │     └─ 동료평가 마감일 >= 시작일
  │
  └─ EvaluationPeriod Entity 생성
      │
      ├─ startDate 설정
      ├─ peerEvaluationDeadline 설정
      ├─ 다른 마감일들은 null (나중에 수정 가능)
      └─ endDate = peerEvaluationDeadline (자동 설정)
      │
      ▼
  Repository.save()
      │
      ▼
  EvaluationPeriodCreated (🟠 EVENT)
```

### 수정 시 (PATCH /admin/evaluation-periods/:id/*)

#### 1. 전체 일정 수정 (PATCH /:id/schedule)

```
[관리자]
  │
  ▼
UpdateEvaluationPeriodSchedule (💙 COMMAND)
  └─ startDate, evaluationSetupDeadline, performanceDeadline,
     selfEvaluationDeadline, peerEvaluationDeadline (선택)
  │
  ▼
UpdateEvaluationPeriodScheduleCommand (💙 COMMAND)
  │
  ▼
EvaluationPeriodService (🟡 AGGREGATE)
  │
  ├─ 기존 평가기간 조회
  ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │  └─ 세부일정업데이트검증한다()
  │     ├─ 각 마감일 >= 시작일
  │     └─ 단계별날짜순서검증한다()
  │        └─ 순서: startDate < evaluationSetup < performance 
  │                  < selfEvaluation < peerEvaluation
  │
  └─ Entity 업데이트
      │
      ├─ 일정_업데이트한다() (startDate, endDate)
      └─ 단계별_마감일_업데이트한다() (각 마감일)
      │
      ▼
  Repository.save()
      │
      ▼
  EvaluationPeriodScheduleUpdated (🟠 EVENT)
```

#### 2. 시작일 수정 (PATCH /:id/start-date)

```
[관리자]
  │
  ▼
UpdateEvaluationPeriodStartDate (💙 COMMAND)
  └─ startDate
  │
  ▼
UpdateEvaluationPeriodStartDateCommand (💙 COMMAND)
  │
  ▼
EvaluationPeriodService (🟡 AGGREGATE)
  │
  ├─ 기존 평가기간 조회
  ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │  └─ 새로운 시작일 < 모든 마감일
  │
  └─ Entity 업데이트
      │
      └─ 일정_업데이트한다(startDate)
      │
      ▼
  Repository.save()
      │
      ▼
  EvaluationPeriodStartDateUpdated (🟠 EVENT)
```

#### 3. 개별 마감일 수정 (PATCH /:id/{phase}-deadline)

```
[관리자]
  │
  ▼
Update{Phase}Deadline (💙 COMMAND)
  └─ {phase}Deadline (예: evaluationSetupDeadline)
  │
  ▼
Update{Phase}DeadlineCommand (💙 COMMAND)
  │
  ▼
EvaluationPeriodService (🟡 AGGREGATE)
  │
  ├─ 기존 평가기간 조회
  ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │  └─ 세부일정업데이트검증한다()
  │     ├─ 마감일 >= 시작일
  │     └─ 단계별날짜순서검증한다()
  │
  └─ Entity 업데이트
      │
      └─ 단계별_마감일_업데이트한다()
         └─ 해당 마감일만 업데이트
      │
      ▼
  Repository.save()
      │
      ▼
  EvaluationPeriodDeadlineUpdated (🟠 EVENT)
```

## 핵심 요소

### 💙 COMMAND
- `CreateEvaluationPeriod`: 평가기간 생성 (startDate, peerEvaluationDeadline 필수)
- `UpdateEvaluationPeriodSchedule`: 전체 일정 수정
- `UpdateEvaluationPeriodStartDate`: 시작일 수정
- `Update{Phase}Deadline`: 개별 마감일 수정

### 🟠 EVENT
- `EvaluationPeriodCreated`: 평가기간 생성 완료
- `EvaluationPeriodScheduleUpdated`: 일정 수정 완료
- `EvaluationPeriodStartDateUpdated`: 시작일 수정 완료
- `EvaluationPeriodDeadlineUpdated`: 마감일 수정 완료

### 🟡 AGGREGATE
- `EvaluationPeriod`: 도메인 모델
- `EvaluationPeriodService`: 도메인 서비스

### 🟣 POLICY
- **세부일정검증한다** (생성 시)
  - 동료평가 마감일 >= 시작일

- **세부일정업데이트검증한다** (수정 시)
  - 각 마감일 >= 시작일
  - 단계별날짜순서검증한다()
    - 순서: `startDate < evaluationSetupDeadline < performanceDeadline < selfEvaluationDeadline < peerEvaluationDeadline`

- **일정_업데이트한다** (Entity)
  - 시작일 < 종료일

## 프로세스 플로우

### 생성 시
1. Controller → DTO 변환 (startDate, peerEvaluationDeadline)
2. Domain Service → 비즈니스 규칙 검증
3. Entity 생성 → startDate, peerEvaluationDeadline 설정
4. Repository → 저장
5. DTO 반환

### 수정 시
1. Controller → DTO 변환
2. Command Handler → Domain Service 호출
3. Domain Service → 기존 평가기간 조회
4. 비즈니스 규칙 검증 (날짜 순서, 시작일 이후 여부)
5. Entity 업데이트 (일정_업데이트한다 또는 단계별_마감일_업데이트한다)
6. Repository → 저장
7. DTO 반환

## 핵심 포인트

- **생성 시**: startDate와 peerEvaluationDeadline만 필수, 나머지는 나중에 수정 가능
- **수정 시**: 전체 일정 수정 또는 개별 마감일 수정 가능
- **날짜 순서 검증**: 모든 마감일은 시작일 이후, 단계별 순서 보장
- **endDate 자동 설정**: peerEvaluationDeadline과 동일하게 설정

