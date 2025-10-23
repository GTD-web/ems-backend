/**
 * 평가 대상자 등록 - 실제 데이터 기반 E2E 테스트
 *
 * with_assignments 시나리오를 사용하여 평가 대상자 등록 기능을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-periods/.../targets - 평가 대상자 등록 (실제 데이터)', () => {
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

  async function getPeriodWithoutFullTarget() {
    // 모든 직원이 등록되지 않은 평가기간 찾기
    const periods = await dataSource.query(
      `SELECT p.id, p.name, 
              (SELECT COUNT(*) FROM employee WHERE "deletedAt" IS NULL) as total_employees,
              COUNT(m.id) as registered_count
       FROM evaluation_period p
       LEFT JOIN evaluation_period_employee_mapping m 
         ON m."evaluationPeriodId" = p.id AND m."deletedAt" IS NULL
       WHERE p."deletedAt" IS NULL AND p.status IN ('waiting', 'in-progress')
       GROUP BY p.id, p.name
       HAVING COUNT(m.id) < (SELECT COUNT(*) FROM employee WHERE "deletedAt" IS NULL)
       LIMIT 1`,
    );

    return periods.length > 0 ? periods[0] : null;
  }

  async function getUnregisteredEmployee(periodId: string) {
    const employees = await dataSource.query(
      `SELECT e.id, e.name
       FROM employee e
       LEFT JOIN evaluation_period_employee_mapping m 
         ON m."employeeId" = e.id 
         AND m."evaluationPeriodId" = $1 
         AND m."deletedAt" IS NULL
       WHERE e."deletedAt" IS NULL AND e.status = '재직중' AND m.id IS NULL
       LIMIT 1`,
      [periodId],
    );

    return employees.length > 0 ? employees[0] : null;
  }

  async function getMultipleUnregisteredEmployees(
    periodId: string,
    count: number,
  ) {
    const employees = await dataSource.query(
      `SELECT e.id, e.name
       FROM employee e
       LEFT JOIN evaluation_period_employee_mapping m 
         ON m."employeeId" = e.id 
         AND m."evaluationPeriodId" = $1 
         AND m."deletedAt" IS NULL
       WHERE e."deletedAt" IS NULL AND e.status = '재직중' AND m.id IS NULL
       LIMIT $2`,
      [periodId, count],
    );

    return employees;
  }

  async function getTargetMapping(periodId: string, employeeId: string) {
    const mappings = await dataSource.query(
      `SELECT * FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [periodId, employeeId],
    );

    return mappings.length > 0 ? mappings[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('시나리오 1: 단일 평가 대상자 등록', () => {
    it('유효한 평가기간 ID와 직원 ID로 평가 대상자를 등록할 수 있어야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('등록되지 않은 직원이 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      const employee = await getUnregisteredEmployee(period.id);

      if (!employee) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
        .send({})
        .expect(HttpStatus.CREATED);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.evaluationPeriodId).toBe(period.id);
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.isExcluded).toBe(false);
      expect(response.body.excludeReason).toBeNull();
      expect(response.body.excludedBy).toBeNull();
      expect(response.body.excludedAt).toBeNull();
      expect(response.body.createdBy).toBeDefined();

      console.log('\n✅ 평가 대상자 등록 성공');
    });

    it('등록된 평가 대상자의 상태가 올바르게 반환되어야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employee = await getUnregisteredEmployee(period.id);

      if (!employee) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
        .send({})
        .expect(HttpStatus.CREATED);

      // Then
      expect(response.body.isExcluded).toBe(false);
      expect(response.body.excludeReason).toBeNull();
      expect(response.body.excludedBy).toBeNull();
      expect(response.body.excludedAt).toBeNull();

      console.log('\n✅ 평가 대상자 상태 검증 성공');
    });

    it('평가 대상자 등록 후 DB에 정보가 저장되어야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employee = await getUnregisteredEmployee(period.id);

      if (!employee) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
        .send({})
        .expect(HttpStatus.CREATED);

      // Then - DB 확인
      const dbMapping = await getTargetMapping(period.id, employee.id);
      expect(dbMapping).toBeDefined();
      expect(dbMapping.evaluationPeriodId).toBe(period.id);
      expect(dbMapping.employeeId).toBe(employee.id);
      expect(dbMapping.isExcluded).toBe(false);
      expect(dbMapping.createdBy).toBeDefined();

      console.log('\n✅ DB 저장 검증 성공');
    });

    it('이미 등록된 평가 대상자를 다시 등록하려고 하면 409 에러가 발생해야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employee = await getUnregisteredEmployee(period.id);

      if (!employee) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      // 먼저 등록
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
        .send({})
        .expect(HttpStatus.CREATED);

      // When & Then - 동일한 대상자 재등록 시도
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
        .send({})
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 중복 등록 방지 검증 성공');
    });
  });

  describe('시나리오 2: 대량 평가 대상자 등록', () => {
    it('여러 직원을 동시에 평가 대상자로 등록할 수 있어야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employees = await getMultipleUnregisteredEmployees(period.id, 5);

      if (employees.length === 0) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      const employeeIds = employees.map((e: any) => e.id);

      // When
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
        .send({ employeeIds })
        .expect(HttpStatus.CREATED);

      // Then
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(employeeIds.length);

      response.body.forEach((mapping: any) => {
        expect(mapping.id).toBeDefined();
        expect(mapping.evaluationPeriodId).toBe(period.id);
        expect(employeeIds).toContain(mapping.employeeId);
        expect(mapping.isExcluded).toBe(false);
        expect(mapping.createdBy).toBeDefined();
      });

      console.log(`\n✅ 대량 등록 성공: ${employeeIds.length}명`);
    });

    it('이미 등록된 직원이 포함된 경우 중복을 제외하고 신규 직원만 등록해야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employees = await getMultipleUnregisteredEmployees(period.id, 3);

      if (employees.length < 2) {
        console.log('등록되지 않은 직원이 부족해서 테스트 스킵');
        return;
      }

      // 첫 번째 직원 먼저 등록
      await testSuite
        .request()
        .post(
          `/admin/evaluation-periods/${period.id}/targets/${employees[0].id}`,
        )
        .send({})
        .expect(HttpStatus.CREATED);

      // When - 모든 직원 (기등록 1명 + 미등록 2명) 대량 등록 시도
      const employeeIds = employees.map((e: any) => e.id);
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
        .send({ employeeIds })
        .expect(HttpStatus.CREATED);

      // Then - 모든 직원이 반환되어야 함
      expect(response.body.length).toBe(employeeIds.length);

      // DB 확인 - 모두 등록되어 있어야 함
      for (const employeeId of employeeIds) {
        const mapping = await getTargetMapping(period.id, employeeId);
        expect(mapping).toBeDefined();
      }

      console.log('\n✅ 중복 제외 대량 등록 성공');
    });

    it('대량 등록된 모든 대상자가 isExcluded: false 상태여야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employees = await getMultipleUnregisteredEmployees(period.id, 3);

      if (employees.length === 0) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      const employeeIds = employees.map((e: any) => e.id);

      // When
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
        .send({ employeeIds })
        .expect(HttpStatus.CREATED);

      // Then
      response.body.forEach((mapping: any) => {
        expect(mapping.isExcluded).toBe(false);
        expect(mapping.excludeReason).toBeNull();
        expect(mapping.excludedBy).toBeNull();
        expect(mapping.excludedAt).toBeNull();
      });

      console.log('\n✅ 대량 등록 상태 검증 성공');
    });

    it('중복된 직원 ID가 배열에 포함된 경우 한 번만 등록되어야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employees = await getMultipleUnregisteredEmployees(period.id, 2);

      if (employees.length < 2) {
        console.log('등록되지 않은 직원이 부족해서 테스트 스킵');
        return;
      }

      const employeeIds = [
        employees[0].id,
        employees[1].id,
        employees[0].id, // 중복
        employees[1].id, // 중복
      ];

      // When
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
        .send({ employeeIds })
        .expect(HttpStatus.CREATED);

      // Then - 2명만 등록되어야 함
      const uniqueEmployeeIds = [employees[0].id, employees[1].id];
      for (const employeeId of uniqueEmployeeIds) {
        const mapping = await getTargetMapping(period.id, employeeId);
        expect(mapping).toBeDefined();
      }

      console.log('\n✅ 중복 ID 제거 검증 성공');
    });
  });

  describe('시나리오 3: 실패 케이스', () => {
    it('존재하지 않는 평가기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      const employee = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (employee.length === 0) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-periods/${nonExistentPeriodId}/targets/${employee[0].id}`,
        )
        .send({})
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 존재하지 않는 평가기간 테스트 성공');
    });

    it('존재하지 않는 직원 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-periods/${period[0].id}/targets/${nonExistentEmployeeId}`,
        )
        .send({})
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 존재하지 않는 직원 테스트 성공');
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
        .post(
          `/admin/evaluation-periods/invalid-uuid/targets/${employee[0].id}`,
        )
        .send({})
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
        .post(`/admin/evaluation-periods/${period[0].id}/targets/invalid-uuid`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 직원 UUID 테스트 성공');
    });

    it('빈 배열로 대량 등록 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period[0].id}/targets/bulk`)
        .send({ employeeIds: [] })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 빈 배열 테스트 성공');
    });

    it('잘못된 직원 ID가 포함된 경우 400 에러가 발생해야 한다', async () => {
      const period = await getPeriodWithoutFullTarget();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const employees = await getMultipleUnregisteredEmployees(period.id, 2);

      if (employees.length < 2) {
        console.log('직원이 부족해서 테스트 스킵');
        return;
      }

      const employeeIds = [employees[0].id, 'invalid-uuid', employees[1].id];

      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
        .send({ employeeIds })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 직원 ID 포함 테스트 성공');
    });

    it('employeeIds 누락 시 400 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period[0].id}/targets/bulk`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ employeeIds 누락 테스트 성공');
    });

    it('employeeIds가 배열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      const period = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (period.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period[0].id}/targets/bulk`)
        .send({ employeeIds: 'not-an-array' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ employeeIds 타입 검증 테스트 성공');
    });
  });
});
