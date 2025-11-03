import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';

/**
 * Dashboard Context - StepApproval 통합 테스트
 *
 * dashboard-context에서 stepApproval 정보가 제대로 반환되는지 검증합니다.
 * 모든 필드가 누락 없이 올바르게 매핑되는지 확인합니다.
 */
describe('GetEmployeeEvaluationPeriodStatusHandler - StepApproval Integration', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let mappingId: string;
  let adminId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        EmployeeEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EmployeeEvaluationStepApproval,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          WbsEvaluationCriteria,
          EvaluationLine,
          EvaluationLineMapping,
          WbsSelfEvaluation,
          DownwardEvaluation,
          PeerEvaluation,
          FinalEvaluation,
        ]),
      ],
      providers: [GetEmployeeEvaluationPeriodStatusHandler],
    }).compile();

    handler = module.get<GetEmployeeEvaluationPeriodStatusHandler>(
      GetEmployeeEvaluationPeriodStatusHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    stepApprovalRepository = dataSource.getRepository(
      EmployeeEvaluationStepApproval,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    adminId = systemAdminId;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const stepApprovals = await stepApprovalRepository.find();
      await stepApprovalRepository.remove(stepApprovals);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 기본 테스트 데이터 생성
   */
  async function 기본_테스트데이터를_생성한다(): Promise<void> {
    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '개발팀',
      code: 'DEV001',
      externalId: 'DEPT001',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
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
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 직원 생성
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: 'EMP001',
      email: 'employee@test.com',
      externalId: 'EXT001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isSelfEvaluationEditable: true,
      isPrimaryEvaluationEditable: true,
      isSecondaryEvaluationEditable: true,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;
  }

  describe('stepApproval 정보가 없는 경우 (기본값 반환)', () => {
    it('모든 필드가 기본값으로 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // stepApproval 데이터는 생성하지 않음

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 평가기준 설정
      expect(result!.stepApproval.criteriaSettingStatus).toBe('pending');
      expect(result!.stepApproval.criteriaSettingApprovedBy).toBeNull();
      expect(result!.stepApproval.criteriaSettingApprovedAt).toBeNull();

      // 자기평가
      expect(result!.stepApproval.selfEvaluationStatus).toBe('pending');
      expect(result!.stepApproval.selfEvaluationApprovedBy).toBeNull();
      expect(result!.stepApproval.selfEvaluationApprovedAt).toBeNull();

      // 1차 하향평가
      expect(result!.stepApproval.primaryEvaluationStatus).toBe('pending');
      expect(result!.stepApproval.primaryEvaluationApprovedBy).toBeNull();
      expect(result!.stepApproval.primaryEvaluationApprovedAt).toBeNull();

      // 2차 하향평가
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('pending');
      expect(result!.stepApproval.secondaryEvaluationApprovedBy).toBeNull();
      expect(result!.stepApproval.secondaryEvaluationApprovedAt).toBeNull();
    });
  });

  describe('stepApproval 정보가 있는 경우 (모든 필드 매핑 검증)', () => {
    it('모든 상태가 approved인 경우 모든 필드가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.APPROVED,
        criteriaSettingApprovedBy: adminId,
        criteriaSettingApprovedAt: now,
        selfEvaluationStatus: StepApprovalStatus.APPROVED,
        selfEvaluationApprovedBy: adminId,
        selfEvaluationApprovedAt: now,
        primaryEvaluationStatus: StepApprovalStatus.APPROVED,
        primaryEvaluationApprovedBy: adminId,
        primaryEvaluationApprovedAt: now,
        secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
        secondaryEvaluationApprovedBy: adminId,
        secondaryEvaluationApprovedAt: now,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 평가기준 설정 - 모든 필드 검증
      expect(result!.stepApproval.criteriaSettingStatus).toBe('approved');
      expect(result!.stepApproval.criteriaSettingApprovedBy).toBe(adminId);
      expect(result!.stepApproval.criteriaSettingApprovedAt).toBeDefined();
      expect(result!.stepApproval.criteriaSettingApprovedAt).toBeInstanceOf(
        Date,
      );

      // 자기평가 - 모든 필드 검증
      expect(result!.stepApproval.selfEvaluationStatus).toBe('approved');
      expect(result!.stepApproval.selfEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.selfEvaluationApprovedAt).toBeDefined();
      expect(result!.stepApproval.selfEvaluationApprovedAt).toBeInstanceOf(
        Date,
      );

      // 1차 하향평가 - 모든 필드 검증
      expect(result!.stepApproval.primaryEvaluationStatus).toBe('approved');
      expect(result!.stepApproval.primaryEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.primaryEvaluationApprovedAt).toBeDefined();
      expect(result!.stepApproval.primaryEvaluationApprovedAt).toBeInstanceOf(
        Date,
      );

      // 2차 하향평가 - 모든 필드 검증
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('approved');
      expect(result!.stepApproval.secondaryEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.secondaryEvaluationApprovedAt).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationApprovedAt).toBeInstanceOf(
        Date,
      );
    });

    it('일부 상태가 revision_requested인 경우 해당 필드는 null이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.REVISION_REQUESTED,
        criteriaSettingApprovedBy: null,
        criteriaSettingApprovedAt: null,
        selfEvaluationStatus: StepApprovalStatus.APPROVED,
        selfEvaluationApprovedBy: adminId,
        selfEvaluationApprovedAt: now,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationApprovedBy: null,
        primaryEvaluationApprovedAt: null,
        secondaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        secondaryEvaluationApprovedBy: null,
        secondaryEvaluationApprovedAt: null,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 평가기준 설정 - revision_requested
      expect(result!.stepApproval.criteriaSettingStatus).toBe(
        'revision_requested',
      );
      expect(result!.stepApproval.criteriaSettingApprovedBy).toBeNull();
      expect(result!.stepApproval.criteriaSettingApprovedAt).toBeNull();

      // 자기평가 - approved
      expect(result!.stepApproval.selfEvaluationStatus).toBe('approved');
      expect(result!.stepApproval.selfEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.selfEvaluationApprovedAt).toBeDefined();

      // 1차 하향평가 - pending
      expect(result!.stepApproval.primaryEvaluationStatus).toBe('pending');
      expect(result!.stepApproval.primaryEvaluationApprovedBy).toBeNull();
      expect(result!.stepApproval.primaryEvaluationApprovedAt).toBeNull();

      // 2차 하향평가 - revision_requested
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe(
        'revision_requested',
      );
      expect(result!.stepApproval.secondaryEvaluationApprovedBy).toBeNull();
      expect(result!.stepApproval.secondaryEvaluationApprovedAt).toBeNull();
    });

    it('모든 필드 타입이 올바른지 검증한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.APPROVED,
        criteriaSettingApprovedBy: adminId,
        criteriaSettingApprovedAt: now,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        selfEvaluationApprovedBy: null,
        selfEvaluationApprovedAt: null,
        primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        primaryEvaluationApprovedBy: null,
        primaryEvaluationApprovedAt: null,
        secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
        secondaryEvaluationApprovedBy: adminId,
        secondaryEvaluationApprovedAt: now,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 타입 검증
      expect(typeof result!.stepApproval.criteriaSettingStatus).toBe('string');
      expect(['pending', 'approved', 'revision_requested']).toContain(
        result!.stepApproval.criteriaSettingStatus,
      );

      if (result!.stepApproval.criteriaSettingApprovedBy !== null) {
        expect(typeof result!.stepApproval.criteriaSettingApprovedBy).toBe(
          'string',
        );
      }

      if (result!.stepApproval.criteriaSettingApprovedAt !== null) {
        expect(result!.stepApproval.criteriaSettingApprovedAt).toBeInstanceOf(
          Date,
        );
      }

      // 모든 status 필드가 enum 값인지 확인
      const validStatuses = ['pending', 'approved', 'revision_requested'];
      expect(validStatuses).toContain(
        result!.stepApproval.criteriaSettingStatus,
      );
      expect(validStatuses).toContain(
        result!.stepApproval.selfEvaluationStatus,
      );
      expect(validStatuses).toContain(
        result!.stepApproval.primaryEvaluationStatus,
      );
      expect(validStatuses).toContain(
        result!.stepApproval.secondaryEvaluationStatus,
      );
    });
  });

  describe('필드 누락 검증', () => {
    it('stepApproval 객체의 모든 필수 필드가 존재해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.APPROVED,
        criteriaSettingApprovedBy: adminId,
        criteriaSettingApprovedAt: now,
        selfEvaluationStatus: StepApprovalStatus.APPROVED,
        selfEvaluationApprovedBy: adminId,
        selfEvaluationApprovedAt: now,
        primaryEvaluationStatus: StepApprovalStatus.APPROVED,
        primaryEvaluationApprovedBy: adminId,
        primaryEvaluationApprovedAt: now,
        secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
        secondaryEvaluationApprovedBy: adminId,
        secondaryEvaluationApprovedAt: now,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 모든 필드 존재 여부 확인
      const requiredFields = [
        'criteriaSettingStatus',
        'criteriaSettingApprovedBy',
        'criteriaSettingApprovedAt',
        'selfEvaluationStatus',
        'selfEvaluationApprovedBy',
        'selfEvaluationApprovedAt',
        'primaryEvaluationStatus',
        'primaryEvaluationApprovedBy',
        'primaryEvaluationApprovedAt',
        'secondaryEvaluationStatus',
        'secondaryEvaluationApprovedBy',
        'secondaryEvaluationApprovedAt',
      ];

      for (const field of requiredFields) {
        expect(result!.stepApproval).toHaveProperty(field);
      }

      // undefined 필드가 없는지 확인 (null은 허용, undefined는 불허)
      for (const field of requiredFields) {
        expect((result!.stepApproval as any)[field]).not.toBe(undefined);
      }
    });

    it('JSON 직렬화 후에도 모든 필드가 유지되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.APPROVED,
        criteriaSettingApprovedBy: adminId,
        criteriaSettingApprovedAt: now,
        selfEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        selfEvaluationApprovedBy: null,
        selfEvaluationApprovedAt: null,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationApprovedBy: null,
        primaryEvaluationApprovedAt: null,
        secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
        secondaryEvaluationApprovedBy: adminId,
        secondaryEvaluationApprovedAt: now,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // JSON 직렬화/역직렬화
      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);

      // Then
      expect(parsed.stepApproval).toBeDefined();
      expect(parsed.stepApproval.criteriaSettingStatus).toBe('approved');
      expect(parsed.stepApproval.criteriaSettingApprovedBy).toBe(adminId);
      expect(parsed.stepApproval.selfEvaluationStatus).toBe(
        'revision_requested',
      );
      expect(parsed.stepApproval.selfEvaluationApprovedBy).toBeNull();
      expect(parsed.stepApproval.primaryEvaluationStatus).toBe('pending');
      expect(parsed.stepApproval.secondaryEvaluationStatus).toBe('approved');

      // 모든 필드가 JSON에 포함되어 있는지 확인
      const requiredFields = [
        'criteriaSettingStatus',
        'criteriaSettingApprovedBy',
        'criteriaSettingApprovedAt',
        'selfEvaluationStatus',
        'selfEvaluationApprovedBy',
        'selfEvaluationApprovedAt',
        'primaryEvaluationStatus',
        'primaryEvaluationApprovedBy',
        'primaryEvaluationApprovedAt',
        'secondaryEvaluationStatus',
        'secondaryEvaluationApprovedBy',
        'secondaryEvaluationApprovedAt',
      ];

      for (const field of requiredFields) {
        expect(jsonString).toContain(field);
      }
    });
  });
});
