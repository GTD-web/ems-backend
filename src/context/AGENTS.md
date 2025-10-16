# AGENTS.md - AI 에이전트를 위한 개발 가이드

> 이 문서는 AI 에이전트가 이 프로젝트에서 코드를 작성할 때 따라야 할 베스트 프랙티스와 컨벤션을 정리한 문서입니다.

## 📋 목차

1. [TypeORM QueryBuilder 베스트 프랙티스](#typeorm-querybuilder-베스트-프랙티스)
2. [CQRS 패턴 가이드](#cqrs-패턴-가이드)
3. [DTO 작성 가이드](#dto-작성-가이드)
4. [API 데코레이터 작성 가이드](#api-데코레이터-작성-가이드)

---

## TypeORM QueryBuilder 베스트 프랙티스

### 1. Soft Delete 필터링

**모든 쿼리에서 삭제된(soft-deleted) 엔티티를 제외해야 합니다.**

#### ❌ 잘못된 예시

```typescript
const result = await this.repository
  .createQueryBuilder('entity')
  .where('entity.id = :id', { id })
  .getOne();
```

#### ✅ 올바른 예시

```typescript
const result = await this.repository
  .createQueryBuilder('entity')
  .where('entity.id = :id', { id })
  .andWhere('entity.deletedAt IS NULL')
  .getOne();
```

### 2. LEFT JOIN 시 Soft Delete 조건 추가

**조인하는 엔티티도 삭제된 데이터를 제외해야 합니다.**

#### ❌ 잘못된 예시

```typescript
.leftJoin(Employee, 'employee', 'employee.id = entity.employeeId')
```

#### ✅ 올바른 예시

```typescript
.leftJoin(
  Employee,
  'employee',
  'employee.id = entity.employeeId AND employee.deletedAt IS NULL',
)
```

### 3. SELECT 시 명시적 Alias 사용 (getRawMany/getRawOne)

**`getRawMany()` 또는 `getRawOne()`을 사용할 때는 모든 컬럼에 명시적 alias를 지정해야 합니다.**

#### ❌ 잘못된 예시

```typescript
const result = await this.repository
  .createQueryBuilder('assignment')
  .select([
    'assignment.id',
    'assignment.projectId',
    'project.name',
    'project.code',
  ])
  .leftJoin(Project, 'project', 'project.id = assignment.projectId')
  .getRawMany();

// 접근: result[0].id (충돌 가능성)
```

#### ✅ 올바른 예시

```typescript
const result = await this.repository
  .createQueryBuilder('assignment')
  .select([
    'assignment.id AS assignment_id',
    'assignment.projectId AS assignment_projectId',
    'project.name AS project_name',
    'project.code AS project_code',
  ])
  .leftJoin(
    Project,
    'project',
    'project.id = assignment.projectId AND project.deletedAt IS NULL',
  )
  .getRawMany();

// 접근: result[0].assignment_id, result[0].project_name
```

### 4. 복잡한 쿼리 예시

**프로젝트 할당 상세 조회 참고 예시:**

```typescript
private async getProjectsWithWbs(
  evaluationPeriodId: string,
  employeeId: string,
): Promise<AssignedProjectWithWbs[]> {
  // 1. 프로젝트 할당 조회
  const projectAssignments = await this.projectAssignmentRepository
    .createQueryBuilder('assignment')
    .select([
      'assignment.id AS assignment_id',
      'assignment.projectId AS assignment_projectId',
      'assignment.createdAt AS assignment_createdAt',
      'project.id AS project_id',
      'project.name AS project_name',
      'project.code AS project_code',
    ])
    .leftJoin(
      Project,
      'project',
      'project.id = assignment.projectId AND project.deletedAt IS NULL',
    )
    .where('assignment.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('assignment.employeeId = :employeeId', { employeeId })
    .andWhere('assignment.deletedAt IS NULL')
    .orderBy('assignment.createdAt', 'ASC')
    .getRawMany();

  // 2. 각 프로젝트의 WBS 조회
  const result: AssignedProjectWithWbs[] = [];
  for (const pa of projectAssignments) {
    const wbsList = await this.getWbsListByProject(
      evaluationPeriodId,
      employeeId,
      pa.project_id,
    );

    result.push({
      projectId: pa.project_id,
      projectName: pa.project_name,
      projectCode: pa.project_code,
      assignedAt: pa.assignment_createdAt,
      wbsList,
    });
  }

  return result;
}
```

### 5. QueryBuilder 체크리스트

쿼리를 작성할 때 다음 항목을 체크하세요:

- [ ] **메인 엔티티에 `deletedAt IS NULL` 조건 추가**
- [ ] **모든 `leftJoin`에 조인 엔티티의 `deletedAt IS NULL` 조건 추가**
- [ ] **`getRawMany/getRawOne` 사용 시 명시적 `AS alias` 지정**
- [ ] **Date 타입 필드는 적절히 변환 (ISO 8601)**
- [ ] **필요한 인덱스가 있는지 확인 (성능 최적화)**

---

## CQRS 패턴 가이드

### 1. Query Handler 작성

**읽기 전용 작업은 Query Handler로 작성합니다.**

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

export class GetEmployeeDataQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetEmployeeDataQuery)
export class GetEmployeeDataHandler
  implements IQueryHandler<GetEmployeeDataQuery, EmployeeDataResult>
{
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
  ) {}

  async execute(query: GetEmployeeDataQuery): Promise<EmployeeDataResult> {
    // 구현
  }
}
```

### 2. Command Handler 작성

**쓰기 작업(생성, 수정, 삭제)은 Command Handler로 작성합니다.**

```typescript
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';

export class CreateEvaluationCommand {
  constructor(
    public readonly employeeId: string,
    public readonly data: CreateEvaluationDto,
  ) {}
}

@Injectable()
@CommandHandler(CreateEvaluationCommand)
export class CreateEvaluationHandler
  implements ICommandHandler<CreateEvaluationCommand, string>
{
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
  ) {}

  async execute(command: CreateEvaluationCommand): Promise<string> {
    // 구현
  }
}
```

### 3. Handler Export 패턴

**handlers 디렉토리 구조:**

```
handlers/
├── queries/
│   ├── get-employee-data.query.ts
│   └── index.ts
├── commands/
│   ├── create-evaluation.command.ts
│   └── index.ts
├── query-handlers.ts
└── command-handlers.ts
```

**query-handlers.ts:**

```typescript
export const QueryHandlers = [
  GetEmployeeDataHandler,
  GetEmployeeListHandler,
  // ... 다른 Query Handlers
];
```

**command-handlers.ts:**

```typescript
export const CommandHandlers = [
  CreateEvaluationHandler,
  UpdateEvaluationHandler,
  DeleteEvaluationHandler,
  // ... 다른 Command Handlers
];
```

---

## DTO 작성 가이드

### 1. API 응답 DTO

**Swagger 문서화를 위해 모든 필드에 `@ApiProperty` 데코레이터를 사용합니다.**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '직원명',
    example: '홍길동',
  })
  name: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '010-1234-5678',
    nullable: true,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '직원 상태',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'LEAVE', 'RESIGNED'],
  })
  status: string;
}
```

### 2. 중첩 DTO 구조

**복잡한 객체는 계층적으로 구성합니다.**

```typescript
export class AssignedWbsInfoDto {
  @ApiProperty({ description: 'WBS ID' })
  wbsId: string;

  @ApiProperty({ description: 'WBS명' })
  wbsName: string;

  @ApiProperty({
    description: 'WBS에 할당된 평가기준 목록',
    type: [WbsEvaluationCriterionDto],
  })
  @Type(() => WbsEvaluationCriterionDto)
  criteria: WbsEvaluationCriterionDto[];
}

export class AssignedProjectWithWbsDto {
  @ApiProperty({ description: '프로젝트 ID' })
  projectId: string;

  @ApiProperty({
    description: '프로젝트에 할당된 WBS 목록',
    type: [AssignedWbsInfoDto],
  })
  @Type(() => AssignedWbsInfoDto)
  wbsList: AssignedWbsInfoDto[];
}
```

### 3. Query DTO (요청 파라미터)

**공통 데코레이터를 사용합니다.**

```typescript
import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ToBoolean, Type } from '@libs/decorators';

export class GetEvaluationListQueryDto {
  @ApiPropertyOptional({ description: '평가기간 ID' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: '완료 여부 포함' })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  includeCompleted?: boolean;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;
}
```

---

## API 데코레이터 작성 가이드

### 1. API 데코레이터 구조

**각 엔드포인트마다 재사용 가능한 데코레이터를 작성합니다.**

```typescript
import { applyDecorators, Get, Post, Put, Delete } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

export function GetEmployeeData() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/data'),
    ApiOperation({
      summary: '직원 데이터 조회',
      description: `**중요**: 특정 직원의 평가 관련 데이터를 조회합니다.

**조회 정보:**
- 직원 기본 정보
- 할당된 프로젝트 및 WBS
- 평가 진행 현황

**사용 시나리오:**
- 사용자 대시보드
- 관리자 모니터링

**테스트 케이스:**
- 정상 조회: 등록된 직원 데이터 조회 성공
- 미등록: 404 에러 반환
- 잘못된 UUID: 400 에러 반환`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOkResponse({
      description: '직원 데이터 조회 성공',
      type: EmployeeDataResponseDto,
    }),
    ApiNotFoundResponse({
      description: '직원을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청',
    }),
  );
}
```

### 2. Controller에서 사용

```typescript
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @GetEmployeeData()
  async getEmployeeData(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<EmployeeDataResponseDto> {
    return await this.dashboardService.직원_데이터를_조회한다(
      evaluationPeriodId,
      employeeId,
    );
  }
}
```

---

## 네이밍 컨벤션

### 1. Context 서비스 메서드

**한글로 작성하며 '~한다' 형태로 끝냅니다.**

```typescript
// ✅ 올바른 예시
async 직원_데이터를_조회한다(evaluationPeriodId: string, employeeId: string)
async 평가를_생성한다(data: CreateEvaluationDto)
async 평가를_수정한다(id: string, data: UpdateEvaluationDto)
async 평가를_삭제한다(id: string)

// ❌ 잘못된 예시
async getEmployeeData(evaluationPeriodId: string, employeeId: string)
async createEvaluation(data: CreateEvaluationDto)
```

### 2. Handler 클래스명

```typescript
// Query Handler: Get + 기능명 + Query
export class GetEmployeeDataQuery {}
export class GetEmployeeDataHandler {}

// Command Handler: 동사 + 기능명 + Command
export class CreateEvaluationCommand {}
export class CreateEvaluationHandler {}
export class UpdateEvaluationCommand {}
export class UpdateEvaluationHandler {}
```

### 3. DTO 클래스명

```typescript
// 응답 DTO: 기능명 + ResponseDto
export class EmployeeDataResponseDto {}
export class EvaluationListResponseDto {}

// 요청 DTO: 동사 + 기능명 + Dto
export class CreateEvaluationDto {}
export class UpdateEvaluationDto {}

// 쿼리 DTO: Get + 기능명 + QueryDto
export class GetEvaluationListQueryDto {}
```

---

## 에러 처리

### 1. 표준 Exception 사용

```typescript
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

// 데이터를 찾을 수 없을 때
if (!entity) {
  throw new NotFoundException(`엔티티를 찾을 수 없습니다. (id: ${id})`);
}

// 유효하지 않은 요청
if (!isValid) {
  throw new BadRequestException('유효하지 않은 요청입니다.');
}

// 중복 데이터
if (exists) {
  throw new ConflictException('이미 존재하는 데이터입니다.');
}
```

### 2. Domain Exception 사용

**도메인 특화 예외는 별도로 정의합니다.**

```typescript
// evaluation-period.exceptions.ts
export class EvaluationPeriodNotFoundException extends NotFoundException {
  constructor(evaluationPeriodId: string) {
    super(`평가기간을 찾을 수 없습니다. (id: ${evaluationPeriodId})`);
  }
}

export class InvalidEvaluationPeriodStatusException extends BadRequestException {
  constructor(currentStatus: string, requestedStatus: string) {
    super(
      `평가기간 상태를 변경할 수 없습니다. (현재: ${currentStatus}, 요청: ${requestedStatus})`,
    );
  }
}
```

---

## 테스트 작성 가이드

### 1. Handler 테스트

```typescript
describe('GetEmployeeDataHandler', () => {
  let handler: GetEmployeeDataHandler;
  let repository: Repository<Entity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEmployeeDataHandler,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetEmployeeDataHandler>(GetEmployeeDataHandler);
    repository = module.get<Repository<Entity>>(getRepositoryToken(Entity));
  });

  it('정상적으로 직원 데이터를 조회해야 함', async () => {
    // Given
    const query = new GetEmployeeDataQuery('period-id', 'employee-id');
    const mockResult = {
      /* ... */
    };

    // When
    const result = await handler.execute(query);

    // Then
    expect(result).toEqual(mockResult);
  });

  it('존재하지 않는 직원일 경우 NotFoundException을 던져야 함', async () => {
    // Given
    const query = new GetEmployeeDataQuery('period-id', 'invalid-id');

    // When & Then
    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
  });
});
```

---

## 성능 최적화

### 1. N+1 쿼리 문제 해결

**반복문 내에서 개별 쿼리를 실행하지 않습니다.**

#### ❌ 잘못된 예시 (N+1 문제)

```typescript
const projects = await this.projectRepository.find();
for (const project of projects) {
  const wbs = await this.wbsRepository.find({
    where: { projectId: project.id },
  });
  project.wbsList = wbs;
}
```

#### ✅ 올바른 예시 (배치 조회)

```typescript
const projects = await this.projectRepository.find();
const projectIds = projects.map((p) => p.id);

const wbsList = await this.wbsRepository
  .createQueryBuilder('wbs')
  .where('wbs.projectId IN (:...projectIds)', { projectIds })
  .andWhere('wbs.deletedAt IS NULL')
  .getMany();

// 그룹화
const wbsMap = new Map<string, WbsItem[]>();
wbsList.forEach((wbs) => {
  if (!wbsMap.has(wbs.projectId)) {
    wbsMap.set(wbs.projectId, []);
  }
  wbsMap.get(wbs.projectId)!.push(wbs);
});

// 할당
projects.forEach((project) => {
  project.wbsList = wbsMap.get(project.id) || [];
});
```

### 2. 인덱스 활용

**자주 조회하는 컬럼에는 인덱스를 생성합니다.**

```typescript
@Entity('evaluation_period')
@Index(['status'])
@Index(['currentPhase'])
@Index(['startDate', 'endDate'])
export class EvaluationPeriod extends BaseEntity {
  // ...
}
```

---

## 로깅

### 1. Logger 사용

```typescript
import { Logger } from '@nestjs/common';

export class SomeHandler {
  private readonly logger = new Logger(SomeHandler.name);

  async execute(query: SomeQuery): Promise<SomeResult> {
    this.logger.log('작업 시작', { queryData: query });

    try {
      const result = await this.doSomething();

      this.logger.log('작업 완료', { resultData: result });
      return result;
    } catch (error) {
      this.logger.error('작업 실패', error.stack, { queryData: query });
      throw error;
    }
  }
}
```

---

## 마무리

이 문서는 프로젝트의 코드 품질과 일관성을 유지하기 위한 가이드입니다.
새로운 베스트 프랙티스가 발견되면 이 문서를 업데이트하여 팀 전체가 공유할 수 있도록 합니다.

**참고 파일:**

- 쿼리 빌더 참고: `src/context/evaluation-criteria-management-context/handlers/project-assignment/queries/get-project-assignment-detail.handler.ts`
- 대시보드 참고: `src/context/dashboard-context/handlers/queries/get-employee-assigned-data.query.ts`
- DTO 참고: `src/interface/admin/dashboard/dto/employee-assigned-data.dto.ts`

---

**작성일**: 2024-10-16  
**최종 수정일**: 2024-10-16
