# 크론 작업 구성 가이드

## 개요

이 문서는 EMS 백엔드 시스템에서 사용되는 크론 작업의 구성과 위치를 분석하고, Vercel 환경에서의 크론 작업 실행을 위한 엔드포인트 구성 방안을 제시합니다.

## 현재 크론 작업 구성 현황

### 1. 크론 작업 목록

현재 시스템에는 총 **3개의 크론 작업**이 구성되어 있습니다:

#### 1.1 평가기간 자동 단계 변경 (`EvaluationPeriodAutoPhaseService`)

- **위치**: `src/domain/core/evaluation-period/evaluation-period-auto-phase.service.ts`
- **실행 주기**: 매 시간 (`@Cron(CronExpression.EVERY_HOUR)`)
- **기능**: 
  - 진행 중인 평가기간의 단계별 마감일을 확인하여 자동으로 다음 단계로 전이
  - 단계 전이 순서: WAITING → EVALUATION_SETUP → PERFORMANCE → SELF_EVALUATION → PEER_EVALUATION → CLOSURE
- **메서드**: `autoPhaseTransition()`

```27:57:src/domain/core/evaluation-period/evaluation-period-auto-phase.service.ts
  @Cron(CronExpression.EVERY_HOUR)
  async autoPhaseTransition(): Promise<number> {
    this.logger.log('평가기간 자동 단계 변경을 시작합니다...');
    
    try {
      const now = new Date();
      
      // 현재 진행 중인 평가기간들을 조회
      const activePeriods = await this.evaluationPeriodRepository.find({
        where: {
          status: EvaluationPeriodStatus.IN_PROGRESS,
        },
      });

      this.logger.log(`진행 중인 평가기간 수: ${activePeriods.length}개`);

      let transitionedCount = 0;
      for (const period of activePeriods) {
        const wasTransitioned = await this.checkAndTransitionPhase(period, now);
        if (wasTransitioned) {
          transitionedCount++;
        }
      }

      this.logger.log(`평가기간 자동 단계 변경이 완료되었습니다. 전이된 평가기간 수: ${transitionedCount}개`);
      return transitionedCount;
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 중 오류 발생:', error);
      return 0;
    }
  }
```

#### 1.2 직원 동기화 (`EmployeeSyncService`)

- **위치**: `src/context/organization-management-context/employee-sync.service.ts`
- **실행 주기**: 10분마다 (`@Cron(CronExpression.EVERY_10_MINUTES)`)
- **기능**: 
  - SSO 서비스와 직원 데이터를 동기화
  - 히트미스 전략을 사용하여 캐시처럼 동작
- **메서드**: `scheduledSync()`

```405:409:src/context/organization-management-context/employee-sync.service.ts
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSync(): Promise<void> {
    this.logger.log('스케줄된 직원 동기화를 시작합니다...');
    await this.syncEmployees();
  }
```

#### 1.3 부서 동기화 (`DepartmentSyncService`)

- **위치**: `src/context/organization-management-context/department-sync.service.ts`
- **실행 주기**: 10분마다 (`@Cron(CronExpression.EVERY_10_MINUTES)`)
- **기능**: 
  - SSO 서비스와 부서 데이터를 동기화
  - 히트미스 전략을 사용하여 캐시처럼 동작
- **메서드**: `scheduledSync()`

```395:399:src/context/organization-management-context/department-sync.service.ts
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSync(): Promise<void> {
    this.logger.log('스케줄된 부서 동기화를 시작합니다...');
    await this.syncDepartments();
  }
```

### 2. ScheduleModule 설정

현재 `ScheduleModule`은 **`OrganizationManagementContextModule`**에서 설정되어 있습니다:

```28:28:src/context/organization-management-context/organization-management-context.module.ts
    ScheduleModule.forRoot(),
```

