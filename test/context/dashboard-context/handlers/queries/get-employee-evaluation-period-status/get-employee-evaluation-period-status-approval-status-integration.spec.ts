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
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { ProjectStatus } from '@domain/common/project/project.types';

/**
 * Dashboard Context - 승인상태 통합 상태 검증 테스트
 *
 * 대시보드에서 제공하는 통합 상태(criteriaSetup.status, downwardEvaluation.primary.status, downwardEvaluation.secondary.status)가
 * 제대로 계산되어 반환되는지 검증합니다.
 */
describe('GetEmployeeEvaluationPeriodStatusHandler - Approval Status Integration', () => {
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
  let secondaryEvaluatorId1: string;
  let secondaryEvaluatorId2: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
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
          Project,
          WbsItem,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
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
    mappingRepository = dataSource.getRepository(EvaluationPeriodEmployeeMapping);
    stepApprovalRepository = dataSource.getRepository(EmployeeEvaluationStepApproval);
    projectAssignmentRepository = dataSource.getRepository(EvaluationProjectAssignment);
    wbsAssignmentRepository = dataSource.getRepository(EvaluationWbsAssignment);
    wbsCriteriaRepository = dataSource.getRepository(WbsEvaluationCriteria);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(EvaluationLineMapping);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    revisionRequestRepository = dataSource.getRepository(EvaluationRevisionRequest);
    revisionRequestRecipientRepository = dataSource.getRepository(EvaluationRevisionRequestRecipient);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    adminId = systemAdminId;
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
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
      endDate: new Date('2024-06-30'),
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
    const savedPrimaryEvaluator = await employeeRepository.save(primaryEvaluator);
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
    const savedSecondaryEvaluator1 = await employeeRepository.save(secondaryEvaluator1);
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
    const savedSecondaryEvaluator2 = await employeeRepository.save(secondaryEvaluator2);
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
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);

    const secondaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.SECONDARY,
      order: 2,
      isRequired: true,
      isAutoAssigned: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryLine = await evaluationLineRepository.save(secondaryLine);

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

    // 2차 평가자 매핑 (2명)
    await evaluationLineMappingRepository.save(
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: savedSecondaryLine.id,
        evaluatorId: secondaryEvaluatorId1,
        wbsItemId: wbsItemId1,
        createdBy: systemAdminId,
      }),
    );

    await evaluationLineMappingRepository.save(
      evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationLineId: savedSecondaryLine.id,
        evaluatorId: secondaryEvaluatorId2,
        wbsItemId: wbsItemId2,
        createdBy: systemAdminId,
      }),
    );
  }

  describe('criteriaSetup.status 통합 상태 검증', () => {
    it('모든 항목이 complete이고 승인 상태가 approved이면 criteriaSetup.status는 approved여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // stepApproval 생성 (approved)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.APPROVED,
          criteriaSettingApprovedBy: adminId,
          criteriaSettingApprovedAt: new Date(),
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
      expect(result).toBeDefined();
      expect(result!.criteriaSetup).toBeDefined();
      expect(result!.criteriaSetup.status).toBe('approved');

      // 하위 항목들도 확인
      expect(result!.criteriaSetup.evaluationCriteria.status).toBe('complete');
      expect(result!.criteriaSetup.wbsCriteria.status).toBe('complete');
      expect(result!.criteriaSetup.evaluationLine.status).toBe('complete');
    });

    it('모든 항목이 complete이고 승인 상태가 pending이면 criteriaSetup.status는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // stepApproval 생성 (pending)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
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
      expect(result).toBeDefined();
      expect(result!.criteriaSetup.status).toBe('pending');
    });

    it('모든 항목이 complete이고 승인 상태가 revision_requested이면 criteriaSetup.status는 revision_requested이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // stepApproval 생성 (revision_requested)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.REVISION_REQUESTED,
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
      expect(result).toBeDefined();
      expect(result!.criteriaSetup.status).toBe('revision_requested');
    });

    it('하나라도 complete가 아니면 criteriaSetup.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // WBS 평가기준 하나 삭제 (in_progress 상태로 만들기)
      await wbsCriteriaRepository.delete({
        wbsItemId: wbsItemId2,
      });

      // stepApproval 생성 (approved여도 in_progress 반환)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.APPROVED,
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
      expect(result).toBeDefined();
      expect(result!.criteriaSetup.status).toBe('in_progress');
      expect(result!.criteriaSetup.wbsCriteria.status).toBe('in_progress');
    });

    it('모든 항목이 none이면 criteriaSetup.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 모든 항목 삭제
      const allWbsCriteria = await wbsCriteriaRepository.find();
      if (allWbsCriteria.length > 0) {
        await wbsCriteriaRepository.remove(allWbsCriteria);
      }
      await evaluationLineMappingRepository.delete({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
      });
      await wbsAssignmentRepository.delete({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
      });
      await projectAssignmentRepository.delete({
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
      expect(result).toBeDefined();
      expect(result!.criteriaSetup.status).toBe('none');
    });
  });

  describe('downwardEvaluation.primary.status 통합 상태 검증', () => {
    it('1차 하향평가가 complete이고 승인 상태가 approved이면 primary.status는 approved이어야 한다', async () => {
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

      // stepApproval 생성 (approved)
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.primary.status).toBe('approved');
    });

    it('1차 하향평가가 complete이고 승인 상태가 pending이면 primary.status는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 완료
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

      // stepApproval 생성 (pending)
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.primary.status).toBe('pending');
    });

    it('1차 하향평가가 in_progress이면 primary.status는 in_progress이어야 한다 (승인 상태 무관)', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 일부만 완료 (in_progress)
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

      // stepApproval 생성 (approved여도 in_progress 반환)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.APPROVED,
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.primary.status).toBe('in_progress');
    });

    it('1차 하향평가가 none이면 primary.status는 none이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // stepApproval 생성 (approved여도 none 반환)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          primaryEvaluationStatus: StepApprovalStatus.APPROVED,
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.primary.status).toBe('none');
    });
  });

  describe('downwardEvaluation.secondary.status 통합 상태 검증', () => {
    it('모든 2차 평가자가 complete이고 모두 approved이면 secondary.status는 approved이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1의 하향평가 완료 (할당된 모든 WBS 평가 완료)
      // 평가자1은 wbsItemId1에만 할당되어 있지만, 로직상 피평가자의 전체 WBS 수(2개)를 기준으로 계산되므로
      // 모든 WBS에 대한 평가를 완료해야 complete 상태가 됩니다.
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
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 75,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 2차 평가자2의 하향평가 완료 (할당된 모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 70,
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
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (approved)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
          secondaryEvaluationApprovedBy: adminId,
          secondaryEvaluationApprovedAt: new Date(),
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.status).toBe('approved');
      expect(result!.downwardEvaluation.secondary.evaluators).toHaveLength(2);
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe('approved');
      expect(result!.downwardEvaluation.secondary.evaluators[1].status).toBe('approved');
    });

    it('하나라도 revision_requested가 있으면 secondary.status는 revision_requested이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자들의 하향평가 완료 (모든 WBS 평가 완료)
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
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 75,
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
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 70,
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
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 재작성 요청 생성 (평가자1에게)
      const revisionRequest = await revisionRequestRepository.save(
        revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'secondary',
          comment: '재작성 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest.id,
          recipientId: secondaryEvaluatorId1,
          recipientType: 'secondary_evaluator',
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (approved여도 revision_requested가 우선)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.status).toBe('revision_requested');
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe('revision_requested');
    });

    it('모두 complete이고 모두 pending이면 secondary.status는 pending이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자들의 하향평가 완료 (모든 WBS 평가 완료)
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
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 75,
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
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 70,
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
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 85,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // stepApproval 생성 (pending)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.status).toBe('pending');
    });

    it('하나라도 in_progress이면 secondary.status는 in_progress이어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1의 하향평가 완료
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

      // 2차 평가자2의 하향평가는 미완료 (in_progress)

      // stepApproval 생성 (approved여도 in_progress 반환)
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
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
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.status).toBe('in_progress');
    });

    it('재작성 요청 후 완료되면 revision_completed 상태가 되어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2차 평가자1의 하향평가 완료 (모든 WBS 평가 완료)
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
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 75,
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
          comment: '재작성 요청',
          requestedBy: adminId,
          requestedAt: new Date(),
          createdBy: systemAdminId,
        }),
      );

      const recipient = await revisionRequestRecipientRepository.save(
        revisionRequestRecipientRepository.create({
          revisionRequestId: revisionRequest.id,
          recipientId: secondaryEvaluatorId1,
          recipientType: 'secondary_evaluator',
          createdBy: systemAdminId,
        }),
      );

      // 재작성 완료 처리
      recipient.isCompleted = true;
      recipient.completedAt = new Date();
      recipient.responseComment = '재작성 완료';
      await revisionRequestRecipientRepository.save(recipient);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.downwardEvaluation.secondary.evaluators[0].status).toBe('revision_completed');
      expect(result!.stepApproval.secondaryEvaluationStatuses[0].isRevisionCompleted).toBe(true);
    });
  });

  describe('통합 시나리오 테스트', () => {
    it('모든 단계가 완료되고 승인된 경우 모든 통합 상태가 approved여야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 하향평가 완료
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

      // 2차 하향평가 완료 (모든 WBS 평가 완료)
      await downwardEvaluationRepository.save(
        downwardEvaluationRepository.create({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: secondaryEvaluatorId1,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 1',
          downwardEvaluationScore: 82,
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
          downwardEvaluationContent: '평가 내용 추가',
          downwardEvaluationScore: 78,
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
          wbsId: wbsItemId1,
          downwardEvaluationContent: '평가 내용 추가',
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
          evaluatorId: secondaryEvaluatorId2,
          evaluationType: DownwardEvaluationType.SECONDARY,
          wbsId: wbsItemId2,
          downwardEvaluationContent: '평가 내용 2',
          downwardEvaluationScore: 83,
          evaluationDate: new Date(),
          isCompleted: true,
          createdBy: systemAdminId,
        }),
      );

      // 모든 단계 승인
      await stepApprovalRepository.save(
        stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.APPROVED,
          criteriaSettingApprovedBy: adminId,
          criteriaSettingApprovedAt: new Date(),
          primaryEvaluationStatus: StepApprovalStatus.APPROVED,
          primaryEvaluationApprovedBy: adminId,
          primaryEvaluationApprovedAt: new Date(),
          secondaryEvaluationStatus: StepApprovalStatus.APPROVED,
          secondaryEvaluationApprovedBy: adminId,
          secondaryEvaluationApprovedAt: new Date(),
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
      expect(result).toBeDefined();
      expect(result!.criteriaSetup.status).toBe('approved');
      expect(result!.downwardEvaluation.primary.status).toBe('approved');
      expect(result!.downwardEvaluation.secondary.status).toBe('approved');
    });
  });
});

