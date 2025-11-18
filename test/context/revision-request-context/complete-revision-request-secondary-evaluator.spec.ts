import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApprovalModule } from '@domain/sub/secondary-evaluation-step-approval';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { SecondaryEvaluationStepApproval } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
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
 * 2차 평가자 재작성 완료 응답 제출 시 개별 승인 상태 변경 검증 테스트
 */
describe('재작성 완료 응답 제출 - 2차 평가자 개별 승인 상태 변경', () => {
  let service: RevisionRequestContextService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;
  let departmentId: string;
  let adminId: string;
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
          SecondaryEvaluationStepApproval,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
        ]),
        EvaluationRevisionRequestModule,
        EmployeeEvaluationStepApprovalModule,
        SecondaryEvaluationStepApprovalModule,
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
    secondaryStepApprovalRepository = dataSource.getRepository(
      SecondaryEvaluationStepApproval,
    );
    revisionRequestRepository = dataSource.getRepository(
      EvaluationRevisionRequest,
    );
    recipientRepository = dataSource.getRepository(
      EvaluationRevisionRequestRecipient,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'complete-revision-request-secondary-evaluator-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      await dataSource.query(
        'DELETE FROM evaluation_revision_request_recipient WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
      );
      await dataSource.query(
        'DELETE FROM evaluation_revision_request WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
      );
      await secondaryStepApprovalRepository.delete({});
      await stepApprovalRepository.delete({});
      await mappingRepository.delete({});
      await evaluationPeriodRepository.delete({});
      await employeeRepository.delete({});
      await departmentRepository.delete({});
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 기본 테스트 데이터 생성
   */
  async function 기본_테스트데이터를_생성한다(): Promise<void> {
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

    // 4. 2차 평가자 1 생성
    const evaluator1 = employeeRepository.create({
      name: '이2차평가자1',
      employeeNumber: `EMP002-${uniqueSuffix}`,
      email: `evaluator1-${uniqueSuffix}@test.com`,
      externalId: `EXT002-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator1 = await employeeRepository.save(evaluator1);
    secondaryEvaluatorId1 = savedEvaluator1.id;

    // 5. 2차 평가자 2 생성
    const evaluator2 = employeeRepository.create({
      name: '이2차평가자2',
      employeeNumber: `EMP003-${uniqueSuffix}`,
      email: `evaluator2-${uniqueSuffix}@test.com`,
      externalId: `EXT003-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator2 = await employeeRepository.save(evaluator2);
    secondaryEvaluatorId2 = savedEvaluator2.id;

    // 6. 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 7. 단계 승인 생성
    const stepApproval = stepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      criteriaSettingStatus: StepApprovalStatus.PENDING,
      selfEvaluationStatus: StepApprovalStatus.PENDING,
      primaryEvaluationStatus: StepApprovalStatus.PENDING,
      secondaryEvaluationStatus: StepApprovalStatus.PENDING,
      createdBy: systemAdminId,
    });
    await stepApprovalRepository.save(stepApproval);

    adminId = systemAdminId;
  }

  it('2차 평가자가 재작성 완료 응답을 제출하면 개별 승인 상태가 REVISION_COMPLETED로 변경되어야 한다', async () => {
    // Given
    await 기본_테스트데이터를_생성한다();

    // 재작성 요청 생성
    const revisionRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'secondary' as RevisionRequestStepType,
      comment: '2차 평가를 다시 작성해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequest = await revisionRequestRepository.save(revisionRequest);

    // 수신자 생성 (2차 평가자 1)
    const recipient = recipientRepository.create({
      revisionRequestId: savedRequest.id,
      recipientId: secondaryEvaluatorId1,
      recipientType: RecipientType.SECONDARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient);

    // When - 재작성 완료 응답 제출
    await service.재작성완료_응답을_제출한다_내부(
      savedRequest.id,
      secondaryEvaluatorId1,
      '재작성 완료했습니다.',
    );

    // Then - 개별 승인 상태가 REVISION_COMPLETED로 변경되었는지 확인
    const secondaryApproval = await secondaryStepApprovalRepository.findOne({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: secondaryEvaluatorId1,
        deletedAt: IsNull(),
      },
    });

    expect(secondaryApproval).not.toBeNull();
    expect(secondaryApproval!.status).toBe(
      StepApprovalStatus.REVISION_COMPLETED,
    );
    expect(secondaryApproval!.revisionRequestId).toBe(savedRequest.id);

    // 수신자도 완료 상태인지 확인
    const updatedRecipient = await recipientRepository.findOne({
      where: { id: recipient.id },
    });
    expect(updatedRecipient).not.toBeNull();
    expect(updatedRecipient!.isCompleted).toBe(true);
    expect(updatedRecipient!.responseComment).toBe('재작성 완료했습니다.');

    // 테스트 결과 저장
    testResults.push({
      testName:
        '2차 평가자가 재작성 완료 응답을 제출하면 개별 승인 상태가 REVISION_COMPLETED로 변경되어야 한다',
      result: {
        evaluatorId: secondaryEvaluatorId1,
        revisionRequestId: savedRequest.id,
        secondaryApprovalStatus: secondaryApproval!.status,
        revisionRequestIdMatched:
          secondaryApproval!.revisionRequestId === savedRequest.id,
        recipientCompleted: updatedRecipient!.isCompleted,
        passed: true,
      },
    });
  });

  it('기존 개별 승인 상태가 있는 경우에도 REVISION_COMPLETED로 업데이트되어야 한다', async () => {
    // Given
    await 기본_테스트데이터를_생성한다();

    // 기존 개별 승인 상태 생성 (REVISION_REQUESTED 상태)
    const existingApproval = secondaryStepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      evaluatorId: secondaryEvaluatorId1,
      status: StepApprovalStatus.REVISION_REQUESTED,
      createdBy: adminId,
    });
    await secondaryStepApprovalRepository.save(existingApproval);

    // 재작성 요청 생성
    const revisionRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'secondary' as RevisionRequestStepType,
      comment: '2차 평가를 다시 작성해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequest = await revisionRequestRepository.save(revisionRequest);

    // 수신자 생성
    const recipient = recipientRepository.create({
      revisionRequestId: savedRequest.id,
      recipientId: secondaryEvaluatorId1,
      recipientType: RecipientType.SECONDARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient);

    // When - 재작성 완료 응답 제출
    await service.재작성완료_응답을_제출한다_내부(
      savedRequest.id,
      secondaryEvaluatorId1,
      '재작성 완료했습니다.',
    );

    // Then - 기존 승인 상태가 REVISION_COMPLETED로 업데이트되었는지 확인
    const updatedApproval = await secondaryStepApprovalRepository.findOne({
      where: {
        id: existingApproval.id,
        deletedAt: IsNull(),
      },
    });

    expect(updatedApproval).not.toBeNull();
    expect(updatedApproval!.id).toBe(existingApproval.id); // 같은 레코드
    expect(updatedApproval!.status).toBe(StepApprovalStatus.REVISION_COMPLETED);
    expect(updatedApproval!.revisionRequestId).toBe(savedRequest.id);

    // 테스트 결과 저장
    testResults.push({
      testName:
        '기존 개별 승인 상태가 있는 경우에도 REVISION_COMPLETED로 업데이트되어야 한다',
      result: {
        existingApprovalId: existingApproval.id,
        updatedApprovalId: updatedApproval!.id,
        sameRecord: updatedApproval!.id === existingApproval.id,
        previousStatus: StepApprovalStatus.REVISION_REQUESTED,
        updatedStatus: updatedApproval!.status,
        revisionRequestId: updatedApproval!.revisionRequestId,
        passed: true,
      },
    });
  });

  it('여러 2차 평가자 중 특정 평가자만 재작성 완료 응답을 제출하면 해당 평가자만 상태가 변경되어야 한다', async () => {
    // Given
    await 기본_테스트데이터를_생성한다();

    // 재작성 요청 생성
    const revisionRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'secondary' as RevisionRequestStepType,
      comment: '2차 평가를 다시 작성해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequest = await revisionRequestRepository.save(revisionRequest);

    // 수신자 1 생성 (2차 평가자 1)
    const recipient1 = recipientRepository.create({
      revisionRequestId: savedRequest.id,
      recipientId: secondaryEvaluatorId1,
      recipientType: RecipientType.SECONDARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient1);

    // 수신자 2 생성 (2차 평가자 2)
    const recipient2 = recipientRepository.create({
      revisionRequestId: savedRequest.id,
      recipientId: secondaryEvaluatorId2,
      recipientType: RecipientType.SECONDARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient2);

    // When - 평가자 1만 재작성 완료 응답 제출
    await service.재작성완료_응답을_제출한다_내부(
      savedRequest.id,
      secondaryEvaluatorId1,
      '재작성 완료했습니다.',
    );

    // Then - 평가자 1의 상태만 변경되었는지 확인
    const approval1 = await secondaryStepApprovalRepository.findOne({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: secondaryEvaluatorId1,
        deletedAt: IsNull(),
      },
    });

    const approval2 = await secondaryStepApprovalRepository.findOne({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: secondaryEvaluatorId2,
        deletedAt: IsNull(),
      },
    });

    expect(approval1).not.toBeNull();
    expect(approval1!.status).toBe(StepApprovalStatus.REVISION_COMPLETED);
    expect(approval1!.revisionRequestId).toBe(savedRequest.id);

    expect(approval2).toBeNull(); // 평가자 2는 아직 상태가 없음

    // 수신자 상태 확인
    const updatedRecipient1 = await recipientRepository.findOne({
      where: { id: recipient1.id },
    });
    const updatedRecipient2 = await recipientRepository.findOne({
      where: { id: recipient2.id },
    });

    expect(updatedRecipient1!.isCompleted).toBe(true);
    expect(updatedRecipient2!.isCompleted).toBe(false);

    // 테스트 결과 저장
    testResults.push({
      testName:
        '여러 2차 평가자 중 특정 평가자만 재작성 완료 응답을 제출하면 해당 평가자만 상태가 변경되어야 한다',
      result: {
        evaluator1Id: secondaryEvaluatorId1,
        evaluator2Id: secondaryEvaluatorId2,
        evaluator1Status: approval1!.status,
        evaluator1HasStatus: approval1 !== null,
        evaluator2HasStatus: approval2 !== null,
        recipient1Completed: updatedRecipient1!.isCompleted,
        recipient2Completed: updatedRecipient2!.isCompleted,
        passed: true,
      },
    });
  });

  it('2차 평가자가 아닌 경우 개별 승인 상태가 변경되지 않아야 한다', async () => {
    // Given
    await 기본_테스트데이터를_생성한다();

    // 1차 평가자 생성
    const primaryEvaluator = employeeRepository.create({
      name: '이1차평가자',
      employeeNumber: `EMP004-${Date.now()}`,
      email: `primary-${Date.now()}@test.com`,
      externalId: `EXT004-${Date.now()}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator =
      await employeeRepository.save(primaryEvaluator);
    const primaryEvaluatorId = savedPrimaryEvaluator.id;

    // 재작성 요청 생성 (primary 단계)
    const revisionRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'primary' as RevisionRequestStepType,
      comment: '1차 평가를 다시 작성해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequest = await revisionRequestRepository.save(revisionRequest);

    // 수신자 생성 (1차 평가자)
    const recipient = recipientRepository.create({
      revisionRequestId: savedRequest.id,
      recipientId: primaryEvaluatorId,
      recipientType: RecipientType.PRIMARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient);

    // When - 재작성 완료 응답 제출
    await service.재작성완료_응답을_제출한다_내부(
      savedRequest.id,
      primaryEvaluatorId,
      '재작성 완료했습니다.',
    );

    // Then - 2차 평가자 개별 승인 상태가 생성되지 않았는지 확인
    const secondaryApprovals = await secondaryStepApprovalRepository.find({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        deletedAt: IsNull(),
      },
    });

    expect(secondaryApprovals.length).toBe(0);

    // 수신자는 완료 상태인지 확인
    const updatedRecipient = await recipientRepository.findOne({
      where: { id: recipient.id },
    });
    expect(updatedRecipient!.isCompleted).toBe(true);

    // 테스트 결과 저장
    testResults.push({
      testName: '2차 평가자가 아닌 경우 개별 승인 상태가 변경되지 않아야 한다',
      result: {
        primaryEvaluatorId: primaryEvaluatorId,
        step: 'primary',
        secondaryApprovalsCount: secondaryApprovals.length,
        recipientCompleted: updatedRecipient!.isCompleted,
        passed: true,
      },
    });
  });

  it('평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부 메서드도 개별 승인 상태를 변경해야 한다', async () => {
    // Given
    await 기본_테스트데이터를_생성한다();

    // 재작성 요청 생성
    const revisionRequest = revisionRequestRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      step: 'secondary' as RevisionRequestStepType,
      comment: '2차 평가를 다시 작성해주세요.',
      requestedBy: adminId,
      requestedAt: new Date(),
      createdBy: adminId,
    });
    const savedRequest = await revisionRequestRepository.save(revisionRequest);

    // 수신자 생성
    const recipient = recipientRepository.create({
      revisionRequestId: savedRequest.id,
      recipientId: secondaryEvaluatorId1,
      recipientType: RecipientType.SECONDARY_EVALUATOR,
      isRead: false,
      isCompleted: false,
      createdBy: adminId,
    });
    await recipientRepository.save(recipient);

    // When - 평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부 호출
    await service.평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(
      evaluationPeriodId,
      employeeId,
      secondaryEvaluatorId1,
      'secondary' as RevisionRequestStepType,
      '재작성 완료했습니다.',
    );

    // Then - 개별 승인 상태가 REVISION_COMPLETED로 변경되었는지 확인
    const secondaryApproval = await secondaryStepApprovalRepository.findOne({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: secondaryEvaluatorId1,
        deletedAt: IsNull(),
      },
    });

    expect(secondaryApproval).not.toBeNull();
    expect(secondaryApproval!.status).toBe(
      StepApprovalStatus.REVISION_COMPLETED,
    );
    expect(secondaryApproval!.revisionRequestId).toBe(savedRequest.id);

    // 테스트 결과 저장
    testResults.push({
      testName:
        '평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부 메서드도 개별 승인 상태를 변경해야 한다',
      result: {
        evaluatorId: secondaryEvaluatorId1,
        secondaryApprovalStatus: secondaryApproval!.status,
        revisionRequestId: secondaryApproval!.revisionRequestId,
        passed: true,
      },
    });
  });
});
