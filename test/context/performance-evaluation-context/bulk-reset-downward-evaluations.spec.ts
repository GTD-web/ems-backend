import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Project } from '@domain/common/project/project.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import {
  BulkResetDownwardEvaluationsCommand,
  BulkResetDownwardEvaluationsHandler,
} from '../../../src/context/performance-evaluation-context/handlers/downward-evaluation/command/bulk-reset-downward-evaluations.handler';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { DatabaseModule } from '@libs/database/database.module';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { ProjectStatus } from '@domain/common/project/project.types';

describe('Performance Evaluation Context - Bulk Reset Downward Evaluations', () => {
  let module: TestingModule;
  let handler: BulkResetDownwardEvaluationsHandler;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let periodRepository: Repository<EvaluationPeriod>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let wbsItemRepository: Repository<WbsItem>;
  let projectRepository: Repository<Project>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let dataSource: DataSource;

  let periodId: string;
  let evaluateeId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;
  let departmentId: string;
  let wbsId1: string;
  let wbsId2: string;
  let wbsId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
          DownwardEvaluation,
          EvaluationPeriod,
          EvaluationWbsAssignment,
          EvaluationLineMapping,
          EvaluationLine,
          Employee,
          Department,
          WbsItem,
          Project,
          EvaluationProjectAssignment,
        ]),
      ],
      providers: [
        BulkResetDownwardEvaluationsHandler,
        DownwardEvaluationService,
        TransactionManagerService,
      ],
    }).compile();

    handler = module.get<BulkResetDownwardEvaluationsHandler>(
      BulkResetDownwardEvaluationsHandler,
    );
    downwardEvaluationRepository = module.get<Repository<DownwardEvaluation>>(
      getRepositoryToken(DownwardEvaluation),
    );
    periodRepository = module.get<Repository<EvaluationPeriod>>(
      getRepositoryToken(EvaluationPeriod),
    );
    wbsAssignmentRepository = module.get<Repository<EvaluationWbsAssignment>>(
      getRepositoryToken(EvaluationWbsAssignment),
    );
    evaluationLineMappingRepository = module.get<
      Repository<EvaluationLineMapping>
    >(getRepositoryToken(EvaluationLineMapping));
    evaluationLineRepository = module.get<Repository<EvaluationLine>>(
      getRepositoryToken(EvaluationLine),
    );
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    departmentRepository = module.get<Repository<Department>>(
      getRepositoryToken(Department),
    );
    wbsItemRepository = module.get<Repository<WbsItem>>(
      getRepositoryToken(WbsItem),
    );
    projectRepository = module.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    projectAssignmentRepository = module.get<
      Repository<EvaluationProjectAssignment>
    >(getRepositoryToken(EvaluationProjectAssignment));

    dataSource = module.get<DataSource>(DataSource);
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

      const wbsAssignments = await wbsAssignmentRepository.find();
      await wbsAssignmentRepository.remove(wbsAssignments);

      const projectAssignments = await projectAssignmentRepository.find();
      await projectAssignmentRepository.remove(projectAssignments);

      const wbsItems = await wbsItemRepository.find();
      await wbsItemRepository.remove(wbsItems);

      const projects = await projectRepository.find();
      await projectRepository.remove(projects);

      const periods = await periodRepository.find();
      await periodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
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
    const period = periodRepository.create({
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
    const savedPeriod = await periodRepository.save(period);
    periodId = savedPeriod.id;

    // 직원 생성
    const evaluatee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: 'EMP001',
      email: 'evaluatee@test.com',
      externalId: 'EXT001',
      status: '재직중',
      createdBy: 'system',
    });
    const savedEvaluatee = await employeeRepository.save(evaluatee);
    evaluateeId = savedEvaluatee.id;

    const primaryEvaluator = employeeRepository.create({
      name: '이1차평가자',
      employeeNumber: 'EMP002',
      email: 'primary@test.com',
      externalId: 'EXT002',
      status: '재직중',
      createdBy: 'system',
    });
    const savedPrimaryEvaluator =
      await employeeRepository.save(primaryEvaluator);
    primaryEvaluatorId = savedPrimaryEvaluator.id;

    const secondaryEvaluator1 = employeeRepository.create({
      name: '박2차평가자1',
      employeeNumber: 'EMP003',
      email: 'secondary1@test.com',
      externalId: 'EXT003',
      status: '재직중',
      createdBy: 'system',
    });
    const savedSecondaryEvaluator1 =
      await employeeRepository.save(secondaryEvaluator1);
    secondaryEvaluatorId1 = savedSecondaryEvaluator1.id;

    const secondaryEvaluator2 = employeeRepository.create({
      name: '최2차평가자2',
      employeeNumber: 'EMP004',
      email: 'secondary2@test.com',
      externalId: 'EXT004',
      status: '재직중',
      createdBy: 'system',
    });
    const savedSecondaryEvaluator2 =
      await employeeRepository.save(secondaryEvaluator2);
    secondaryEvaluatorId2 = savedSecondaryEvaluator2.id;

    // 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);

    // WBS 항목 생성
    const wbs1 = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbs1 = await wbsItemRepository.save(wbs1);
    wbsId1 = savedWbs1.id;

    const wbs2 = wbsItemRepository.create({
      wbsCode: 'WBS002',
      title: 'WBS 항목 2',
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbs2 = await wbsItemRepository.save(wbs2);
    wbsId2 = savedWbs2.id;

    const wbs3 = wbsItemRepository.create({
      wbsCode: 'WBS003',
      title: 'WBS 항목 3',
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbs3 = await wbsItemRepository.save(wbs3);
    wbsId3 = savedWbs3.id;

    // 프로젝트 할당 생성
    await projectAssignmentRepository.save({
      periodId: periodId,
      employeeId: evaluateeId,
      projectId: savedProject.id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });

    // WBS 할당 생성
    await wbsAssignmentRepository.save({
      periodId: periodId,
      employeeId: evaluateeId,
      projectId: savedProject.id,
      wbsItemId: wbsId1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save({
      periodId: periodId,
      employeeId: evaluateeId,
      projectId: savedProject.id,
      wbsItemId: wbsId2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save({
      periodId: periodId,
      employeeId: evaluateeId,
      projectId: savedProject.id,
      wbsItemId: wbsId3,
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
    const savedSecondaryLine =
      await evaluationLineRepository.save(secondaryLine);

    // 평가라인 매핑 생성
    await evaluationLineMappingRepository.save({
      evaluationPeriodId: periodId,
      employeeId: evaluateeId,
      evaluationLineId: savedPrimaryLine.id,
      evaluatorId: primaryEvaluatorId,
      createdBy: systemAdminId,
    });

    await evaluationLineMappingRepository.save({
      evaluationPeriodId: periodId,
      employeeId: evaluateeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId1,
      createdBy: systemAdminId,
    });

    await evaluationLineMappingRepository.save({
      evaluationPeriodId: periodId,
      employeeId: evaluateeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId2,
      createdBy: systemAdminId,
    });
  }

  describe('BulkResetDownwardEvaluationsHandler - 하향평가 일괄 초기화', () => {
    it('1차 평가자의 모든 하향평가를 일괄 초기화할 수 있어야 한다', async () => {
      // Given - 1차 하향평가 3개를 제출 상태로 생성
      const evaluation1 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsId1,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 1',
        downwardEvaluationScore: 80,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluation1);

      const evaluation2 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsId2,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 2',
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluation2);

      const evaluation3 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsId3,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 3',
        downwardEvaluationScore: 90,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluation3);

      // 제출 상태 확인
      const beforeReset = await downwardEvaluationRepository.find({
        where: {
          evaluatorId: primaryEvaluatorId,
          employeeId: evaluateeId,
          periodId: periodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
        },
      });
      expect(beforeReset.every((e) => e.isCompleted)).toBe(true);

      // When - 일괄 초기화 실행
      const command = new BulkResetDownwardEvaluationsCommand(
        primaryEvaluatorId,
        evaluateeId,
        periodId,
        DownwardEvaluationType.PRIMARY,
        'reset-by',
      );
      const result = await handler.execute(command);

      // Then - 초기화 결과 확인
      expect(result.resetCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.resetIds.length).toBe(3);
      expect(result.resetIds).toContain(evaluation1.id);
      expect(result.resetIds).toContain(evaluation2.id);
      expect(result.resetIds).toContain(evaluation3.id);

      // 미제출 상태로 변경되었는지 확인
      const afterReset = await downwardEvaluationRepository.find({
        where: {
          evaluatorId: primaryEvaluatorId,
          employeeId: evaluateeId,
          periodId: periodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
        },
      });
      expect(afterReset.every((e) => !e.isCompleted)).toBe(true);
    });

    it('2차 평가자의 모든 하향평가를 일괄 초기화할 수 있어야 한다', async () => {
      // Given - 2차 평가자1의 하향평가 3개를 제출 상태로 생성
      const evaluation1 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsId1,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가 내용 1',
        downwardEvaluationScore: 75,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluation1);

      const evaluation2 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsId2,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가 내용 2',
        downwardEvaluationScore: 80,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluation2);

      const evaluation3 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsId3,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가 내용 3',
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluation3);

      // When - 일괄 초기화 실행
      const command = new BulkResetDownwardEvaluationsCommand(
        secondaryEvaluatorId1,
        evaluateeId,
        periodId,
        DownwardEvaluationType.SECONDARY,
        'reset-by',
      );
      const result = await handler.execute(command);

      // Then - 초기화 결과 확인
      expect(result.resetCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.resetIds.length).toBe(3);

      // 미제출 상태로 변경되었는지 확인
      const afterReset = await downwardEvaluationRepository.find({
        where: {
          evaluatorId: secondaryEvaluatorId1,
          employeeId: evaluateeId,
          periodId: periodId,
          evaluationType: DownwardEvaluationType.SECONDARY,
        },
      });
      expect(afterReset.every((e) => !e.isCompleted)).toBe(true);
    });

    it('이미 미제출 상태인 평가는 건너뛰어야 한다', async () => {
      // Given - 제출된 평가 2개와 미제출 평가 1개 생성
      const submittedEvaluation1 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsId1,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 1',
        downwardEvaluationScore: 80,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(submittedEvaluation1);

      const submittedEvaluation2 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsId2,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 2',
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(submittedEvaluation2);

      const notSubmittedEvaluation = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsId3,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '평가 내용 3',
        downwardEvaluationScore: 90,
        evaluationDate: new Date(),
        isCompleted: false, // 미제출 상태
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(notSubmittedEvaluation);

      // When - 일괄 초기화 실행
      const command = new BulkResetDownwardEvaluationsCommand(
        primaryEvaluatorId,
        evaluateeId,
        periodId,
        DownwardEvaluationType.PRIMARY,
        'reset-by',
      );
      const result = await handler.execute(command);

      // Then - 제출된 평가만 초기화되고, 미제출 평가는 건너뛰어야 함
      expect(result.resetCount).toBe(2);
      expect(result.skippedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.resetIds).toContain(submittedEvaluation1.id);
      expect(result.resetIds).toContain(submittedEvaluation2.id);
      expect(result.skippedIds).toContain(notSubmittedEvaluation.id);
    });

    it('여러 2차 평가자가 각각 독립적으로 일괄 초기화할 수 있어야 한다', async () => {
      // Given - 2차 평가자1과 2차 평가자2의 각각 하향평가 생성
      const evaluator1Evaluation1 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsId1,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 75,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluator1Evaluation1);

      const evaluator2Evaluation1 = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsId1,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 1',
        downwardEvaluationScore: 80,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(evaluator2Evaluation1);

      // When - 평가자1만 초기화
      const command1 = new BulkResetDownwardEvaluationsCommand(
        secondaryEvaluatorId1,
        evaluateeId,
        periodId,
        DownwardEvaluationType.SECONDARY,
        'reset-by',
      );
      const result1 = await handler.execute(command1);

      // Then - 평가자1의 평가만 초기화됨
      expect(result1.resetCount).toBe(1);
      expect(result1.resetIds).toContain(evaluator1Evaluation1.id);

      // 평가자2의 평가는 여전히 제출 상태
      const evaluator2After = await downwardEvaluationRepository.findOne({
        where: { id: evaluator2Evaluation1.id },
      });
      expect(evaluator2After?.isCompleted).toBe(true);

      // 평가자2도 독립적으로 초기화 가능
      const command2 = new BulkResetDownwardEvaluationsCommand(
        secondaryEvaluatorId2,
        evaluateeId,
        periodId,
        DownwardEvaluationType.SECONDARY,
        'reset-by',
      );
      const result2 = await handler.execute(command2);
      expect(result2.resetCount).toBe(1);
      expect(result2.resetIds).toContain(evaluator2Evaluation1.id);
    });

    it('평가자가 담당하지 않는 피평가자의 평가는 초기화할 수 없어야 한다', async () => {
      // Given - 다른 평가자 생성 및 평가 생성
      const otherEvaluator = employeeRepository.create({
        name: '다른 평가자',
        employeeNumber: 'EMP005',
        email: 'other@test.com',
        externalId: 'EXT005',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedOtherEvaluator = await employeeRepository.save(otherEvaluator);
      const otherEvaluatorId = savedOtherEvaluator.id;

      const otherEvaluation = downwardEvaluationRepository.create({
        employeeId: evaluateeId,
        evaluatorId: otherEvaluatorId,
        wbsId: wbsId1,
        periodId: periodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '다른 평가자 평가',
        downwardEvaluationScore: 70,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(otherEvaluation);

      // When - 요청한 평가자가 담당하지 않는 평가는 조회되지 않음
      const command = new BulkResetDownwardEvaluationsCommand(
        primaryEvaluatorId,
        evaluateeId,
        periodId,
        DownwardEvaluationType.PRIMARY,
        'reset-by',
      );

      // Then - 평가자를 찾을 수 없어 에러 발생
      await expect(handler.execute(command)).rejects.toThrow();

      // 다른 평가자의 평가는 변경되지 않음
      const otherAfter = await downwardEvaluationRepository.findOne({
        where: { id: otherEvaluation.id },
      });
      expect(otherAfter?.isCompleted).toBe(true);
    });

    it('하향평가가 없으면 에러를 발생시켜야 한다', async () => {
      // Given - 하향평가가 없는 상태

      // When & Then - 에러 발생
      const command = new BulkResetDownwardEvaluationsCommand(
        primaryEvaluatorId,
        evaluateeId,
        periodId,
        DownwardEvaluationType.PRIMARY,
        'reset-by',
      );

      await expect(handler.execute(command)).rejects.toThrow();
    });
  });
});