**설명**: 
- `ScheduleModule.forRoot()`는 전역 모듈이므로 한 곳에서만 설정하면 됩니다.
- `EvaluationPeriodAutoPhaseService`는 `EvaluationPeriodModule`에 속해 있으며, 이 모듈에는 `ScheduleModule`이 import되지 않았지만, `OrganizationManagementContextModule`에서 설정된 전역 `ScheduleModule`에 의해 크론 작업이 작동합니다.

**권장사항**: 
- 명확성을 위해 `AppModule`에서 전역으로 한 번만 설정하는 것을 고려할 수 있습니다.
- 또는 각 컨텍스트 모듈에서 필요한 경우에만 설정하는 방식도 가능합니다 (현재 방식).

### 3. 모듈 구조

#### 3.1 평가기간 자동 단계 변경 서비스 모듈 구조

```
AppModule
  └── CoreDomainModule
      └── EvaluationPeriodModule
          └── EvaluationPeriodAutoPhaseService (크론 작업)
```

#### 3.2 조직 관리 동기화 서비스 모듈 구조

```
AppModule
  └── InterfaceModule
      └── OrganizationManagementContextModule
          ├── ScheduleModule.forRoot() (크론 스케줄러 설정)
          ├── EmployeeSyncService (크론 작업)
          └── DepartmentSyncService (크론 작업)
```


## Vercel 환경에서의 크론 작업 문제점

### 문제점

Vercel은 **서버리스(Serverless) 환경**이므로 다음과 같은 제약이 있습니다:

1. **지속적인 프로세스 부재**: Vercel은 요청이 있을 때만 함수를 실행하며, 백그라운드에서 지속적으로 실행되는 프로세스가 없습니다.
2. **@Cron 데코레이터 미작동**: `@nestjs/schedule`의 `@Cron` 데코레이터는 애플리케이션이 지속적으로 실행되는 환경에서만 작동합니다.
3. **Vercel Cron Jobs 필요**: Vercel에서는 별도의 HTTP 엔드포인트를 통해 크론 작업을 트리거해야 합니다.

### 해결 방안

Vercel 환경에서 크론 작업을 실행하기 위해서는:

1. **크론 작업을 실행하는 HTTP 엔드포인트 생성**
2. **Vercel Cron Jobs 설정** (`vercel.json` 또는 Vercel 대시보드에서 설정)
3. **환경 변수를 통한 크론 작업 활성화/비활성화 제어**

## Vercel 크론 작업 엔드포인트 구현 방안

### 1. 크론 작업 컨트롤러 생성

각 크론 작업에 대한 HTTP 엔드포인트를 제공하는 컨트롤러가 구현되어 있습니다.

**구현 위치**:
```
src/interface/public/cron.controller.ts
```

**구현 내용**:

