import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/get-employee-evaluation-period-status.handler';
import {
  BulkResetDownwardEvaluationsCommand,
  BulkResetDownwardEvaluationsHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/bulk-reset-downward-evaluations.handler';
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
 * Dashboard Context - Downward Evaluation isSubmitted 필드 조회 테스트
 *
 * 대시보드 조회 시 하향평가의 isSubmitted 필드가 제대로 계산되어 반환되는지 검증합니다.
 */
describe('Dashboard Context - Downward Evaluation isSubmitted Field', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let bulkResetHandler: BulkResetDownwardEvaluationsHandler;
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
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;
  let departmentId: string;
  let mappingId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const resetBy = 'test-user-id';

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
        BulkResetDownwardEvaluationsHandler,
      ],
    }).compile();

    handler = module.get<GetEmployeeEvaluationPeriodStatusHandler>(
      GetEmployeeEvaluationPeriodStatusHandler,
    );
    bulkResetHandler = module.get<BulkResetDownwardEvaluationsHandler>(
      BulkResetDownwardEvaluationsHandler,
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
    // 테스트 데이터 정리
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

    // 기본 테스트 데이터 생성
    await 기본_테스트데이터를_생성한다();
  });

  async function 기본_테스트데이터를_생성한다(): Promise<void> {
    // 부서 생성
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

    // 평가기간 생성
    const period = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      description: '테스트용 평가기간',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.PEER_EVALUATION,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(period);
    evaluationPeriodId = savedPeriod.id;

    // 직원 생성
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

    const primaryEvaluator = employeeRepository.create({
      name: '이1차평가자',
      employeeNumber: 'EMP002',
      email: 'primary@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator = await employeeRepository.save(
      primaryEvaluator,
    );
    primaryEvaluatorId = savedPrimaryEvaluator.id;

    const secondaryEvaluator1 = employeeRepository.create({
      name: '박2차평가자1',
      employeeNumber: 'EMP003',
      email: 'secondary1@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator1 = await employeeRepository.save(
      secondaryEvaluator1,
    );
    secondaryEvaluatorId1 = savedSecondaryEvaluator1.id;

    const secondaryEvaluator2 = employeeRepository.create({
      name: '최2차평가자2',
      employeeNumber: 'EMP004',
      email: 'secondary2@test.com',
      externalId: 'EXT004',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator2 = await employeeRepository.save(
      secondaryEvaluator2,
    );
    secondaryEvaluatorId2 = savedSecondaryEvaluator2.id;

    // 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isSelfEvaluationEditable: true,
      isPrimaryEvaluationEditable: true,
      isSecondaryEvaluationEditable: true,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 프로젝트 할당 생성
    await projectAssignmentRepository.save({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });

    // WBS 항목 생성
    const wbs1 = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbs1 = await wbsItemRepository.save(wbs1);
    wbsItemId1 = savedWbs1.id;

    const wbs2 = wbsItemRepository.create({
      wbsCode: 'WBS002',
      title: 'WBS 항목 2',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbs2 = await wbsItemRepository.save(wbs2);
    wbsItemId2 = savedWbs2.id;

    const wbs3 = wbsItemRepository.create({
      wbsCode: 'WBS003',
      title: 'WBS 항목 3',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbs3 = await wbsItemRepository.save(wbs3);
    wbsItemId3 = savedWbs3.id;

    // WBS 할당 생성
    await wbsAssignmentRepository.save({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId3,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });

    // 평가라인 생성
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
    const savedSecondaryLine = await evaluationLineRepository.save(
      secondaryLine,
    );

    // 평가라인 매핑 생성
    await evaluationLineMappingRepository.save({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: savedPrimaryLine.id,
      evaluatorId: primaryEvaluatorId,
      createdBy: systemAdminId,
    });

    await evaluationLineMappingRepository.save({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId1,
      createdBy: systemAdminId,
    });

    await evaluationLineMappingRepository.save({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId2,
      createdBy: systemAdminId,
    });
  }

  describe('isSubmitted 필드 검증', () => {
    it('1차 평가자의 모든 하향평가가 제출되었을 때 isSubmitted가 true여야 한다', async () => {
      // Given - 1차 하향평가 3개를 모두 제출 상태로 생성
      const evaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1);

      const evaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 2',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2);

      const evaluation3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 3',
        downwardEvaluationScore: 90,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - isSubmitted가 true여야 함
      expect(result.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(result.downwardEvaluation.primary.completedEvaluationCount).toBe(
        3,
      );
      expect(result.downwardEvaluation.primary.assignedWbsCount).toBe(3);
    });

    it('1차 평가자의 일부 하향평가만 제출되었을 때 isSubmitted가 false여야 한다', async () => {
      // Given - 1차 하향평가 3개 중 2개만 제출 상태로 생성
      const evaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1);

      const evaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 2',
        downwardEvaluationScore: 85,
        isCompleted: false, // 미제출
      });
      await downwardEvaluationRepository.save(evaluation2);

      const evaluation3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 3',
        downwardEvaluationScore: 90,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - isSubmitted가 false여야 함
      expect(result.downwardEvaluation.primary.isSubmitted).toBe(false);
      expect(result.downwardEvaluation.primary.completedEvaluationCount).toBe(
        2,
      );
      expect(result.downwardEvaluation.primary.assignedWbsCount).toBe(3);
    });

    it('1차 평가자의 하향평가가 없을 때 isSubmitted가 false여야 한다', async () => {
      // Given - 1차 하향평가가 없음

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - isSubmitted가 false여야 함
      expect(result.downwardEvaluation.primary.isSubmitted).toBe(false);
      expect(result.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      expect(result.downwardEvaluation.primary.assignedWbsCount).toBe(3);
    });

    it('2차 평가자1의 모든 하향평가가 제출되었을 때 isSubmitted가 true여야 한다', async () => {
      // Given - 2차 평가자1의 하향평가 3개를 모두 제출 상태로 생성
      const evaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 75,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1);

      const evaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 2',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2);

      const evaluation3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 3',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 평가자1의 isSubmitted가 true여야 함
      const evaluator1 = result.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1?.isSubmitted).toBe(true);
      expect(evaluator1?.completedEvaluationCount).toBe(3);
      expect(evaluator1?.assignedWbsCount).toBe(3);
    });

    it('여러 2차 평가자의 각각 독립적으로 isSubmitted가 계산되어야 한다', async () => {
      // Given - 평가자1은 모두 제출, 평가자2는 일부만 제출
      const evaluator1Evaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 75,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluator1Evaluation1);

      const evaluator1Evaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 2',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluator1Evaluation2);

      const evaluator1Evaluation3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 3',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluator1Evaluation3);

      const evaluator2Evaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 1',
        downwardEvaluationScore: 70,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluator2Evaluation1);

      const evaluator2Evaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 2',
        downwardEvaluationScore: 75,
        isCompleted: false, // 미제출
      });
      await downwardEvaluationRepository.save(evaluator2Evaluation2);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 평가자1은 isSubmitted가 true, 평가자2는 false여야 함
      const evaluator1 = result.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1?.isSubmitted).toBe(true);
      expect(evaluator1?.completedEvaluationCount).toBe(3);

      const evaluator2 = result.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).toBeDefined();
      expect(evaluator2?.isSubmitted).toBe(false);
      expect(evaluator2?.completedEvaluationCount).toBe(1);
    });

    it('일괄 초기화 후 isSubmitted가 false로 변경되어야 한다', async () => {
      // Given - 1차 하향평가 3개를 모두 제출 상태로 생성
      const evaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1);

      const evaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 2',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2);

      const evaluation3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 3',
        downwardEvaluationScore: 90,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3);

      // 초기 상태 확인
      const queryBefore = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const resultBefore = await handler.execute(queryBefore);
      expect(resultBefore.downwardEvaluation.primary.isSubmitted).toBe(true);

      // When - 일괄 초기화 실행
      const resetCommand = new BulkResetDownwardEvaluationsCommand(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        resetBy,
      );
      await bulkResetHandler.execute(resetCommand);

      // Then - isSubmitted가 false로 변경되어야 함
      const queryAfter = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const resultAfter = await handler.execute(queryAfter);
      expect(resultAfter.downwardEvaluation.primary.isSubmitted).toBe(false);
      expect(resultAfter.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
    });
  });
});

