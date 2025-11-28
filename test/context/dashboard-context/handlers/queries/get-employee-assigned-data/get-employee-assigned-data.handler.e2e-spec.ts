import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '@libs/database/database.module';
import { GetEmployeeAssignedDataHandler } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler';
import { GetEmployeeAssignedDataQuery } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
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
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 사용자 할당 정보 조회 핸들러 유닛 테스트
 *
 * 이 테스트는 DataSource를 통해 엔티티에 직접 데이터를 생성하고 조회하는 방식으로 작성되었습니다.
 * 실제 데이터베이스를 사용하여 핸들러의 동작을 검증합니다.
 */
describe('GetEmployeeAssignedDataHandler', () => {
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

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
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
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping);

    // 6. 프로젝트 생성 (managerId는 Employee의 externalId를 사용)
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      managerId: 'EXT002', // evaluator의 externalId
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
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);
    primaryEvaluationLineId = savedPrimaryLine.id;

    // 11. 평가라인 매핑 생성 (1차 평가자)
    const evaluationLineMapping = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      evaluationLineId: primaryEvaluationLineId,
      wbsItemId: undefined, // 직원별 고정 담당자
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(evaluationLineMapping);
  }

  describe('execute', () => {
    it('정상적으로 직원 할당 정보를 조회할 수 있어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(result.employee.id).toBe(employeeId);
      expect(result.employee.name).toBe('김피평가');
      expect(result.employee.employeeNumber).toBe('EMP001');
      expect(result.employee.departmentName).toBe('개발팀');
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBeGreaterThan(0);

      // 프로젝트 검증
      const project = result.projects[0];
      expect(project.projectId).toBe(projectId);
      expect(project.projectName).toBe('테스트 프로젝트');
      expect(Array.isArray(project.wbsList)).toBe(true);
      expect(project.wbsList.length).toBeGreaterThan(0);
      
      // 프로젝트 매니저 검증 (managerId가 설정된 경우)
      expect(project).toHaveProperty('projectManager');
      expect(project.projectManager).not.toBeNull();
      expect(project.projectManager).toBeDefined();
      if (project.projectManager) {
        // projectManager.id는 Employee의 externalId와 일치해야 함
        expect(project.projectManager.id).toBe('EXT002');
        expect(project.projectManager.name).toBe('이평가자');
      }

      // WBS 검증
      const wbs = project.wbsList[0];
      expect(wbs.wbsId).toBe(wbsItemId);
      expect(wbs.wbsName).toBe('테스트 WBS');
      expect(wbs.weight).toBe(100);

      // Summary 검증
      expect(result.summary.totalProjects).toBe(1);
      expect(result.summary.totalWbs).toBe(1);
    });

    it('primaryDownwardEvaluation이 정상적으로 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result.projects.length).toBeGreaterThan(0);
      const wbs = result.projects[0].wbsList[0];

      // primaryDownwardEvaluation 검증
      expect(wbs.primaryDownwardEvaluation).toBeDefined();
      expect(wbs.primaryDownwardEvaluation).not.toBeNull();
      expect(wbs.primaryDownwardEvaluation).toHaveProperty('evaluatorId');
      expect(wbs.primaryDownwardEvaluation).toHaveProperty('evaluatorName');
      expect(wbs.primaryDownwardEvaluation).toHaveProperty('isCompleted');

      // evaluatorId 검증
      expect(wbs.primaryDownwardEvaluation!.evaluatorId).toBe(evaluatorId);
      expect(typeof wbs.primaryDownwardEvaluation!.evaluatorId).toBe('string');

      // evaluatorName 검증
      expect(wbs.primaryDownwardEvaluation!.evaluatorName).toBe('이평가자');
      expect(typeof wbs.primaryDownwardEvaluation!.evaluatorName).toBe(
        'string',
      );

      // isCompleted 검증
      expect(typeof wbs.primaryDownwardEvaluation!.isCompleted).toBe('boolean');
      expect(wbs.primaryDownwardEvaluation!.isCompleted).toBe(false);

      // JSON 출력
      const jsonOutput = JSON.stringify(
        {
          wbsId: wbs.wbsId,
          wbsName: wbs.wbsName,
          primaryDownwardEvaluation: wbs.primaryDownwardEvaluation,
        },
        null,
        2,
      );
      process.stdout.write('\n📊 primaryDownwardEvaluation 유닛테스트 결과:\n');
      process.stdout.write(jsonOutput);
      process.stdout.write('\n\n');
    });

    it('하향평가가 완료된 경우 score와 submittedAt이 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 하향평가 완료 데이터 생성
      const downwardEvaluationRepository =
        dataSource.getRepository(DownwardEvaluation);

      const downwardEvaluation = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        wbsId: wbsItemId,
        periodId: evaluationPeriodId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        evaluationDate: new Date(),
        downwardEvaluationContent: '테스트 하향평가 내용',
        downwardEvaluationScore: 85,
        isCompleted: true,
        completedAt: new Date(),
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(downwardEvaluation);

      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );

      // When
      const result = await handler.execute(query);

      // Then
      const wbs = result.projects[0].wbsList[0];
      expect(wbs.primaryDownwardEvaluation).toBeDefined();
      expect(wbs.primaryDownwardEvaluation!.isCompleted).toBe(true);
      expect(wbs.primaryDownwardEvaluation!.score).toBe(85);
      expect(wbs.primaryDownwardEvaluation!.evaluationContent).toBe(
        '테스트 하향평가 내용',
      );
      expect(wbs.primaryDownwardEvaluation!.submittedAt).toBeDefined();
      expect(wbs.primaryDownwardEvaluation!.downwardEvaluationId).toBeDefined();
    });

    it('존재하지 않는 평가기간일 경우 NotFoundException을 던져야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const invalidPeriodId = '00000000-0000-0000-0000-000000000999';
      const query = new GetEmployeeAssignedDataQuery(
        invalidPeriodId,
        employeeId,
      );

      // When & Then
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        '평가기간을 찾을 수 없습니다',
      );
    });

    it('존재하지 않는 직원일 경우 NotFoundException을 던져야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();
      const invalidEmployeeId = '00000000-0000-0000-0000-000000000999';
      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        invalidEmployeeId,
      );

      // When & Then
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        '직원을 찾을 수 없습니다',
      );
    });

    it('평가기간에 등록되지 않은 직원일 경우 NotFoundException을 던져야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 다른 직원 생성
      const otherEmployee = employeeRepository.create({
        name: '박다른직원',
        employeeNumber: 'EMP003',
        email: 'other@test.com',
        externalId: 'EXT003',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedOtherEmployee = await employeeRepository.save(otherEmployee);

      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        savedOtherEmployee.id,
      );

      // When & Then
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        '평가기간에 등록되지 않은 직원입니다',
      );
    });

    it('프로젝트가 할당되지 않은 직원도 빈 배열로 반환되어야 한다', async () => {
      // Given
      // 평가기간, 직원, 매핑만 생성 (프로젝트 할당 없음)
      const department = departmentRepository.create({
        name: '개발팀',
        code: 'DEV002',
        externalId: 'DEPT002',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        createdBy: systemAdminId,
      });
      const savedDepartment = await departmentRepository.save(department);

      const evaluationPeriod = evaluationPeriodRepository.create({
        name: '2024년 하반기 평가',
        description: '프로젝트 없는 테스트',
        startDate: new Date('2024-07-01'),
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

      const employee = employeeRepository.create({
        name: '이프로젝트없음',
        employeeNumber: 'EMP004',
        email: 'noproject@test.com',
        externalId: 'EXT004',
        departmentId: savedDepartment.id,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedEmployee = await employeeRepository.save(employee);

      const mapping = mappingRepository.create({
        evaluationPeriodId: savedPeriod.id,
        employeeId: savedEmployee.id,
        createdBy: systemAdminId,
      });
      await mappingRepository.save(mapping);

      const query = new GetEmployeeAssignedDataQuery(
        savedPeriod.id,
        savedEmployee.id,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBe(0);
      expect(result.summary.totalProjects).toBe(0);
      expect(result.summary.totalWbs).toBe(0);
    });

    it('여러 프로젝트와 WBS가 할당된 경우 모두 반환되어야 한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 두 번째 프로젝트 생성
      const secondProject = projectRepository.create({
        name: '테스트 프로젝트 2',
        projectCode: 'PROJ002',
        status: ProjectStatus.ACTIVE,
        managerId: evaluatorId,
        createdBy: systemAdminId,
      });
      const savedProject2 = await projectRepository.save(secondProject);

      // 프로젝트 2 할당
      const projectAssignment2 = projectAssignmentRepository.create({
        employeeId: employeeId,
        periodId: evaluationPeriodId,
        projectId: savedProject2.id,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      });
      await projectAssignmentRepository.save(projectAssignment2);

      // 프로젝트 2의 WBS 아이템 생성
      const wbsItem2 = wbsItemRepository.create({
        title: '테스트 WBS 2',
        wbsCode: 'WBS002',
        projectId: savedProject2.id,
        createdBy: systemAdminId,
      });
      const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);

      // 프로젝트 2의 WBS 할당
      const wbsAssignment2 = wbsAssignmentRepository.create({
        employeeId: employeeId,
        periodId: evaluationPeriodId,
        projectId: savedProject2.id,
        wbsItemId: savedWbsItem2.id,
        weight: 50,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsAssignmentRepository.save(wbsAssignment2);

      // 프로젝트 1에 두 번째 WBS 추가
      const wbsItem3 = wbsItemRepository.create({
        title: '테스트 WBS 3',
        wbsCode: 'WBS003',
        projectId: projectId,
        createdBy: systemAdminId,
      });
      const savedWbsItem3 = await wbsItemRepository.save(wbsItem3);

      const wbsAssignment3 = wbsAssignmentRepository.create({
        employeeId: employeeId,
        periodId: evaluationPeriodId,
        projectId: projectId,
        wbsItemId: savedWbsItem3.id,
        weight: 30,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      });
      await wbsAssignmentRepository.save(wbsAssignment3);

      const query = new GetEmployeeAssignedDataQuery(
        evaluationPeriodId,
        employeeId,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result.projects.length).toBe(2);
      expect(result.summary.totalProjects).toBe(2);
      expect(result.summary.totalWbs).toBe(3); // 프로젝트 1에 WBS 2개, 프로젝트 2에 WBS 1개

      // 각 프로젝트의 WBS 개수 확인
      const firstProject = result.projects.find(
        (p) => p.projectId === projectId,
      );
      expect(firstProject).toBeDefined();
      expect(firstProject!.wbsList.length).toBe(2);

      const secondProjectResult = result.projects.find(
        (p) => p.projectId === savedProject2.id,
      );
      expect(secondProjectResult).toBeDefined();
      expect(secondProjectResult!.wbsList.length).toBe(1);
    });
  });
});
