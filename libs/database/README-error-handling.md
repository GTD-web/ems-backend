# 트랜잭션 매니저 에러 처리 가이드

## 개요

`TransactionManagerService`는 포괄적인 데이터베이스 에러 처리와 자동 재시도 기능을 제공합니다.

## 주요 기능

### 1. 데이터베이스 에러 분류

PostgreSQL 에러 코드를 기반으로 에러를 분류하고 적절한 `DatabaseException`으로 변환합니다.

```typescript
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR', // 연결 에러
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION', // 제약 조건 위반
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION', // 외래키 위반
  UNIQUE_VIOLATION = 'UNIQUE_VIOLATION', // 유니크 제약 위반
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION', // NOT NULL 위반
  CHECK_VIOLATION = 'CHECK_VIOLATION', // CHECK 제약 위반
  DEADLOCK = 'DEADLOCK', // 데드락
  TIMEOUT = 'TIMEOUT', // 타임아웃
  SERIALIZATION_FAILURE = 'SERIALIZATION_FAILURE', // 직렬화 실패
  UNKNOWN_ERROR = 'UNKNOWN_ERROR', // 알 수 없는 에러
}
```

### 2. 자동 재시도 기능

재시도 가능한 에러에 대해 지수 백오프 알고리즘을 사용한 자동 재시도를 수행합니다.

**재시도 가능한 에러:**

- `DEADLOCK`: 데드락 발생
- `SERIALIZATION_FAILURE`: 직렬화 실패 (SERIALIZABLE 격리 수준)
- `CONNECTION_ERROR`: 연결 에러
- `TIMEOUT`: 타임아웃

### 3. 상세한 로깅

모든 데이터베이스 에러에 대해 상세한 정보를 로깅합니다:

- 에러 메시지 및 코드
- 실행된 쿼리 및 파라미터
- 제약 조건, 테이블, 컬럼 정보
- 스택 트레이스

## 사용 예제

### 기본 트랜잭션 실행

```typescript
try {
  const result = await transactionManager.트랜잭션을실행한다(
    async (manager) => {
      // 비즈니스 로직
      return await repository.saveWithManager(entity, manager);
    },
    3, // 최대 재시도 횟수 (선택적)
  );
} catch (error) {
  if (error instanceof DatabaseException) {
    switch (error.type) {
      case DatabaseErrorType.UNIQUE_VIOLATION:
        throw new ConflictException('이미 존재하는 데이터입니다.');
      case DatabaseErrorType.FOREIGN_KEY_VIOLATION:
        throw new BadRequestException('참조 무결성 위반입니다.');
      case DatabaseErrorType.CONNECTION_ERROR:
        throw new ServiceUnavailableException('데이터베이스 연결 실패');
      default:
        throw new InternalServerErrorException(
          '데이터베이스 오류가 발생했습니다.',
        );
    }
  }
  throw error;
}
```

### SERIALIZABLE 격리 수준 (자동 재시도 증가)

```typescript
// SERIALIZABLE 격리 수준은 기본적으로 5회 재시도
const result = await transactionManager.격리수준을지정하여실행한다(
  'SERIALIZABLE',
  async (manager) => {
    // 동시성 제어가 중요한 작업
    const account = await accountRepository.findByIdWithManager(id, manager);
    account.balance += amount;
    return await accountRepository.saveWithManager(account, manager);
  },
);
```

### 중첩 트랜잭션 (Savepoint)

```typescript
const result = await transactionManager.중첩트랜잭션을실행한다(
  async (manager) => {
    // 복잡한 비즈니스 로직
    await step1(manager);
    await step2(manager);
    return await step3(manager);
  },
  'complex_operation', // savepoint 이름
  3, // 최대 재시도 횟수
);
```

### Unit of Work 패턴

```typescript
const unitOfWork = transactionManager.유닛오브워크를생성한다();

try {
  await unitOfWork.시작한다();

  // 여러 엔티티 변경사항 등록
  unitOfWork.registerNew(newEntity);
  unitOfWork.registerDirty(modifiedEntity);
  unitOfWork.registerDeleted(entityToDelete);

  // 모든 변경사항을 한 번에 커밋
  await unitOfWork.commit();
} catch (error) {
  await unitOfWork.rollback();

  if (error instanceof DatabaseException) {
    // 에러 타입별 처리
    handleDatabaseError(error);
  }
  throw error;
}
```

## 에러 처리 모범 사례

### 1. 에러 타입별 적절한 HTTP 상태 코드 반환

```typescript
function handleDatabaseError(error: DatabaseException): never {
  switch (error.type) {
    case DatabaseErrorType.UNIQUE_VIOLATION:
      throw new ConflictException('중복된 데이터입니다.');

    case DatabaseErrorType.FOREIGN_KEY_VIOLATION:
      throw new BadRequestException('참조된 데이터가 존재하지 않습니다.');

    case DatabaseErrorType.NOT_NULL_VIOLATION:
      throw new BadRequestException('필수 필드가 누락되었습니다.');

    case DatabaseErrorType.CONNECTION_ERROR:
    case DatabaseErrorType.TIMEOUT:
      throw new ServiceUnavailableException(
        '서비스를 일시적으로 사용할 수 없습니다.',
      );

    case DatabaseErrorType.DEADLOCK:
    case DatabaseErrorType.SERIALIZATION_FAILURE:
      throw new ConflictException('동시 접근으로 인한 충돌이 발생했습니다.');

    default:
      throw new InternalServerErrorException('시스템 오류가 발생했습니다.');
  }
}
```

### 2. 재시도 횟수 조정

```typescript
// 읽기 작업: 적은 재시도
await transactionManager.읽기전용트랜잭션을실행한다(operation, 2);

// 일반 트랜잭션: 기본 재시도
await transactionManager.트랜잭션을실행한다(operation, 3);

// SERIALIZABLE: 많은 재시도 (직렬화 실패 가능성)
await transactionManager.격리수준을지정하여실행한다(
  'SERIALIZABLE',
  operation,
  5,
);
```

### 3. 로깅 및 모니터링

```typescript
try {
  await transactionManager.트랜잭션을실행한다(operation);
} catch (error) {
  if (error instanceof DatabaseException) {
    // 메트릭 수집
    metrics.increment(`database.error.${error.type.toLowerCase()}`);

    // 알림 발송 (심각한 에러의 경우)
    if (
      [DatabaseErrorType.CONNECTION_ERROR, DatabaseErrorType.TIMEOUT].includes(
        error.type,
      )
    ) {
      alertService.sendAlert('Database connectivity issue', error);
    }
  }
  throw error;
}
```

## 성능 고려사항

1. **재시도 간격**: 지수 백오프로 서버 부하 방지
2. **최대 재시도 횟수**: 격리 수준에 따른 적절한 설정
3. **타임아웃 설정**: 장시간 대기 방지
4. **연결 풀 관리**: QueryRunner 적절한 해제

## 주의사항

1. **재시도 안전성**: 멱등성이 보장되는 작업에만 재시도 적용
2. **에러 전파**: 비즈니스 로직 에러와 데이터베이스 에러 구분
3. **로깅 수준**: 민감한 정보 노출 방지
4. **모니터링**: 에러 패턴 분석을 통한 시스템 개선



