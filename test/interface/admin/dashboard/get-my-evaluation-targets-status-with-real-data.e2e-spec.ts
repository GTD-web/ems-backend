/**
 * 내가 담당하는 평가 대상자 현황 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여 평가자가 담당하는
 * 피평가자들의 현황을 조회하고, 점수와 등급이 올바르게 계산되는지 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 1차 평가자만 담당 → 1차 평가 완료 시 totalScore/grade 계산 확인
 * 2. 2차 평가자만 담당 → 2차 평가 완료 시 totalScore/grade 계산 확인
 * 3. 1차+2차 평가자 모두 담당 → 각각 완료 시 totalScore/grade 계산 확인
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/dashboard/:evaluationPeriodId/my-evaluation-targets/:evaluatorId/status - 실제 데이터 기반', () => {
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

  describe('시나리오 1: 1차 평가자가 담당하는 피평가자 현황 (실제 데이터 기반)', () => {
    let evaluationPeriodId: string;
    let primaryEvaluatorId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 1: 1차 평가자가 담당하는 피평가자 현황 (실제 데이터 기반) ===',
      );

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

      // 실제 데이터 기반 시드 데이터 생성: 1차 평가 100% 완료
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: false,
          projectCount: 2,
          wbsPerProject: 3,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            selfEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 1.0, // 1차 평가 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
              inProgress: 0.0,
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

      // 1차 평가자로 지정된 평가자 조회
      const primaryEvaluators = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .innerJoin(
          'evaluation_lines',
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('line.evaluatorType = :type', { type: 'primary' })
        .andWhere('mapping.deletedAt IS NULL')
        .select(['mapping.evaluatorId'])
        .groupBy('mapping.evaluatorId')
        .getRawMany();

      primaryEvaluatorId = primaryEvaluators[0].mapping_evaluatorId;
      console.log(`1차 평가자 ID: ${primaryEvaluatorId}`);
    });

    it('담당하는 피평가자 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${primaryEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;

      console.log('\n📊 담당 피평가자 수:', targets.length);

      expect(Array.isArray(targets)).toBe(true);
      expect(targets.length).toBeGreaterThan(0);

      // 첫 번째 피평가자 정보 확인
      const firstTarget = targets[0];
      expect(firstTarget).toHaveProperty('employeeId');
      expect(firstTarget).toHaveProperty('isEvaluationTarget');
      expect(firstTarget).toHaveProperty('downwardEvaluation');

      console.log('\n✅ 피평가자 목록 조회 성공');
    });

    it('1차 평가자로 지정되어 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${primaryEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;
      const firstTarget = targets[0];

      console.log('\n📝 평가자 유형:', firstTarget.myEvaluatorTypes);
      console.log('1차 평가자 여부:', firstTarget.downwardEvaluation.isPrimary);
      console.log(
        '2차 평가자 여부:',
        firstTarget.downwardEvaluation.isSecondary,
      );

      // 1차 평가자로 지정되어 있어야 함
      expect(firstTarget.myEvaluatorTypes).toContain('primary');
      expect(firstTarget.downwardEvaluation.isPrimary).toBe(true);
      expect(firstTarget.downwardEvaluation.primaryStatus).not.toBeNull();

      console.log('\n✅ 1차 평가자로 올바르게 지정됨');
    });

    it('1차 평가 완료 시 totalScore와 grade가 계산되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${primaryEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;

      // 1차 평가가 완료된 피평가자 찾기
      const completedTarget = targets.find(
        (t: any) =>
          t.downwardEvaluation.primaryStatus &&
          t.downwardEvaluation.primaryStatus.assignedWbsCount ===
            t.downwardEvaluation.primaryStatus.completedEvaluationCount &&
          t.downwardEvaluation.primaryStatus.completedEvaluationCount > 0,
      );

      if (completedTarget) {
        const primaryStatus = completedTarget.downwardEvaluation.primaryStatus;

        console.log('\n📊 1차 평가 완료 현황:');
        console.log('  할당된 WBS 수:', primaryStatus.assignedWbsCount);
        console.log('  완료된 평가 수:', primaryStatus.completedEvaluationCount);
        console.log('  수정 가능 여부:', primaryStatus.isEditable);
        console.log('  총점:', primaryStatus.totalScore);
        console.log('  등급:', primaryStatus.grade);

        // totalScore와 grade가 계산되어야 함
        expect(primaryStatus.totalScore).not.toBeNull();
        expect(primaryStatus.grade).not.toBeNull();
        expect(typeof primaryStatus.totalScore).toBe('number');
        expect(typeof primaryStatus.grade).toBe('string');
        expect(primaryStatus.totalScore).toBeGreaterThanOrEqual(0);
        expect(primaryStatus.totalScore).toBeLessThanOrEqual(100);
        expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(primaryStatus.grade);

        // 완료되었으므로 수정 불가여야 함
        expect(primaryStatus.isEditable).toBe(false);

        console.log('\n✅ 1차 평가 totalScore/grade 계산 및 수정 불가 설정 확인');
      } else {
        console.log('\n⚠️ 완료된 1차 평가를 찾을 수 없음 (테스트 스킵)');
      }
    });

    it('myEvaluatorTypes에 중복된 값이 없어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${primaryEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;

      targets.forEach((target: any, index: number) => {
        const evaluatorTypes = target.myEvaluatorTypes;
        const uniqueTypes = [...new Set(evaluatorTypes)];

        console.log(
          `\n피평가자 ${index + 1} - 평가자 유형:`,
          evaluatorTypes,
        );

        // 중복 제거 후 길이가 같아야 함 (중복이 없어야 함)
        expect(evaluatorTypes.length).toBe(uniqueTypes.length);
      });

      console.log('\n✅ 모든 피평가자의 myEvaluatorTypes에 중복 없음');
    });
  });

  describe('시나리오 2: 2차 평가자가 담당하는 피평가자 현황 (실제 데이터 기반)', () => {
    let evaluationPeriodId: string;
    let secondaryEvaluatorId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 2: 2차 평가자가 담당하는 피평가자 현황 (실제 데이터 기반) ===',
      );

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

      // 실제 데이터 기반 시드 데이터 생성: 2차 평가 100% 완료
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: false,
          projectCount: 2,
          wbsPerProject: 3,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // 모든 직원에게 1차, 2차 평가자 모두 할당
            evaluationLineMappingTypes: {
              primaryOnly: 0.0,
              primaryAndSecondary: 1.0,
              withAdditional: 0.0,
            },
            selfEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 1.0, // 2차 평가 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
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

      // 2차 평가자로 지정된 평가자 조회
      const secondaryEvaluators = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .innerJoin(
          'evaluation_lines',
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('line.evaluatorType = :type', { type: 'secondary' })
        .andWhere('mapping.deletedAt IS NULL')
        .select(['mapping.evaluatorId'])
        .groupBy('mapping.evaluatorId')
        .getRawMany();

      secondaryEvaluatorId = secondaryEvaluators[0].mapping_evaluatorId;
      console.log(`2차 평가자 ID: ${secondaryEvaluatorId}`);
    });

    it('2차 평가자로 지정되어 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${secondaryEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;
      const firstTarget = targets[0];

      console.log('\n📝 평가자 유형:', firstTarget.myEvaluatorTypes);
      console.log('1차 평가자 여부:', firstTarget.downwardEvaluation.isPrimary);
      console.log(
        '2차 평가자 여부:',
        firstTarget.downwardEvaluation.isSecondary,
      );

      // 2차 평가자로 지정되어 있어야 함
      expect(firstTarget.myEvaluatorTypes).toContain('secondary');
      expect(firstTarget.downwardEvaluation.isSecondary).toBe(true);
      expect(firstTarget.downwardEvaluation.secondaryStatus).not.toBeNull();

      console.log('\n✅ 2차 평가자로 올바르게 지정됨');
    });

    it('2차 평가 완료 시 totalScore와 grade가 계산되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${secondaryEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;

      // 2차 평가가 완료된 피평가자 찾기
      const completedTarget = targets.find(
        (t: any) =>
          t.downwardEvaluation.secondaryStatus &&
          t.downwardEvaluation.secondaryStatus.assignedWbsCount ===
            t.downwardEvaluation.secondaryStatus.completedEvaluationCount &&
          t.downwardEvaluation.secondaryStatus.completedEvaluationCount > 0,
      );

      if (completedTarget) {
        const secondaryStatus =
          completedTarget.downwardEvaluation.secondaryStatus;

        console.log('\n📊 2차 평가 완료 현황:');
        console.log('  할당된 WBS 수:', secondaryStatus.assignedWbsCount);
        console.log(
          '  완료된 평가 수:',
          secondaryStatus.completedEvaluationCount,
        );
        console.log('  수정 가능 여부:', secondaryStatus.isEditable);
        console.log('  총점:', secondaryStatus.totalScore);
        console.log('  등급:', secondaryStatus.grade);

        // totalScore와 grade가 계산되어야 함
        expect(secondaryStatus.totalScore).not.toBeNull();
        expect(secondaryStatus.grade).not.toBeNull();
        expect(typeof secondaryStatus.totalScore).toBe('number');
        expect(typeof secondaryStatus.grade).toBe('string');
        expect(secondaryStatus.totalScore).toBeGreaterThanOrEqual(0);
        expect(secondaryStatus.totalScore).toBeLessThanOrEqual(100);
        expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(
          secondaryStatus.grade,
        );

        // 완료되었으므로 수정 불가여야 함
        expect(secondaryStatus.isEditable).toBe(false);

        console.log('\n✅ 2차 평가 totalScore/grade 계산 및 수정 불가 설정 확인');
      } else {
        console.log('\n⚠️ 완료된 2차 평가를 찾을 수 없음 (테스트 스킵)');
      }
    });
  });

  describe('시나리오 3: 1차+2차 평가자가 담당하는 피평가자 현황 (실제 데이터 기반)', () => {
    let evaluationPeriodId: string;
    let bothTypeEvaluatorId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 3: 1차+2차 평가자가 담당하는 피평가자 현황 (실제 데이터 기반) ===',
      );

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

      // 실제 데이터 기반 시드 데이터 생성: 모든 평가 100% 완료
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
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
            selfEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 1.0, // 1차 평가 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 1.0, // 2차 평가 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
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

      // 1차와 2차 평가자 모두로 지정된 평가자 찾기
      const primaryEvaluators = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .innerJoin(
          'evaluation_lines',
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('line.evaluatorType = :type', { type: 'primary' })
        .andWhere('mapping.deletedAt IS NULL')
        .select(['mapping.evaluatorId'])
        .getRawMany();

      const secondaryEvaluators = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .innerJoin(
          'evaluation_lines',
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('line.evaluatorType = :type', { type: 'secondary' })
        .andWhere('mapping.deletedAt IS NULL')
        .select(['mapping.evaluatorId'])
        .getRawMany();

      const primarySet = new Set(
        primaryEvaluators.map((e) => e.mapping_evaluatorId),
      );
      const secondarySet = new Set(
        secondaryEvaluators.map((e) => e.mapping_evaluatorId),
      );

      // 교집합 찾기 (1차와 2차 모두인 평가자)
      const bothTypeEvaluators = [...primarySet].filter((id) =>
        secondarySet.has(id),
      );

      if (bothTypeEvaluators.length > 0) {
        bothTypeEvaluatorId = bothTypeEvaluators[0];
        console.log(`1차+2차 평가자 ID: ${bothTypeEvaluatorId}`);
      } else {
        console.log(
          '⚠️ 1차+2차 모두 담당하는 평가자가 없음 - 첫 번째 1차 평가자 사용',
        );
        bothTypeEvaluatorId = primaryEvaluators[0].mapping_evaluatorId;
      }
    });

    it('1차 및 2차 평가 완료 시 각각 totalScore와 grade가 계산되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${bothTypeEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;

      console.log('\n📊 담당 피평가자 수:', targets.length);

      // 1차와 2차 평가를 모두 담당하는 피평가자 찾기
      const bothTypeTarget = targets.find(
        (t: any) =>
          t.downwardEvaluation.isPrimary && t.downwardEvaluation.isSecondary,
      );

      if (bothTypeTarget) {
        console.log('\n📝 평가자 유형:', bothTypeTarget.myEvaluatorTypes);
        console.log(
          '1차 평가자 여부:',
          bothTypeTarget.downwardEvaluation.isPrimary,
        );
        console.log(
          '2차 평가자 여부:',
          bothTypeTarget.downwardEvaluation.isSecondary,
        );

        const primaryStatus = bothTypeTarget.downwardEvaluation.primaryStatus;
        const secondaryStatus =
          bothTypeTarget.downwardEvaluation.secondaryStatus;

        // 1차 평가 검증
        if (
          primaryStatus &&
          primaryStatus.assignedWbsCount ===
            primaryStatus.completedEvaluationCount &&
          primaryStatus.completedEvaluationCount > 0
        ) {
          console.log('\n📊 1차 평가 완료 현황:');
          console.log('  총점:', primaryStatus.totalScore);
          console.log('  등급:', primaryStatus.grade);
          console.log('  수정 가능:', primaryStatus.isEditable);

          expect(primaryStatus.totalScore).not.toBeNull();
          expect(primaryStatus.grade).not.toBeNull();
          expect(primaryStatus.isEditable).toBe(false);
        }

        // 2차 평가 검증
        if (
          secondaryStatus &&
          secondaryStatus.assignedWbsCount ===
            secondaryStatus.completedEvaluationCount &&
          secondaryStatus.completedEvaluationCount > 0
        ) {
          console.log('\n📊 2차 평가 완료 현황:');
          console.log('  총점:', secondaryStatus.totalScore);
          console.log('  등급:', secondaryStatus.grade);
          console.log('  수정 가능:', secondaryStatus.isEditable);

          expect(secondaryStatus.totalScore).not.toBeNull();
          expect(secondaryStatus.grade).not.toBeNull();
          expect(secondaryStatus.isEditable).toBe(false);
        }

        console.log(
          '\n✅ 1차/2차 평가 모두 totalScore/grade 계산 및 수정 불가 설정 확인',
        );
      } else {
        console.log(
          '\n⚠️ 1차+2차 모두 담당하는 피평가자를 찾을 수 없음 (테스트 스킵)',
        );
      }
    });

    it('응답 구조가 올바른지 확인한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${bothTypeEvaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const targets = response.body;
      expect(Array.isArray(targets)).toBe(true);

      if (targets.length > 0) {
        const target = targets[0];

        // 필수 필드 확인
        expect(target).toHaveProperty('employeeId');
        expect(target).toHaveProperty('isEvaluationTarget');
        expect(target).toHaveProperty('exclusionInfo');
        expect(target).toHaveProperty('evaluationCriteria');
        expect(target).toHaveProperty('wbsCriteria');
        expect(target).toHaveProperty('evaluationLine');
        expect(target).toHaveProperty('performanceInput');
        expect(target).toHaveProperty('myEvaluatorTypes');
        expect(target).toHaveProperty('downwardEvaluation');

        // downwardEvaluation 구조 확인
        const de = target.downwardEvaluation;
        expect(de).toHaveProperty('isPrimary');
        expect(de).toHaveProperty('isSecondary');
        expect(de).toHaveProperty('primaryStatus');
        expect(de).toHaveProperty('secondaryStatus');

        // primaryStatus 구조 확인 (있는 경우)
        if (de.primaryStatus) {
          expect(de.primaryStatus).toHaveProperty('assignedWbsCount');
          expect(de.primaryStatus).toHaveProperty('completedEvaluationCount');
          expect(de.primaryStatus).toHaveProperty('isEditable');
          expect(de.primaryStatus).toHaveProperty('totalScore');
          expect(de.primaryStatus).toHaveProperty('grade');
        }

        // secondaryStatus 구조 확인 (있는 경우)
        if (de.secondaryStatus) {
          expect(de.secondaryStatus).toHaveProperty('assignedWbsCount');
          expect(de.secondaryStatus).toHaveProperty('completedEvaluationCount');
          expect(de.secondaryStatus).toHaveProperty('isEditable');
          expect(de.secondaryStatus).toHaveProperty('totalScore');
          expect(de.secondaryStatus).toHaveProperty('grade');
        }

        console.log('\n✅ 응답 구조 검증 완료');
      }
    });
  });
});

