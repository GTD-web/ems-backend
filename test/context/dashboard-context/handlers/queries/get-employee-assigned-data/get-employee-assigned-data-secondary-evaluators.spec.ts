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
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
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

/**
 * Dashboard Context - Secondary Evaluators 조회 테스트
 *
 * 할당 데이터 조회 시 2차 평가자별 상태가 제대로 반환되는지 검증합니다.
 */
describe('Dashboard Context - Secondary Evaluators', () => {
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
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let secondaryEvaluator1Id: string;
  let secondaryEvaluator2Id: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let secondaryEvaluationLineId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

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
    wbsAssignmentRepository = dataSource.getRepository(
      EvaluationWbsAssignment,
    );
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );
    downwardEvaluationRepository = dataSource.getRepository(
      DownwardEvaluation,
    );

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
      await downwardEvaluationRepository
        .createQueryBuilder()
        .delete()
        .execute();
      await evaluationLineMappingRepository
        .createQueryBuilder()
        .delete()
        .execute();
      await evaluationLineRepository.createQueryBuilder().delete().execute();
      await wbsAssignmentRepository.createQueryBuilder().delete().execute();
      await projectAssignmentRepository
        .createQueryBuilder()
        .delete()
        .execute();
      await mappingRepository.createQueryBuilder().delete().execute();
      await evaluationPeriodRepository
        .createQueryBuilder()
        .delete()
        .execute();
      await employeeRepository.createQueryBuilder().delete().execute();
      await projectRepository.createQueryBuilder().delete().execute();
      await wbsItemRepository.createQueryBuilder().delete().execute();
      await departmentRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트데이터를_생성한다(): Promise<void> {
    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '개발팀',
      code: 'DEV001',
      externalId: `DEPT-${Date.now()}-${Math.random()}`,
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: `평가기간-${Date.now()}-${Math.random()}`,
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
    const savedPeriod =
      await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 피평가자 직원 생성
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: `EMP-${Date.now()}-${Math.random()}`,
      email: 'evaluatee@example.com',
      departmentId: departmentId,
      externalId: `EXT-${Date.now()}-${Math.random()}`,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 2차 평가자 1 생성
    const secondaryEvaluator1 = employeeRepository.create({
      name: '이평가자1',
      employeeNumber: `EVAL1-${Date.now()}-${Math.random()}`,
      email: 'evaluator1@example.com',
      departmentId: departmentId,
      externalId: `EXT-EVAL1-${Date.now()}-${Math.random()}`,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator1 = await employeeRepository.save(secondaryEvaluator1);
    secondaryEvaluator1Id = savedEvaluator1.id;

    // 5. 2차 평가자 2 생성
    const secondaryEvaluator2 = employeeRepository.create({
      name: '박평가자2',
      employeeNumber: `EVAL2-${Date.now()}-${Math.random()}`,
      email: 'evaluator2@example.com',
      departmentId: departmentId,
      externalId: `EXT-EVAL2-${Date.now()}-${Math.random()}`,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator2 = await employeeRepository.save(secondaryEvaluator2);
    secondaryEvaluator2Id = savedEvaluator2.id;

    // 6. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping);

    // 7. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      code: `PROJ-${Date.now()}-${Math.random()}`,
      status: ProjectStatus.IN_PROGRESS,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 8. 프로젝트 배정
    const projectAssignment = projectAssignmentRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      periodId: evaluationPeriodId,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment);

    // 9. WBS 항목 1 생성
    const wbsItem1 = wbsItemRepository.create({
      title: 'WBS 항목 1',
      wbsCode: `WBS1-${Date.now()}-${Math.random()}`,
      projectId: projectId,
      createdBy: systemAdminId,
    });
    const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);
    wbsItemId1 = savedWbsItem1.id;

    // 10. WBS 항목 2 생성
    const wbsItem2 = wbsItemRepository.create({
      title: 'WBS 항목 2',
      wbsCode: `WBS2-${Date.now()}-${Math.random()}`,
      projectId: projectId,
      createdBy: systemAdminId,
    });
    const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);
    wbsItemId2 = savedWbsItem2.id;

    // 11. WBS 배정
    const wbsAssignment1 = wbsAssignmentRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      periodId: evaluationPeriodId,
      weight: 50,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment1);

    const wbsAssignment2 = wbsAssignmentRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId2,
      periodId: evaluationPeriodId,
      weight: 50,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment2);

    // 12. 2차 평가라인 생성
    const secondaryEvaluationLine = evaluationLineRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine =
      await evaluationLineRepository.save(secondaryEvaluationLine);
    secondaryEvaluationLineId = savedSecondaryLine.id;

    // 13. 평가라인 매핑 생성
    // 평가자 1: WBS 1, 2 모두 할당
    const mapping1_1 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(mapping1_1);

    const mapping1_2 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId2,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(mapping1_2);

    // 평가자 2: WBS 1만 할당
    const mapping2_1 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator2Id,
      evaluationLineId: secondaryEvaluationLineId,
      wbsItemId: wbsItemId1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(mapping2_1);
  }

  it('2차 평가자가 여러 명일 때 각 평가자별 정보가 제대로 반환되어야 한다', async () => {
    // Given: 테스트 데이터 생성
    await 테스트데이터를_생성한다();

    // When: 할당 데이터 조회
    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    // Then: 2차 평가자별 정보가 제대로 반환되어야 함
    expect(result.summary.secondaryDownwardEvaluation).toBeDefined();
    expect(result.summary.secondaryDownwardEvaluation.evaluators).toBeDefined();
    expect(result.summary.secondaryDownwardEvaluation.evaluators.length).toBe(
      2,
    );

    // 평가자 1 검증
    const evaluator1 = result.summary.secondaryDownwardEvaluation.evaluators.find(
      (e) => e.evaluatorId === secondaryEvaluator1Id,
    );
    expect(evaluator1).toBeDefined();
    expect(evaluator1!.evaluatorName).toBe('이평가자1');
    expect(evaluator1!.assignedWbsCount).toBe(2); // WBS 1, 2 모두 할당
    expect(evaluator1!.completedEvaluationCount).toBe(0); // 아직 제출 안 함
    expect(evaluator1!.isSubmitted).toBe(false);

    // 평가자 2 검증
    const evaluator2 = result.summary.secondaryDownwardEvaluation.evaluators.find(
      (e) => e.evaluatorId === secondaryEvaluator2Id,
    );
    expect(evaluator2).toBeDefined();
    expect(evaluator2!.evaluatorName).toBe('박평가자2');
    expect(evaluator2!.assignedWbsCount).toBe(1); // WBS 1만 할당
    expect(evaluator2!.completedEvaluationCount).toBe(0); // 아직 제출 안 함
    expect(evaluator2!.isSubmitted).toBe(false);

    // 전체 제출 상태 검증
    expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(
      false,
    );
  });

  it('2차 평가자가 일부만 제출했을 때 각 평가자별 상태가 제대로 반환되어야 한다', async () => {
    // Given: 테스트 데이터 생성
    await 테스트데이터를_생성한다();

    // 평가자 1이 WBS 1에 대한 평가만 제출
    const downwardEvaluation1 = downwardEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      wbsId: wbsItemId1,
      evaluationType: DownwardEvaluationType.SECONDARY,
      evaluationContent: '평가 내용 1',
      score: 80,
      isCompleted: true,
      createdBy: systemAdminId,
    });
    await downwardEvaluationRepository.save(downwardEvaluation1);

    // When: 할당 데이터 조회
    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    // Then: 각 평가자별 상태가 제대로 반환되어야 함
    const evaluator1 = result.summary.secondaryDownwardEvaluation.evaluators.find(
      (e) => e.evaluatorId === secondaryEvaluator1Id,
    );
    expect(evaluator1).toBeDefined();
    expect(evaluator1!.assignedWbsCount).toBe(2);
    expect(evaluator1!.completedEvaluationCount).toBe(1); // 1개만 제출
    expect(evaluator1!.isSubmitted).toBe(false); // 아직 모두 제출 안 함

    const evaluator2 = result.summary.secondaryDownwardEvaluation.evaluators.find(
      (e) => e.evaluatorId === secondaryEvaluator2Id,
    );
    expect(evaluator2).toBeDefined();
    expect(evaluator2!.assignedWbsCount).toBe(1);
    expect(evaluator2!.completedEvaluationCount).toBe(0); // 아직 제출 안 함
    expect(evaluator2!.isSubmitted).toBe(false);

    // 전체 제출 상태 검증
    expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(
      false,
    );
  });

  it('모든 2차 평가자가 모든 평가를 제출했을 때 각 평가자별 상태와 전체 상태가 제대로 반환되어야 한다', async () => {
    // Given: 테스트 데이터 생성
    await 테스트데이터를_생성한다();

    // 평가자 1이 모든 WBS에 대한 평가 제출
    const downwardEvaluation1_1 = downwardEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      wbsId: wbsItemId1,
      evaluationType: DownwardEvaluationType.SECONDARY,
      evaluationContent: '평가 내용 1-1',
      score: 80,
      isCompleted: true,
      createdBy: systemAdminId,
    });
    await downwardEvaluationRepository.save(downwardEvaluation1_1);

    const downwardEvaluation1_2 = downwardEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator1Id,
      wbsId: wbsItemId2,
      evaluationType: DownwardEvaluationType.SECONDARY,
      evaluationContent: '평가 내용 1-2',
      score: 85,
      isCompleted: true,
      createdBy: systemAdminId,
    });
    await downwardEvaluationRepository.save(downwardEvaluation1_2);

    // 평가자 2가 모든 WBS에 대한 평가 제출
    const downwardEvaluation2_1 = downwardEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: secondaryEvaluator2Id,
      wbsId: wbsItemId1,
      evaluationType: DownwardEvaluationType.SECONDARY,
      evaluationContent: '평가 내용 2-1',
      score: 90,
      isCompleted: true,
      createdBy: systemAdminId,
    });
    await downwardEvaluationRepository.save(downwardEvaluation2_1);

    // When: 할당 데이터 조회
    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    // Then: 각 평가자별 상태가 제대로 반환되어야 함
    const evaluator1 = result.summary.secondaryDownwardEvaluation.evaluators.find(
      (e) => e.evaluatorId === secondaryEvaluator1Id,
    );
    expect(evaluator1).toBeDefined();
    expect(evaluator1!.assignedWbsCount).toBe(2);
    expect(evaluator1!.completedEvaluationCount).toBe(2); // 모두 제출
    expect(evaluator1!.isSubmitted).toBe(true); // 모두 제출 완료

    const evaluator2 = result.summary.secondaryDownwardEvaluation.evaluators.find(
      (e) => e.evaluatorId === secondaryEvaluator2Id,
    );
    expect(evaluator2).toBeDefined();
    expect(evaluator2!.assignedWbsCount).toBe(1);
    expect(evaluator2!.completedEvaluationCount).toBe(1); // 모두 제출
    expect(evaluator2!.isSubmitted).toBe(true); // 모두 제출 완료

    // 전체 제출 상태 검증
    expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(true);
  });

  it('2차 평가자가 없을 때 빈 배열이 반환되어야 한다', async () => {
    // Given: 테스트 데이터 생성 (2차 평가자 없이)
    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '개발팀',
      code: 'DEV001',
      externalId: `DEPT-${Date.now()}-${Math.random()}`,
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: `평가기간-${Date.now()}-${Math.random()}`,
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
    const savedPeriod =
      await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 피평가자 직원 생성
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: `EMP-${Date.now()}-${Math.random()}`,
      email: 'evaluatee@example.com',
      departmentId: departmentId,
      externalId: `EXT-${Date.now()}-${Math.random()}`,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping);

    // When: 할당 데이터 조회
    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
    );
    const result = await handler.execute(query);

    // Then: 2차 평가자 배열이 비어있어야 함
    expect(result.summary.secondaryDownwardEvaluation).toBeDefined();
    expect(result.summary.secondaryDownwardEvaluation.evaluators).toBeDefined();
    expect(result.summary.secondaryDownwardEvaluation.evaluators.length).toBe(
      0,
    );
    expect(result.summary.secondaryDownwardEvaluation.isSubmitted).toBe(false);
  });
});

