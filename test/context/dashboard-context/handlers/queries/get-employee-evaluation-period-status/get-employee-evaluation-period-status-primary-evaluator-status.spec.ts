import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dashboard Context - 1차 평가자 상태 검증 테스트
 *
 * 1차 평가자의 하향평가 통합 상태가 제대로 계산되어 반환되는지 검증합니다.
 * 5단계 상태를 모두 검증합니다:
 * 1. none - 평가할 WBS가 없거나 하향평가가 없음
 * 2. in_progress - 진행 중 (일부 완료)
 * 3. pending - 완료되었지만 승인 대기
 * 4. approved - 승인 완료
 * 5. revision_requested - 재작성 요청됨
 */
describe('GetEmployeeEvaluationPeriodStatusHandler - 1차 평가자 상태 검증', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let wbsCriteriaRepository: Repository<WbsEvaluationCriteria>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let mappingId: string;
  let adminId: string;
  let primaryEvaluatorId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let primaryLineId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    // 모듈 초기화
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        EmployeeEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EmployeeEvaluationStepApproval,
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
    stepApprovalRepository = dataSource.getRepository(
      EmployeeEvaluationStepApproval,
    );
    projectAssignmentRepository = dataSource.getRepository(
      EvaluationProjectAssignment,
    );
    wbsAssignmentRepository = dataSource.getRepository(EvaluationWbsAssignment);
    wbsCriteriaRepository = dataSource.getRepository(WbsEvaluationCriteria);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    revisionRequestRepository = dataSource.getRepository(
      EvaluationRevisionRequest,
    );
    revisionRequestRecipientRepository = dataSource.getRepository(
      EvaluationRevisionRequestRecipient,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    adminId = systemAdminId;
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'get-employee-evaluation-period-status-primary-evaluator-status-test-result.json',
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
      const revisionRequestRecipients =
        await revisionRequestRecipientRepository.find();
      await revisionRequestRecipientRepository.remove(
        revisionRequestRecipients,
      );

      const revisionRequests = await revisionRequestRepository.find();
      await revisionRequestRepository.remove(revisionRequests);

      const downwardEvaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(downwardEvaluations);

      const stepApprovals = await stepApprovalRepository.find();
      await stepApprovalRepository.remove(stepApprovals);

      const lineMappings = await evaluationLineMappingRepository.find();
      await evaluationLineMappingRepository.remove(lineMappings);

      const lines = await evaluationLineRepository.find();
      await evaluationLineRepository.remove(lines);

      const wbsCriteria = await wbsCriteriaRepository.find();
      await wbsCriteriaRepository.remove(wbsCriteria);

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

    // 3. 직원 생성 (피평가자)
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

    // 4. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 5. 평가자 생성 (1차)
    const primaryEvaluator = employeeRepository.create({
      name: '1차평가자',
      employeeNumber: 'EVA001',
      email: 'primary@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator =
      await employeeRepository.save(primaryEvaluator);
    primaryEvaluatorId = savedPrimaryEvaluator.id;

    // 6. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 7. 프로젝트 할당
    await projectAssignmentRepository.save(
      projectAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        projectId: projectId,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      }),
    );

    // 8. WBS 아이템 생성 및 할당
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

    // WBS 할당
    await wbsAssignmentRepository.save(
      wbsAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        projectId: projectId,
        wbsItemId: wbsItemId1,
        weight: 50,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      }),
    );

    await wbsAssignmentRepository.save(
      wbsAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        projectId: projectId,
        wbsItemId: wbsItemId2,
        weight: 50,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      }),
    );

    // 9. WBS 평가기준 설정
    await wbsCriteriaRepository.save(
      wbsCriteriaRepository.create({
        wbsItemId: wbsItemId1,
        criteria: '평가기준1',
        importance: 5,
        createdBy: systemAdminId,
      }),
    );

    await wbsCriteriaRepository.save(
      wbsCriteriaRepository.create({
        wbsItemId: wbsItemId2,
        criteria: '평가기준2',
        importance: 5,
        createdBy: systemAdminId,
      }),
    );

    // 10. 평가라인 생성 및 매핑
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);
    primaryLineId = savedPrimaryLine.id;

    // 1차 평가자 매핑
    await evaluationLineMappingRepository.save(
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: savedPrimaryLine.id,
        evaluatorId: primaryEvaluatorId,
        wbsItemId: null as any, // 1차 평가자는 WBS와 무관
        createdBy: systemAdminId,
      }),
    );
  }

  describe('1차 평가자 하향평가 통합 상태 검증', () => {
    it('상태 1: none - 평가할 WBS가 없으면 primary.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // WBS 할당 제거 (평가할 WBS가 없는 상태)
      await wbsAssignmentRepository.delete({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
      });

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe('none');
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(0);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 1: none - 평가할 WBS가 없으면 primary.status는 none이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
        },
      });
    });

    it('상태 2: none - 하향평가가 하나도 없으면 primary.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 하향평가 없음 (WBS는 할당되어 있음)

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe('none');
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(2);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 2: none - 하향평가가 하나도 없으면 primary.status는 none이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
        },
      });
    });

    it('상태 3: in_progress - 일부만 완료되었으면 primary.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 일부 완료 (1개만 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 두 번째 WBS는 평가하지 않음 (in_progress 상태)

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe('in_progress');
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(2);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        1,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 3: in_progress - 일부만 완료되었으면 primary.status는 in_progress이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
        },
      });
    });

    it('상태 4: pending - 모든 평가가 완료되었지만 승인 대기 중이면 primary.status는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
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
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (pending 상태 - 승인 대기)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe('pending');
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(2);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        2,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(result!.downwardEvaluation.primary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.primary.grade).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 4: pending - 모든 평가가 완료되었지만 승인 대기 중이면 primary.status는 pending이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
          totalScore: result!.downwardEvaluation.primary.totalScore,
          grade: result!.downwardEvaluation.primary.grade,
        },
      });
    });

    it('상태 5: approved - 모든 평가가 완료되고 승인되었으면 primary.status는 approved이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
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
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (approved 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.APPROVED,
          primaryEvaluationApprovedBy: adminId,
          primaryEvaluationApprovedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe('approved');
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(2);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        2,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(result!.downwardEvaluation.primary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.primary.grade).not.toBeNull();
      expect(result!.stepApproval.primaryEvaluationStatus).toBe('approved');
      expect(result!.stepApproval.primaryEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.primaryEvaluationApprovedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 5: approved - 모든 평가가 완료되고 승인되었으면 primary.status는 approved이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
          totalScore: result!.downwardEvaluation.primary.totalScore,
          grade: result!.downwardEvaluation.primary.grade,
          stepApprovalStatus: result!.stepApproval.primaryEvaluationStatus,
          approvedBy: result!.stepApproval.primaryEvaluationApprovedBy,
          approvedAt: result!.stepApproval.primaryEvaluationApprovedAt,
        },
      });
    });

    it('상태 6: revision_requested - 재작성 요청되었으면 primary.status는 revision_requested이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
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
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (revision_requested 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 생성
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'primary',
          comment: '재작성 필요',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 수신자 생성
      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest.id,
          recipientId: primaryEvaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe(
        'revision_requested',
      );
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(2);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        2,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(result!.downwardEvaluation.primary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.primary.grade).not.toBeNull();
      expect(result!.stepApproval.primaryEvaluationStatus).toBe(
        'revision_requested',
      );

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 6: revision_requested - 재작성 요청되었으면 primary.status는 revision_requested이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
          totalScore: result!.downwardEvaluation.primary.totalScore,
          grade: result!.downwardEvaluation.primary.grade,
          stepApprovalStatus: result!.stepApproval.primaryEvaluationStatus,
        },
      });
    });

    it('상태 7: revision_completed - 재작성 완료되었으면 primary.status는 revision_completed이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
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
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (revision_completed 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.REVISION_COMPLETED,
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 생성
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'primary',
          comment: '재작성 필요',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 수신자 생성 (완료됨)
      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest.id,
          recipientId: primaryEvaluatorId,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.primary.status).toBe(
        'revision_completed',
      );
      expect(result!.downwardEvaluation.primary.assignedWbsCount).toBe(2);
      expect(result!.downwardEvaluation.primary.completedEvaluationCount).toBe(
        2,
      );
      expect(result!.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(result!.downwardEvaluation.primary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.primary.grade).not.toBeNull();
      expect(result!.stepApproval.primaryEvaluationStatus).toBe(
        'revision_completed',
      );

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 7: revision_completed - 재작성 완료되었으면 primary.status는 revision_completed이어야 한다',
        result: {
          status: result!.downwardEvaluation.primary.status,
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
          totalScore: result!.downwardEvaluation.primary.totalScore,
          grade: result!.downwardEvaluation.primary.grade,
          stepApprovalStatus: result!.stepApproval.primaryEvaluationStatus,
        },
      });
    });

    it('상태 전환: in_progress → pending → approved 순서로 상태가 변경되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // Step 1: in_progress 상태 (일부만 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      let query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      let result = await handler.execute(query);

      expect(result!.downwardEvaluation.primary.status).toBe('in_progress');

      // Step 2: pending 상태 (모든 평가 완료, 승인 대기)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      result = await handler.execute(query);

      expect(result!.downwardEvaluation.primary.status).toBe('pending');

      // Step 3: approved 상태 (승인 완료)
      const stepApproval = await stepApprovalRepository.findOne({
        where: { evaluationPeriodEmployeeMappingId: mappingId },
      });
      if (stepApproval) {
        stepApproval.일차평가_확인한다(adminId);
        await stepApprovalRepository.save(stepApproval);
      }

      query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      result = await handler.execute(query);

      expect(result!.downwardEvaluation.primary.status).toBe('approved');
      expect(result!.stepApproval.primaryEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.primaryEvaluationApprovedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 전환: in_progress → pending → approved 순서로 상태가 변경되어야 한다',
        result: {
          finalStatus: result!.downwardEvaluation.primary.status,
          statusTransition: ['in_progress', 'pending', 'approved'],
          assignedWbsCount: result!.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            result!.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: result!.downwardEvaluation.primary.isSubmitted,
          totalScore: result!.downwardEvaluation.primary.totalScore,
          grade: result!.downwardEvaluation.primary.grade,
          stepApprovalStatus: result!.stepApproval.primaryEvaluationStatus,
          approvedBy: result!.stepApproval.primaryEvaluationApprovedBy,
          approvedAt: result!.stepApproval.primaryEvaluationApprovedAt,
        },
      });
    });
  });
});
