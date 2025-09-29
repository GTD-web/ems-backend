# 평가 관리 시스템 컨텍스트 설계 분석

## 1. 기존 프로젝트 관리 시스템 컨텍스트 분석

### 1.1 현재 컨텍스트 구조 (Project Management System)

```
context/
├── project-management-context/          # 프로젝트 관리 컨텍스트
│   ├── project.context/                 # 프로젝트 핵심 관리
│   ├── project-favorite-tag.context/    # 프로젝트 즐겨찾기 태그 관리
│   └── project-type.context/            # 프로젝트 타입 관리
├── company-management-context/          # 회사 관리 컨텍스트
├── resource-management-context/         # 리소스 관리 컨텍스트
├── deliverable-management-context/      # 산출물 관리 컨텍스트
├── milstone-management-context/         # 마일스톤 관리 컨텍스트
├── wbs-management-context/              # WBS 관리 컨텍스트
├── approval-management.context.interface.ts  # 승인 관리 컨텍스트
└── analytics.context.interface.ts       # 분석 컨텍스트
```

### 1.2 컨텍스트 명명 패턴 분석

**패턴 1: 도메인-management-context**

- `project-management-context`
- `company-management-context`
- `resource-management-context`
- `deliverable-management-context`
- `wbs-management-context`

**패턴 2: 도메인-context**

- `project.context` (하위 컨텍스트)
- `project-favorite-tag.context`
- `project-type.context`

**패턴 3: 도메인.context.interface.ts**

- `approval-management.context.interface.ts`
- `analytics.context.interface.ts`

## 2. 평가 관리 시스템 도메인 분석

### 2.1 Core 도메인 엔티티 분석

```
domain/core/
├── evaluation-period/                   # 평가 기간 관리
├── grade-range/                         # 등급 구간 관리
├── evaluation-criteria/                 # 평가 기준 관리
├── evaluation-line/                     # 평가 라인 관리
├── evaluation-line-mapping/             # 평가 라인 매핑
├── deliverable/                         # 산출물 평가
├── deliverable-mapping/                 # 산출물 매핑
├── downward-evaluation/                 # 하향 평가
├── downward-evaluation-mapping/         # 하향 평가 매핑
├── peer-evaluation/                     # 동료 평가
├── peer-evaluation-mapping/             # 동료 평가 매핑
├── wbs-self-evaluation/                 # WBS 자기 평가
├── wbs-self-evaluation-mapping/         # WBS 자기 평가 매핑
├── wbs-evaluation-criteria/             # WBS 평가 기준
├── employee-evaluation-status/          # 직원 평가 상태
├── employee-evaluation-status-mapping/  # 직원 평가 상태 매핑
└── additional-evaluation/               # 추가 평가
```

### 2.2 Sub 도메인 엔티티 분석

```
domain/sub/
├── evaluation-question/                 # 평가 질문 관리
├── evaluation-response/                 # 평가 응답 관리
└── question-group/                      # 질문 그룹 관리
```

### 2.3 Common 도메인 엔티티 분석

```
domain/common/
├── department/                          # 부서 관리 (외부 동기화)
├── employee/                            # 직원 관리 (외부 동기화)
├── project/                             # 프로젝트 관리 (외부 동기화)
└── wbs-item/                            # WBS 항목 관리 (외부 동기화)
```

## 3. 도메인별 응집도 분석

### 3.1 높은 응집도 그룹

#### **평가 기간 관리 그룹**

- **엔티티**: `evaluation-period`, `grade-range`
- **응집도**: 매우 높음
- **이유**: 평가 기간과 등급 구간은 밀접한 관계 (평가 기간별 등급 설정)

#### **평가 실행 그룹**

- **엔티티**: `downward-evaluation`, `peer-evaluation`, `wbs-self-evaluation`
- **응집도**: 높음
- **이유**: 모든 평가 유형의 실행과 관리

#### **평가 기준 관리 그룹**

- **엔티티**: `evaluation-criteria`, `evaluation-line`, `wbs-evaluation-criteria`
- **응집도**: 높음
- **이유**: 평가 기준과 평가 라인의 설정 및 관리

#### **평가 질문 관리 그룹**

- **엔티티**: `evaluation-question`, `evaluation-response`, `question-group`
- **응집도**: 높음
- **이유**: 평가 질문의 생성, 그룹화, 응답 관리

### 3.2 중간 응집도 그룹

#### **매핑 관리 그룹**

- **엔티티**: 모든 `*-mapping` 엔티티들
- **응집도**: 중간
- **이유**: 각각 다른 도메인 간의 관계를 관리하지만 매핑이라는 공통 목적

#### **상태 관리 그룹**

- **엔티티**: `employee-evaluation-status`, `employee-evaluation-status-mapping`
- **응집도**: 중간
- **이유**: 직원별 평가 상태 추적

#### **산출물 평가 그룹**

- **엔티티**: `deliverable`, `deliverable-mapping`
- **응집도**: 중간
- **이유**: 산출물 기반 평가 관리

## 4. 권장 컨텍스트 구조

