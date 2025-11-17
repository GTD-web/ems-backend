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
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dashboard Context - Evaluation Line Configuration Status 조회 테스트 (내가 담당하는 평가 대상자)
 *
 * 내가 담당하는 평가 대상자 현황 조회 시 평가라인 구성 상태가 제대로 조회되는지 검증합니다.
 */
describe('Dashboard Context - Evaluation Line Configuration Status (My Evaluation Targets)', () => {
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

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let evaluatorId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let employeeId1: string;
  let employeeId2: string;
  let employeeId3: string;
  let employeeId4: string;
  let departmentId: string;
  let primaryLineId: string;
  let secondaryLineId: string;

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

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'get-my-evaluation-targets-status-evaluation-line-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

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

    // 3. 평가자 생성 (조회 대상 평가자)
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

    // 7. 평가기간-직원 매핑 생성
    const mapping1 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId1,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping1);

    const mapping2 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId2,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping2);

    const mapping3 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId3,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping3);

    const mapping4 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId4,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping4);

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

    // 10. WBS 항목 생성
    const wbsItem = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: savedProject.id,
      level: 1,
      createdBy: systemAdminId,
    });
    await wbsItemRepository.save(wbsItem);

    // 11. 프로젝트 할당 생성
    const projectAssignment1 = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId1,
      projectId: savedProject.id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment1);

    const projectAssignment2 = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId2,
      projectId: savedProject.id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment2);

    const projectAssignment3 = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId3,
      projectId: savedProject.id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment3);

    const projectAssignment4 = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId4,
      projectId: savedProject.id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment4);
  }

  describe('평가라인 구성 상태 조회', () => {
    it('PRIMARY와 SECONDARY 평가자가 모두 지정되지 않은 경우 evaluationLineStatus가 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY/SECONDARY 평가자 매핑 생성하지 않음 (평가자 미지정)
      // 조회 대상 평가자와 피평가자 관계만 생성
      // wbsItemId를 null이 아닌 값으로 설정하여 PRIMARY 평가자로 인식되지 않도록 함
      const wbsItem = await wbsItemRepository.findOne({
        where: { projectId: (await projectRepository.find())[0].id },
      });
      const lineMapping1 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId1,
        evaluatorId: evaluatorId, // 조회 대상 평가자 (PRIMARY/SECONDARY 평가자가 아님)
        wbsItemId: wbsItem?.id || undefined, // wbsItemId를 설정하여 PRIMARY 평가자로 인식되지 않도록 함
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping1);

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
      expect(target1?.evaluationLine).toBeDefined();
      expect(target1?.evaluationLine.status).toBe('none');

      // 테스트 결과 저장
      testResults.push({
        testName:
          'PRIMARY와 SECONDARY 평가자가 모두 지정되지 않은 경우 evaluationLineStatus가 none이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId1,
          evaluationLineStatus: target1?.evaluationLine.status,
          hasPrimaryEvaluator: false,
          hasSecondaryEvaluator: false,
        },
      });
    });

    it('PRIMARY 평가자만 지정된 경우 evaluationLineStatus가 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY 평가라인 매핑 생성 (wbsItemId는 null)
      const primaryLineMapping = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId2,
        evaluatorId: primaryEvaluatorId,
        wbsItemId: undefined, // PRIMARY 평가자는 직원별 고정 담당자
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping);

      // 평가라인 매핑 생성 (조회 대상 평가자와 피평가자 관계)
      const lineMapping1 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId2,
        evaluatorId: evaluatorId, // 조회 대상 평가자
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping1);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2).toBeDefined();
      expect(target2?.evaluationLine).toBeDefined();
      expect(target2?.evaluationLine.status).toBe('in_progress');

      // 테스트 결과 저장
      testResults.push({
        testName:
          'PRIMARY 평가자만 지정된 경우 evaluationLineStatus가 in_progress이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId2,
          evaluationLineStatus: target2?.evaluationLine.status,
          hasPrimaryEvaluator: true,
          hasSecondaryEvaluator: false,
        },
      });
    });

    it('SECONDARY 평가자만 지정된 경우 evaluationLineStatus가 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // SECONDARY 평가라인 매핑 생성
      const secondaryLineMapping = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId3,
        evaluatorId: secondaryEvaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping);

      // 평가라인 매핑 생성 (조회 대상 평가자와 피평가자 관계)
      const lineMapping1 = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId3,
        evaluatorId: evaluatorId, // 조회 대상 평가자
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping1);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target3 = result.find((r) => r.employeeId === employeeId3);
      expect(target3).toBeDefined();
      expect(target3?.evaluationLine).toBeDefined();
      expect(target3?.evaluationLine.status).toBe('in_progress');

      // 테스트 결과 저장
      testResults.push({
        testName:
          'SECONDARY 평가자만 지정된 경우 evaluationLineStatus가 in_progress이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId3,
          evaluationLineStatus: target3?.evaluationLine.status,
          hasPrimaryEvaluator: false,
          hasSecondaryEvaluator: true,
        },
      });
    });

    it('PRIMARY와 SECONDARY 평가자가 모두 지정된 경우 evaluationLineStatus가 complete이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // PRIMARY 평가라인 매핑 생성 (wbsItemId는 null)
      const primaryLineMapping = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: primaryEvaluatorId,
        wbsItemId: undefined, // PRIMARY 평가자는 직원별 고정 담당자
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping);

      // SECONDARY 평가라인 매핑 생성
      const secondaryLineMapping = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: secondaryEvaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping);

      // 평가라인 매핑 생성 (조회 대상 평가자와 피평가자 관계)
      const lineMapping1 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: evaluatorId, // 조회 대상 평가자
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping1);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      const target4 = result.find((r) => r.employeeId === employeeId4);
      expect(target4).toBeDefined();
      expect(target4?.evaluationLine).toBeDefined();
      expect(target4?.evaluationLine.status).toBe('complete');

      // 테스트 결과 저장
      testResults.push({
        testName:
          'PRIMARY와 SECONDARY 평가자가 모두 지정된 경우 evaluationLineStatus가 complete이어야 한다',
        result: {
          evaluationPeriodId,
          employeeId: employeeId4,
          evaluationLineStatus: target4?.evaluationLine.status,
          hasPrimaryEvaluator: true,
          hasSecondaryEvaluator: true,
        },
      });
    });

    it('여러 피평가자의 평가라인 구성 상태가 올바르게 구분되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 피평가자1: 평가자 미지정 (none)
      // PRIMARY/SECONDARY 평가자 매핑 생성하지 않음
      // 조회 대상 평가자와 피평가자 관계만 생성
      // wbsItemId를 null이 아닌 값으로 설정하여 PRIMARY 평가자로 인식되지 않도록 함
      const wbsItem = await wbsItemRepository.findOne({
        where: { projectId: (await projectRepository.find())[0].id },
      });
      const lineMapping1 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId1,
        evaluatorId: evaluatorId, // 조회 대상 평가자 (PRIMARY/SECONDARY 평가자가 아님)
        wbsItemId: wbsItem?.id || undefined, // wbsItemId를 설정하여 PRIMARY 평가자로 인식되지 않도록 함
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping1);

      // 피평가자2: PRIMARY만 지정 (in_progress)
      const primaryLineMapping2 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId2,
        evaluatorId: primaryEvaluatorId,
        wbsItemId: undefined,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping2);
      const lineMapping2 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId2,
        evaluatorId: evaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping2);

      // 피평가자3: SECONDARY만 지정 (in_progress)
      const secondaryLineMapping3 = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId3,
        evaluatorId: secondaryEvaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping3);
      const lineMapping3 = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId3,
        evaluatorId: evaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping3);

      // 피평가자4: PRIMARY와 SECONDARY 모두 지정 (complete)
      const primaryLineMapping4 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: primaryEvaluatorId,
        wbsItemId: undefined,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(primaryLineMapping4);
      const secondaryLineMapping4 = lineMappingRepository.create({
        evaluationLineId: secondaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: secondaryEvaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(secondaryLineMapping4);
      const lineMapping4 = lineMappingRepository.create({
        evaluationLineId: primaryLineId,
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        evaluatorId: evaluatorId,
        createdBy: systemAdminId,
      });
      await lineMappingRepository.save(lineMapping4);

      // When
      const query = new GetMyEvaluationTargetsStatusQuery(
        evaluationPeriodId,
        evaluatorId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(4);

      const target1 = result.find((r) => r.employeeId === employeeId1);
      expect(target1).toBeDefined();
      expect(target1?.evaluationLine.status).toBe('none');

      const target2 = result.find((r) => r.employeeId === employeeId2);
      expect(target2).toBeDefined();
      expect(target2?.evaluationLine.status).toBe('in_progress');

      const target3 = result.find((r) => r.employeeId === employeeId3);
      expect(target3).toBeDefined();
      expect(target3?.evaluationLine.status).toBe('in_progress');

      const target4 = result.find((r) => r.employeeId === employeeId4);
      expect(target4).toBeDefined();
      expect(target4?.evaluationLine.status).toBe('complete');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '여러 피평가자의 평가라인 구성 상태가 올바르게 구분되어야 한다',
        result: {
          evaluationPeriodId,
          employees: [
            {
              employeeId: employeeId1,
              evaluationLineStatus: target1?.evaluationLine.status,
            },
            {
              employeeId: employeeId2,
              evaluationLineStatus: target2?.evaluationLine.status,
            },
            {
              employeeId: employeeId3,
              evaluationLineStatus: target3?.evaluationLine.status,
            },
            {
              employeeId: employeeId4,
              evaluationLineStatus: target4?.evaluationLine.status,
            },
          ],
        },
      });
    });
  });
});
