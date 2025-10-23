/**
 * 평가 대상자 조회 - 실제 데이터 기반 E2E 테스트
 *
 * with_assignments 시나리오를 사용하여 평가 대상자 조회 기능을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-periods/.../targets - 평가 대상자 조회 (실제 데이터)', () => {
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

  async function getActivePeriodWithTargets() {
    const periods = await dataSource
      .getRepository('EvaluationPeriod')
      .createQueryBuilder('period')
      .leftJoinAndSelect(
        'evaluation_period_employee_mapping',
        'mapping',
        'mapping.evaluationPeriodId = period.id AND mapping.deletedAt IS NULL',
      )
      .where('period.deletedAt IS NULL')
      .andWhere('period.status IN (:...statuses)', {
        statuses: ['waiting', 'in-progress'],
      })
      .select([
        'period.id as id',
        'period.name as name',
        'COUNT(mapping.id) as targetCount',
      ])
      .groupBy('period.id, period.name')
      .having('COUNT(mapping.id) > 0')
      .getRawMany();

    return periods.length > 0 ? periods[0] : null;
  }

  async function getEmployeeId() {
    const employee = await dataSource
      .getRepository('Employee')
      .createQueryBuilder('employee')
      .where('employee.deletedAt IS NULL')
      .andWhere('employee.status = :status', { status: '재직중' })
      .limit(1)
      .getOne();

    return employee?.id;
  }

  async function registerTarget(periodId: string, employeeId: string) {
    return await testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/targets/${employeeId}`)
      .send({})
      .expect((res) => {
        if (res.status !== 201 && res.status !== 409) {
          throw new Error(`등록 실패: ${res.status} ${res.text}`);
        }
      });
  }

  async function excludeTarget(periodId: string, employeeId: string) {
    return await testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/targets/${employeeId}/exclude`,
      )
      .send({ excludeReason: '테스트 제외 사유' })
      .expect(200);
  }

  // ==================== 테스트 케이스 ====================

  describe('시나리오 1: 평가기간의 평가 대상자 조회', () => {
    it('평가기간의 모든 평가 대상자를 조회할 수 있어야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${period.id}/targets`)
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationPeriodId).toBe(period.id);
      expect(Array.isArray(response.body.targets)).toBe(true);
      expect(response.body.targets.length).toBeGreaterThan(0);

      response.body.targets.forEach((target: any) => {
        expect(target.id).toBeDefined();
        expect(target.evaluationPeriodId).toBeUndefined(); // 중복 제거됨
        expect(target.employeeId).toBeUndefined(); // 중복 제거됨
        expect(target.employee).toBeDefined();
        expect(target.employee.id).toBeDefined();
        expect(target.isExcluded).toBeDefined();
      });

      console.log(
        `\n✅ 평가 대상자 조회 성공: ${response.body.targets.length}명`,
      );
    });

    it('includeExcluded=false 시 제외된 대상자가 포함되지 않아야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // 제외 처리할 대상자 조회
      const targetToExclude = await dataSource.query(
        `SELECT "employeeId" FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "isExcluded" = false AND "deletedAt" IS NULL 
         LIMIT 1`,
        [period.id],
      );

      if (targetToExclude.length > 0) {
        await excludeTarget(period.id, targetToExclude[0].employeeId);
      }

      // When - includeExcluded를 전달하지 않으면 기본값 false 적용
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${period.id}/targets`)
        .expect(HttpStatus.OK);

      // Then - 제외되지 않은 대상자만 반환
      expect(response.body.evaluationPeriodId).toBe(period.id);
      response.body.targets.forEach((target: any) => {
        expect(target.isExcluded).toBe(false);
      });

      console.log('\n✅ includeExcluded=false 테스트 성공');
    });

    it('includeExcluded=true 시 제외된 대상자도 포함되어야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${period.id}/targets`)
        .query({ includeExcluded: 'true' })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationPeriodId).toBe(period.id);
      expect(Array.isArray(response.body.targets)).toBe(true);

      console.log('\n✅ includeExcluded=true 테스트 성공');
    });

    it('평가 대상자가 없는 경우 빈 배열이 반환되어야 한다', async () => {
      // 대상자가 없는 평가기간 조회
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
        .get(`/admin/evaluation-periods/${emptyPeriod[0].id}/targets`)
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationPeriodId).toBe(emptyPeriod[0].id);
      expect(Array.isArray(response.body.targets)).toBe(true);
      expect(response.body.targets.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 테스트 성공');
    });
  });

  describe('시나리오 2: 제외된 평가 대상자 조회', () => {
    it('제외된 평가 대상자만 조회할 수 있어야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // 일부 대상자 제외 처리
      const targetsToExclude = await dataSource.query(
        `SELECT "employeeId" FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "isExcluded" = false AND "deletedAt" IS NULL 
         LIMIT 2`,
        [period.id],
      );

      for (const target of targetsToExclude) {
        await excludeTarget(period.id, target.employeeId);
      }

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${period.id}/targets/excluded`)
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationPeriodId).toBe(period.id);
      expect(Array.isArray(response.body.targets)).toBe(true);

      if (response.body.targets.length > 0) {
        response.body.targets.forEach((target: any) => {
          expect(target.isExcluded).toBe(true);
          expect(target.excludeReason).toBeDefined();
          expect(target.excludedBy).toBeDefined();
          expect(target.excludedAt).toBeDefined();
        });
      }

      console.log(
        `\n✅ 제외된 대상자 조회 성공: ${response.body.targets.length}명`,
      );
    });

    it('제외된 대상자가 없는 경우 빈 배열이 반환되어야 한다', async () => {
      // 제외된 대상자가 없는 평가기간 조회
      const periodWithoutExcluded = await dataSource.query(
        `SELECT p.id FROM evaluation_period p
         INNER JOIN evaluation_period_employee_mapping m 
           ON m."evaluationPeriodId" = p.id AND m."deletedAt" IS NULL
         WHERE p."deletedAt" IS NULL
         GROUP BY p.id
         HAVING SUM(CASE WHEN m."isExcluded" = true THEN 1 ELSE 0 END) = 0
         LIMIT 1`,
      );

      if (periodWithoutExcluded.length === 0) {
        console.log('제외된 대상자가 없는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-periods/${periodWithoutExcluded[0].id}/targets/excluded`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationPeriodId).toBe(
        periodWithoutExcluded[0].id,
      );
      expect(Array.isArray(response.body.targets)).toBe(true);
      expect(response.body.targets.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 테스트 성공');
    });
  });

  describe('시나리오 3: 직원의 평가기간 맵핑 조회', () => {
    it('직원이 등록된 모든 평가기간 맵핑을 조회할 수 있어야 한다', async () => {
      // 평가 대상자로 등록된 직원 조회
      const employeeWithMappings = await dataSource.query(
        `SELECT e.id, COUNT(m.id) as mapping_count
         FROM employee e
         INNER JOIN evaluation_period_employee_mapping m 
           ON m."employeeId" = e.id AND m."deletedAt" IS NULL
         WHERE e."deletedAt" IS NULL
         GROUP BY e.id
         HAVING COUNT(m.id) > 0
         LIMIT 1`,
      );

      if (employeeWithMappings.length === 0) {
        console.log('평가 대상자로 등록된 직원이 없어서 테스트 스킵');
        return;
      }

      const employeeId = employeeWithMappings[0].id;

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-periods/employees/${employeeId}/evaluation-periods`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.employee).toBeDefined();
      expect(response.body.employee.id).toBe(employeeId);
      expect(Array.isArray(response.body.mappings)).toBe(true);
      expect(response.body.mappings.length).toBeGreaterThan(0);

      response.body.mappings.forEach((mapping: any) => {
        expect(mapping.evaluationPeriodId).toBeUndefined();
        expect(mapping.evaluationPeriod).toBeDefined();
        expect(typeof mapping.evaluationPeriod).toBe('object');
        expect(mapping.evaluationPeriod.id).toBeDefined();
        expect(mapping.evaluationPeriod.name).toBeDefined();
        expect(mapping.evaluationPeriod.startDate).toBeDefined();
        expect(mapping.evaluationPeriod.status).toBeDefined();
        expect(mapping.id).toBeDefined();
        expect(mapping.employeeId).toBeUndefined(); // 중복 제거됨
      });

      console.log(
        `\n✅ 직원 평가기간 맵핑 조회 성공: ${response.body.mappings.length}개`,
      );
    });

    it('등록된 평가기간이 없는 경우 빈 배열이 반환되어야 한다', async () => {
      // 평가 대상자로 등록되지 않은 직원 조회
      const employeeWithoutMappings = await dataSource.query(
        `SELECT e.id
         FROM employee e
         LEFT JOIN evaluation_period_employee_mapping m 
           ON m."employeeId" = e.id AND m."deletedAt" IS NULL
         WHERE e."deletedAt" IS NULL
         GROUP BY e.id
         HAVING COUNT(m.id) = 0
         LIMIT 1`,
      );

      if (employeeWithoutMappings.length === 0) {
        console.log('평가 대상자로 등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      const employeeId = employeeWithoutMappings[0].id;

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-periods/employees/${employeeId}/evaluation-periods`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.employee).toBeDefined();
      expect(response.body.employee.id).toBe(employeeId);
      expect(Array.isArray(response.body.mappings)).toBe(true);
      expect(response.body.mappings.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 테스트 성공');
    });
  });

  describe('시나리오 4: 평가 대상 여부 확인', () => {
    it('등록된 평가 대상자인 경우 true를 반환해야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // 등록된 대상자 조회
      const target = await dataSource.query(
        `SELECT "employeeId" FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "isExcluded" = false AND "deletedAt" IS NULL 
         LIMIT 1`,
        [period.id],
      );

      if (target.length === 0) {
        console.log('등록된 대상자가 없어서 테스트 스킵');
        return;
      }

      const employeeId = target[0].employeeId;

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-periods/${period.id}/targets/${employeeId}/check`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.isEvaluationTarget).toBe(true);
      expect(response.body.evaluationPeriod).toBeDefined();
      expect(response.body.evaluationPeriod.id).toBe(period.id);
      expect(response.body.employee).toBeDefined();
      expect(response.body.employee.id).toBe(employeeId);
      expect(response.body.evaluationPeriodId).toBeUndefined();
      expect(response.body.employeeId).toBeUndefined();

      console.log('\n✅ 평가 대상 여부 확인 성공 (true)');
    });

    it('제외된 대상자인 경우 false를 반환해야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // 제외된 대상자 조회 또는 생성
      let excludedTarget = await dataSource.query(
        `SELECT "employeeId" FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "isExcluded" = true AND "deletedAt" IS NULL 
         LIMIT 1`,
        [period.id],
      );

      if (excludedTarget.length === 0) {
        // 제외된 대상자가 없으면 하나 생성
        const targetToExclude = await dataSource.query(
          `SELECT "employeeId" FROM evaluation_period_employee_mapping 
           WHERE "evaluationPeriodId" = $1 AND "isExcluded" = false AND "deletedAt" IS NULL 
           LIMIT 1`,
          [period.id],
        );

        if (targetToExclude.length === 0) {
          console.log('제외할 대상자가 없어서 테스트 스킵');
          return;
        }

        await excludeTarget(period.id, targetToExclude[0].employeeId);
        excludedTarget = targetToExclude;
      }

      const employeeId = excludedTarget[0].employeeId;

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-periods/${period.id}/targets/${employeeId}/check`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.isEvaluationTarget).toBe(false);
      expect(response.body.evaluationPeriod).toBeDefined();
      expect(response.body.evaluationPeriod.id).toBe(period.id);
      expect(response.body.employee).toBeDefined();
      expect(response.body.employee.id).toBe(employeeId);

      console.log('\n✅ 평가 대상 여부 확인 성공 (false - excluded)');
    });

    it('등록되지 않은 경우 false를 반환해야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가 대상자가 있는 평가기간이 없어서 테스트 스킵');
        return;
      }

      // 등록되지 않은 직원 조회
      const notRegisteredEmployee = await dataSource.query(
        `SELECT e.id
         FROM employee e
         LEFT JOIN evaluation_period_employee_mapping m 
           ON m."employeeId" = e.id 
           AND m."evaluationPeriodId" = $1 
           AND m."deletedAt" IS NULL
         WHERE e."deletedAt" IS NULL AND m.id IS NULL
         LIMIT 1`,
        [period.id],
      );

      if (notRegisteredEmployee.length === 0) {
        console.log('등록되지 않은 직원이 없어서 테스트 스킵');
        return;
      }

      const employeeId = notRegisteredEmployee[0].id;

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-periods/${period.id}/targets/${employeeId}/check`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.isEvaluationTarget).toBe(false);

      console.log('\n✅ 평가 대상 여부 확인 성공 (false - not registered)');
    });
  });

  describe('시나리오 5: 실패 케이스', () => {
    it('존재하지 않는 평가기간 ID로 요청 시 빈 배열이 반환되어야 한다', async () => {
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${nonExistentPeriodId}/targets`)
        .expect(HttpStatus.OK);

      expect(response.body.evaluationPeriodId).toBe(nonExistentPeriodId);
      expect(Array.isArray(response.body.targets)).toBe(true);
      expect(response.body.targets.length).toBe(0);

      console.log('\n✅ 존재하지 않는 평가기간 테스트 성공');
    });

    it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .get(`/admin/evaluation-periods/invalid-uuid/targets`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 테스트 성공');
    });

    it('잘못된 includeExcluded 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getActivePeriodWithTargets();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(`/admin/evaluation-periods/${period.id}/targets`)
        .query({ includeExcluded: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 includeExcluded 값 테스트 성공');
    });
  });
});
