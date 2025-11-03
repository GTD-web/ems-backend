import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.types';

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
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let evaluatorId: string;
  let departmentId: string;
  let adminId: string;
  let revisionRequestId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
        ]),
        EvaluationRevisionRequestModule,
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
    // Repository를 사용하여 안전하게 삭제
    try {
      const recipients = await recipientRepository.find();
      await recipientRepository.remove(recipients);

      const revisionRequests = await revisionRequestRepository.find();
      await revisionRequestRepository.remove(revisionRequests);

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
   * 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트데이터를_생성한다(): Promise<void> {
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

    // 3. 피평가자 직원 생성
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

    // 4. 평가자 직원 생성
    const evaluator = employeeRepository.create({
      name: '이평가자',
      employeeNumber: 'EMP002',
      email: 'evaluator@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator = await employeeRepository.save(evaluator);
    evaluatorId = savedEvaluator.id;

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
      expect(requests[0].evaluationPeriod.name).toBe('2024년 상반기 평가');
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

