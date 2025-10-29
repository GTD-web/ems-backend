import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';

/**
 * 평가기간 수정 E2E 테스트
 * 
 * 시나리오:
 * - 기본 정보 수정 (PATCH /admin/evaluation-periods/{id}/basic-info)
 * - 시작일 수정 (PATCH /admin/evaluation-periods/{id}/start-date)
 * - 평가설정 마감일 수정 (PATCH /admin/evaluation-periods/{id}/evaluation-setup-deadline)
 * - 업무수행 마감일 수정 (PATCH /admin/evaluation-periods/{id}/performance-deadline)
 * - 자기평가 마감일 수정 (PATCH /admin/evaluation-periods/{id}/self-evaluation-deadline)
 * - 하향/동료평가 마감일 수정 (PATCH /admin/evaluation-periods/{id}/peer-evaluation-deadline)
 * - 등급구간 수정 (PATCH /admin/evaluation-periods/{id}/grade-ranges)
 * - 권한설정 수정 (각종 settings 엔드포인트들)
 */
describe('평가기간 수정 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let apiClient: EvaluationPeriodManagementApiClient;

  let evaluationPeriodId: string;
  let employeeIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    apiClient = new EvaluationPeriodManagementApiClient(testSuite);

    // 시드 데이터 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];

    // 테스트용 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '수정 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '수정 테스트용',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const result = await apiClient.createEvaluationPeriod(createData); 
    evaluationPeriodId = result.id;
    
    console.log(`📝 테스트용 평가기간 생성 완료: ${result.name} (${result.id})`);
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        await apiClient.deleteEvaluationPeriod(evaluationPeriodId);
      } catch (error) {
        console.log('평가기간 삭제 중 오류 (이미 삭제됨):', error.message);
      }
    }
    
    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('평가기간 수정', () => {
    it('평가기간 기본 정보를 수정한다', async () => {
      const updateData = {
        name: '수정 테스트용 평가기간 (수정됨)',
        description: 'E2E 테스트용 평가기간 - 기본정보 수정',
        maxSelfEvaluationRate: 130,
      };

      const result = await apiClient.updateEvaluationPeriodBasicInfo(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.maxSelfEvaluationRate).toBe(updateData.maxSelfEvaluationRate);

      console.log('✅ 평가기간 기본 정보 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(result.name).toBe('수정 테스트용 평가기간 (수정됨)');
      expect(result.description).toBe('E2E 테스트용 평가기간 - 기본정보 수정');
      expect(result.maxSelfEvaluationRate).toBe(130);
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('평가기간 시작일을 수정한다', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const updateData = {
        startDate: tomorrow.toISOString(),
      };

      const result = await apiClient.updateEvaluationPeriodStartDate(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.startDate)).toEqual(tomorrow);

      console.log('✅ 평가기간 시작일 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.startDate)).toBeDefined();
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('평가설정 단계 마감일을 수정한다', async () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const updateData = {
        evaluationSetupDeadline: nextWeek.toISOString(),
      };

      const result = await apiClient.updateEvaluationSetupDeadline(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.evaluationSetupDeadline)).toEqual(nextWeek);

      console.log('✅ 평가설정 단계 마감일 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.evaluationSetupDeadline)).toBeDefined();
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('업무 수행 단계 마감일을 수정한다', async () => {
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const updateData = {
        performanceDeadline: twoWeeksLater.toISOString(),
      };

      const result = await apiClient.updatePerformanceDeadline(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.performanceDeadline)).toEqual(twoWeeksLater);

      console.log('✅ 업무 수행 단계 마감일 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.performanceDeadline)).toBeDefined();
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('자기 평가 단계 마감일을 수정한다', async () => {
      const threeWeeksLater = new Date();
      threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

      const updateData = {
        selfEvaluationDeadline: threeWeeksLater.toISOString(),
      };

      const result = await apiClient.updateSelfEvaluationDeadline(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.selfEvaluationDeadline)).toEqual(threeWeeksLater);

      console.log('✅ 자기 평가 단계 마감일 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.selfEvaluationDeadline)).toBeDefined();
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('하향/동료평가 단계 마감일을 수정한다', async () => {
      const fourWeeksLater = new Date();
      fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);

      const updateData = {
        peerEvaluationDeadline: fourWeeksLater.toISOString(),
      };

      const result = await apiClient.updatePeerEvaluationDeadline(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.peerEvaluationDeadline)).toEqual(fourWeeksLater);

      console.log('✅ 하향/동료평가 단계 마감일 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(new Date(result.peerEvaluationDeadline)).toBeDefined();
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('평가기간 등급 구간을 수정한다', async () => {
      const updateData = {
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 90, maxRange: 94 },
          { grade: 'A', minRange: 85, maxRange: 89 },
          { grade: 'B+', minRange: 80, maxRange: 84 },
          { grade: 'B', minRange: 75, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 74 },
        ],
      };

      const result = await apiClient.updateEvaluationPeriodGradeRanges(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.gradeRanges).toHaveLength(7);
      expect(result.gradeRanges[0].grade).toBe('S+');
      expect(result.gradeRanges[0].minRange).toBe(98);

      console.log('✅ 평가기간 등급 구간 수정 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(result.gradeRanges).toHaveLength(7);
      expect(result.gradeRanges[0].grade).toBe('S+');
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('평가 기준 설정 수동 허용을 변경한다', async () => {
      const updateData = {
        allowManualSetting: true,
      };

      const result = await apiClient.updateCriteriaSettingPermission(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      // 직접 필드로 검증
      expect(result.criteriaSettingEnabled).toBe(true);

      console.log('✅ 평가 기준 설정 수동 허용 변경 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      // 직접 필드로 검증
      expect(result.criteriaSettingEnabled).toBe(true);
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('자기 평가 설정 수동 허용을 변경한다', async () => {
      const updateData = {
        allowManualSetting: true,
      };

      const result = await apiClient.updateSelfEvaluationSettingPermission(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.selfEvaluationSettingEnabled).toBe(true);

      console.log('✅ 자기 평가 설정 수동 허용 변경 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(result.selfEvaluationSettingEnabled).toBe(true);
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('최종 평가 설정 수동 허용을 변경한다', async () => {
      const updateData = {
        allowManualSetting: true,
      };

      const result = await apiClient.updateFinalEvaluationPermission(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.finalEvaluationSettingEnabled).toBe(true);

      console.log('✅ 최종 평가 설정 수동 허용 변경 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(result.finalEvaluationSettingEnabled).toBe(true);
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });

    it('전체 수동 허용 설정을 변경한다', async () => {
      const updateData = {
        allowCriteriaManualSetting: false,
        allowSelfEvaluationManualSetting: false,
        allowFinalEvaluationManualSetting: false,
      };

      const result = await apiClient.updateManualSettingPermissions(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.criteriaSettingEnabled).toBe(false);
      expect(result.selfEvaluationSettingEnabled).toBe(false);
      expect(result.finalEvaluationSettingEnabled).toBe(false);

      console.log('✅ 전체 수동 허용 설정 변경 완료');
    });

    it('수정된 평가기간 상세를 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);
      
      expect(result.id).toBe(evaluationPeriodId);
      expect(result.criteriaSettingEnabled).toBe(false);
      expect(result.selfEvaluationSettingEnabled).toBe(false);
      expect(result.finalEvaluationSettingEnabled).toBe(false);
      
      console.log('✅ 수정된 평가기간 상세 조회 완료');
    });
  });


});