### 4.1 최종 권장 컨텍스트 명

```
context/
├── evaluation-period-management-context/        # 평가 기간 관리 컨텍스트
│   ├── evaluation-period.context/              # 평가 기간 핵심 관리
│   └── grade-range.context/                    # 등급 구간 관리
├── evaluation-criteria-management-context/     # 평가 기준 관리 컨텍스트
│   ├── evaluation-criteria.context/           # 평가 기준 관리
│   ├── evaluation-line.context/               # 평가 라인 관리
│   └── wbs-evaluation-criteria.context/       # WBS 평가 기준 관리
├── evaluation-execution-context/               # 평가 실행 컨텍스트
│   ├── downward-evaluation.context/           # 하향 평가 실행
│   ├── peer-evaluation.context/               # 동료 평가 실행
│   ├── wbs-self-evaluation.context/           # WBS 자기 평가 실행
│   └── deliverable-evaluation.context/        # 산출물 평가 실행
├── evaluation-question-management-context/     # 평가 질문 관리 컨텍스트
│   ├── evaluation-question.context/           # 평가 질문 관리
│   ├── question-group.context/                # 질문 그룹 관리
│   └── evaluation-response.context/           # 평가 응답 관리
├── evaluation-status-management-context/       # 평가 상태 관리 컨텍스트
│   ├── employee-evaluation-status.context/    # 직원 평가 상태 관리
│   └── additional-evaluation.context/         # 추가 평가 관리
├── evaluation-mapping-context/                 # 평가 매핑 컨텍스트
│   ├── evaluation-line-mapping.context/       # 평가 라인 매핑
│   ├── deliverable-mapping.context/           # 산출물 매핑
│   ├── downward-evaluation-mapping.context/   # 하향 평가 매핑
│   ├── peer-evaluation-mapping.context/       # 동료 평가 매핑
│   ├── wbs-self-evaluation-mapping.context/   # WBS 자기 평가 매핑
│   └── employee-evaluation-status-mapping.context/ # 직원 평가 상태 매핑
├── evaluation-analytics-context/               # 평가 분석 컨텍스트
└── evaluation-approval-context/                # 평가 승인 컨텍스트
```

### 4.2 컨텍스트별 책임 요약

#### **평가 기간 관리 컨텍스트 (EvaluationPeriodManagementContext)**

- **포함 도메인**: `evaluation-period`, `grade-range`
- **주요 책임**:
  - 평가 기간 생성/수정/삭제/상태 관리
  - 등급 구간 설정 및 점수 매핑
  - 평가 기간별 등급 체계 관리

#### **평가 기준 관리 컨텍스트 (EvaluationCriteriaManagementContext)**

- **포함 도메인**: `evaluation-criteria`, `evaluation-line`, `wbs-evaluation-criteria`
- **주요 책임**:
  - 평가 기준 정의 및 관리
  - 평가 라인 설정 및 구조 관리
  - WBS별 평가 기준 설정

#### **평가 실행 컨텍스트 (EvaluationExecutionContext)**

- **포함 도메인**: `downward-evaluation`, `peer-evaluation`, `wbs-self-evaluation`, `deliverable`
- **주요 책임**:
  - 모든 유형의 평가 실행 및 관리
  - 평가 진행 상태 추적
  - 평가 결과 수집 및 처리

#### **평가 질문 관리 컨텍스트 (EvaluationQuestionManagementContext)**

- **포함 도메인**: `evaluation-question`, `question-group`, `evaluation-response`
- **주요 책임**:
  - 평가 질문 생성 및 관리
  - 질문 그룹화 및 카테고리 관리
  - 평가 응답 수집 및 관리

#### **평가 상태 관리 컨텍스트 (EvaluationStatusManagementContext)**

- **포함 도메인**: `employee-evaluation-status`, `additional-evaluation`
- **주요 책임**:
  - 직원별 평가 상태 추적
  - 추가 평가 관리
  - 평가 완료도 모니터링

#### **평가 매핑 컨텍스트 (EvaluationMappingContext)**

- **포함 도메인**: 모든 `*-mapping` 도메인
- **주요 책임**:
  - 도메인 간 관계 매핑 관리
  - 평가 대상과 평가자 간의 관계 설정
  - 매핑 데이터 일관성 보장

#### **평가 분석 컨텍스트 (EvaluationAnalyticsContext)**

- **주요 책임**:
  - 평가 결과 통계 및 분석
  - 성과 지표 계산
  - 평가 트렌드 분석
  - 리포트 생성

#### **평가 승인 컨텍스트 (EvaluationApprovalContext)**

- **주요 책임**:
  - 평가 결과 승인 프로세스
  - 승인 워크플로우 관리
  - 승인 이력 추적

## 5. 컨텍스트 간 상호작용 패턴

### 5.1 이벤트 기반 통신

