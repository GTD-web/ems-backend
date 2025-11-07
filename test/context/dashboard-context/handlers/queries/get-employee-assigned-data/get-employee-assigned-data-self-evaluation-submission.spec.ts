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
 * Dashboard Context - Self Evaluation Submission Status 조회 테스트 (할당 데이터)
 *
 * 할당 데이터 조회 시 1차 평가자와 피평가자 간의 제출 상태가 제대로 조회되는지 검증합니다.
 */
describe('Dashboard Context - Self Evaluation Submission Status (Assigned Data)', () => {
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
  let evaluationId1: string;
  let evaluationId2: string;

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

    // 6. WBS 항목 생성
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

    // 8. WBS 할당 생성
    const wbsAssignment1 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      weight: 50,
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
      weight: 50,
      displayOrder: 1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment2);

    // 9. 자기평가 생성
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
    const savedEvaluation1 =
      await wbsSelfEvaluationRepository.save(evaluation1);
    evaluationId1 = savedEvaluation1.id;

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
    const savedEvaluation2 =
      await wbsSelfEvaluationRepository.save(evaluation2);
    evaluationId2 = savedEvaluation2.id;
  }

  describe('자기평가 제출 상태 조회 (할당 데이터)', () => {
    it('자기평가가 1차 평가자에게 제출되지 않은 경우 summary의 submittedToEvaluator가 false여야 한다', async () => {
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
      expect(result.projects.length).toBeGreaterThan(0);

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('자기평가가 1차 평가자에게 제출된 경우 summary의 submittedToEvaluator가 true여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 평가자에게 제출
      const submitCommand1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand1);

      const submitCommand2 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId2,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand2);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false); // 관리자에게는 아직 제출 안함
    });

    it('자기평가가 1차 평가자에게 제출 후 관리자에게도 제출한 경우 summary의 두 상태가 모두 true여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 평가자에게 제출
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

      // 관리자에게 제출
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

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(2);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(true);
    });

    it('일부 자기평가만 1차 평가자에게 제출된 경우 summary의 상태가 올바르게 조회되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 첫 번째 평가만 1차 평가자에게 제출
      const submitCommand1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand1);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false); // 모두 제출되지 않음
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('자기평가가 없는 경우 summary의 totalSelfEvaluations가 0이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 삭제 (조건 명시)
      await wbsSelfEvaluationRepository.delete({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
      });

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(0);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });
  });

  describe('summary 자기평가 제출 상태 검증', () => {
    it('자기평가가 없는 경우 summary의 제출 상태가 모두 false여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 삭제
      await wbsSelfEvaluationRepository.delete({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
      });

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(0);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('자기평가가 있지만 제출되지 않은 경우 제출 상태가 모두 false여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('일부 자기평가만 1차 평가자에게 제출된 경우 제출 상태가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 첫 번째 평가만 1차 평가자에게 제출
      const submitCommand1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand1);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(false); // 모두 제출되지 않음
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('모든 자기평가가 1차 평가자에게 제출된 경우 isSubmittedToEvaluator가 true여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 자기평가를 1차 평가자에게 제출
      const submitCommand1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand1);

      const submitCommand2 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId2,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand2);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 모두 제출됨
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('일부 자기평가만 관리자에게 제출된 경우 제출 상태가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 자기평가를 1차 평가자에게 제출
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

      // 첫 번째 평가만 관리자에게 제출
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
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(false); // 모두 제출되지 않음
    });

    it('모든 자기평가가 관리자에게 제출된 경우 isSubmittedToManager가 true여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 자기평가를 1차 평가자에게 제출
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

      // 모든 자기평가를 관리자에게 제출
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

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(2);
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(true); // 모두 제출됨
    });

    it('summary의 제출 상태가 DB에서 직접 집계한 값과 일치해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 첫 번째 평가만 1차 평가자에게 제출
      const submitCommand1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToEvaluatorHandler.execute(submitCommand1);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary).toBeDefined();
      expect(result.summary.selfEvaluation).toBeDefined();

      // DB에서 직접 집계한 값과 비교
      const totalSelfEvaluations = await wbsSelfEvaluationRepository.count({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: null as any,
        },
      });

      const submittedToEvaluatorCount = await wbsSelfEvaluationRepository.count(
        {
          where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            submittedToEvaluator: true,
            deletedAt: null as any,
          },
        },
      );

      const submittedToManagerCount = await wbsSelfEvaluationRepository.count({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          submittedToManager: true,
          deletedAt: null as any,
        },
      });

      // summary와 DB 집계 비교
      expect(result.summary.selfEvaluation.totalSelfEvaluations).toBe(
        totalSelfEvaluations,
      );
      expect(result.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        submittedToEvaluatorCount,
      );
      expect(result.summary.selfEvaluation.submittedToManagerCount).toBe(
        submittedToManagerCount,
      );

      // isSubmittedToEvaluator는 모든 자기평가가 제출되었는지 확인
      expect(result.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        totalSelfEvaluations > 0 &&
          submittedToEvaluatorCount === totalSelfEvaluations,
      );
      expect(result.summary.selfEvaluation.isSubmittedToManager).toBe(
        totalSelfEvaluations > 0 &&
          submittedToManagerCount === totalSelfEvaluations,
      );
    });
  });
});
