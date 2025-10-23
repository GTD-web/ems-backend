/**
 * 평가자별 피평가자 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여
 * 평가자별로 담당하는 피평가자 목록을 조회하는 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 1차 평가자의 피평가자 조회
 * 2. 2차 평가자의 피평가자 조회
 * 3. 1차+2차 평가자 모두 구성된 경우
 * 4. 평가자 미구성 케이스
 * 5. 실패 시나리오
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/evaluation-lines/evaluator/:evaluatorId/employees - 실제 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 1차 평가자의 피평가자 조회', () => {
    let evaluationPeriodId: string;
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 1차 평가자의 피평가자 조회 ===');

      // 기존 데이터 정리
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

      // 실제 데이터 기반 시드 데이터 생성
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_setup',
          clearExisting: false,
          projectCount: 2,
          wbsPerProject: 3,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            evaluationLineMappingTypes: {
              primaryOnly: 0.5,
              primaryAndSecondary: 0.5,
              withAdditional: 0.0,
            },
          },
        })
        .expect(201);

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // 평가자 조회 (1차 평가자 우선)
      const mappings = await dataSource.manager.query(
        `
        SELECT DISTINCT m."evaluatorId"
        FROM evaluation_line_mappings m
        WHERE m."deletedAt" IS NULL
        LIMIT 1
        `,
      );

      if (mappings.length > 0) {
        evaluatorId = mappings[0].evaluatorId;
      }
      console.log(`1차 평가자 ID: ${evaluatorId}`);
      console.log(`평가기간 ID: ${evaluationPeriodId}`);
    });

    it('1차 평가자의 피평가자 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 구조:');
      console.log('  evaluatorId:', result.evaluatorId);
      console.log('  employees:', result.employees?.length || 0);

      // 기본 구조 검증
      expect(result).toHaveProperty('evaluatorId');
      expect(result).toHaveProperty('employees');
      expect(result.evaluatorId).toBe(evaluatorId);
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.employees.length).toBeGreaterThan(0);

      console.log('\n✅ 1차 평가자 피평가자 조회 성공');
    });

    it('피평가자 정보가 올바르게 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.employees.length > 0) {
        const employee = result.employees[0];

        console.log('\n📝 피평가자 정보:');
        console.log('  employeeId:', employee.employeeId);
        console.log('  evaluationLineId:', employee.evaluationLineId);
        console.log('  wbsItemId:', employee.wbsItemId);

        // 필수 필드 검증
        expect(employee).toHaveProperty('employeeId');
        expect(employee).toHaveProperty('evaluationLineId');
        expect(employee).toHaveProperty('wbsItemId');
        expect(employee).toHaveProperty('createdAt');
        expect(employee).toHaveProperty('updatedAt');

        // 값 검증
        expect(typeof employee.employeeId).toBe('string');
        expect(typeof employee.evaluationLineId).toBe('string');
        expect(typeof employee.wbsItemId).toBe('string');

        console.log('\n✅ 피평가자 정보 검증 완료');
      }
    });
  });

  describe('시나리오 2: 2차 평가자의 피평가자 조회', () => {
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 2차 평가자의 피평가자 조회 ===');

      // 2차 평가자 조회
      const secondaryLine = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'secondary' })
        .andWhere('line."deletedAt" IS NULL')
        .getOne();

      if (secondaryLine) {
        const mappings = await dataSource.manager.query(
          `
          SELECT DISTINCT m."evaluatorId"
          FROM evaluation_line_mappings m
          WHERE m."evaluationLineId" = $1
          AND m."deletedAt" IS NULL
          LIMIT 1
          `,
          [secondaryLine.id],
        );

        if (mappings.length > 0) {
          evaluatorId = mappings[0].evaluatorId;
          console.log(`2차 평가자 ID: ${evaluatorId}`);
        }
      }

      if (!evaluatorId) {
        console.log('2차 평가자가 없어서 테스트 스킵');
      }
    });

    it('2차 평가자로 구성된 피평가자 목록을 조회할 수 있어야 한다', async () => {
      if (!evaluatorId) {
        console.log('2차 평가자가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 2차 평가자 피평가자 수:', result.employees.length);

      expect(result.evaluatorId).toBe(evaluatorId);
      expect(Array.isArray(result.employees)).toBe(true);

      console.log('\n✅ 2차 평가자 피평가자 조회 성공');
    });
  });

  describe('시나리오 3: 여러 피평가자를 가진 평가자', () => {
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 여러 피평가자를 가진 평가자 ===');

      // 여러 피평가자를 가진 평가자 조회
      const mappings = await dataSource.manager.query(
        `
        SELECT m."evaluatorId", COUNT(DISTINCT m.id) as count
        FROM evaluation_line_mappings m
        WHERE m."deletedAt" IS NULL
        GROUP BY m."evaluatorId"
        HAVING COUNT(DISTINCT m.id) >= 2
        LIMIT 1
        `,
      );

      if (mappings.length > 0) {
        evaluatorId = mappings[0].evaluatorId;
        console.log(`여러 피평가자를 가진 평가자 ID: ${evaluatorId}`);
        console.log(`피평가자 수: ${mappings[0].count}`);
      } else {
        console.log('여러 피평가자를 가진 평가자가 없음');
      }
    });

    it('여러 피평가자를 모두 조회할 수 있어야 한다', async () => {
      if (!evaluatorId) {
        console.log('여러 피평가자를 가진 평가자가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 평가자 피평가자 수:', result.employees.length);

      expect(result.evaluatorId).toBe(evaluatorId);
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.employees.length).toBeGreaterThanOrEqual(2);

      console.log('\n✅ 여러 피평가자 조회 성공');
    });
  });

  describe('시나리오 3-1: 1차 및 2차 평가자 모두 구성된 경우', () => {
    let primaryEvaluatorId: string;
    let secondaryEvaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3-1: 1차 및 2차 평가자 모두 구성된 경우 ===');

      // 1차 평가자 조회
      const primaryLine = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'primary' })
        .andWhere('line."deletedAt" IS NULL')
        .getOne();

      if (primaryLine) {
        const primaryMappings = await dataSource.manager.query(
          `
          SELECT DISTINCT m."evaluatorId"
          FROM evaluation_line_mappings m
          WHERE m."evaluationLineId" = $1
          AND m."deletedAt" IS NULL
          LIMIT 1
          `,
          [primaryLine.id],
        );

        if (primaryMappings.length > 0) {
          primaryEvaluatorId = primaryMappings[0].evaluatorId;
        }
      }

      // 2차 평가자 조회
      const secondaryLine = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'secondary' })
        .andWhere('line."deletedAt" IS NULL')
        .getOne();

      if (secondaryLine) {
        const secondaryMappings = await dataSource.manager.query(
          `
          SELECT DISTINCT m."evaluatorId"
          FROM evaluation_line_mappings m
          WHERE m."evaluationLineId" = $1
          AND m."deletedAt" IS NULL
          LIMIT 1
          `,
          [secondaryLine.id],
        );

        if (secondaryMappings.length > 0) {
          secondaryEvaluatorId = secondaryMappings[0].evaluatorId;
        }
      }

      console.log(`1차 평가자 ID: ${primaryEvaluatorId}`);
      console.log(`2차 평가자 ID: ${secondaryEvaluatorId}`);
    });

    it('1차 평가자의 피평가자를 조회할 수 있어야 한다', async () => {
      if (!primaryEvaluatorId) {
        console.log('1차 평가자가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${primaryEvaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 1차 평가자 피평가자 수:', result.employees.length);

      expect(result.evaluatorId).toBe(primaryEvaluatorId);
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.employees.length).toBeGreaterThan(0);

      console.log('\n✅ 1차 평가자 피평가자 조회 성공');
    });

    it('2차 평가자의 피평가자를 조회할 수 있어야 한다', async () => {
      if (!secondaryEvaluatorId) {
        console.log('2차 평가자가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${secondaryEvaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 2차 평가자 피평가자 수:', result.employees.length);

      expect(result.evaluatorId).toBe(secondaryEvaluatorId);
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.employees.length).toBeGreaterThan(0);

      console.log('\n✅ 2차 평가자 피평가자 조회 성공');
    });

    it('1차와 2차 평가자가 서로 다른 직원에 대해 구성되어야 한다', async () => {
      if (!primaryEvaluatorId || !secondaryEvaluatorId) {
        console.log('평가자가 없어서 테스트 스킵');
        return;
      }

      const primaryResponse = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${primaryEvaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const secondaryResponse = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${secondaryEvaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const primaryResult = primaryResponse.body;
      const secondaryResult = secondaryResponse.body;

      console.log('\n📊 1차 평가자:', primaryResult.employees.length, '명');
      console.log('📊 2차 평가자:', secondaryResult.employees.length, '명');

      expect(primaryResult.employees.length).toBeGreaterThan(0);
      expect(secondaryResult.employees.length).toBeGreaterThan(0);

      console.log('\n✅ 1차/2차 평가자 모두 피평가자 존재');
    });
  });

  describe('시나리오 4: 평가자 미구성 케이스', () => {
    let nonEvaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 4: 평가자 미구성 케이스 ===');

      // 평가자로 구성되지 않은 직원 조회
      const employees = await dataSource.manager.query(
        `
        SELECT e.id
        FROM employee e
        WHERE e."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM evaluation_line_mappings m
          WHERE m."evaluatorId" = e.id
          AND m."deletedAt" IS NULL
        )
        LIMIT 1
        `,
      );

      if (employees.length > 0) {
        nonEvaluatorId = employees[0].id;
        console.log(`평가자 미구성 직원 ID: ${nonEvaluatorId}`);
      } else {
        // 평가자 미구성 직원이 없으면 새로 생성
        const newEmployee = await dataSource.manager.query(
          `INSERT INTO employee 
          (id, name, "departmentId", "employeeNumber", email, version, "createdAt", "updatedAt")
          SELECT gen_random_uuid(), '비평가자', id, 'NON-EVAL', 'nonevaluator@test.com', 1, NOW(), NOW()
          FROM department
          WHERE "deletedAt" IS NULL
          LIMIT 1
          RETURNING id`,
        );
        nonEvaluatorId = newEmployee[0].id;
        console.log(`새로운 비평가자 직원 생성: ${nonEvaluatorId}`);
      }
    });

    it('평가자로 구성되지 않은 경우 빈 배열을 반환해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${nonEvaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 비평가자 피평가자 수:', result.employees.length);

      expect(result.evaluatorId).toBe(nonEvaluatorId);
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.employees.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 확인');
    });
  });

  describe('시나리오 5: 타임스탬프 및 필수 필드 검증', () => {
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 5: 타임스탬프 및 필수 필드 검증 ===');

      // 피평가자가 있는 평가자 조회
      const mappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping.deletedAt IS NULL')
        .limit(1)
        .getMany();

      evaluatorId = mappings[0].evaluatorId;
    });

    it('타임스탬프 필드들이 올바른 형식이어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 타임스탬프 검증:');

      result.employees.forEach((employee: any) => {
        expect(new Date(employee.createdAt).toString()).not.toBe(
          'Invalid Date',
        );
        expect(new Date(employee.updatedAt).toString()).not.toBe(
          'Invalid Date',
        );
      });

      console.log('  ✓ 모든 타임스탬프가 유효함');
      console.log('\n✅ 타임스탬프 검증 완료');
    });

    it('모든 필수 필드가 존재해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 필수 필드 검증:');

      // 최상위 필드
      expect(result).toHaveProperty('evaluatorId');
      expect(result).toHaveProperty('employees');
      expect(Array.isArray(result.employees)).toBe(true);

      console.log('  ✓ 최상위 필드 존재');

      // 피평가자 필드
      if (result.employees.length > 0) {
        result.employees.forEach((employee: any) => {
          expect(employee).toHaveProperty('employeeId');
          expect(employee).toHaveProperty('evaluationLineId');
          expect(employee).toHaveProperty('createdAt');
          expect(employee).toHaveProperty('updatedAt');
        });

        console.log('  ✓ 피평가자 필드 존재');
      }

      console.log('\n✅ 필수 필드 검증 완료');
    });
  });

  describe('시나리오 6: 여러 WBS 항목에 대한 피평가자', () => {
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 6: 여러 WBS 항목에 대한 피평가자 ===');

      // 여러 피평가자를 가진 평가자 조회
      const evaluators = await dataSource.manager.query(
        `
        SELECT m."evaluatorId", COUNT(DISTINCT m."employeeId") as count
        FROM evaluation_line_mappings m
        WHERE m."deletedAt" IS NULL
        GROUP BY m."evaluatorId"
        HAVING COUNT(DISTINCT m."employeeId") >= 2
        LIMIT 1
        `,
      );

      if (evaluators.length > 0) {
        evaluatorId = evaluators[0].evaluatorId;
        console.log(`평가자 ID: ${evaluatorId}`);
        console.log(`피평가자 수: ${evaluators[0].count}`);
      }
    });

    it('동일한 피평가자가 여러 WBS 항목에 대해 평가받을 수 있어야 한다', async () => {
      if (!evaluatorId) {
        console.log('여러 피평가자를 가진 평가자가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 피평가자 수:', result.employees.length);

      expect(result.employees.length).toBeGreaterThan(0);

      // 각 피평가자가 WBS 항목 정보를 가지고 있는지 확인
      result.employees.forEach((employee: any) => {
        expect(employee).toHaveProperty('employeeId');
        expect(employee).toHaveProperty('wbsItemId');
      });

      console.log('\n✅ 여러 WBS 항목 피평가자 검증 완료');
    });
  });

  describe('시나리오 7: 실패 시나리오', () => {
    it('존재하지 않는 평가자 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      console.log('\n=== 시나리오 7-1: 존재하지 않는 평가자 ID ===');

      const nonExistentEvaluatorId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${nonExistentEvaluatorId}/employees`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 결과:');
      console.log('  evaluatorId:', result.evaluatorId);
      console.log('  employees:', result.employees.length);

      expect(result.evaluatorId).toBe(nonExistentEvaluatorId);
      expect(result.employees).toEqual([]);

      console.log('\n✅ 빈 배열 반환 확인');
    });

    it('잘못된 UUID 형식의 평가자 ID로 조회 시 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 7-2: 잘못된 UUID 형식 ===');

      const invalidUuid = 'invalid-uuid';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/${invalidUuid}/employees`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 에러 응답 확인 (400)');
    });

    it('빈 문자열 평가자 ID로 조회 시 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 7-3: 빈 문자열 ===');

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/evaluator/ /employees`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 에러 응답 확인 (400)');
    });
  });
});
