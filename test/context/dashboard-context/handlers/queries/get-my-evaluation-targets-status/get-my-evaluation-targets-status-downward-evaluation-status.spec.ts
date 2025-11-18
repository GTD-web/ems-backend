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
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dashboard Context - Downward Evaluation Status 조회 테스트 (내가 담당하는 평가 대상자)
 *
 * 내가 담당하는 평가 대상자 현황 조회 시 하향평가 상태(status)가 제대로 계산되는지 검증합니다.
 * - 할당수 = 완료수 = 0 → "none"
 * - 할당수 > 완료수 > 0 → "in_progress"
 * - 할당수 = 완료수 > 0 → "complete"
 */
describe('Dashboard Context - Downward Evaluation Status (My Evaluation Targets)', () => {
  let handler: GetMyEvaluationTargetsStatusHandler;
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
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let wbsCriteriaRepository: Repository<WbsEvaluationCriteria>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let evaluatorId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let employeeId1: string; // none 상태 테스트용
  let employeeId2: string; // in_progress 상태 테스트용 (일부 완료)
  let employeeId3: string; // complete 상태 테스트용 (전체 완료)
  let employeeId4: string; // in_progress 상태 테스트용 (할당만 있고 완료 없음)
  let employeeId5: string; // 2차 평가자 none 상태 테스트용
  let employeeId6: string; // 2차 평가자 in_progress 상태 테스트용
  let employeeId7: string; // 2차 평가자 complete 상태 테스트용
  let departmentId: string;
  let primaryLineId: string;
  let secondaryLineId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          EvaluationLine,
          EvaluationLineMapping,
          Project,
          WbsItem,
          DownwardEvaluation,
          WbsEvaluationCriteria,
          WbsSelfEvaluation,
        ]),
      ],
      providers: [GetMyEvaluationTargetsStatusHandler],
    }).compile();

    handler = module.get<GetMyEvaluationTargetsStatusHandler>(
      GetMyEvaluationTargetsStatusHandler,
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
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    wbsCriteriaRepository = dataSource.getRepository(WbsEvaluationCriteria);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'get-my-evaluation-targets-status-downward-evaluation-status-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    const jsonString = JSON.stringify(output, null, 2);
    fs.writeFileSync(outputPath, jsonString, 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
    console.log('\n📊 테스트 결과 JSON:');
    console.log(jsonString);

    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const downwardEvaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(downwardEvaluations);

      const wbsSelfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(wbsSelfEvaluations);

      const wbsCriteria = await wbsCriteriaRepository.find();
      await wbsCriteriaRepository.remove(wbsCriteria);

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

    // 등급 구간 설정
    savedPeriod.등급구간_설정한다(
      [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 90, maxRange: 94 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ],
      systemAdminId,
    );
    await evaluationPeriodRepository.save(savedPeriod);

    // 3. 평가자 생성 (조회 대상 평가자 - PRIMARY 평가자)
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

    // 4. PRIMARY 평가자 생성
    const primaryEvaluator = employeeRepository.create({
      name: '박1차평가자',
      employeeNumber: 'PRIMARY001',
      email: 'primary@test.com',
      externalId: 'EXT_PRIMARY',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator =
      await employeeRepository.save(primaryEvaluator);
    primaryEvaluatorId = savedPrimaryEvaluator.id;

    // 5. SECONDARY 평가자 생성
    const secondaryEvaluator = employeeRepository.create({
      name: '최2차평가자',
      employeeNumber: 'SECONDARY001',
      email: 'secondary@test.com',
      externalId: 'EXT_SECONDARY',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator =
      await employeeRepository.save(secondaryEvaluator);
    secondaryEvaluatorId = savedSecondaryEvaluator.id;

    // 6. 피평가자 생성
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

    const employee3 = employeeRepository.create({
      name: '김피평가3',
      employeeNumber: 'EMP003',
      email: 'employee3@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee3 = await employeeRepository.save(employee3);
    employeeId3 = savedEmployee3.id;

    const employee4 = employeeRepository.create({
      name: '김피평가4',
      employeeNumber: 'EMP004',
      email: 'employee4@test.com',
      externalId: 'EXT004',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee4 = await employeeRepository.save(employee4);
    employeeId4 = savedEmployee4.id;

    const employee5 = employeeRepository.create({
      name: '김피평가5',
      employeeNumber: 'EMP005',
      email: 'employee5@test.com',
      externalId: 'EXT005',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee5 = await employeeRepository.save(employee5);
    employeeId5 = savedEmployee5.id;

    const employee6 = employeeRepository.create({
      name: '김피평가6',
      employeeNumber: 'EMP006',
      email: 'employee6@test.com',
      externalId: 'EXT006',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee6 = await employeeRepository.save(employee6);
    employeeId6 = savedEmployee6.id;

    const employee7 = employeeRepository.create({
      name: '김피평가7',
      employeeNumber: 'EMP007',
      email: 'employee7@test.com',
      externalId: 'EXT007',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee7 = await employeeRepository.save(employee7);
    employeeId7 = savedEmployee7.id;

    // 7. 평가기간-직원 매핑 생성
    for (const empId of [
      employeeId1,
      employeeId2,
      employeeId3,
      employeeId4,
      employeeId5,
      employeeId6,
      employeeId7,
    ]) {
      const mapping = mappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: empId,
        createdBy: systemAdminId,
      });
      await mappingRepository.save(mapping);
    }

    // 8. 평가라인 생성
    const primaryLine = lineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await lineRepository.save(primaryLine);
    primaryLineId = savedPrimaryLine.id;

    const secondaryLine = lineRepository.create({
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine = await lineRepository.save(secondaryLine);
    secondaryLineId = savedSecondaryLine.id;

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
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);
    wbsItemId1 = savedWbsItem1.id;

    const wbsItem2 = wbsItemRepository.create({
      wbsCode: 'WBS002',
      title: 'WBS 항목 2',
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);
    wbsItemId2 = savedWbsItem2.id;

    const wbsItem3 = wbsItemRepository.create({
      wbsCode: 'WBS003',
      title: 'WBS 항목 3',
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem3 = await wbsItemRepository.save(wbsItem3);
    wbsItemId3 = savedWbsItem3.id;

    // 11. 프로젝트 할당 생성
    for (const empId of [
      employeeId1,
      employeeId2,
      employeeId3,
      employeeId4,
      employeeId5,
      employeeId6,
      employeeId7,
    ]) {
      const projectAssignment = projectAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: empId,
        projectId: savedProject.id,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        displayOrder: 0,
        createdBy: systemAdminId,
      });
      await projectAssignmentRepository.save(projectAssignment);
    }

    // 12. WBS 할당 생성
    for (const empId of [
      employeeId1,
      employeeId2,
      employeeId3,
      employeeId4,
      employeeId5,
      employeeId6,
      employeeId7,
    ]) {
      let displayOrder = 0;
      for (const wbsId of [wbsItemId1, wbsItemId2, wbsItemId3]) {
        const wbsAssignment = wbsAssignmentRepository.create({
          periodId: evaluationPeriodId,
          employeeId: empId,
          projectId: savedProject.id,
          wbsItemId: wbsId,
          weight: 33.33, // 가중치 설정
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: displayOrder++,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment);
      }
    }
  }

  describe('1차 평가자 하향평가 상태 검증', () => {
    it('상태: none - 할당수 = 완료수 = 0인 경우 primaryStatus.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY 평가라인 매핑 생성 (조회 대상 평가자가 PRIMARY 평가자)
      const primaryLineMapping = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId1,
        evaluatorId: evaluatorId, // 조회 대상 평가자가 PRIMARY 평가자
        wbsItemId: undefined,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping);

      // 하향평가 생성하지 않음 (할당수 = 0)

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId1);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation).toBeDefined();
      expect(target?.downwardEvaluation.isPrimary).toBe(true);
      expect(target?.downwardEvaluation.primaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus?.status).toBe('none');
      expect(target?.downwardEvaluation.primaryStatus?.assignedWbsCount).toBe(0);
      expect(target?.downwardEvaluation.primaryStatus?.completedEvaluationCount).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: none - 할당수 = 완료수 = 0인 경우 primaryStatus.status는 none이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId1,
          primaryStatus: {
            status: target?.downwardEvaluation.primaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.primaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.primaryStatus?.completedEvaluationCount,
          },
        },
      });
    });

    it('상태: in_progress - 할당수 > 완료수 > 0인 경우 primaryStatus.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY 평가라인 매핑 생성
      const primaryLineMapping = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId2,
        evaluatorId: evaluatorId,
        wbsItemId: undefined,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping);

      // 하향평가 생성 (3개 할당, 2개 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId2,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId2,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // wbsItemId3에 대한 평가 생성 (점수 없음 = 미완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId2,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId3,
          downwardEvaluationContent: '평가 내용 3',
          // downwardEvaluationScore를 생략 (undefined = 미완료)
          evaluationDate: new Date(),
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId2);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus?.status).toBe('in_progress');
      expect(target?.downwardEvaluation.primaryStatus?.assignedWbsCount).toBe(3);
      expect(target?.downwardEvaluation.primaryStatus?.completedEvaluationCount).toBe(2);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: in_progress - 할당수 > 완료수 > 0인 경우 primaryStatus.status는 in_progress이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId2,
          primaryStatus: {
            status: target?.downwardEvaluation.primaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.primaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.primaryStatus?.completedEvaluationCount,
          },
        },
      });
    });

    it('상태: in_progress - 할당수 > 0이고 완료수 = 0인 경우 primaryStatus.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY 평가라인 매핑 생성
      const primaryLineMapping = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: evaluatorId,
        wbsItemId: undefined,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping);

      // 하향평가 생성 (점수 없이 생성 - 완료되지 않음)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId4,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          // downwardEvaluationScore를 생략 (undefined = 미완료)
          evaluationDate: new Date(),
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId4);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus?.status).toBe('in_progress');
      expect(target?.downwardEvaluation.primaryStatus?.assignedWbsCount).toBeGreaterThan(0);
      expect(target?.downwardEvaluation.primaryStatus?.completedEvaluationCount).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: in_progress - 할당수 > 0이고 완료수 = 0인 경우 primaryStatus.status는 in_progress이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId4,
          primaryStatus: {
            status: target?.downwardEvaluation.primaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.primaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.primaryStatus?.completedEvaluationCount,
          },
        },
      });
    });

    it('상태: complete - 할당수 = 완료수 > 0인 경우 primaryStatus.status는 complete이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY 평가라인 매핑 생성
      const primaryLineMapping = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId3,
        evaluatorId: evaluatorId,
        wbsItemId: undefined,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping);

      // 하향평가 생성 (3개 모두 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId3,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId3,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId3,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId3,
          downwardEvaluationContent: '평가 내용 3',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId3);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.primaryStatus?.status).toBe('complete');
      expect(target?.downwardEvaluation.primaryStatus?.assignedWbsCount).toBe(3);
      expect(target?.downwardEvaluation.primaryStatus?.completedEvaluationCount).toBe(3);
      expect(target?.downwardEvaluation.primaryStatus?.totalScore).not.toBeNull();
      expect(target?.downwardEvaluation.primaryStatus?.grade).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: complete - 할당수 = 완료수 > 0인 경우 primaryStatus.status는 complete이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId3,
          primaryStatus: {
            status: target?.downwardEvaluation.primaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.primaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.primaryStatus?.completedEvaluationCount,
            totalScore: target?.downwardEvaluation.primaryStatus?.totalScore,
            grade: target?.downwardEvaluation.primaryStatus?.grade,
          },
        },
      });
    });
  });

  describe('2차 평가자 하향평가 상태 검증', () => {
    it('상태: none - 할당수 = 완료수 = 0인 경우 secondaryStatus.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // SECONDARY 평가라인 매핑 생성 (조회 대상 평가자가 SECONDARY 평가자)
      const secondaryLineMapping = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId5,
        evaluatorId: evaluatorId, // 조회 대상 평가자가 SECONDARY 평가자
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping);

      // 하향평가 생성하지 않음 (할당수 = 0)

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId5);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation).toBeDefined();
      expect(target?.downwardEvaluation.isSecondary).toBe(true);
      expect(target?.downwardEvaluation.secondaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.secondaryStatus?.status).toBe('none');
      expect(target?.downwardEvaluation.secondaryStatus?.assignedWbsCount).toBe(0);
      expect(target?.downwardEvaluation.secondaryStatus?.completedEvaluationCount).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: none - 할당수 = 완료수 = 0인 경우 secondaryStatus.status는 none이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId5,
          secondaryStatus: {
            status: target?.downwardEvaluation.secondaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.secondaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.secondaryStatus?.completedEvaluationCount,
          },
        },
      });
    });

    it('상태: in_progress - 할당수 > 완료수 > 0인 경우 secondaryStatus.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // SECONDARY 평가라인 매핑 생성
      const secondaryLineMapping = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId6,
        evaluatorId: evaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping);

      // 하향평가 생성 (3개 할당, 1개 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId6,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // wbsItemId2, wbsItemId3에 대한 평가 생성 (점수 없음 = 미완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId6,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          // downwardEvaluationScore를 생략 (undefined = 미완료)
          evaluationDate: new Date(),
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId6,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId3,
          downwardEvaluationContent: '평가 내용 3',
          // downwardEvaluationScore를 생략 (undefined = 미완료)
          evaluationDate: new Date(),
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId6);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation.secondaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.secondaryStatus?.status).toBe('in_progress');
      expect(target?.downwardEvaluation.secondaryStatus?.assignedWbsCount).toBe(3);
      expect(target?.downwardEvaluation.secondaryStatus?.completedEvaluationCount).toBe(1);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: in_progress - 할당수 > 완료수 > 0인 경우 secondaryStatus.status는 in_progress이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId6,
          secondaryStatus: {
            status: target?.downwardEvaluation.secondaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.secondaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.secondaryStatus?.completedEvaluationCount,
          },
        },
      });
    });

    it('상태: complete - 할당수 = 완료수 > 0인 경우 secondaryStatus.status는 complete이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // SECONDARY 평가라인 매핑 생성
      const secondaryLineMapping = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId7,
        evaluatorId: evaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping);

      // 하향평가 생성 (3개 모두 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId7,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId7,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId7,
          evaluatorId: evaluatorId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId3,
          downwardEvaluationContent: '평가 내용 3',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target = result.find((r) => r.employeeId === employeeId7);
      expect(target).toBeDefined();
      expect(target?.downwardEvaluation.secondaryStatus).toBeDefined();
      expect(target?.downwardEvaluation.secondaryStatus?.status).toBe('complete');
      expect(target?.downwardEvaluation.secondaryStatus?.assignedWbsCount).toBe(3);
      expect(target?.downwardEvaluation.secondaryStatus?.completedEvaluationCount).toBe(3);
      expect(target?.downwardEvaluation.secondaryStatus?.totalScore).not.toBeNull();
      expect(target?.downwardEvaluation.secondaryStatus?.grade).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태: complete - 할당수 = 완료수 > 0인 경우 secondaryStatus.status는 complete이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId7,
          secondaryStatus: {
            status: target?.downwardEvaluation.secondaryStatus?.status,
            assignedWbsCount:
              target?.downwardEvaluation.secondaryStatus?.assignedWbsCount,
            completedEvaluationCount:
              target?.downwardEvaluation.secondaryStatus?.completedEvaluationCount,
            totalScore: target?.downwardEvaluation.secondaryStatus?.totalScore,
            grade: target?.downwardEvaluation.secondaryStatus?.grade,
          },
        },
      });
    });
  });
});

