import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import {
  RevisionRequestStepType,
  RecipientType,
} from '@domain/sub/evaluation-revision-request/evaluation-revision-request.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';

/**
 * RevisionRequestContextService 테스트 공통 설정 및 헬퍼 함수
 */
export interface RevisionRequestContextTestContext {
  service: RevisionRequestContextService;
  dataSource: DataSource;
  module: TestingModule;
  evaluationPeriodRepository: Repository<EvaluationPeriod>;
  employeeRepository: Repository<Employee>;
  departmentRepository: Repository<Department>;
  mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  recipientRepository: Repository<EvaluationRevisionRequestRecipient>;
  evaluationPeriodId: string;
  employeeId: string;
  evaluatorId: string;
  departmentId: string;
  adminId: string;
  revisionRequestId: string;
  mappingId: string;
}

const systemAdminId = '00000000-0000-0000-0000-000000000001';

/**
 * 테스트 모듈 초기화
 */
export async function setupTestModule(): Promise<RevisionRequestContextTestContext> {
  const module = await Test.createTestingModule({
    imports: [
      DatabaseModule,
      TypeOrmModule.forFeature([
        EvaluationPeriod,
        Employee,
        Department,
        EvaluationPeriodEmployeeMapping,
        EmployeeEvaluationStepApproval,
        EvaluationRevisionRequest,
        EvaluationRevisionRequestRecipient,
      ]),
      EvaluationRevisionRequestModule,
      EmployeeEvaluationStepApprovalModule,
    ],
    providers: [RevisionRequestContextService],
  }).compile();

  const service = module.get<RevisionRequestContextService>(
    RevisionRequestContextService,
  );
  const dataSource = module.get<DataSource>(DataSource);

  // Repository 초기화
  const evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
  const employeeRepository = dataSource.getRepository(Employee);
  const departmentRepository = dataSource.getRepository(Department);
  const mappingRepository = dataSource.getRepository(
    EvaluationPeriodEmployeeMapping,
  );
  const stepApprovalRepository = dataSource.getRepository(
    EmployeeEvaluationStepApproval,
  );
  const revisionRequestRepository = dataSource.getRepository(
    EvaluationRevisionRequest,
  );
  const recipientRepository = dataSource.getRepository(
    EvaluationRevisionRequestRecipient,
  );

  // 데이터베이스 스키마 동기화
  await dataSource.synchronize(true);

  return {
    service,
    dataSource,
    module,
    evaluationPeriodRepository,
    employeeRepository,
    departmentRepository,
    mappingRepository,
    stepApprovalRepository,
    revisionRequestRepository,
    recipientRepository,
    evaluationPeriodId: '',
    employeeId: '',
    evaluatorId: '',
    departmentId: '',
    adminId: systemAdminId,
    revisionRequestId: '',
    mappingId: '',
  };
}

/**
 * 테스트 모듈 정리
 */
export async function teardownTestModule(
  context: RevisionRequestContextTestContext,
): Promise<void> {
  await context.dataSource.destroy();
  await context.module.close();
}

/**
 * 각 테스트 전에 데이터 정리
 */
export async function cleanupBeforeEach(
  context: RevisionRequestContextTestContext,
): Promise<void> {
  try {
    // 1. 수신자 삭제 (가장 하위) - soft delete 포함
    await context.dataSource.query(
      'DELETE FROM evaluation_revision_request_recipient WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
    );

    // 2. 재작성 요청 삭제 - soft delete 포함
    await context.dataSource.query(
      'DELETE FROM evaluation_revision_request WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
    );

    // 2-1. 단계 승인 삭제
    await context.stepApprovalRepository.delete({});

    // 2-2. 평가기간-직원 맵핑 삭제
    await context.mappingRepository.delete({});

    // 3. 평가기간 삭제
    await context.evaluationPeriodRepository.delete({});

    // 4. 직원 삭제
    await context.employeeRepository.delete({});

    // 5. 부서 삭제 (가장 상위)
    await context.departmentRepository.delete({});
  } catch (error) {
    // 초기 테스트에서는 무시
  }
}

/**
 * 테스트 데이터 생성 헬퍼 함수
 */