```typescript
import { Controller, Get, HttpCode, HttpStatus, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '@interface/common/decorators/public.decorator';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';

@ApiTags('Public - 크론 작업')
@Controller('cron')
@Public()
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
    private readonly employeeSyncService: EmployeeSyncService,
    private readonly departmentSyncService: DepartmentSyncService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Vercel Cron Secret 검증
   */
  private validateCronSecret(authHeader: string | undefined): void {
    const cronSecret = this.configService.get<string>('CRON_SECRET');
    
    if (!cronSecret) {
      this.logger.warn('CRON_SECRET이 설정되지 않았습니다. 보안을 위해 설정을 권장합니다.');
      return; // CRON_SECRET이 없으면 검증을 건너뜀 (개발 환경)
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    
    if (authHeader !== expectedAuth) {
      this.logger.warn(`잘못된 크론 시크릿: ${authHeader}`);
      throw new UnauthorizedException('Invalid cron secret');
    }
  }

  /**
   * 평가기간 자동 단계 변경 크론 작업
   * Vercel Cron: 매 시간 실행
   */
  @Get('evaluation-period-auto-phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '평가기간 자동 단계 변경 크론 작업',
    description: '매 시간마다 실행되어 평가기간의 단계를 자동으로 전이합니다.',
  })
  async triggerEvaluationPeriodAutoPhase(
    @Headers('authorization') authHeader: string | undefined,
  ) {
    this.validateCronSecret(authHeader);

    const isVercel = !!this.configService.get('VERCEL');
    
    if (!isVercel) {
      this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
      return { message: 'Vercel 환경이 아닙니다.' };
    }

    try {
      const count = await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();
      return {
        success: true,
        message: `평가기간 자동 단계 변경 완료: ${count}개 평가기간 전이됨`,
        transitionedCount: count,
      };
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 직원 동기화 크론 작업
   * Vercel Cron: 10분마다 실행
   */
  @Get('employee-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '직원 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 직원 데이터를 동기화합니다.',
  })
  async triggerEmployeeSync(
    @Headers('authorization') authHeader: string | undefined,
  ) {
    this.validateCronSecret(authHeader);

    const isVercel = !!this.configService.get('VERCEL');
    
    if (!isVercel) {
      this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
      return { message: 'Vercel 환경이 아닙니다.' };
    }

    try {
      await this.employeeSyncService.scheduledSync();
      return {
        success: true,
        message: '직원 동기화 완료',
      };
    } catch (error) {
      this.logger.error('직원 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 부서 동기화 크론 작업
   * Vercel Cron: 10분마다 실행
   */
  @Get('department-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '부서 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 부서 데이터를 동기화합니다.',
  })
  async triggerDepartmentSync(
    @Headers('authorization') authHeader: string | undefined,
  ) {
    this.validateCronSecret(authHeader);

    const isVercel = !!this.configService.get('VERCEL');
    
    if (!isVercel) {
      this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
      return { message: 'Vercel 환경이 아닙니다.' };
    }

    try {
      await this.departmentSyncService.scheduledSync();
      return {
        success: true,
        message: '부서 동기화 완료',
      };
    } catch (error) {
      this.logger.error('부서 동기화 실패:', error);
      throw error;
    }
  }

}
```

### 2. 보안 고려사항

Vercel 크론 작업 엔드포인트는 보안을 위해 다음 중 하나를 구현해야 합니다:

#### 옵션 1: Vercel Cron Secret 사용 (구현됨)

현재 구현된 `CronController`는 모든 엔드포인트에서 `validateCronSecret()` 메서드를 통해 Vercel Cron Secret을 검증합니다.

```typescript
private validateCronSecret(authHeader: string | undefined): void {
  const cronSecret = this.configService.get<string>('CRON_SECRET');
  
  if (!cronSecret) {
    this.logger.warn('CRON_SECRET이 설정되지 않았습니다. 보안을 위해 설정을 권장합니다.');
    return; // CRON_SECRET이 없으면 검증을 건너뜀 (개발 환경)
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  
  if (authHeader !== expectedAuth) {
    this.logger.warn(`잘못된 크론 시크릿: ${authHeader}`);
    throw new UnauthorizedException('Invalid cron secret');
  }
}
```

**환경 변수 설정**:
- `CRON_SECRET`: Vercel 크론 작업 요청 시 사용할 시크릿 키
- Vercel 대시보드에서 크론 작업 설정 시 `Authorization: Bearer {CRON_SECRET}` 헤더를 추가해야 합니다.

#### 옵션 2: Vercel의 자동 주입 헤더 확인

Vercel은 크론 작업 요청에 특정 헤더를 자동으로 주입합니다. 이를 확인하여 보안을 강화할 수 있습니다.

### 3. Vercel Cron Jobs 설정

`vercel.json` 파일에 크론 작업을 설정합니다:

