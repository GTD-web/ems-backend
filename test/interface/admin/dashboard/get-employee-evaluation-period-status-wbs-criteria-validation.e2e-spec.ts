import { INestApplication, HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status - WBS 평가기준 완료 상태 검증', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('WBS 평가기준 상태 검증 - 모든 WBS에 평가기준이 있는 경우 (complete)', () => {
    let seedDataResponse: any;
    let evaluationPeriodId: string;
    let employeeIds: string[];

    beforeAll(async () => {
      console.log('===== 1. 시드 데이터 생성 (모든 WBS에 평가기준 설정) =====');

      // 기존 데이터 정리
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect(HttpStatus.OK);

      console.log('기존 데이터 정리 완료');

      // 시드 데이터 생성 (full 시나리오 - 모든 WBS에 평가기준 생성됨)
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 5,
            projectCount: 3,
            wbsPerProject: 10,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // WBS당 평가기준 개수 (각 WBS마다 2-5개의 평가기준 생성)
            wbsCriteriaPerWbs: {
              min: 2,
              max: 5,
            },
            // 자기평가 일부 완료 상태로 설정 (테스트 데이터 다양성)
            selfEvaluationProgress: {
              completed: 0.6,
              inProgress: 0.3,
              notStarted: 0.1,
            },
          },
        })
        .expect(HttpStatus.CREATED);

      seedDataResponse = seedResponse.body;
      console.log('시드 데이터 생성 완료:', {
        success: seedDataResponse.success,
        message: seedDataResponse.message,
        duration: seedDataResponse.totalDuration,
      });

      // 생성된 데이터 확인
      expect(seedDataResponse.success).toBe(true);
      expect(seedDataResponse.results).toBeDefined();

      // 평가기간 ID 조회
      const periods = await dataSource.query(`
        SELECT id FROM evaluation_period 
        WHERE "deletedAt" IS NULL 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `);
      expect(periods.length).toBeGreaterThan(0);
      evaluationPeriodId = periods[0].id;

      // 직원 ID 조회 (평가기간에 등록된 직원)
      const employees = await dataSource.query(`
        SELECT DISTINCT "employeeId" as employee_id
        FROM evaluation_period_employee_mapping 
        WHERE "evaluationPeriodId" = $1 
          AND "isExcluded" = false 
          AND "deletedAt" IS NULL
        LIMIT 5
      `, [evaluationPeriodId]);
      
      expect(employees.length).toBeGreaterThan(0);
      employeeIds = employees.map((e: any) => e.employee_id);

      console.log(`평가기간 ID: ${evaluationPeriodId}`);
      console.log(`테스트 직원 수: ${employeeIds.length}`);
    });

    it('모든 WBS에 평가기준이 설정된 직원은 wbsCriteria.status가 complete여야 함', async () => {
      console.log('\n===== 테스트: 모든 WBS에 평가기준이 있는 경우 =====');

      for (const employeeId of employeeIds) {
        // WBS 할당 조회
        const wbsAssignments = await dataSource.query(`
          SELECT "wbsItemId" as wbs_item_id
          FROM evaluation_wbs_assignment 
          WHERE "periodId" = $1 
            AND "employeeId" = $2 
            AND "deletedAt" IS NULL
        `, [evaluationPeriodId, employeeId]);

        if (wbsAssignments.length === 0) {
          console.log(`  직원 ${employeeId}: WBS 할당 없음 (스킵)`);
          continue;
        }

        const wbsItemIds = wbsAssignments.map((w: any) => w.wbs_item_id);

        // 각 WBS에 평가기준이 있는지 확인
        const wbsWithCriteria = await dataSource.query(`
          SELECT DISTINCT "wbsItemId" as wbs_item_id
          FROM wbs_evaluation_criteria 
          WHERE "wbsItemId" = ANY($1::uuid[])
            AND "deletedAt" IS NULL
        `, [wbsItemIds]);

        const hasAllCriteria = wbsWithCriteria.length === wbsAssignments.length;

        console.log(`  직원 ${employeeId}:`);
        console.log(`    - 할당된 WBS: ${wbsAssignments.length}개`);
        console.log(`    - 평가기준이 있는 WBS: ${wbsWithCriteria.length}개`);
        console.log(`    - 모든 WBS에 평가기준 있음: ${hasAllCriteria}`);

        // API 호출
        const response = await testSuite
          .request()
          .get(`/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`)
          .expect(HttpStatus.OK);

        const status = response.body;

        // 검증
        expect(status).toBeDefined();
        expect(status.wbsCriteria).toBeDefined();
        expect(status.wbsCriteria.wbsWithCriteriaCount).toBe(wbsWithCriteria.length);

        if (hasAllCriteria && wbsAssignments.length > 0) {
          // 모든 WBS에 평가기준이 있으면 complete
          expect(status.wbsCriteria.status).toBe('complete');
          console.log(`    ✅ wbsCriteria.status = 'complete' (예상대로)`);
        } else if (wbsWithCriteria.length > 0) {
          // 일부만 평가기준이 있으면 in_progress
          expect(status.wbsCriteria.status).toBe('in_progress');
          console.log(`    ✅ wbsCriteria.status = 'in_progress' (예상대로)`);
        } else {
          // 평가기준이 없으면 none
          expect(status.wbsCriteria.status).toBe('none');
          console.log(`    ✅ wbsCriteria.status = 'none' (예상대로)`);
        }

        // WBS별 평가기준 개수 상세 로그
        for (const wbsItemId of wbsItemIds.slice(0, 3)) { // 처음 3개만 샘플로 로그
          const criteriaCount = await dataSource.query(`
            SELECT COUNT(*) as count
            FROM wbs_evaluation_criteria 
            WHERE "wbsItemId" = $1 
              AND "deletedAt" IS NULL
          `, [wbsItemId]);
          console.log(`      WBS ${wbsItemId.substring(0, 8)}...: 평가기준 ${criteriaCount[0].count}개`);
        }
      }
    });

    it('wbsWithCriteriaCount는 평가기준이 있는 고유한 WBS 개수와 일치해야 함', async () => {
      console.log('\n===== 테스트: wbsWithCriteriaCount 정확성 검증 =====');

      const employeeId = employeeIds[0];

      // API 호출
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`)
        .expect(HttpStatus.OK);

      const status = response.body;

      // DB에서 직접 계산
      const wbsAssignments = await dataSource.query(`
        SELECT "wbsItemId" as wbs_item_id
        FROM evaluation_wbs_assignment 
        WHERE "periodId" = $1 
          AND "employeeId" = $2 
          AND "deletedAt" IS NULL
      `, [evaluationPeriodId, employeeId]);

      const wbsItemIds = wbsAssignments.map((w: any) => w.wbs_item_id);

      const distinctWbsWithCriteria = await dataSource.query(`
        SELECT DISTINCT "wbsItemId" as wbs_item_id
        FROM wbs_evaluation_criteria 
        WHERE "wbsItemId" = ANY($1::uuid[])
          AND "deletedAt" IS NULL
      `, [wbsItemIds]);

      const expectedCount = distinctWbsWithCriteria.length;
      const actualCount = status.wbsCriteria.wbsWithCriteriaCount;

      console.log(`  예상 개수 (DISTINCT wbsItemId): ${expectedCount}`);
      console.log(`  API 응답 개수: ${actualCount}`);

      expect(actualCount).toBe(expectedCount);
      console.log('  ✅ wbsWithCriteriaCount 일치');

      // 각 WBS별 평가기준 개수 조회
      for (const wbsItemId of wbsItemIds.slice(0, 5)) {
        const criteria = await dataSource.query(`
          SELECT COUNT(*) as count
          FROM wbs_evaluation_criteria 
          WHERE "wbsItemId" = $1 
            AND "deletedAt" IS NULL
        `, [wbsItemId]);
        
        console.log(`    WBS ${wbsItemId.substring(0, 8)}...: ${criteria[0].count}개의 평가기준`);
      }
    });
  });

  describe('WBS 평가기준 상태 검증 - 일부 WBS에만 평가기준이 있는 경우 (in_progress)', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let wbsItemIds: string[];

    beforeAll(async () => {
      console.log('\n===== 2. 일부 WBS의 평가기준 삭제 (in_progress 상태 만들기) =====');

      // 평가기간 ID 조회
      const periods = await dataSource.query(`
        SELECT id FROM evaluation_period 
        WHERE "deletedAt" IS NULL 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `);
      evaluationPeriodId = periods[0].id;

      // 직원 ID 조회
      const employees = await dataSource.query(`
        SELECT DISTINCT "employeeId" as employee_id
        FROM evaluation_period_employee_mapping 
        WHERE "evaluationPeriodId" = $1 
          AND "isExcluded" = false 
          AND "deletedAt" IS NULL
        LIMIT 1
      `, [evaluationPeriodId]);
      
      employeeId = employees[0].employee_id;

      // 해당 직원의 WBS 할당 조회
      const wbsAssignments = await dataSource.query(`
        SELECT "wbsItemId" as wbs_item_id
        FROM evaluation_wbs_assignment 
        WHERE "periodId" = $1 
          AND "employeeId" = $2 
          AND "deletedAt" IS NULL
        ORDER BY "displayOrder"
      `, [evaluationPeriodId, employeeId]);

      wbsItemIds = wbsAssignments.map((w: any) => w.wbs_item_id);

      if (wbsItemIds.length < 2) {
        console.log('  WBS가 2개 미만이므로 테스트 스킵');
        return;
      }

      // 첫 번째 WBS의 평가기준을 삭제 (soft delete)
      const deleteWbsId = wbsItemIds[0];
      await dataSource.query(`
        UPDATE wbs_evaluation_criteria 
        SET "deletedAt" = NOW() 
        WHERE "wbsItemId" = $1
      `, [deleteWbsId]);

      console.log(`  WBS ${deleteWbsId.substring(0, 8)}...의 평가기준 삭제 완료`);
      console.log(`  총 WBS: ${wbsItemIds.length}개`);
      console.log(`  평가기준 있는 WBS: ${wbsItemIds.length - 1}개`);
    });

    it('일부 WBS에만 평가기준이 있으면 wbsCriteria.status가 in_progress여야 함', async () => {
      if (wbsItemIds.length < 2) {
        console.log('  테스트 스킵: WBS가 2개 미만');
        return;
      }

      console.log('\n===== 테스트: 일부 WBS만 평가기준 있는 경우 =====');

      // API 호출
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`)
        .expect(HttpStatus.OK);

      const status = response.body;

      // 검증
      expect(status.wbsCriteria).toBeDefined();
      expect(status.wbsCriteria.wbsWithCriteriaCount).toBe(wbsItemIds.length - 1);
      expect(status.wbsCriteria.status).toBe('in_progress');

      console.log(`  총 WBS 수: ${wbsItemIds.length}`);
      console.log(`  평가기준이 있는 WBS: ${status.wbsCriteria.wbsWithCriteriaCount}개`);
      console.log(`  상태: ${status.wbsCriteria.status}`);
      console.log('  ✅ in_progress 상태 확인');
    });
  });

  describe('WBS 평가기준 상태 검증 - 평가기준이 전혀 없는 경우 (none)', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n===== 3. 모든 평가기준 삭제 (none 상태 만들기) =====');

      // 평가기간 ID 조회
      const periods = await dataSource.query(`
        SELECT id FROM evaluation_period 
        WHERE "deletedAt" IS NULL 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `);
      evaluationPeriodId = periods[0].id;

      // 직원 ID 조회 (마지막 직원 사용)
      const employees = await dataSource.query(`
        SELECT DISTINCT "employeeId" as employee_id
        FROM evaluation_period_employee_mapping 
        WHERE "evaluationPeriodId" = $1 
          AND "isExcluded" = false 
          AND "deletedAt" IS NULL
        ORDER BY "employeeId" DESC
        LIMIT 1
      `, [evaluationPeriodId]);
      
      employeeId = employees[0].employee_id;

      // 해당 직원의 WBS 할당 조회
      const wbsAssignments = await dataSource.query(`
        SELECT "wbsItemId" as wbs_item_id
        FROM evaluation_wbs_assignment 
        WHERE "periodId" = $1 
          AND "employeeId" = $2 
          AND "deletedAt" IS NULL
      `, [evaluationPeriodId, employeeId]);

      const wbsItemIds = wbsAssignments.map((w: any) => w.wbs_item_id);

      // 모든 WBS의 평가기준을 삭제 (soft delete)
      for (const wbsItemId of wbsItemIds) {
        await dataSource.query(`
          UPDATE wbs_evaluation_criteria 
          SET "deletedAt" = NOW() 
          WHERE "wbsItemId" = $1
        `, [wbsItemId]);
      }

      console.log(`  총 ${wbsItemIds.length}개 WBS의 평가기준 모두 삭제 완료`);
    });

    it('평가기준이 전혀 없으면 wbsCriteria.status가 none이어야 함', async () => {
      console.log('\n===== 테스트: 평가기준이 전혀 없는 경우 =====');

      // API 호출
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`)
        .expect(HttpStatus.OK);

      const status = response.body;

      // 검증
      expect(status.wbsCriteria).toBeDefined();
      expect(status.wbsCriteria.wbsWithCriteriaCount).toBe(0);
      expect(status.wbsCriteria.status).toBe('none');

      console.log(`  평가기준이 있는 WBS: ${status.wbsCriteria.wbsWithCriteriaCount}개`);
      console.log(`  상태: ${status.wbsCriteria.status}`);
      console.log('  ✅ none 상태 확인');
    });
  });

  describe('평가자의 평가 대상자 현황 API 검증', () => {
    let evaluationPeriodId: string;
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n===== 4. 평가자의 평가 대상자 현황 API 테스트 준비 =====');

      // 새로운 시드 데이터 생성
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect(HttpStatus.OK);

      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 10,
            projectCount: 5,
            wbsPerProject: 8,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            wbsCriteriaPerWbs: {
              min: 3,
              max: 5,
            },
          },
        })
        .expect(HttpStatus.CREATED);

      expect(seedResponse.body.success).toBe(true);

      // 평가기간 ID 조회
      const periods = await dataSource.query(`
        SELECT id FROM evaluation_period 
        WHERE "deletedAt" IS NULL 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `);
      evaluationPeriodId = periods[0].id;

      // 평가자 ID 조회 (평가라인 매핑이 있는 평가자)
      const evaluators = await dataSource.query(`
        SELECT DISTINCT "evaluatorId" as evaluator_id
        FROM evaluation_line_mappings 
        WHERE "deletedAt" IS NULL
        LIMIT 1
      `);
      
      evaluatorId = evaluators[0].evaluator_id;

      console.log(`  평가기간 ID: ${evaluationPeriodId}`);
      console.log(`  평가자 ID: ${evaluatorId}`);
    });

    it('평가자의 평가 대상자 현황에서도 WBS 평가기준 상태가 정확해야 함', async () => {
      console.log('\n===== 테스트: 평가자의 평가 대상자 현황 WBS 평가기준 상태 =====');

      // API 호출
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`)
        .expect(HttpStatus.OK);

      const targets = response.body;

      expect(Array.isArray(targets)).toBe(true);
      expect(targets.length).toBeGreaterThan(0);

      console.log(`  평가 대상자 수: ${targets.length}`);

      // 각 평가 대상자의 WBS 평가기준 상태 검증
      for (const target of targets) {
        const employeeId = target.employeeId;

        // DB에서 직접 계산
        const wbsAssignments = await dataSource.query(`
          SELECT "wbsItemId" as wbs_item_id
          FROM evaluation_wbs_assignment 
          WHERE "periodId" = $1 
            AND "employeeId" = $2 
            AND "deletedAt" IS NULL
        `, [evaluationPeriodId, employeeId]);

        if (wbsAssignments.length === 0) {
          continue;
        }

        const wbsItemIds = wbsAssignments.map((w: any) => w.wbs_item_id);

        const distinctWbsWithCriteria = await dataSource.query(`
          SELECT DISTINCT "wbsItemId" as wbs_item_id
          FROM wbs_evaluation_criteria 
          WHERE "wbsItemId" = ANY($1::uuid[])
            AND "deletedAt" IS NULL
        `, [wbsItemIds]);

        const expectedCount = distinctWbsWithCriteria.length;
        const actualCount = target.wbsCriteria.wbsWithCriteriaCount;

        console.log(`  피평가자 ${employeeId.substring(0, 8)}...:`);
        console.log(`    - 할당된 WBS: ${wbsAssignments.length}개`);
        console.log(`    - 평가기준 있는 WBS (예상): ${expectedCount}개`);
        console.log(`    - 평가기준 있는 WBS (실제): ${actualCount}개`);
        console.log(`    - 상태: ${target.wbsCriteria.status}`);

        // 검증
        expect(actualCount).toBe(expectedCount);
        
        if (expectedCount === wbsAssignments.length && wbsAssignments.length > 0) {
          expect(target.wbsCriteria.status).toBe('complete');
          console.log('    ✅ complete 상태 확인');
        } else if (expectedCount > 0) {
          expect(target.wbsCriteria.status).toBe('in_progress');
          console.log('    ✅ in_progress 상태 확인');
        } else {
          expect(target.wbsCriteria.status).toBe('none');
          console.log('    ✅ none 상태 확인');
        }
      }
    });
  });
});


