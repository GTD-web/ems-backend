# 평가기간 생성 시 그레이드 등급 구간 지정

## Event Storming 맵

```
[관리자] 
  │
  ▼
CreateEvaluationPeriod (💙 COMMAND)
  │
  ▼
EvaluationPeriodManagementContext (🟡 AGGREGATE)
  │
  ▼
CreateEvaluationPeriodCommand (💙 COMMAND)
  │
  ▼
EvaluationPeriodService (🟡 AGGREGATE)
  │
  ├─ 비즈니스 규칙 검증 (🟣 POLICY)
  │
  └─ EvaluationPeriod Entity 생성
      │
      ├─ gradeRanges = [] (초기화)
      │
      └─ gradeRanges 존재 시
          │
          ▼
      등급구간_설정한다 (💙 COMMAND)
          │
          ▼
      등급구간_유효성_검증한다 (🟣 POLICY)
          ├─ 최소 1개 이상
          ├─ 등급 중복 검증
          ├─ 점수 범위 검증 (0-100)
          └─ 범위 겹침 검증
          │
          ▼
      gradeRanges 정렬 (minRange 내림차순)
          │
          ▼
      Repository.save()
          │
          ▼
      EvaluationPeriodCreated (🟠 EVENT)
          │
          ▼
      EvaluationPeriodDto 반환 (🟢 READ MODEL)
```

## 핵심 요소

### 💙 COMMAND
- `CreateEvaluationPeriod`: API 요청
- `등급구간_설정한다`: 등급 구간 설정

### 🟠 EVENT
- `EvaluationPeriodCreated`: 평가기간 생성 완료

### 🟡 AGGREGATE
- `EvaluationPeriod`: 도메인 모델
- `EvaluationPeriodService`: 도메인 서비스

### 🟣 POLICY
- **등급구간_유효성_검증한다**
  - 최소 1개 이상
  - 등급 중복 불가
  - 점수 범위: 0-100
  - 범위 겹침 불가

## 프로세스 플로우

1. Controller → DTO 변환 (gradeRanges 매핑)
2. Business Service → Context Service 호출
3. Command Handler → Domain Service 호출
4. Domain Service → Entity 생성
5. Entity → 등급구간_설정한다() (유효성 검증 + 정렬)
6. Repository → 저장
7. DTO 반환

## 핵심 포인트

- 등급 구간은 선택적(Optional)
- 유효성 검증은 Entity에서 수행
- 등급 구간은 minRange 내림차순으로 자동 정렬
- 불변성 보장 (Entity 메서드를 통해서만 변경)

