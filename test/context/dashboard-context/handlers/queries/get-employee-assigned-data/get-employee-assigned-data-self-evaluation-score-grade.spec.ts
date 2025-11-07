import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeAssignedDataHandler,
  GetEmployeeAssignedDataQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler';
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
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import {
  SubmitWbsSelfEvaluationToEvaluatorCommand,
  SubmitWbsSelfEvaluationToEvaluatorHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation-to-evaluator.handler';
import {
  SubmitWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation.handler';

/**
 * Dashboard Context - Self Evaluation Score & Grade 조회 테스트
 *
 * 할당 데이터 조회 시 summary.selfEvaluation의 스코어와 등급이 제대로 계산되는지 검증합니다.
 */
describe('Dashboard Context - Self Evaluation Score & Grade', () => {
  let handler: GetEmployeeAssignedDataHandler;
  let submitToEvaluatorHandler: SubmitWbsSelfEvaluationToEvaluatorHandler;
  let submitToManagerHandler: SubmitWbsSelfEvaluationHandler;
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

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let mappingId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;
  let evaluationId1: string;
  let evaluationId2: string;
  let evaluationId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const submittedBy = 'test-user-id';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        WbsSelfEvaluationModule,
        EvaluationPeriodModule,
        EvaluationWbsAssignmentModule,
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
          Deliverable,
          Project,
          WbsItem,
        ]),
      ],
      providers: [
        GetEmployeeAssignedDataHandler,
        SubmitWbsSelfEvaluationToEvaluatorHandler,
        SubmitWbsSelfEvaluationHandler,
      ],
    }).compile();

    handler = module.get<GetEmployeeAssignedDataHandler>(
      GetEmployeeAssignedDataHandler,
    );
    submitToEvaluatorHandler =
      module.get<SubmitWbsSelfEvaluationToEvaluatorHandler>(
        SubmitWbsSelfEvaluationToEvaluatorHandler,
      );
    submitToManagerHandler = module.get<SubmitWbsSelfEvaluationHandler>(
      SubmitWbsSelfEvaluationHandler,
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
      const evaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(evaluations);

      const wbsAssignments = await wbsAssignmentRepository.find();
      await wbsAssignmentRepository.remove(wbsAssignments);

      const projectAssignments = await projectAssignmentRepository.find();
      await projectAssignmentRepository.remove(projectAssignments);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

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
   * 기본 테스트 데이터 생성 (등급 범위 포함)
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

    // 등급 구간 설정
    savedPeriod.등급구간_설정한다(
      [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
      systemAdminId,
    );
    await evaluationPeriodRepository.save(savedPeriod);

    // 등급 구간이 제대로 저장되었는지 확인
    const reloadedPeriod = await evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });
    expect(reloadedPeriod?.등급구간_설정됨()).toBe(true);

    // 3. 직원 생성
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

    // 4. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 5. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 6. WBS 항목 생성 (3개)
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

    // 7. 프로젝트 할당 생성
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

    // 8. WBS 할당 생성 (가중치: 30%, 40%, 30%)
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
  }

  describe('summary.selfEvaluation 스코어 및 등급 검증', () => {
    it('자기평가가 없는 경우 totalScore와 grade는 null이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(0);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(result.summary.selfEvaluation.totalScore).toBeNull();
      expect(result.summary.selfEvaluation.grade).toBeNull();
    });

    it('자기평가가 있지만 제출되지 않은 경우 totalScore와 grade는 null이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성 (제출 전)
      const evaluation1 = wbsSelfEvaluationRepository.create({
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
      await wbsSelfEvaluationRepository.save(evaluation1);

      const evaluation2 = wbsSelfEvaluationRepository.create({
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
      await wbsSelfEvaluationRepository.save(evaluation2);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(result.summary.selfEvaluation.totalScore).toBeNull();
      expect(result.summary.selfEvaluation.grade).toBeNull();
    });

    it('일부만 제출된 경우 totalScore와 grade는 null이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성
      const evaluation1 = wbsSelfEvaluationRepository.create({
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
      const savedEval1 = await wbsSelfEvaluationRepository.save(evaluation1);
      evaluationId1 = savedEval1.id;

      const evaluation2 = wbsSelfEvaluationRepository.create({
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
      const savedEval2 = await wbsSelfEvaluationRepository.save(evaluation2);
      evaluationId2 = savedEval2.id;

      // 1개만 제출
      const submitCommand1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand1);

      const submitToManagerCommand1 = new SubmitWbsSelfEvaluationCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand1);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false); // 일부만 제출
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false); // 일부만 제출
      expect(result.summary.selfEvaluation.totalScore).toBeNull(); // 모두 제출되지 않았으므로 null
      expect(result.summary.selfEvaluation.grade).toBeNull(); // 모두 제출되지 않았으므로 null
    });

    it('모든 자기평가가 제출된 경우 가중치 기반 totalScore와 grade가 계산되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성 (점수: 100, 110, 90)
      // 가중치: 30%, 40%, 30%
      // maxSelfEvaluationRate: 120
      // 계산식: (30% × 100/120 × 100) + (40% × 110/120 × 100) + (30% × 90/120 × 100)
      // = (0.3 × 83.33) + (0.4 × 91.67) + (0.3 × 75.00)
      // = 25.00 + 36.67 + 22.50 = 84.17
      // 내림: 84 → A 등급 (80-84)

      const evaluation1 = wbsSelfEvaluationRepository.create({
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
      const savedEval1 = await wbsSelfEvaluationRepository.save(evaluation1);
      evaluationId1 = savedEval1.id;

      const evaluation2 = wbsSelfEvaluationRepository.create({
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
      const savedEval2 = await wbsSelfEvaluationRepository.save(evaluation2);
      evaluationId2 = savedEval2.id;

      const evaluation3 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId3,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 3',
        selfEvaluationContent: '자기평가 내용 3',
        selfEvaluationScore: 90,
        createdBy: systemAdminId,
      });
      const savedEval3 = await wbsSelfEvaluationRepository.save(evaluation3);
      evaluationId3 = savedEval3.id;

      // 모든 자기평가 제출
      const submitToEvaluatorCommand1 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId1,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand1);

      const submitToEvaluatorCommand2 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId2,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand2);

      const submitToEvaluatorCommand3 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId3,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand3);

      const submitToManagerCommand1 = new SubmitWbsSelfEvaluationCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand1);

      const submitToManagerCommand2 = new SubmitWbsSelfEvaluationCommand(
        evaluationId2,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand2);

      const submitToManagerCommand3 = new SubmitWbsSelfEvaluationCommand(
        evaluationId3,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(3);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(3);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(3);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(true);

      // totalScore 계산 검증
      // 계산식: (30% × 100/120 × 100) + (40% × 110/120 × 100) + (30% × 90/120 × 100)
      // = (0.3 × 83.33) + (0.4 × 91.67) + (0.3 × 75.00)
      // = 25.00 + 36.67 + 22.50 = 84.17
      // 내림: 84 → A 등급 (80-84)
      expect(result.summary.selfEvaluation.totalScore).toBe(84);

      // 등급 계산 검증 (84점이면 A 등급 범위: 80-84)
      expect(result.summary.selfEvaluation.grade).toBe('A');
    });

    it('높은 점수로 S+ 등급이 계산되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성 (모두 높은 점수: 120, 120, 120)
      // 가중치: 30%, 40%, 30%
      // 계산식: (30% × 120/120 × 100) + (40% × 120/120 × 100) + (30% × 120/120 × 100)
      // = (0.3 × 100) + (0.4 × 100) + (0.3 × 100) = 100점

      const evaluation1 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 1',
        selfEvaluationContent: '자기평가 내용 1',
        selfEvaluationScore: 120,
        createdBy: systemAdminId,
      });
      const savedEval1 = await wbsSelfEvaluationRepository.save(evaluation1);
      evaluationId1 = savedEval1.id;

      const evaluation2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId2,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 2',
        selfEvaluationContent: '자기평가 내용 2',
        selfEvaluationScore: 120,
        createdBy: systemAdminId,
      });
      const savedEval2 = await wbsSelfEvaluationRepository.save(evaluation2);
      evaluationId2 = savedEval2.id;

      const evaluation3 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId3,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 3',
        selfEvaluationContent: '자기평가 내용 3',
        selfEvaluationScore: 120,
        createdBy: systemAdminId,
      });
      const savedEval3 = await wbsSelfEvaluationRepository.save(evaluation3);
      evaluationId3 = savedEval3.id;

      // 모든 자기평가 제출
      const submitToEvaluatorCommand1 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId1,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand1);

      const submitToEvaluatorCommand2 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId2,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand2);

      const submitToEvaluatorCommand3 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId3,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand3);

      const submitToManagerCommand1 = new SubmitWbsSelfEvaluationCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand1);

      const submitToManagerCommand2 = new SubmitWbsSelfEvaluationCommand(
        evaluationId2,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand2);

      const submitToManagerCommand3 = new SubmitWbsSelfEvaluationCommand(
        evaluationId3,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalScore).toBe(100);
      expect(result.summary.selfEvaluation.grade).toBe('S+'); // 95-100 범위
    });

    it('낮은 점수로 C 등급이 계산되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성 (모두 낮은 점수: 60, 60, 60)
      // 가중치: 30%, 40%, 30%
      // 계산식: (30% × 60/120 × 100) + (40% × 60/120 × 100) + (30% × 60/120 × 100)
      // = (0.3 × 50) + (0.4 × 50) + (0.3 × 50) = 50점

      const evaluation1 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 1',
        selfEvaluationContent: '자기평가 내용 1',
        selfEvaluationScore: 60,
        createdBy: systemAdminId,
      });
      const savedEval1 = await wbsSelfEvaluationRepository.save(evaluation1);
      evaluationId1 = savedEval1.id;

      const evaluation2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId2,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 2',
        selfEvaluationContent: '자기평가 내용 2',
        selfEvaluationScore: 60,
        createdBy: systemAdminId,
      });
      const savedEval2 = await wbsSelfEvaluationRepository.save(evaluation2);
      evaluationId2 = savedEval2.id;

      const evaluation3 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId3,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 3',
        selfEvaluationContent: '자기평가 내용 3',
        selfEvaluationScore: 60,
        createdBy: systemAdminId,
      });
      const savedEval3 = await wbsSelfEvaluationRepository.save(evaluation3);
      evaluationId3 = savedEval3.id;

      // 모든 자기평가 제출
      const submitToEvaluatorCommand1 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId1,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand1);

      const submitToEvaluatorCommand2 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId2,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand2);

      const submitToEvaluatorCommand3 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId3,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand3);

      const submitToManagerCommand1 = new SubmitWbsSelfEvaluationCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand1);

      const submitToManagerCommand2 = new SubmitWbsSelfEvaluationCommand(
        evaluationId2,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand2);

      const submitToManagerCommand3 = new SubmitWbsSelfEvaluationCommand(
        evaluationId3,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalScore).toBe(50);
      expect(result.summary.selfEvaluation.grade).toBe('C'); // 0-69 범위
    });

    it('가중치가 다른 WBS들의 점수가 올바르게 계산되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성
      // WBS1: 가중치 30%, 점수 100
      // WBS2: 가중치 40%, 점수 80
      // WBS3: 가중치 30%, 점수 120
      // 계산식: (30% × 100/120 × 100) + (40% × 80/120 × 100) + (30% × 120/120 × 100)
      // = (0.3 × 83.33) + (0.4 × 66.67) + (0.3 × 100)
      // = 25.00 + 26.67 + 30.00 = 81.67
      // 내림: 81 → A 등급 (80-84)

      const evaluation1 = wbsSelfEvaluationRepository.create({
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
      const savedEval1 = await wbsSelfEvaluationRepository.save(evaluation1);
      evaluationId1 = savedEval1.id;

      const evaluation2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId2,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 2',
        selfEvaluationContent: '자기평가 내용 2',
        selfEvaluationScore: 80,
        createdBy: systemAdminId,
      });
      const savedEval2 = await wbsSelfEvaluationRepository.save(evaluation2);
      evaluationId2 = savedEval2.id;

      const evaluation3 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId3,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과 3',
        selfEvaluationContent: '자기평가 내용 3',
        selfEvaluationScore: 120,
        createdBy: systemAdminId,
      });
      const savedEval3 = await wbsSelfEvaluationRepository.save(evaluation3);
      evaluationId3 = savedEval3.id;

      // 모든 자기평가 제출
      const submitToEvaluatorCommand1 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId1,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand1);

      const submitToEvaluatorCommand2 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId2,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand2);

      const submitToEvaluatorCommand3 =
        new SubmitWbsSelfEvaluationToEvaluatorCommand(
          evaluationId3,
          submittedBy,
        );
      await submitToEvaluatorHandler.execute(submitToEvaluatorCommand3);

      const submitToManagerCommand1 = new SubmitWbsSelfEvaluationCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand1);

      const submitToManagerCommand2 = new SubmitWbsSelfEvaluationCommand(
        evaluationId2,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand2);

      const submitToManagerCommand3 = new SubmitWbsSelfEvaluationCommand(
        evaluationId3,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      // 계산식: (30% × 100/120 × 100) + (40% × 80/120 × 100) + (30% × 120/120 × 100)
      // = (0.3 × 83.33) + (0.4 × 66.67) + (0.3 × 100)
      // = 25.00 + 26.67 + 30.00 = 81.67
      // 내림: 81 → A 등급 (80-84)
      expect(result.summary.selfEvaluation.totalScore).toBe(81);

      // 가중치가 높은 WBS2(40%)의 영향이 더 크게 반영되어야 함
      // 81점이면 A 등급 범위 (80-84)
      expect(result.summary.selfEvaluation.grade).toBe('A');
    });
  });
});
