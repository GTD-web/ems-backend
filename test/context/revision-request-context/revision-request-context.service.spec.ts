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
 * RevisionRequestContextService 유닛 테스트
 *
 * 재작성 요청 조회, 읽음 처리, 재작성 완료 응답 기능을 검증합니다.
 */
describe('RevisionRequestContextService', () => {
  let service: RevisionRequestContextService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let evaluatorId: string;
  let departmentId: string;
  let adminId: string;
  let revisionRequestId: string;
  let mappingId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
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

    service = module.get<RevisionRequestContextService>(
      RevisionRequestContextService,
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

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    // 외래키 제약을 고려하여 역순으로 삭제
    try {
      // 1. 수신자 삭제 (가장 하위) - soft delete 포함
      await dataSource.query(
        'DELETE FROM evaluation_revision_request_recipient WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
      );

      // 2. 재작성 요청 삭제 - soft delete 포함
      await dataSource.query(
        'DELETE FROM evaluation_revision_request WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
      );

      // 2-1. 단계 승인 삭제
      await stepApprovalRepository.delete({});

      // 2-2. 평가기간-직원 맵핑 삭제
      await mappingRepository.delete({});

      // 3. 평가기간 삭제
      await evaluationPeriodRepository.delete({});

      // 4. 직원 삭제
      await employeeRepository.delete({});

      // 5. 부서 삭제 (가장 상위)
      await departmentRepository.delete({});
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트데이터를_생성한다(): Promise<void> {
    // 1. 부서 생성 (unique externalId를 위해 timestamp + random 추가)
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const department = departmentRepository.create({
      name: '개발팀',
      code: `DEV001-${uniqueSuffix}`,
      externalId: `DEPT001-${uniqueSuffix}`,
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성 (unique name을 위해 timestamp 추가)
    const evaluationPeriod = evaluationPeriodRepository.create({
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
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 피평가자 직원 생성 (unique 값 사용)
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: `EMP001-${uniqueSuffix}`,
      email: `employee-${uniqueSuffix}@test.com`,
      externalId: `EXT001-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 평가자 직원 생성 (unique 값 사용)
    const evaluator = employeeRepository.create({
      name: '이평가자',
      employeeNumber: `EMP002-${uniqueSuffix}`,
      email: `evaluator-${uniqueSuffix}@test.com`,
      externalId: `EXT002-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator = await employeeRepository.save(evaluator);
    evaluatorId = savedEvaluator.id;

    // 4-1. 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 4-2. 단계 승인 생성 (revision_requested 상태)
    const stepApproval = stepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      criteriaSettingStatus: StepApprovalStatus.REVISION_REQUESTED,
      selfEvaluationStatus: StepApprovalStatus.PENDING,
      primaryEvaluationStatus: StepApprovalStatus.PENDING,
      secondaryEvaluationStatus: StepApprovalStatus.PENDING,
      createdBy: systemAdminId,
    });
    await stepApprovalRepository.save(stepApproval);

    // 5. 재작성 요청 생성
    const revisionRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'criteria' as RevisionRequestStepType,
      comment: '평가기준을 다시 작성해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequest = await revisionRequestRepository.save(revisionRequest);
    revisionRequestId = savedRequest.id;

    // 6. 수신자 생성
    const recipient = recipientRepository.create({
      revisionRequestId: revisionRequestId,
      recipientId: evaluatorId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient);
  }

  describe('전체_재작성요청목록을_조회한다', () => {
    it('전체 재작성 요청 목록을 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({});

      // Then
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0].request.id).toBe(revisionRequestId);
      expect(requests[0].request.step).toBe('criteria');
      expect(requests[0].request.comment).toBe('평가기준을 다시 작성해주세요.');
      expect(requests[0].request.requestedBy).toBe(adminId);
      expect(requests[0].evaluationPeriod.name).toContain('2024년 상반기 평가');
      expect(requests[0].employee.name).toBe('김피평가');
      expect(requests[0].recipientInfo.recipientId).toBe(evaluatorId);
    });

    it('evaluationPeriodId로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 다른 평가기간 생성
      const otherPeriodUniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-other`;
      const otherPeriod = evaluationPeriodRepository.create({
        name: `2024년 하반기 평가-${otherPeriodUniqueSuffix}`,
        description: '다른 평가기간',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        status: EvaluationPeriodStatus.IN_PROGRESS,
        currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
        criteriaSettingEnabled: true,
        selfEvaluationSettingEnabled: true,
        finalEvaluationSettingEnabled: true,
        maxSelfEvaluationRate: 120,
        createdBy: systemAdminId,
      });
      const savedOtherPeriod =
        await evaluationPeriodRepository.save(otherPeriod);

      // 다른 평가기간의 재작성 요청 생성
      const otherRequest = revisionRequestRepository.create({
        evaluationPeriodId: savedOtherPeriod.id,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedOtherRequest =
        await revisionRequestRepository.save(otherRequest);

      const otherRecipient = recipientRepository.create({
        revisionRequestId: savedOtherRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(otherRecipient);

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({
        evaluationPeriodId: evaluationPeriodId,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(requests[0].request.step).toBe('criteria');
    });

    it('employeeId로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 다른 직원 생성
      const otherEmployee = employeeRepository.create({
        name: '박다른직원',
        employeeNumber: 'EMP003',
        email: 'other@test.com',
        externalId: 'EXT003',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedOtherEmployee = await employeeRepository.save(otherEmployee);

      // 다른 직원의 재작성 요청 생성
      const otherRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: savedOtherEmployee.id,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      await revisionRequestRepository.save(otherRequest);

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({
        employeeId: employeeId,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.employeeId).toBe(employeeId);
      expect(requests[0].employee.name).toBe('김피평가');
    });

    it('requestedBy로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      const otherAdminId = '123e4567-e89b-12d3-a456-426614174999';

      // 다른 관리자가 생성한 재작성 요청 생성
      const otherRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: otherAdminId,
        requestedAt: new Date(),
        createdBy: otherAdminId,
      });
      const savedOtherRequest =
        await revisionRequestRepository.save(otherRequest);

      const otherRecipient = recipientRepository.create({
        revisionRequestId: savedOtherRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: otherAdminId,
      });
      await recipientRepository.save(otherRecipient);

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({
        requestedBy: adminId,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.requestedBy).toBe(adminId);
      expect(requests[0].request.step).toBe('criteria');
    });

    it('isRead로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 읽은 요청 생성
      const readRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedReadRequest =
        await revisionRequestRepository.save(readRequest);

      const readRecipient = recipientRepository.create({
        revisionRequestId: savedReadRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        readAt: new Date(),
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(readRecipient);

      // When - 읽지 않은 요청만 조회
      const unreadRequests = await service.전체_재작성요청목록을_조회한다({
        isRead: false,
      });

      // When - 읽은 요청만 조회
      const readRequests = await service.전체_재작성요청목록을_조회한다({
        isRead: true,
      });

      // Then
      expect(unreadRequests.length).toBe(1);
      expect(unreadRequests[0].recipientInfo.isRead).toBe(false);

      expect(readRequests.length).toBe(1);
      expect(readRequests[0].recipientInfo.isRead).toBe(true);
    });

    it('isCompleted로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 완료된 요청 생성
      const completedRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedCompletedRequest =
        await revisionRequestRepository.save(completedRequest);

      const completedRecipient = recipientRepository.create({
        revisionRequestId: savedCompletedRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        isCompleted: true,
        completedAt: new Date(),
        responseComment: '수정 완료했습니다.',
        createdBy: adminId,
      });
      await recipientRepository.save(completedRecipient);

      // When - 미완료 요청만 조회
      const incompleteRequests = await service.전체_재작성요청목록을_조회한다({
        isCompleted: false,
      });

      // When - 완료된 요청만 조회
      const completedRequests = await service.전체_재작성요청목록을_조회한다({
        isCompleted: true,
      });

      // Then
      expect(incompleteRequests.length).toBe(1);
      expect(incompleteRequests[0].recipientInfo.isCompleted).toBe(false);

      expect(completedRequests.length).toBe(1);
      expect(completedRequests[0].recipientInfo.isCompleted).toBe(true);
      expect(completedRequests[0].recipientInfo.responseComment).toBe(
        '수정 완료했습니다.',
      );
    });

    it('step으로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 다른 단계의 재작성 요청 생성
      const selfRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSelfRequest =
        await revisionRequestRepository.save(selfRequest);

      const selfRecipient = recipientRepository.create({
        revisionRequestId: savedSelfRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(selfRecipient);

      // When
      const criteriaRequests = await service.전체_재작성요청목록을_조회한다({
        step: 'criteria' as RevisionRequestStepType,
      });

      const selfRequests = await service.전체_재작성요청목록을_조회한다({
        step: 'self' as RevisionRequestStepType,
      });

      // Then
      expect(criteriaRequests.length).toBe(1);
      expect(criteriaRequests[0].request.step).toBe('criteria');

      expect(selfRequests.length).toBe(1);
      expect(selfRequests[0].request.step).toBe('self');
    });

    it('여러 필터를 조합하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'criteria' as RevisionRequestStepType,
        isRead: false,
        isCompleted: false,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(requests[0].request.employeeId).toBe(employeeId);
      expect(requests[0].request.step).toBe('criteria');
      expect(requests[0].recipientInfo.isRead).toBe(false);
      expect(requests[0].recipientInfo.isCompleted).toBe(false);
    });

    it('여러 수신자가 있는 재작성 요청은 각 수신자별로 별도 항목으로 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 피평가자도 수신자로 추가
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: revisionRequestId,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(employeeRecipient);

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({});

      // Then
      expect(requests.length).toBe(2); // 평가자 + 피평가자

      const recipientIds = requests.map((r) => r.recipientInfo.recipientId);
      expect(recipientIds).toContain(evaluatorId);
      expect(recipientIds).toContain(employeeId);

      // 모든 항목이 같은 요청 ID를 가져야 함
      const requestIds = requests.map((r) => r.request.id);
      expect(new Set(requestIds).size).toBe(1); // 모두 같은 요청 ID
    });

    it('조건에 맞는 요청이 없으면 빈 배열을 반환해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When - 존재하지 않는 평가기간으로 필터링
      const requests = await service.전체_재작성요청목록을_조회한다({
        evaluationPeriodId: '123e4567-e89b-12d3-a456-426614174999',
      });

      // Then
      expect(requests.length).toBe(0);
      expect(Array.isArray(requests)).toBe(true);
    });

    it('삭제된 수신자는 결과에 포함되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 삭제된 수신자 생성
      const deletedRecipient = recipientRepository.create({
        revisionRequestId: revisionRequestId,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        deletedAt: new Date(),
        createdBy: adminId,
      });
      await recipientRepository.save(deletedRecipient);

      // When
      const requests = await service.전체_재작성요청목록을_조회한다({});

      // Then
      // 삭제된 수신자는 제외되어야 하므로 평가자 수신자만 반환
      const recipientIds = requests.map((r) => r.recipientInfo.recipientId);
      expect(recipientIds).toContain(evaluatorId);
      expect(recipientIds).not.toContain(employeeId);
    });
  });

  describe('내_재작성요청을_조회한다', () => {
    it('수신자가 자신에게 온 재작성 요청을 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        {},
      );

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.id).toBe(revisionRequestId);
      expect(requests[0].request.step).toBe('criteria');
      expect(requests[0].request.comment).toBe('평가기준을 다시 작성해주세요.');
      expect(requests[0].request.requestedBy).toBe(adminId);
      expect(requests[0].recipientInfo.isRead).toBe(false);
      expect(requests[0].recipientInfo.isCompleted).toBe(false);
      expect(requests[0].evaluationPeriod.name).toContain('2024년 상반기 평가');
      expect(requests[0].employee.name).toBe('김피평가');
    });

    it('읽지 않은 요청만 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId, {
        isRead: false,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].recipientInfo.isRead).toBe(false);
    });

    it('특정 단계의 요청만 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const criteriaRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { step: 'criteria' as RevisionRequestStepType },
      );

      const selfRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { step: 'self' as RevisionRequestStepType },
      );

      // Then
      expect(criteriaRequests.length).toBe(1);
      expect(selfRequests.length).toBe(0);
    });

    it('다른 사용자에게 온 요청은 조회되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const otherUserId = '123e4567-e89b-12d3-a456-426614174999';

      // When
      const requests = await service.내_재작성요청목록을_조회한다(
        otherUserId,
        {},
      );

      // Then
      expect(requests.length).toBe(0);
    });

    it('approvalStatus 필드가 제대로 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        {},
      );

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].approvalStatus).toBeDefined();
      // criteria 단계의 재작성 요청이므로 criteriaSettingStatus가 반환되어야 함
      expect(requests[0].approvalStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );
    });

    it('criteria 단계의 approvalStatus가 올바르게 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 단계 승인 상태를 approved로 변경
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      if (stepApproval) {
        stepApproval.criteriaSettingStatus = StepApprovalStatus.APPROVED;
        await stepApprovalRepository.save(stepApproval);
      }

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId, {
        step: 'criteria' as RevisionRequestStepType,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].approvalStatus).toBe(StepApprovalStatus.APPROVED);
    });

    it('self 단계의 approvalStatus가 올바르게 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 단계 승인 상태를 self 단계 revision_requested로 변경
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      if (stepApproval) {
        stepApproval.selfEvaluationStatus =
          StepApprovalStatus.REVISION_REQUESTED;
        await stepApprovalRepository.save(stepApproval);
      }

      // self 단계 재작성 요청 생성
      const selfRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSelfRequest =
        await revisionRequestRepository.save(selfRequest);

      // 피평가자에게 전송된 재작성 요청 생성
      const selfRecipient = recipientRepository.create({
        revisionRequestId: savedSelfRequest.id,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(selfRecipient);

      // When
      const requests = await service.내_재작성요청목록을_조회한다(employeeId, {
        step: 'self' as RevisionRequestStepType,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].approvalStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );
    });

    it('primary 단계의 approvalStatus가 올바르게 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 단계 승인 상태를 primary 단계 pending으로 변경
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      if (stepApproval) {
        stepApproval.primaryEvaluationStatus = StepApprovalStatus.PENDING;
        await stepApprovalRepository.save(stepApproval);
      }

      // primary 단계 재작성 요청 생성
      const primaryRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary' as RevisionRequestStepType,
        comment: '1차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedPrimaryRequest =
        await revisionRequestRepository.save(primaryRequest);

      // 1차평가자에게 전송된 재작성 요청 생성
      const primaryRecipient = recipientRepository.create({
        revisionRequestId: savedPrimaryRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(primaryRecipient);

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId, {
        step: 'primary' as RevisionRequestStepType,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].approvalStatus).toBe(StepApprovalStatus.PENDING);
    });

    it('secondary 단계의 approvalStatus가 재작성 요청 완료 여부에 따라 올바르게 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 단계 승인 상태를 secondary 단계 revision_requested로 변경
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      if (stepApproval) {
        stepApproval.secondaryEvaluationStatus =
          StepApprovalStatus.REVISION_REQUESTED;
        await stepApprovalRepository.save(stepApproval);
      }

      // 2차 평가자 생성
      const secondaryEvaluator = employeeRepository.create({
        name: '박이차평가자',
        employeeNumber: `EMP003-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: `secondary-${Date.now()}@test.com`,
        externalId: `EXT003-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedSecondaryEvaluator =
        await employeeRepository.save(secondaryEvaluator);
      const secondaryEvaluatorId = savedSecondaryEvaluator.id;

      // secondary 단계 재작성 요청 생성
      const secondaryRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary' as RevisionRequestStepType,
        comment: '2차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSecondaryRequest =
        await revisionRequestRepository.save(secondaryRequest);

      // 2차평가자에게 전송된 재작성 요청 생성
      const secondaryRecipient = recipientRepository.create({
        revisionRequestId: savedSecondaryRequest.id,
        recipientId: secondaryEvaluatorId,
        recipientType: RecipientType.SECONDARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(secondaryRecipient);

      // When - 재작성 요청이 있고 완료되지 않은 경우
      const requestsBefore = await service.내_재작성요청목록을_조회한다(
        secondaryEvaluatorId,
        {
          step: 'secondary' as RevisionRequestStepType,
        },
      );

      // Then - revision_requested 상태여야 함
      expect(requestsBefore.length).toBe(1);
      expect(requestsBefore[0].approvalStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // When - 재작성 완료 응답 제출
      await service.재작성완료_응답을_제출한다(
        savedSecondaryRequest.id,
        secondaryEvaluatorId,
        '2차 평가 수정 완료했습니다.',
      );

      // When - 재작성 요청이 완료된 경우
      const requestsAfter = await service.내_재작성요청목록을_조회한다(
        secondaryEvaluatorId,
        {
          step: 'secondary' as RevisionRequestStepType,
        },
      );

      // Then - revision_completed 상태여야 함
      expect(requestsAfter.length).toBe(1);
      expect(requestsAfter[0].approvalStatus).toBe(
        StepApprovalStatus.REVISION_COMPLETED,
      );
    });

    it('단계 승인 정보가 없을 때 approvalStatus는 pending이어야 한다', async () => {
      // Given
      // 단계 승인 정보 없이 재작성 요청만 생성
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const department = departmentRepository.create({
        name: '개발팀',
        code: `DEV001-${uniqueSuffix}`,
        externalId: `DEPT001-${uniqueSuffix}`,
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        createdBy: systemAdminId,
      });
      const savedDepartment = await departmentRepository.save(department);

      const evaluationPeriod = evaluationPeriodRepository.create({
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
        await evaluationPeriodRepository.save(evaluationPeriod);

      const employee = employeeRepository.create({
        name: '김피평가',
        employeeNumber: `EMP001-${uniqueSuffix}`,
        email: `employee-${uniqueSuffix}@test.com`,
        externalId: `EXT001-${uniqueSuffix}`,
        departmentId: savedDepartment.id,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedEmployee = await employeeRepository.save(employee);

      const evaluator = employeeRepository.create({
        name: '이평가자',
        employeeNumber: `EMP002-${uniqueSuffix}`,
        email: `evaluator-${uniqueSuffix}@test.com`,
        externalId: `EXT002-${uniqueSuffix}`,
        departmentId: savedDepartment.id,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedEvaluator = await employeeRepository.save(evaluator);

      // 단계 승인 정보 없이 재작성 요청만 생성
      const request = revisionRequestRepository.create({
        evaluationPeriodId: savedPeriod.id,
        employeeId: savedEmployee.id,
        step: 'criteria' as RevisionRequestStepType,
        comment: '평가기준을 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedRequest = await revisionRequestRepository.save(request);

      const recipient = recipientRepository.create({
        revisionRequestId: savedRequest.id,
        recipientId: savedEvaluator.id,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(recipient);

      // When
      const requests = await service.내_재작성요청목록을_조회한다(
        savedEvaluator.id,
        {},
      );

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].approvalStatus).toBe(StepApprovalStatus.PENDING);
    });
  });

  describe('읽지않은_재작성요청수를_조회한다', () => {
    it('수신자의 읽지 않은 재작성 요청 개수를 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const count = await service.읽지않은_재작성요청수를_조회한다(evaluatorId);

      // Then
      expect(count).toBe(1);
    });

    it('읽은 요청은 개수에 포함되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 요청을 읽음 처리
      await service.재작성요청을_읽음처리한다(revisionRequestId, evaluatorId);

      // When
      const count = await service.읽지않은_재작성요청수를_조회한다(evaluatorId);

      // Then
      expect(count).toBe(0);
    });
  });

  describe('재작성요청을_읽음처리한다', () => {
    it('재작성 요청을 읽음 상태로 변경할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      await service.재작성요청을_읽음처리한다(revisionRequestId, evaluatorId);

      // Then
      const recipient = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: evaluatorId,
        },
      });

      expect(recipient).toBeDefined();
      expect(recipient!.isRead).toBe(true);
      expect(recipient!.readAt).toBeDefined();
      expect(recipient!.readAt).toBeInstanceOf(Date);
    });

    it('이미 읽은 요청을 다시 읽음 처리해도 예외가 발생하지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      await service.재작성요청을_읽음처리한다(revisionRequestId, evaluatorId);

      // When & Then
      await expect(
        service.재작성요청을_읽음처리한다(revisionRequestId, evaluatorId),
      ).resolves.not.toThrow();
    });

    it('수신자가 아닌 사용자가 읽음 처리 시도 시 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const otherUserId = '123e4567-e89b-12d3-a456-426614174999';

      // When & Then
      await expect(
        service.재작성요청을_읽음처리한다(revisionRequestId, otherUserId),
      ).rejects.toThrow();
    });
  });

  describe('재작성완료_응답을_제출한다', () => {
    it('재작성 완료 응답을 제출할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const responseComment = '수정 완료했습니다.';

      // When
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        evaluatorId,
        responseComment,
      );

      // Then
      const recipient = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: evaluatorId,
        },
      });

      expect(recipient).toBeDefined();
      expect(recipient!.isCompleted).toBe(true);
      expect(recipient!.completedAt).toBeDefined();
      expect(recipient!.responseComment).toBe(responseComment);
    });

    it('재작성 완료 시 자동으로 읽음 처리되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const responseComment = '수정 완료했습니다.';

      // When
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        evaluatorId,
        responseComment,
      );

      // Then
      const recipient = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: evaluatorId,
        },
      });

      expect(recipient!.isRead).toBe(true);
      expect(recipient!.readAt).toBeDefined();
    });

    it('수신자가 아닌 사용자가 완료 응답 시도 시 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const otherUserId = '123e4567-e89b-12d3-a456-426614174999';
      const responseComment = '수정 완료했습니다.';

      // When & Then
      await expect(
        service.재작성완료_응답을_제출한다(
          revisionRequestId,
          otherUserId,
          responseComment,
        ),
      ).rejects.toThrow();
    });

    it('이미 완료된 요청에 다시 응답 시도 시 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const responseComment = '수정 완료했습니다.';
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        evaluatorId,
        responseComment,
      );

      // When & Then
      await expect(
        service.재작성완료_응답을_제출한다(
          revisionRequestId,
          evaluatorId,
          '다시 수정했습니다.',
        ),
      ).rejects.toThrow();
    });

    it('재작성 완료 응답 제출 시 단계 승인 상태가 revision_completed로 변경되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const responseComment = '수정 완료했습니다.';

      // 초기 상태 확인 (revision_requested)
      const beforeStepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(beforeStepApproval).toBeDefined();
      expect(beforeStepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // When - 재작성 완료 응답 제출
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        evaluatorId,
        responseComment,
      );

      // Then - 단계 승인 상태가 revision_completed로 변경되었는지 확인
      const afterStepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });

      expect(afterStepApproval).toBeDefined();
      expect(afterStepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_COMPLETED,
      );
    });

    it('평가기준 단계에서 한쪽이 완료하면 다른 쪽도 자동 완료되어 상태가 revision_completed로 변경되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 피평가자도 수신자로 추가
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: revisionRequestId,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(employeeRecipient);

      // 초기 상태 확인
      const beforeStepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(beforeStepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // When - 평가자만 완료 응답 제출
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        evaluatorId,
        '평가자 완료했습니다.',
      );

      // Then - 평가기준 단계에서는 한쪽이 완료하면 다른 쪽도 자동 완료되므로 상태가 revision_completed로 변경되어야 함
      const afterFirstStepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(afterFirstStepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_COMPLETED,
      );

      // Then - 피평가자도 자동 완료 처리되었는지 확인
      const employeeRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: employeeId,
        },
      });
      expect(employeeRecipientAfter!.isCompleted).toBe(true);
      expect(employeeRecipientAfter!.isRead).toBe(true);
      expect(employeeRecipientAfter!.readAt).toBeDefined();
      expect(employeeRecipientAfter!.responseComment).toBe(
        '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
      );
    });

    describe('평가기준/자기평가 단계에서 다른 수신자 자동 완료 처리', () => {
      it('평가기준 단계에서 피평가자가 응답 제출 시 1차평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 피평가자도 수신자로 추가
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: revisionRequestId,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // 재작성 요청의 step을 criteria로 확인
        const request = await revisionRequestRepository.findOne({
          where: { id: revisionRequestId },
        });
        expect(request!.step).toBe('criteria');

        // When - 피평가자가 완료 응답 제출
        await service.재작성완료_응답을_제출한다(
          revisionRequestId,
          employeeId,
          '피평가자 완료했습니다.',
        );

        // Then - 피평가자 완료 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '피평가자 완료했습니다.',
        );

        // Then - 1차평가자도 자동 완료 처리되었는지 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.isRead).toBe(true);
        expect(evaluatorRecipientAfter!.readAt).toBeDefined();
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('평가기준 단계에서 1차평가자가 응답 제출 시 피평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 피평가자도 수신자로 추가
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: revisionRequestId,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // 재작성 요청의 step을 criteria로 확인
        const request = await revisionRequestRepository.findOne({
          where: { id: revisionRequestId },
        });
        expect(request!.step).toBe('criteria');

        // When - 1차평가자가 완료 응답 제출
        await service.재작성완료_응답을_제출한다(
          revisionRequestId,
          evaluatorId,
          '1차평가자 완료했습니다.',
        );

        // Then - 1차평가자 완료 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '1차평가자 완료했습니다.',
        );

        // Then - 피평가자도 자동 완료 처리되었는지 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('자기평가 단계에서 피평가자가 응답 제출 시 1차평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 자기평가 단계 재작성 요청 생성
        const selfRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '자기평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedSelfRequest =
          await revisionRequestRepository.save(selfRevisionRequest);

        // 피평가자 수신자 생성
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // 1차평가자 수신자 생성
        const evaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(evaluatorRecipient);

        // When - 피평가자가 완료 응답 제출
        await service.재작성완료_응답을_제출한다(
          savedSelfRequest.id,
          employeeId,
          '피평가자 자기평가 완료했습니다.',
        );

        // Then - 피평가자 완료 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '피평가자 자기평가 완료했습니다.',
        );

        // Then - 1차평가자도 자동 완료 처리되었는지 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.isRead).toBe(true);
        expect(evaluatorRecipientAfter!.readAt).toBeDefined();
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('자기평가 단계에서 1차평가자가 응답 제출 시 피평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 자기평가 단계 재작성 요청 생성
        const selfRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '자기평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedSelfRequest =
          await revisionRequestRepository.save(selfRevisionRequest);

        // 피평가자 수신자 생성
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // 1차평가자 수신자 생성
        const evaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(evaluatorRecipient);

        // When - 1차평가자가 완료 응답 제출
        await service.재작성완료_응답을_제출한다(
          savedSelfRequest.id,
          evaluatorId,
          '1차평가자 자기평가 완료했습니다.',
        );

        // Then - 1차평가자 완료 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.isRead).toBe(true);
        expect(evaluatorRecipientAfter!.readAt).toBeDefined();
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '1차평가자 자기평가 완료했습니다.',
        );

        // Then - 피평가자도 자동 완료 처리되었는지 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('1차평가 단계에서는 다른 수신자가 자동 완료 처리되지 않아야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 1차평가 단계 재작성 요청 생성
        const primaryRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'primary' as RevisionRequestStepType,
          comment: '1차평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedPrimaryRequest = await revisionRequestRepository.save(
          primaryRevisionRequest,
        );

        // 1차평가자 수신자 생성
        const evaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(evaluatorRecipient);

        // 피평가자 수신자 생성 (1차평가 단계에서는 보통 피평가자에게는 요청이 가지 않지만, 테스트를 위해 추가)
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // When - 1차평가자가 완료 응답 제출
        await service.재작성완료_응답을_제출한다(
          savedPrimaryRequest.id,
          evaluatorId,
          '1차평가자 완료했습니다.',
        );

        // Then - 1차평가자 완료 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedPrimaryRequest.id,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);

        // Then - 피평가자는 자동 완료 처리되지 않아야 함
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedPrimaryRequest.id,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(false);
      });

      it('2차평가 단계에서는 다른 수신자가 자동 완료 처리되지 않아야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 2차평가자 생성
        const secondaryEvaluator = employeeRepository.create({
          name: '박2차평가자',
          employeeNumber: `EMP003-${Date.now()}`,
          email: `secondary-evaluator-${Date.now()}@test.com`,
          externalId: `EXT003-${Date.now()}`,
          departmentId: departmentId,
          status: '재직중',
          createdBy: systemAdminId,
        });
        const savedSecondaryEvaluator =
          await employeeRepository.save(secondaryEvaluator);
        const secondaryEvaluatorId = savedSecondaryEvaluator.id;

        // 2차평가 단계 재작성 요청 생성
        const secondaryRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary' as RevisionRequestStepType,
          comment: '2차평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedSecondaryRequest = await revisionRequestRepository.save(
          secondaryRevisionRequest,
        );

        // 2차평가자 수신자 생성
        const secondaryEvaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedSecondaryRequest.id,
          recipientId: secondaryEvaluatorId,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(secondaryEvaluatorRecipient);

        // 1차평가자 수신자 생성 (2차평가 단계에서는 보통 1차평가자에게는 요청이 가지 않지만, 테스트를 위해 추가)
        const primaryEvaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedSecondaryRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(primaryEvaluatorRecipient);

        // When - 2차평가자가 완료 응답 제출
        await service.재작성완료_응답을_제출한다(
          savedSecondaryRequest.id,
          secondaryEvaluatorId,
          '2차평가자 완료했습니다.',
        );

        // Then - 2차평가자 완료 확인
        const secondaryEvaluatorRecipientAfter =
          await recipientRepository.findOne({
            where: {
              revisionRequestId: savedSecondaryRequest.id,
              recipientId: secondaryEvaluatorId,
            },
          });
        expect(secondaryEvaluatorRecipientAfter!.isCompleted).toBe(true);

        // Then - 1차평가자는 자동 완료 처리되지 않아야 함
        const primaryEvaluatorRecipientAfter =
          await recipientRepository.findOne({
            where: {
              revisionRequestId: savedSecondaryRequest.id,
              recipientId: evaluatorId,
            },
          });
        expect(primaryEvaluatorRecipientAfter!.isCompleted).toBe(false);
      });
    });
  });

  describe('복합 시나리오', () => {
    it('평가기준 단계에서 피평가자가 완료하면 1차평가자도 자동 완료 처리되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 추가 수신자 생성 (피평가자)
      const additionalRecipient = recipientRepository.create({
        revisionRequestId: revisionRequestId,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(additionalRecipient);

      // When - 평가자가 읽음 처리
      await service.재작성요청을_읽음처리한다(revisionRequestId, evaluatorId);

      // When - 피평가자가 완료 응답
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        employeeId,
        '수정 완료했습니다.',
      );

      // Then
      const evaluatorRecipient = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: evaluatorId,
        },
      });
      const employeeRecipient = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: employeeId,
        },
      });

      // 평가기준 단계에서는 피평가자가 완료하면 1차평가자도 자동 완료 처리됨
      expect(evaluatorRecipient!.isRead).toBe(true);
      expect(evaluatorRecipient!.readAt).toBeDefined();
      expect(evaluatorRecipient!.isCompleted).toBe(true);
      expect(evaluatorRecipient!.responseComment).toBe(
        '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
      );

      expect(employeeRecipient!.isRead).toBe(true);
      expect(employeeRecipient!.readAt).toBeDefined();
      expect(employeeRecipient!.isCompleted).toBe(true);
      expect(employeeRecipient!.responseComment).toBe('수정 완료했습니다.');
    });

    it('완료된 요청과 미완료 요청이 섞여 있을 때 올바르게 필터링되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 추가 재작성 요청 생성 (완료됨)
      const completedRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedCompletedRequest =
        await revisionRequestRepository.save(completedRequest);

      const completedRecipient = recipientRepository.create({
        revisionRequestId: savedCompletedRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        isCompleted: true,
        completedAt: new Date(),
        responseComment: '완료했습니다.',
        createdBy: adminId,
      });
      await recipientRepository.save(completedRecipient);

      // When - 미완료 요청만 조회
      const incompleteRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { isCompleted: false },
      );

      // When - 완료 요청만 조회
      const completedRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { isCompleted: true },
      );

      // Then
      expect(incompleteRequests.length).toBe(1);
      expect(incompleteRequests[0].request.step).toBe('criteria');

      expect(completedRequests.length).toBe(1);
      expect(completedRequests[0].request.step).toBe('self');
      expect(completedRequests[0].recipientInfo.isCompleted).toBe(true);
    });
  });

  describe('평가기간_직원_평가자로_재작성완료_응답을_제출한다 (2차 평가자별 처리)', () => {
    // 2차 평가자 테스트 데이터 ID
    let secondaryEvaluatorId1: string;
    let secondaryEvaluatorId2: string;

    /**
     * 2차 평가자 포함 테스트 데이터 생성
     */
    async function 이차평가자_포함_테스트데이터를_생성한다(): Promise<void> {
      // 기본 데이터 생성
      await 테스트데이터를_생성한다();

      // 2차 평가자 1 생성
      const secondaryEvaluator1 = employeeRepository.create({
        name: '박이차평가자1',
        employeeNumber: `EMP003-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: `secondary1-${Date.now()}@test.com`,
        externalId: `EXT003-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedSecondaryEvaluator1 =
        await employeeRepository.save(secondaryEvaluator1);
      secondaryEvaluatorId1 = savedSecondaryEvaluator1.id;

      // 2차 평가자 2 생성
      const secondaryEvaluator2 = employeeRepository.create({
        name: '박이차평가자2',
        employeeNumber: `EMP004-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: `secondary2-${Date.now()}@test.com`,
        externalId: `EXT004-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedSecondaryEvaluator2 =
        await employeeRepository.save(secondaryEvaluator2);
      secondaryEvaluatorId2 = savedSecondaryEvaluator2.id;

      // 단계 승인 상태를 2차 평가 revision_requested로 변경
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      if (stepApproval) {
        stepApproval.secondaryEvaluationStatus =
          StepApprovalStatus.REVISION_REQUESTED;
        await stepApprovalRepository.save(stepApproval);
      }

      // 2차 평가자 1에게 재작성 요청 생성
      const revisionRequest1 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary' as RevisionRequestStepType,
        comment: '2차 평가자 1에게 재작성 요청',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedRequest1 =
        await revisionRequestRepository.save(revisionRequest1);

      const recipient1 = recipientRepository.create({
        revisionRequestId: savedRequest1.id,
        recipientId: secondaryEvaluatorId1,
        recipientType: RecipientType.SECONDARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(recipient1);

      // 2차 평가자 2에게 재작성 요청 생성
      const revisionRequest2 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary' as RevisionRequestStepType,
        comment: '2차 평가자 2에게 재작성 요청',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedRequest2 =
        await revisionRequestRepository.save(revisionRequest2);

      const recipient2 = recipientRepository.create({
        revisionRequestId: savedRequest2.id,
        recipientId: secondaryEvaluatorId2,
        recipientType: RecipientType.SECONDARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(recipient2);
    }

    it('평가기간, 직원, 평가자 기반으로 재작성 완료 응답을 제출할 수 있어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();
      const responseComment =
        '평가기간/직원/평가자 기반으로 완료 처리했습니다.';

      // When
      await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        employeeId,
        secondaryEvaluatorId1,
        'secondary',
        responseComment,
      );

      // Then
      const requests = await revisionRequestRepository.find({
        where: {
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
        },
        relations: ['recipients'],
      });

      const request1 = requests.find((r) =>
        r.recipients?.some(
          (rec) =>
            rec.recipientId === secondaryEvaluatorId1 &&
            rec.recipientType === RecipientType.SECONDARY_EVALUATOR,
        ),
      );

      expect(request1).toBeDefined();
      const recipient1 = request1!.recipients?.find(
        (r) => r.recipientId === secondaryEvaluatorId1,
      );
      expect(recipient1).toBeDefined();
      expect(recipient1!.isCompleted).toBe(true);
      expect(recipient1!.responseComment).toBe(responseComment);
    });

    it('2차 평가의 경우, 한 평가자만 완료했을 때는 단계 승인 상태가 변경되지 않아야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();
      const responseComment = '첫 번째 평가자 완료';

      // When - 첫 번째 2차 평가자만 완료
      await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        employeeId,
        secondaryEvaluatorId1,
        'secondary',
        responseComment,
      );

      // Then - 단계 승인 상태는 여전히 revision_requested여야 함
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });

      expect(stepApproval).toBeDefined();
      expect(stepApproval!.secondaryEvaluationStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );
    });

    it('2차 평가의 경우, 모든 평가자가 완료했을 때만 단계 승인 상태가 변경되어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();
      const responseComment1 = '첫 번째 평가자 완료';
      const responseComment2 = '두 번째 평가자 완료';

      // When - 첫 번째 2차 평가자 완료
      await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        employeeId,
        secondaryEvaluatorId1,
        'secondary',
        responseComment1,
      );

      // Then - 아직 revision_requested 상태
      let stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(stepApproval!.secondaryEvaluationStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // When - 두 번째 2차 평가자도 완료
      await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        employeeId,
        secondaryEvaluatorId2,
        'secondary',
        responseComment2,
      );

      // Then - 이제 revision_completed 상태로 변경되어야 함
      stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(stepApproval!.secondaryEvaluationStatus).toBe(
        StepApprovalStatus.REVISION_COMPLETED,
      );
    });

    it('2차 평가가 아닌 경우, 기존 로직대로 단일 요청 완료 시 상태가 변경되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다(); // 기본 데이터 (criteria 단계)
      const responseComment = '기준 단계 완료';

      // When
      await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        employeeId,
        evaluatorId,
        'criteria',
        responseComment,
      );

      // Then - 단계 승인 상태가 revision_completed로 변경되어야 함
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });

      expect(stepApproval).toBeDefined();
      expect(stepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_COMPLETED,
      );
    });

    it('재작성 요청이 없을 때 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const responseComment = '완료 처리';

      // When & Then
      await expect(
        service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          'secondary', // secondary 단계 재작성 요청이 없음
          responseComment,
        ),
      ).rejects.toThrow('재작성 요청을 찾을 수 없습니다');
    });

    it('해당 평가자에게 전송된 재작성 요청이 없을 때 예외가 발생해야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();
      const otherEvaluatorId = '123e4567-e89b-12d3-a456-426614174999'; // 존재하지 않는 평가자
      const responseComment = '완료 처리';

      // When & Then
      await expect(
        service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          otherEvaluatorId,
          'secondary',
          responseComment,
        ),
      ).rejects.toThrow('재작성 요청 수신자를 찾을 수 없습니다');
    });

    it('재작성 완료 시 자동으로 읽음 처리되어야 한다', async () => {
      // Given
      await 이차평가자_포함_테스트데이터를_생성한다();
      const responseComment = '완료 처리';

      // When
      await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        employeeId,
        secondaryEvaluatorId1,
        'secondary',
        responseComment,
      );

      // Then
      const requests = await revisionRequestRepository.find({
        where: {
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
        },
        relations: ['recipients'],
      });

      const request1 = requests.find((r) =>
        r.recipients?.some(
          (rec) =>
            rec.recipientId === secondaryEvaluatorId1 &&
            rec.recipientType === RecipientType.SECONDARY_EVALUATOR,
        ),
      );

      const recipient1 = request1!.recipients?.find(
        (r) => r.recipientId === secondaryEvaluatorId1,
      );

      expect(recipient1!.isRead).toBe(true);
      expect(recipient1!.readAt).toBeDefined();
    });

    describe('평가기준/자기평가 단계에서 다른 수신자 자동 완료 처리', () => {
      it('평가기준 단계에서 피평가자가 응답 제출 시 1차평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 피평가자도 수신자로 추가
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: revisionRequestId,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // When - 피평가자가 완료 응답 제출 (관리자용 함수 사용)
        await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          employeeId,
          'criteria',
          '피평가자 완료했습니다.',
        );

        // Then - 피평가자 완료 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '피평가자 완료했습니다.',
        );

        // Then - 1차평가자도 자동 완료 처리되었는지 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.isRead).toBe(true);
        expect(evaluatorRecipientAfter!.readAt).toBeDefined();
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('평가기준 단계에서 1차평가자가 응답 제출 시 피평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 피평가자도 수신자로 추가
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: revisionRequestId,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // When - 1차평가자가 완료 응답 제출 (관리자용 함수 사용)
        await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          'criteria',
          '1차평가자 완료했습니다.',
        );

        // Then - 1차평가자 완료 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '1차평가자 완료했습니다.',
        );

        // Then - 피평가자도 자동 완료 처리되었는지 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: revisionRequestId,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('자기평가 단계에서 피평가자가 응답 제출 시 1차평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 자기평가 단계 재작성 요청 생성
        const selfRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '자기평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedSelfRequest =
          await revisionRequestRepository.save(selfRevisionRequest);

        // 피평가자 수신자 생성
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // 1차평가자 수신자 생성
        const evaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(evaluatorRecipient);

        // When - 피평가자가 완료 응답 제출 (관리자용 함수 사용)
        await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          employeeId,
          'self',
          '피평가자 자기평가 완료했습니다.',
        );

        // Then - 피평가자 완료 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '피평가자 자기평가 완료했습니다.',
        );

        // Then - 1차평가자도 자동 완료 처리되었는지 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.isRead).toBe(true);
        expect(evaluatorRecipientAfter!.readAt).toBeDefined();
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('자기평가 단계에서 1차평가자가 응답 제출 시 피평가자도 자동 완료 처리되어야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 자기평가 단계 재작성 요청 생성
        const selfRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '자기평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedSelfRequest =
          await revisionRequestRepository.save(selfRevisionRequest);

        // 피평가자 수신자 생성
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // 1차평가자 수신자 생성
        const evaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedSelfRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(evaluatorRecipient);

        // When - 1차평가자가 완료 응답 제출 (관리자용 함수 사용)
        await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          'self',
          '1차평가자 자기평가 완료했습니다.',
        );

        // Then - 1차평가자 완료 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
        expect(evaluatorRecipientAfter!.isRead).toBe(true);
        expect(evaluatorRecipientAfter!.readAt).toBeDefined();
        expect(evaluatorRecipientAfter!.responseComment).toBe(
          '1차평가자 자기평가 완료했습니다.',
        );

        // Then - 피평가자도 자동 완료 처리되었는지 확인
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSelfRequest.id,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(true);
        expect(employeeRecipientAfter!.isRead).toBe(true);
        expect(employeeRecipientAfter!.readAt).toBeDefined();
        expect(employeeRecipientAfter!.responseComment).toBe(
          '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
        );
      });

      it('1차평가 단계에서는 다른 수신자가 자동 완료 처리되지 않아야 한다', async () => {
        // Given
        await 테스트데이터를_생성한다();

        // 1차평가 단계 재작성 요청 생성
        const primaryRevisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'primary' as RevisionRequestStepType,
          comment: '1차평가를 다시 작성해주세요.',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedPrimaryRequest = await revisionRequestRepository.save(
          primaryRevisionRequest,
        );

        // 1차평가자 수신자 생성
        const evaluatorRecipient = recipientRepository.create({
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: evaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(evaluatorRecipient);

        // 피평가자 수신자 생성 (1차평가 단계에서는 보통 피평가자에게는 요청이 가지 않지만, 테스트를 위해 추가)
        const employeeRecipient = recipientRepository.create({
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
          isRead: false,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(employeeRecipient);

        // When - 1차평가자가 완료 응답 제출 (관리자용 함수 사용)
        await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          'primary',
          '1차평가자 완료했습니다.',
        );

        // Then - 1차평가자 완료 확인
        const evaluatorRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedPrimaryRequest.id,
            recipientId: evaluatorId,
          },
        });
        expect(evaluatorRecipientAfter!.isCompleted).toBe(true);

        // Then - 피평가자는 자동 완료 처리되지 않아야 함
        const employeeRecipientAfter = await recipientRepository.findOne({
          where: {
            revisionRequestId: savedPrimaryRequest.id,
            recipientId: employeeId,
          },
        });
        expect(employeeRecipientAfter!.isCompleted).toBe(false);
      });
    });
  });

  describe('제출자에게_요청된_재작성요청을_완료처리한다', () => {
    it('제출자에게 요청된 재작성 요청이 존재하면 자동 완료 처리되어야 한다 (criteria 단계, evaluatee)', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 피평가자에게 전송된 재작성 요청 생성
      const criteriaRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'criteria' as RevisionRequestStepType,
        comment: '평가기준을 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedCriteriaRequest =
        await revisionRequestRepository.save(criteriaRequest);

      // 피평가자 수신자 생성
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: savedCriteriaRequest.id,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(employeeRecipient);

      // 1차평가자 수신자 생성
      const evaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedCriteriaRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(evaluatorRecipient);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'criteria',
        employeeId,
        RecipientType.EVALUATEE,
        '평가기준 제출로 인한 재작성 완료 처리',
      );

      // Then - 피평가자 완료 확인
      const employeeRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedCriteriaRequest.id,
          recipientId: employeeId,
        },
      });
      expect(employeeRecipientAfter!.isCompleted).toBe(true);
      expect(employeeRecipientAfter!.isRead).toBe(true);
      expect(employeeRecipientAfter!.readAt).toBeDefined();
      expect(employeeRecipientAfter!.responseComment).toBe(
        '평가기준 제출로 인한 재작성 완료 처리',
      );

      // Then - 1차평가자도 자동 완료 처리되었는지 확인 (criteria 단계)
      const evaluatorRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedCriteriaRequest.id,
          recipientId: evaluatorId,
        },
      });
      expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
      expect(evaluatorRecipientAfter!.isRead).toBe(true);
      expect(evaluatorRecipientAfter!.readAt).toBeDefined();
      expect(evaluatorRecipientAfter!.responseComment).toBe(
        '연계된 수신자의 재작성 완료로 인한 자동 완료 처리',
      );
    });

    it('제출자에게 요청된 재작성 요청이 존재하면 자동 완료 처리되어야 한다 (self 단계, evaluatee)', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 자기평가 단계 재작성 요청 생성
      const selfRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSelfRequest =
        await revisionRequestRepository.save(selfRequest);

      // 피평가자 수신자 생성
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: savedSelfRequest.id,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(employeeRecipient);

      // 1차평가자 수신자 생성
      const evaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedSelfRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(evaluatorRecipient);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'self',
        employeeId,
        RecipientType.EVALUATEE,
        '자기평가 제출로 인한 재작성 완료 처리',
      );

      // Then - 피평가자 완료 확인
      const employeeRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedSelfRequest.id,
          recipientId: employeeId,
        },
      });
      expect(employeeRecipientAfter!.isCompleted).toBe(true);
      expect(employeeRecipientAfter!.isRead).toBe(true);

      // Then - 1차평가자도 자동 완료 처리되었는지 확인 (self 단계)
      const evaluatorRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedSelfRequest.id,
          recipientId: evaluatorId,
        },
      });
      expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
      expect(evaluatorRecipientAfter!.isRead).toBe(true);
    });

    it('제출자에게 요청된 재작성 요청이 존재하면 자동 완료 처리되어야 한다 (primary 단계, primary_evaluator)', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 1차평가 단계 재작성 요청 생성
      const primaryRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary' as RevisionRequestStepType,
        comment: '1차평가를 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedPrimaryRequest =
        await revisionRequestRepository.save(primaryRequest);

      // 1차평가자 수신자 생성
      const evaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedPrimaryRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(evaluatorRecipient);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'primary',
        evaluatorId,
        RecipientType.PRIMARY_EVALUATOR,
        '1차 하향평가 제출로 인한 재작성 완료 처리',
      );

      // Then - 1차평가자 완료 확인
      const evaluatorRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: evaluatorId,
        },
      });
      expect(evaluatorRecipientAfter!.isCompleted).toBe(true);
      expect(evaluatorRecipientAfter!.isRead).toBe(true);
      expect(evaluatorRecipientAfter!.responseComment).toBe(
        '1차 하향평가 제출로 인한 재작성 완료 처리',
      );
    });

    it('제출자에게 요청된 재작성 요청이 존재하면 자동 완료 처리되어야 한다 (secondary 단계, secondary_evaluator)', async () => {
      // Given
      await 테스트데이터를_생성한다();

      const secondaryEvaluatorId = '123e4567-e89b-12d3-a456-426614174002';

      // 2차평가 단계 재작성 요청 생성
      const secondaryRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary' as RevisionRequestStepType,
        comment: '2차평가를 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSecondaryRequest =
        await revisionRequestRepository.save(secondaryRequest);

      // 2차평가자 수신자 생성
      const secondaryEvaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedSecondaryRequest.id,
        recipientId: secondaryEvaluatorId,
        recipientType: RecipientType.SECONDARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(secondaryEvaluatorRecipient);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'secondary',
        secondaryEvaluatorId,
        RecipientType.SECONDARY_EVALUATOR,
        '2차 하향평가 제출로 인한 재작성 완료 처리',
      );

      // Then - 2차평가자 완료 확인
      const secondaryEvaluatorRecipientAfter =
        await recipientRepository.findOne({
          where: {
            revisionRequestId: savedSecondaryRequest.id,
            recipientId: secondaryEvaluatorId,
          },
        });
      expect(secondaryEvaluatorRecipientAfter!.isCompleted).toBe(true);
      expect(secondaryEvaluatorRecipientAfter!.isRead).toBe(true);
      expect(secondaryEvaluatorRecipientAfter!.responseComment).toBe(
        '2차 하향평가 제출로 인한 재작성 완료 처리',
      );
    });

    it('primary/secondary 단계의 경우 다른 수신자는 자동 완료 처리되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 1차평가 단계 재작성 요청 생성
      const primaryRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary' as RevisionRequestStepType,
        comment: '1차평가를 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedPrimaryRequest =
        await revisionRequestRepository.save(primaryRequest);

      // 1차평가자 수신자 생성
      const evaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedPrimaryRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(evaluatorRecipient);

      // 피평가자 수신자 생성 (1차평가 단계에서는 보통 피평가자에게는 요청이 가지 않지만, 테스트를 위해 추가)
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: savedPrimaryRequest.id,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(employeeRecipient);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'primary',
        evaluatorId,
        RecipientType.PRIMARY_EVALUATOR,
        '1차 하향평가 제출로 인한 재작성 완료 처리',
      );

      // Then - 1차평가자 완료 확인
      const evaluatorRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: evaluatorId,
        },
      });
      expect(evaluatorRecipientAfter!.isCompleted).toBe(true);

      // Then - 피평가자는 자동 완료 처리되지 않아야 함 (primary 단계)
      const employeeRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedPrimaryRequest.id,
          recipientId: employeeId,
        },
      });
      expect(employeeRecipientAfter!.isCompleted).toBe(false);
    });

    it('재작성 요청이 없으면 아무것도 하지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 존재하지 않는 평가기간 ID 사용
      const nonExistentPeriodId = '123e4567-e89b-12d3-a456-426614174999';

      // When - 예외가 발생하지 않아야 함
      await expect(
        service.제출자에게_요청된_재작성요청을_완료처리한다(
          nonExistentPeriodId,
          employeeId,
          'criteria',
          employeeId,
          RecipientType.EVALUATEE,
          '평가기준 제출로 인한 재작성 완료 처리',
        ),
      ).resolves.not.toThrow();
    });

    it('이미 완료된 요청은 건너뛰어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 평가기준 단계 재작성 요청 생성
      const criteriaRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'criteria' as RevisionRequestStepType,
        comment: '평가기준을 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedCriteriaRequest =
        await revisionRequestRepository.save(criteriaRequest);

      // 이미 완료된 피평가자 수신자 생성
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: savedCriteriaRequest.id,
        recipientId: employeeId,
        recipientType: RecipientType.EVALUATEE,
        isRead: true,
        isCompleted: true,
        readAt: new Date(),
        completedAt: new Date(),
        responseComment: '이미 완료된 요청',
        createdBy: adminId,
      });
      await recipientRepository.save(employeeRecipient);

      // 1차평가자 수신자 생성 (미완료)
      const evaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedCriteriaRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(evaluatorRecipient);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'criteria',
        employeeId,
        RecipientType.EVALUATEE,
        '평가기준 제출로 인한 재작성 완료 처리',
      );

      // Then - 이미 완료된 요청은 그대로 유지되어야 함
      const employeeRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedCriteriaRequest.id,
          recipientId: employeeId,
        },
      });
      expect(employeeRecipientAfter!.isCompleted).toBe(true);
      expect(employeeRecipientAfter!.responseComment).toBe('이미 완료된 요청');

      // Then - 1차평가자는 완료되지 않아야 함 (피평가자가 이미 완료되어 있어서 자동 완료가 트리거되지 않음)
      const evaluatorRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedCriteriaRequest.id,
          recipientId: evaluatorId,
        },
      });
      expect(evaluatorRecipientAfter!.isCompleted).toBe(false);
    });

    it('다른 recipientType의 요청은 건너뛰어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 평가기준 단계 재작성 요청 생성
      const criteriaRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'criteria' as RevisionRequestStepType,
        comment: '평가기준을 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedCriteriaRequest =
        await revisionRequestRepository.save(criteriaRequest);

      // 1차평가자 수신자만 생성 (evaluatee는 없음)
      const evaluatorRecipient = recipientRepository.create({
        revisionRequestId: savedCriteriaRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(evaluatorRecipient);

      // When - evaluatee 타입으로 요청하지만 실제로는 primary_evaluator만 존재
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'criteria',
        employeeId,
        RecipientType.EVALUATEE,
        '평가기준 제출로 인한 재작성 완료 처리',
      );

      // Then - 1차평가자는 완료되지 않아야 함 (다른 recipientType이므로)
      const evaluatorRecipientAfter = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedCriteriaRequest.id,
          recipientId: evaluatorId,
        },
      });
      expect(evaluatorRecipientAfter!.isCompleted).toBe(false);
    });

    it('여러 재작성 요청이 있는 경우 모두 처리되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 첫 번째 재작성 요청 생성
      const request1 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary' as RevisionRequestStepType,
        comment: '1차평가를 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedRequest1 = await revisionRequestRepository.save(request1);

      const recipient1 = recipientRepository.create({
        revisionRequestId: savedRequest1.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(recipient1);

      // 두 번째 재작성 요청 생성
      const request2 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary' as RevisionRequestStepType,
        comment: '다른 1차평가를 다시 작성해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedRequest2 = await revisionRequestRepository.save(request2);

      const recipient2 = recipientRepository.create({
        revisionRequestId: savedRequest2.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(recipient2);

      // When
      await service.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'primary',
        evaluatorId,
        RecipientType.PRIMARY_EVALUATOR,
        '1차 하향평가 제출로 인한 재작성 완료 처리',
      );

      // Then - 두 요청 모두 완료되어야 함
      const recipient1After = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedRequest1.id,
          recipientId: evaluatorId,
        },
      });
      expect(recipient1After!.isCompleted).toBe(true);

      const recipient2After = await recipientRepository.findOne({
        where: {
          revisionRequestId: savedRequest2.id,
          recipientId: evaluatorId,
        },
      });
      expect(recipient2After!.isCompleted).toBe(true);
    });
  });
});
