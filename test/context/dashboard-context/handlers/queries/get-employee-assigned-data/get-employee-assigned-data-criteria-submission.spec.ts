import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseModule } from '@libs/database/database.module';
import { GetEmployeeAssignedDataHandler } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler';
import { GetEmployeeAssignedDataQuery } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectStatus } from '@domain/common/project/project.types';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

/**
 * Dashboard Context - 평가기준 제출 상태 검증 테스트
 *
 * GetEmployeeAssignedDataHandler의 summary.criteriaSubmission 필드가
 * 제대로 반환되는지 검증합니다.
 */
describe('GetEmployeeAssignedDataHandler - 평가기준 제출 상태 검증', () => {
  let handler: GetEmployeeAssignedDataHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let wbsCriteriaRepository: Repository<WbsEvaluationCriteria>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let evaluatorId: string;
  let departmentId: string;
  let mappingId: string;
  let projectId: string;
  let wbsItemId: string;
  let primaryEvaluationLineId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const submittedBy = 'test-submitter-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          Project,
          WbsItem,
          WbsEvaluationCriteria,
          WbsSelfEvaluation,
          DownwardEvaluation,
          EvaluationLine,
          EvaluationLineMapping,
          Deliverable,
        ]),
      ],
      providers: [GetEmployeeAssignedDataHandler],
    }).compile();

    handler = module.get<GetEmployeeAssignedDataHandler>(
      GetEmployeeAssignedDataHandler,
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
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );
    wbsCriteriaRepository = dataSource.getRepository(WbsEvaluationCriteria);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'get-employee-assigned-data-criteria-submission-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    await evaluationLineMappingRepository.clear();
    await evaluationLineRepository.clear();
    await wbsCriteriaRepository.clear();
    await wbsAssignmentRepository.clear();
    await projectAssignmentRepository.clear();
    await mappingRepository.clear();
    await evaluationPeriodRepository.clear();
    await employeeRepository.clear();
    await projectRepository.clear();
    await wbsItemRepository.clear();
    await departmentRepository.clear();
  });

  /**
   * 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트데이터를_생성한다(): Promise<void> {
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
    } as any);
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = (savedPeriod as unknown as EvaluationPeriod).id;

    // 3. 피평가자 직원 생성
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: 'EMP001',
      email: 'employee@test.com',
      externalId: 'EXT001',
      departmentId: departmentId,
      status: '재직중',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
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
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedEvaluator = await employeeRepository.save(evaluator);
    evaluatorId = savedEvaluator.id;

    // 5. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    } as any);
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping[0].id;

    // 6. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      managerId: evaluatorId,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 7. WBS 아이템 생성
    const wbsItem = wbsItemRepository.create({
      title: '테스트 WBS',
      wbsCode: 'WBS001',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem = await wbsItemRepository.save(wbsItem);
    wbsItemId = savedWbsItem.id;

    // 8. 프로젝트 할당
    const projectAssignment = projectAssignmentRepository.create({
      employeeId: employeeId,
      periodId: evaluationPeriodId,
      projectId: projectId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment);

    // 9. WBS 할당
    const wbsAssignment = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId,
      weight: 1.0,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment);

    // 10. 평가기준 설정
    const criteria = wbsCriteriaRepository.create({
      wbsItemId: wbsItemId,
      criteria: '테스트 평가기준',
      importance: 5,
      createdBy: systemAdminId,
    });
    await wbsCriteriaRepository.save(criteria);

    // 11. 평가라인 생성
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);
    primaryEvaluationLineId = savedPrimaryLine.id;

    // 12. 평가라인 매핑
    const lineMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationLineId: primaryEvaluationLineId,
      evaluatorId: evaluatorId,
      wbsItemId: null as any,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(lineMapping);
  }

  it('평가기준 미제출 상태 - summary.criteriaSubmission 필드가 올바르게 반환되어야 한다', async () => {
    await 테스트데이터를_생성한다();

    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.summary).toBeDefined();
    expect(result?.summary.criteriaSubmission).toBeDefined();
    expect(result?.summary.criteriaSubmission.isSubmitted).toBe(false);
    expect(result?.summary.criteriaSubmission.submittedAt).toBeNull();
    expect(result?.summary.criteriaSubmission.submittedBy).toBeNull();

    testResults.push({
      testName:
        '평가기준 미제출 상태 - summary.criteriaSubmission 필드가 올바르게 반환되어야 한다',
      result: {
        summary: {
          criteriaSubmission: result?.summary.criteriaSubmission,
        },
      },
    });
  });

  it('평가기준 제출 상태 - summary.criteriaSubmission 필드가 올바르게 반환되어야 한다', async () => {
    await 테스트데이터를_생성한다();

    // 평가기준 제출
    const mapping = await mappingRepository.findOne({
      where: { id: mappingId },
    });
    expect(mapping).toBeDefined();
    if (mapping) {
      mapping.평가기준을_제출한다(submittedBy);
      await mappingRepository.save(mapping);
    }

    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.summary).toBeDefined();
    expect(result?.summary.criteriaSubmission).toBeDefined();
    expect(result?.summary.criteriaSubmission.isSubmitted).toBe(true);
    expect(result?.summary.criteriaSubmission.submittedAt).toBeDefined();
    expect(result?.summary.criteriaSubmission.submittedAt).not.toBeNull();
    expect(result?.summary.criteriaSubmission.submittedBy).toBe(submittedBy);

    testResults.push({
      testName:
        '평가기준 제출 상태 - summary.criteriaSubmission 필드가 올바르게 반환되어야 한다',
      result: {
        summary: {
          criteriaSubmission: result?.summary.criteriaSubmission,
        },
      },
    });
  });

  it('평가기준 제출 후 초기화 - summary.criteriaSubmission 필드가 올바르게 반환되어야 한다', async () => {
    await 테스트데이터를_생성한다();

    // 평가기준 제출
    const mapping = await mappingRepository.findOne({
      where: { id: mappingId },
    });
    expect(mapping).toBeDefined();
    if (mapping) {
      mapping.평가기준을_제출한다(submittedBy);
      await mappingRepository.save(mapping);

      // 초기화
      mapping.평가기준_제출을_초기화한다('test-updater-id');
      await mappingRepository.save(mapping);
    }

    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.summary).toBeDefined();
    expect(result?.summary.criteriaSubmission).toBeDefined();
    expect(result?.summary.criteriaSubmission.isSubmitted).toBe(false);
    expect(result?.summary.criteriaSubmission.submittedAt).toBeNull();
    expect(result?.summary.criteriaSubmission.submittedBy).toBeNull();

    testResults.push({
      testName:
        '평가기준 제출 후 초기화 - summary.criteriaSubmission 필드가 올바르게 반환되어야 한다',
      result: {
        summary: {
          criteriaSubmission: result?.summary.criteriaSubmission,
        },
      },
    });
  });
});
