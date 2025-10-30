import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { DashboardService } from '@context/dashboard-context/dashboard.service';
import { QueryBus, CqrsModule } from '@nestjs/cqrs';
import { GetEmployeeEvaluationPeriodStatusHandler } from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/get-employee-evaluation-period-status.handler';
import { GetEmployeeAssignedDataHandler } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 직원의 평가 현황 및 할당 데이터 통합 조회 서비스 유닛 테스트
 *
 * 이 테스트는 DataSource를 통해 엔티티에 직접 데이터를 생성하고 조회하는 방식으로 작성되었습니다.
 * 실제 데이터베이스를 사용하여 DashboardService의 getEmployeeCompleteStatus 메서드 동작을 검증합니다.
 */
describe('DashboardService.getEmployeeCompleteStatus', () => {
  let service: DashboardService;
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
  let peerEvaluationRepository: Repository<PeerEvaluation>;
  let finalEvaluationRepository: Repository<FinalEvaluation>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let evaluatorId: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId: string;
  let primaryEvaluationLineId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
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
          PeerEvaluation,
          FinalEvaluation,
        ]),
      ],
      providers: [
        DashboardService,
        GetEmployeeEvaluationPeriodStatusHandler,
        GetEmployeeAssignedDataHandler,
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
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
    wbsAssignmentRepository = dataSource.getRepository(
      EvaluationWbsAssignment,
    );
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository =
      dataSource.getRepository(EvaluationLineMapping);
    peerEvaluationRepository = dataSource.getRepository(PeerEvaluation);
    finalEvaluationRepository = dataSource.getRepository(FinalEvaluation);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    await finalEvaluationRepository.clear();
    await peerEvaluationRepository.clear();
    await evaluationLineMappingRepository.clear();
    await evaluationLineRepository.clear();
    await dataSource.getRepository(DownwardEvaluation).clear();
    await dataSource.getRepository(WbsSelfEvaluation).clear();
    await dataSource.getRepository(WbsEvaluationCriteria).clear();
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

    // 5. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isSelfEvaluationEditable: true,
      isPrimaryEvaluationEditable: true,
      isSecondaryEvaluationEditable: true,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping);

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
      employeeId: employeeId,
      periodId: evaluationPeriodId,
      projectId: projectId,
      wbsItemId: wbsItemId,
      weight: 100,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment);

    // 10. 평가라인 생성 (1차)
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      version: 1,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine =
      await evaluationLineRepository.save(primaryLine);
    primaryEvaluationLineId = savedPrimaryLine.id;

    // 11. 평가라인 매핑 생성 (1차 평가자)
    const evaluationLineMapping = evaluationLineMappingRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      evaluationLineId: primaryEvaluationLineId,
      wbsItemId: undefined, // 직원별 고정 담당자
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(evaluationLineMapping);
  }

  describe('getEmployeeCompleteStatus', () => {
    it('정상적으로 직원의 평가 현황 및 할당 데이터를 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const statusData =
        await service.직원의_평가기간_현황을_조회한다(
          evaluationPeriodId,
          employeeId,
        );
      const assignedData = await service.사용자_할당_정보를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

      // Then - statusData 검증
      expect(statusData).toBeDefined();
      expect(statusData).not.toBeNull();
      expect(statusData!.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(statusData!.employee.id).toBe(employeeId);
      expect(statusData!.employee.name).toBe('김피평가');
      expect(statusData!.employee.employeeNumber).toBe('EMP001');
      expect(statusData!.isEvaluationTarget).toBe(true);

      // exclusionInfo 검증
      expect(statusData!.exclusionInfo).toBeDefined();
      expect(statusData!.exclusionInfo.isExcluded).toBe(false);

      // evaluationLine 검증
      expect(statusData!.evaluationLine).toBeDefined();
      expect(statusData!.evaluationLine.hasPrimaryEvaluator).toBe(true);
      expect(statusData!.evaluationLine.hasSecondaryEvaluator).toBe(false);
      expect(statusData!.evaluationLine.status).toBe('complete');

      // wbsCriteria 검증
      expect(statusData!.wbsCriteria).toBeDefined();
      expect(statusData!.wbsCriteria.status).toBeDefined();
      expect(typeof statusData!.wbsCriteria.totalWbsCount).toBe('number');
      expect(typeof statusData!.wbsCriteria.wbsWithCriteriaCount).toBe(
        'number',
      );

      // performanceInput 검증
      expect(statusData!.performanceInput).toBeDefined();
      expect(statusData!.performanceInput.status).toBeDefined();
      expect(typeof statusData!.performanceInput.totalWbsCount).toBe('number');
      expect(typeof statusData!.performanceInput.inputCompletedCount).toBe(
        'number',
      );

      // selfEvaluation 검증
      expect(statusData!.selfEvaluation).toBeDefined();
      expect(statusData!.selfEvaluation.status).toBeDefined();
      expect(typeof statusData!.selfEvaluation.totalMappingCount).toBe(
        'number',
      );
      expect(typeof statusData!.selfEvaluation.completedMappingCount).toBe(
        'number',
      );

      // downwardEvaluation 검증
      expect(statusData!.downwardEvaluation).toBeDefined();
      expect(statusData!.downwardEvaluation.primary).toBeDefined();
      expect(statusData!.downwardEvaluation.primary.status).toBeDefined();
      expect(
        typeof statusData!.downwardEvaluation.primary.assignedWbsCount,
      ).toBe('number');
      expect(
        typeof statusData!.downwardEvaluation.primary
          .completedEvaluationCount,
      ).toBe('number');

      // peerEvaluation 검증
      expect(statusData!.peerEvaluation).toBeDefined();
      expect(statusData!.peerEvaluation.status).toBeDefined();
      expect(typeof statusData!.peerEvaluation.totalRequestCount).toBe(
        'number',
      );
      expect(typeof statusData!.peerEvaluation.completedRequestCount).toBe(
        'number',
      );

      // finalEvaluation 검증
      expect(statusData!.finalEvaluation).toBeDefined();
      expect(statusData!.finalEvaluation.status).toBeDefined();

      // Then - assignedData 검증
      expect(assignedData).toBeDefined();
      expect(assignedData.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(assignedData.employee.id).toBe(employeeId);
      expect(assignedData.employee.name).toBe('김피평가');
      expect(assignedData.employee.employeeNumber).toBe('EMP001');
      expect(assignedData.employee.departmentName).toBe('개발팀');

      // projects 검증
      expect(Array.isArray(assignedData.projects)).toBe(true);
      expect(assignedData.projects.length).toBeGreaterThan(0);

      // 프로젝트 검증
      const project = assignedData.projects[0];
      expect(project.projectId).toBe(projectId);
      expect(project.projectName).toBe('테스트 프로젝트');
      expect(Array.isArray(project.wbsList)).toBe(true);
      expect(project.wbsList.length).toBeGreaterThan(0);

      // WBS 검증
      const wbs = project.wbsList[0];
      expect(wbs.wbsId).toBe(wbsItemId);
      expect(wbs.wbsName).toBe('테스트 WBS');
      expect(wbs.weight).toBe(100);

      // primaryDownwardEvaluation 검증
      expect(wbs.primaryDownwardEvaluation).toBeDefined();
      expect(wbs.primaryDownwardEvaluation).not.toBeNull();
      expect(wbs.primaryDownwardEvaluation!.evaluatorId).toBe(evaluatorId);
      expect(wbs.primaryDownwardEvaluation!.evaluatorName).toBe('이평가자');
      expect(wbs.primaryDownwardEvaluation!.isCompleted).toBe(false);
      expect(wbs.primaryDownwardEvaluation!.isEditable).toBe(true);

      // editableStatus 검증
      expect(assignedData.editableStatus).toBeDefined();
      expect(assignedData.editableStatus.isSelfEvaluationEditable).toBe(
        true,
      );
      expect(assignedData.editableStatus.isPrimaryEvaluationEditable).toBe(
        true,
      );
      expect(assignedData.editableStatus.isSecondaryEvaluationEditable).toBe(
        true,
      );

      // summary 검증
      expect(assignedData.summary).toBeDefined();
      expect(assignedData.summary.totalProjects).toBe(1);
      expect(assignedData.summary.totalWbs).toBe(1);

      // JSON 출력
      const jsonOutput = JSON.stringify(
        {
          evaluationPeriod: {
            id: statusData!.evaluationPeriod.id,
            name: statusData!.evaluationPeriod.name,
          },
          employee: {
            id: statusData!.employee.id,
            name: statusData!.employee.name,
            employeeNumber: statusData!.employee.employeeNumber,
          },
          isEvaluationTarget: statusData!.isEvaluationTarget,
          exclusionInfo: statusData!.exclusionInfo,
          evaluationLine: {
            status: statusData!.evaluationLine.status,
            hasPrimaryEvaluator:
              statusData!.evaluationLine.hasPrimaryEvaluator,
            hasSecondaryEvaluator:
              statusData!.evaluationLine.hasSecondaryEvaluator,
          },
          wbsCriteria: statusData!.wbsCriteria,
          performance: {
            status: statusData!.performanceInput.status,
            totalWbsCount: statusData!.performanceInput.totalWbsCount,
            completedCount:
              statusData!.performanceInput.inputCompletedCount,
          },
          selfEvaluation: {
            status: statusData!.selfEvaluation.status,
            totalCount: statusData!.selfEvaluation.totalMappingCount,
            completedCount:
              statusData!.selfEvaluation.completedMappingCount,
            totalScore: statusData!.selfEvaluation.totalScore,
            grade: statusData!.selfEvaluation.grade,
          },
          primaryDownwardEvaluation: {
            status: statusData!.downwardEvaluation.primary.status,
            totalWbsCount:
              statusData!.downwardEvaluation.primary.assignedWbsCount,
            completedCount:
              statusData!.downwardEvaluation.primary
                .completedEvaluationCount,
            totalScore: statusData!.downwardEvaluation.primary.totalScore,
            grade: statusData!.downwardEvaluation.primary.grade,
          },
          peerEvaluation: statusData!.peerEvaluation,
          finalEvaluation: statusData!.finalEvaluation,
          projects: {
            totalCount: assignedData.summary.totalProjects,
            items: assignedData.projects.map((p) => ({
              projectId: p.projectId,
              projectName: p.projectName,
              wbsList: p.wbsList.map((w) => ({
                wbsId: w.wbsId,
                wbsName: w.wbsName,
                primaryDownwardEvaluation: w.primaryDownwardEvaluation,
              })),
            })),
          },
        },
        null,
        2,
      );
      process.stdout.write(
        '\n📊 getEmployeeCompleteStatus 유닛테스트 결과:\n',
      );
      process.stdout.write(jsonOutput);
      process.stdout.write('\n\n');
    });

    it('모든 필드의 타입이 올바른지 확인한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // When
      const statusData =
        await service.직원의_평가기간_현황을_조회한다(
          evaluationPeriodId,
          employeeId,
        );
      const assignedData = await service.사용자_할당_정보를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

      // Then - evaluationPeriod 타입 검증
      expect(typeof statusData!.evaluationPeriod.id).toBe('string');
      expect(typeof statusData!.evaluationPeriod.name).toBe('string');
      expect(statusData!.evaluationPeriod.startDate).toBeInstanceOf(Date);
      expect(typeof statusData!.evaluationPeriod.status).toBe('string');
      expect(typeof statusData!.evaluationPeriod.criteriaSettingEnabled).toBe(
        'boolean',
      );

      // Then - employee 타입 검증
      expect(typeof statusData!.employee.id).toBe('string');
      expect(typeof statusData!.employee.name).toBe('string');
      expect(typeof statusData!.employee.employeeNumber).toBe('string');
      expect(typeof statusData!.employee.email).toBe('string');

      // Then - isEvaluationTarget 타입 검증
      expect(typeof statusData!.isEvaluationTarget).toBe('boolean');

      // Then - exclusionInfo 타입 검증
      expect(typeof statusData!.exclusionInfo.isExcluded).toBe('boolean');

      // Then - evaluationLine 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.evaluationLine.status,
      );
      expect(typeof statusData!.evaluationLine.hasPrimaryEvaluator).toBe(
        'boolean',
      );
      expect(typeof statusData!.evaluationLine.hasSecondaryEvaluator).toBe(
        'boolean',
      );

      // Then - wbsCriteria 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.wbsCriteria.status,
      );
      expect(typeof statusData!.wbsCriteria.totalWbsCount).toBe('number');
      expect(typeof statusData!.wbsCriteria.wbsWithCriteriaCount).toBe(
        'number',
      );

      // Then - performanceInput 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.performanceInput.status,
      );
      expect(typeof statusData!.performanceInput.totalWbsCount).toBe('number');
      expect(typeof statusData!.performanceInput.inputCompletedCount).toBe(
        'number',
      );

      // Then - selfEvaluation 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.selfEvaluation.status,
      );
      expect(typeof statusData!.selfEvaluation.totalMappingCount).toBe(
        'number',
      );
      expect(typeof statusData!.selfEvaluation.completedMappingCount).toBe(
        'number',
      );

      // Then - downwardEvaluation 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.downwardEvaluation.primary.status,
      );
      expect(
        typeof statusData!.downwardEvaluation.primary.assignedWbsCount,
      ).toBe('number');
      expect(
        typeof statusData!.downwardEvaluation.primary
          .completedEvaluationCount,
      ).toBe('number');

      // Then - peerEvaluation 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.peerEvaluation.status,
      );
      expect(typeof statusData!.peerEvaluation.totalRequestCount).toBe(
        'number',
      );
      expect(typeof statusData!.peerEvaluation.completedRequestCount).toBe(
        'number',
      );

      // Then - finalEvaluation 타입 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        statusData!.finalEvaluation.status,
      );

      // Then - assignedData 타입 검증
      expect(typeof assignedData.evaluationPeriod.id).toBe('string');
      expect(typeof assignedData.employee.id).toBe('string');
      expect(typeof assignedData.employee.name).toBe('string');
      expect(Array.isArray(assignedData.projects)).toBe(true);

      // Then - projects 타입 검증
      const project = assignedData.projects[0];
      expect(typeof project.projectId).toBe('string');
      expect(typeof project.projectName).toBe('string');
      expect(Array.isArray(project.wbsList)).toBe(true);

      // Then - wbs 타입 검증
      const wbs = project.wbsList[0];
      expect(typeof wbs.wbsId).toBe('string');
      expect(typeof wbs.wbsName).toBe('string');
      expect(typeof wbs.weight).toBe('number');

      // Then - primaryDownwardEvaluation 타입 검증
      expect(typeof wbs.primaryDownwardEvaluation!.evaluatorId).toBe(
        'string',
      );
      expect(typeof wbs.primaryDownwardEvaluation!.evaluatorName).toBe(
        'string',
      );
      expect(typeof wbs.primaryDownwardEvaluation!.isCompleted).toBe(
        'boolean',
      );
      expect(typeof wbs.primaryDownwardEvaluation!.isEditable).toBe(
        'boolean',
      );

      // Then - editableStatus 타입 검증
      expect(typeof assignedData.editableStatus.isSelfEvaluationEditable).toBe(
        'boolean',
      );
      expect(typeof assignedData.editableStatus.isPrimaryEvaluationEditable).toBe(
        'boolean',
      );
      expect(typeof assignedData.editableStatus.isSecondaryEvaluationEditable).toBe(
        'boolean',
      );

      // Then - summary 타입 검증
      expect(typeof assignedData.summary.totalProjects).toBe('number');
      expect(typeof assignedData.summary.totalWbs).toBe('number');
    });

    it('존재하지 않는 평가기간으로 조회 시 null을 반환해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const nonExistentPeriodId = '123e4567-e89b-12d3-a456-426614174999';

      // When
      const statusData = await service.직원의_평가기간_현황을_조회한다(
        nonExistentPeriodId,
        employeeId,
      );
      const assignedData = await service.사용자_할당_정보를_조회한다(
        nonExistentPeriodId,
        employeeId,
      );

      // Then
      expect(statusData).toBeNull();
      expect(assignedData.projects.length).toBe(0);
    });

    it('존재하지 않는 직원으로 조회 시 null을 반환해야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const nonExistentEmployeeId = '123e4567-e89b-12d3-a456-426614174999';

      // When
      const statusData = await service.직원의_평가기간_현황을_조회한다(
        evaluationPeriodId,
        nonExistentEmployeeId,
      );
      const assignedData = await service.사용자_할당_정보를_조회한다(
        evaluationPeriodId,
        nonExistentEmployeeId,
      );

      // Then
      expect(statusData).toBeNull();
      expect(assignedData.projects.length).toBe(0);
    });
  });
});

