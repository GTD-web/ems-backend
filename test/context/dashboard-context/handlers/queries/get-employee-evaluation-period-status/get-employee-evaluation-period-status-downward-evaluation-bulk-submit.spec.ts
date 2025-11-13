import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/get-employee-evaluation-period-status.handler';
import {
  BulkSubmitDownwardEvaluationsCommand,
  BulkSubmitDownwardEvaluationsHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/bulk-submit-downward-evaluations.handler';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { DownwardEvaluationModule } from '@domain/core/downward-evaluation/downward-evaluation.module';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

/**
 * Dashboard Context - Downward Evaluation Bulk Submit Status 조회 테스트
 *
 * 대시보드 조회 시 일괄 제출된 하향평가의 상태와 수량이 제대로 계산되는지 검증합니다.
 */
describe('Dashboard Context - Downward Evaluation Bulk Submit Status', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let bulkSubmitHandler: BulkSubmitDownwardEvaluationsHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let departmentId: string;
  let mappingId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;
  let primaryEvaluationId1: string;
  let primaryEvaluationId2: string;
  let primaryEvaluationId3: string;
  let secondaryEvaluationId1: string;
  let secondaryEvaluationId2: string;
  let secondaryEvaluationId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const submittedBy = 'test-user-id';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        EmployeeEvaluationStepApprovalModule,
        EvaluationRevisionRequestModule,
        WbsSelfEvaluationModule,
        EvaluationPeriodModule,
        EvaluationWbsAssignmentModule,
        DownwardEvaluationModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
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
          Project,
          WbsItem,
        ]),
      ],
      providers: [
        GetEmployeeEvaluationPeriodStatusHandler,
        BulkSubmitDownwardEvaluationsHandler,
      ],
    }).compile();

    handler = module.get<GetEmployeeEvaluationPeriodStatusHandler>(
      GetEmployeeEvaluationPeriodStatusHandler,
    );
    bulkSubmitHandler = module.get<BulkSubmitDownwardEvaluationsHandler>(
      BulkSubmitDownwardEvaluationsHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    projectAssignmentRepository = dataSource.getRepository(
      EvaluationProjectAssignment,
    );
    wbsAssignmentRepository = dataSource.getRepository(EvaluationWbsAssignment);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const evaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(evaluations);

      const mappings = await evaluationLineMappingRepository.find();
      await evaluationLineMappingRepository.remove(mappings);

      const lines = await evaluationLineRepository.find();
      await evaluationLineRepository.remove(lines);

      const selfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(selfEvaluations);

      const wbsAssignments = await wbsAssignmentRepository.find();
      await wbsAssignmentRepository.remove(wbsAssignments);

      const projectAssignments = await projectAssignmentRepository.find();
      await projectAssignmentRepository.remove(projectAssignments);

      const periodMappings = await mappingRepository.find();
      await mappingRepository.remove(periodMappings);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);

      const projects = await projectRepository.find();
      await projectRepository.remove(projects);

      const wbsItems = await wbsItemRepository.find();
      await wbsItemRepository.remove(wbsItems);
    } catch (error) {
      // 초기 테스트에서는 무시
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
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.PEER_EVALUATION,
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
      name: '이1차평가자',
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
      name: '박2차평가자',
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

    // 7. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 8. WBS 항목 생성
    const wbsItem1 = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);
    wbsItemId1 = savedWbsItem1.id;

    const wbsItem2 = wbsItemRepository.create({
      wbsCode: 'WBS002',
      title: 'WBS 항목 2',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);
    wbsItemId2 = savedWbsItem2.id;

    const wbsItem3 = wbsItemRepository.create({
      wbsCode: 'WBS003',
      title: 'WBS 항목 3',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem3 = await wbsItemRepository.save(wbsItem3);
    wbsItemId3 = savedWbsItem3.id;

    // 9. 프로젝트 할당 생성
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

    // 10. WBS 할당 생성
    const wbsAssignment1 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      weight: 30,
      displayOrder: 0,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment1);

    const wbsAssignment2 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId2,
      weight: 40,
      displayOrder: 1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment2);

    const wbsAssignment3 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId3,
      weight: 30,
      displayOrder: 2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment3);

    // 11. 자기평가 생성
    const selfEvaluation1 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 1',
      selfEvaluationContent: '자기평가 내용 1',
      selfEvaluationScore: 100,
      createdBy: systemAdminId,
    });
    await wbsSelfEvaluationRepository.save(selfEvaluation1);

    const selfEvaluation2 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 2',
      selfEvaluationContent: '자기평가 내용 2',
      selfEvaluationScore: 110,
      createdBy: systemAdminId,
    });
    await wbsSelfEvaluationRepository.save(selfEvaluation2);

    const selfEvaluation3 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId3,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 3',
      selfEvaluationContent: '자기평가 내용 3',
      selfEvaluationScore: 105,
      createdBy: systemAdminId,
    });
    await wbsSelfEvaluationRepository.save(selfEvaluation3);

    // 12. 평가라인 생성
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);

    const secondaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine =
      await evaluationLineRepository.save(secondaryLine);

    // 13. 평가라인 매핑 생성 (직원별 고정 담당자 - wbsItemId는 null)
    const primaryMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      wbsItemId: null as any,
      evaluationLineId: savedPrimaryLine.id,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(primaryMapping);

    // 14. 1차 하향평가 생성
    const primaryEvaluation1 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      wbsId: wbsItemId1,
      periodId: evaluationPeriodId,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용 1',
      downwardEvaluationScore: 95,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation1 =
      await downwardEvaluationRepository.save(primaryEvaluation1);
    primaryEvaluationId1 = savedPrimaryEvaluation1.id;

    const primaryEvaluation2 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      wbsId: wbsItemId2,
      periodId: evaluationPeriodId,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용 2',
      downwardEvaluationScore: 90,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation2 =
      await downwardEvaluationRepository.save(primaryEvaluation2);
    primaryEvaluationId2 = savedPrimaryEvaluation2.id;

    const primaryEvaluation3 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      wbsId: wbsItemId3,
      periodId: evaluationPeriodId,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용 3',
      downwardEvaluationScore: 88,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation3 =
      await downwardEvaluationRepository.save(primaryEvaluation3);
    primaryEvaluationId3 = savedPrimaryEvaluation3.id;

    // 15. 평가라인 매핑 생성 (WBS별 평가자 - wbsItemId 포함)
    const secondaryMapping1 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      wbsItemId: wbsItemId1,
      evaluationLineId: savedSecondaryLine.id,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping1);

    const secondaryMapping2 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      wbsItemId: wbsItemId2,
      evaluationLineId: savedSecondaryLine.id,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping2);

    const secondaryMapping3 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      wbsItemId: wbsItemId3,
      evaluationLineId: savedSecondaryLine.id,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping3);

    // 16. 2차 하향평가 생성
    const secondaryEvaluation1 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      wbsId: wbsItemId1,
      periodId: evaluationPeriodId,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용 1',
      downwardEvaluationScore: 85,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation1 =
      await downwardEvaluationRepository.save(secondaryEvaluation1);
    secondaryEvaluationId1 = savedSecondaryEvaluation1.id;

    const secondaryEvaluation2 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      wbsId: wbsItemId2,
      periodId: evaluationPeriodId,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용 2',
      downwardEvaluationScore: 80,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation2 =
      await downwardEvaluationRepository.save(secondaryEvaluation2);
    secondaryEvaluationId2 = savedSecondaryEvaluation2.id;

    const secondaryEvaluation3 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: secondaryEvaluatorId,
      wbsId: wbsItemId3,
      periodId: evaluationPeriodId,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용 3',
      downwardEvaluationScore: 75,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation3 =
      await downwardEvaluationRepository.save(secondaryEvaluation3);
    secondaryEvaluationId3 = savedSecondaryEvaluation3.id;
  }

  describe('1차 하향평가 일괄 제출 후 대시보드 상태 조회', () => {
    it('일괄 제출 전 상태는 in_progress이고 completedEvaluationCount가 0이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result?.downwardEvaluation.primary.status).toBe('in_progress');
      expect(result?.downwardEvaluation.primary.assignedWbsCount).toBe(3);
      expect(result?.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      expect(result?.downwardEvaluation.primary.totalScore).toBeNull();
    });

    it('1차 하향평가 일괄 제출 후 상태는 complete이고 completedEvaluationCount가 3이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 일괄 제출
      const command = new BulkSubmitDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      await bulkSubmitHandler.execute(command);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result?.downwardEvaluation.primary.status).toBe('complete');
      expect(result?.downwardEvaluation.primary.assignedWbsCount).toBe(3);
      expect(result?.downwardEvaluation.primary.completedEvaluationCount).toBe(
        3,
      );
      expect(result?.downwardEvaluation.primary.totalScore).not.toBeNull();
      // 가중치 기반 총점 계산 (30% * 95 + 40% * 90 + 30% * 88) / 100 * 100
      // 실제 계산은 가중치와 평가기간 설정에 따라 달라질 수 있음
    });

    it('일부 1차 하향평가만 제출된 경우 상태는 in_progress이고 completedEvaluationCount가 제출된 수와 일치해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1번 평가만 제출
      const command = new BulkSubmitDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      // 2번, 3번 평가의 내용 제거하여 제출 실패시키기
      await downwardEvaluationRepository.update(
        { id: primaryEvaluationId2 },
        {
          downwardEvaluationContent: null as any,
        },
      );
      await downwardEvaluationRepository.update(
        { id: primaryEvaluationId3 },
        {
          downwardEvaluationScore: null as any,
        },
      );

      const result = await bulkSubmitHandler.execute(command);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const statusResult = await handler.execute(query);

      // Then
      expect(result.submittedCount).toBe(1); // 1번만 제출
      expect(result.failedCount).toBe(2); // 2번, 3번은 실패

      expect(statusResult).toBeDefined();
      expect(statusResult?.downwardEvaluation.primary.status).toBe(
        'in_progress',
      );
      expect(statusResult?.downwardEvaluation.primary.assignedWbsCount).toBe(3);
      expect(
        statusResult?.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(1); // 1개만 완료
    });

    it('일괄 제출 후 모든 1차 하향평가가 완료 상태인지 확인해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When - 1차 하향평가 일괄 제출
      const command = new BulkSubmitDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      await bulkSubmitHandler.execute(command);

      // Then - DB에서 직접 확인
      const evaluations = await downwardEvaluationRepository.find({
        where: {
          evaluatorId: primaryEvaluatorId,
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          deletedAt: IsNull(),
        },
      });

      expect(evaluations.length).toBe(3);
      expect(evaluations.every((e) => e.isCompleted)).toBe(true);
      expect(evaluations.every((e) => e.completedAt !== null)).toBe(true);
    });
  });

  describe('2차 하향평가 일괄 제출 후 대시보드 상태 조회', () => {
    it('2차 하향평가 일괄 제출 후 상태는 complete이고 completedEvaluationCount가 3이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 하향평가 일괄 제출
      const command = new BulkSubmitDownwardEvaluationsCommand(
        secondaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        submittedBy,
      );
      await bulkSubmitHandler.execute(command);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result?.downwardEvaluation.secondary.evaluators.length).toBe(1);
      expect(result?.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'complete',
      );
      expect(
        result?.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(3);
      expect(
        result?.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(3);
      expect(result?.downwardEvaluation.secondary.totalScore).not.toBeNull();
    });

    it('1차와 2차 하향평가를 독립적으로 일괄 제출한 후 각각의 상태가 올바르게 조회되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 일괄 제출
      const primaryCommand = new BulkSubmitDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      await bulkSubmitHandler.execute(primaryCommand);

      // 2차 하향평가 일괄 제출
      const secondaryCommand = new BulkSubmitDownwardEvaluationsCommand(
        secondaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        submittedBy,
      );
      await bulkSubmitHandler.execute(secondaryCommand);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();

      // 1차 하향평가 상태 확인
      expect(result?.downwardEvaluation.primary.status).toBe('complete');
      expect(result?.downwardEvaluation.primary.assignedWbsCount).toBe(3);
      expect(result?.downwardEvaluation.primary.completedEvaluationCount).toBe(
        3,
      );
      expect(result?.downwardEvaluation.primary.totalScore).not.toBeNull();

      // 2차 하향평가 상태 확인
      expect(result?.downwardEvaluation.secondary.evaluators.length).toBe(1);
      expect(result?.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'complete',
      );
      expect(
        result?.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(3);
      expect(
        result?.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(3);
      expect(result?.downwardEvaluation.secondary.totalScore).not.toBeNull();
    });

    it('일부만 제출된 경우 completedEvaluationCount가 제출된 수와 정확히 일치해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1번 평가만 제출 가능하도록 나머지는 필수 항목 제거
      await downwardEvaluationRepository.update(
        { id: secondaryEvaluationId2 },
        {
          downwardEvaluationContent: null as any,
        },
      );
      await downwardEvaluationRepository.update(
        { id: secondaryEvaluationId3 },
        {
          downwardEvaluationScore: null as any,
        },
      );

      // 2차 하향평가 일괄 제출 (1번만 성공)
      const command = new BulkSubmitDownwardEvaluationsCommand(
        secondaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        submittedBy,
      );
      const submitResult = await bulkSubmitHandler.execute(command);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const statusResult = await handler.execute(query);

      // Then
      expect(submitResult.submittedCount).toBe(1);
      expect(submitResult.failedCount).toBe(2);

      expect(statusResult).toBeDefined();
      expect(
        statusResult?.downwardEvaluation.secondary.evaluators[0].status,
      ).toBe('in_progress');
      expect(
        statusResult?.downwardEvaluation.secondary.evaluators[0]
          .assignedWbsCount,
      ).toBe(3);
      expect(
        statusResult?.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(1); // 1개만 완료
    });
  });

  describe('일괄 제출 후 수량 검증', () => {
    it('assignedWbsCount와 completedEvaluationCount가 정확히 일치해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 일괄 제출
      const command = new BulkSubmitDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const submitResult = await bulkSubmitHandler.execute(command);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const statusResult = await handler.execute(query);

      // Then
      expect(submitResult.submittedCount).toBe(3);

      // WBS 할당 수 확인
      const assignedWbsCount = await wbsAssignmentRepository.count({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: IsNull(),
        },
      });

      expect(statusResult?.downwardEvaluation.primary.assignedWbsCount).toBe(
        assignedWbsCount,
      );
      expect(
        statusResult?.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(submitResult.submittedCount);

      // DB에서 직접 확인
      const completedEvaluations = await downwardEvaluationRepository.find({
        where: {
          evaluatorId: primaryEvaluatorId,
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          isCompleted: true,
          deletedAt: IsNull(),
        },
      });

      expect(completedEvaluations.length).toBe(
        statusResult?.downwardEvaluation.primary.completedEvaluationCount,
      );
    });

    it('일괄 제출 실패한 평가는 completedEvaluationCount에 포함되지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2번 평가의 필수 항목 제거
      await downwardEvaluationRepository.update(
        { id: primaryEvaluationId2 },
        {
          downwardEvaluationContent: null as any,
          downwardEvaluationScore: null as any,
        },
      );

      // 1차 하향평가 일괄 제출
      const command = new BulkSubmitDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const submitResult = await bulkSubmitHandler.execute(command);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const statusResult = await handler.execute(query);

      // Then
      expect(submitResult.submittedCount).toBe(2); // 1번, 3번만 제출
      expect(submitResult.failedCount).toBe(1); // 2번은 실패

      expect(
        statusResult?.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(2); // 실패한 평가는 제외

      // DB에서 직접 확인
      const completedEvaluations = await downwardEvaluationRepository.find({
        where: {
          evaluatorId: primaryEvaluatorId,
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          isCompleted: true,
          deletedAt: IsNull(),
        },
      });

      expect(completedEvaluations.length).toBe(2);
      expect(completedEvaluations.map((e) => e.id)).toContain(
        primaryEvaluationId1,
      );
      expect(completedEvaluations.map((e) => e.id)).toContain(
        primaryEvaluationId3,
      );
      expect(completedEvaluations.map((e) => e.id)).not.toContain(
        primaryEvaluationId2,
      );
    });
  });
});
