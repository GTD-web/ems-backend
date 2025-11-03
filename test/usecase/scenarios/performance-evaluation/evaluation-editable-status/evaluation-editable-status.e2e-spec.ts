import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';

/**
 * 평가 수정가능 상태 변경 및 대시보드 반영 검증 시나리오
 *
 * 테스트 목적:
 * - 평가 수정가능 상태 변경 API가 올바르게 동작하는지 검증
 * - 대시보드 API에서 변경된 상태가 올바르게 반영되는지 검증
 * - 각 평가 타입(self, primary, secondary)이 독립적으로 변경되는지 검증
 * - 순차적 상태 변경 시나리오 검증
 * - 여러 직원의 상태 변경 시 서로 영향이 없는지 검증
 */
describe('평가 수정가능 상태 변경 및 대시보드 반영 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let dashboardApiClient: DashboardApiClient;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    dashboardApiClient = new DashboardApiClient(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 3,
    });

    employeeIds = seedResult.employeeIds || [];

    if (employeeIds.length === 0) {
      throw new Error('시드 데이터 생성 실패: 직원이 생성되지 않았습니다.');
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '평가 수정가능 상태 변경 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가 수정가능 상태 변경 및 대시보드 반영 검증 E2E 테스트용 평가기간',
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

    const evaluationPeriod =
      await evaluationPeriodScenario.평가기간을_생성한다(createData);
    evaluationPeriodId = evaluationPeriod.id;

    // 평가기간 시작
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(HttpStatus.OK);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      if (evaluationPeriodId) {
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(HttpStatus.OK);

        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      }
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  /**
   * 평가 수정가능 상태를 변경하는 헬퍼 함수
   */
  async function updateEvaluationEditableStatus(
    mappingId: string,
    evaluationType: 'self' | 'primary' | 'secondary' | 'all',
    isEditable: boolean,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/evaluation-editable-status/${mappingId}`,
      )
      .query({
        evaluationType,
        isEditable: isEditable.toString(),
      })
      .expect(HttpStatus.OK);

    return response.body;
  }

  describe('자기평가 수정가능 상태 변경 검증', () => {
    it('자기평가 수정가능 상태를 변경하고 대시보드에 반영되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];

      console.log(
        '\n📍 자기평가 수정가능 상태 변경 검증 시작',
      );

      // 1. 평가기간-직원 맵핑 ID 조회 및 초기값 확인
      console.log('\n📍 1단계: 평가기간-직원 맵핑 ID 조회 및 초기값 확인');
      const 초기현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      expect(Array.isArray(초기현황)).toBe(true);

      const 직원정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );
      expect(직원정보).toBeDefined();
      expect(직원정보.mappingId).toBeDefined();

      const mappingId = 직원정보.mappingId;

      // 초기 editableStatus 값 확인
      expect(직원정보.evaluationPeriod).toBeDefined();
      expect(직원정보.evaluationPeriod.editableStatus).toBeDefined();
      expect(직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable).toBe(
        false,
      ); // 기본값
      expect(
        직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false); // 기본값
      expect(
        직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false); // 기본값

      console.log('✅ 초기값 확인 완료 (모두 false)');

      // 2. 자기평가 수정가능으로 변경
      console.log('\n📍 2단계: 자기평가 수정가능으로 변경');
      const 변경응답 = await updateEvaluationEditableStatus(
        mappingId,
        'self',
        true,
      );

      expect(변경응답.id).toBe(mappingId);
      expect(변경응답.isSelfEvaluationEditable).toBe(true);
      expect(변경응답.isPrimaryEvaluationEditable).toBe(false); // 변경되지 않음
      expect(변경응답.isSecondaryEvaluationEditable).toBe(false); // 변경되지 않음

      console.log('✅ 자기평가 수정가능으로 변경 완료');

      // 3. 대시보드 전체 직원 현황 조회 검증
      console.log(
        '\n📍 3단계: 대시보드 전체 직원 현황 조회 검증',
      );
      const 전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(변경된직원정보.evaluationPeriod.editableStatus).toBeDefined();
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false); // 변경되지 않음
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false); // 변경되지 않음

      console.log('✅ 대시보드 전체 직원 현황 검증 완료');

      // 4. 개별 직원 평가기간 현황 조회 검증
      console.log(
        '\n📍 4단계: 개별 직원 평가기간 현황 조회 검증',
      );
      const 개별현황 =
        await dashboardApiClient.getEmployeeEvaluationPeriodStatus({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(개별현황.employeeId).toBe(testEmployeeId);
      expect(개별현황.evaluationPeriod.editableStatus).toBeDefined();
      expect(
        개별현황.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true);
      expect(
        개별현황.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false); // 변경되지 않음
      expect(
        개별현황.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false); // 변경되지 않음

      console.log('✅ 개별 직원 평가기간 현황 검증 완료');

      // 5. 직원 할당 데이터 조회 검증
      console.log(
        '\n📍 5단계: 직원 할당 데이터 조회 검증',
      );
      const 할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(할당데이터.employee.id).toBe(testEmployeeId);
      expect(할당데이터.editableStatus).toBeDefined();
      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        false,
      ); // 변경되지 않음
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        false,
      ); // 변경되지 않음

      console.log('✅ 직원 할당 데이터 검증 완료');

      // 6. 자기평가 수정불가로 변경
      console.log('\n📍 6단계: 자기평가 수정불가로 변경');
      const 수정불가응답 = await updateEvaluationEditableStatus(
        mappingId,
        'self',
        false,
      );

      expect(수정불가응답.isSelfEvaluationEditable).toBe(false);

      // 7. 대시보드 전체 직원 현황 조회 재검증
      const 재조회현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 수정불가직원정보 = 재조회현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        수정불가직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false);

      // 8. 개별 직원 평가기간 현황 조회 재검증
      const 재조회개별현황 =
        await dashboardApiClient.getEmployeeEvaluationPeriodStatus({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(
        재조회개별현황.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false);

      // 9. 직원 할당 데이터 조회 재검증
      const 재조회할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(재조회할당데이터.editableStatus.isSelfEvaluationEditable).toBe(
        false,
      );

      console.log('✅ 자기평가 수정가능 상태 변경 검증 완료');
    });
  });

  describe('1차평가 수정가능 상태 변경 검증', () => {
    it('1차평가 수정가능 상태를 변경하고 대시보드에 반영되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];

      console.log(
        '\n📍 1차평가 수정가능 상태 변경 검증 시작',
      );

      // 1. 맵핑 ID 조회
      const 초기현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 직원정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );
      const mappingId = 직원정보.mappingId;

      // 2. 1차평가 수정가능으로 변경
      const 변경응답 = await updateEvaluationEditableStatus(
        mappingId,
        'primary',
        true,
      );

      expect(변경응답.isPrimaryEvaluationEditable).toBe(true);
      expect(변경응답.isSelfEvaluationEditable).toBe(false); // 변경되지 않음
      expect(변경응답.isSecondaryEvaluationEditable).toBe(false); // 변경되지 않음

      // 3. 대시보드 검증
      const 전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false); // 변경되지 않음
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false); // 변경되지 않음

      const 개별현황 =
        await dashboardApiClient.getEmployeeEvaluationPeriodStatus({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(
        개별현황.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true);

      const 할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(
        false,
      ); // 변경되지 않음
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        false,
      ); // 변경되지 않음

      // 4. 1차평가 수정불가로 변경
      await updateEvaluationEditableStatus(mappingId, 'primary', false);

      // 5. 재검증
      const 재조회현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 수정불가직원정보 = 재조회현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        수정불가직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false);

      console.log('✅ 1차평가 수정가능 상태 변경 검증 완료');
    });
  });

  describe('2차평가 수정가능 상태 변경 검증', () => {
    it('2차평가 수정가능 상태를 변경하고 대시보드에 반영되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];

      console.log(
        '\n📍 2차평가 수정가능 상태 변경 검증 시작',
      );

      // 1. 맵핑 ID 조회
      const 초기현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 직원정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );
      const mappingId = 직원정보.mappingId;

      // 2. 2차평가 수정가능으로 변경
      const 변경응답 = await updateEvaluationEditableStatus(
        mappingId,
        'secondary',
        true,
      );

      expect(변경응답.isSecondaryEvaluationEditable).toBe(true);
      expect(변경응답.isSelfEvaluationEditable).toBe(false); // 변경되지 않음
      expect(변경응답.isPrimaryEvaluationEditable).toBe(false); // 변경되지 않음

      // 3. 대시보드 검증
      const 전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false); // 변경되지 않음
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false); // 변경되지 않음

      const 할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        true,
      );

      // 4. 2차평가 수정불가로 변경
      await updateEvaluationEditableStatus(mappingId, 'secondary', false);

      // 5. 재검증
      const 재조회현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 수정불가직원정보 = 재조회현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        수정불가직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false);

      console.log('✅ 2차평가 수정가능 상태 변경 검증 완료');
    });
  });

  describe('전체 평가 수정가능 상태 일괄 변경 검증', () => {
    it('전체 평가 수정가능 상태를 일괄 변경하고 대시보드에 반영되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];

      console.log(
        '\n📍 전체 평가 수정가능 상태 일괄 변경 검증 시작',
      );

      // 1. 맵핑 ID 조회
      const 초기현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 직원정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );
      const mappingId = 직원정보.mappingId;

      // 2. 전체 평가 수정가능으로 변경
      const 변경응답 = await updateEvaluationEditableStatus(
        mappingId,
        'all',
        true,
      );

      expect(변경응답.isSelfEvaluationEditable).toBe(true);
      expect(변경응답.isPrimaryEvaluationEditable).toBe(true);
      expect(변경응답.isSecondaryEvaluationEditable).toBe(true);

      // 3. 대시보드 검증
      const 전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(true);

      const 개별현황 =
        await dashboardApiClient.getEmployeeEvaluationPeriodStatus({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(
        개별현황.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true);
      expect(
        개별현황.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true);
      expect(
        개별현황.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(true);

      const 할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        true,
      );
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        true,
      );

      // 4. 전체 평가 수정불가로 변경
      await updateEvaluationEditableStatus(mappingId, 'all', false);

      // 5. 재검증
      const 재조회현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 수정불가직원정보 = 재조회현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        수정불가직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false);
      expect(
        수정불가직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false);
      expect(
        수정불가직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false);

      const 재조회할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(재조회할당데이터.editableStatus.isSelfEvaluationEditable).toBe(
        false,
      );
      expect(재조회할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        false,
      );
      expect(재조회할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        false,
      );

      console.log('✅ 전체 평가 수정가능 상태 일괄 변경 검증 완료');
    });
  });

  describe('순차적 상태 변경 및 대시보드 일관성 검증', () => {
    it('순차적으로 평가 수정가능 상태를 변경하고 대시보드에서 올바르게 반영되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];

      console.log(
        '\n📍 순차적 상태 변경 및 대시보드 일관성 검증 시작',
      );

      // 1. 맵핑 ID 조회
      const 초기현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 직원정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );
      const mappingId = 직원정보.mappingId;

      // 1단계: 자기평가만 수정가능 설정
      console.log('\n📍 1단계: 자기평가만 수정가능 설정');
      await updateEvaluationEditableStatus(mappingId, 'self', true);

      let 전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      let 변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false); // 기본값
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false); // 기본값

      let 할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        false,
      ); // 기본값
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        false,
      ); // 기본값

      // 2단계: 1차평가 추가 수정가능 설정
      console.log('\n📍 2단계: 1차평가 추가 수정가능 설정');
      await updateEvaluationEditableStatus(mappingId, 'primary', true);

      전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false); // 기본값

      할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(true); // 유지
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        true,
      );
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        false,
      ); // 기본값

      // 3단계: 2차평가 추가 수정가능 설정
      console.log('\n📍 3단계: 2차평가 추가 수정가능 설정');
      await updateEvaluationEditableStatus(mappingId, 'secondary', true);

      전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(true);

      할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(true); // 유지
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        true,
      ); // 유지
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        true,
      );

      // 4단계: 순차적 잠금 - 자기평가 수정불가 설정
      console.log('\n📍 4단계: 순차적 잠금 - 자기평가 수정불가 설정');
      await updateEvaluationEditableStatus(mappingId, 'self', false);

      전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(true); // 유지

      할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(false);
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        true,
      ); // 유지
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        true,
      ); // 유지

      // 5단계: 순차적 잠금 - 1차평가 수정불가 설정
      console.log('\n📍 5단계: 순차적 잠금 - 1차평가 수정불가 설정');
      await updateEvaluationEditableStatus(mappingId, 'primary', false);

      전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false);
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(true); // 유지

      할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(false); // 유지
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        false,
      );
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        true,
      ); // 유지

      // 6단계: 순차적 잠금 - 2차평가 수정불가 설정
      console.log('\n📍 6단계: 순차적 잠금 - 2차평가 수정불가 설정');
      await updateEvaluationEditableStatus(mappingId, 'secondary', false);

      전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      변경된직원정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId,
      );

      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(false); // 유지
      expect(
        변경된직원정보.evaluationPeriod.editableStatus.isSecondaryEvaluationEditable,
      ).toBe(false);

      할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      expect(할당데이터.editableStatus.isSelfEvaluationEditable).toBe(false); // 유지
      expect(할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        false,
      ); // 유지
      expect(할당데이터.editableStatus.isSecondaryEvaluationEditable).toBe(
        false,
      );

      console.log('✅ 순차적 상태 변경 및 대시보드 일관성 검증 완료');
    });
  });

  describe('여러 직원의 상태 변경 및 대시보드 일관성 검증', () => {
    it('여러 직원의 평가 수정가능 상태를 독립적으로 변경할 수 있어야 한다', async () => {
      if (employeeIds.length < 2) {
        console.log(
          '⚠️ 충분한 직원이 생성되지 않아 테스트를 건너뜁니다.',
        );
        return;
      }

      const testEmployeeId1 = employeeIds[0];
      const testEmployeeId2 = employeeIds[1];

      console.log(
        '\n📍 여러 직원의 상태 변경 및 대시보드 일관성 검증 시작',
      );

      // 1. 맵핑 ID 조회
      const 초기현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      const 직원1정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId1,
      );
      const 직원2정보 = 초기현황.find(
        (item: any) => item.employeeId === testEmployeeId2,
      );

      const mappingId1 = 직원1정보.mappingId;
      const mappingId2 = 직원2정보.mappingId;

      // 2. 직원 1의 상태 변경
      console.log('\n📍 직원 1의 상태 변경');
      await updateEvaluationEditableStatus(mappingId1, 'self', true);

      let 전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      let 변경된직원1정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId1,
      );
      let 변경된직원2정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId2,
      );

      expect(
        변경된직원1정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true);
      expect(
        변경된직원2정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(false); // 기본값, 변경되지 않음

      // 3. 직원 2의 상태 변경
      console.log('\n📍 직원 2의 상태 변경');
      await updateEvaluationEditableStatus(mappingId2, 'primary', true);

      전체현황 =
        await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      변경된직원1정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId1,
      );
      변경된직원2정보 = 전체현황.find(
        (item: any) => item.employeeId === testEmployeeId2,
      );

      expect(
        변경된직원1정보.evaluationPeriod.editableStatus.isSelfEvaluationEditable,
      ).toBe(true); // 유지
      expect(
        변경된직원2정보.evaluationPeriod.editableStatus.isPrimaryEvaluationEditable,
      ).toBe(true);

      // 4. 직원 1 할당 데이터 조회
      const 직원1할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId1,
        });

      expect(직원1할당데이터.editableStatus.isSelfEvaluationEditable).toBe(
        true,
      ); // 직원 1 설정 유지

      // 5. 직원 2 할당 데이터 조회
      const 직원2할당데이터 =
        await dashboardApiClient.getEmployeeAssignedData({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId2,
        });

      expect(직원2할당데이터.editableStatus.isPrimaryEvaluationEditable).toBe(
        true,
      ); // 직원 2 설정 반영

      console.log('✅ 여러 직원의 상태 변경 및 대시보드 일관성 검증 완료');
    });
  });
});

