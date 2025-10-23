/**
 * 평가 대상자 제외/포함 - 실제 데이터 기반 E2E 테스트
 *
 * with_assignments 시나리오를 사용하여 평가 대상자 제외/포함 기능을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-periods/.../exclude|include - 평가 대상자 제외/포함 (실제 데이터)', () => {
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

  async function getNonExcludedTarget() {
    const targets = await dataSource.query(
      `SELECT m."evaluationPeriodId", m."employeeId", e.name as employeeName
       FROM evaluation_period_employee_mapping m
       INNER JOIN employee e ON e.id = m."employeeId"
       INNER JOIN evaluation_period p ON p.id = m."evaluationPeriodId"
       WHERE m."deletedAt" IS NULL 
       AND m."isExcluded" = false
       AND e."deletedAt" IS NULL 
       AND p."deletedAt" IS NULL
       AND p.status IN ('waiting', 'in-progress')
       LIMIT 1`,
    );

    return targets.length > 0 ? targets[0] : null;
  }

  async function getExcludedTarget() {
    const targets = await dataSource.query(
      `SELECT m."evaluationPeriodId", m."employeeId", e.name as employeeName
       FROM evaluation_period_employee_mapping m
       INNER JOIN employee e ON e.id = m."employeeId"
       INNER JOIN evaluation_period p ON p.id = m."evaluationPeriodId"
       WHERE m."deletedAt" IS NULL 
       AND m."isExcluded" = true
       AND e."deletedAt" IS NULL 
       AND p."deletedAt" IS NULL
       AND p.status IN ('waiting', 'in-progress')
       LIMIT 1`,
    );

    return targets.length > 0 ? targets[0] : null;
  }

  async function checkTargetExcluded(periodId: string, employeeId: string) {
    const mappings = await dataSource.query(
      `SELECT * FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [periodId, employeeId],
    );

    return mappings.length > 0 ? mappings[0].isExcluded : null;
  }

  async function getTargetDetails(periodId: string, employeeId: string) {
    const mappings = await dataSource.query(
      `SELECT * FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [periodId, employeeId],
    );

    return mappings.length > 0 ? mappings[0] : null;
  }

  async function excludeTarget(
    periodId: string,
    employeeId: string,
    reason: string = '테스트 제외 사유',
  ) {
    return await testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/targets/${employeeId}/exclude`,
      )
      .send({ excludeReason: reason })
      .expect((res) => {
        if (res.status !== 200 && res.status !== 409 && res.status !== 404) {
          throw new Error(`제외 실패: ${res.status} ${res.text}`);
        }
      });
  }

  // ==================== 테스트 케이스 ====================

  describe('시나리오 1: 평가 대상 제외', () => {
    it('평가 대상자를 성공적으로 제외할 수 있어야 한다', async () => {
      const target = await getNonExcludedTarget();

      if (!target) {
        console.log('제외되지 않은 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      const excludeReason = '테스트 제외 사유';

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({ excludeReason })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.isExcluded).toBe(true);
      expect(response.body.excludeReason).toBe(excludeReason);
      expect(response.body.excludedBy).toBeDefined();
      expect(response.body.excludedAt).toBeDefined();

      console.log('\n✅ 평가 대상자 제외 성공');
    });

    it('제외 처리 후 isExcluded가 true로 변경되어야 한다', async () => {
      const target = await getNonExcludedTarget();

      if (!target) {
        console.log('제외되지 않은 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({ excludeReason: '장기 휴직' })
        .expect(HttpStatus.OK);

      // Then
      const isExcluded = await checkTargetExcluded(
        target.evaluationPeriodId,
        target.employeeId,
      );
      expect(isExcluded).toBe(true);

      console.log('\n✅ isExcluded 상태 변경 검증 성공');
    });

    it('제외 사유와 제외 처리자 정보가 올바르게 저장되어야 한다', async () => {
      const target = await getNonExcludedTarget();

      if (!target) {
        console.log('제외되지 않은 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      const excludeReason = '프로젝트 미참여';

      // When
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({ excludeReason })
        .expect(HttpStatus.OK);

      // Then - DB 확인
      const details = await getTargetDetails(
        target.evaluationPeriodId,
        target.employeeId,
      );
      expect(details.isExcluded).toBe(true);
      expect(details.excludeReason).toBe(excludeReason);
      expect(details.excludedBy).toBeDefined();
      expect(details.excludedAt).not.toBeNull();

      console.log('\n✅ 제외 정보 저장 검증 성공');
    });

    it('이미 제외된 대상자를 다시 제외하려고 하면 409 에러가 발생해야 한다', async () => {
      // 제외된 대상자가 없으면 하나 생성
      let target = await getExcludedTarget();

      if (!target) {
        const nonExcluded = await getNonExcludedTarget();
        if (!nonExcluded) {
          console.log('평가 대상자가 없어서 테스트 스킵');
          return;
        }

        await excludeTarget(
          nonExcluded.evaluationPeriodId,
          nonExcluded.employeeId,
          '첫 번째 제외',
        );
        target = nonExcluded;
      }

      // When & Then - 재제외 시도
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({ excludeReason: '두 번째 제외' })
        .expect(HttpStatus.CONFLICT);

      console.log('\n✅ 중복 제외 방지 검증 성공');
    });

    it('제외 사유가 누락된 경우 400 에러가 발생해야 한다', async () => {
      const target = await getNonExcludedTarget();

      if (!target) {
        console.log('제외되지 않은 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // When & Then - excludeReason 누락
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 제외 사유 필수 검증 성공');
    });
  });

  describe('시나리오 2: 평가 대상 포함', () => {
    it('제외된 대상자를 성공적으로 다시 포함시킬 수 있어야 한다', async () => {
      // 제외된 대상자가 없으면 하나 생성
      let target = await getExcludedTarget();

      if (!target) {
        const nonExcluded = await getNonExcludedTarget();
        if (!nonExcluded) {
          console.log('평가 대상자가 없어서 테스트 스킵');
          return;
        }

        await excludeTarget(
          nonExcluded.evaluationPeriodId,
          nonExcluded.employeeId,
          '임시 제외',
        );
        target = nonExcluded;
      }

      // When - 다시 포함
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/include`,
        )
        .send({})
        .expect(HttpStatus.OK);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.isExcluded).toBe(false);
      expect(response.body.excludeReason).toBeNull();
      expect(response.body.excludedBy).toBeNull();
      expect(response.body.excludedAt).toBeNull();

      console.log('\n✅ 평가 대상자 포함 성공');
    });

    it('포함 처리 후 isExcluded가 false로 변경되어야 한다', async () => {
      // 제외된 대상자가 없으면 하나 생성
      let target = await getExcludedTarget();

      if (!target) {
        const nonExcluded = await getNonExcludedTarget();
        if (!nonExcluded) {
          console.log('평가 대상자가 없어서 테스트 스킵');
          return;
        }

        await excludeTarget(
          nonExcluded.evaluationPeriodId,
          nonExcluded.employeeId,
          '제외',
        );
        target = nonExcluded;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/include`,
        )
        .send({})
        .expect(HttpStatus.OK);

      // Then
      const isExcluded = await checkTargetExcluded(
        target.evaluationPeriodId,
        target.employeeId,
      );
      expect(isExcluded).toBe(false);

      console.log('\n✅ isExcluded 상태 변경 검증 성공');
    });

    it('제외 사유 및 제외 처리자 정보가 null로 초기화되어야 한다', async () => {
      // 제외된 대상자가 없으면 하나 생성
      let target = await getExcludedTarget();

      if (!target) {
        const nonExcluded = await getNonExcludedTarget();
        if (!nonExcluded) {
          console.log('평가 대상자가 없어서 테스트 스킵');
          return;
        }

        await excludeTarget(
          nonExcluded.evaluationPeriodId,
          nonExcluded.employeeId,
          '프로젝트 미참여',
        );
        target = nonExcluded;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/include`,
        )
        .send({})
        .expect(HttpStatus.OK);

      // Then - DB 확인
      const details = await getTargetDetails(
        target.evaluationPeriodId,
        target.employeeId,
      );
      expect(details.isExcluded).toBe(false);
      expect(details.excludeReason).toBeNull();
      expect(details.excludedBy).toBeNull();
      expect(details.excludedAt).toBeNull();

      console.log('\n✅ 제외 정보 초기화 검증 성공');
    });

    it('제외 -> 포함 -> 다시 제외가 가능해야 한다', async () => {
      const target = await getNonExcludedTarget();

      if (!target) {
        console.log('평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // 첫 번째 제외
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({ excludeReason: '첫 번째 제외' })
        .expect(HttpStatus.OK);

      // 포함
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/include`,
        )
        .send({})
        .expect(HttpStatus.OK);

      // When - 두 번째 제외
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/exclude`,
        )
        .send({ excludeReason: '두 번째 제외' })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.isExcluded).toBe(true);
      expect(response.body.excludeReason).toBe('두 번째 제외');

      console.log('\n✅ 제외-포함-제외 순환 검증 성공');
    });

    it('제외되지 않은 대상자를 포함하려고 하면 409 에러가 발생해야 한다', async () => {
      const target = await getNonExcludedTarget();

      if (!target) {
        console.log('제외되지 않은 평가 대상자가 없어서 테스트 스킵');
        return;
      }

      // When & Then - 제외되지 않은 상태에서 포함 시도
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${target.evaluationPeriodId}/targets/${target.employeeId}/include`,
        )
        .send({})
        .expect(HttpStatus.CONFLICT);

      console.log('\n✅ 중복 포함 방지 검증 성공');
    });
  });

  describe('시나리오 3: 실패 케이스', () => {
    it('등록되지 않은 평가 대상자를 제외하려고 하면 404 에러가 발생해야 한다', async () => {
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
        .patch(
          `/admin/evaluation-periods/${unregistered[0].period_id}/targets/${unregistered[0].employee_id}/exclude`,
        )
        .send({ excludeReason: '제외 사유' })
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 등록되지 않은 대상자 제외 방지 검증 성공');
    });

    it('등록되지 않은 평가 대상자를 포함하려고 하면 404 에러가 발생해야 한다', async () => {
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
        .patch(
          `/admin/evaluation-periods/${unregistered[0].period_id}/targets/${unregistered[0].employee_id}/include`,
        )
        .send({})
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 등록되지 않은 대상자 포함 방지 검증 성공');
    });

    it('잘못된 UUID 형식의 평가기간 ID로 제외 요청 시 400 에러가 발생해야 한다', async () => {
      const employee = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (employee.length === 0) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/invalid-uuid/targets/${employee[0].id}/exclude`,
        )
        .send({ excludeReason: '제외 사유' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 제외 테스트 성공');
    });

    it('잘못된 UUID 형식의 직원 ID로 제외 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${period[0].id}/targets/invalid-uuid/exclude`,
        )
        .send({ excludeReason: '제외 사유' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 직원 UUID 제외 테스트 성공');
    });

    it('잘못된 UUID 형식의 평가기간 ID로 포함 요청 시 400 에러가 발생해야 한다', async () => {
      const employee = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (employee.length === 0) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/invalid-uuid/targets/${employee[0].id}/include`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 포함 테스트 성공');
    });

    it('잘못된 UUID 형식의 직원 ID로 포함 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${period[0].id}/targets/invalid-uuid/include`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 직원 UUID 포함 테스트 성공');
    });
  });
});
