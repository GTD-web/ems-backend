import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { WbsEvaluationCriteriaApiClient } from '../../api-clients/wbs-evaluation-criteria.api-client';

/**
 * 모든 WBS 평가기준 삭제 검증 시나리오
 *
 * 테스트 목적:
 * - 모든 WBS 평가기준을 한 번에 삭제하는 기능 검증
 * - id나 body 값 입력 없이 바로 삭제되는지 확인
 * - 삭제 후 조회 시 제외되는지 확인
 * - 삭제 후 새로운 평가기준 생성이 가능한지 확인
 */
describe('모든 WBS 평가기준 삭제 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let wbsEvaluationCriteriaApiClient: WbsEvaluationCriteriaApiClient;

  // 테스트용 데이터
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);

    // API 클라이언트 인스턴스 생성
    wbsEvaluationCriteriaApiClient = new WbsEvaluationCriteriaApiClient(
      testSuite,
    );
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

    wbsItemIds = seedResult.wbsItemIds || [];

    if (wbsItemIds.length === 0) {
      throw new Error('시드 데이터 생성 실패: WBS가 생성되지 않았습니다.');
    }
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  describe('성공 케이스', () => {
    it('여러 평가기준이 있을 때 모두 삭제할 수 있어야 한다', async () => {
      console.log('\n📍 모든 평가기준 삭제 테스트 시작');

      // Given: 여러 WBS 항목에 평가기준 생성
      const testWbsItemIds = wbsItemIds.slice(0, 3);
      const createdCriteriaIds: string[] = [];

      for (const wbsItemId of testWbsItemIds) {
        const criteria =
          await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
            wbsItemId,
            criteria: `테스트 평가기준 ${wbsItemId}`,
            importance: 5,
          });
        createdCriteriaIds.push(criteria.id);
      }

      console.log(`✅ ${createdCriteriaIds.length}개의 평가기준 생성 완료`);

      // 삭제 전 목록 조회
      const beforeDelete =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList();
      expect(beforeDelete.criteria).toBeDefined();
      expect(beforeDelete.criteria.length).toBeGreaterThanOrEqual(
        createdCriteriaIds.length,
      );

      console.log(`📊 삭제 전 평가기준 개수: ${beforeDelete.criteria.length}`);

      // When: 모든 평가기준 삭제
      await wbsEvaluationCriteriaApiClient.deleteAllWbsEvaluationCriteria();

      console.log('✅ 모든 평가기준 삭제 완료');

      // Then: 삭제 후 목록 조회 시 빈 배열 반환
      const afterDelete =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList();
      expect(afterDelete.criteria).toBeDefined();
      expect(afterDelete.criteria.length).toBe(0);

      console.log(`📊 삭제 후 평가기준 개수: ${afterDelete.criteria.length}`);
    });

    it('삭제된 평가기준은 조회 시 제외되어야 한다', async () => {
      console.log('\n📍 삭제된 평가기준 조회 제외 검증 시작');

      // Given: 평가기준 생성
      const testWbsItemId = wbsItemIds[0];
      const createdCriteria =
        await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
          wbsItemId: testWbsItemId,
          criteria: '삭제 테스트용 평가기준',
          importance: 5,
        });

      console.log(`✅ 평가기준 생성 완료 - ID: ${createdCriteria.id}`);

      // 삭제 전 상세 조회
      const beforeDelete =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaDetail(
          createdCriteria.id,
        );
      expect(beforeDelete).toBeDefined();
      expect(beforeDelete.id).toBe(createdCriteria.id);

      // When: 모든 평가기준 삭제
      await wbsEvaluationCriteriaApiClient.deleteAllWbsEvaluationCriteria();

      console.log('✅ 모든 평가기준 삭제 완료');

      // Then: 삭제된 평가기준은 상세 조회 시 빈 객체 반환
      const afterDelete =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaDetail(
          createdCriteria.id,
        );
      expect(afterDelete).toBeDefined();
      // 삭제된 평가기준은 빈 객체 또는 null 반환
      expect(Object.keys(afterDelete).length).toBe(0);

      console.log('✅ 삭제된 평가기준 조회 제외 확인');
    });

    it('평가기준이 없을 때도 정상 처리되어야 한다', async () => {
      console.log('\n📍 평가기준 없을 때 삭제 테스트 시작');

      // Given: 평가기준이 없는 상태 확인
      const beforeDelete =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList();
      expect(beforeDelete.criteria).toBeDefined();
      expect(beforeDelete.criteria.length).toBe(0);

      console.log('📊 삭제 전 평가기준 개수: 0');

      // When: 모든 평가기준 삭제 (평가기준이 없어도 에러 없이 처리)
      await wbsEvaluationCriteriaApiClient.deleteAllWbsEvaluationCriteria();

      console.log('✅ 평가기준 없을 때도 정상 처리됨');

      // Then: 여전히 빈 배열 반환
      const afterDelete =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList();
      expect(afterDelete.criteria).toBeDefined();
      expect(afterDelete.criteria.length).toBe(0);

      console.log('📊 삭제 후 평가기준 개수: 0');
    });

    it('삭제 후 새로운 평가기준 생성 및 조회가 가능해야 한다', async () => {
      console.log('\n📍 삭제 후 재생성 테스트 시작');

      // Given: 평가기준 생성 후 삭제
      const testWbsItemId = wbsItemIds[0];
      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
        wbsItemId: testWbsItemId,
        criteria: '삭제 전 평가기준',
        importance: 5,
      });

      await wbsEvaluationCriteriaApiClient.deleteAllWbsEvaluationCriteria();

      console.log('✅ 기존 평가기준 삭제 완료');

      // When: 새로운 평가기준 생성
      const newCriteria =
        await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
          wbsItemId: testWbsItemId,
          criteria: '삭제 후 재생성된 평가기준',
          importance: 7,
        });

      console.log(`✅ 새로운 평가기준 생성 완료 - ID: ${newCriteria.id}`);

      // Then: 새로 생성된 평가기준 조회 가능
      const criteriaList =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList();
      expect(criteriaList.criteria).toBeDefined();
      expect(criteriaList.criteria.length).toBe(1);
      expect(criteriaList.criteria[0].id).toBe(newCriteria.id);
      expect(criteriaList.criteria[0].criteria).toBe(
        '삭제 후 재생성된 평가기준',
      );
      expect(criteriaList.criteria[0].importance).toBe(7);

      console.log('✅ 삭제 후 재생성 및 조회 성공');
    });
  });
});
