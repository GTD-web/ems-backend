import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApprovalModule } from '@domain/sub/secondary-evaluation-step-approval';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { SecondaryEvaluationStepApproval } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
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
import { RecipientType } from '@domain/sub/evaluation-revision-request';

/**
 * Dashboard Context - 2차 평가자 상태 검증 테스트
 *
 * 2차 평가자의 하향평가 통합 상태가 제대로 계산되어 반환되는지 검증합니다.
 * 모든 상태를 검증합니다:
 * 1. none - 평가할 WBS가 없거나 2차 평가자가 없음
 * 2. in_progress - 진행 중 (일부 완료)
 * 3. pending - 완료되었지만 승인 대기
 * 4. approved - 승인 완료
 * 5. revision_requested - 재작성 요청됨
 * 6. revision_completed - 재작성 완료됨
 * 7. 여러 평가자 상태 통합 테스트
 */
describe('GetEmployeeEvaluationPeriodStatusHandler - 2차 평가자 상태 검증', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>;
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
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
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
        SecondaryEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EmployeeEvaluationStepApproval,
          SecondaryEvaluationStepApproval,
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
    secondaryStepApprovalRepository = dataSource.getRepository(
      SecondaryEvaluationStepApproval,
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
      'get-employee-evaluation-period-status-secondary-evaluator-status-test-result.json',
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
      const secondaryApprovals = await secondaryStepApprovalRepository.find();
      await secondaryStepApprovalRepository.remove(secondaryApprovals);

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
   * 기본 테스트 데이터 생성 (2차 평가자 포함)
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

    // 6. 평가자 생성 (2차 - 1명)
    const secondaryEvaluator1 = employeeRepository.create({
      name: '2차평가자1',
      employeeNumber: 'EVA002',
      email: 'secondary1@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator1 =
      await employeeRepository.save(secondaryEvaluator1);
    secondaryEvaluatorId1 = savedSecondaryEvaluator1.id;

    // 7. 평가자 생성 (2차 - 2명)
    const secondaryEvaluator2 = employeeRepository.create({
      name: '2차평가자2',
      employeeNumber: 'EVA003',
      email: 'secondary2@test.com',
      externalId: 'EXT004',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluator2 =
      await employeeRepository.save(secondaryEvaluator2);
    secondaryEvaluatorId2 = savedSecondaryEvaluator2.id;

    // 8. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 9. 프로젝트 할당
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

    // 10. WBS 아이템 생성 및 할당
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

    // 11. WBS 평가기준 설정
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

    // 12. 평가라인 생성 및 매핑
    // 1차 평가라인
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
        wbsItemId: null as any,
        createdBy: systemAdminId,
      }),
    );

    // 2차 평가라인
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

    // 2차 평가자 매핑 (1명) - WBS 할당은 각 테스트에서 필요에 따라 설정
    await evaluationLineMappingRepository.save(
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: savedSecondaryLine.id,
        evaluatorId: secondaryEvaluatorId1,
        wbsItemId: null as any,
        createdBy: systemAdminId,
      }),
    );
  }

  describe('2차 평가자 하향평가 통합 상태 검증', () => {
    it('상태 1: none - 평가할 WBS가 없으면 secondary.status는 none이어야 한다', async () => {
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
      expect(result!.downwardEvaluation.secondary.status).toBe('none');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'none',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(0);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(0);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 1: none - 평가할 WBS가 없으면 secondary.status는 none이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 2: none - 2차 평가자가 있지만 하향평가가 하나도 없으면 secondary.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 하향평가 없음 (WBS는 할당되어 있음)

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.status).toBe('none');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'none',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(0);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 2: none - 2차 평가자가 있지만 하향평가가 하나도 없으면 secondary.status는 none이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 3: in_progress - 일부만 완료되었으면 secondary.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 하향평가 일부 완료 (1개만 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
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
      expect(result!.downwardEvaluation.secondary.status).toBe('in_progress');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'in_progress',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(1);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 3: in_progress - 일부만 완료되었으면 secondary.status는 in_progress이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 4: pending - 모든 평가가 완료되었지만 승인 대기 중이면 secondary.status는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
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
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (기본 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // 개별 승인 상태 없음 (pending 상태)

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.status).toBe('pending');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'pending',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(true);
      expect(result!.downwardEvaluation.secondary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.grade).not.toBeNull();

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(1);
      const individualStatus =
        result!.stepApproval.secondaryEvaluationStatuses[0];
      expect(individualStatus.evaluatorId).toBe(secondaryEvaluatorId1);
      expect(individualStatus.status).toBe('pending');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 4: pending - 모든 평가가 완료되었지만 승인 대기 중이면 secondary.status는 pending이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
          totalScore: result!.downwardEvaluation.secondary.totalScore,
          grade: result!.downwardEvaluation.secondary.grade,
        },
      });
    });

    it('상태 5: approved - 모든 평가가 완료되고 승인되었으면 secondary.status는 approved이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
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
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (approved 상태로 설정 - 하위 호환성)
      const now = new Date();
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
          secondaryEvaluationApprovedBy: adminId,
          secondaryEvaluationApprovedAt: now,
          createdBy: systemAdminId,
        }),
      );

      // 개별 승인 상태 생성 (secondary_evaluation_step_approval 테이블)
      await secondaryStepApprovalRepository.save(
        secondaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: secondaryEvaluatorId1,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
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
      expect(result!.downwardEvaluation.secondary.status).toBe('approved');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'approved',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(true);
      expect(result!.downwardEvaluation.secondary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.grade).not.toBeNull();

      // stepApproval 검증
      expect(result!.stepApproval.secondaryEvaluationStatus).toBe('approved');
      expect(result!.stepApproval.secondaryEvaluationApprovedBy).toBe(adminId);
      expect(result!.stepApproval.secondaryEvaluationApprovedAt).not.toBeNull();

      // 개별 상태 검증 (secondaryEvaluationStatuses)
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(1);
      const individualStatus =
        result!.stepApproval.secondaryEvaluationStatuses[0];
      expect(individualStatus.evaluatorId).toBe(secondaryEvaluatorId1);
      expect(individualStatus.status).toBe('approved');
      expect(individualStatus.approvedBy).toBe(adminId);
      expect(individualStatus.approvedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 5: approved - 모든 평가가 완료되고 승인되었으면 secondary.status는 approved이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
          totalScore: result!.downwardEvaluation.secondary.totalScore,
          grade: result!.downwardEvaluation.secondary.grade,
          stepApprovalStatus: result!.stepApproval.secondaryEvaluationStatus,
          approvedBy: result!.stepApproval.secondaryEvaluationApprovedBy,
          approvedAt: result!.stepApproval.secondaryEvaluationApprovedAt,
        },
      });
    });

    it('상태 6: revision_requested - 재작성 요청되었으면 secondary.status는 revision_requested이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
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
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 생성
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
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
          recipientId: secondaryEvaluatorId1,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
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
      expect(result!.downwardEvaluation.secondary.status).toBe(
        'revision_requested',
      );
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'revision_requested',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(true);
      expect(result!.downwardEvaluation.secondary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.grade).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 6: revision_requested - 재작성 요청되었으면 secondary.status는 revision_requested이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
          totalScore: result!.downwardEvaluation.secondary.totalScore,
          grade: result!.downwardEvaluation.secondary.grade,
        },
      });
    });

    it('상태 7: revision_completed - 재작성 완료되었으면 secondary.status는 revision_completed이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
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
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 생성
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
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
          recipientId: secondaryEvaluatorId1,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
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
      expect(result!.downwardEvaluation.secondary.status).toBe(
        'revision_completed',
      );
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(1);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'revision_completed',
      );
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].assignedWbsCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0]
          .completedEvaluationCount,
      ).toBe(2);
      expect(
        result!.downwardEvaluation.secondary.evaluators[0].isSubmitted,
      ).toBe(true);
      expect(result!.downwardEvaluation.secondary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.grade).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 7: revision_completed - 재작성 완료되었으면 secondary.status는 revision_completed이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
          totalScore: result!.downwardEvaluation.secondary.totalScore,
          grade: result!.downwardEvaluation.secondary.grade,
        },
      });
    });

    it('상태 8: 여러 평가자 상태 통합 - 모든 평가자가 approved이면 전체 상태는 approved이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자 2명 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1 평가 완료
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1-1',
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
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 1-2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 평가 완료
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 2-1',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2-2',
          downwardEvaluationScore: 95,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (기본 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // 개별 승인 상태 생성 (각 평가자별로)
      const now = new Date();
      await secondaryStepApprovalRepository.save(
        secondaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: secondaryEvaluatorId1,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
          createdBy: systemAdminId,
        }),
      );

      await secondaryStepApprovalRepository.save(
        secondaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: secondaryEvaluatorId2,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
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
      expect(result!.downwardEvaluation.secondary.status).toBe('approved');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe(
        'approved',
      );
      expect(result!.downwardEvaluation.secondary.evaluators[1].status).toBe(
        'approved',
      );
      expect(result!.downwardEvaluation.secondary.isSubmitted).toBe(true);
      expect(result!.downwardEvaluation.secondary.totalScore).not.toBeNull();
      expect(result!.downwardEvaluation.secondary.grade).not.toBeNull();

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);
      const status1 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId1,
      );
      const status2 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId2,
      );
      expect(status1).toBeDefined();
      expect(status1!.status).toBe('approved');
      expect(status2).toBeDefined();
      expect(status2!.status).toBe('approved');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 8: 여러 평가자 상태 통합 - 모든 평가자가 approved이면 전체 상태는 approved이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
          isSubmitted: result!.downwardEvaluation.secondary.isSubmitted,
          totalScore: result!.downwardEvaluation.secondary.totalScore,
          grade: result!.downwardEvaluation.secondary.grade,
        },
      });
    });

    it('상태 9: 여러 평가자 혼합 상태 - pending + approved 혼합이면 전체 상태는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자 2명 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1 평가 완료 (pending 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1-1',
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
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 1-2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 평가 완료 (approved 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 2-1',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2-2',
          downwardEvaluationScore: 95,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (기본 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // 평가자1은 pending 상태 (개별 승인 상태 없음)
      // 평가자2는 approved 상태 (개별 승인 상태 생성)
      const now = new Date();
      await secondaryStepApprovalRepository.save(
        secondaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: secondaryEvaluatorId2,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
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
      // pending + approved = pending (하나라도 pending이면 전체는 pending)
      expect(result!.downwardEvaluation.secondary.status).toBe('pending');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1!.status).toBe('pending');
      expect(evaluator2).toBeDefined();
      expect(evaluator2!.status).toBe('approved');

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);
      const status1 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId1,
      );
      const status2 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId2,
      );
      expect(status1).toBeDefined();
      expect(status1!.status).toBe('pending');
      expect(status2).toBeDefined();
      expect(status2!.status).toBe('approved');
      expect(status2!.approvedBy).toBe(adminId);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 9: 여러 평가자 혼합 상태 - pending + approved 혼합이면 전체 상태는 pending이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 10: 여러 평가자 혼합 상태 - revision_requested + approved 혼합이면 전체 상태는 revision_requested이어야 한다 (최우선)', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자 2명 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1 평가 완료 (revision_requested 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1-1',
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
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 1-2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 평가 완료 (approved 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 2-1',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2-2',
          downwardEvaluationScore: 95,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 평가자1에 대한 재작성 요청 생성
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
          comment: '재작성 필요',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest.id,
          recipientId: secondaryEvaluatorId1,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (기본 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // 평가자2는 approved 상태 (개별 승인 상태 생성)
      const now = new Date();
      await secondaryStepApprovalRepository.save(
        secondaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: secondaryEvaluatorId2,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
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
      // revision_requested가 하나라도 있으면 최우선
      expect(result!.downwardEvaluation.secondary.status).toBe(
        'revision_requested',
      );
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1!.status).toBe('revision_requested');
      expect(evaluator2).toBeDefined();
      expect(evaluator2!.status).toBe('approved');

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);
      const status1 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId1,
      );
      const status2 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId2,
      );
      expect(status1).toBeDefined();
      expect(status1!.status).toBe('revision_requested');
      expect(status1!.revisionRequestId).not.toBeNull();
      expect(status2).toBeDefined();
      expect(status2!.status).toBe('approved');
      expect(status2!.approvedBy).toBe(adminId);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 10: 여러 평가자 혼합 상태 - revision_requested + approved 혼합이면 전체 상태는 revision_requested이어야 한다 (최우선)',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 11: 여러 평가자 혼합 상태 - revision_completed + pending 혼합이면 전체 상태는 revision_completed이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자 2명 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1 평가 완료 (revision_completed 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1-1',
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
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 1-2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 평가 완료 (pending 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 2-1',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2-2',
          downwardEvaluationScore: 95,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 평가자1에 대한 재작성 요청 생성 (완료됨)
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
          comment: '재작성 필요',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest.id,
          recipientId: secondaryEvaluatorId1,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (기본 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // 평가자2는 pending 상태 (개별 승인 상태 없음)

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      // revision_completed가 하나라도 있으면 revision_completed
      expect(result!.downwardEvaluation.secondary.status).toBe(
        'revision_completed',
      );
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1!.status).toBe('revision_completed');
      expect(evaluator2).toBeDefined();
      expect(evaluator2!.status).toBe('pending');

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);
      const status1 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId1,
      );
      const status2 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId2,
      );
      expect(status1).toBeDefined();
      expect(status1!.status).toBe('revision_completed');
      expect(status1!.revisionRequestId).not.toBeNull();
      expect(status1!.isRevisionCompleted).toBe(true);
      expect(status2).toBeDefined();
      expect(status2!.status).toBe('pending');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 11: 여러 평가자 혼합 상태 - revision_completed + pending 혼합이면 전체 상태는 revision_completed이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 12: 여러 평가자 혼합 상태 - in_progress + pending 혼합이면 전체 상태는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자 2명 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1 평가 일부 완료 (in_progress 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1-1',
          downwardEvaluationScore: 80,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );
      // wbsItemId2는 평가하지 않음 (in_progress)

      // 2차 평가자2 평가 완료 (pending 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 2-1',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2-2',
          downwardEvaluationScore: 95,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (기본 상태)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        }),
      );

      // 평가자2는 pending 상태 (개별 승인 상태 없음)

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).not.toBeNull();
      // in_progress + pending = pending (pending이 하나라도 있으면 pending)
      expect(result!.downwardEvaluation.secondary.status).toBe('pending');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1!.status).toBe('in_progress');
      expect(evaluator2).toBeDefined();
      expect(evaluator2!.status).toBe('pending');

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);
      const status1 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId1,
      );
      const status2 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId2,
      );
      expect(status1).toBeDefined();
      expect(status1!.status).toBe('pending'); // 하향평가가 완료되지 않아서 pending
      expect(status2).toBeDefined();
      expect(status2!.status).toBe('pending');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 12: 여러 평가자 혼합 상태 - in_progress + pending 혼합이면 전체 상태는 pending이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('상태 13: 여러 평가자 혼합 상태 - revision_requested + revision_completed 혼합이면 전체 상태는 revision_completed이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자 2명 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1 평가 완료 (revision_requested 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1-1',
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
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 1-2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 평가 완료 (revision_completed 상태)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 2-1',
          downwardEvaluationScore: 90,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2-2',
          downwardEvaluationScore: 95,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 평가자1에 대한 재작성 요청 생성 (미완료)
      const revisionRequest1 = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
          comment: '재작성 필요',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest1.id,
          recipientId: secondaryEvaluatorId1,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
          isCompleted: false,
          createdBy: systemAdminId,
        }),
      );

      // 평가자2에 대한 재작성 요청 생성 (완료됨)
      const revisionRequest2 = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
          comment: '재작성 필요',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest2.id,
          recipientId: secondaryEvaluatorId2,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
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
      // revision_completed가 하나라도 있으면 우선 (revision_requested + revision_completed 혼합 시 revision_completed 반환)
      expect(result!.downwardEvaluation.secondary.status).toBe(
        'revision_completed',
      );
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator1).toBeDefined();
      expect(evaluator1!.status).toBe('revision_requested');
      expect(evaluator2).toBeDefined();
      expect(evaluator2!.status).toBe('revision_completed');

      // 개별 상태 검증
      expect(result!.stepApproval.secondaryEvaluationStatuses).toBeDefined();
      expect(result!.stepApproval.secondaryEvaluationStatuses.length).toBe(2);
      const status1 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId1,
      );
      const status2 = result!.stepApproval.secondaryEvaluationStatuses.find(
        (s) => s.evaluatorId === secondaryEvaluatorId2,
      );
      expect(status1).toBeDefined();
      expect(status1!.status).toBe('revision_requested');
      expect(status1!.revisionRequestId).not.toBeNull();
      expect(status2).toBeDefined();
      expect(status2!.status).toBe('revision_completed');
      expect(status2!.revisionRequestId).not.toBeNull();
      expect(status2!.isRevisionCompleted).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '상태 13: 여러 평가자 혼합 상태 - revision_requested + revision_completed 혼합이면 전체 상태는 revision_completed이어야 한다',
        result: {
          status: result!.downwardEvaluation.secondary.status,
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              status: e.status,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });
  });

  describe('2차 평가자 assignedWbsCount 수량 검증', () => {
    it('각 2차 평가자에게 할당된 WBS 수량이 정확하게 계산되어야 한다', async () => {
      // Given
      // 기본 데이터 생성
      await 기본_테스트데이터를_생성한다();

      // 기존 2차 평가자 매핑 제거 (테스트를 위해 깨끗한 상태로 시작)
      await evaluationLineMappingRepository.delete({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: secondaryLineId,
      });

      // 2차 평가자1 매핑 재생성
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 추가 WBS 아이템 생성 (총 4개)
      const wbsItem3 = wbsItemRepository.create({
        wbsCode: 'WBS003',
        title: 'WBS 항목 3',
        projectId: projectId,
        level: 1,
        createdBy: systemAdminId,
      });
      const savedWbsItem3 = await wbsItemRepository.save(wbsItem3);
      const wbsItemId3 = savedWbsItem3.id;

      const wbsItem4 = wbsItemRepository.create({
        wbsCode: 'WBS004',
        title: 'WBS 항목 4',
        projectId: projectId,
        level: 1,
        createdBy: systemAdminId,
      });
      const savedWbsItem4 = await wbsItemRepository.save(wbsItem4);
      const wbsItemId4 = savedWbsItem4.id;

      // 추가 WBS 할당 (총 4개)
      await wbsAssignmentRepository.save(
        wbsAssignmentRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: projectId,
          wbsItemId: wbsItemId3,
          weight: 25,
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
          wbsItemId: wbsItemId4,
          weight: 25,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1에게 WBS1, WBS2 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게 WBS3, WBS4 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId3,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId4,
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
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      // 2차 평가자1은 WBS1, WBS2 (2개) 할당
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).not.toBeUndefined();
      expect(evaluator1!.assignedWbsCount).toBe(2);
      expect(evaluator1!.completedEvaluationCount).toBe(0);
      expect(evaluator1!.isSubmitted).toBe(false);

      // 2차 평가자2는 WBS3, WBS4 (2개) 할당
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).not.toBeUndefined();
      expect(evaluator2!.assignedWbsCount).toBe(2);
      expect(evaluator2!.completedEvaluationCount).toBe(0);
      expect(evaluator2!.isSubmitted).toBe(false);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '각 2차 평가자에게 할당된 WBS 수량이 정확하게 계산되어야 한다',
        result: {
          totalWbsCount: 4, // 피평가자 전체 WBS 수
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              evaluatorId: e.evaluator.id,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
              isSubmitted: e.isSubmitted,
            }),
          ),
        },
      });
    });

    it('2차 평가자에게 할당된 WBS가 없으면 assignedWbsCount는 0이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 기존 2차 평가자 매핑 제거
      await evaluationLineMappingRepository.delete({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: secondaryLineId,
      });

      // 2차 평가자1 매핑 재생성
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 추가 (WBS 할당 없음)
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1에게만 WBS 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
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
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      // 2차 평가자1은 WBS1 (1개) 할당
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).not.toBeUndefined();
      expect(evaluator1!.assignedWbsCount).toBe(1);

      // 2차 평가자2는 WBS 할당 없음 (0개)
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).not.toBeUndefined();
      expect(evaluator2!.assignedWbsCount).toBe(0);
      expect(evaluator2!.status).toBe('none');

      // 테스트 결과 저장
      testResults.push({
        testName:
          '2차 평가자에게 할당된 WBS가 없으면 assignedWbsCount는 0이어야 한다',
        result: {
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              evaluatorId: e.evaluator.id,
              assignedWbsCount: e.assignedWbsCount,
              status: e.status,
            }),
          ),
        },
      });
    });

    it('여러 2차 평가자가 같은 WBS를 평가하는 경우 각자의 assignedWbsCount가 정확해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 기존 2차 평가자 매핑 제거
      await evaluationLineMappingRepository.delete({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: secondaryLineId,
      });

      // 2차 평가자1 매핑 재생성
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2 추가
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: null as any,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자1에게 WBS1, WBS2 할당
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId1,
          createdBy: systemAdminId,
        }),
      );

      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId1,
          wbsItemId: wbsItemId2,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2에게도 WBS1 할당 (공통 WBS)
      await evaluationLineMappingRepository.save(
        evaluationLineMappingRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluationLineId: secondaryLineId,
          evaluatorId: secondaryEvaluatorId2,
          wbsItemId: wbsItemId1,
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
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);

      // 2차 평가자1은 WBS1, WBS2 (2개) 할당
      const evaluator1 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId1,
      );
      expect(evaluator1).not.toBeUndefined();
      expect(evaluator1!.assignedWbsCount).toBe(2);

      // 2차 평가자2는 WBS1 (1개) 할당
      const evaluator2 = result!.downwardEvaluation.secondary.evaluators.find(
        (e) => e.evaluator.id === secondaryEvaluatorId2,
      );
      expect(evaluator2).not.toBeUndefined();
      expect(evaluator2!.assignedWbsCount).toBe(1);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '여러 2차 평가자가 같은 WBS를 평가하는 경우 각자의 assignedWbsCount가 정확해야 한다',
        result: {
          totalWbsCount: 2, // 피평가자 전체 WBS 수
          evaluators: result!.downwardEvaluation.secondary.evaluators.map(
            (e) => ({
              evaluatorName: e.evaluator.name,
              evaluatorId: e.evaluator.id,
              assignedWbsCount: e.assignedWbsCount,
              completedEvaluationCount: e.completedEvaluationCount,
            }),
          ),
        },
      });
    });
  });
});
