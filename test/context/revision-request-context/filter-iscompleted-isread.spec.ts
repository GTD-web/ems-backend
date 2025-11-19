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
 * 재작성 요청 Context 서비스 - isCompleted/isRead 필터링 검증 테스트
 *
 * isCompleted와 isRead 필터가 올바르게 동작하는지 엄격하게 검증합니다.
 */
describe('재작성 요청 Context - isCompleted/isRead 필터링 검증', () => {
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
  let recipientId1: string;
  let recipientId2: string;
  let departmentId: string;
  let adminId: string;
  let mappingId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  // ANSI 이스케이프 코드를 제거하는 헬퍼 함수
  function stripAnsiCodes(str: string): string {
    if (!str) return str;
    return str
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[?[0-9;]*[a-zA-Z]/g, '');
  }

  // 에러 객체에서 읽기 가능한 메시지를 추출하는 함수
  function extractErrorMessage(error: any): string {
    if (!error) return '';

    let message = '';
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = String(error);
    }

    message = stripAnsiCodes(message);

    if (error.stack) {
      const stack = stripAnsiCodes(error.stack);
      if (stack && !stack.includes(message)) {
        message = `${message}\n\nStack:\n${stack}`;
      }
    }

    return message;
  }

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
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'filter-iscompleted-isread-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트마다 데이터 정리
    try {
      await dataSource.query(
        'DELETE FROM evaluation_revision_request_recipient WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
      );
      await dataSource.query(
        'DELETE FROM evaluation_revision_request WHERE "deletedAt" IS NULL OR "deletedAt" IS NOT NULL',
      );
      await stepApprovalRepository.delete({});
      await mappingRepository.delete({});
      await evaluationPeriodRepository.delete({});
      await employeeRepository.delete({});
      await departmentRepository.delete({});
    } catch (error) {
      // 초기 테스트에서는 무시
    }

    adminId = systemAdminId;

    // 테스트 데이터 생성
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '개발팀',
      code: `DEV001-${uniqueSuffix}`,
      externalId: `DEPT001-${uniqueSuffix}`,
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: adminId,
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
      createdBy: adminId,
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
      createdBy: adminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 수신자 1 생성 (필터링 테스트용)
    const recipient1 = employeeRepository.create({
      name: '이수신자1',
      employeeNumber: `EMP002-${uniqueSuffix}`,
      email: `recipient1-${uniqueSuffix}@test.com`,
      externalId: `EXT002-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: adminId,
    });
    const savedRecipient1 = await employeeRepository.save(recipient1);
    recipientId1 = savedRecipient1.id;

    // 5. 수신자 2 생성 (필터링 테스트용)
    const recipient2 = employeeRepository.create({
      name: '박수신자2',
      employeeNumber: `EMP003-${uniqueSuffix}`,
      email: `recipient2-${uniqueSuffix}@test.com`,
      externalId: `EXT003-${uniqueSuffix}`,
      departmentId: departmentId,
      status: '재직중',
      createdBy: adminId,
    });
    const savedRecipient2 = await employeeRepository.save(recipient2);
    recipientId2 = savedRecipient2.id;

    // 6. 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: adminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 7. 단계 승인 생성
    const stepApproval = stepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      criteriaSettingStatus: StepApprovalStatus.REVISION_REQUESTED,
      selfEvaluationStatus: StepApprovalStatus.PENDING,
      primaryEvaluationStatus: StepApprovalStatus.PENDING,
      secondaryEvaluationStatus: StepApprovalStatus.PENDING,
      createdBy: adminId,
    });
    await stepApprovalRepository.save(stepApproval);
  });

  describe('내_재작성요청목록을_조회한다 - isCompleted 필터링 검증', () => {
    it('isCompleted=false로 필터링 시 false인 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName =
        'isCompleted=false로 필터링 시 false인 항목만 반환되어야 한다';

      try {
        // Given - 다양한 상태의 재작성 요청 생성
        // 1. 미완료 요청 (isCompleted=false)
        const incompleteRequest1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '미완료 요청 1',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedIncompleteRequest1 =
          await revisionRequestRepository.save(incompleteRequest1);

        const incompleteRecipient1 = recipientRepository.create({
          revisionRequestId: savedIncompleteRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false, // ❌ false
          createdBy: adminId,
        });
        await recipientRepository.save(incompleteRecipient1);

        // 2. 완료된 요청 (isCompleted=true) - 필터링되어야 함
        const completedRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '완료된 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedCompletedRequest =
          await revisionRequestRepository.save(completedRequest);

        const completedRecipient = recipientRepository.create({
          revisionRequestId: savedCompletedRequest.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: true, // ❌ true - 필터링되어야 함
          completedAt: new Date(),
          responseComment: '완료했습니다.',
          createdBy: adminId,
        });
        await recipientRepository.save(completedRecipient);

        // 3. 또 다른 미완료 요청 (isCompleted=false)
        const incompleteRequest2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '미완료 요청 2',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedIncompleteRequest2 =
          await revisionRequestRepository.save(incompleteRequest2);

        const incompleteRecipient2 = recipientRepository.create({
          revisionRequestId: savedIncompleteRequest2.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true,
          isCompleted: false, // ❌ false
          createdBy: adminId,
        });
        await recipientRepository.save(incompleteRecipient2);

        // When - isCompleted=false로 필터링
        const result = await service.내_재작성요청목록을_조회한다(
          recipientId1,
          {
            isCompleted: false,
          },
        );

        // Then - 모든 결과가 isCompleted=false여야 함
        expect(result.length).toBe(2); // 미완료 요청 2개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isCompleted).toBe(false);
          expect(item.recipientInfo.isCompleted).not.toBe(true); // ❌ true가 되어서는 안 됨
        });

        // 완료된 요청이 포함되지 않았는지 확인
        const completedRequestIds = result.map((item) => item.request.id);
        expect(completedRequestIds).not.toContain(savedCompletedRequest.id);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isCompleted: false },
            resultCount: result.length,
            expectedCount: 2,
            allItemsHaveIsCompletedFalse: result.every(
              (item) => item.recipientInfo.isCompleted === false,
            ),
            completedRequestExcluded: !completedRequestIds.includes(
              savedCompletedRequest.id,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted=true로 필터링 시 true인 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName =
        'isCompleted=true로 필터링 시 true인 항목만 반환되어야 한다';

      try {
        // Given - 다양한 상태의 재작성 요청 생성
        // 1. 완료된 요청 1 (isCompleted=true)
        const completedRequest1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '완료된 요청 1',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedCompletedRequest1 =
          await revisionRequestRepository.save(completedRequest1);

        const completedRecipient1 = recipientRepository.create({
          revisionRequestId: savedCompletedRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: true, // ✅ true
          completedAt: new Date(),
          responseComment: '완료했습니다. 1',
          createdBy: adminId,
        });
        await recipientRepository.save(completedRecipient1);

        // 2. 미완료 요청 (isCompleted=false) - 필터링되어야 함
        const incompleteRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '미완료 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedIncompleteRequest =
          await revisionRequestRepository.save(incompleteRequest);

        const incompleteRecipient = recipientRepository.create({
          revisionRequestId: savedIncompleteRequest.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false, // ❌ false - 필터링되어야 함
          createdBy: adminId,
        });
        await recipientRepository.save(incompleteRecipient);

        // 3. 완료된 요청 2 (isCompleted=true)
        const completedRequest2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '완료된 요청 2',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedCompletedRequest2 =
          await revisionRequestRepository.save(completedRequest2);

        const completedRecipient2 = recipientRepository.create({
          revisionRequestId: savedCompletedRequest2.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true,
          isCompleted: true, // ✅ true
          completedAt: new Date(),
          responseComment: '완료했습니다. 2',
          createdBy: adminId,
        });
        await recipientRepository.save(completedRecipient2);

        // When - isCompleted=true로 필터링
        const result = await service.내_재작성요청목록을_조회한다(
          recipientId1,
          {
            isCompleted: true,
          },
        );

        // Then - 모든 결과가 isCompleted=true여야 함
        expect(result.length).toBe(2); // 완료된 요청 2개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isCompleted).toBe(true);
          expect(item.recipientInfo.isCompleted).not.toBe(false); // ❌ false가 되어서는 안 됨
        });

        // 미완료 요청이 포함되지 않았는지 확인
        const requestIds = result.map((item) => item.request.id);
        expect(requestIds).not.toContain(savedIncompleteRequest.id);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isCompleted: true },
            resultCount: result.length,
            expectedCount: 2,
            allItemsHaveIsCompletedTrue: result.every(
              (item) => item.recipientInfo.isCompleted === true,
            ),
            incompleteRequestExcluded: !requestIds.includes(
              savedIncompleteRequest.id,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('내_재작성요청목록을_조회한다 - isRead 필터링 검증', () => {
    it('isRead=false로 필터링 시 false인 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName =
        'isRead=false로 필터링 시 false인 항목만 반환되어야 한다';

      try {
        // Given - 다양한 상태의 재작성 요청 생성
        // 1. 읽지 않은 요청 (isRead=false)
        const unreadRequest1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽지 않은 요청 1',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedUnreadRequest1 =
          await revisionRequestRepository.save(unreadRequest1);

        const unreadRecipient1 = recipientRepository.create({
          revisionRequestId: savedUnreadRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false, // ❌ false
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(unreadRecipient1);

        // 2. 읽은 요청 (isRead=true) - 필터링되어야 함
        const readRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽은 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedReadRequest =
          await revisionRequestRepository.save(readRequest);

        const readRecipient = recipientRepository.create({
          revisionRequestId: savedReadRequest.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true, // ❌ true - 필터링되어야 함
          isCompleted: false,
          readAt: new Date(),
          createdBy: adminId,
        });
        await recipientRepository.save(readRecipient);

        // 3. 또 다른 읽지 않은 요청 (isRead=false)
        const unreadRequest2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '읽지 않은 요청 2',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedUnreadRequest2 =
          await revisionRequestRepository.save(unreadRequest2);

        const unreadRecipient2 = recipientRepository.create({
          revisionRequestId: savedUnreadRequest2.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false, // ❌ false
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(unreadRecipient2);

        // When - isRead=false로 필터링
        const result = await service.내_재작성요청목록을_조회한다(
          recipientId1,
          {
            isRead: false,
          },
        );

        // Then - 모든 결과가 isRead=false여야 함
        expect(result.length).toBe(2); // 읽지 않은 요청 2개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isRead).toBe(false);
          expect(item.recipientInfo.isRead).not.toBe(true); // ❌ true가 되어서는 안 됨
        });

        // 읽은 요청이 포함되지 않았는지 확인
        const requestIds = result.map((item) => item.request.id);
        expect(requestIds).not.toContain(savedReadRequest.id);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isRead: false },
            resultCount: result.length,
            expectedCount: 2,
            allItemsHaveIsReadFalse: result.every(
              (item) => item.recipientInfo.isRead === false,
            ),
            readRequestExcluded: !requestIds.includes(savedReadRequest.id),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isRead: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=true로 필터링 시 true인 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName = 'isRead=true로 필터링 시 true인 항목만 반환되어야 한다';

      try {
        // Given - 다양한 상태의 재작성 요청 생성
        // 1. 읽은 요청 1 (isRead=true)
        const readRequest1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽은 요청 1',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedReadRequest1 =
          await revisionRequestRepository.save(readRequest1);

        const readRecipient1 = recipientRepository.create({
          revisionRequestId: savedReadRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true, // ✅ true
          isCompleted: false,
          readAt: new Date(),
          createdBy: adminId,
        });
        await recipientRepository.save(readRecipient1);

        // 2. 읽지 않은 요청 (isRead=false) - 필터링되어야 함
        const unreadRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽지 않은 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedUnreadRequest =
          await revisionRequestRepository.save(unreadRequest);

        const unreadRecipient = recipientRepository.create({
          revisionRequestId: savedUnreadRequest.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false, // ❌ false - 필터링되어야 함
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(unreadRecipient);

        // 3. 읽은 요청 2 (isRead=true)
        const readRequest2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '읽은 요청 2',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedReadRequest2 =
          await revisionRequestRepository.save(readRequest2);

        const readRecipient2 = recipientRepository.create({
          revisionRequestId: savedReadRequest2.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true, // ✅ true
          isCompleted: false,
          readAt: new Date(),
          createdBy: adminId,
        });
        await recipientRepository.save(readRecipient2);

        // When - isRead=true로 필터링
        const result = await service.내_재작성요청목록을_조회한다(
          recipientId1,
          {
            isRead: true,
          },
        );

        // Then - 모든 결과가 isRead=true여야 함
        expect(result.length).toBe(2); // 읽은 요청 2개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isRead).toBe(true);
          expect(item.recipientInfo.isRead).not.toBe(false); // ❌ false가 되어서는 안 됨
        });

        // 읽지 않은 요청이 포함되지 않았는지 확인
        const requestIds = result.map((item) => item.request.id);
        expect(requestIds).not.toContain(savedUnreadRequest.id);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isRead: true },
            resultCount: result.length,
            expectedCount: 2,
            allItemsHaveIsReadTrue: result.every(
              (item) => item.recipientInfo.isRead === true,
            ),
            unreadRequestExcluded: !requestIds.includes(savedUnreadRequest.id),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isRead: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('내_재작성요청목록을_조회한다 - isCompleted와 isRead 조합 필터링 검증', () => {
    it('isRead=false와 isCompleted=false를 함께 사용 시 두 조건 모두 만족하는 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName =
        'isRead=false와 isCompleted=false를 함께 사용 시 두 조건 모두 만족하는 항목만 반환되어야 한다';

      try {
        // Given - 다양한 조합의 재작성 요청 생성
        // 1. 읽지 않음 + 미완료 (isRead=false, isCompleted=false) ✅
        const request1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽지 않음 + 미완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest1 = await revisionRequestRepository.save(request1);

        const recipient1 = recipientRepository.create({
          revisionRequestId: savedRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false, // ✅
          isCompleted: false, // ✅
          createdBy: adminId,
        });
        await recipientRepository.save(recipient1);

        // 2. 읽음 + 미완료 (isRead=true, isCompleted=false) ❌ 필터링
        const request2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽음 + 미완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest2 = await revisionRequestRepository.save(request2);

        const recipient2 = recipientRepository.create({
          revisionRequestId: savedRequest2.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true, // ❌ 필터링
          isCompleted: false,
          readAt: new Date(),
          createdBy: adminId,
        });
        await recipientRepository.save(recipient2);

        // 3. 읽지 않음 + 완료 (isRead=false, isCompleted=true) ❌ 필터링
        const request3 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '읽지 않음 + 완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest3 = await revisionRequestRepository.save(request3);

        const recipient3 = recipientRepository.create({
          revisionRequestId: savedRequest3.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: true, // ❌ 필터링
          completedAt: new Date(),
          responseComment: '완료했습니다.',
          createdBy: adminId,
        });
        await recipientRepository.save(recipient3);

        // 4. 읽음 + 완료 (isRead=true, isCompleted=true) ❌ 필터링
        const request4 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '읽음 + 완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest4 = await revisionRequestRepository.save(request4);

        const recipient4 = recipientRepository.create({
          revisionRequestId: savedRequest4.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true, // ❌ 필터링
          isCompleted: true, // ❌ 필터링
          readAt: new Date(),
          completedAt: new Date(),
          responseComment: '완료했습니다.',
          createdBy: adminId,
        });
        await recipientRepository.save(recipient4);

        // 5. 또 다른 읽지 않음 + 미완료 (isRead=false, isCompleted=false) ✅
        const request5 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'primary' as RevisionRequestStepType,
          comment: '읽지 않음 + 미완료 2',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest5 = await revisionRequestRepository.save(request5);

        const recipient5 = recipientRepository.create({
          revisionRequestId: savedRequest5.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false, // ✅
          isCompleted: false, // ✅
          createdBy: adminId,
        });
        await recipientRepository.save(recipient5);

        // When - isRead=false와 isCompleted=false로 필터링
        const result = await service.내_재작성요청목록을_조회한다(
          recipientId1,
          {
            isRead: false,
            isCompleted: false,
          },
        );

        // Then - 두 조건을 모두 만족하는 항목만 반환되어야 함
        expect(result.length).toBe(2); // 읽지 않음 + 미완료 요청 2개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isRead).toBe(false);
          expect(item.recipientInfo.isCompleted).toBe(false);
        });

        // 필터링된 요청들이 포함되지 않았는지 확인
        const requestIds = result.map((item) => item.request.id);
        expect(requestIds).not.toContain(savedRequest2.id); // 읽음 + 미완료
        expect(requestIds).not.toContain(savedRequest3.id); // 읽지 않음 + 완료
        expect(requestIds).not.toContain(savedRequest4.id); // 읽음 + 완료

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isRead: false, isCompleted: false },
            resultCount: result.length,
            expectedCount: 2,
            allItemsHaveIsReadFalse: result.every(
              (item) => item.recipientInfo.isRead === false,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item) => item.recipientInfo.isCompleted === false,
            ),
            filteredRequestsExcluded: [
              !requestIds.includes(savedRequest2.id),
              !requestIds.includes(savedRequest3.id),
              !requestIds.includes(savedRequest4.id),
            ].every((v) => v === true),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            recipientId: recipientId1,
            filter: { isRead: false, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('전체_재작성요청목록을_조회한다 - isCompleted/isRead 필터링 검증', () => {
    it('전체 조회에서 isCompleted=false로 필터링 시 false인 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName =
        '전체 조회에서 isCompleted=false로 필터링 시 false인 항목만 반환되어야 한다';

      try {
        // Given - 다양한 상태의 재작성 요청 생성 (여러 수신자)
        // 1. 수신자1에게 미완료 요청
        const incompleteRequest1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '미완료 요청 1',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedIncompleteRequest1 =
          await revisionRequestRepository.save(incompleteRequest1);

        const incompleteRecipient1 = recipientRepository.create({
          revisionRequestId: savedIncompleteRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: false, // ❌ false
          createdBy: adminId,
        });
        await recipientRepository.save(incompleteRecipient1);

        // 2. 수신자2에게 완료된 요청 - 필터링되어야 함
        const completedRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '완료된 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedCompletedRequest =
          await revisionRequestRepository.save(completedRequest);

        const completedRecipient = recipientRepository.create({
          revisionRequestId: savedCompletedRequest.id,
          recipientId: recipientId2,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: true, // ❌ true - 필터링되어야 함
          completedAt: new Date(),
          responseComment: '완료했습니다.',
          createdBy: adminId,
        });
        await recipientRepository.save(completedRecipient);

        // 3. 수신자1에게 또 다른 미완료 요청
        const incompleteRequest2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '미완료 요청 2',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedIncompleteRequest2 =
          await revisionRequestRepository.save(incompleteRequest2);

        const incompleteRecipient2 = recipientRepository.create({
          revisionRequestId: savedIncompleteRequest2.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true,
          isCompleted: false, // ❌ false
          createdBy: adminId,
        });
        await recipientRepository.save(incompleteRecipient2);

        // When - isCompleted=false로 필터링
        const result = await service.전체_재작성요청목록을_조회한다({
          isCompleted: false,
        });

        // Then - 모든 결과가 isCompleted=false여야 함
        expect(result.length).toBe(2); // 미완료 요청 2개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isCompleted).toBe(false);
          expect(item.recipientInfo.isCompleted).not.toBe(true); // ❌ true가 되어서는 안 됨
        });

        // 완료된 요청이 포함되지 않았는지 확인
        const requestIds = result.map((item) => item.request.id);
        expect(requestIds).not.toContain(savedCompletedRequest.id);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            filter: { isCompleted: false },
            resultCount: result.length,
            expectedCount: 2,
            allItemsHaveIsCompletedFalse: result.every(
              (item) => item.recipientInfo.isCompleted === false,
            ),
            completedRequestExcluded: !requestIds.includes(
              savedCompletedRequest.id,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            filter: { isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('전체 조회에서 isRead=false와 isCompleted=false를 함께 사용 시 두 조건 모두 만족하는 항목만 반환되어야 한다', async () => {
      let error: any;
      const testName =
        '전체 조회에서 isRead=false와 isCompleted=false를 함께 사용 시 두 조건 모두 만족하는 항목만 반환되어야 한다';

      try {
        // Given - 다양한 조합의 재작성 요청 생성
        // 1. 읽지 않음 + 미완료 (isRead=false, isCompleted=false) ✅
        const request1 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽지 않음 + 미완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest1 = await revisionRequestRepository.save(request1);

        const recipient1 = recipientRepository.create({
          revisionRequestId: savedRequest1.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false, // ✅
          isCompleted: false, // ✅
          createdBy: adminId,
        });
        await recipientRepository.save(recipient1);

        // 2. 읽음 + 미완료 (isRead=true, isCompleted=false) ❌ 필터링
        const request2 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'criteria' as RevisionRequestStepType,
          comment: '읽음 + 미완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest2 = await revisionRequestRepository.save(request2);

        const recipient2 = recipientRepository.create({
          revisionRequestId: savedRequest2.id,
          recipientId: recipientId2,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: true, // ❌ 필터링
          isCompleted: false,
          readAt: new Date(),
          createdBy: adminId,
        });
        await recipientRepository.save(recipient2);

        // 3. 읽지 않음 + 완료 (isRead=false, isCompleted=true) ❌ 필터링
        const request3 = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'self' as RevisionRequestStepType,
          comment: '읽지 않음 + 완료',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: adminId,
        });
        const savedRequest3 = await revisionRequestRepository.save(request3);

        const recipient3 = recipientRepository.create({
          revisionRequestId: savedRequest3.id,
          recipientId: recipientId1,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isRead: false,
          isCompleted: true, // ❌ 필터링
          completedAt: new Date(),
          responseComment: '완료했습니다.',
          createdBy: adminId,
        });
        await recipientRepository.save(recipient3);

        // When - isRead=false와 isCompleted=false로 필터링
        const result = await service.전체_재작성요청목록을_조회한다({
          isRead: false,
          isCompleted: false,
        });

        // Then - 두 조건을 모두 만족하는 항목만 반환되어야 함
        expect(result.length).toBe(1); // 읽지 않음 + 미완료 요청 1개만 반환되어야 함
        result.forEach((item) => {
          expect(item.recipientInfo.isRead).toBe(false);
          expect(item.recipientInfo.isCompleted).toBe(false);
        });

        // 필터링된 요청들이 포함되지 않았는지 확인
        const requestIds = result.map((item) => item.request.id);
        expect(requestIds).not.toContain(savedRequest2.id); // 읽음 + 미완료
        expect(requestIds).not.toContain(savedRequest3.id); // 읽지 않음 + 완료

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            filter: { isRead: false, isCompleted: false },
            resultCount: result.length,
            expectedCount: 1,
            allItemsHaveIsReadFalse: result.every(
              (item) => item.recipientInfo.isRead === false,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item) => item.recipientInfo.isCompleted === false,
            ),
            filteredRequestsExcluded: [
              !requestIds.includes(savedRequest2.id),
              !requestIds.includes(savedRequest3.id),
            ].every((v) => v === true),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            filter: { isRead: false, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
