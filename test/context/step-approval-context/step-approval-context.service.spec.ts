import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { StepApprovalContextModule } from '@context/step-approval-context/step-approval-context.module';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * StepApprovalContextService 유닛 테스트
 *
 * 평가 단계별 승인 상태 변경 및 재작성 요청 생성 기능을 검증합니다.
 */
describe('StepApprovalContextService', () => {
  let service: StepApprovalContextService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let departmentId: string;
  let mappingId: string;
  let adminId: string;

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
          EvaluationLine,
          EvaluationLineMapping,
          EmployeeEvaluationStepApproval,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
        ]),
        EmployeeEvaluationStepApprovalModule,
        EvaluationRevisionRequestModule,
      ],
      providers: [StepApprovalContextService],
    }).compile();

    service = module.get<StepApprovalContextService>(
      StepApprovalContextService,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
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
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'step-approval-context-revision-request-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(
      `✅ 테스트 결과가 저장되었습니다: ${outputPath}`,
    );

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

      const stepApprovals = await stepApprovalRepository.find();
      await stepApprovalRepository.remove(stepApprovals);

      const lineMappings = await evaluationLineMappingRepository.find();
      await evaluationLineMappingRepository.remove(lineMappings);

      const lines = await evaluationLineRepository.find();
      await evaluationLineRepository.remove(lines);

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

    // 4. 1차 평가자 직원 생성
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

    // 5. 2차 평가자 직원 생성
    const secondaryEvaluator = employeeRepository.create({
      name: '박이차평가자',
      employeeNumber: 'EMP003',
      email: 'secondary@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator =
      await employeeRepository.save(secondaryEvaluator);
    secondaryEvaluatorId = savedSecondaryEvaluator.id;

    // 6. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 7. 평가라인 생성 (1차, 2차)
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      version: 1,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);

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

    // 8. 평가라인 매핑 생성
    const primaryLineMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      evaluationLineId: savedPrimaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(primaryLineMapping);

    const secondaryLineMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      evaluationLineId: savedSecondaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryLineMapping);

    // 9. 단계 승인 엔티티 생성
    const stepApproval = stepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      criteriaSettingStatus: StepApprovalStatus.PENDING,
      selfEvaluationStatus: StepApprovalStatus.PENDING,
      primaryEvaluationStatus: StepApprovalStatus.PENDING,
      secondaryEvaluationStatus: StepApprovalStatus.PENDING,
      createdBy: systemAdminId,
    });
    await stepApprovalRepository.save(stepApproval);
  }

  /**
   * 평가자와 피평가자가 같은 경우의 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트데이터를_생성한다_평가자와피평가자같은경우(): Promise<void> {
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

    // 3. 피평가자 직원 생성 (이 직원이 1차평가자이기도 함)
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
    // 평가자와 피평가자가 같으므로 primaryEvaluatorId도 같은 값으로 설정
    primaryEvaluatorId = employeeId;

    // 4. 2차 평가자 직원 생성 (테스트 완전성을 위해)
    const secondaryEvaluator = employeeRepository.create({
      name: '박이차평가자',
      employeeNumber: 'EMP003',
      email: 'secondary@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator =
      await employeeRepository.save(secondaryEvaluator);
    secondaryEvaluatorId = savedSecondaryEvaluator.id;

    // 5. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 6. 평가라인 생성 (1차, 2차)
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      version: 1,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);

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

    // 7. 평가라인 매핑 생성 (1차평가자가 피평가자와 같음)
    const primaryLineMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId, // 피평가자와 같은 ID
      evaluationLineId: savedPrimaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(primaryLineMapping);

    const secondaryLineMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      evaluationLineId: savedSecondaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryLineMapping);

    // 8. 단계 승인 엔티티 생성
    const stepApproval = stepApprovalRepository.create({
      evaluationPeriodEmployeeMappingId: mappingId,
      criteriaSettingStatus: StepApprovalStatus.PENDING,
      selfEvaluationStatus: StepApprovalStatus.PENDING,
      primaryEvaluationStatus: StepApprovalStatus.PENDING,
      secondaryEvaluationStatus: StepApprovalStatus.PENDING,
      createdBy: systemAdminId,
    });
    await stepApprovalRepository.save(stepApproval);
  }

  describe('단계별_확인상태를_변경한다', () => {
    it('평가기준 설정 상태를 승인(approved)으로 변경할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'criteria',
        status: StepApprovalStatus.APPROVED,
        updatedBy: adminId,
      });

      // Then
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });

      expect(stepApproval).toBeDefined();
      expect(stepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.APPROVED,
      );
      expect(stepApproval!.criteriaSettingApprovedBy).toBe(adminId);
      expect(stepApproval!.criteriaSettingApprovedAt).toBeDefined();

      // 재작성 요청이 생성되지 않아야 함
      const revisionRequests = await revisionRequestRepository.find();
      expect(revisionRequests.length).toBe(0);
    });

    it('자기평가 상태를 대기(pending)로 변경할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'self',
        status: StepApprovalStatus.PENDING,
        updatedBy: adminId,
      });

      // Then
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });

      expect(stepApproval).toBeDefined();
      expect(stepApproval!.selfEvaluationStatus).toBe(
        StepApprovalStatus.PENDING,
      );
      expect(stepApproval!.selfEvaluationApprovedBy).toBeNull();
      expect(stepApproval!.selfEvaluationApprovedAt).toBeNull();
    });

    it('평가기준 설정을 재작성 요청 상태로 변경하면 재작성 요청이 생성되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const revisionComment = '평가기준을 다시 작성해주세요.';

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'criteria',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then - 상태 변경 확인
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(stepApproval!.criteriaSettingStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // Then - 재작성 요청 생성 확인 (각 수신자별로 별도 요청 생성)
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
        where: {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
        },
      });
      expect(revisionRequests.length).toBe(2); // 피평가자용 1개, 1차평가자용 1개

      // 각 요청의 속성 확인
      revisionRequests.forEach((request) => {
        expect(request.evaluationPeriodId).toBe(evaluationPeriodId);
        expect(request.employeeId).toBe(employeeId);
        expect(request.step).toBe('criteria');
        expect(request.comment).toBe(revisionComment);
        expect(request.requestedBy).toBe(adminId);
        expect(request.recipients.length).toBe(1); // 각 요청은 1개의 수신자만 가짐
      });

      // 수신자 확인 (피평가자용 요청과 1차평가자용 요청이 각각 생성되어야 함)
      const recipientIds = revisionRequests.flatMap((r) =>
        r.recipients.map((recipient) => recipient.recipientId),
      );
      expect(recipientIds).toContain(employeeId);
      expect(recipientIds).toContain(primaryEvaluatorId);

      // 각 수신자별로 별도 요청이 생성되었는지 확인
      const employeeRequest = revisionRequests.find(
        (r) => r.recipients[0]?.recipientId === employeeId,
      );
      const primaryEvaluatorRequest = revisionRequests.find(
        (r) => r.recipients[0]?.recipientId === primaryEvaluatorId,
      );
      expect(employeeRequest).toBeDefined();
      expect(primaryEvaluatorRequest).toBeDefined();
    });

    it('자기평가를 재작성 요청 상태로 변경하면 피평가자와 1차평가자에게 요청이 전송되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const revisionComment = '자기평가를 수정해주세요.';

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'self',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then - 재작성 요청 생성 확인 (각 수신자별로 별도 요청 생성)
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
        where: {
          evaluationPeriodId,
          employeeId,
          step: 'self',
        },
      });
      expect(revisionRequests.length).toBe(2); // 피평가자용 1개, 1차평가자용 1개

      // 각 요청의 속성 확인
      revisionRequests.forEach((request) => {
        expect(request.evaluationPeriodId).toBe(evaluationPeriodId);
        expect(request.employeeId).toBe(employeeId);
        expect(request.step).toBe('self');
        expect(request.comment).toBe(revisionComment);
        expect(request.requestedBy).toBe(adminId);
        expect(request.recipients.length).toBe(1); // 각 요청은 1개의 수신자만 가짐
      });

      // 수신자 확인 (피평가자용 요청과 1차평가자용 요청이 각각 생성되어야 함)
      const recipientIds = revisionRequests.flatMap((r) =>
        r.recipients.map((recipient) => recipient.recipientId),
      );
      expect(recipientIds).toContain(employeeId); // 피평가자
      expect(recipientIds).toContain(primaryEvaluatorId); // 1차 평가자

      // 각 수신자별로 별도 요청이 생성되었는지 확인
      const employeeRequest = revisionRequests.find(
        (r) => r.recipients[0]?.recipientId === employeeId,
      );
      const primaryEvaluatorRequest = revisionRequests.find(
        (r) => r.recipients[0]?.recipientId === primaryEvaluatorId,
      );
      expect(employeeRequest).toBeDefined();
      expect(primaryEvaluatorRequest).toBeDefined();

      // 테스트 결과 저장
      testResults.push({
        testName: '평가기준 설정을 재작성 요청 상태로 변경하면 재작성 요청이 생성되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
          status: StepApprovalStatus.REVISION_REQUESTED,
          revisionRequestCount: revisionRequests.length,
          recipientIds: recipientIds,
          employeeRequestId: employeeRequest?.id,
          primaryEvaluatorRequestId: primaryEvaluatorRequest?.id,
        },
      });
    });

    it('평가기준 설정 재작성 요청 시 평가자와 피평가자가 같으면 요청이 하나만 생성되어야 한다', async () => {
      // Given - 평가자와 피평가자가 같은 경우의 테스트 데이터 생성
      await 테스트데이터를_생성한다_평가자와피평가자같은경우();
      const revisionComment = '평가기준을 다시 작성해주세요.';

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'criteria',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then - 재작성 요청이 1개만 생성되어야 함 (중복 방지)
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
        where: {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
        },
      });
      expect(revisionRequests.length).toBe(1); // 피평가자와 평가자가 같으므로 1개만 생성

      // 요청의 속성 확인
      const request = revisionRequests[0];
      expect(request.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(request.employeeId).toBe(employeeId);
      expect(request.step).toBe('criteria');
      expect(request.comment).toBe(revisionComment);
      expect(request.requestedBy).toBe(adminId);
      expect(request.recipients.length).toBe(1);

      // 수신자가 피평가자(employeeId)인지 확인
      expect(request.recipients[0].recipientId).toBe(employeeId);
      expect(request.recipients[0].recipientType).toBe('evaluatee');

      // 테스트 결과 저장
      testResults.push({
        testName: '평가기준 설정 재작성 요청 시 평가자와 피평가자가 같으면 요청이 하나만 생성되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
          status: StepApprovalStatus.REVISION_REQUESTED,
          revisionRequestCount: revisionRequests.length,
          recipientId: request.recipients[0].recipientId,
          recipientType: request.recipients[0].recipientType,
          isSamePerson: true,
        },
      });
    });

    it('자기평가 재작성 요청 시 평가자와 피평가자가 같으면 요청이 하나만 생성되어야 한다', async () => {
      // Given - 평가자와 피평가자가 같은 경우의 테스트 데이터 생성
      await 테스트데이터를_생성한다_평가자와피평가자같은경우();
      const revisionComment = '자기평가를 수정해주세요.';

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'self',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then - 재작성 요청이 1개만 생성되어야 함 (중복 방지)
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
        where: {
          evaluationPeriodId,
          employeeId,
          step: 'self',
        },
      });
      expect(revisionRequests.length).toBe(1); // 피평가자와 평가자가 같으므로 1개만 생성

      // 요청의 속성 확인
      const request = revisionRequests[0];
      expect(request.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(request.employeeId).toBe(employeeId);
      expect(request.step).toBe('self');
      expect(request.comment).toBe(revisionComment);
      expect(request.requestedBy).toBe(adminId);
      expect(request.recipients.length).toBe(1);

      // 수신자가 피평가자(employeeId)인지 확인
      expect(request.recipients[0].recipientId).toBe(employeeId);
      expect(request.recipients[0].recipientType).toBe('evaluatee');

      // 테스트 결과 저장
      testResults.push({
        testName: '자기평가 재작성 요청 시 평가자와 피평가자가 같으면 요청이 하나만 생성되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          step: 'self',
          status: StepApprovalStatus.REVISION_REQUESTED,
          revisionRequestCount: revisionRequests.length,
          recipientId: request.recipients[0].recipientId,
          recipientType: request.recipients[0].recipientType,
          isSamePerson: true,
        },
      });
    });

    it('1차평가를 재작성 요청 상태로 변경하면 1차평가자에게만 요청이 전송되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const revisionComment = '1차평가를 수정해주세요.';

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'primary',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
      });
      expect(revisionRequests.length).toBe(1);

      const recipients = revisionRequests[0].recipients;
      expect(recipients.length).toBe(1);
      expect(recipients[0].recipientId).toBe(primaryEvaluatorId);
      expect(recipients[0].recipientType).toBe('primary_evaluator');
    });

    it('2차평가를 재작성 요청 상태로 변경하면 2차평가자들에게 요청이 전송되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const revisionComment = '2차평가를 수정해주세요.';

      // When
      await service.단계별_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        step: 'secondary',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
      });
      expect(revisionRequests.length).toBe(1);

      const recipients = revisionRequests[0].recipients;
      expect(recipients.length).toBe(1);
      expect(recipients[0].recipientId).toBe(secondaryEvaluatorId);
      expect(recipients[0].recipientType).toBe('secondary_evaluator');
    });

    it('재작성 요청 상태로 변경 시 코멘트가 없으면 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When & Then
      await expect(
        service.단계별_확인상태를_변경한다({
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
          status: StepApprovalStatus.REVISION_REQUESTED,
          // revisionComment 없음
          updatedBy: adminId,
        }),
      ).rejects.toThrow();
    });

    it('존재하지 않는 평가기간-직원 매핑에 대한 상태 변경 시 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const nonExistentEmployeeId = '123e4567-e89b-12d3-a456-426614174999';

      // When & Then
      await expect(
        service.단계별_확인상태를_변경한다({
          evaluationPeriodId,
          employeeId: nonExistentEmployeeId,
          step: 'criteria',
          status: StepApprovalStatus.APPROVED,
          updatedBy: adminId,
        }),
      ).rejects.toThrow();
    });
  });

  describe('이차하향평가_확인상태를_변경한다', () => {
    it('2차 평가자별로 승인 상태를 변경할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      await service.이차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        evaluatorId: secondaryEvaluatorId,
        status: StepApprovalStatus.APPROVED,
        updatedBy: adminId,
      });

      // Then
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });

      expect(stepApproval).toBeDefined();
      expect(stepApproval!.secondaryEvaluationStatus).toBe(
        StepApprovalStatus.APPROVED,
      );
      expect(stepApproval!.secondaryEvaluationApprovedBy).toBe(adminId);
      expect(stepApproval!.secondaryEvaluationApprovedAt).toBeDefined();

      // 재작성 요청이 생성되지 않아야 함
      const revisionRequests = await revisionRequestRepository.find();
      expect(revisionRequests.length).toBe(0);
    });

    it('특정 2차 평가자에게만 재작성 요청을 보낼 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const revisionComment = '2차 평가를 수정해주세요.';

      // When
      await service.이차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        evaluatorId: secondaryEvaluatorId,
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then - 상태 변경 확인
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      expect(stepApproval!.secondaryEvaluationStatus).toBe(
        StepApprovalStatus.REVISION_REQUESTED,
      );

      // Then - 재작성 요청 생성 확인
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
      });
      expect(revisionRequests.length).toBe(1);
      expect(revisionRequests[0].evaluationPeriodId).toBe(evaluationPeriodId);
      expect(revisionRequests[0].employeeId).toBe(employeeId);
      expect(revisionRequests[0].step).toBe('secondary');
      expect(revisionRequests[0].comment).toBe(revisionComment);
      expect(revisionRequests[0].requestedBy).toBe(adminId);

      // Then - 수신자 확인 (특정 2차 평가자에게만 전송)
      const recipients = revisionRequests[0].recipients;
      expect(recipients.length).toBe(1);
      expect(recipients[0].recipientId).toBe(secondaryEvaluatorId);
      expect(recipients[0].recipientType).toBe('secondary_evaluator');
    });

    it('2차 평가자가 아닌 사람의 ID를 전달하면 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const nonSecondaryEvaluatorId = primaryEvaluatorId; // 1차 평가자 ID

      // When & Then
      await expect(
        service.이차하향평가_확인상태를_변경한다({
          evaluationPeriodId,
          employeeId,
          evaluatorId: nonSecondaryEvaluatorId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: adminId,
        }),
      ).rejects.toThrow('해당 평가자는 2차 평가자가 아닙니다');
    });

    it('존재하지 않는 평가자 ID를 전달하면 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const nonExistentEvaluatorId = '123e4567-e89b-12d3-a456-426614174999';

      // When & Then
      await expect(
        service.이차하향평가_확인상태를_변경한다({
          evaluationPeriodId,
          employeeId,
          evaluatorId: nonExistentEvaluatorId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: adminId,
        }),
      ).rejects.toThrow('해당 평가자는 2차 평가자가 아닙니다');
    });

    it('재작성 요청 상태로 변경 시 코멘트가 없으면 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When & Then
      await expect(
        service.이차하향평가_확인상태를_변경한다({
          evaluationPeriodId,
          employeeId,
          evaluatorId: secondaryEvaluatorId,
          status: StepApprovalStatus.REVISION_REQUESTED,
          // revisionComment 없음
          updatedBy: adminId,
        }),
      ).rejects.toThrow('재작성 요청 코멘트는 필수입니다');
    });

    it('여러 2차 평가자가 있을 때 한 명에게만 재작성 요청을 보낼 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 2번째 2차 평가자 추가
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
      const secondaryEvaluatorId2 = savedSecondaryEvaluator2.id;

      // 2번째 2차 평가자용 평가라인 매핑 생성
      const secondaryLine2 = evaluationLineRepository.create({
        evaluatorType: EvaluatorType.SECONDARY,
        order: 3,
        isRequired: false,
        isAutoAssigned: false,
        version: 1,
        createdBy: systemAdminId,
      });
      const savedSecondaryLine2 =
        await evaluationLineRepository.save(secondaryLine2);

      const secondaryLineMapping2 = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        evaluationLineId: savedSecondaryLine2.id,
        version: 1,
        createdBy: systemAdminId,
      });
      await evaluationLineMappingRepository.save(secondaryLineMapping2);

      const revisionComment = '첫 번째 2차 평가자를 수정해주세요.';

      // When - 첫 번째 2차 평가자에게만 재작성 요청
      await service.이차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        evaluatorId: secondaryEvaluatorId,
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment,
        updatedBy: adminId,
      });

      // Then - 재작성 요청이 하나만 생성되어야 함
      const revisionRequests = await revisionRequestRepository.find({
        relations: ['recipients'],
      });
      expect(revisionRequests.length).toBe(1);

      // Then - 첫 번째 2차 평가자에게만 전송되어야 함
      const recipients = revisionRequests[0].recipients;
      expect(recipients.length).toBe(1);
      expect(recipients[0].recipientId).toBe(secondaryEvaluatorId);
      expect(recipients[0].recipientId).not.toBe(secondaryEvaluatorId2);
      expect(recipients[0].recipientType).toBe('secondary_evaluator');

      // When - 두 번째 2차 평가자에게도 재작성 요청
      const revisionComment2 = '두 번째 2차 평가자를 수정해주세요.';
      await service.이차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        evaluatorId: secondaryEvaluatorId2,
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment: revisionComment2,
        updatedBy: adminId,
      });

      // Then - 두 개의 재작성 요청이 생성되어야 함
      const revisionRequests2 = await revisionRequestRepository.find({
        relations: ['recipients'],
      });
      expect(revisionRequests2.length).toBe(2);

      // 각 요청이 다른 평가자에게 전송되었는지 확인
      const recipientIds = revisionRequests2.flatMap((req) =>
        req.recipients.map((r) => r.recipientId),
      );
      expect(recipientIds).toContain(secondaryEvaluatorId);
      expect(recipientIds).toContain(secondaryEvaluatorId2);
    });

    it('존재하지 않는 평가기간-직원 매핑에 대한 상태 변경 시 예외가 발생해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const nonExistentEmployeeId = '123e4567-e89b-12d3-a456-426614174999';

      // When & Then
      await expect(
        service.이차하향평가_확인상태를_변경한다({
          evaluationPeriodId,
          employeeId: nonExistentEmployeeId,
          evaluatorId: secondaryEvaluatorId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: adminId,
        }),
      ).rejects.toThrow('평가기간-직원 맵핑을 찾을 수 없습니다');
    });
  });
});
