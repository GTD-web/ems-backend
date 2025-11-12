import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
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
 * 내_재작성요청목록을_조회한다 테스트
 *
 * 이 테스트는 수정된 코드가 다음 시나리오를 안전하게 처리하는지 확인합니다:
 * 1. 정상적인 내 재작성 요청 목록 조회
 * 2. revisionRequest가 null인 경우 (데이터 무결성 문제)
 * 3. 빈 목록 반환
 * 4. 필터링 옵션 적용
 */
describe('내_재작성요청목록을_조회한다', () => {
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
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. 부서 생성
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

    // 2. 평가기간 생성
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

    // 3. 피평가자 직원 생성
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

    // 4. 평가자 직원 생성
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

    // 4-2. 단계 승인 생성
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

  describe('정상 케이스', () => {
    it('내가 수신한 재작성 요청 목록을 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.id).toBe(revisionRequestId);
      expect(requests[0].request.step).toBe('criteria');
      expect(requests[0].request.comment).toBe('평가기준을 다시 작성해주세요.');
      expect(requests[0].recipientInfo.recipientId).toBe(evaluatorId);
      expect(requests[0].employee.name).toBe('김피평가');
      expect(requests[0].evaluationPeriod.name).toContain('2024년 상반기 평가');
    });

    it('여러 재작성 요청이 있을 경우 모두 조회되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 추가 재작성 요청 생성
      const secondRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSecondRequest =
        await revisionRequestRepository.save(secondRequest);

      const secondRecipient = recipientRepository.create({
        revisionRequestId: savedSecondRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(secondRecipient);

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then
      expect(requests.length).toBe(2);
      const steps = requests.map((r) => r.request.step);
      expect(steps).toContain('criteria');
      expect(steps).toContain('self');
    });
  });

  describe('필터링', () => {
    it('evaluationPeriodId로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId, {
        evaluationPeriodId: evaluationPeriodId,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].request.evaluationPeriodId).toBe(evaluationPeriodId);
    });

    it('isRead=false로 읽지 않은 요청만 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 읽은 요청 추가 생성
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

      // When
      const unreadRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { isRead: false },
      );

      // Then
      expect(unreadRequests.length).toBe(1);
      expect(unreadRequests[0].recipientInfo.isRead).toBe(false);
      expect(unreadRequests[0].request.step).toBe('criteria');
    });

    it('isCompleted=false로 미완료 요청만 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 완료된 요청 추가 생성
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

      // When
      const incompleteRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { isCompleted: false },
      );

      // Then
      expect(incompleteRequests.length).toBe(1);
      expect(incompleteRequests[0].recipientInfo.isCompleted).toBe(false);
      expect(incompleteRequests[0].request.step).toBe('criteria');
    });

    it('step으로 필터링하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 다른 단계 요청 추가
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
      const criteriaRequests = await service.내_재작성요청목록을_조회한다(
        evaluatorId,
        { step: 'criteria' as RevisionRequestStepType },
      );

      // Then
      expect(criteriaRequests.length).toBe(1);
      expect(criteriaRequests[0].request.step).toBe('criteria');
    });
  });

  describe('엣지 케이스', () => {
    it('수신한 요청이 없을 경우 빈 배열을 반환해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const otherUserId = '123e4567-e89b-12d3-a456-426614174999';

      // When
      const requests = await service.내_재작성요청목록을_조회한다(otherUserId);

      // Then
      expect(requests).toEqual([]);
      expect(Array.isArray(requests)).toBe(true);
    });

    it('재작성 요청이 soft delete된 후에도 수신자가 남아있는 경우 안전하게 처리되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 추가 재작성 요청 및 수신자 생성
      const secondRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'self' as RevisionRequestStepType,
        comment: '자기평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: new Date(),
        createdBy: adminId,
      });
      const savedSecondRequest =
        await revisionRequestRepository.save(secondRequest);

      const secondRecipient = recipientRepository.create({
        revisionRequestId: savedSecondRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: adminId,
      });
      await recipientRepository.save(secondRecipient);

      // 두 번째 재작성 요청만 soft delete (수신자는 삭제하지 않음)
      // 이는 데이터 무결성 문제 시뮬레이션
      await revisionRequestRepository.update(savedSecondRequest.id, {
        deletedAt: new Date(),
      });

      // When - 에러가 발생하지 않아야 함
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then - 삭제된 요청은 제외되고 정상적인 요청만 반환
      expect(requests.length).toBe(1);
      expect(requests[0].request.id).toBe(revisionRequestId);
      expect(requests[0].request.step).toBe('criteria');
    });

    it('삭제된 재작성 요청은 결과에 포함되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 재작성 요청 soft delete
      await revisionRequestRepository.update(revisionRequestId, {
        deletedAt: new Date(),
      });

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then
      expect(requests.length).toBe(0);
    });

    it('삭제된 수신자는 결과에 포함되지 않아야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 수신자 조회
      const recipient = await recipientRepository.findOne({
        where: {
          revisionRequestId: revisionRequestId,
          recipientId: evaluatorId,
        },
      });

      // 수신자 soft delete
      if (recipient) {
        await recipientRepository.update(recipient.id, {
          deletedAt: new Date(),
        });
      }

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then
      expect(requests.length).toBe(0);
    });

    it('삭제된 직원은 건너뛰고 다른 요청만 반환해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 직원 soft delete
      await employeeRepository.update(employeeId, {
        deletedAt: new Date(),
      });

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then
      expect(requests.length).toBe(0); // 직원이 삭제되면 해당 요청은 표시되지 않음
    });

    it('삭제된 평가기간은 건너뛰고 다른 요청만 반환해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 평가기간 soft delete
      await evaluationPeriodRepository.update(evaluationPeriodId, {
        deletedAt: new Date(),
      });

      // When
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId);

      // Then
      expect(requests.length).toBe(0); // 평가기간이 삭제되면 해당 요청은 표시되지 않음
    });
  });

  describe('복합 조건', () => {
    it('여러 필터를 조합하여 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 다양한 조건의 요청 추가
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

      // When - 읽지 않은 + criteria 단계만 조회
      const requests = await service.내_재작성요청목록을_조회한다(evaluatorId, {
        isRead: false,
        step: 'criteria' as RevisionRequestStepType,
      });

      // Then
      expect(requests.length).toBe(1);
      expect(requests[0].recipientInfo.isRead).toBe(false);
      expect(requests[0].request.step).toBe('criteria');
    });
  });
});
