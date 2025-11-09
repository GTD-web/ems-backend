import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  SubmitWbsSelfEvaluationToEvaluatorHandler,
  SubmitWbsSelfEvaluationToEvaluatorCommand,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation-to-evaluator.handler';
import {
  SubmitAllWbsSelfEvaluationsToEvaluatorHandler,
  SubmitAllWbsSelfEvaluationsToEvaluatorCommand,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-all-wbs-self-evaluations-to-evaluator.handler';
import {
  SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler,
  SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluations-to-evaluator-by-project.handler';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';

/**
 * Performance Evaluation Context - Self Evaluation Submit to Evaluator 통합 테스트
 *
 * 피평가자가 1차 평가자에게 자기평가를 제출하는 기능을 검증합니다.
 */
describe('Performance Evaluation Context - Self Evaluation Submit to Evaluator', () => {
  let submitSingleHandler: SubmitWbsSelfEvaluationToEvaluatorHandler;
  let submitAllHandler: SubmitAllWbsSelfEvaluationsToEvaluatorHandler;
  let submitByProjectHandler: SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler;
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
          WbsSelfEvaluation,
          Project,
          WbsItem,
        ]),
      ],
      providers: [
        SubmitWbsSelfEvaluationToEvaluatorHandler,
        SubmitAllWbsSelfEvaluationsToEvaluatorHandler,
        SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler,
      ],
    }).compile();

    submitSingleHandler = module.get<SubmitWbsSelfEvaluationToEvaluatorHandler>(
      SubmitWbsSelfEvaluationToEvaluatorHandler,
    );
    submitAllHandler =
      module.get<SubmitAllWbsSelfEvaluationsToEvaluatorHandler>(
        SubmitAllWbsSelfEvaluationsToEvaluatorHandler,
      );
    submitByProjectHandler =
      module.get<SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler>(
        SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler,
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
    const mapping = new EvaluationPeriodEmployeeMapping({
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

    // 8. WBS 할당 생성
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

    const evaluation3 = wbsSelfEvaluationRepository.create({
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
    const savedEvaluation3 =
      await wbsSelfEvaluationRepository.save(evaluation3);
    evaluationId3 = savedEvaluation3.id;
  }

  describe('SubmitWbsSelfEvaluationToEvaluatorHandler - 단일 자기평가 제출', () => {
    it('피평가자가 1차 평가자에게 자기평가를 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const command = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      const result = await submitSingleHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(evaluationId1);
      expect(result.submittedToEvaluator).toBe(true);
      expect(result.submittedToEvaluatorAt).toBeDefined();

      // 데이터베이스에서 확인
      const savedEvaluation = await wbsSelfEvaluationRepository.findOne({
        where: { id: evaluationId1 },
      });
      expect(savedEvaluation).toBeDefined();
      expect(savedEvaluation?.submittedToEvaluator).toBe(true);
      expect(savedEvaluation?.submittedToEvaluatorAt).toBeDefined();
    });

    it('이미 1차 평가자에게 제출된 자기평가는 재제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const command1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitSingleHandler.execute(command1);

      // When - 동일한 평가를 다시 제출
      const command2 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        'another-user',
      );
      const result = await submitSingleHandler.execute(command2);

      // Then
      expect(result.submittedToEvaluator).toBe(true);
      expect(result.submittedToEvaluatorAt).toBeDefined();
    });

    it('평가 내용과 점수가 없으면 제출할 수 없어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const evaluationWithoutContent = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과',
        // selfEvaluationContent와 selfEvaluationScore 없음
        createdBy: systemAdminId,
      });
      const savedEvaluation = await wbsSelfEvaluationRepository.save(
        evaluationWithoutContent,
      );

      // When & Then
      const command = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        savedEvaluation.id,
        submittedBy,
      );
      await expect(submitSingleHandler.execute(command)).rejects.toThrow();
    });
  });

  describe('SubmitAllWbsSelfEvaluationsToEvaluatorHandler - 전체 자기평가 제출', () => {
    it('직원의 모든 자기평가를 1차 평가자에게 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const command = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        submittedBy,
      );
      const result = await submitAllHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.totalCount).toBe(3);
      expect(result.submittedCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.completedEvaluations.length).toBe(3);
      expect(result.failedEvaluations.length).toBe(0);

      // 모든 평가가 제출되었는지 확인
      const savedEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      expect(savedEvaluations.length).toBe(3);
      savedEvaluations.forEach((evaluation) => {
        expect(evaluation.submittedToEvaluator).toBe(true);
        expect(evaluation.submittedToEvaluatorAt).toBeDefined();
      });
    });

    it('자신의 평가를 자신이 제출했을 때 제출 상태가 정상적으로 변경되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // submittedBy가 employeeId와 같은 경우 (자신이 제출)
      const selfSubmittedBy = employeeId;

      // When
      const command = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        selfSubmittedBy,
      );
      const result = await submitAllHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.totalCount).toBe(3);
      expect(result.submittedCount).toBe(3);
      expect(result.failedCount).toBe(0);

      // 모든 평가가 제출되었는지 확인
      const savedEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      expect(savedEvaluations.length).toBe(3);
      savedEvaluations.forEach((evaluation) => {
        expect(evaluation.submittedToEvaluator).toBe(true);
        expect(evaluation.submittedToEvaluatorAt).toBeDefined();
        expect(evaluation.submittedToEvaluatorAt).not.toBeNull();
        // updatedBy가 제출한 사람으로 설정되었는지 확인
        expect(evaluation.updatedBy).toBe(selfSubmittedBy);
      });
    });

    it('자신의 평가를 다른 사람이 제출했을 때 제출 상태가 정상적으로 변경되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // submittedBy가 employeeId와 다른 경우 (다른 사람이 제출)
      const otherSubmittedBy = 'other-user-id-12345';

      // When
      const command = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        otherSubmittedBy,
      );
      const result = await submitAllHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.totalCount).toBe(3);
      expect(result.submittedCount).toBe(3);
      expect(result.failedCount).toBe(0);

      // 모든 평가가 제출되었는지 확인
      const savedEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      expect(savedEvaluations.length).toBe(3);
      savedEvaluations.forEach((evaluation) => {
        expect(evaluation.submittedToEvaluator).toBe(true);
        expect(evaluation.submittedToEvaluatorAt).toBeDefined();
        expect(evaluation.submittedToEvaluatorAt).not.toBeNull();
        // updatedBy가 제출한 사람으로 설정되었는지 확인
        expect(evaluation.updatedBy).toBe(otherSubmittedBy);
      });
    });

    it('자신이 제출한 후 다른 사람이 다시 제출해도 상태가 유지되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const selfSubmittedBy = employeeId;
      const otherSubmittedBy = 'other-user-id-12345';

      // When - 자신이 먼저 제출
      const command1 = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        selfSubmittedBy,
      );
      const result1 = await submitAllHandler.execute(command1);

      // Then - 첫 번째 제출 확인
      expect(result1.submittedCount).toBe(3);
      const savedEvaluations1 = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      savedEvaluations1.forEach((evaluation) => {
        expect(evaluation.submittedToEvaluator).toBe(true);
        expect(evaluation.updatedBy).toBe(selfSubmittedBy);
      });

      // When - 다른 사람이 다시 제출 (이미 제출된 상태이므로 스킵되어야 함)
      const command2 = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        otherSubmittedBy,
      );
      const result2 = await submitAllHandler.execute(command2);

      // Then - 두 번째 제출도 성공해야 함 (이미 제출된 평가는 스킵)
      expect(result2.submittedCount).toBe(3);
      expect(result2.failedCount).toBe(0);

      // 제출 상태는 유지되어야 함
      const savedEvaluations2 = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      savedEvaluations2.forEach((evaluation) => {
        expect(evaluation.submittedToEvaluator).toBe(true);
        // 이미 제출된 평가는 스킵되므로 updatedBy는 변경되지 않음
        expect(evaluation.updatedBy).toBe(selfSubmittedBy);
      });
    });

    it('일부 평가가 제출 조건을 만족하지 않으면 부분 제출이 되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // 평가 내용이 없는 평가 추가
      const incompleteEvaluation = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '성과 결과',
        // selfEvaluationContent와 selfEvaluationScore 없음
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(incompleteEvaluation);

      // When
      const command = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        submittedBy,
      );
      const result = await submitAllHandler.execute(command);

      // Then
      expect(result.totalCount).toBeGreaterThan(3);
      expect(result.submittedCount).toBe(3);
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.failedEvaluations.length).toBeGreaterThan(0);
    });

    it('이미 제출된 평가는 스킵하고 포함되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // 첫 번째 평가를 먼저 제출
      const command1 = new SubmitWbsSelfEvaluationToEvaluatorCommand(
        evaluationId1,
        submittedBy,
      );
      await submitSingleHandler.execute(command1);

      // When
      const command = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
        employeeId,
        evaluationPeriodId,
        submittedBy,
      );
      const result = await submitAllHandler.execute(command);

      // Then
      expect(result.totalCount).toBe(3);
      expect(result.submittedCount).toBe(3);
      expect(
        result.completedEvaluations.some(
          (e) => e.evaluationId === evaluationId1,
        ),
      ).toBe(true);
    });
  });

  describe('SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler - 프로젝트별 자기평가 제출', () => {
    it('특정 프로젝트의 모든 자기평가를 1차 평가자에게 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      const command = new SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand(
        employeeId,
        evaluationPeriodId,
        projectId,
        submittedBy,
      );
      const result = await submitByProjectHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.totalCount).toBe(3);
      expect(result.submittedCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.completedEvaluations.length).toBe(3);
      expect(result.failedEvaluations.length).toBe(0);

      // 해당 프로젝트의 모든 평가가 제출되었는지 확인
      const savedEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      expect(savedEvaluations.length).toBe(3);
      savedEvaluations.forEach((evaluation) => {
        expect(evaluation.submittedToEvaluator).toBe(true);
        expect(evaluation.submittedToEvaluatorAt).toBeDefined();
      });
    });

    it('존재하지 않는 프로젝트에 대한 제출 요청은 실패해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const nonExistentProjectId = '99999999-9999-9999-9999-999999999999';

      // When & Then
      const command = new SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand(
        employeeId,
        evaluationPeriodId,
        nonExistentProjectId,
        submittedBy,
      );
      await expect(submitByProjectHandler.execute(command)).rejects.toThrow();
    });

    it('프로젝트에 할당된 WBS가 없으면 실패해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // 새로운 프로젝트 생성 (WBS 할당 없음)
      const newProject = projectRepository.create({
        name: '새 프로젝트',
        projectCode: 'PROJ002',
        status: ProjectStatus.ACTIVE,
        createdBy: systemAdminId,
      });
      const savedNewProject = await projectRepository.save(newProject);

      // When & Then
      const command = new SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand(
        employeeId,
        evaluationPeriodId,
        savedNewProject.id,
        submittedBy,
      );
      await expect(submitByProjectHandler.execute(command)).rejects.toThrow();
    });
  });
});
