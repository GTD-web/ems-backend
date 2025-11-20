# Audit Log Context 리팩토링 - CommandBus 패턴 적용

> **작성자**: 우창욱  
> **작성일**: 2025-11-19  
> **리팩토링 대상**: `audit-log-context`

## 📋 목차

1. [리팩토링 배경](#리팩토링-배경)
2. [변경 사항 요약](#변경-사항-요약)
3. [변경 전/후 비교](#변경-전후-비교)
4. [사용 방법](#사용-방법)
5. [이점](#이점)
6. [참고 사항](#참고-사항)

---

## 리팩토링 배경

### 문제점

기존 `AuditLogContextService`가 복잡해지면서 다음과 같은 문제가 발생했습니다:

1. **Service가 너무 많은 역할을 담당**
   - 생성(Command) + 조회(Query) 로직이 혼재
   - Service Layer가 비대해짐

2. **재사용성 부족**
   - Audit 로그를 생성하려면 반드시 `AuditLogContextService`를 주입받아야 함
   - 다른 Context에서 사용하기 어려움

3. **CQRS 패턴 미준수**
   - Command Handler가 있지만 Service에서 직접 호출하지 않음
   - CommandBus의 이점을 활용하지 못함

### 해결 방안

**CommandBus를 직접 사용**하여 Command와 Query를 완전히 분리하고, 전역에서 Audit 로그를 생성할 수 있도록 개선합니다.

---

## 변경 사항 요약

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `audit-log-context.service.ts` | ❌ `audit로그를생성한다()` 메서드 제거<br>✅ Query(조회) 전용 Service로 변경 |
| `audit-log.interceptor.ts` | ❌ `AuditLogContextService` 의존성 제거<br>✅ `CommandBus` 직접 주입 및 사용 |

### 영향받는 파일

- ✅ `create-audit-log.handler.ts` - 변경 없음 (그대로 사용)
- ✅ Module 설정 - 변경 없음 (CommandBus는 CqrsModule에서 자동 제공)

---

## 변경 전/후 비교

### 📌 변경 전 (Before)

#### 아키텍처

```
┌─────────────────────┐
│   Interceptor       │
└──────────┬──────────┘
           │ Service 메서드 호출
           ▼
┌─────────────────────────────┐
│ AuditLogContextService      │
│ - audit로그를생성한다() ⚠️   │  ← Command + Query 혼재
│ - audit로그목록을_조회한다   │
│ - audit로그상세를_조회한다   │
└──────────┬──────────────────┘
           │ CommandBus.execute()
           ▼
┌──────────────────────────────┐
│  CreateAuditLogHandler       │
└──────────────────────────────┘
```

#### 코드 예시

**audit-log-context.service.ts**

```typescript
@Injectable()
export class AuditLogContextService {
  constructor(
    private readonly commandBus: CommandBus,  // ⚠️ 생성용
    private readonly queryBus: QueryBus,       // ✅ 조회용
  ) {}

  // ⚠️ Service에서 Command를 래핑
  async audit로그를생성한다(
    data: CreateAuditLogDto,
  ): Promise<CreateAuditLogResult> {
    const command = new audit로그를생성한다(data);
    return await this.commandBus.execute(command);
  }

  async audit로그목록을_조회한다(...) { /* ... */ }
  async audit로그상세를_조회한다(...) { /* ... */ }
}
```

**audit-log.interceptor.ts**

```typescript
@Injectable()
export class AuditLogInterceptor {
  constructor(
    private readonly auditLogContextService: AuditLogContextService,  // ⚠️
  ) {}

  async intercept(...) {
    // Service를 통한 간접 호출
    await this.auditLogContextService.audit로그를생성한다({
      requestMethod,
      requestUrl,
      // ...
    });
  }
}
```

### 📌 변경 후 (After)

#### 아키텍처

```
┌─────────────────────┐
│   Interceptor       │
└──────────┬──────────┘
           │ CommandBus.execute() ✅ 직접 호출
           ▼
┌──────────────────────────────┐
│  audit로그를생성한다 Command   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  CreateAuditLogHandler       │
└──────────────────────────────┘

┌─────────────────────────────┐
│ AuditLogContextService      │  ← Query 전용 ✅
│ - audit로그목록을_조회한다    │
│ - audit로그상세를_조회한다    │
└─────────────────────────────┘
```

#### 코드 예시

**audit-log-context.service.ts**

```typescript
@Injectable()
export class AuditLogContextService {
  constructor(
    private readonly queryBus: QueryBus,  // ✅ 조회 전용
  ) {}

  // ✅ audit로그를생성한다() 메서드 제거됨
  
  // Query만 담당
  async audit로그목록을_조회한다(...) { /* ... */ }
  async audit로그상세를_조회한다(...) { /* ... */ }
}
```

**audit-log.interceptor.ts**

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { audit로그를생성한다 } from '@context/audit-log-context/handlers/commands/create-audit-log.handler';

@Injectable()
export class AuditLogInterceptor {
  constructor(
    private readonly commandBus: CommandBus,  // ✅ CommandBus 직접 주입
  ) {}

  async intercept(...) {
    // Command 직접 생성 및 실행
    const command = new audit로그를생성한다({
      requestMethod,
      requestUrl,
      // ...
    });
    await this.commandBus.execute(command);  // ✅ 직접 호출
  }
}
```

---

## 사용 방법

### 1️⃣ Audit 로그 생성 (Command)

#### Interceptor나 다른 Service에서 사용

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { audit로그를생성한다 } from '@context/audit-log-context/handlers/commands/create-audit-log.handler';

@Injectable()
export class SomeService {
  constructor(private readonly commandBus: CommandBus) {}

  async someMethod() {
    // Command 생성
    const command = new audit로그를생성한다({
      requestMethod: 'POST',
      requestUrl: '/api/example',
      requestPath: '/api/example',
      requestHeaders: {},
      requestBody: {},
      requestQuery: {},
      requestIp: '127.0.0.1',
      responseStatusCode: 200,
      responseBody: {},
      userId: 'user-id',
      userEmail: 'user@example.com',
      userName: '홍길동',
      employeeNumber: 'EMP001',
      requestStartTime: new Date(),
      requestEndTime: new Date(),
      duration: 100,
      requestId: 'req-123',
    });

    // CommandBus로 실행
    const result = await this.commandBus.execute(command);
    
    console.log('Audit log created:', result.id);
  }
}
```

### 2️⃣ Audit 로그 조회 (Query)

#### Service 사용 (기존 방식 유지)

```typescript
import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';

@Injectable()
export class SomeController {
  constructor(
    private readonly auditLogContextService: AuditLogContextService,
  ) {}

  async getAuditLogs() {
    // Service를 통한 조회
    const result = await this.auditLogContextService.audit로그목록을_조회한다(
      { userId: 'user-id' },
      1,
      10,
    );
    
    return result;
  }

  async getAuditLogDetail(id: string) {
    const log = await this.auditLogContextService.audit로그상세를_조회한다(id);
    return log;
  }
}
```

### 3️⃣ 다른 Context에서 사용

```typescript
// evaluation-period-management-context의 어떤 Service에서
import { CommandBus } from '@nestjs/cqrs';
import { audit로그를생성한다 } from '@context/audit-log-context/handlers';

@Injectable()
export class EvaluationPeriodService {
  constructor(private readonly commandBus: CommandBus) {}

  async 평가기간을_생성한다(data: CreateEvaluationPeriodDto) {
    // 평가기간 생성 로직
    const period = await this.repository.save(data);

    // Audit 로그 생성 (전역에서 사용 가능!)
    const auditCommand = new audit로그를생성한다({
      requestMethod: 'POST',
      requestUrl: '/api/evaluation-periods',
      responseStatusCode: 201,
      // ...
    });
    await this.commandBus.execute(auditCommand);

    return period;
  }
}
```

---

## 이점

### ✅ 1. 명확한 책임 분리 (Single Responsibility Principle)

**Service의 역할이 명확해짐**

- `AuditLogContextService`: **Query(조회) 전용**
- `CommandBus` + `Handler`: **Command(생성/수정/삭제) 처리**

### ✅ 2. 전역 사용 가능 (Reusability)

**어떤 Context에서든 CommandBus로 Audit 로그 생성 가능**

```typescript
// 어디서든 사용 가능
const command = new audit로그를생성한다(data);
await this.commandBus.execute(command);
```

- Service 의존성 없이 독립적으로 사용
- 순환 의존성 문제 방지

### ✅ 3. CQRS 패턴 준수

**Command와 Query가 완전히 분리**

- **Command**: CommandBus → Handler
- **Query**: QueryBus → Handler (Service가 래핑)

```
Command 흐름: 사용처 → CommandBus → Handler
Query 흐름:   사용처 → Service → QueryBus → Handler
```

### ✅ 4. 테스트 용이성

**Handler 단위 테스트가 쉬워짐**

```typescript
describe('CreateAuditLogHandler', () => {
  it('audit 로그를 생성해야 함', async () => {
    // Given
    const command = new audit로그를생성한다(mockData);
    
    // When
    const result = await handler.execute(command);
    
    // Then
    expect(result.id).toBeDefined();
  });
});
```

### ✅ 5. 확장성

**새로운 Command 추가가 쉬움**

```typescript
// 새로운 Command 추가 예시
export class audit로그를삭제한다 {
  constructor(public readonly id: string) {}
}

@CommandHandler(audit로그를삭제한다)
export class DeleteAuditLogHandler implements ICommandHandler<audit로그를삭제한다> {
  async execute(command: audit로그를삭제한다): Promise<void> {
    // 삭제 로직
  }
}
```

---

## 참고 사항

### 📌 CommandBus는 어디서 제공되는가?

**CqrsModule에서 자동으로 제공됩니다.**

```typescript
// audit-log-context.module.ts
@Module({
  imports: [
    CqrsModule,  // ← CommandBus, QueryBus 자동 제공
    // ...
  ],
  providers: [
    CreateAuditLogHandler,  // ← Handler만 등록하면 됨
    // ...
  ],
})
export class AuditLogContextModule {}
```

### 📌 다른 Module에서 사용하려면?

**CqrsModule만 import하면 됩니다.**

```typescript
// 다른 Context의 Module
@Module({
  imports: [
    CqrsModule,  // ← 이것만 있으면 CommandBus 사용 가능
  ],
  // ...
})
export class SomeContextModule {}
```

### 📌 Handler는 어떻게 찾는가?

**NestJS CQRS가 자동으로 Command와 Handler를 매칭합니다.**

```typescript
@CommandHandler(audit로그를생성한다)  // ← 이 데코레이터로 자동 등록
export class CreateAuditLogHandler { /* ... */ }
```

CommandBus가 `audit로그를생성한다` Command를 받으면 자동으로 `CreateAuditLogHandler`를 실행합니다.

### 📌 기존 코드는 깨지지 않나요?

**네, 안전합니다!**

- `AuditLogContextService`의 조회 메서드는 그대로 유지
- 기존에 Service를 사용하던 코드는 정상 작동
- 생성 메서드(`audit로그를생성한다`)만 제거되었으므로, 이를 사용하던 코드만 수정 필요

---

## 적용 가이드

### 다른 Context에도 적용하려면?

1. **Service에서 Command 메서드 제거**
   - 생성/수정/삭제 메서드를 Service에서 제거
   - Query(조회) 메서드만 남김

2. **Handler 생성**
   - Command Handler 작성
   - `@CommandHandler` 데코레이터 적용

3. **사용처에서 CommandBus 주입**
   - Service 대신 `CommandBus` 주입
   - Command 객체 생성 후 `execute()` 호출

### 예시: evaluation-period-management-context

**Before:**

```typescript
// Service에 모든 로직이 있음
class EvaluationPeriodService {
  async 평가기간을_생성한다(data) { /* ... */ }
  async 평가기간을_수정한다(id, data) { /* ... */ }
  async 평가기간을_조회한다(id) { /* ... */ }
}
```

**After:**

```typescript
// Service는 Query만
class EvaluationPeriodService {
  constructor(private readonly queryBus: QueryBus) {}
  
  async 평가기간을_조회한다(id) { /* Query Handler 실행 */ }
  async 평가기간목록을_조회한다() { /* Query Handler 실행 */ }
}

// Command는 CommandBus로 직접 처리
class SomeController {
  constructor(private readonly commandBus: CommandBus) {}
  
  async create(data) {
    const command = new 평가기간을생성한다(data);
    return await this.commandBus.execute(command);
  }
}
```

---

## 체크리스트

리팩토링 적용 시 확인할 사항:

- [ ] Service에서 Command 관련 메서드 제거
- [ ] Service는 QueryBus만 의존
- [ ] Command Handler 작성 및 Module에 등록
- [ ] 사용처에서 CommandBus 주입
- [ ] 기존 Query 메서드는 정상 작동하는지 확인
- [ ] 테스트 코드 업데이트

---

## 결론

이번 리팩토링으로 **CQRS 패턴을 올바르게 적용**하고, **Service의 책임을 명확히 분리**했습니다.

- ✅ **Command**: CommandBus를 통해 전역에서 호출 가능
- ✅ **Query**: Service를 통해 조회 (기존 방식 유지)
- ✅ **확장성**: 새로운 Command 추가가 쉬움
- ✅ **테스트**: Handler 단위 테스트 용이

이 패턴을 다른 Context에도 점진적으로 적용하면, 더 깔끔하고 유지보수하기 쉬운 코드베이스를 만들 수 있습니다.

---

**참고 문서:**
- [AGENTS.md - CQRS 패턴 가이드](./AGENTS.md#cqrs-패턴-가이드)
- [NestJS CQRS 공식 문서](https://docs.nestjs.com/recipes/cqrs)


