import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { EvaluationActivityLog } from '@domain/core/evaluation-activity-log/evaluation-activity-log.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { RevisionRequestStepType } from '@/domain/sub/evaluation-revision-request';

/**
 * EvaluationActivityLogContextService 테스트
 *
 * 평가 활동 내역 기록 및 조회 기능을 검증합니다.
 */
describe('EvaluationActivityLogContextService', () => {
  let service: EvaluationActivityLogContextService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let activityLogRepository: Repository<EvaluationActivityLog>;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let performerId: string;
  let departmentId: string;
  let mappingId: string;
  let adminId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
          EvaluationActivityLog,
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
        ]),
        EvaluationActivityLogContextModule,
      ],
    }).compile();

    service = module.get<EvaluationActivityLogContextService>(
      EvaluationActivityLogContextService,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    activityLogRepository = dataSource.getRepository(EvaluationActivityLog);
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    adminId = systemAdminId;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const activityLogs = await activityLogRepository.find();
      await activityLogRepository.remove(activityLogs);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
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

    // 4. 활동 수행자 직원 생성
    const performer = employeeRepository.create({
      name: '이수행자',
      employeeNumber: 'EMP002',
      email: 'performer@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPerformer = await employeeRepository.save(performer);
    performerId = savedPerformer.id;

    // 5. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;
  }

  describe('활동내역을_기록한다', () => {
    it('기본 활동 내역을 기록한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        activityAction: 'created',
        activityTitle: '산출물 생성',
        performedBy: performerId,
        performedByName: '이수행자',
      };

      // When
      const result = await service.활동내역을_기록한다(params);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(result.employeeId).toBe(employeeId);
      expect(result.activityType).toBe('deliverable');
      expect(result.activityAction).toBe('created');
      expect(result.activityTitle).toBe('산출물 생성');
      expect(result.performedBy).toBe(performerId);
      expect(result.performedByName).toBe('이수행자');

      // 데이터베이스에서 확인
      const saved = await activityLogRepository.findOne({
        where: { id: result.id },
      });
      expect(saved).toBeDefined();
      expect(saved?.activityType).toBe('deliverable');
      expect(saved?.activityAction).toBe('created');
    });

    it('activityDescription이 자동 생성된다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        activityAction: 'created',
        activityTitle: 'WBS 자기평가',
        performedBy: performerId,
        // performedByName은 자동 조회됨
      };

      // When
      const result = await service.활동내역을_기록한다(params);

      // Then
      expect(result.activityDescription).toBeDefined();
      expect(result.activityDescription).toContain('이수행자');
      expect(result.activityDescription).toContain('WBS 자기평가');
      expect(result.activityDescription).toContain('생성');
    });

    it('한글 조사(을/를)가 올바르게 생성된다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      // 받침이 있는 경우 (을)
      const params1 = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        activityAction: 'created',
        activityTitle: '산출물',
        performedBy: performerId,
      };

      // 받침이 없는 경우 (를)
      const params2 = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        activityAction: 'created',
        activityTitle: '평가',
        performedBy: performerId,
      };

      // When
      const result1 = await service.활동내역을_기록한다(params1);
      const result2 = await service.활동내역을_기록한다(params2);

      // Then
      expect(result1.activityDescription).toContain('산출물을');
      expect(result2.activityDescription).toContain('평가를');
    });

    it('activityDescription이 제공되면 자동 생성하지 않는다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      const customDescription = '커스텀 설명입니다.';
      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        activityAction: 'created',
        activityTitle: '산출물 생성',
        activityDescription: customDescription,
        performedBy: performerId,
        performedByName: '이수행자',
      };

      // When
      const result = await service.활동내역을_기록한다(params);

      // Then
      expect(result.activityDescription).toBe(customDescription);
    });

    it('관련 엔티티 정보가 포함된 활동 내역을 기록한다', async () => {
      // Given
      await 테스트데이터를_생성한다();

      const relatedEntityId = '123e4567-e89b-12d3-a456-426614174000';
      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        activityAction: 'updated',
        activityTitle: '산출물 수정',
        relatedEntityType: 'deliverable',
        relatedEntityId: relatedEntityId,
        performedBy: performerId,
        performedByName: '이수행자',
        activityMetadata: {
          deliverableId: relatedEntityId,
          wbsItemId: 'wbs-item-id',
        },
      };

      // When
      const result = await service.활동내역을_기록한다(params);

      // Then
      expect(result.relatedEntityType).toBe('deliverable');
      expect(result.relatedEntityId).toBe(relatedEntityId);
      expect(result.activityMetadata).toEqual({
        deliverableId: relatedEntityId,
        wbsItemId: 'wbs-item-id',
      });
    });
  });

  describe('평가기간_피평가자_활동내역을_조회한다', () => {
    beforeEach(async () => {
      await 테스트데이터를_생성한다();

      // 테스트 데이터 생성
      const now = new Date();
      const activities = [
        {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          activityType: 'deliverable',
          activityAction: 'created',
          activityTitle: '산출물 생성',
          activityDescription: '이수행자님이 산출물을 생성했습니다.',
          performedBy: performerId,
          performedByName: '이수행자',
          activityDate: new Date(now.getTime() - 1000),
          createdBy: systemAdminId,
        },
        {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          activityType: 'deliverable',
          activityAction: 'updated',
          activityTitle: '산출물 수정',
          activityDescription: '이수행자님이 산출물을 수정했습니다.',
          performedBy: performerId,
          performedByName: '이수행자',
          activityDate: new Date(now.getTime() - 500),
          createdBy: systemAdminId,
        },
        {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          activityType: 'self_evaluation',
          activityAction: 'submitted',
          activityTitle: '자기평가 제출',
          activityDescription: '이수행자님이 자기평가를 제출했습니다.',
          performedBy: performerId,
          performedByName: '이수행자',
          activityDate: new Date(now.getTime() - 200),
          createdBy: systemAdminId,
        },
      ];

      for (const data of activities) {
        await service.활동내역을_기록한다(data);
      }
    });

    it('전체 활동 내역 목록을 조회한다', async () => {
      // Given
      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        page: 1,
        limit: 10,
      };

      // When
      const result =
        await service.평가기간_피평가자_활동내역을_조회한다(params);

      // Then
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('활동 유형으로 필터링하여 조회한다', async () => {
      // Given
      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        activityType: 'deliverable',
        page: 1,
        limit: 10,
      };

      // When
      const result =
        await service.평가기간_피평가자_활동내역을_조회한다(params);

      // Then
      expect(result.items.length).toBe(2);
      expect(
        result.items.every((item) => item.activityType === 'deliverable'),
      ).toBe(true);
    });

    it('기간으로 필터링하여 조회한다', async () => {
      // Given
      const now = new Date();
      const startDate = new Date(now.getTime() - 600);
      const endDate = new Date(now.getTime() - 100);
      const params = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        startDate,
        endDate,
        page: 1,
        limit: 10,
      };

      // When
      const result =
        await service.평가기간_피평가자_활동내역을_조회한다(params);

      // Then
      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((item) => {
        expect(item.activityDate.getTime()).toBeGreaterThanOrEqual(
          startDate.getTime(),
        );
        expect(item.activityDate.getTime()).toBeLessThanOrEqual(
          endDate.getTime(),
        );
      });
    });

    it('페이징으로 활동 내역 목록을 조회한다', async () => {
      // Given
      const params1 = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        page: 1,
        limit: 2,
      };
      const params2 = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        page: 2,
        limit: 2,
      };

      // When
      const page1 =
        await service.평가기간_피평가자_활동내역을_조회한다(params1);
      const page2 =
        await service.평가기간_피평가자_활동내역을_조회한다(params2);

      // Then
      expect(page1.items.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page2.items.length).toBe(1);
      expect(page2.page).toBe(2);
      expect(page2.limit).toBe(2);
    });
  });

  describe('단계승인_상태변경_활동내역을_기록한다', () => {
    beforeEach(async () => {
      await 테스트데이터를_생성한다();
    });

    it('평가기준 설정 승인 활동 내역을 기록한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'criteria',
        status: StepApprovalStatus.APPROVED,
        updatedBy: performerId,
      };

      // When
      const result =
        await service.단계승인_상태변경_활동내역을_기록한다(params);

      // Then
      expect(result).toBeDefined();
      expect(result.activityType).toBe('step_approval');
      expect(result.activityAction).toBe('approved');
      expect(result.activityTitle).toBe('평가기준 설정 승인');
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(result.employeeId).toBe(employeeId);
      expect(result.performedBy).toBe(performerId);
      expect(result.activityMetadata).toBeDefined();
      expect(result.activityMetadata?.step).toBe('criteria');
      expect(result.activityMetadata?.status).toBe(StepApprovalStatus.APPROVED);
    });

    it('자기평가 승인 활동 내역을 기록한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'self',
        status: StepApprovalStatus.APPROVED,
        updatedBy: performerId,
      };

      // When
      const result =
        await service.단계승인_상태변경_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('자기평가 승인');
      expect(result.activityAction).toBe('approved');
    });

    it('1차 하향평가 승인 활동 내역을 기록한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'primary',
        status: StepApprovalStatus.APPROVED,
        updatedBy: performerId,
      };

      // When
      const result =
        await service.단계승인_상태변경_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('1차 하향평가 승인');
      expect(result.activityAction).toBe('approved');
    });

    it('2차 하향평가 승인 활동 내역을 기록한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'secondary',
        status: StepApprovalStatus.APPROVED,
        updatedBy: performerId,
        evaluatorId: 'evaluator-id',
      };

      // When
      const result =
        await service.단계승인_상태변경_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('2차 하향평가 승인');
      expect(result.activityAction).toBe('approved');
      expect(result.activityMetadata?.evaluatorId).toBe('evaluator-id');
    });

    it('평가기준 설정 재작성 요청 활동 내역을 기록한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'criteria',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment: '평가기준을 다시 작성해주세요.',
        updatedBy: performerId,
      };

      // When
      const result =
        await service.단계승인_상태변경_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('평가기준 설정 재작성 요청');
      expect(result.activityAction).toBe('revision_requested');
      expect(result.activityMetadata?.revisionComment).toBe(
        '평가기준을 다시 작성해주세요.',
      );
    });

    it('자기평가 재작성 요청 활동 내역을 기록한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'self',
        status: StepApprovalStatus.REVISION_REQUESTED,
        revisionComment: '자기평가를 수정해주세요.',
        updatedBy: performerId,
      };

      // When
      const result =
        await service.단계승인_상태변경_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('자기평가 재작성 요청');
      expect(result.activityAction).toBe('revision_requested');
    });

    it('기록하지 않는 상태로 변경 시 예외가 발생한다', async () => {
      // Given
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'criteria',
        status: StepApprovalStatus.PENDING,
        updatedBy: performerId,
      };

      // When & Then
      await expect(
        service.단계승인_상태변경_활동내역을_기록한다(params),
      ).rejects.toThrow('기록하지 않는 상태입니다');
    });
  });

  describe('재작성완료_활동내역을_기록한다', () => {
    beforeEach(async () => {
      await 테스트데이터를_생성한다();
    });

    it('평가기준 설정 재작성 완료 활동 내역을 기록한다', async () => {
      // Given
      const requestId = '123e4567-e89b-12d3-a456-426614174000';
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'criteria' as RevisionRequestStepType,
        requestId,
        performedBy: performerId,
        responseComment: '재작성 완료했습니다.',
        allCompleted: true,
      };

      // When
      const result = await service.재작성완료_활동내역을_기록한다(params);

      // Then
      expect(result).toBeDefined();
      expect(result.activityType).toBe('revision_request');
      expect(result.activityAction).toBe('revision_completed');
      expect(result.activityTitle).toBe('평가기준 설정 재작성 완료');
      expect(result.relatedEntityType).toBe('revision_request');
      expect(result.relatedEntityId).toBe(requestId);
      expect(result.performedBy).toBe(performerId);
      expect(result.activityMetadata?.step).toBe('criteria');
      expect(result.activityMetadata?.responseComment).toBe(
        '재작성 완료했습니다.',
      );
      expect(result.activityMetadata?.allCompleted).toBe(true);
    });

    it('자기평가 재작성 완료 활동 내역을 기록한다', async () => {
      // Given
      const requestId = '123e4567-e89b-12d3-a456-426614174001';
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'self' as RevisionRequestStepType,
        requestId,
        performedBy: performerId,
        responseComment: '자기평가 재작성 완료',
        allCompleted: false,
      };

      // When
      const result = await service.재작성완료_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('자기평가 재작성 완료');
      expect(result.activityMetadata?.allCompleted).toBe(false);
    });

    it('1차 하향평가 재작성 완료 활동 내역을 기록한다', async () => {
      // Given
      const requestId = '123e4567-e89b-12d3-a456-426614174002';
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'primary' as RevisionRequestStepType,
        requestId,
        performedBy: performerId,
        responseComment: '1차 하향평가 재작성 완료',
        allCompleted: true,
      };

      // When
      const result = await service.재작성완료_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('1차 하향평가 재작성 완료');
    });

    it('2차 하향평가 재작성 완료 활동 내역을 기록한다', async () => {
      // Given
      const requestId = '123e4567-e89b-12d3-a456-426614174003';
      const params = {
        evaluationPeriodId,
        employeeId,
        step: 'secondary' as RevisionRequestStepType,
        requestId,
        performedBy: performerId,
        responseComment: '2차 하향평가 재작성 완료',
        allCompleted: true,
      };

      // When
      const result = await service.재작성완료_활동내역을_기록한다(params);

      // Then
      expect(result.activityTitle).toBe('2차 하향평가 재작성 완료');
    });
  });
});
