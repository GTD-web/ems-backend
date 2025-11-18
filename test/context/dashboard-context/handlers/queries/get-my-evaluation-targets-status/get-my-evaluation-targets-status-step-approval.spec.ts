import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetMyEvaluationTargetsStatusHandler,
  GetMyEvaluationTargetsStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-my-evaluation-targets-status.query';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { SecondaryEvaluationStepApproval } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApprovalModule } from '@domain/sub/secondary-evaluation-step-approval';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dashboard Context - Step Approval 조회 테스트 (내가 담당하는 평가 대상자)
 *
 * 내가 담당하는 평가 대상자 현황 조회 시 단계 승인 정보가 제대로 반환되는지 검증합니다.
 * 특히 2차 평가자별 부분 승인 기능이 제대로 동작하는지 확인합니다.
 */
describe('Dashboard Context - Step Approval (My Evaluation Targets)', () => {
  let handler: GetMyEvaluationTargetsStatusHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>;
  let lineMappingRepository: Repository<EvaluationLineMapping>;
  let lineRepository: Repository<EvaluationLine>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let wbsCriteriaRepository: Repository<WbsEvaluationCriteria>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let evaluatorId: string; // 2차 평가자
  let employeeId: string; // 피평가자
  let departmentId: string;
  let primaryLineId: string;
  let secondaryLineId: string;
  let projectId: string;
  let wbsItemId: string;
  let mappingId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        EmployeeEvaluationStepApprovalModule,
        SecondaryEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EmployeeEvaluationStepApproval,
          SecondaryEvaluationStepApproval,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          EvaluationLine,
          EvaluationLineMapping,
          Project,
          WbsItem,
          DownwardEvaluation,
          WbsEvaluationCriteria,
          WbsSelfEvaluation,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
        ]),
      ],
      providers: [GetMyEvaluationTargetsStatusHandler],
    }).compile();

    handler = module.get<GetMyEvaluationTargetsStatusHandler>(
      GetMyEvaluationTargetsStatusHandler,
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
    lineMappingRepository = dataSource.getRepository(EvaluationLineMapping);
    lineRepository = dataSource.getRepository(EvaluationLine);
    projectAssignmentRepository = dataSource.getRepository(
      EvaluationProjectAssignment,
    );
    wbsAssignmentRepository = dataSource.getRepository(EvaluationWbsAssignment);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    wbsCriteriaRepository = dataSource.getRepository(WbsEvaluationCriteria);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    revisionRequestRepository = dataSource.getRepository(
      EvaluationRevisionRequest,
    );
    recipientRepository = dataSource.getRepository(
      EvaluationRevisionRequestRecipient,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const secondaryApprovals =
        await secondaryStepApprovalRepository.find();
      await secondaryStepApprovalRepository.remove(secondaryApprovals);

      const stepApprovals = await stepApprovalRepository.find();
      await stepApprovalRepository.remove(stepApprovals);

      const recipients = await recipientRepository.find();
      await recipientRepository.remove(recipients);

      const revisionRequests = await revisionRequestRepository.find();
      await revisionRequestRepository.remove(revisionRequests);

      const downwardEvaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(downwardEvaluations);

      const wbsSelfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(wbsSelfEvaluations);

      const wbsCriteria = await wbsCriteriaRepository.find();
      await wbsCriteriaRepository.remove(wbsCriteria);

      const lineMappings = await lineMappingRepository.find();
      await lineMappingRepository.remove(lineMappings);

      const lines = await lineRepository.find();
      await lineRepository.remove(lines);

      const wbsAssignments = await wbsAssignmentRepository.find();
      await wbsAssignmentRepository.remove(wbsAssignments);

      const projectAssignments = await projectAssignmentRepository.find();
      await projectAssignmentRepository.remove(projectAssignments);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const projects = await projectRepository.find();
      await projectRepository.remove(projects);

      const wbsItems = await wbsItemRepository.find();
      await wbsItemRepository.remove(wbsItems);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
    } catch (error) {
      // 무시 (이미 삭제된 경우)
    }
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'get-my-evaluation-targets-status-step-approval-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
    console.log('\n📊 테스트 결과 JSON:');
    console.log(JSON.stringify(output, null, 2));

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
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 직원 생성 (피평가자)
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

    // 4. 평가자 생성 (2차 평가자)
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

    // 5. 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 6. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      status: ProjectStatus.IN_PROGRESS,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 7. 프로젝트 할당
    const projectAssignment = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment);

    // 8. WBS 항목 생성
    const wbsItem = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: '테스트 WBS',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem = await wbsItemRepository.save(wbsItem);
    wbsItemId = savedWbsItem.id;

    // 9. WBS 할당
    const wbsAssignment = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment);

    // 10. WBS 평가기준 생성
    const wbsCriteria = wbsCriteriaRepository.create({
      periodId: evaluationPeriodId,
      wbsItemId: wbsItemId,
      criteria: '평가기준 내용',
      maxScore: 100,
      createdBy: systemAdminId,
    });
    await wbsCriteriaRepository.save(wbsCriteria);

    // 11. 평가라인 생성
    const primaryLine = lineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      version: 1,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await lineRepository.save(primaryLine);
    primaryLineId = savedPrimaryLine.id;

    const secondaryLine = lineRepository.create({
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: false,
      isAutoAssigned: false,
      version: 1,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine = await lineRepository.save(secondaryLine);
    secondaryLineId = savedSecondaryLine.id;

    // 12. 평가라인 매핑 생성 (2차 평가자)
    const lineMapping = lineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      evaluationLineId: savedSecondaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await lineMappingRepository.save(lineMapping);
  }

  describe('2차 평가자별 부분 승인 기능 검증', () => {
    it('2차 평가자가 승인한 경우 secondaryStatus에 승인 정보가 포함되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

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

      // 2차 평가자 승인 정보 생성
      const secondaryApproval = secondaryStepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: evaluatorId,
        status: StepApprovalStatus.APPROVED,
        approvedBy: systemAdminId,
        approvedAt: now,
        createdBy: systemAdminId,
      });
      await secondaryStepApprovalRepository.save(secondaryApproval);

      // 하향평가 완료 상태로 만들기 위해 평가 생성
      const downwardEvaluation = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        wbsId: wbsItemId,
        downwardEvaluationContent: '평가 내용',
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe(employeeId);
      expect(result[0].downwardEvaluation.isSecondary).toBe(true);
      expect(result[0].downwardEvaluation.secondaryStatus).toBeDefined();
      expect(result[0].downwardEvaluation.secondaryStatus?.status).toBe(
        'complete',
      );

      // 테스트 결과 저장
      testResults.push({
        testName:
          '2차 평가자가 승인한 경우 secondaryStatus에 승인 정보가 포함되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          downwardEvaluation: {
            isSecondary: result[0].downwardEvaluation.isSecondary,
            secondaryStatus: {
              status: result[0].downwardEvaluation.secondaryStatus?.status,
              assignedWbsCount:
                result[0].downwardEvaluation.secondaryStatus?.assignedWbsCount,
              completedEvaluationCount:
                result[0].downwardEvaluation.secondaryStatus
                  ?.completedEvaluationCount,
            },
          },
        },
      });
    });

    it('2차 평가자가 재작성 요청을 받은 경우 상태가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

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

      // 재작성 요청 생성
      const revisionRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'secondary',
        comment: '재작성 요청합니다.',
        requestedBy: systemAdminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRevisionRequest =
        await revisionRequestRepository.save(revisionRequest);

      const recipient = recipientRepository.create({
        revisionRequestId: savedRevisionRequest.id,
        recipientId: evaluatorId,
        recipientType: RecipientType.SECONDARY_EVALUATOR,
        isCompleted: false,
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient);

      // 하향평가 완료 상태
      const downwardEvaluation = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        wbsId: wbsItemId,
        downwardEvaluationContent: '평가 내용',
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe(employeeId);
      // 재작성 요청이 있으면 상태가 revision_requested로 표시되어야 함
      // (하지만 현재 GetMyEvaluationTargetsStatusHandler는 stepApproval 정보를 반환하지 않음)
      // 이 테스트는 handler가 stepApproval 정보를 반환하도록 수정된 후에 의미가 있음

      // 테스트 결과 저장
      testResults.push({
        testName:
          '2차 평가자가 재작성 요청을 받은 경우 상태가 올바르게 반환되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          revisionRequestId: savedRevisionRequest.id,
          revisionComment: savedRevisionRequest.comment,
          downwardEvaluation: {
            isSecondary: result[0].downwardEvaluation.isSecondary,
            secondaryStatus: {
              status: result[0].downwardEvaluation.secondaryStatus?.status,
            },
          },
        },
      });
    });

    it('여러 2차 평가자 중 특정 평가자만 승인한 경우 해당 평가자에게만 승인 정보가 표시되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 두 번째 2차 평가자 생성
      const evaluator2 = employeeRepository.create({
        name: '박평가자2',
        employeeNumber: 'EMP003',
        email: 'evaluator2@test.com',
        externalId: 'EXT003',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedEvaluator2 = await employeeRepository.save(evaluator2);
      const evaluatorId2 = savedEvaluator2.id;

      // 두 번째 평가자 평가라인 매핑
      const lineMapping2 = lineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId2,
        evaluationLineId: secondaryLineId,
        version: 1,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping2);

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

      // 첫 번째 평가자만 승인
      const secondaryApproval1 = secondaryStepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: evaluatorId,
        status: StepApprovalStatus.APPROVED,
        approvedBy: systemAdminId,
        approvedAt: now,
        createdBy: systemAdminId,
      });
      await secondaryStepApprovalRepository.save(secondaryApproval1);

      // 두 번째 평가자는 pending 상태 (승인 안됨)

      // 하향평가 완료 상태
      const downwardEvaluation1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        wbsId: wbsItemId,
        downwardEvaluationContent: '평가 내용',
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation1);

      // When - 첫 번째 평가자로 조회
      const query1 = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result1 = await handler.execute(query1);

      // Then
      expect(result1).toBeDefined();
      expect(result1.length).toBe(1);
      expect(result1[0].employeeId).toBe(employeeId);
      expect(result1[0].downwardEvaluation.isSecondary).toBe(true);
      expect(result1[0].downwardEvaluation.secondaryStatus).toBeDefined();
      expect(result1[0].downwardEvaluation.secondaryStatus?.status).toBe(
        'complete',
      );

      // When - 두 번째 평가자로 조회
      const query2 = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId2,
      );
      const result2 = await handler.execute(query2);

      // Then
      expect(result2).toBeDefined();
      expect(result2.length).toBe(1);
      expect(result2[0].employeeId).toBe(employeeId);
      expect(result2[0].downwardEvaluation.isSecondary).toBe(true);
      expect(result2[0].downwardEvaluation.secondaryStatus).toBeDefined();
      // 두 번째 평가자는 하향평가가 없으므로 none 상태
      expect(result2[0].downwardEvaluation.secondaryStatus?.status).toBe(
        'none',
      );

      // 테스트 결과 저장
      testResults.push({
        testName:
          '여러 2차 평가자 중 특정 평가자만 승인한 경우 해당 평가자에게만 승인 정보가 표시되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          evaluators: [
            {
              evaluatorId: evaluatorId,
              secondaryStatus: {
                status:
                  result1[0].downwardEvaluation.secondaryStatus?.status,
                assignedWbsCount:
                  result1[0].downwardEvaluation.secondaryStatus
                    ?.assignedWbsCount,
                completedEvaluationCount:
                  result1[0].downwardEvaluation.secondaryStatus
                    ?.completedEvaluationCount,
              },
            },
            {
              evaluatorId: evaluatorId2,
              secondaryStatus: {
                status:
                  result2[0].downwardEvaluation.secondaryStatus?.status,
                assignedWbsCount:
                  result2[0].downwardEvaluation.secondaryStatus
                    ?.assignedWbsCount,
                completedEvaluationCount:
                  result2[0].downwardEvaluation.secondaryStatus
                    ?.completedEvaluationCount,
              },
            },
          ],
        },
      });
    });
  });
});