```json
{
  "crons": [
    {
      "path": "/cron/evaluation-period-auto-phase",
      "schedule": "0 * * * *"
    },
    {
      "path": "/cron/employee-sync",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/cron/department-sync",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

또는 Vercel 대시보드에서 직접 설정할 수 있습니다.

### 4. 환경별 크론 작업 활성화 제어

로컬 환경에서는 `@Cron` 데코레이터를 사용하고, Vercel 환경에서는 HTTP 엔드포인트를 사용하도록 조건부로 설정할 수 있습니다:

```typescript
// evaluation-period-auto-phase.service.ts
@Injectable()
export class EvaluationPeriodAutoPhaseService {
  constructor(
    // ...
    private readonly configService: ConfigService,
  ) {
    const isVercel = !!this.configService.get('VERCEL');
    
    // Vercel 환경이 아닐 때만 크론 데코레이터 활성화
    if (!isVercel) {
      // @Cron 데코레이터는 클래스 로드 시점에 적용되므로,
      // 조건부로 적용하려면 데코레이터 팩토리 패턴을 사용하거나
      // 별도의 서비스로 분리해야 합니다.
    }
  }
}
```

**더 나은 방법**: 크론 데코레이터는 그대로 두고, Vercel 환경에서는 해당 메서드를 호출하지 않도록 설정합니다. `ScheduleModule`의 설정에서 환경 변수를 확인하여 크론 작업을 비활성화할 수 있습니다.

## 크론 작업 실행 흐름도

### 로컬/일반 서버 환경

```
애플리케이션 시작
  ↓
ScheduleModule.forRoot() 초기화
  ↓
@Cron 데코레이터가 적용된 메서드 등록
  ↓
스케줄러가 주기적으로 메서드 실행
  ├─ 매 시간: autoPhaseTransition()
  ├─ 10분마다: employeeSyncService.scheduledSync()
  └─ 10분마다: departmentSyncService.scheduledSync()
```

### Vercel 환경

```
Vercel Cron Jobs 설정
  ↓
스케줄에 따라 HTTP 요청 전송
  ├─ 매 시간: GET /cron/evaluation-period-auto-phase
  ├─ 10분마다: GET /cron/employee-sync
  └─ 10분마다: GET /cron/department-sync
  ↓
CronController에서 요청 수신
  ↓
해당 서비스 메서드 호출
  ├─ evaluationPeriodAutoPhaseService.autoPhaseTransition()
  ├─ employeeSyncService.scheduledSync()
  └─ departmentSyncService.scheduledSync()
```

## 요약

### 현재 구성

1. **크론 작업 3개**:
   - 평가기간 자동 단계 변경 (매 시간) - 도메인 레이어
   - 직원 동기화 (10분마다) - 컨텍스트 레이어
   - 부서 동기화 (10분마다) - 컨텍스트 레이어

2. **ScheduleModule 설정**:
   - `OrganizationManagementContextModule`에서 `ScheduleModule.forRoot()` 설정
   - 전역 모듈이므로 모든 크론 작업에 적용됨

3. **Vercel 환경 대응**:
   - ✅ HTTP 엔드포인트 구현 완료: `src/interface/public/cron.controller.ts`
   - ✅ Public 인터페이스 모듈 구현 완료: `src/interface/public/public-interface.module.ts`
   - ✅ 보안 구현 완료: Vercel Cron Secret 검증 포함

### 구현 완료 사항

1. ✅ **크론 작업 컨트롤러 구현**: `src/interface/public/cron.controller.ts`
2. ✅ **보안 구현**: Vercel Cron Secret 검증 구현 완료
3. ✅ **Public 인터페이스 모듈**: `src/interface/public/public-interface.module.ts`
4. ✅ **모듈 등록**: `InterfaceModule`에 `PublicInterfaceModule` 추가

### 추가 권장 사항

1. **Vercel Cron Jobs 설정**: `vercel.json` 또는 대시보드에서 설정
2. **환경 변수 설정**: `CRON_SECRET` 환경 변수 설정 (프로덕션 환경 필수)
3. **환경별 분기**: 로컬에서는 `@Cron` 데코레이터 사용, Vercel에서는 HTTP 엔드포인트 사용

## 참고 자료

- [NestJS Schedule Module 공식 문서](https://docs.nestjs.com/techniques/task-scheduling)
- [Vercel Cron Jobs 문서](https://vercel.com/docs/cron-jobs)
- [평가기간 단계 전이 문서](./event-storming/evaluation-period-phase-transition.md)

