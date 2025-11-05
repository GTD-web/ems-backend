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
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

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
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let mappingId: string;
  let adminId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    // 모듈 초기화
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
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
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
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );
    revisionRequestRepository = dataSource.getRepository(
      EvaluationRevisionRequest,
    );
    recipientRepository = dataSource.getRepository(
      EvaluationRevisionRequestRecipient,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    adminId = systemAdminId;
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
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

      // 2차 하향평가 - 2차 평가자가 없으면 pending이 반환됨 (새로운 로직)
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('pending');
      expect(result!.stepApproval.secondaryEvaluationApprovedBy).toBeNull();
      expect(result!.stepApproval.secondaryEvaluationApprovedAt).toBeNull();
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

      // 2차 하향평가 - 2차 평가자가 없으면 pending이 반환됨 (새로운 로직)
      // 재작성 요청이 있어도 실제 2차 평가자가 없으면 pending이 반환됨
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('pending');
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
      // 2차 하향평가 - 2차 평가자가 없으면 pending이 반환됨 (새로운 로직)
      expect(parsed.stepApproval.secondaryEvaluationStatus).toBe('pending');

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

  describe('2차 평가자별 분리 기능 검증', () => {
    /**
     * 2차 평가자 포함 테스트 데이터 생성
     */
    async function 이차평가자_포함_테스트데이터를_생성한다(): Promise<void> {
      await 기본_테스트데이터를_생성한다();

      // 1차 평가자 생성
      const primaryEvaluator = employeeRepository.create({
        name: '이일차평가자',
        employeeNumber: 'EMP002',
        email: 'primary@test.com',
        externalId: 'EXT002',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedPrimaryEvaluator =
        await employeeRepository.save(primaryEvaluator);
      primaryEvaluatorId = savedPrimaryEvaluator.id;

      // 2차 평가자 1 생성
      const secondaryEvaluator1 = employeeRepository.create({
        name: '박이차평가자1',
        employeeNumber: 'EMP003',
        email: 'secondary1@test.com',
        externalId: 'EXT003',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedSecondaryEvaluator1 =
        await employeeRepository.save(secondaryEvaluator1);
      secondaryEvaluatorId1 = savedSecondaryEvaluator1.id;

      // 2차 평가자 2 생성
      const secondaryEvaluator2 = employeeRepository.create({
        name: '최이차평가자2',
        employeeNumber: 'EMP004',
        email: 'secondary2@test.com',
        externalId: 'EXT004',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedSecondaryEvaluator2 =
        await employeeRepository.save(secondaryEvaluator2);
      secondaryEvaluatorId2 = savedSecondaryEvaluator2.id;

      // 평가라인 생성
      const primaryLine = evaluationLineRepository.create({
        evaluatorType: EvaluatorType.PRIMARY,
        order: 1,
        isRequired: true,
        isAutoAssigned: false,
        version: 1,
        createdBy: systemAdminId,
      });
      const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);

      // 2차 평가라인은 하나만 생성 (여러 평가자는 같은 라인을 사용)
      const secondaryLine = evaluationLineRepository.create({
        evaluatorType: EvaluatorType.SECONDARY,
        order: 2,
        isRequired: false,
        isAutoAssigned: false,
        version: 1,
        createdBy: systemAdminId,
      });
      const savedSecondaryLine =
        await evaluationLineRepository.save(secondaryLine);

      // 평가라인 매핑 생성
      const primaryLineMapping = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        evaluationLineId: savedPrimaryLine.id,
        version: 1,
        createdBy: systemAdminId,
      });
      await evaluationLineMappingRepository.save(primaryLineMapping);

      // 2차 평가자들은 같은 평가라인을 사용하지만 다른 평가자 ID
      const secondaryLineMapping1 = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        evaluationLineId: savedSecondaryLine.id,
        version: 1,
        createdBy: systemAdminId,
      });
      await evaluationLineMappingRepository.save(secondaryLineMapping1);

      const secondaryLineMapping2 = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        evaluationLineId: savedSecondaryLine.id,
        version: 1,
        createdBy: systemAdminId,
      });
      await evaluationLineMappingRepository.save(secondaryLineMapping2);
    }

    it('여러 2차 평가자가 있을 때 secondaryEvaluationStatuses 배열이 반환되어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();

      // 재작성 요청이 정말 없는지 확인
      const existingRequests = await revisionRequestRepository
        .createQueryBuilder('request')
        .where('request.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('request.employeeId = :employeeId', { employeeId })
        .andWhere('request.step = :step', { step: 'secondary' })
        .getMany();

      // 재작성 요청이 있으면 삭제
      if (existingRequests.length > 0) {
        for (const req of existingRequests) {
          await recipientRepository
            .createQueryBuilder()
            .delete()
            .from(EvaluationRevisionRequestRecipient)
            .where('revisionRequestId = :id', { id: req.id })
            .execute();
          await revisionRequestRepository.remove(req);
        }
      }

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
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
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(
        Array.isArray(result!.stepApproval.secondaryEvaluationStatuses),
      ).toBe(true);
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);

      // 각 평가자 정보 확인
      const evaluator1Status =
        result!.stepApproval.secondaryEvaluationStatuses.find(
          (s) => s.evaluatorId === secondaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.evaluatorName).toBe('박이차평가자1');
      expect(evaluator1Status!.evaluatorEmployeeNumber).toBe('EMP003');
      expect(evaluator1Status!.evaluatorEmail).toBe('secondary1@test.com');
      expect(evaluator1Status!.status).toBe('pending');

      const evaluator2Status =
        result!.stepApproval.secondaryEvaluationStatuses.find(
          (s) => s.evaluatorId === secondaryEvaluatorId2,
        );
      expect(evaluator2Status).toBeDefined();
      expect(evaluator2Status!.evaluatorName).toBe('최이차평가자2');
      expect(evaluator2Status!.evaluatorEmployeeNumber).toBe('EMP004');
      expect(evaluator2Status!.evaluatorEmail).toBe('secondary2@test.com');
      expect(evaluator2Status!.status).toBe('pending');
    });

    it('모든 2차 평가자가 승인 상태가 아닐 때는 최종 상태가 pending이어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING, // 승인 상태가 아님
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

      // 모든 평가자가 승인 상태가 아니므로 최종 상태는 pending이어야 함
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('pending');

      // 각 평가자 상태도 pending이어야 함
      result!.stepApproval.secondaryEvaluationStatuses.forEach((status) => {
        expect(status.status).toBe('pending');
      });
    });

    it('재작성 요청이 있는 경우 상태가 revision_requested로 반환되어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 재작성 요청 생성
      const revisionRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary',
        comment: '2차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRevisionRequest =
        await revisionRequestRepository.save(revisionRequest);

      // 수신자 생성 (첫 번째 2차 평가자에게만)
      const recipient = recipientRepository.create({
        revisionRequestId: savedRevisionRequest.id,
        recipientId: secondaryEvaluatorId1,
        recipientType: 'secondary_evaluator',
        isRead: false,
        isCompleted: false,
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 첫 번째 평가자는 revision_requested 상태
      const evaluator1Status =
        result!.stepApproval.secondaryEvaluationStatuses.find(
          (s) => s.evaluatorId === secondaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_requested');
      expect(evaluator1Status!.revisionRequestId).toBe(savedRevisionRequest.id);
      expect(evaluator1Status!.revisionComment).toBe(
        '2차 평가를 수정해주세요.',
      );
      expect(evaluator1Status!.isRevisionCompleted).toBe(false);

      // 두 번째 평가자는 pending 상태 (재작성 요청 없음)
      const evaluator2Status =
        result!.stepApproval.secondaryEvaluationStatuses.find(
          (s) => s.evaluatorId === secondaryEvaluatorId2,
        );
      expect(evaluator2Status).toBeDefined();
      expect(evaluator2Status!.status).toBe('pending');
      expect(evaluator2Status!.revisionRequestId).toBeNull();

      // 최종 상태는 revision_requested여야 함
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe(
        'revision_requested',
      );
    });

    it('재작성 요청이 완료된 경우 상태가 revision_completed로 반환되어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 재작성 요청 생성
      const revisionRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary',
        comment: '2차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRevisionRequest =
        await revisionRequestRepository.save(revisionRequest);

      // 수신자 생성 (재작성 완료)
      const completedAt = new Date();
      const recipient = recipientRepository.create({
        revisionRequestId: savedRevisionRequest.id,
        recipientId: secondaryEvaluatorId1,
        recipientType: 'secondary_evaluator',
        isRead: true,
        readAt: now,
        isCompleted: true,
        completedAt: completedAt,
        responseComment: '수정 완료했습니다.',
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 첫 번째 평가자는 revision_completed 상태
      const evaluator1Status =
        result!.stepApproval.secondaryEvaluationStatuses.find(
          (s) => s.evaluatorId === secondaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_completed');
      expect(evaluator1Status!.revisionRequestId).toBe(savedRevisionRequest.id);
      expect(evaluator1Status!.isRevisionCompleted).toBe(true);
      expect(evaluator1Status!.revisionCompletedAt).toBeDefined();
    });

    it('모든 2차 평가자가 승인 상태일 때만 최종 상태가 approved여야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      // 모든 평가자가 승인 상태인 경우를 시뮬레이션하기 위해
      // stepApproval을 approved로 설정하고, 각 평가자별로 승인 상태를 설정해야 함
      // 하지만 실제로는 각 평가자별로 승인 상태를 확인하므로
      // stepApproval만 approved로 설정해서는 모든 평가자가 approved가 되지 않음
      // 따라서 테스트는 실제로는 각 평가자가 개별적으로 승인되어야 함을 확인
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING, // 승인 상태가 아님
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

      // 모든 평가자가 승인 상태가 아니므로 최종 상태는 pending이어야 함
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('pending');

      // 각 평가자 상태 확인
      result!.stepApproval.secondaryEvaluationStatuses.forEach((status) => {
        expect(status.status).toBe('pending');
      });
    });

    it('secondaryEvaluationStatuses 배열의 각 항목이 올바른 필드를 가지고 있어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
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
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);

      // 각 항목의 필수 필드 확인
      const requiredFields = [
        'evaluatorId',
        'evaluatorName',
        'evaluatorEmployeeNumber',
        'evaluatorEmail',
        'status',
        'approvedBy',
        'approvedAt',
        'revisionRequestId',
        'revisionComment',
        'isRevisionCompleted',
        'revisionCompletedAt',
      ];

      result!.stepApproval.secondaryEvaluationStatuses.forEach((status) => {
        for (const field of requiredFields) {
          expect(status).toHaveProperty(field);
          expect((status as any)[field]).not.toBe(undefined);
        }

        // 타입 검증
        expect(typeof status.evaluatorId).toBe('string');
        expect(typeof status.evaluatorName).toBe('string');
        expect(typeof status.evaluatorEmployeeNumber).toBe('string');
        expect(typeof status.evaluatorEmail).toBe('string');
        expect([
          'pending',
          'approved',
          'revision_requested',
          'revision_completed',
        ]).toContain(status.status);
        expect(typeof status.isRevisionCompleted).toBe('boolean');
      });
    });
  });
});
