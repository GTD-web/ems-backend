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
import { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.types';
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
    mappingRepository = dataSource.getRepository(EvaluationPeriodEmployeeMapping);
    stepApprovalRepository = dataSource.getRepository(EmployeeEvaluationStepApproval);
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
      recipientType: 'primary_evaluator',
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
      const savedOtherPeriod = await evaluationPeriodRepository.save(otherPeriod);

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
      const savedOtherRequest = await revisionRequestRepository.save(otherRequest);

      const otherRecipient = recipientRepository.create({
        revisionRequestId: savedOtherRequest.id,
        recipientId: evaluatorId,
        recipientType: 'primary_evaluator',
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
      const savedOtherRequest = await revisionRequestRepository.save(otherRequest);

      const otherRecipient = recipientRepository.create({
        revisionRequestId: savedOtherRequest.id,
        recipientId: evaluatorId,
        recipientType: 'primary_evaluator',
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
      const savedReadRequest = await revisionRequestRepository.save(readRequest);

      const readRecipient = recipientRepository.create({
        revisionRequestId: savedReadRequest.id,
        recipientId: evaluatorId,
        recipientType: 'primary_evaluator',
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
      const savedCompletedRequest = await revisionRequestRepository.save(
        completedRequest,
      );

      const completedRecipient = recipientRepository.create({
        revisionRequestId: savedCompletedRequest.id,
        recipientId: evaluatorId,
        recipientType: 'primary_evaluator',
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
      const savedSelfRequest = await revisionRequestRepository.save(selfRequest);

      const selfRecipient = recipientRepository.create({
        revisionRequestId: savedSelfRequest.id,
        recipientId: evaluatorId,
        recipientType: 'primary_evaluator',
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
        recipientType: 'evaluatee',
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
        recipientType: 'evaluatee',
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
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId, {});

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
      const requests = await service.내_재작성요청목록을_조회한다(otherUserId, {});

      // Then
      expect(requests.length).toBe(0);
    });
  });

  describe('읽지않은_재작성요청수를_조회한다', () => {
    it('수신자의 읽지 않은 재작성 요청 개수를 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const count = await service.읽지않은_재작성요청수를_조회한다(
        evaluatorId,
      );

      // Then
      expect(count).toBe(1);
    });

    it('읽은 요청은 개수에 포함되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 요청을 읽음 처리
      await service.재작성요청을_읽음처리한다(revisionRequestId, evaluatorId);

      // When
      const count = await service.읽지않은_재작성요청수를_조회한다(
        evaluatorId,
      );

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

    it('모든 수신자가 완료해야만 단계 승인 상태가 revision_completed로 변경되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 피평가자도 수신자로 추가
      const employeeRecipient = recipientRepository.create({
        revisionRequestId: revisionRequestId,
        recipientId: employeeId,
        recipientType: 'evaluatee',
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

      // Then - 아직 피평가자가 완료하지 않았으므로 상태는 변경되지 않아야 함
      const afterFirstStepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(afterFirstStepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // When - 피평가자도 완료 응답 제출
      await service.재작성완료_응답을_제출한다(
        revisionRequestId,
        employeeId,
        '피평가자 완료했습니다.',
      );

      // Then - 모든 수신자가 완료했으므로 상태가 revision_completed로 변경되어야 함
      const afterSecondStepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(afterSecondStepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_COMPLETED,
      );
    });
  });

  describe('복합 시나리오', () => {
    it('여러 수신자가 있는 재작성 요청을 각각 처리할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 추가 수신자 생성 (피평가자)
      const additionalRecipient = recipientRepository.create({
        revisionRequestId: revisionRequestId,
        recipientId: employeeId,
        recipientType: 'evaluatee',
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

      expect(evaluatorRecipient!.isRead).toBe(true);
      expect(evaluatorRecipient!.isCompleted).toBe(false);

      expect(employeeRecipient!.isRead).toBe(true);
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
      const savedCompletedRequest = await revisionRequestRepository.save(
        completedRequest,
      );

      const completedRecipient = recipientRepository.create({
        revisionRequestId: savedCompletedRequest.id,
        recipientId: evaluatorId,
        recipientType: 'primary_evaluator',
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
});

