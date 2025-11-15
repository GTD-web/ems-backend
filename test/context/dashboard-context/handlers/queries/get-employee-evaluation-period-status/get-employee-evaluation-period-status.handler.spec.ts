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
 * Dashboard Context - 직원 평가기간 현황 조회 통합 테스트
 *
 * GetEmployeeEvaluationPeriodStatusHandler의 모든 기능을 검증합니다:
 * - 기본 조회 기능
 * - 평가기간/직원 정보
 * - 평가항목 설정 상태
 * - WBS 평가기준 상태
 * - 평가라인 지정 상태
 * - 성과 입력 상태
 * - 자기평가 상태 (isSubmittedToManager 포함)
 * - 하향평가 상태
 * - 동료평가 상태
 * - 최종평가 상태
 * - 단계별 승인 상태
 */
describe('GetEmployeeEvaluationPeriodStatusHandler - 통합 테스트', () => {
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
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let peerEvaluationRepository: Repository<PeerEvaluation>;
  let finalEvaluationRepository: Repository<FinalEvaluation>;
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
  let secondaryEvaluatorId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;
  let primaryLineId: string;
  let secondaryLineId: string;

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
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    peerEvaluationRepository = dataSource.getRepository(PeerEvaluation);
    finalEvaluationRepository = dataSource.getRepository(FinalEvaluation);
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
      'get-employee-evaluation-period-status-test-result.json',
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

      const finalEvaluations = await finalEvaluationRepository.find();
      await finalEvaluationRepository.remove(finalEvaluations);

      const peerEvaluations = await peerEvaluationRepository.find();
      await peerEvaluationRepository.remove(peerEvaluations);

      const downwardEvaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(downwardEvaluations);

      const wbsSelfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(wbsSelfEvaluations);

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

    // 6. 평가자 생성 (2차)
    const secondaryEvaluator = employeeRepository.create({
      name: '2차평가자',
      employeeNumber: 'EVA002',
      email: 'secondary@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator =
      await employeeRepository.save(secondaryEvaluator);
    secondaryEvaluatorId = savedSecondaryEvaluator.id;

    // 7. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 8. 프로젝트 할당
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

    // 9. WBS 아이템 생성 및 할당
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

    // WBS 할당
    await wbsAssignmentRepository.save([
      wbsAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        projectId: projectId,
        wbsItemId: wbsItemId1,
        weight: 0.3,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      }),
      wbsAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        projectId: projectId,
        wbsItemId: wbsItemId2,
        weight: 0.4,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      }),
      wbsAssignmentRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        projectId: projectId,
        wbsItemId: wbsItemId3,
        weight: 0.3,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        createdBy: systemAdminId,
      }),
    ]);

    // 10. 평가기준 설정
    await wbsCriteriaRepository.save([
      wbsCriteriaRepository.create({
        wbsItemId: wbsItemId1,
        criteria: '기준 1',
        importance: 5,
        createdBy: systemAdminId,
      }),
      wbsCriteriaRepository.create({
        wbsItemId: wbsItemId2,
        criteria: '기준 2',
        importance: 5,
        createdBy: systemAdminId,
      }),
      wbsCriteriaRepository.create({
        wbsItemId: wbsItemId3,
        criteria: '기준 3',
        importance: 5,
        createdBy: systemAdminId,
      }),
    ]);

    // 11. 평가라인 생성
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);
    primaryLineId = savedPrimaryLine.id;

    const secondaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine =
      await evaluationLineRepository.save(secondaryLine);
    secondaryLineId = savedSecondaryLine.id;

    // 12. 평가라인 매핑
    // 1차 평가자 매핑 (WBS와 무관)
    await evaluationLineMappingRepository.save(
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: primaryLineId,
        evaluatorId: primaryEvaluatorId,
        wbsItemId: null as any, // 1차 평가자는 WBS와 무관
        createdBy: systemAdminId,
      }),
    );

    // 2차 평가자 매핑 (WBS별)
    await evaluationLineMappingRepository.save([
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId,
        evaluationLineId: secondaryLineId,
        wbsItemId: wbsItemId1,
        createdBy: systemAdminId,
      }),
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId,
        evaluationLineId: secondaryLineId,
        wbsItemId: wbsItemId2,
        createdBy: systemAdminId,
      }),
    ]);
  }

  describe('execute', () => {
    it('기본 조회 - 모든 필드가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result?.mappingId).toBe(mappingId);
      expect(result?.employeeId).toBe(employeeId);
      expect(result?.isEvaluationTarget).toBe(true);
      expect(result?.evaluationPeriod).not.toBeNull();
      expect(result?.evaluationPeriod?.id).toBe(evaluationPeriodId);
      expect(result?.employee).not.toBeNull();
      expect(result?.employee?.id).toBe(employeeId);
      expect(result?.employee?.name).toBe('김피평가');
      expect(result?.exclusionInfo).not.toBeNull();
      expect(result?.exclusionInfo.isExcluded).toBe(false);

      // 평가항목 설정 정보
      expect(result?.evaluationCriteria).not.toBeNull();
      expect(result?.evaluationCriteria.assignedProjectCount).toBe(1);
      expect(result?.evaluationCriteria.assignedWbsCount).toBe(3);

      // WBS 평가기준 상태
      expect(result?.wbsCriteria).not.toBeNull();
      expect(result?.wbsCriteria.wbsWithCriteriaCount).toBe(3);

      // 평가라인 지정 정보
      expect(result?.evaluationLine).not.toBeNull();
      expect(result?.evaluationLine.hasPrimaryEvaluator).toBe(true);
      expect(result?.evaluationLine.hasSecondaryEvaluator).toBe(true);

      // 성과 입력 정보
      expect(result?.performanceInput).not.toBeNull();

      // 자기평가 정보
      expect(result?.selfEvaluation).not.toBeNull();
      expect(result?.selfEvaluation.totalMappingCount).toBe(0);
      expect(result?.selfEvaluation.completedMappingCount).toBe(0);
      expect(result?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(result?.selfEvaluation.isSubmittedToManager).toBe(false);

      // 하향평가 정보
      expect(result?.downwardEvaluation).not.toBeNull();
      expect(result?.downwardEvaluation.primary).not.toBeNull();
      expect(result?.downwardEvaluation.primary.evaluator).not.toBeNull();
      expect(result?.downwardEvaluation.primary.evaluator?.id).toBe(
        primaryEvaluatorId,
      );
      expect(result?.downwardEvaluation.secondary).not.toBeNull();
      expect(result?.downwardEvaluation.secondary.evaluators.length).toBe(1);

      // 동료평가 정보
      expect(result?.peerEvaluation).not.toBeNull();
      expect(result?.peerEvaluation.totalRequestCount).toBe(0);

      // 최종평가 정보
      expect(result?.finalEvaluation).not.toBeNull();
      expect(result?.finalEvaluation.status).toBe('none');

      // 단계별 승인 상태
      expect(result?.stepApproval).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '기본 조회 - 모든 필드가 올바르게 반환되어야 한다',
        result: {
          mappingId: result?.mappingId,
          employeeId: result?.employeeId,
          isEvaluationTarget: result?.isEvaluationTarget,
          evaluationPeriod: {
            id: result?.evaluationPeriod?.id,
            name: result?.evaluationPeriod?.name,
          },
          employee: {
            id: result?.employee?.id,
            name: result?.employee?.name,
          },
          evaluationCriteria: {
            status: result?.evaluationCriteria.status,
            assignedProjectCount:
              result?.evaluationCriteria.assignedProjectCount,
            assignedWbsCount: result?.evaluationCriteria.assignedWbsCount,
          },
          wbsCriteria: {
            status: result?.wbsCriteria.status,
            wbsWithCriteriaCount: result?.wbsCriteria.wbsWithCriteriaCount,
          },
          evaluationLine: {
            status: result?.evaluationLine.status,
            hasPrimaryEvaluator: result?.evaluationLine.hasPrimaryEvaluator,
            hasSecondaryEvaluator: result?.evaluationLine.hasSecondaryEvaluator,
          },
          selfEvaluation: {
            status: result?.selfEvaluation.status,
            totalMappingCount: result?.selfEvaluation.totalMappingCount,
            completedMappingCount: result?.selfEvaluation.completedMappingCount,
            isSubmittedToEvaluator:
              result?.selfEvaluation.isSubmittedToEvaluator,
            isSubmittedToManager: result?.selfEvaluation.isSubmittedToManager,
          },
          downwardEvaluation: {
            primary: {
              evaluatorId: result?.downwardEvaluation.primary.evaluator?.id,
              status: result?.downwardEvaluation.primary.status,
              assignedWbsCount:
                result?.downwardEvaluation.primary.assignedWbsCount,
            },
            secondary: {
              evaluatorsCount:
                result?.downwardEvaluation.secondary.evaluators.length,
            },
          },
        },
      });
    });

    it('자기평가 상태 - isSubmittedToManager 필드가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 자기평가 생성 (1차 평가자에게 제출)
      const selfEval1 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        selfEvaluationScore: 85,
        submittedToEvaluator: true,
        submittedToEvaluatorAt: new Date(),
        submittedToManager: false,
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEval1);

      const selfEval2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId2,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        selfEvaluationScore: 90,
        submittedToEvaluator: true,
        submittedToEvaluatorAt: new Date(),
        submittedToManager: true,
        submittedToManagerAt: new Date(),
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(selfEval2);

      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result?.selfEvaluation.totalMappingCount).toBe(2);
      expect(result?.selfEvaluation.completedMappingCount).toBe(1); // submittedToManager가 true인 것만
      expect(result?.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 모두 제출됨
      expect(result?.selfEvaluation.isSubmittedToManager).toBe(false); // 일부만 제출됨

      // 테스트 결과 저장
      testResults.push({
        testName:
          '자기평가 상태 - isSubmittedToManager 필드가 올바르게 반환되어야 한다',
        result: {
          selfEvaluation: {
            totalMappingCount: result?.selfEvaluation.totalMappingCount,
            completedMappingCount: result?.selfEvaluation.completedMappingCount,
            isSubmittedToEvaluator:
              result?.selfEvaluation.isSubmittedToEvaluator,
            isSubmittedToManager: result?.selfEvaluation.isSubmittedToManager,
            totalScore: result?.selfEvaluation.totalScore,
            grade: result?.selfEvaluation.grade,
          },
        },
      });
    });

    it('자기평가 전체 제출 - 모든 자기평가가 관리자에게 제출된 경우 isSubmittedToManager가 true여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 자기평가를 관리자에게 제출
      await wbsSelfEvaluationRepository.save([
        wbsSelfEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItemId1,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 85,
          submittedToEvaluator: true,
          submittedToEvaluatorAt: new Date(),
          submittedToManager: true,
          submittedToManagerAt: new Date(),
          createdBy: systemAdminId,
        }),
        wbsSelfEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItemId2,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 90,
          submittedToEvaluator: true,
          submittedToEvaluatorAt: new Date(),
          submittedToManager: true,
          submittedToManagerAt: new Date(),
          createdBy: systemAdminId,
        }),
        wbsSelfEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItemId3,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 95,
          submittedToEvaluator: true,
          submittedToEvaluatorAt: new Date(),
          submittedToManager: true,
          submittedToManagerAt: new Date(),
          createdBy: systemAdminId,
        }),
      ]);

      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result?.selfEvaluation.totalMappingCount).toBe(3);
      expect(result?.selfEvaluation.completedMappingCount).toBe(3);
      expect(result?.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(result?.selfEvaluation.isSubmittedToManager).toBe(true); // 모두 제출됨
      expect(result?.selfEvaluation.totalScore).not.toBeNull();
      expect(result?.selfEvaluation.grade).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '자기평가 전체 제출 - 모든 자기평가가 관리자에게 제출된 경우 isSubmittedToManager가 true여야 한다',
        result: {
          selfEvaluation: {
            totalMappingCount: result?.selfEvaluation.totalMappingCount,
            completedMappingCount: result?.selfEvaluation.completedMappingCount,
            isSubmittedToEvaluator:
              result?.selfEvaluation.isSubmittedToEvaluator,
            isSubmittedToManager: result?.selfEvaluation.isSubmittedToManager,
            totalScore: result?.selfEvaluation.totalScore,
            grade: result?.selfEvaluation.grade,
          },
        },
      });
    });

    it('하향평가 상태 - 1차 및 2차 하향평가 상태가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 생성
      const primaryEval1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationScore: 80,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(primaryEval1);

      const primaryEval2 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: primaryEvaluatorId,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationScore: 85,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(primaryEval2);

      // 2차 하향평가 생성
      const secondaryEval1 = downwardEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: secondaryEvaluatorId,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationScore: 90,
        evaluationDate: new Date(),
        isCompleted: true,
        createdBy: systemAdminId,
      });
      await downwardEvaluationRepository.save(secondaryEval1);

      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result?.downwardEvaluation.primary.assignedWbsCount).toBe(3);
      expect(result?.downwardEvaluation.primary.completedEvaluationCount).toBe(
        2,
      );
      expect(result?.downwardEvaluation.primary.isSubmitted).toBe(false); // 일부만 완료
      expect(
        result?.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(3); // 모든 WBS가 할당되어 있음
      expect(
        result?.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(1);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '하향평가 상태 - 1차 및 2차 하향평가 상태가 올바르게 반환되어야 한다',
        result: {
          downwardEvaluation: {
            primary: {
              status: result?.downwardEvaluation.primary.status,
              assignedWbsCount:
                result?.downwardEvaluation.primary.assignedWbsCount,
              completedEvaluationCount:
                result?.downwardEvaluation.primary.completedEvaluationCount,
              isSubmitted: result?.downwardEvaluation.primary.isSubmitted,
              totalScore: result?.downwardEvaluation.primary.totalScore,
              grade: result?.downwardEvaluation.primary.grade,
            },
            secondary: {
              status: result?.downwardEvaluation.secondary.status,
              evaluators: result?.downwardEvaluation.secondary.evaluators.map(
                (e) => ({
                  evaluatorId: e.evaluator?.id,
                  status: e.status,
                  assignedWbsCount: e.assignedWbsCount,
                  completedEvaluationCount: e.completedEvaluationCount,
                  isSubmitted: e.isSubmitted,
                }),
              ),
            },
          },
        },
      });
    });

    it('존재하지 않는 직원 - null을 반환해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000999';
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        nonExistentEmployeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '존재하지 않는 직원 - null을 반환해야 한다',
        result: {
          isNull: result === null,
        },
      });
    });

    it('평가 대상 제외 - isExcluded가 true인 경우 isEvaluationTarget이 false여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 매핑을 제외 상태로 변경
      const mapping = await mappingRepository.findOne({
        where: { id: mappingId },
      });
      if (mapping) {
        mapping.isExcluded = true;
        mapping.excludeReason = '테스트 제외';
        mapping.excludedAt = new Date();
        await mappingRepository.save(mapping);
      }

      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result?.isEvaluationTarget).toBe(false);
      expect(result?.exclusionInfo.isExcluded).toBe(true);
      expect(result?.exclusionInfo.excludeReason).toBe('테스트 제외');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '평가 대상 제외 - isExcluded가 true인 경우 isEvaluationTarget이 false여야 한다',
        result: {
          isEvaluationTarget: result?.isEvaluationTarget,
          exclusionInfo: {
            isExcluded: result?.exclusionInfo.isExcluded,
            excludeReason: result?.exclusionInfo.excludeReason,
          },
        },
      });
    });

    it('단계별 승인 상태 - stepApproval 정보가 올바르게 반환되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // StepApproval 생성
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.APPROVED,
        criteriaSettingApprovedBy: systemAdminId,
        criteriaSettingApprovedAt: new Date(),
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
        false,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result?.stepApproval).not.toBeNull();
      expect(result?.stepApproval.criteriaSettingStatus).toBe('approved');
      expect(result?.stepApproval.selfEvaluationStatus).toBe('pending');
      expect(result?.stepApproval.primaryEvaluationStatus).toBe('pending');
      expect(result?.stepApproval.secondaryEvaluationStatus).toBe('pending');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '단계별 승인 상태 - stepApproval 정보가 올바르게 반환되어야 한다',
        result: {
          stepApproval: {
            criteriaSettingStatus: result?.stepApproval.criteriaSettingStatus,
            criteriaSettingApprovedBy:
              result?.stepApproval.criteriaSettingApprovedBy,
            selfEvaluationStatus: result?.stepApproval.selfEvaluationStatus,
            primaryEvaluationStatus:
              result?.stepApproval.primaryEvaluationStatus,
            secondaryEvaluationStatus:
              result?.stepApproval.secondaryEvaluationStatus,
          },
        },
      });
    });
  });
});