```typescript
// 도메인 이벤트 예시들
const evaluationPeriodStartedEvent: DomainEvent = {
  eventType: 'EVALUATION_PERIOD_STARTED',
  aggregateId: 'period-123',
  eventData: { periodId: 'period-123', startDate: new Date() },
  occurredAt: new Date(),
};

const evaluationCompletedEvent: DomainEvent = {
  eventType: 'EVALUATION_COMPLETED',
  aggregateId: 'eval-456',
  eventData: { evaluationId: 'eval-456', employeeId: 'emp-789', score: 85 },
  occurredAt: new Date(),
};

const gradeRangeUpdatedEvent: DomainEvent = {
  eventType: 'GRADE_RANGE_UPDATED',
  aggregateId: 'grade-range-101',
  eventData: { periodId: 'period-123', grade: 'A', newRange: [80, 89] },
  occurredAt: new Date(),
};
```

### 5.2 컨텍스트 간 조회 패턴

```typescript
// 평가 실행 컨텍스트에서 평가 기간 정보 조회
interface IEvaluationPeriodQueryService {
  평가기간정보조회한다(periodId: string): Promise<EvaluationPeriodInfo>;
  활성평가기간조회한다(): Promise<EvaluationPeriodInfo[]>;
  등급구간조회한다(periodId: string): Promise<GradeRangeInfo[]>;
}

// 평가 분석 컨텍스트에서 평가 결과 조회
interface IEvaluationResultQueryService {
  직원평가결과조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationResultInfo[]>;
  부서별평가통계조회한다(
    departmentId: string,
    periodId: string,
  ): Promise<EvaluationStatistics>;
}

// 평가 상태 컨텍스트에서 평가 진행 상황 조회
interface IEvaluationStatusQueryService {
  평가진행상황조회한다(periodId: string): Promise<EvaluationProgressInfo>;
  미완료평가목록조회한다(employeeId: string): Promise<PendingEvaluationInfo[]>;
}
```

## 6. 구현 우선순위 제안

### Phase 1: 핵심 컨텍스트 (필수)

1. **EvaluationPeriodManagementContext** - 평가 기간 및 등급 관리
2. **EvaluationCriteriaManagementContext** - 평가 기준 설정
3. **EvaluationQuestionManagementContext** - 평가 질문 관리

### Phase 2: 실행 컨텍스트 (중요)

1. **EvaluationExecutionContext** - 평가 실행 및 관리
2. **EvaluationStatusManagementContext** - 평가 상태 추적

### Phase 3: 확장 컨텍스트 (부가가치)

1. **EvaluationMappingContext** - 매핑 관계 관리
2. **EvaluationAnalyticsContext** - 분석 및 리포트
3. **EvaluationApprovalContext** - 승인 프로세스

## 7. 컨텍스트 설계 원칙

### 7.1 명명 규칙 일관성

- **컨텍스트 디렉토리**: `{domain}-management-context/` 또는 `{domain}-context/`
- **하위 컨텍스트**: `{subdomain}.context/`
- **인터페이스 파일**: `{domain}.context.interface.ts`

### 7.2 응집도 최적화

- 관련 도메인을 하나의 컨텍스트로 그룹화
- 비즈니스 프로세스 기준으로 컨텍스트 분리
- 데이터 일관성이 중요한 도메인은 같은 컨텍스트에 배치

### 7.3 결합도 최소화

- 컨텍스트 간 직접 의존성 방지
- 이벤트 기반 통신 활용
- 조회 서비스 인터페이스를 통한 데이터 접근

## 8. 기존 프로젝트와의 차이점 분석

### 8.1 도메인 복잡도

**프로젝트 관리 시스템**:

- 계층적 구조 (프로젝트 → WBS → 태스크)
- 리소스 중심의 관리

**평가 관리 시스템**:

- 시간 기반 구조 (평가 기간 → 평가 실행 → 결과)
- 프로세스 중심의 관리

### 8.2 컨텍스트 분리 전략

**프로젝트 관리**: 엔티티 타입별 분리 (프로젝트, WBS, 마일스톤)
**평가 관리**: 비즈니스 프로세스별 분리 (기간 관리, 실행, 분석)

### 8.3 매핑 엔티티 처리

**프로젝트 관리**: 각 컨텍스트에 분산
**평가 관리**: 전용 매핑 컨텍스트로 집중 관리

## 9. 구현 시 고려사항

### 9.1 트랜잭션 관리

- 평가 기간 내 모든 작업은 트랜잭션 보장
- 컨텍스트 간 작업은 이벤트 기반 최종 일관성
- 평가 결과 집계 시 보상 트랜잭션 패턴 적용

### 9.2 성능 최적화

- 평가 결과 조회 시 캐싱 적용
- 대량 평가 데이터 처리 시 배치 처리
- 실시간 진행률 계산을 위한 비동기 처리

### 9.3 확장성 고려

- 새로운 평가 유형 추가 시 기존 컨텍스트 영향 최소화
- 평가 기준 변경 시 하위 호환성 보장
- 다국어 지원을 위한 질문 관리 구조

이 설계를 바탕으로 각 컨텍스트를 단계적으로 구현하면, 평가 관리 도메인의 복잡성을 효과적으로 관리할 수 있는 컨텍스트 레이어를 구축할 수 있습니다.

