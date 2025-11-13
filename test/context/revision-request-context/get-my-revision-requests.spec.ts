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
import * as fs from 'fs';
import * as path from 'path';

/**
 * 내_재작성요청목록을_조회한다 테스트
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
  let recipientId: string;
  let otherRecipientId: string;
  let departmentId: string;
  let adminId: string;
  let revisionRequestId: string;
  let mappingId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

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

    // 4. 수신자 직원 생성 (unique 값 사용)
    const recipient = employeeRepository.create({
      name: '이수신자',
      employeeNumber: `EMP002-${uniqueSuffix}`,
      email: `recipient-${uniqueSuffix}@test.com`,
      externalId: `EXT002-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedRecipient = await employeeRepository.save(recipient);
    recipientId = savedRecipient.id;

    // 5. 다른 수신자 직원 생성 (unique 값 사용)
    const otherRecipient = employeeRepository.create({
      name: '박다른수신자',
      employeeNumber: `EMP003-${uniqueSuffix}`,
      email: `other-recipient-${uniqueSuffix}@test.com`,
      externalId: `EXT003-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedOtherRecipient = await employeeRepository.save(otherRecipient);
    otherRecipientId = savedOtherRecipient.id;

    // 6. 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 7. 단계 승인 생성 (revision_requested 상태)
    const stepApproval = stepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      criteriaSettingStatus: StepApprovalStatus.REVISION_REQUESTED,
      selfEvaluationStatus: StepApprovalStatus.PENDING,
      primaryEvaluationStatus: StepApprovalStatus.PENDING,
      secondaryEvaluationStatus: StepApprovalStatus.PENDING,
      createdBy: systemAdminId,
    });
    await stepApprovalRepository.save(stepApproval);

    // 8. 재작성 요청 생성
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

    // 9. 수신자 생성
    const recipientEntity = recipientRepository.create({
      revisionRequestId: revisionRequestId,
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipientEntity);
  }

  it('내 재작성 요청 목록을 조회할 수 있어야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {});

    // Then
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0].request.id).toBe(revisionRequestId);
    expect(requests[0].request.step).toBe('criteria');
    expect(requests[0].request.comment).toBe('평가기준을 다시 작성해주세요.');
    expect(requests[0].request.requestedBy).toBe(adminId);
    expect(requests[0].evaluationPeriod.name).toContain('2024년 상반기 평가');
    expect(requests[0].employee.name).toBe('김피평가');
    expect(requests[0].recipientInfo.recipientId).toBe(recipientId);

    // 테스트 결과 저장
    testResults.push({
      testName: '내 재작성 요청 목록을 조회할 수 있어야 한다',
      result: {
        recipientId,
        requestCount: requests.length,
        firstRequest: {
          requestId: requests[0].request.id,
          step: requests[0].request.step,
          comment: requests[0].request.comment,
          employeeName: requests[0].employee.name,
          evaluationPeriodName: requests[0].evaluationPeriod.name,
        },
      },
    });
  });

  it('다른 수신자의 요청은 조회되지 않아야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // 다른 수신자에게 할당된 요청 생성
    const otherRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'self' as RevisionRequestStepType,
      comment: '자기평가를 수정해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedOtherRequest = await revisionRequestRepository.save(otherRequest);

    const otherRecipientEntity = recipientRepository.create({
      revisionRequestId: savedOtherRequest.id,
      recipientId: otherRecipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(otherRecipientEntity);

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {});

    // Then
    expect(requests.length).toBe(1);
    expect(requests[0].recipientInfo.recipientId).toBe(recipientId);
    expect(requests[0].request.id).toBe(revisionRequestId);
    // otherRecipientId에게 할당된 요청은 조회되지 않아야 함
    const otherRecipientRequestIds = requests
      .filter((r) => r.recipientInfo.recipientId === otherRecipientId)
      .map((r) => r.request.id);
    expect(otherRecipientRequestIds).not.toContain(savedOtherRequest.id);

    // 테스트 결과 저장
    testResults.push({
      testName: '다른 수신자의 요청은 조회되지 않아야 한다',
      result: {
        recipientId,
        otherRecipientId,
        requestCount: requests.length,
        filteredRequestId: requests[0].request.id,
        otherRecipientRequestCount: otherRecipientRequestIds.length,
        otherRecipientRequestExcluded: !otherRecipientRequestIds.includes(savedOtherRequest.id),
      },
    });
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

    const otherRecipientEntity = recipientRepository.create({
      revisionRequestId: savedOtherRequest.id,
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(otherRecipientEntity);

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {
      evaluationPeriodId: evaluationPeriodId,
    });

    // Then
    expect(requests.length).toBe(1);
    expect(requests[0].request.evaluationPeriodId).toBe(evaluationPeriodId);
    expect(requests[0].request.step).toBe('criteria');

    // 테스트 결과 저장
    testResults.push({
      testName: 'evaluationPeriodId로 필터링하여 조회할 수 있어야 한다',
      result: {
        recipientId,
        filterEvaluationPeriodId: evaluationPeriodId,
        requestCount: requests.length,
        filteredStep: requests[0].request.step,
      },
    });
  });

  it('employeeId로 필터링하여 조회할 수 있어야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // 다른 직원 생성
    const otherEmployee = employeeRepository.create({
      name: '박다른직원',
      employeeNumber: 'EMP004',
      email: 'other@test.com',
      externalId: 'EXT004',
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
    const savedOtherRequest = await revisionRequestRepository.save(otherRequest);

    const otherRecipientEntity = recipientRepository.create({
      revisionRequestId: savedOtherRequest.id,
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(otherRecipientEntity);

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {
      employeeId: employeeId,
    });

    // Then
    expect(requests.length).toBe(1);
    expect(requests[0].request.employeeId).toBe(employeeId);
    expect(requests[0].employee.name).toBe('김피평가');

    // 테스트 결과 저장
    testResults.push({
      testName: 'employeeId로 필터링하여 조회할 수 있어야 한다',
      result: {
        recipientId,
        filterEmployeeId: employeeId,
        requestCount: requests.length,
        employeeName: requests[0].employee.name,
      },
    });
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
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: true,
      readAt: new Date(),
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(readRecipient);

    // When - 읽지 않은 요청만 조회
    const unreadRequests = await service.내_재작성요청목록을_조회한다(
      recipientId,
      {
        isRead: false,
      },
    );

    // When - 읽은 요청만 조회
    const readRequests = await service.내_재작성요청목록을_조회한다(
      recipientId,
      {
        isRead: true,
      },
    );

    // Then
    expect(unreadRequests.length).toBe(1);
    expect(unreadRequests[0].recipientInfo.isRead).toBe(false);
    expect(unreadRequests[0].request.id).toBe(revisionRequestId);

    expect(readRequests.length).toBe(1);
    expect(readRequests[0].recipientInfo.isRead).toBe(true);
    expect(readRequests[0].request.id).toBe(savedReadRequest.id);

    // 테스트 결과 저장
    testResults.push({
      testName: 'isRead로 필터링하여 조회할 수 있어야 한다',
      result: {
        recipientId,
        unreadCount: unreadRequests.length,
        readCount: readRequests.length,
      },
    });
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
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: true,
      isCompleted: true,
      completedAt: new Date(),
      responseComment: '수정 완료했습니다.',
      createdBy: adminId,
    });
    await recipientRepository.save(completedRecipient);

    // When - 미완료 요청만 조회
    const incompleteRequests = await service.내_재작성요청목록을_조회한다(
      recipientId,
      {
        isCompleted: false,
      },
    );

    // When - 완료된 요청만 조회
    const completedRequests = await service.내_재작성요청목록을_조회한다(
      recipientId,
      {
        isCompleted: true,
      },
    );

    // Then
    expect(incompleteRequests.length).toBe(1);
    expect(incompleteRequests[0].recipientInfo.isCompleted).toBe(false);
    expect(incompleteRequests[0].request.id).toBe(revisionRequestId);

    expect(completedRequests.length).toBe(1);
    expect(completedRequests[0].recipientInfo.isCompleted).toBe(true);
    expect(completedRequests[0].recipientInfo.responseComment).toBe(
      '수정 완료했습니다.',
    );
    expect(completedRequests[0].request.id).toBe(savedCompletedRequest.id);

    // 테스트 결과 저장
    testResults.push({
      testName: 'isCompleted로 필터링하여 조회할 수 있어야 한다',
      result: {
        recipientId,
        incompleteCount: incompleteRequests.length,
        completedCount: completedRequests.length,
      },
    });
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
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(selfRecipient);

    // When
    const criteriaRequests = await service.내_재작성요청목록을_조회한다(
      recipientId,
      {
        step: 'criteria' as RevisionRequestStepType,
      },
    );

    const selfRequests = await service.내_재작성요청목록을_조회한다(
      recipientId,
      {
        step: 'self' as RevisionRequestStepType,
      },
    );

    // Then
    expect(criteriaRequests.length).toBe(1);
    expect(criteriaRequests[0].request.step).toBe('criteria');
    expect(criteriaRequests[0].request.id).toBe(revisionRequestId);

    expect(selfRequests.length).toBe(1);
    expect(selfRequests[0].request.step).toBe('self');
    expect(selfRequests[0].request.id).toBe(savedSelfRequest.id);

    // 테스트 결과 저장
    testResults.push({
      testName: 'step으로 필터링하여 조회할 수 있어야 한다',
      result: {
        recipientId,
        criteriaCount: criteriaRequests.length,
        selfCount: selfRequests.length,
      },
    });
  });

  it('여러 필터를 조합하여 조회할 수 있어야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {
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

    // 테스트 결과 저장
    testResults.push({
      testName: '여러 필터를 조합하여 조회할 수 있어야 한다',
      result: {
        recipientId,
        filters: {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
          isRead: false,
          isCompleted: false,
        },
        requestCount: requests.length,
      },
    });
  });

  it('조건에 맞는 요청이 없으면 빈 배열을 반환해야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // When - 존재하지 않는 평가기간으로 필터링
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {
      evaluationPeriodId: '123e4567-e89b-12d3-a456-426614174999',
    });

    // Then
    expect(requests.length).toBe(0);
    expect(Array.isArray(requests)).toBe(true);

    // 테스트 결과 저장
    testResults.push({
      testName: '조건에 맞는 요청이 없으면 빈 배열을 반환해야 한다',
      result: {
        recipientId,
        requestCount: requests.length,
      },
    });
  });

  it('revisionRequest가 null인 경우 건너뛰어야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // 삭제된 재작성 요청에 대한 수신자 생성
    const deletedRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'self' as RevisionRequestStepType,
      comment: '삭제될 요청',
      requestedBy: adminId,
      requestedAt: new Date(),
      deletedAt: new Date(), // 삭제 처리
      createdBy: adminId,
    });
    const savedDeletedRequest =
      await revisionRequestRepository.save(deletedRequest);

    const recipientForDeletedRequest = recipientRepository.create({
      revisionRequestId: savedDeletedRequest.id,
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipientForDeletedRequest);

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {});

    // Then
    // 삭제된 요청은 제외되어야 하므로 원래 요청만 반환
    expect(requests.length).toBe(1);
    expect(requests[0].request.id).toBe(revisionRequestId);
    expect(requests[0].request.deletedAt).toBeNull();

    // 테스트 결과 저장
    testResults.push({
      testName: 'revisionRequest가 null인 경우 건너뛰어야 한다',
      result: {
        recipientId,
        requestCount: requests.length,
        filteredRequestId: requests[0].request.id,
      },
    });
  });

  it('employee가 없는 경우 건너뛰어야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // 직원이 삭제된 재작성 요청 생성
    const requestWithDeletedEmployee = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: '123e4567-e89b-12d3-a456-426614174999', // 존재하지 않는 직원 ID
      step: 'self' as RevisionRequestStepType,
      comment: '직원이 없는 요청',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequestWithDeletedEmployee =
      await revisionRequestRepository.save(requestWithDeletedEmployee);

    const recipientForDeletedEmployee = recipientRepository.create({
      revisionRequestId: savedRequestWithDeletedEmployee.id,
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipientForDeletedEmployee);

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {});

    // Then
    // 직원이 없는 요청은 제외되어야 하므로 원래 요청만 반환
    expect(requests.length).toBe(1);
    expect(requests[0].request.id).toBe(revisionRequestId);
    expect(requests[0].employee.id).toBe(employeeId);

    // 테스트 결과 저장
    testResults.push({
      testName: 'employee가 없는 경우 건너뛰어야 한다',
      result: {
        recipientId,
        requestCount: requests.length,
        filteredRequestId: requests[0].request.id,
      },
    });
  });

  it('evaluationPeriod가 없는 경우 건너뛰어야 한다', async () => {
    // Given
    await 테스트데이터를_생성한다();

    // 평가기간이 삭제된 재작성 요청 생성
    const requestWithDeletedPeriod = revisionRequestRepository.create({
      evaluationPeriodId: '123e4567-e89b-12d3-a456-426614174999', // 존재하지 않는 평가기간 ID
      employeeId: employeeId,
      step: 'self' as RevisionRequestStepType,
      comment: '평가기간이 없는 요청',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequestWithDeletedPeriod =
      await revisionRequestRepository.save(requestWithDeletedPeriod);

    const recipientForDeletedPeriod = recipientRepository.create({
      revisionRequestId: savedRequestWithDeletedPeriod.id,
      recipientId: recipientId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipientForDeletedPeriod);

    // When
    const requests = await service.내_재작성요청목록을_조회한다(recipientId, {});

    // Then
    // 평가기간이 없는 요청은 제외되어야 하므로 원래 요청만 반환
    expect(requests.length).toBe(1);
    expect(requests[0].request.id).toBe(revisionRequestId);
    expect(requests[0].evaluationPeriod.id).toBe(evaluationPeriodId);

    // 테스트 결과 저장
    testResults.push({
      testName: 'evaluationPeriod가 없는 경우 건너뛰어야 한다',
      result: {
        recipientId,
        requestCount: requests.length,
        filteredRequestId: requests[0].request.id,
      },
    });
  });

  afterAll(() => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'get-my-revision-requests-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(
      `✅ 테스트 결과가 저장되었습니다: ${outputPath}`,
    );
  });
});

