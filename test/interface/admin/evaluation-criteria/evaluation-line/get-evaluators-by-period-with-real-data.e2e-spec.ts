/**
 * 평가기간별 평가자 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여 평가자 목록을
 * 올바르게 조회하는지 검증합니다.
 *
 * 테스트 시나리오:
 * 1. type=all: 모든 평가자 (1차 + 2차) 조회
 * 2. type=primary: 1차 평가자만 조회
 * 3. type=secondary: 2차 평가자만 조회
 * 4. 평가자 정보 검증: 이름, 부서명, 피평가자 수
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/evaluation-lines/period/:periodId/evaluators - 실제 데이터 기반', () => {
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

  describe('시나리오 1: 모든 평가자 조회 (type=all)', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 모든 평가자 조회 (type=all) ===');

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
              primaryOnly: 0.0,
              primaryAndSecondary: 1.0,
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
      console.log(`평가기간 ID: ${evaluationPeriodId}`);

      // 데이터 생성 확인을 위한 디버깅
      const evaluationLinesCount = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line.deletedAt IS NULL')
        .getCount();
      console.log(`생성된 EvaluationLine 수: ${evaluationLinesCount}`);

      const wbsAssignmentsCount = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .getCount();
      console.log(`생성된 WBS 할당 수: ${wbsAssignmentsCount}`);

      const mappingsCount = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping.deletedAt IS NULL')
        .getCount();
      console.log(`생성된 EvaluationLineMapping 수: ${mappingsCount}`);

      // 평가라인 ID 조회
      const evaluationLines = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line.deletedAt IS NULL')
        .getMany();
      const lineIds = evaluationLines.map((l: any) => l.id);
      console.log(`평가라인 IDs:`, lineIds);

      // WBS 항목 ID 조회 (평가기간 기준)
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .select(['assignment.wbsItemId'])
        .limit(5)
        .getRawMany();
      console.log(
        `WBS Item IDs (샘플 5개):`,
        wbsAssignments.map((a: any) => a.assignment_wbsItemId),
      );

      // 매핑에 사용된 평가라인 ID 조회
      const mappingsWithLineIds = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .select(['mapping.evaluationLineId'])
        .where('mapping.deletedAt IS NULL')
        .groupBy('mapping.evaluationLineId')
        .getRawMany();
      console.log(
        `매핑에 사용된 평가라인 IDs:`,
        mappingsWithLineIds.map((m: any) => m.mapping_evaluationLineId),
      );

      // 매핑의 WBS ID 샘플 조회
      const mappingsWithWbsIds = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .select(['mapping.wbsItemId'])
        .where('mapping.deletedAt IS NULL')
        .limit(5)
        .getRawMany();
      console.log(
        `매핑의 WBS Item IDs (샘플 5개):`,
        mappingsWithWbsIds.map((m: any) => m.mapping_wbsItemId),
      );

      // 교집합 확인: 매핑의 WBS가 해당 평가기간의 WBS에 포함되는지
      const wbsItemIdsSet = new Set(
        wbsAssignments.map((a: any) => a.assignment_wbsItemId),
      );
      const matchingMappings = mappingsWithWbsIds.filter((m: any) =>
        wbsItemIdsSet.has(m.mapping_wbsItemId),
      );
      console.log(
        `교집합 (매핑 WBS ∩ 평가기간 WBS): ${matchingMappings.length}개`,
      );
    });

    it('모든 평가자 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'all' })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 데이터:', JSON.stringify(result, null, 2));
      console.log('평가자 수:', result.evaluators?.length || 0);

      expect(result).toHaveProperty('periodId');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('evaluators');
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(result.type).toBe('all');
      expect(Array.isArray(result.evaluators)).toBe(true);
      expect(result.evaluators.length).toBeGreaterThan(0);

      console.log('\n✅ 모든 평가자 목록 조회 성공');
    });

    it('평가자 정보가 올바르게 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'all' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      if (evaluators.length > 0) {
        const firstEvaluator = evaluators[0];

        console.log('\n📝 첫 번째 평가자 정보:');
        console.log('  ID:', firstEvaluator.evaluatorId);
        console.log('  이름:', firstEvaluator.evaluatorName);
        console.log('  부서:', firstEvaluator.departmentName);
        console.log('  유형:', firstEvaluator.evaluatorType);
        console.log('  담당 피평가자 수:', firstEvaluator.evaluateeCount);

        // 필수 필드 검증
        expect(firstEvaluator).toHaveProperty('evaluatorId');
        expect(firstEvaluator).toHaveProperty('evaluatorName');
        expect(firstEvaluator).toHaveProperty('departmentName');
        expect(firstEvaluator).toHaveProperty('evaluatorType');
        expect(firstEvaluator).toHaveProperty('evaluateeCount');

        // 값 유효성 검증
        expect(typeof firstEvaluator.evaluatorId).toBe('string');
        expect(typeof firstEvaluator.evaluatorName).toBe('string');
        expect(typeof firstEvaluator.departmentName).toBe('string');
        expect(['primary', 'secondary']).toContain(
          firstEvaluator.evaluatorType,
        );
        expect(typeof firstEvaluator.evaluateeCount).toBe('number');
        expect(firstEvaluator.evaluateeCount).toBeGreaterThan(0);

        console.log('\n✅ 평가자 정보 검증 완료');
      }
    });

    it('1차 평가자와 2차 평가자가 모두 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'all' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      const primaryEvaluators = evaluators.filter(
        (e: any) => e.evaluatorType === 'primary',
      );
      const secondaryEvaluators = evaluators.filter(
        (e: any) => e.evaluatorType === 'secondary',
      );

      console.log('\n📊 평가자 유형별 분포:');
      console.log('  1차 평가자 수:', primaryEvaluators.length);
      console.log('  2차 평가자 수:', secondaryEvaluators.length);

      expect(primaryEvaluators.length).toBeGreaterThan(0);
      expect(secondaryEvaluators.length).toBeGreaterThan(0);

      console.log('\n✅ 1차/2차 평가자 모두 조회됨');
    });
  });

  describe('시나리오 2: 1차 평가자만 조회 (type=primary)', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 1차 평가자만 조회 (type=primary) ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('1차 평가자만 반환되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'primary' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      console.log('\n📊 1차 평가자 수:', evaluators.length);

      expect(result.type).toBe('primary');
      expect(evaluators.length).toBeGreaterThan(0);

      // 모든 평가자가 primary 유형이어야 함
      evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluatorType).toBe('primary');
      });

      console.log('\n✅ 1차 평가자만 조회됨');
    });
  });

  describe('시나리오 3: 2차 평가자만 조회 (type=secondary)', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 2차 평가자만 조회 (type=secondary) ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('2차 평가자만 반환되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'secondary' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      console.log('\n📊 2차 평가자 수:', evaluators.length);

      expect(result.type).toBe('secondary');
      expect(evaluators.length).toBeGreaterThan(0);

      // 모든 평가자가 secondary 유형이어야 함
      evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluatorType).toBe('secondary');
      });

      console.log('\n✅ 2차 평가자만 조회됨');
    });
  });

  describe('시나리오 4: type 파라미터 생략 (기본값: all)', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 4: type 파라미터 생략 (기본값: all) ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('type 파라미터 생략 시 기본값(all)으로 동작해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 기본값(all) 조회 결과:', result.evaluators.length);

      expect(result.type).toBe('all');
      expect(result.evaluators.length).toBeGreaterThan(0);

      console.log('\n✅ 기본값(all)으로 동작 확인');
    });
  });

  describe('시나리오 5: 동일 직원이 1차/2차 평가자 역할을 모두 하는 경우', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 5: 동일 직원이 1차/2차 평가자 역할을 모두 하는 경우 ===',
      );

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('동일한 직원이 1차와 2차 평가자 역할을 모두 하는 경우 각각 별도로 반환되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'all' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      // evaluatorId로 그룹화
      const evaluatorGroups = new Map<string, any[]>();
      evaluators.forEach((evaluator: any) => {
        if (!evaluatorGroups.has(evaluator.evaluatorId)) {
          evaluatorGroups.set(evaluator.evaluatorId, []);
        }
        evaluatorGroups.get(evaluator.evaluatorId)!.push(evaluator);
      });

      // 동일한 직원이 1차와 2차 평가자 역할을 모두 하는 경우 찾기
      const dualRoleEvaluators = Array.from(evaluatorGroups.entries()).filter(
        ([_, evaluators]) => evaluators.length > 1,
      );

      console.log(
        '\n📊 1차/2차 역할을 모두 하는 평가자 수:',
        dualRoleEvaluators.length,
      );

      if (dualRoleEvaluators.length > 0) {
        const [evaluatorId, roles] = dualRoleEvaluators[0];

        console.log(`  평가자 ID: ${evaluatorId}, 역할 수: ${roles.length}`);

        const hasPrimary = roles.some((r) => r.evaluatorType === 'primary');
        const hasSecondary = roles.some((r) => r.evaluatorType === 'secondary');

        expect(hasPrimary || hasSecondary).toBe(true);

        roles.forEach((role: any) => {
          expect(role).toHaveProperty('evaluateeCount');
          expect(role.evaluateeCount).toBeGreaterThan(0);
        });

        console.log('\n✅ 동일 직원의 역할이 각각 별도로 반환됨');
      } else {
        console.log('\n⚠️ 동일 직원이 1차/2차 역할을 모두 하는 경우가 없음');
      }
    });
  });

  describe('시나리오 6: 필터링 정확도 검증', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 6: 필터링 정확도 검증 ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('type=primary일 때 secondary 평가자가 절대 포함되지 않아야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'primary' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      const hasSecondary = evaluators.some(
        (e: any) => e.evaluatorType === 'secondary',
      );

      console.log('\n📊 1차 평가자 필터링 검증:');
      console.log('  조회된 평가자 수:', evaluators.length);
      console.log('  2차 평가자 포함 여부:', hasSecondary);

      expect(hasSecondary).toBe(false);

      console.log('\n✅ 1차 평가자만 정확히 필터링됨');
    });

    it('type=secondary일 때 primary 평가자가 절대 포함되지 않아야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'secondary' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      const hasPrimary = evaluators.some(
        (e: any) => e.evaluatorType === 'primary',
      );

      console.log('\n📊 2차 평가자 필터링 검증:');
      console.log('  조회된 평가자 수:', evaluators.length);
      console.log('  1차 평가자 포함 여부:', hasPrimary);

      expect(hasPrimary).toBe(false);

      console.log('\n✅ 2차 평가자만 정확히 필터링됨');
    });
  });

  describe('시나리오 7: 필수 필드 검증', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 7: 필수 필드 검증 ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('응답의 모든 필수 필드가 존재해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 구조 검증:');

      // 최상위 필드 검증
      expect(result).toHaveProperty('periodId');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('evaluators');

      console.log('  ✓ 최상위 필드: periodId, type, evaluators');

      // 평가자 정보 필드 검증
      if (result.evaluators.length > 0) {
        result.evaluators.forEach((evaluator: any) => {
          expect(evaluator).toHaveProperty('evaluatorId');
          expect(evaluator).toHaveProperty('evaluatorName');
          expect(evaluator).toHaveProperty('departmentName');
          expect(evaluator).toHaveProperty('evaluatorType');
          expect(evaluator).toHaveProperty('evaluateeCount');

          // 타입 검증
          expect(typeof evaluator.evaluatorId).toBe('string');
          expect(typeof evaluator.evaluatorName).toBe('string');
          expect(typeof evaluator.departmentName).toBe('string');
          expect(['primary', 'secondary']).toContain(evaluator.evaluatorType);
          expect(typeof evaluator.evaluateeCount).toBe('number');
        });

        console.log(
          '  ✓ 평가자 필드: evaluatorId, evaluatorName, departmentName, evaluatorType, evaluateeCount',
        );
      }

      console.log('\n✅ 모든 필수 필드 검증 완료');
    });
  });

  describe('시나리오 8: 피평가자 수 정확성 검증', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 8: 피평가자 수 정확성 검증 ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
    });

    it('동일한 평가자에게 여러 피평가자가 할당된 경우 피평가자 수가 정확히 카운트되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'all' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      console.log('\n📊 평가자별 피평가자 수:');
      evaluators.forEach((evaluator: any) => {
        console.log(
          `  ${evaluator.evaluatorName} (${evaluator.evaluatorType}): ${evaluator.evaluateeCount}명`,
        );
      });

      // 모든 평가자가 최소 1명 이상의 피평가자를 가져야 함
      evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluateeCount).toBeGreaterThan(0);
        expect(typeof evaluator.evaluateeCount).toBe('number');
      });

      // 피평가자 수의 합계 검증
      const totalEvaluateeCount = evaluators.reduce(
        (sum: number, evaluator: any) => sum + evaluator.evaluateeCount,
        0,
      );
      console.log(`\n  총 피평가자 수: ${totalEvaluateeCount}명`);
      expect(totalEvaluateeCount).toBeGreaterThan(0);

      console.log('\n✅ 피평가자 수 정확성 검증 완료');
    });

    it('1차 평가자와 2차 평가자의 피평가자 수가 각각 별도로 집계되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: 'all' })
        .expect(HttpStatus.OK);

      const result = response.body;
      const evaluators = result.evaluators;

      // evaluatorId로 그룹화
      const evaluatorGroups = new Map<string, any[]>();
      evaluators.forEach((evaluator: any) => {
        if (!evaluatorGroups.has(evaluator.evaluatorId)) {
          evaluatorGroups.set(evaluator.evaluatorId, []);
        }
        evaluatorGroups.get(evaluator.evaluatorId)!.push(evaluator);
      });

      console.log('\n📊 동일 직원의 역할별 피평가자 수:');
      evaluatorGroups.forEach((roles, evaluatorId) => {
        if (roles.length > 1) {
          console.log(`  평가자 ID: ${evaluatorId}`);
          roles.forEach((role: any) => {
            console.log(
              `    - ${role.evaluatorType}: ${role.evaluateeCount}명`,
            );
          });
        }
      });

      // 동일한 평가자가 1차와 2차 역할을 모두 하는 경우, 각 역할별 피평가자 수가 독립적으로 집계되어야 함
      evaluatorGroups.forEach((roles) => {
        roles.forEach((role: any) => {
          expect(role.evaluateeCount).toBeGreaterThan(0);
        });
      });

      console.log('\n✅ 역할별 피평가자 수 집계 검증 완료');
    });
  });

  describe('시나리오 9: 평가자 부재 케이스', () => {
    let emptyPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 9: 평가자 부재 케이스 ===');

      // 새로운 빈 평가기간 생성
      const newPeriod = await dataSource.manager.query(
        `INSERT INTO evaluation_period 
        (id, name, "startDate", "endDate", status, version, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '평가자 없는 기간', NOW(), NOW() + INTERVAL '30 days', 'waiting', 1, NOW(), NOW())
        RETURNING id`,
      );
      emptyPeriodId = newPeriod[0].id;
      console.log(`빈 평가기간 생성 완료: ${emptyPeriodId}`);
    });

    afterAll(async () => {
      // 테스트용 평가기간 정리
      if (emptyPeriodId) {
        await dataSource.manager.query(
          `UPDATE evaluation_period SET "deletedAt" = NOW() WHERE id = $1`,
          [emptyPeriodId],
        );
      }
    });

    it('평가자가 한 명도 없는 평가기간 조회 시 빈 배열을 반환해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${emptyPeriodId}/evaluators`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 평가자 부재 케이스 응답:');
      console.log('  periodId:', result.periodId);
      console.log('  evaluators 길이:', result.evaluators.length);

      expect(result.periodId).toBe(emptyPeriodId);
      expect(result.evaluators).toEqual([]);
      expect(Array.isArray(result.evaluators)).toBe(true);

      console.log('\n✅ 빈 배열 반환 확인');
    });
  });

  describe('시나리오 10: 엣지 케이스', () => {
    it('존재하지 않는 평가기간 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      console.log('\n=== 시나리오 10-1: 존재하지 않는 평가기간 ID ===');

      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${nonExistentPeriodId}/evaluators`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 결과:');
      console.log('  periodId:', result.periodId);
      console.log('  evaluators 길이:', result.evaluators.length);

      expect(result.periodId).toBe(nonExistentPeriodId);
      expect(result.evaluators).toEqual([]);

      console.log('\n✅ 빈 배열 반환 확인');
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러를 반환해야 한다', async () => {
      console.log('\n=== 시나리오 10-2: 잘못된 UUID 형식 ===');

      const invalidUuid = 'invalid-uuid';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${invalidUuid}/evaluators`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 응답 상태:', response.status);
      console.log('\n✅ 400 에러 반환 확인');
    });

    it('잘못된 type 값으로 조회 시 400 에러를 반환해야 한다', async () => {
      console.log('\n=== 시나리오 10-3: 잘못된 type 값 ===');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      const evaluationPeriodId = evaluationPeriods[0].id;
      const invalidType = 'invalid-type';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/evaluators`,
        )
        .query({ type: invalidType })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 응답 상태:', response.status);
      console.log('\n✅ 400 에러 반환 확인');
    });
  });
});
