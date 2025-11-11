import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/get-employee-evaluation-period-status.handler';
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
 * Dashboard Context - 2차 하향평가 통합 제출 상태 조회 테스트
 *
 * 대시보드 조회 시 2차 하향평가의 통합 제출 상태(`secondary.isSubmitted`)가
 * 모든 2차 평가자가 제출했을 때만 `true`가 되는지 검증합니다.
 */
describe('Dashboard Context - Secondary Downward Evaluation Integrated Submission Status', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
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
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;
  let secondaryEvaluatorId3: string;
  let departmentId: string;
  let mappingId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

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
      providers: [GetEmployeeEvaluationPeriodStatusHandler],
    }).compile();

    handler = module.get<GetEmployeeEvaluationPeriodStatusHandler>(
      GetEmployeeEvaluationPeriodStatusHandler,
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

    // 2차 평가자들 생성
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

    const secondaryEvaluator3 = employeeRepository.create({
      name: '정2차평가자3',
      employeeNumber: 'EMP005',
      email: 'secondary3@test.com',
      externalId: 'EXT005',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator3 = await employeeRepository.save(
      secondaryEvaluator3,
    );
    secondaryEvaluatorId3 = savedSecondaryEvaluator3.id;

    // 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
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

    // 평가라인 매핑 생성 (각 평가자별로 다른 WBS에 매핑)
    await evaluationLineMappingRepository.save({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId1,
      wbsItemId: wbsItemId1,
      createdBy: systemAdminId,
    });

    await evaluationLineMappingRepository.save({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId2,
      wbsItemId: wbsItemId2,
      createdBy: systemAdminId,
    });

    await evaluationLineMappingRepository.save({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: savedSecondaryLine.id,
      evaluatorId: secondaryEvaluatorId3,
      wbsItemId: wbsItemId3,
      createdBy: systemAdminId,
    });
  }

  describe('2차 하향평가 통합 제출 상태 검증', () => {
    it('모든 2차 평가자가 제출했을 때 secondary.isSubmitted가 true여야 한다', async () => {
      // Given - 모든 2차 평가자가 모든 WBS에 대해 평가를 제출
      // 현재 로직은 피평가자에게 할당된 전체 WBS 수(3개)를 기준으로 하므로,
      // 각 평가자가 3개의 WBS 모두에 대해 평가를 제출해야 함
      
      // 평가자1: 모든 WBS 제출
      const evaluation1_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_1);

      const evaluation1_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 2',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_2);

      const evaluation1_3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 3',
        downwardEvaluationScore: 90,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_3);

      // 평가자2: 모든 WBS 제출
      const evaluation2_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 1',
        downwardEvaluationScore: 75,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_1);

      const evaluation2_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 2',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_2);

      const evaluation2_3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 3',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_3);

      // 평가자3: 모든 WBS 제출
      const evaluation3_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId3,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자3 평가 내용 1',
        downwardEvaluationScore: 70,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3_1);

      const evaluation3_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId3,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자3 평가 내용 2',
        downwardEvaluationScore: 75,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3_2);

      const evaluation3_3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId3,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자3 평가 내용 3',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation3_3);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 통합 제출 상태가 true여야 함
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.isSubmitted).toBe(true);
      expect(result!.downwardEvaluation.secondary.evaluators.length).toBe(3);

      // 각 평가자의 개별 제출 상태도 확인
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1?.isSubmitted).toBe(true);
      expect(evaluator1?.assignedWbsCount).toBe(3);
      expect(evaluator1?.completedEvaluationCount).toBe(3);

      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).toBeDefined();
      expect(evaluator2?.isSubmitted).toBe(true);
      expect(evaluator2?.assignedWbsCount).toBe(3);
      expect(evaluator2?.completedEvaluationCount).toBe(3);

      const evaluator3 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId3,
      );
      expect(evaluator3).toBeDefined();
      expect(evaluator3?.isSubmitted).toBe(true);
      expect(evaluator3?.assignedWbsCount).toBe(3);
      expect(evaluator3?.completedEvaluationCount).toBe(3);
    });

    it('일부 2차 평가자만 제출했을 때 secondary.isSubmitted가 false여야 한다', async () => {
      // Given - 평가자1과 평가자2만 모든 WBS 제출, 평가자3는 미제출
      // 평가자1: 모든 WBS 제출
      const evaluation1_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_1);

      const evaluation1_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 2',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_2);

      const evaluation1_3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 3',
        downwardEvaluationScore: 90,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_3);

      // 평가자2: 모든 WBS 제출
      const evaluation2_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 1',
        downwardEvaluationScore: 75,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_1);

      const evaluation2_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 2',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_2);

      const evaluation2_3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 3',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_3);

      // 평가자3: 미제출 (평가 생성 안 함)

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 통합 제출 상태가 false여야 함
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.isSubmitted).toBe(false);
      expect(result!.downwardEvaluation.secondary.evaluators.length).toBe(3);

      // 각 평가자의 개별 제출 상태 확인
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1?.isSubmitted).toBe(true);
      expect(evaluator1?.assignedWbsCount).toBe(3);
      expect(evaluator1?.completedEvaluationCount).toBe(3);

      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).toBeDefined();
      expect(evaluator2?.isSubmitted).toBe(true);
      expect(evaluator2?.assignedWbsCount).toBe(3);
      expect(evaluator2?.completedEvaluationCount).toBe(3);

      const evaluator3 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId3,
      );
      expect(evaluator3).toBeDefined();
      expect(evaluator3?.isSubmitted).toBe(false);
      expect(evaluator3?.assignedWbsCount).toBe(3);
      expect(evaluator3?.completedEvaluationCount).toBe(0);
    });

    it('2차 평가자가 없을 때 secondary.isSubmitted가 false여야 한다', async () => {
      // Given - 2차 평가자가 없음 (평가라인 매핑이 없음)
      // beforeEach에서 생성된 매핑을 삭제
      const mappings = await evaluationLineMappingRepository.find({
        where: {
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
        },
      });
      await evaluationLineMappingRepository.remove(mappings);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 통합 제출 상태가 false여야 함
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.isSubmitted).toBe(false);
      expect(result!.downwardEvaluation.secondary.evaluators.length).toBe(0);
    });

    it('일부 평가자가 일부만 제출했을 때 secondary.isSubmitted가 false여야 한다', async () => {
      // Given - 평가자1은 모두 제출, 평가자2는 일부만 제출, 평가자3는 미제출
      // 평가자1: 모든 WBS 제출
      const evaluation1_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_1);

      const evaluation1_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 2',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_2);

      const evaluation1_3 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 3',
        downwardEvaluationScore: 90,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_3);

      // 평가자2: 일부만 제출 (WBS1, WBS2만 제출, WBS3는 미제출)
      const evaluation2_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 1',
        downwardEvaluationScore: 75,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_1);

      const evaluation2_2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId2,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 2',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_2);

      // 평가자2: WBS3는 미제출 (평가 생성 안 함)

      // 평가자3: 미제출 (평가 생성 안 함)

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 통합 제출 상태가 false여야 함
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.isSubmitted).toBe(false);
      expect(result!.downwardEvaluation.secondary.evaluators.length).toBe(3);

      // 각 평가자의 개별 제출 상태 확인
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1?.isSubmitted).toBe(true); // 평가자1은 모두 제출
      expect(evaluator1?.assignedWbsCount).toBe(3);
      expect(evaluator1?.completedEvaluationCount).toBe(3);

      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).toBeDefined();
      expect(evaluator2?.isSubmitted).toBe(false); // 평가자2는 일부만 제출
      expect(evaluator2?.assignedWbsCount).toBe(3);
      expect(evaluator2?.completedEvaluationCount).toBe(2);

      const evaluator3 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId3,
      );
      expect(evaluator3).toBeDefined();
      expect(evaluator3?.isSubmitted).toBe(false); // 평가자3는 미제출
      expect(evaluator3?.assignedWbsCount).toBe(3);
      expect(evaluator3?.completedEvaluationCount).toBe(0);
    });

    it('평가자가 여러 WBS를 담당하는 경우 모든 WBS에 대해 제출해야 isSubmitted가 true여야 한다', async () => {
      // Given - 평가자1이 WBS1과 WBS2를 모두 담당하도록 매핑 변경
      // 기존 매핑 삭제
      const existingMappings = await evaluationLineMappingRepository.find({
        where: {
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
        },
      });
      await evaluationLineMappingRepository.remove(existingMappings);

      // 평가라인 조회
      const secondaryLine = await evaluationLineRepository.findOne({
        where: {
          evaluatorType: EvaluatorType.SECONDARY,
          deletedAt: IsNull(),
        },
      });
      expect(secondaryLine).toBeDefined();

      // 평가자1이 WBS1과 WBS2를 모두 담당
      await evaluationLineMappingRepository.save({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: secondaryLine!.id,
        evaluatorId: secondaryEvaluatorId1,
        wbsItemId: wbsItemId1,
        createdBy: systemAdminId,
      });

      await evaluationLineMappingRepository.save({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: secondaryLine!.id,
        evaluatorId: secondaryEvaluatorId1,
        wbsItemId: wbsItemId2,
        createdBy: systemAdminId,
      });

      await evaluationLineMappingRepository.save({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: secondaryLine!.id,
        evaluatorId: secondaryEvaluatorId2,
        wbsItemId: wbsItemId3,
        createdBy: systemAdminId,
      });

      // 평가자1: WBS1만 제출 (WBS2는 미제출)
      const evaluation1_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId1,
        wbsId: wbsItemId1,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자1 평가 내용 1',
        downwardEvaluationScore: 80,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation1_1);

      // 평가자2: WBS3 제출
      const evaluation2_1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId2,
        wbsId: wbsItemId3,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '평가자2 평가 내용 1',
        downwardEvaluationScore: 85,
        isCompleted: true,
      });
      await downwardEvaluationRepository.save(evaluation2_1);

      // When - 대시보드 조회
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then - 통합 제출 상태가 false여야 함 (평가자1이 WBS2를 제출하지 않았으므로)
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.isSubmitted).toBe(false);
      expect(result!.downwardEvaluation.secondary.evaluators.length).toBe(2);

      // 평가자1의 개별 제출 상태 확인
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1?.isSubmitted).toBe(false); // WBS2를 제출하지 않았으므로 false
      // 현재 로직은 피평가자에게 할당된 전체 WBS 수를 기준으로 하므로 3개
      expect(evaluator1?.assignedWbsCount).toBe(3);
      expect(evaluator1?.completedEvaluationCount).toBe(1); // WBS1만 완료

      // 평가자2의 개별 제출 상태 확인
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).toBeDefined();
      // 현재 로직은 피평가자에게 할당된 전체 WBS 수를 기준으로 하므로
      // 평가자2가 WBS3만 제출했어도 assignedWbsCount는 3이고, completedEvaluationCount는 1이므로 isSubmitted는 false
      expect(evaluator2?.isSubmitted).toBe(false);
      expect(evaluator2?.assignedWbsCount).toBe(3); // 피평가자에게 할당된 전체 WBS 수
      expect(evaluator2?.completedEvaluationCount).toBe(1); // WBS3만 완료
    });
  });
});

