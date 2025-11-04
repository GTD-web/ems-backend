import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  ResetDownwardEvaluationHandler,
  ResetDownwardEvaluationCommand,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/reset-downward-evaluation.handler';
import { DownwardEvaluationModule } from '@domain/core/downward-evaluation/downward-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationNotCompletedException,
} from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import {
  SubmitDownwardEvaluationCommand,
  SubmitDownwardEvaluationHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/submit-downward-evaluation.handler';

/**
 * Performance Evaluation Context - Reset Downward Evaluation 통합 테스트
 *
 * 하향평가를 미제출 상태로 변경하는 기능을 검증합니다.
 */
describe('Performance Evaluation Context - Reset Downward Evaluation', () => {
  let resetHandler: ResetDownwardEvaluationHandler;
  let submitHandler: SubmitDownwardEvaluationHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let evaluatorId: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId: string;
  let selfEvaluationId: string;
  let primaryEvaluationId: string;
  let secondaryEvaluationId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const resetBy = 'test-user-id';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        DownwardEvaluationModule,
        EvaluationPeriodModule,
        WbsSelfEvaluationModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          DownwardEvaluation,
          WbsSelfEvaluation,
          Project,
          WbsItem,
        ]),
      ],
      providers: [
        ResetDownwardEvaluationHandler,
        SubmitDownwardEvaluationHandler,
      ],
    }).compile();

    resetHandler = module.get<ResetDownwardEvaluationHandler>(
      ResetDownwardEvaluationHandler,
    );
    submitHandler = module.get<SubmitDownwardEvaluationHandler>(
      SubmitDownwardEvaluationHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
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
      const evaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(evaluations);

      const selfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(selfEvaluations);

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

    // 4. 평가자 직원 생성
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
    const wbsItem = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem = await wbsItemRepository.save(wbsItem);
    wbsItemId = savedWbsItem.id;

    // 7. 자기평가 생성
    const selfEvaluation = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과',
      selfEvaluationContent: '자기평가 내용',
      selfEvaluationScore: 100,
      createdBy: systemAdminId,
    });
    const savedSelfEvaluation = await wbsSelfEvaluationRepository.save(
      selfEvaluation,
    );
    selfEvaluationId = savedSelfEvaluation.id;

    // 8. 1차 하향평가 생성
    const primaryEvaluation = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용',
      downwardEvaluationScore: 95,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation = await downwardEvaluationRepository.save(
      primaryEvaluation,
    );
    primaryEvaluationId = savedPrimaryEvaluation.id;

    // 9. 2차 하향평가 생성
    const secondaryEvaluation = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용',
      downwardEvaluationScore: 90,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation = await downwardEvaluationRepository.save(
      secondaryEvaluation,
    );
    secondaryEvaluationId = savedSecondaryEvaluation.id;
  }

  describe('ResetDownwardEvaluationHandler - 하향평가 초기화', () => {
    it('제출된 1차 하향평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가를 먼저 제출
      const submitCommand = new SubmitDownwardEvaluationCommand(
        primaryEvaluationId,
        'submitted-by',
      );
      await submitHandler.execute(submitCommand);

      // 제출 상태 확인
      const submittedEvaluation = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId },
      });
      expect(submittedEvaluation?.isCompleted).toBe(true);

      // When - 초기화 실행
      const resetCommand = new ResetDownwardEvaluationCommand(
        primaryEvaluationId,
        resetBy,
      );
      await resetHandler.execute(resetCommand);

      // Then - 미제출 상태로 변경되었는지 확인
      const resetEvaluation = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId },
      });
      expect(resetEvaluation).toBeDefined();
      expect(resetEvaluation?.isCompleted).toBe(false);
      expect(resetEvaluation?.updatedBy).toBe(resetBy);
    });

    it('제출된 2차 하향평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 하향평가를 먼저 제출
      const submitCommand = new SubmitDownwardEvaluationCommand(
        secondaryEvaluationId,
        'submitted-by',
      );
      await submitHandler.execute(submitCommand);

      // 제출 상태 확인
      const submittedEvaluation = await downwardEvaluationRepository.findOne({
        where: { id: secondaryEvaluationId },
      });
      expect(submittedEvaluation?.isCompleted).toBe(true);

      // When - 초기화 실행
      const resetCommand = new ResetDownwardEvaluationCommand(
        secondaryEvaluationId,
        resetBy,
      );
      await resetHandler.execute(resetCommand);

      // Then - 미제출 상태로 변경되었는지 확인
      const resetEvaluation = await downwardEvaluationRepository.findOne({
        where: { id: secondaryEvaluationId },
      });
      expect(resetEvaluation).toBeDefined();
      expect(resetEvaluation?.isCompleted).toBe(false);
      expect(resetEvaluation?.updatedBy).toBe(resetBy);
    });

    it('이미 미제출 상태인 하향평가를 초기화하려고 하면 에러가 발생해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 미제출 상태 확인 (이미 false로 생성됨)
      const evaluation = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId },
      });
      expect(evaluation?.isCompleted).toBe(false);

      // When & Then - 미제출 상태인 평가를 초기화하려고 하면 에러 발생
      const resetCommand = new ResetDownwardEvaluationCommand(
        primaryEvaluationId,
        resetBy,
      );
      await expect(resetHandler.execute(resetCommand)).rejects.toThrow(
        DownwardEvaluationNotCompletedException,
      );
    });

    it('존재하지 않는 하향평가를 초기화하려고 하면 에러가 발생해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const nonExistentId = '99999999-9999-9999-9999-999999999999';

      // When & Then
      const resetCommand = new ResetDownwardEvaluationCommand(
        nonExistentId,
        resetBy,
      );
      await expect(resetHandler.execute(resetCommand)).rejects.toThrow(
        DownwardEvaluationNotFoundException,
      );
    });

    it('제출된 하향평가를 초기화한 후 다시 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가를 먼저 제출
      const submitCommand1 = new SubmitDownwardEvaluationCommand(
        primaryEvaluationId,
        'submitted-by',
      );
      await submitHandler.execute(submitCommand1);

      // When - 초기화 실행
      const resetCommand = new ResetDownwardEvaluationCommand(
        primaryEvaluationId,
        resetBy,
      );
      await resetHandler.execute(resetCommand);

      // Then - 미제출 상태 확인
      const resetEvaluation = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId },
      });
      expect(resetEvaluation?.isCompleted).toBe(false);

      // 다시 제출 가능한지 확인
      const submitCommand2 = new SubmitDownwardEvaluationCommand(
        primaryEvaluationId,
        'submitted-by-again',
      );
      await submitHandler.execute(submitCommand2);

      const reSubmittedEvaluation = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId },
      });
      expect(reSubmittedEvaluation?.isCompleted).toBe(true);
    });
  });

});

