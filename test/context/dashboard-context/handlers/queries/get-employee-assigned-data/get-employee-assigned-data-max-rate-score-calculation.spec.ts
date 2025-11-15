import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
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
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import {
  SubmitWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation.handler';

/**
 * Dashboard Context - MaxSelfEvaluationRate 기반 점수 계산 테스트
 *
 * 평가기간의 maxSelfEvaluationRate를 최대값으로 사용하여 점수가 제대로 계산되는지 검증합니다.
 * - 자기평가 점수 계산
 * - 1차 하향평가 점수 계산
 * - 2차 하향평가 점수 계산 (여러 평가자)
 */
describe('Dashboard Context - MaxSelfEvaluationRate 기반 점수 계산', () => {
  let handler: GetEmployeeAssignedDataHandler;
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
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluator1Id: string;
  let secondaryEvaluator2Id: string;
  let secondaryEvaluator3Id: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;
  let primaryEvaluationLineId: string;
  let secondaryEvaluationLineId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const maxSelfEvaluationRate = 120; // 테스트용 최대 달성률

  // 테스트 결과 저장용
  const testResults: any[] = [];

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
      providers: [GetEmployeeAssignedDataHandler, SubmitWbsSelfEvaluationHandler],
    }).compile();

    handler = module.get<GetEmployeeAssignedDataHandler>(
      GetEmployeeAssignedDataHandler,
    );
    submitToManagerHandler = module.get<SubmitWbsSelfEvaluationHandler>(
      SubmitWbsSelfEvaluationHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository =
      dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    projectAssignmentRepository = dataSource.getRepository(
      EvaluationProjectAssignment,
    );
    wbsAssignmentRepository =
      dataSource.getRepository(EvaluationWbsAssignment);
    wbsSelfEvaluationRepository =
      dataSource.getRepository(WbsSelfEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository =
      dataSource.getRepository(EvaluationLineMapping);
    downwardEvaluationRepository =
      dataSource.getRepository(DownwardEvaluation);
  });

  beforeEach(async () => {
    // 데이터베이스 초기화
    await dataSource.query('TRUNCATE TABLE "evaluation_period" CASCADE');
    await dataSource.query('TRUNCATE TABLE "employee" CASCADE');
    await dataSource.query('TRUNCATE TABLE "department" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_period_employee_mapping" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_project_assignment" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_wbs_assignment" CASCADE');
    await dataSource.query('TRUNCATE TABLE "wbs_self_evaluation" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_lines" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_line_mappings" CASCADE');
    await dataSource.query('TRUNCATE TABLE "downward_evaluation" CASCADE');
    await dataSource.query('TRUNCATE TABLE "project" CASCADE');
    await dataSource.query('TRUNCATE TABLE "wbs_item" CASCADE');

    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '테스트 부서',
      code: 'DEPT001',
      externalId: 'EXT_DEPT001',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성 (maxSelfEvaluationRate: 120)
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      startDate: new Date('2024-01-01'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
      maxSelfEvaluationRate: maxSelfEvaluationRate,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 등급 구간 설정 (0-120 범위)
    savedPeriod.등급구간_설정한다(
      [
        { grade: 'S+', minRange: 114, maxRange: 120 },
        { grade: 'S', minRange: 108, maxRange: 113 },
        { grade: 'A+', minRange: 102, maxRange: 107 },
        { grade: 'A', minRange: 96, maxRange: 101 },
        { grade: 'B+', minRange: 90, maxRange: 95 },
        { grade: 'B', minRange: 84, maxRange: 89 },
        { grade: 'C', minRange: 0, maxRange: 83 },
      ],
      systemAdminId,
    );
    await evaluationPeriodRepository.save(savedPeriod);

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

    // 4. 1차 평가자 생성
    const primaryEvaluator = employeeRepository.create({
      name: '이1차평가자',
      employeeNumber: 'PRIMARY001',
      email: 'primary@test.com',
      externalId: 'EXT_PRIMARY',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator = await employeeRepository.save(primaryEvaluator);
    primaryEvaluatorId = savedPrimaryEvaluator.id;

    // 5. 2차 평가자들 생성
    const secondaryEvaluator1 = employeeRepository.create({
      name: '박2차평가자1',
      employeeNumber: 'SECONDARY001',
      email: 'secondary1@test.com',
      externalId: 'EXT_SEC1',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator1 = await employeeRepository.save(secondaryEvaluator1);
    secondaryEvaluator1Id = savedSecondaryEvaluator1.id;

    const secondaryEvaluator2 = employeeRepository.create({
      name: '최2차평가자2',
      employeeNumber: 'SECONDARY002',
      email: 'secondary2@test.com',
      externalId: 'EXT_SEC2',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator2 = await employeeRepository.save(secondaryEvaluator2);
    secondaryEvaluator2Id = savedSecondaryEvaluator2.id;

    const secondaryEvaluator3 = employeeRepository.create({
      name: '정2차평가자3',
      employeeNumber: 'SECONDARY003',
      email: 'secondary3@test.com',
      externalId: 'EXT_SEC3',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator3 = await employeeRepository.save(secondaryEvaluator3);
    secondaryEvaluator3Id = savedSecondaryEvaluator3.id;

    // 6. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping);

    // 7. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 8. WBS 항목 생성 (3개)
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

    // 10. WBS 할당 생성 (가중치: 30%, 40%, 30%)
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

    // 11. 평가라인 생성
    const primaryEvaluationLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryEvaluationLine);
    primaryEvaluationLineId = savedPrimaryLine.id;

    const secondaryEvaluationLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine = await evaluationLineRepository.save(secondaryEvaluationLine);
    secondaryEvaluationLineId = savedSecondaryLine.id;

    // 12. 1차 평가자 매핑 (직원별 고정)
    const primaryMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      evaluationLineId: primaryEvaluationLineId,
      wbsItemId: undefined, // 1차 평가자는 직원별 고정
      createdBy: systemAdminId,
    } as any);
    await evaluationLineMappingRepository.save(primaryMapping);

    // 13. 2차 평가자 매핑
    // 평가자1: WBS1, WBS2
    const secondaryMapping1_1 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping1_1);

    const secondaryMapping1_2 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId2,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping1_2);

    // 평가자2: WBS2, WBS3
    const secondaryMapping2_2 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator2Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId2,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping2_2);

    const secondaryMapping2_3 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator2Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId3,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping2_3);

    // 평가자3: WBS1, WBS3
    const secondaryMapping3_1 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator3Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping3_1);

    const secondaryMapping3_3 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator3Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId3,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(secondaryMapping3_3);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'get-employee-assigned-data-max-rate-score-calculation-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(
      `✅ 테스트 결과가 저장되었습니다: ${outputPath}`,
    );

    await dataSource.destroy();
    await module.close();
  });

  describe('자기평가 점수 계산 - maxSelfEvaluationRate를 최대값으로 사용', () => {
    it('maxSelfEvaluationRate(120)를 최대값으로 사용하여 점수가 계산되어야 한다', async () => {
      // Given
      // 자기평가 생성 및 제출
      // WBS1: 가중치 30%, 점수 100
      // WBS2: 가중치 40%, 점수 120 (최대값)
      // WBS3: 가중치 30%, 점수 90
      // 예상 총점: (30% × 100) + (40% × 120) + (30% × 90) = 30 + 48 + 27 = 105점

      const selfEvaluation1 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        selfEvaluationScore: 100,
        selfEvaluationContent: '자기평가 내용 1',
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEvaluation1);

      const selfEvaluation2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId2,
        selfEvaluationScore: 120, // 최대값
        selfEvaluationContent: '자기평가 내용 2',
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEvaluation2);

      const selfEvaluation3 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId3,
        selfEvaluationScore: 90,
        selfEvaluationContent: '자기평가 내용 3',
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEvaluation3);

      // 관리자에게 제출
      await submitToManagerHandler.execute(
        new SubmitWbsSelfEvaluationCommand(
          selfEvaluation1.id,
          systemAdminId,
        ),
      );
      await submitToManagerHandler.execute(
        new SubmitWbsSelfEvaluationCommand(
          selfEvaluation2.id,
          systemAdminId,
        ),
      );
      await submitToManagerHandler.execute(
        new SubmitWbsSelfEvaluationCommand(
          selfEvaluation3.id,
          systemAdminId,
        ),
      );

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalScore).toBe(105); // 30 + 48 + 27
      expect(result.summary.selfEvaluation.grade).toBe('A+'); // 105점은 A+ 범위

      // 테스트 결과 저장
      testResults.push({
        testName: 'maxSelfEvaluationRate(120)를 최대값으로 사용하여 점수가 계산되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          maxSelfEvaluationRate,
          wbsScores: [
            { wbsItemId: wbsItemId1, weight: 30, score: 100 },
            { wbsItemId: wbsItemId2, weight: 40, score: 120 },
            { wbsItemId: wbsItemId3, weight: 30, score: 90 },
          ],
          calculatedTotalScore: result.summary.selfEvaluation.totalScore,
          expectedTotalScore: 105,
          grade: result.summary.selfEvaluation.grade,
        },
      });
    });

    it('모든 WBS가 최대값(120)일 때 총점이 120점이 되어야 한다', async () => {
      // Given
      // 모든 WBS가 최대값 120점
      // 예상 총점: (30% × 120) + (40% × 120) + (30% × 120) = 36 + 48 + 36 = 120점

      const selfEvaluation1 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        selfEvaluationScore: 120,
        selfEvaluationContent: '자기평가 내용 1',
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEvaluation1);

      const selfEvaluation2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId2,
        selfEvaluationScore: 120,
        selfEvaluationContent: '자기평가 내용 2',
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEvaluation2);

      const selfEvaluation3 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId3,
        selfEvaluationScore: 120,
        selfEvaluationContent: '자기평가 내용 3',
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEvaluation3);

      // 관리자에게 제출
      await submitToManagerHandler.execute(
        new SubmitWbsSelfEvaluationCommand(
          selfEvaluation1.id,
          systemAdminId,
        ),
      );
      await submitToManagerHandler.execute(
        new SubmitWbsSelfEvaluationCommand(
          selfEvaluation2.id,
          systemAdminId,
        ),
      );
      await submitToManagerHandler.execute(
        new SubmitWbsSelfEvaluationCommand(
          selfEvaluation3.id,
          systemAdminId,
        ),
      );

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.selfEvaluation.totalScore).toBe(120); // 최대값
      expect(result.summary.selfEvaluation.grade).toBe('S+'); // 114-120 범위

      // 테스트 결과 저장
      testResults.push({
        testName: '모든 WBS가 최대값(120)일 때 총점이 120점이 되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          maxSelfEvaluationRate,
          wbsScores: [
            { wbsItemId: wbsItemId1, weight: 30, score: 120 },
            { wbsItemId: wbsItemId2, weight: 40, score: 120 },
            { wbsItemId: wbsItemId3, weight: 30, score: 120 },
          ],
          calculatedTotalScore: result.summary.selfEvaluation.totalScore,
          expectedTotalScore: 120,
          grade: result.summary.selfEvaluation.grade,
        },
      });
    });
  });

  describe('1차 하향평가 점수 계산 - maxSelfEvaluationRate를 최대값으로 사용', () => {
    it('1차 하향평가 점수가 maxSelfEvaluationRate를 최대값으로 사용하여 계산되어야 한다', async () => {
      // Given
      // 1차 하향평가 생성 및 완료
      // WBS1: 가중치 30%, 점수 100
      // WBS2: 가중치 40%, 점수 120 (최대값)
      // WBS3: 가중치 30%, 점수 90
      // 예상 총점: (30% × 100) + (40% × 120) + (30% × 90) = 30 + 48 + 27 = 105점

      const downwardEvaluation1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationScore: 100,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation1);

      const downwardEvaluation2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationScore: 120, // 최대값
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation2);

      const downwardEvaluation3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationScore: 90,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.primaryDownwardEvaluation.totalScore).toBeCloseTo(105, 2);
      expect(result.summary.primaryDownwardEvaluation.grade).toBe('A+'); // 105점은 A+ 범위
      expect(result.summary.primaryDownwardEvaluation.isSubmitted).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName: '1차 하향평가 점수가 maxSelfEvaluationRate를 최대값으로 사용하여 계산되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          evaluatorId: primaryEvaluatorId,
          maxSelfEvaluationRate,
          wbsScores: [
            { wbsItemId: wbsItemId1, weight: 30, score: 100 },
            { wbsItemId: wbsItemId2, weight: 40, score: 120 },
            { wbsItemId: wbsItemId3, weight: 30, score: 90 },
          ],
          calculatedTotalScore: result.summary.primaryDownwardEvaluation.totalScore,
          expectedTotalScore: 105,
          grade: result.summary.primaryDownwardEvaluation.grade,
          isSubmitted: result.summary.primaryDownwardEvaluation.isSubmitted,
        },
      });
    });
  });

  describe('2차 하향평가 점수 계산 - 여러 평가자, maxSelfEvaluationRate를 최대값으로 사용', () => {
    it('여러 2차 평가자가 있을 때 평균 점수로 계산되어야 한다', async () => {
      // Given
      // 2차 평가자 1: WBS1(100점), WBS2(110점)
      // 2차 평가자 2: WBS2(120점), WBS3(90점)
      // 2차 평가자 3: WBS1(110점), WBS3(100점)
      //
      // WBS별 평균:
      // - WBS1: (100 + 110) / 2 = 105점
      // - WBS2: (110 + 120) / 2 = 115점
      // - WBS3: (90 + 100) / 2 = 95점
      //
      // 가중치 적용:
      // - WBS1: 30% × 105 = 31.5점
      // - WBS2: 40% × 115 = 46점
      // - WBS3: 30% × 95 = 28.5점
      // 총점: 31.5 + 46 + 28.5 = 106점

      // 평가자1: WBS1, WBS2
      const secondaryEval1_1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator1Id,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 100,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1_1);

      const secondaryEval1_2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator1Id,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 110,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1_2);

      // 평가자2: WBS2, WBS3
      const secondaryEval2_2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator2Id,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120, // 최대값
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval2_2);

      const secondaryEval2_3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator2Id,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 90,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval2_3);

      // 평가자3: WBS1, WBS3
      const secondaryEval3_1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator3Id,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 110,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval3_1);

      const secondaryEval3_3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator3Id,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 100,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval3_3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.secondaryDownwardEvaluation.totalScore).toBeCloseTo(106, 2);
      expect(result.summary.secondaryDownwardEvaluation.grade).toBe('A+'); // 106점은 A+ 범위
      expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName: '여러 2차 평가자가 있을 때 평균 점수로 계산되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          maxSelfEvaluationRate,
          evaluators: [
            {
              evaluatorId: secondaryEvaluator1Id,
              wbsScores: [
                { wbsItemId: wbsItemId1, score: 100 },
                { wbsItemId: wbsItemId2, score: 110 },
              ],
            },
            {
              evaluatorId: secondaryEvaluator2Id,
              wbsScores: [
                { wbsItemId: wbsItemId2, score: 120 },
                { wbsItemId: wbsItemId3, score: 90 },
              ],
            },
            {
              evaluatorId: secondaryEvaluator3Id,
              wbsScores: [
                { wbsItemId: wbsItemId1, score: 110 },
                { wbsItemId: wbsItemId3, score: 100 },
              ],
            },
          ],
          wbsAverageScores: [
            { wbsItemId: wbsItemId1, weight: 30, averageScore: 105 },
            { wbsItemId: wbsItemId2, weight: 40, averageScore: 115 },
            { wbsItemId: wbsItemId3, weight: 30, averageScore: 95 },
          ],
          calculatedTotalScore: result.summary.secondaryDownwardEvaluation.totalScore,
          expectedTotalScore: 106,
          grade: result.summary.secondaryDownwardEvaluation.grade,
          isSubmitted: result.summary.secondaryDownwardEvaluation.isSubmitted,
        },
      });
    });

    it('여러 2차 평가자가 모두 최대값(120)을 줄 때 총점이 120점이 되어야 한다', async () => {
      // Given
      // 모든 2차 평가자가 모든 WBS에 대해 120점을 줌
      // WBS별 평균: 모두 120점
      // 예상 총점: (30% × 120) + (40% × 120) + (30% × 120) = 36 + 48 + 36 = 120점

      // 평가자1: WBS1, WBS2 모두 120점
      const secondaryEval1_1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator1Id,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1_1);

      const secondaryEval1_2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator1Id,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1_2);

      // 평가자2: WBS2, WBS3 모두 120점
      const secondaryEval2_2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator2Id,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval2_2);

      const secondaryEval2_3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator2Id,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval2_3);

      // 평가자3: WBS1, WBS3 모두 120점
      const secondaryEval3_1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator3Id,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval3_1);

      const secondaryEval3_3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator3Id,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 120,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval3_3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.secondaryDownwardEvaluation.totalScore).toBeCloseTo(120, 2); // 최대값
      expect(result.summary.secondaryDownwardEvaluation.grade).toBe('S+'); // 114-120 범위
      expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName: '여러 2차 평가자가 모두 최대값(120)을 줄 때 총점이 120점이 되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          maxSelfEvaluationRate,
          evaluators: [
            { evaluatorId: secondaryEvaluator1Id },
            { evaluatorId: secondaryEvaluator2Id },
            { evaluatorId: secondaryEvaluator3Id },
          ],
          allScores: 120,
          calculatedTotalScore: result.summary.secondaryDownwardEvaluation.totalScore,
          expectedTotalScore: 120,
          grade: result.summary.secondaryDownwardEvaluation.grade,
          isSubmitted: result.summary.secondaryDownwardEvaluation.isSubmitted,
        },
      });
    });

    it('2차 평가자들이 서로 다른 점수를 줄 때 평균으로 계산되어야 한다', async () => {
      // Given
      // WBS1: 평가자1(80점), 평가자3(100점) → 평균 90점
      // WBS2: 평가자1(110점), 평가자2(100점) → 평균 105점
      // WBS3: 평가자2(90점), 평가자3(110점) → 평균 100점
      //
      // 가중치 적용:
      // - WBS1: 30% × 90 = 27점
      // - WBS2: 40% × 105 = 42점
      // - WBS3: 30% × 100 = 30점
      // 총점: 27 + 42 + 30 = 99점

      // 평가자1: WBS1(80점), WBS2(110점)
      const secondaryEval1_1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator1Id,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 80,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1_1);

      const secondaryEval1_2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator1Id,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 110,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1_2);

      // 평가자2: WBS2(100점), WBS3(90점)
      const secondaryEval2_2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator2Id,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 100,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval2_2);

      const secondaryEval2_3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator2Id,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 90,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval2_3);

      // 평가자3: WBS1(100점), WBS3(110점)
      const secondaryEval3_1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator3Id,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 100,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval3_1);

      const secondaryEval3_3 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluator3Id,
        wbsId: wbsItemId3,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 110,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval3_3);

      // When
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result.summary.secondaryDownwardEvaluation.totalScore).toBeCloseTo(99, 2);
      expect(result.summary.secondaryDownwardEvaluation.grade).toBe('A'); // 96-101 범위
      expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName: '2차 평가자들이 서로 다른 점수를 줄 때 평균으로 계산되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          maxSelfEvaluationRate,
          evaluators: [
            {
              evaluatorId: secondaryEvaluator1Id,
              wbsScores: [
                { wbsItemId: wbsItemId1, score: 80 },
                { wbsItemId: wbsItemId2, score: 110 },
              ],
            },
            {
              evaluatorId: secondaryEvaluator2Id,
              wbsScores: [
                { wbsItemId: wbsItemId2, score: 100 },
                { wbsItemId: wbsItemId3, score: 90 },
              ],
            },
            {
              evaluatorId: secondaryEvaluator3Id,
              wbsScores: [
                { wbsItemId: wbsItemId1, score: 100 },
                { wbsItemId: wbsItemId3, score: 110 },
              ],
            },
          ],
          wbsAverageScores: [
            { wbsItemId: wbsItemId1, weight: 30, averageScore: 90 },
            { wbsItemId: wbsItemId2, weight: 40, averageScore: 105 },
            { wbsItemId: wbsItemId3, weight: 30, averageScore: 100 },
          ],
          calculatedTotalScore: result.summary.secondaryDownwardEvaluation.totalScore,
          expectedTotalScore: 99,
          grade: result.summary.secondaryDownwardEvaluation.grade,
          isSubmitted: result.summary.secondaryDownwardEvaluation.isSubmitted,
        },
      });
    });
  });
});

