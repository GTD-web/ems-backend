/**
 * 평가 대상자 등록 해제 - 실제 데이터 기반 E2E 테스트
 *
 * with_assignments 시나리오를 사용하여 평가 대상자 등록 해제 기능을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('DELETE /admin/evaluation-periods/.../targets - 평가 대상자 등록 해제 (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 시드 데이터 초기화
    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });

    // with_assignments 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'with_assignments',
        clearExisting: false,
      })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (with_assignments)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getRegisteredTarget() {
    const targets = await dataSource.query(
      `SELECT m."evaluationPeriodId", m."employeeId", e.name as employeeName, p.name as periodName
       FROM evaluation_period_employee_mapping m
       INNER JOIN employee e ON e.id = m."employeeId"
       INNER JOIN evaluation_period p ON p.id = m."evaluationPeriodId"
       WHERE m."deletedAt" IS NULL 
       AND e."deletedAt" IS NULL 
       AND p."deletedAt" IS NULL
       AND p.status IN ('waiting', 'in-progress')
       LIMIT 1`,
    );

    return targets.length > 0 ? targets[0] : null;
  }

  async function getMultipleRegisteredTargets(count: number) {
    const targets = await dataSource.query(
      `SELECT m."evaluationPeriodId", m."employeeId"
       FROM evaluation_period_employee_mapping m
       INNER JOIN employee e ON e.id = m."employeeId"
       INNER JOIN evaluation_period p ON p.id = m."evaluationPeriodId"
       WHERE m."deletedAt" IS NULL 
       AND e."deletedAt" IS NULL 
       AND p."deletedAt" IS NULL
       AND p.status IN ('waiting', 'in-progress')
       LIMIT $1`,
      [count],
    );

    return targets;
  }

  async function getPeriodWithTargets() {
    const periods = await dataSource.query(
      `SELECT p.id, p.name, COUNT(m.id) as target_count
       FROM evaluation_period p
       INNER JOIN evaluation_period_employee_mapping m 
         ON m."evaluationPeriodId" = p.id AND m."deletedAt" IS NULL
       WHERE p."deletedAt" IS NULL AND p.status IN ('waiting', 'in-progress')
       GROUP BY p.id, p.name
       HAVING COUNT(m.id) > 0
       LIMIT 1`,
    );

    return periods.length > 0 ? periods[0] : null;
  }

  async function checkMappingExists(periodId: string, employeeId: string) {
    const mappings = await dataSource.query(
      `SELECT * FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [periodId, employeeId],
    );

    return mappings.length > 0;
  }

  async function checkMappingDeleted(periodId: string, employeeId: string) {
    const mappings = await dataSource.query(
      `SELECT * FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NOT NULL`,
      [periodId, employeeId],
    );

    return mappings.length > 0;
  }

  async function getTargetCountForPeriod(periodId: string) {
    const result = await dataSource.query(
      `SELECT COUNT(*) as count FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "deletedAt" IS NULL`,
      [periodId],
    );

    return parseInt(result[0].count, 10);
  }

  // ==================== 테스트 케이스 ====================

  describe('시나리오 1: 단일 평가 대상자 등록 해제', () => {
    it('등록된 평가 대상자를 성공적으로 해제할 수 있어야 한다', async () => {
      const target = await getRegisteredTarget();

      if (!target) {
        console.log('등록된 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);

      console.log('\n✅ 평가 대상자 등록 해제 성공');
    });

    it('해제 후 조회 시 해당 맵핑이 조회되지 않아야 한다', async () => {
      const target = await getRegisteredTarget();

      if (!target) {
        console.log('등록된 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // When - 등록 해제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}`,
        )
        .expect(HttpStatus.OK);

      // Then - 조회 시 결과 없음
      const exists = await checkMappingExists(
        target.evaluationPeriodId,
        target.employeeId,
      );
      expect(exists).toBe(false);

      console.log('\n✅ 해제 후 맵핑 조회되지 않음 검증 성공');
    });

    it('소프트 삭제로 동작하여 deletedAt이 설정되어야 한다', async () => {
      const target = await getRegisteredTarget();

      if (!target) {
        console.log('등록된 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}`,
        )
        .expect(HttpStatus.OK);

      // Then - deletedAt 확인
      const isDeleted = await checkMappingDeleted(
        target.evaluationPeriodId,
        target.employeeId,
      );
      expect(isDeleted).toBe(true);

      console.log('\n✅ 소프트 삭제 검증 성공');
    });

    it('이미 해제된 대상자를 다시 해제하려고 하면 404 에러가 발생해야 한다', async () => {
      const target = await getRegisteredTarget();

      if (!target) {
        console.log('등록된 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // 먼저 해제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}`,
        )
        .expect(HttpStatus.OK);

      // When & Then - 재해제 시도
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 중복 해제 방지 검증 성공');
    });
  });

  describe('시나리오 2: 모든 평가 대상자 등록 해제', () => {
    it('평가기간의 모든 대상자를 성공적으로 해제할 수 있어야 한다', async () => {
      const period = await getPeriodWithTargets();

      if (!period) {
        console.log('대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      const initialCount = await getTargetCountForPeriod(period.id);

      // When
      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${period.id}/targets`)
        .expect(HttpStatus.OK);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.deletedCount).toBe(initialCount);

      const finalCount = await getTargetCountForPeriod(period.id);
      expect(finalCount).toBe(0);

      console.log(`\n✅ 모든 평가 대상자 등록 해제 성공: ${initialCount}명`);
    });

    it('대상자가 없는 경우 0이 반환되어야 한다', async () => {
      // 대상자가 없는 평가기간 찾기
      const emptyPeriod = await dataSource.query(
        `SELECT p.id FROM evaluation_period p
         LEFT JOIN evaluation_period_employee_mapping m 
           ON m."evaluationPeriodId" = p.id AND m."deletedAt" IS NULL
         WHERE p."deletedAt" IS NULL
         GROUP BY p.id
         HAVING COUNT(m.id) = 0
         LIMIT 1`,
      );

      if (emptyPeriod.length === 0) {
        console.log('대상자가 없는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${emptyPeriod[0].id}/targets`)
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.deletedCount).toBe(0);

      console.log('\n✅ 대상자 없는 경우 검증 성공');
    });

    it('다른 평가기간의 대상자는 해제되지 않아야 한다', async () => {
      // 두 개의 다른 평가기간 조회
      const periods = await dataSource.query(
        `SELECT p.id, COUNT(m.id) as target_count
         FROM evaluation_period p
         INNER JOIN evaluation_period_employee_mapping m 
           ON m."evaluationPeriodId" = p.id AND m."deletedAt" IS NULL
         WHERE p."deletedAt" IS NULL AND p.status IN ('waiting', 'in-progress')
         GROUP BY p.id
         HAVING COUNT(m.id) > 0
         LIMIT 2`,
      );

      if (periods.length < 2) {
        console.log('평가기간이 부족해서 테스트 스킵');
        return;
      }

      const period1 = periods[0];
      const period2 = periods[1];

      const period2InitialCount = await getTargetCountForPeriod(period2.id);

      // When - period1의 대상자만 해제
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${period1.id}/targets`)
        .expect(HttpStatus.OK);

      // Then - period2의 대상자는 유지됨
      const period2FinalCount = await getTargetCountForPeriod(period2.id);
      expect(period2FinalCount).toBe(period2InitialCount);

      console.log('\n✅ 다른 평가기간 대상자 유지 검증 성공');
    });
  });

  describe('시나리오 3: 실패 케이스', () => {
    it('등록되지 않은 평가 대상자를 해제하려고 하면 404 에러가 발생해야 한다', async () => {
      // 등록되지 않은 조합 찾기
      const unregistered = await dataSource.query(
        `SELECT e.id as employee_id, p.id as period_id
         FROM employee e
         CROSS JOIN evaluation_period p
         LEFT JOIN evaluation_period_employee_mapping m 
           ON m."employeeId" = e.id 
           AND m."evaluationPeriodId" = p.id 
           AND m."deletedAt" IS NULL
         WHERE e."deletedAt" IS NULL 
         AND p."deletedAt" IS NULL 
         AND m.id IS NULL
         LIMIT 1`,
      );

      if (unregistered.length === 0) {
        console.log('등록되지 않은 조합이 없어서 테스트 스킵');
        return;
      }

      // When & Then
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${unregistered[0].period_id}/targets/${unregistered[0].employee_id}`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 등록되지 않은 대상자 해제 방지 검증 성공');
    });

    it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const employee = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (employee.length === 0) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/invalid-uuid/targets/${employee[0].id}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 평가기간 UUID 테스트 성공');
    });

    it('잘못된 UUID 형식의 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-periods/${period[0].id}/targets/invalid-uuid`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 직원 UUID 테스트 성공');
    });

    it('존재하지 않는 평가기간 ID로 전체 해제 요청 시 0이 반환되어야 한다', async () => {
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${nonExistentPeriodId}/targets`)
        .expect(HttpStatus.OK);

      expect(response.body.deletedCount).toBe(0);

      console.log('\n✅ 존재하지 않는 평가기간 테스트 성공');
    });

    it('잘못된 UUID 형식의 평가기간 ID로 전체 해제 요청 시 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/invalid-uuid/targets`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 전체 해제 테스트 성공');
    });
  });
});