export async function 테스트데이터를_생성한다(
  context: RevisionRequestContextTestContext,
): Promise<void> {
  // 1. 부서 생성 (unique externalId를 위해 timestamp + random 추가)
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const department = context.departmentRepository.create({
    name: '개발팀',
    code: `DEV001-${uniqueSuffix}`,
    externalId: `DEPT001-${uniqueSuffix}`,
    externalCreatedAt: new Date(),
    externalUpdatedAt: new Date(),
    createdBy: systemAdminId,
  });
  const savedDepartment = await context.departmentRepository.save(department);
  context.departmentId = savedDepartment.id;

  // 2. 평가기간 생성 (unique name을 위해 timestamp 추가)
  const evaluationPeriod = context.evaluationPeriodRepository.create({
    name: `2024년 상반기 평가-${uniqueSuffix}`,
    description: '테스트용 평가기간',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    status: EvaluationPeriodStatus.IN_PROGRESS,
    currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
    criteriaSettingEnabled: true,
    selfEvaluationSettingEnabled: true,
    finalEvaluationSettingEnabled: true,
    maxSelfEvaluationRate: 120,
    createdBy: systemAdminId,
  });
  const savedPeriod =
    await context.evaluationPeriodRepository.save(evaluationPeriod);
  context.evaluationPeriodId = savedPeriod.id;

  // 3. 피평가자 직원 생성 (unique 값 사용)
  const employee = context.employeeRepository.create({
    name: '김피평가',
    employeeNumber: `EMP001-${uniqueSuffix}`,
    email: `employee-${uniqueSuffix}@test.com`,
    externalId: `EXT001-${uniqueSuffix}`,
    departmentId: context.departmentId,
    status: '재직중',
    createdBy: systemAdminId,
  });
  const savedEmployee = await context.employeeRepository.save(employee);
  context.employeeId = savedEmployee.id;

  // 4. 평가자 직원 생성 (unique 값 사용)
  const evaluator = context.employeeRepository.create({
    name: '이평가자',
    employeeNumber: `EMP002-${uniqueSuffix}`,
    email: `evaluator-${uniqueSuffix}@test.com`,
    externalId: `EXT002-${uniqueSuffix}`,
    departmentId: context.departmentId,
    status: '재직중',
    createdBy: systemAdminId,
  });
  const savedEvaluator = await context.employeeRepository.save(evaluator);
  context.evaluatorId = savedEvaluator.id;

  // 4-1. 평가기간-직원 맵핑 생성
  const mapping = context.mappingRepository.create({
    evaluationPeriodId: context.evaluationPeriodId,
    employeeId: context.employeeId,
    createdBy: systemAdminId,
  });
  const savedMapping = await context.mappingRepository.save(mapping);
  context.mappingId = savedMapping.id;

  // 4-2. 단계 승인 생성 (revision_requested 상태)
  const stepApproval = context.stepApprovalRepository.create({
    evaluationPeriodEmployeeMappingId: context.mappingId,
    criteriaSettingStatus: StepApprovalStatus.REVISION_REQUESTED,
    selfEvaluationStatus: StepApprovalStatus.PENDING,
    primaryEvaluationStatus: StepApprovalStatus.PENDING,
    secondaryEvaluationStatus: StepApprovalStatus.PENDING,
    createdBy: systemAdminId,
  });
  await context.stepApprovalRepository.save(stepApproval);

  // 5. 재작성 요청 생성
  const revisionRequest = context.revisionRequestRepository.create({
    evaluationPeriodId: context.evaluationPeriodId,
    employeeId: context.employeeId,
    step: 'criteria' as RevisionRequestStepType,
    comment: '평가기준을 다시 작성해주세요.',
    requestedBy: context.adminId,
    requestedAt: new Date(),
    createdBy: context.adminId,
  });
  const savedRequest =
    await context.revisionRequestRepository.save(revisionRequest);
  context.revisionRequestId = savedRequest.id;

  // 6. 수신자 생성
  const recipient = context.recipientRepository.create({
    revisionRequestId: context.revisionRequestId,
    recipientId: context.evaluatorId,
    recipientType: RecipientType.PRIMARY_EVALUATOR,
    isRead: false,
    isCompleted: false,
    createdBy: context.adminId,
  });
  await context.recipientRepository.save(recipient);
}
