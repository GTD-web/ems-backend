# Evaluation Activity Log Context - CQRS 패턴

이 컨텍스트는 **CQRS (Command Query Responsibility Segregation)** 패턴을 적용하여 평가 활동 내역의 생성(Command)과 조회(Query) 책임을 분리합니다.

## 📋 목차

- [CQRS 패턴 개요](#cqrs-패턴-개요)
- [디렉토리 구조](#디렉토리-구조)
- [Command Handlers](#command-handlers)
- [Query Handlers](#query-handlers)
- [사용 방법](#사용-방법)
- [테스트](#테스트)

---

## CQRS 패턴 개요

### CQRS란?

CQRS는 데이터의 <strong>쓰기(Command)</strong>와 **읽기(Query)** 작업을 분리하는 아키텍처 패턴입니다.

```
┌─────────────┐         ┌──────────────────┐
│   Command   │────────>│ Command Handler  │
│  (쓰기 작업)  │         │  (데이터 변경)      │
└─────────────┘         └──────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Database   │
                        └──────────────┘
                               ▲
                               │
┌─────────────┐         ┌──────────────────┐
│    Query    │────────>│  Query Handler   │
│  (읽기 작업)  │         │  (데이터 조회)      │
└─────────────┘         └──────────────────┘
```

### 장점

#### 1. **단일 책임 원칙 (Single Responsibility Principle)**

각 Handler는 정확히 하나의 작업만 수행합니다.

**기존 Service 방식:**
```typescript
// ❌ 하나의 서비스에 모든 메서드가 섞여있음
class EvaluationActivityLogService {
  활동내역을_기록한다() { /* 복잡한 로직 */ }
  단계승인_활동내역을_기록한다() { /* 복잡한 로직 */ }
  재작성완료_활동내역을_기록한다() { /* 복잡한 로직 */ }
  평가기간_피평가자_활동내역을_조회한다() { /* 복잡한 로직 */ }
  // ... 수십 개의 메서드
}
```

**CQRS 방식:**
```typescript
// ✅ 각 Handler가 하나의 작업만 담당
class CreateEvaluationActivityLogHandler {
  execute(command) { /* 활동 내역 생성만 */ }
}

class GetEvaluationActivityLogListHandler {
  execute(query) { /* 활동 내역 조회만 */ }
}
```

**이점:**
- 코드 이해가 쉬움 (파일명만 봐도 무슨 일을 하는지 명확)
- 수정 범위가 명확 (활동 내역 생성 로직 수정 시 해당 Handler만 수정)
- 코드 리뷰가 간결 (변경 사항이 한정적)

#### 2. **확장성 (Scalability)**

Command와 Query를 독립적으로 확장할 수 있습니다.

**실제 시나리오:**
```typescript
// 새로운 활동 유형 추가가 필요할 때
// ✅ 새로운 Handler만 추가하면 됨
class Create평가완료활동내역Handler {
  // 기존 코드를 전혀 건드리지 않고 새 기능 추가
}

// 기존 Handler는 영향 없음 ✓
```

**기존 방식의 문제:**
```typescript
// ❌ 기존 Service를 수정해야 함
class EvaluationActivityLogService {
  활동내역을_기록한다() {
    // 기존 로직...
    if (type === 'new_type') { // 새로운 분기 추가
      // 새 로직... (기존 코드와 섞임)
    }
  }
}
```

**이점:**
- Open/Closed 원칙 준수 (확장에는 열려있고, 수정에는 닫혀있음)
- 레거시 코드 건드리지 않고 신규 기능 추가
- 배포 리스크 감소

#### 3. **가독성 (Readability)**

비즈니스 로직이 명확하게 분리되어 코드를 읽기 쉽습니다.

**Controller/Service에서:**
```typescript
// ✅ 코드를 읽는 사람이 의도를 즉시 이해
async WBS를_할당한다(params) {
  const assignment = await this.wbsService.할당한다(params);
  
  // "아, 여기서 활동 내역을 생성하는구나"
  await this.commandBus.execute(
    new 평가활동내역을생성한다(
      params.periodId,
      params.employeeId,
      'wbs_assignment',
      'created',
      'WBS 할당',
    ),
  );
  
  return assignment;
}
```

**Handler 파일 구조:**
```
handlers/
├── commands/
│   ├── create-evaluation-activity-log.handler.ts  ← "활동 내역 생성"
│   ├── create-step-approval-activity-log.handler.ts  ← "단계 승인 활동 내역 생성"
│   └── create-revision-completed-activity-log.handler.ts  ← "재작성 완료 활동 내역 생성"
└── queries/
    └── get-evaluation-activity-log-list.handler.ts  ← "활동 내역 목록 조회"
```

**이점:**
- 파일명이 곧 문서화 (별도 문서 없이도 구조 파악 가능)
- 새로운 팀원의 온보딩 시간 단축
- 버그 발생 시 관련 코드 찾기 쉬움

#### 4. **테스트 용이성 (Testability)**

각 Handler를 완전히 독립적으로 테스트할 수 있습니다.

**Mock 최소화:**
```typescript
describe('CreateEvaluationActivityLogHandler', () => {
  // ✅ 이 Handler에 필요한 의존성만 Mock
  const mockActivityLogService = { 생성한다: jest.fn() };
  const mockEmployeeService = { ID로_조회한다: jest.fn() };
  
  // 다른 수십 개의 의존성은 신경 쓸 필요 없음!
});
```

**기존 Service 테스트의 문제:**
```typescript
describe('EvaluationActivityLogService', () => {
  // ❌ 하나의 메서드를 테스트하려면 모든 의존성 Mock 필요
  const mockDep1 = ...;
  const mockDep2 = ...;
  const mockDep3 = ...;
  // ... 수십 개
});
```

**실행 속도:**
```bash
# CQRS Handler 테스트 (24개 테스트)
Test Suites: 4 passed, 4 total
Tests:       24 passed, 24 total
Time:        9.585 s  ← 빠름!

# 기존 통합 테스트
Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        22.69 s  ← 느림
```

**이점:**
- 단위 테스트가 진짜 "단위" 테스트가 됨
- 테스트 실행 속도 향상
- 테스트 실패 시 정확한 원인 파악 용이

#### 5. **성능 최적화 (Performance Optimization)**

읽기와 쓰기를 독립적으로 최적화할 수 있습니다.

**쓰기 최적화 (Command):**
```typescript
@CommandHandler(평가활동내역을생성한다)
class CreateEvaluationActivityLogHandler {
  async execute(command) {
    // ✅ 쓰기 전용 최적화
    // - 트랜잭션 사용
    // - 동기 처리
    // - 데이터 정합성 우선
    return await this.repository.save(data);
  }
}
```

**읽기 최적화 (Query):**
```typescript
@QueryHandler(평가활동내역목록을조회한다)
class GetEvaluationActivityLogListHandler {
  async execute(query) {
    // ✅ 읽기 전용 최적화
    // - 캐싱 적용 가능
    // - Read Replica 사용 가능
    // - 인덱스 최적화
    // - 페이징 처리
    return await this.repository
      .createQueryBuilder()
      .cache(60000) // 1분 캐싱
      .paginate(query.page, query.limit);
  }
}
```

**향후 확장 가능성:**
```typescript
// Query Handler에만 캐시 적용
@QueryHandler(평가활동내역목록을조회한다)
class GetEvaluationActivityLogListHandler {
  constructor(
    private readonly cacheManager: CacheManager, // ← Query만 캐시 사용
  ) {}
  
  async execute(query) {
    const cacheKey = `logs:${query.periodId}:${query.employeeId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    
    const result = await this.repository.find(query);
    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }
}
```

**이점:**
- Query는 읽기 전용이므로 공격적인 캐싱 가능
- 읽기/쓰기 데이터베이스 분리 가능 (CQRS의 궁극적 형태)
- 성능 병목 지점을 정확히 파악하고 최적화 가능

#### 6. **명시적인 비즈니스 의도 (Explicit Business Intent)**

코드가 비즈니스 언어(Ubiquitous Language)를 그대로 표현합니다.

**Command 이름 = 비즈니스 액션:**
```typescript
// 비즈니스: "단계 승인 활동 내역을 생성한다"
await this.commandBus.execute(
  new 단계승인활동내역을생성한다(...)  // ← 비즈니스 언어 그대로
);

// 비즈니스: "재작성 완료 활동 내역을 생성한다"
await this.commandBus.execute(
  new 재작성완료활동내역을생성한다(...)  // ← 의도가 명확
);
```

**기존 방식의 모호함:**
```typescript
// ❌ 무슨 일을 하는지 메서드 이름만으로는 불명확
await this.service.활동내역을_기록한다({
  type: 'step_approval',  // 이게 뭐지?
  action: 'approved',     // 이건 또 뭐지?
  // ... 수십 개의 옵션
});
```

**이점:**
- 도메인 전문가와의 커뮤니케이션 개선
- 코드 리뷰 시 비즈니스 로직 이해도 향상
- 잘못된 사용 방지 (타입 시스템이 강제)

#### 7. **변경 추적 및 감사 (Change Tracking & Audit)**

모든 Command를 로깅/추적할 수 있습니다.

```typescript
// ✅ Interceptor나 Middleware로 모든 Command 로깅
@Injectable()
export class CommandLoggingInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const command = context.getArgs()[0];
    console.log(`[Command] ${command.constructor.name}`, command);
    
    // 누가, 언제, 무엇을 변경했는지 자동 기록
    return next.handle();
  }
}
```

**이점:**
- 데이터 변경 이력 자동 추적
- 보안 감사 trail 구축 용이
- 디버깅 시 실행 흐름 파악 쉬움

---

### 단점

CQRS는 강력하지만, 적용하기 전에 고려해야 할 단점도 있습니다.

#### 1. **초기 구축 비용 증가**

더 많은 파일과 클래스를 작성해야 합니다.

**기존 방식 (1개 파일):**
```
evaluation-activity-log-context/
└── evaluation-activity-log-context.service.ts  ← 하나의 파일
```

**CQRS 방식 (6개 핵심 파일 + 인터페이스):**
```
evaluation-activity-log-context/
├── handlers/
│   ├── commands/
│   │   ├── create-evaluation-activity-log.handler.ts
│   │   ├── create-step-approval-activity-log.handler.ts
│   │   └── create-revision-completed-activity-log.handler.ts
│   ├── queries/
│   │   └── get-evaluation-activity-log-list.handler.ts
│   └── index.ts
├── interfaces/
│   └── evaluation-activity-log-context.interface.ts
├── evaluation-activity-log-context.module.ts
└── README.md
```

**기존 Service는 완전히 제거되었습니다.** 모든 기능이 Command/Query Handler로 대체되었습니다.

**고려사항:**
- 간단한 CRUD 작업에는 오버엔지니어링일 수 있음
- 팀원들이 CQRS 패턴을 학습하는 시간 필요
- 보일러플레이트 코드 증가

**권장사항:**
```
✅ CQRS 적용하기 좋은 경우:
  - 비즈니스 로직이 복잡한 경우
  - 여러 곳에서 같은 작업을 수행하는 경우
  - 읽기와 쓰기 성능 요구사항이 다른 경우
  - 팀 규모가 크고 여러 개발자가 협업하는 경우

❌ CQRS가 과한 경우:
  - 단순 CRUD만 하는 경우
  - 프로토타입이나 MVP 개발 시
  - 팀 규모가 작고 빠른 개발이 필요한 경우
```

#### 2. **학습 곡선 (Learning Curve)**

새로운 개념과 패턴을 학습해야 합니다.

**팀원이 알아야 할 것들:**
- CommandBus와 QueryBus의 차이
- Handler의 역할과 책임
- Command와 Query 설계 방법
- Module에서 Handler 등록 방법
- 테스트 작성 방법

**혼란스러울 수 있는 부분:**
```typescript
// ❌ 잘못된 사용: Query에서 데이터 변경 시도
@QueryHandler(GetSomethingQuery)
class GetSomethingHandler {
  async execute(query) {
    const data = await this.repository.find();
    await this.repository.save(modified); // ← 안 됨!
    return data;
  }
}

// ✅ 올바른 사용: Query는 조회만
@QueryHandler(GetSomethingQuery)
class GetSomethingHandler {
  async execute(query) {
    return await this.repository.find(); // ← 읽기만
  }
}
```

**완화 방법:**
- 명확한 문서화 (이 README 같은)
- 코드 리뷰에서 패턴 강제
- 예시 코드 제공

#### 3. **일관성 문제 가능성**

CQRS를 극단적으로 적용하면 Eventual Consistency 문제가 발생할 수 있습니다.

**문제 시나리오:**
```typescript
// Command (쓰기 DB에 저장)
await this.commandBus.execute(new CreateActivityLog(...));

// Query (읽기 DB에서 조회) - 아직 동기화 안 됨!
const logs = await this.queryBus.execute(new GetActivityLogList(...));
// ← 방금 생성한 로그가 안 보일 수 있음
```

**이 프로젝트의 경우:**
- ✅ 같은 데이터베이스를 사용하므로 문제 없음
- ✅ 동기적으로 처리되므로 즉시 일관성 보장

**주의사항:**
- 나중에 읽기/쓰기 DB를 분리하면 고려 필요
- 이벤트 소싱을 도입하면 추가 복잡도 증가

#### 4. **디버깅 복잡도**

실행 흐름을 추적하기 어려울 수 있습니다.

**기존 방식:**
```typescript
service.활동내역을_기록한다();  // ← 여기서 바로 실행
```

**CQRS 방식:**
```typescript
commandBus.execute(new Command());
  ↓
CommandBus가 Handler를 찾음
  ↓
Handler.execute() 실행
  ↓
실제 로직 실행
```

**완화 방법:**
```typescript
// Logger를 활용한 추적
@CommandHandler(평가활동내역을생성한다)
class CreateEvaluationActivityLogHandler {
  private readonly logger = new Logger(CreateEvaluationActivityLogHandler.name);
  
  async execute(command) {
    this.logger.log('활동 내역 생성 시작', { command });
    const result = await this.service.생성한다(command);
    this.logger.log('활동 내역 생성 완료', { result });
    return result;
  }
}
```

#### 5. **불필요한 추상화 위험**

모든 것을 Handler로 만들 필요는 없습니다.

**❌ 과도한 CQRS:**
```typescript
// 너무 간단한 작업도 Handler로 만드는 경우
class GetUserNameQuery { constructor(public userId: string) {} }
class GetUserEmailQuery { constructor(public userId: string) {} }
class GetUserPhoneQuery { constructor(public userId: string) {} }
// ... 수십 개의 Query
```

**✅ 적절한 균형:**
```typescript
// 복잡한 비즈니스 로직만 Handler로
class GetEmployeeEvaluationDataQuery { /* 복잡한 집계 */ }

// 단순 조회는 Service 메서드로
class EmployeeService {
  getName(id: string) { return this.repo.findOne(id).name; }
}
```

**권장사항:**
- 비즈니스 로직이 있는 작업만 Handler로 분리
- 단순 CRUD는 기존 방식 유지 고려
- 팀의 복잡도 수용 능력 고려

---

### 결론: CQRS를 언제 사용해야 할까?

#### ✅ CQRS 적용을 권장하는 경우

1. **복잡한 비즈니스 로직**
   - 활동 내역 생성 시 여러 규칙과 변환이 필요
   - 승인, 재작성 등 복잡한 워크플로우

2. **여러 곳에서 재사용**
   - 활동 내역을 여러 비즈니스 서비스에서 생성
   - 중복 코드 방지 필요

3. **팀 협업**
   - 여러 개발자가 동시에 작업
   - 코드 충돌 최소화 필요

4. **명확한 비즈니스 의도 표현**
   - 도메인 주도 설계(DDD) 적용 중
   - 비즈니스 용어를 코드에 반영하고 싶음

#### ❌ CQRS가 과할 수 있는 경우

1. **단순 CRUD**
   - 복잡한 로직 없이 DB 읽기/쓰기만 함
   - 예: 단순 마스터 데이터 관리

2. **프로토타입/MVP**
   - 빠른 개발과 검증이 우선
   - 나중에 리팩토링 가능

3. **소규모 팀**
   - 1-2명의 개발자
   - 추가 추상화가 오히려 부담

---

## 디렉토리 구조

```
evaluation-activity-log-context/
├── handlers/
│   ├── commands/                          # Command Handlers (쓰기)
│   │   ├── create-evaluation-activity-log.handler.ts
│   │   ├── create-step-approval-activity-log.handler.ts
│   │   └── create-revision-completed-activity-log.handler.ts
│   ├── queries/                           # Query Handlers (읽기)
│   │   └── get-evaluation-activity-log-list.handler.ts
│   └── index.ts                           # Handler 내보내기
├── interfaces/
│   └── evaluation-activity-log-context.interface.ts
├── evaluation-activity-log-context.module.ts
└── README.md                              # 이 문서
```

---

## Command Handlers

Command는 **데이터를 변경하는 작업**입니다. 활동 내역을 생성하거나 수정하는 모든 작업이 Command에 해당합니다.

### 1. 평가활동내역을생성한다 (CreateEvaluationActivityLog)

가장 기본적인 활동 내역 생성 Command입니다.

#### Command 클래스

```typescript
export class 평가활동내역을생성한다 {
  constructor(
    public readonly periodId: string,           // 평가기간 ID
    public readonly employeeId: string,         // 피평가자 ID
    public readonly activityType: string,       // 활동 유형
    public readonly activityAction: string,     // 활동 액션
    public readonly activityTitle?: string,     // 활동 제목
    public readonly activityDescription?: string, // 활동 설명
    public readonly relatedEntityType?: string, // 관련 엔티티 타입
    public readonly relatedEntityId?: string,   // 관련 엔티티 ID
    public readonly performedBy?: string,       // 수행자 ID
    public readonly performedByName?: string,   // 수행자 이름
    public readonly activityMetadata?: Record<string, any>, // 메타데이터
    public readonly activityDate?: Date,        // 활동 일시
  ) {}
}
```

#### Handler 구현

```typescript
@Injectable()
@CommandHandler(평가활동내역을생성한다)
export class CreateEvaluationActivityLogHandler
  implements ICommandHandler<평가활동내역을생성한다, EvaluationActivityLogDto>
{
  constructor(
    private readonly activityLogService: EvaluationActivityLogService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(
    command: 평가활동내역을생성한다,
  ): Promise<EvaluationActivityLogDto> {
    // 1. 수행자 정보 조회 (필요시)
    let performedByName = command.performedByName;
    if (!performedByName && command.performedBy) {
      const employee = await this.employeeService.ID로_조회한다(command.performedBy);
      if (employee) {
        performedByName = employee.name;
      }
    }

    // 2. 활동 설명 자동 생성 (제공되지 않은 경우)
    let activityDescription = command.activityDescription;
    if (!activityDescription && performedByName && command.activityTitle) {
      const actionText = this.액션을_텍스트로_변환한다(command.activityAction);
      const objectName = this.객체명을_추출한다(command.activityTitle, actionText);
      const particle = this.조사를_결정한다(objectName);
      activityDescription = `${performedByName}님이 ${objectName}${particle} ${actionText}했습니다.`;
    }

    // 3. 활동 내역 생성
    return await this.activityLogService.생성한다({
      periodId: command.periodId,
      employeeId: command.employeeId,
      activityType: command.activityType as EvaluationActivityType,
      activityAction: command.activityAction as EvaluationActivityAction,
      activityTitle: command.activityTitle,
      activityDescription,
      relatedEntityType: command.relatedEntityType,
      relatedEntityId: command.relatedEntityId,
      performedBy: command.performedBy,
      performedByName,
      activityMetadata: command.activityMetadata,
      activityDate: command.activityDate,
    });
  }

  private 액션을_텍스트로_변환한다(action: string): string {
    const actionMap: Record<string, string> = {
      created: '생성',
      updated: '수정',
      submitted: '제출',
      completed: '완료',
      approved: '승인',
      rejected: '거부',
      revision_requested: '재작성 요청',
      revision_completed: '재작성 완료',
    };
    return actionMap[action] || action;
  }

  private 조사를_결정한다(text: string): string {
    if (!text) return '를';
    const lastChar = text[text.length - 1];
    const lastCharCode = lastChar.charCodeAt(0);
    
    // 한글 받침 여부 확인
    if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
      const hasBatchim = (lastCharCode - 0xac00) % 28 !== 0;
      return hasBatchim ? '을' : '를';
    }
    return '를';
  }
}
```

#### 사용 예시

```typescript
// Controller나 Service에서 사용
@Injectable()
export class SomeService {
  constructor(private readonly commandBus: CommandBus) {}

  async 어떤_작업을_수행한다() {
    // Command 실행
    const log = await this.commandBus.execute(
      new 평가활동내역을생성한다(
        'period-id',
        'employee-id',
        'wbs_assignment',
        'created',
        'WBS 할당',
        undefined, // activityDescription (자동 생성됨)
        'wbs_assignment',
        'assignment-id',
        'admin-id',
        undefined, // performedByName (자동 조회됨)
        { wbsItemId: 'wbs-id', projectId: 'project-id' },
      ),
    );

    console.log('활동 내역 생성 완료:', log.id);
  }
}
```

### 2. 단계승인활동내역을생성한다 (CreateStepApprovalActivityLog)

단계별 승인/재작성 요청 시 활동 내역을 자동으로 생성합니다.

#### Command 클래스

```typescript
export class 단계승인활동내역을생성한다 {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly step: string,              // 'criteria' | 'self' | 'primary' | 'secondary'
    public readonly status: StepApprovalStatus, // 'APPROVED' | 'REVISION_REQUESTED'
    public readonly updatedBy: string,
    public readonly revisionComment?: string,
    public readonly evaluatorId?: string,
  ) {}
}
```

#### 사용 예시

```typescript
// 평가기준 승인
await this.commandBus.execute(
  new 단계승인활동내역을생성한다(
    'period-id',
    'employee-id',
    'criteria',
    StepApprovalStatus.APPROVED,
    'evaluator-id',
  ),
);
// 결과: "홍길동님이 평가기준 설정을 승인했습니다."

// 자기평가 재작성 요청
await this.commandBus.execute(
  new 단계승인활동내역을생성한다(
    'period-id',
    'employee-id',
    'self',
    StepApprovalStatus.REVISION_REQUESTED,
    'evaluator-id',
    '평가 내용을 더 구체적으로 작성해주세요.',
  ),
);
// 결과: "홍길동님이 자기평가를 재작성 요청했습니다."
```

### 3. 재작성완료활동내역을생성한다 (CreateRevisionCompletedActivityLog)

재작성 완료 시 활동 내역을 생성합니다.

#### Command 클래스

```typescript
export class 재작성완료활동내역을생성한다 {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly step: RevisionRequestStepType,
    public readonly requestId: string,
    public readonly performedBy: string,
    public readonly responseComment: string,
    public readonly allCompleted: boolean,
  ) {}
}
```

#### 사용 예시

```typescript
await this.commandBus.execute(
  new 재작성완료활동내역을생성한다(
    'period-id',
    'employee-id',
    'self',
    'request-id',
    'employee-id',
    '평가 내용을 수정하여 다시 제출했습니다.',
    true,
  ),
);
// 결과: "홍길동님이 자기평가 재작성 완료를 재작성 완료했습니다."
```

---

## Query Handlers

Query는 **데이터를 조회하는 작업**입니다. 활동 내역을 읽기만 하고 변경하지 않습니다.

### 평가활동내역목록을조회한다 (GetEvaluationActivityLogList)

평가기간 및 피평가자 기준으로 활동 내역 목록을 조회합니다.

#### Query 클래스

```typescript
export class 평가활동내역목록을조회한다 {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly activityType?: string,      // 필터: 활동 유형
    public readonly startDate?: Date,           // 필터: 시작일
    public readonly endDate?: Date,             // 필터: 종료일
    public readonly page: number = 1,           // 페이지 번호
    public readonly limit: number = 10,         // 페이지 크기
  ) {}
}
```

#### Handler 구현

```typescript
@Injectable()
@QueryHandler(평가활동내역목록을조회한다)
export class GetEvaluationActivityLogListHandler
  implements IQueryHandler<평가활동내역목록을조회한다, GetEvaluationActivityLogListResult>
{
  constructor(
    private readonly activityLogService: EvaluationActivityLogService,
  ) {}

  async execute(
    query: 평가활동내역목록을조회한다,
  ): Promise<GetEvaluationActivityLogListResult> {
    return await this.activityLogService.평가기간_피평가자_활동내역을_조회한다({
      periodId: query.periodId,
      employeeId: query.employeeId,
      activityType: query.activityType,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
```

#### 사용 예시

```typescript
// 전체 활동 내역 조회
const result = await this.queryBus.execute(
  new 평가활동내역목록을조회한다(
    'period-id',
    'employee-id',
  ),
);

console.log('총 활동 수:', result.total);
console.log('현재 페이지:', result.page);
console.log('활동 목록:', result.logs);

// 특정 유형만 필터링
const wbsLogs = await this.queryBus.execute(
  new 평가활동내역목록을조회한다(
    'period-id',
    'employee-id',
    'wbs_assignment', // WBS 할당 관련만
  ),
);

// 기간으로 필터링
const monthlyLogs = await this.queryBus.execute(
  new 평가활동내역목록을조회한다(
    'period-id',
    'employee-id',
    undefined, // 모든 유형
    new Date('2025-01-01'),
    new Date('2025-01-31'),
  ),
);
```

---

## 사용 방법

### 1. Module 설정

`CqrsModule`을 import하고 Handler들을 providers에 등록합니다.

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreDomainModule } from '@domain/core/core-domain.module';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import {
  CreateEvaluationActivityLogHandler,
  CreateStepApprovalActivityLogHandler,
  CreateRevisionCompletedActivityLogHandler,
  GetEvaluationActivityLogListHandler,
} from './handlers';

@Module({
  imports: [
    CqrsModule, // ⭐ 필수!
    CoreDomainModule,
    CommonDomainModule,
  ],
  providers: [
    // Command Handlers
    CreateEvaluationActivityLogHandler,
    CreateStepApprovalActivityLogHandler,
    CreateRevisionCompletedActivityLogHandler,
    
    // Query Handlers
    GetEvaluationActivityLogListHandler,
  ],
  exports: [],
})
export class EvaluationActivityLogContextModule {}
```

### 2. Service/Controller에서 사용

#### CommandBus 사용 (쓰기)

```typescript
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { 평가활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';

@Injectable()
export class SomeBusinessService {
  constructor(private readonly commandBus: CommandBus) {}

  async WBS를_할당한다(params: any) {
    // ... WBS 할당 로직 ...

    // 활동 내역 기록
    await this.commandBus.execute(
      new 평가활동내역을생성한다(
        params.periodId,
        params.employeeId,
        'wbs_assignment',
        'created',
        'WBS 할당',
        undefined,
        'wbs_assignment',
        assignment.id,
        params.assignedBy,
        undefined,
        { wbsItemId: params.wbsItemId },
      ),
    );
  }
}
```

#### QueryBus 사용 (읽기)

```typescript
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { 평가활동내역목록을조회한다 } from '@context/evaluation-activity-log-context/handlers';

@Injectable()
export class ActivityLogController {
  constructor(private readonly queryBus: QueryBus) {}

  async getActivityLogs(periodId: string, employeeId: string) {
    return await this.queryBus.execute(
      new 평가활동내역목록을조회한다(periodId, employeeId),
    );
  }
}
```

### 3. Module Import

다른 모듈에서 사용하려면 `CqrsModule`을 import해야 합니다.

```typescript
@Module({
  imports: [
    EvaluationActivityLogContextModule, // Context Module
    CqrsModule,                          // ⭐ CommandBus/QueryBus 사용을 위해 필수!
  ],
  providers: [SomeBusinessService],
})
export class SomeBusinessModule {}
```

---

## 테스트

### Command Handler 테스트

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateEvaluationActivityLogHandler,
  평가활동내역을생성한다,
} from './create-evaluation-activity-log.handler';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import { EmployeeService } from '@domain/common/employee/employee.service';

describe('CreateEvaluationActivityLogHandler', () => {
  let handler: CreateEvaluationActivityLogHandler;
  let activityLogService: jest.Mocked<EvaluationActivityLogService>;
  let employeeService: jest.Mocked<EmployeeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEvaluationActivityLogHandler,
        {
          provide: EvaluationActivityLogService,
          useValue: {
            생성한다: jest.fn(),
          },
        },
        {
          provide: EmployeeService,
          useValue: {
            ID로_조회한다: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(CreateEvaluationActivityLogHandler);
    activityLogService = module.get(EvaluationActivityLogService);
    employeeService = module.get(EmployeeService);
  });

  it('활동 내역을 생성한다', async () => {
    // Given
    const command = new 평가활동내역을생성한다(
      'period-1',
      'employee-1',
      'wbs_assignment',
      'created',
      'WBS 할당',
    );

    const mockResult = { id: 'log-1', activityTitle: 'WBS 할당' };
    activityLogService.생성한다.mockResolvedValue(mockResult as any);

    // When
    const result = await handler.execute(command);

    // Then
    expect(result).toEqual(mockResult);
    expect(activityLogService.생성한다).toHaveBeenCalled();
  });
});
```

### Query Handler 테스트

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetEvaluationActivityLogListHandler,
  평가활동내역목록을조회한다,
} from './get-evaluation-activity-log-list.handler';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';

describe('GetEvaluationActivityLogListHandler', () => {
  let handler: GetEvaluationActivityLogListHandler;
  let activityLogService: jest.Mocked<EvaluationActivityLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEvaluationActivityLogListHandler,
        {
          provide: EvaluationActivityLogService,
          useValue: {
            평가기간_피평가자_활동내역을_조회한다: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(GetEvaluationActivityLogListHandler);
    activityLogService = module.get(EvaluationActivityLogService);
  });

  it('활동 내역 목록을 조회한다', async () => {
    // Given
    const query = new 평가활동내역목록을조회한다('period-1', 'employee-1');
    
    const mockResult = {
      logs: [{ id: 'log-1' }, { id: 'log-2' }],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    
    activityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(mockResult);

    // When
    const result = await handler.execute(query);

    // Then
    expect(result).toEqual(mockResult);
    expect(result.logs).toHaveLength(2);
  });
});
```

---

## 활동 유형 (Activity Types)

| 활동 유형 | 설명 | 예시 |
|----------|------|------|
| `wbs_assignment` | WBS 할당 | WBS 항목 할당/취소 |
| `project_assignment` | 프로젝트 할당 | 프로젝트 배정 |
| `evaluation_criteria` | 평가기준 | 평가기준 작성/제출 |
| `wbs_self_evaluation` | WBS 자기평가 | WBS별 자기평가 제출 |
| `downward_evaluation` | 하향평가 | 1차/2차 하향평가 |
| `peer_evaluation` | 동료평가 | 동료평가 제출 |
| `step_approval` | 단계 승인 | 승인/재작성 요청 |
| `revision_request` | 재작성 요청 | 재작성 요청/완료 |
| `final_evaluation` | 최종평가 | 최종평가 등록 |
| `deliverable` | 산출물 | 산출물 등록/수정/삭제 |
| `evaluation_line` | 평가라인 | 평가자 구성 |

## 활동 액션 (Activity Actions)

| 액션 | 한글 | 설명 |
|------|------|------|
| `created` | 생성 | 새로운 데이터 생성 |
| `updated` | 수정 | 기존 데이터 수정 |
| `submitted` | 제출 | 평가 제출 |
| `completed` | 완료 | 작업 완료 |
| `cancelled` | 취소 | 작업 취소 |
| `deleted` | 삭제 | 데이터 삭제 |
| `assigned` | 할당 | 할당 |
| `unassigned` | 할당 해제 | 할당 해제 |
| `approved` | 승인 | 승인 |
| `rejected` | 거부 | 거부 |
| `revision_requested` | 재작성 요청 | 재작성 요청 |
| `revision_completed` | 재작성 완료 | 재작성 완료 |

---

## 참고 자료

- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)
- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Audit Log Context (참고 예시)](../audit-log-context/README.md)

---

## 기여

새로운 활동 유형이나 액션이 필요하면:

1. Handler 작성 (`handlers/commands/` 또는 `handlers/queries/`)
2. Handler를 Module에 등록
3. 단위 테스트 작성
4. 이 README 업데이트

---

**작성일**: 2025-11-21  
**마지막 수정**: 2025-11-21

