import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetMyEvaluationTargetsStatusHandler,
  GetMyEvaluationTargetsStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-my-evaluation-targets-status.query';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
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
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import {
  SubmitWbsSelfEvaluationToEvaluatorCommand,
  SubmitWbsSelfEvaluationToEvaluatorHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation-to-evaluator.handler';
import {
  SubmitWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation.handler';

/**
 * Dashboard Context - Self Evaluation Submission Status 조회 테스트 (내가 담당하는 평가 대상자)
 *
 * 내가 담당하는 평가 대상자 현황 조회 시 피평가자와 1차 평가자 간의 자기평가 제출 상태가 제대로 조회되는지 검증합니다.
 */
describe('Dashboard Context - Self Evaluation Submission Status (My Evaluation Targets)', () => {
  let handler: GetMyEvaluationTargetsStatusHandler;
  let submitToEvaluatorHandler: SubmitWbsSelfEvaluationToEvaluatorHandler;
  let submitToManagerHandler: SubmitWbsSelfEvaluationHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let lineMappingRepository: Repository<EvaluationLineMapping>;
  let lineRepository: Repository<EvaluationLine>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let evaluatorId: string;
  let employeeId1: string;
  let employeeId2: string;
  let departmentId: string;
  let mappingId1: string;
  let mappingId2: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let evaluationId1: string;
  let evaluationId2: string;
  let lineId: string;
  let lineMappingId1: string;
  let lineMappingId2: string;

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
          Project,
          WbsItem,
        ]),
      ],
      providers: [
        GetMyEvaluationTargetsStatusHandler,
        SubmitWbsSelfEvaluationToEvaluatorHandler,
        SubmitWbsSelfEvaluationHandler,
      ],
    }).compile();

    handler = module.get<GetMyEvaluationTargetsStatusHandler>(
      GetMyEvaluationTargetsStatusHandler,
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
    lineMappingRepository = dataSource.getRepository(EvaluationLineMapping);
    lineRepository = dataSource.getRepository(EvaluationLine);
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
      currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 평가자 생성
    const evaluator = employeeRepository.create({
      name: '이평가자',
      employeeNumber: 'EVAL001',
      email: 'evaluator@test.com',
      externalId: 'EXT_EVAL',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator = await employeeRepository.save(evaluator);
    evaluatorId = savedEvaluator.id;

    // 4. 피평가자 1 생성
    const employee1 = employeeRepository.create({
      name: '김피평가1',
      employeeNumber: 'EMP001',
      email: 'employee1@test.com',
      externalId: 'EXT001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee1 = await employeeRepository.save(employee1);
    employeeId1 = savedEmployee1.id;

    // 5. 피평가자 2 생성
    const employee2 = employeeRepository.create({
      name: '김피평가2',
      employeeNumber: 'EMP002',
      email: 'employee2@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee2 = await employeeRepository.save(employee2);
    employeeId2 = savedEmployee2.id;

    // 6. 평가기간-직원 매핑 생성
    const mapping1 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId1,
      createdBy: systemAdminId,
    });
    const savedMapping1 = await mappingRepository.save(mapping1);
    mappingId1 = savedMapping1.id;

    const mapping2 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId2,
      createdBy: systemAdminId,
    });
    const savedMapping2 = await mappingRepository.save(mapping2);
    mappingId2 = savedMapping2.id;

    // 7. 평가라인 생성
    const evaluationLine = lineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedLine = await lineRepository.save(evaluationLine);
    lineId = savedLine.id;

    // 8. 평가라인 매핑 생성 (평가자 - 피평가자 관계)
    const lineMapping1 = lineMappingRepository.create({
      evaluationLineId: lineId,
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId1,
      evaluatorId: evaluatorId,
      createdBy: systemAdminId,
    });
    const savedLineMapping1 = await lineMappingRepository.save(lineMapping1);
    lineMappingId1 = savedLineMapping1.id;

    const lineMapping2 = lineMappingRepository.create({
      evaluationLineId: lineId,
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId2,
      evaluatorId: evaluatorId,
      createdBy: systemAdminId,
    });
    const savedLineMapping2 = await lineMappingRepository.save(lineMapping2);
    lineMappingId2 = savedLineMapping2.id;

    // 9. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 10. WBS 항목 생성
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

    // 11. 프로젝트 할당 생성
    const projectAssignment1 = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId1,
      projectId: projectId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment1);

    const projectAssignment2 = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId2,
      projectId: projectId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment2);

    // 12. WBS 할당 생성
    const wbsAssignment1_1 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId1,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      weight: 50,
      displayOrder: 0,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment1_1);

    const wbsAssignment1_2 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId1,
      projectId: projectId,
      wbsItemId: wbsItemId2,
      weight: 50,
      displayOrder: 1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment1_2);

    const wbsAssignment2_1 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId2,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      weight: 50,
      displayOrder: 0,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment2_1);

    const wbsAssignment2_2 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId2,
      projectId: projectId,
      wbsItemId: wbsItemId2,
      weight: 50,
      displayOrder: 1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment2_2);

    // 13. 자기평가 생성
    const evaluation1_1 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId1,
      wbsItemId: wbsItemId1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 1-1',
      selfEvaluationContent: '자기평가 내용 1-1',
      selfEvaluationScore: 100,
      createdBy: systemAdminId,
    });
    const savedEvaluation1_1 =
      await wbsSelfEvaluationRepository.save(evaluation1_1);

    const evaluation1_2 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId1,
      wbsItemId: wbsItemId2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 1-2',
      selfEvaluationContent: '자기평가 내용 1-2',
      selfEvaluationScore: 110,
      createdBy: systemAdminId,
    });
    const savedEvaluation1_2 =
      await wbsSelfEvaluationRepository.save(evaluation1_2);
    evaluationId1 = savedEvaluation1_1.id;
    evaluationId2 = savedEvaluation1_2.id;

    const evaluation2_1 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId2,
      wbsItemId: wbsItemId1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 2-1',
      selfEvaluationContent: '자기평가 내용 2-1',
      selfEvaluationScore: 100,
      createdBy: systemAdminId,
    });
    await wbsSelfEvaluationRepository.save(evaluation2_1);

    const evaluation2_2 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId2,
      wbsItemId: wbsItemId2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 2-2',
      selfEvaluationContent: '자기평가 내용 2-2',
      selfEvaluationScore: 110,
      createdBy: systemAdminId,
    });
    await wbsSelfEvaluationRepository.save(evaluation2_2);
  }

  describe('자기평가 제출 상태 조회 (내가 담당하는 평가 대상자)', () => {
    it('자기평가가 없는 경우 selfEvaluation이 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 삭제
      await wbsSelfEvaluationRepository.delete({
        periodId: evaluationPeriodId,
      });

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1).toBeDefined();
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('none');
      expect(target1?.selfEvaluation.totalMappingCount).toBe(0);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(0);
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(0);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target1?.selfEvaluation.totalScore).toBeNull();
      expect(target1?.selfEvaluation.grade).toBeNull();

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2).toBeDefined();
      expect(target2?.selfEvaluation).toBeDefined();
      expect(target2?.selfEvaluation.totalSelfEvaluations).toBe(0);
      expect(target2?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target2?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('자기평가가 있지만 제출되지 않은 경우 제출 상태가 모두 false여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('in_progress');
      expect(target1?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(0);
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target1?.selfEvaluation.totalScore).toBeNull();
      expect(target1?.selfEvaluation.grade).toBeNull();

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2?.selfEvaluation).toBeDefined();
      expect(target2?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target2?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target2?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToManager).toBe(false);
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
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('in_progress');
      expect(target1?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(0);
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(false); // 모두 제출되지 않음
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target1?.selfEvaluation.totalScore).toBeNull();
      expect(target1?.selfEvaluation.grade).toBeNull();

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2?.selfEvaluation).toBeDefined();
      expect(target2?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target2?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target2?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToManager).toBe(false);
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
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('in_progress'); // 관리자에게 제출 안했으므로 완료 아님
      expect(target1?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(0); // 관리자에게 제출 안했으므로 완료 아님
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 모두 제출됨
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(0); // 관리자에게는 아직 제출 안함
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target1?.selfEvaluation.totalScore).toBeNull(); // 관리자에게 제출 안했으므로 점수 없음
      expect(target1?.selfEvaluation.grade).toBeNull(); // 관리자에게 제출 안했으므로 등급 없음

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2?.selfEvaluation).toBeDefined();
      expect(target2?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target2?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target2?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('여러 피평가자의 자기평가 제출 상태가 올바르게 구분되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 피평가자1의 모든 자기평가를 1차 평가자에게 제출
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

      // 피평가자2의 자기평가 조회
      const employee2Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId2,
          deletedAt: IsNull(),
        },
      });

      // 피평가자2의 첫 번째 평가만 제출
      if (employee2Evaluations.length > 0) {
        const submitCommand3 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
          employee2Evaluations[0].id,
          submittedBy,
        );
        await submitToEvaluatorHandler.execute(submitCommand3);
      }

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('in_progress');
      expect(target1?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(0);
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target1?.selfEvaluation.totalScore).toBeNull();
      expect(target1?.selfEvaluation.grade).toBeNull();

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2?.selfEvaluation).toBeDefined();
      expect(target2?.selfEvaluation.status).toBe('in_progress');
      expect(target2?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target2?.selfEvaluation.completedMappingCount).toBe(0);
      expect(target2?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target2?.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      expect(target2?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target2?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target2?.selfEvaluation.totalScore).toBeNull();
      expect(target2?.selfEvaluation.grade).toBeNull();
    });

    it('1차 평가자에게 제출 후 관리자에게도 제출한 경우 두 상태가 모두 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 자기평가를 1차 평가자에게 먼저 제출
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
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('complete'); // 관리자에게 모두 제출되었으므로 완료
      expect(target1?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(2); // 관리자에게 모두 제출되었으므로 완료
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(2);
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(true); // 관리자에게 모두 제출됨
      expect(target1?.selfEvaluation.totalScore).not.toBeNull(); // 점수 계산됨
      // 등급은 평가기간에 등급 구간이 설정되어야 계산됨 (설정되지 않으면 null일 수 있음)

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2?.selfEvaluation).toBeDefined();
      expect(target2?.selfEvaluation.status).toBe('in_progress');
      expect(target2?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target2?.selfEvaluation.completedMappingCount).toBe(0);
      expect(target2?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target2?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target2?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target2?.selfEvaluation.isSubmittedToManager).toBe(false);
      expect(target2?.selfEvaluation.totalScore).toBeNull();
      expect(target2?.selfEvaluation.grade).toBeNull();
    });

    it('일부 자기평가만 관리자에게 제출된 경우 제출 상태가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 자기평가를 1차 평가자에게 먼저 제출
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

      // 첫 번째 자기평가만 관리자에게 제출
      const submitToManagerCommand1 = new SubmitWbsSelfEvaluationCommand(
        evaluationId1,
        submittedBy,
      );
      await submitToManagerHandler.execute(submitToManagerCommand1);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1?.selfEvaluation).toBeDefined();
      expect(target1?.selfEvaluation.status).toBe('in_progress'); // 일부만 제출되었으므로 진행중
      expect(target1?.selfEvaluation.totalMappingCount).toBe(2);
      expect(target1?.selfEvaluation.completedMappingCount).toBe(1); // 일부만 제출되었으므로 1개 완료
      expect(target1?.selfEvaluation.totalSelfEvaluations).toBe(2);
      expect(target1?.selfEvaluation.submittedToEvaluatorCount).toBe(2);
      expect(target1?.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(target1?.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(target1?.selfEvaluation.isSubmittedToManager).toBe(false); // 모두 제출되지 않음
      expect(target1?.selfEvaluation.totalScore).toBeNull(); // 모두 제출되지 않았으므로 점수 없음
      expect(target1?.selfEvaluation.grade).toBeNull(); // 모두 제출되지 않았으므로 등급 없음
    });
  });
});
