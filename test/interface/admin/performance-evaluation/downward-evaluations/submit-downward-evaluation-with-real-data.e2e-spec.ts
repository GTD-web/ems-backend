/**
 * 하향평가 제출 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오의 미완료 하향평가를 완료 상태로 제출하는 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/performance-evaluation/downward-evaluations - 제출 (실제 데이터)', () => {
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

    // full 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'full',
        clearExisting: false,
      })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getIncompletePrimaryEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT de.id, de."employeeId", de."evaluatorId", de."periodId", de."wbsId"
       FROM downward_evaluation de
       WHERE de."evaluationType" = 'primary'
       AND de."isCompleted" = false
       AND de."downwardEvaluationContent" IS NOT NULL
       AND de."downwardEvaluationScore" IS NOT NULL
       AND de."deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async function getIncompleteSecondaryEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT de.id, de."employeeId", de."evaluatorId", de."periodId", de."wbsId"
       FROM downward_evaluation de
       WHERE de."evaluationType" = 'secondary'
       AND de."isCompleted" = false
       AND de."downwardEvaluationContent" IS NOT NULL
       AND de."downwardEvaluationScore" IS NOT NULL
       AND de."deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('1차 하향평가 제출', () => {
    it('미완료 1차 하향평가를 제출할 수 있어야 한다', async () => {
      const evaluation = await getIncompletePrimaryEvaluation();

      if (!evaluation) {
        console.log('미완료 1차 평가가 없어서 테스트 스킵');
        return;
      }

      console.log(`\n평가 ID: ${evaluation.id}`);

      // When - 제출 요청
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluation.employeeId}/period/${evaluation.periodId}/wbs/${evaluation.wbsId}/primary/submit`,
        )
        .send({ evaluatorId: evaluation.evaluatorId })
        .expect(HttpStatus.OK);

      // Then - DB에서 직접 확인
      const updatedEval = await dataSource.query(
        `SELECT "isCompleted", "completedAt"
         FROM downward_evaluation
         WHERE id = $1`,
        [evaluation.id],
      );

      // isCompleted가 true로 변경되었는지 확인
      expect(updatedEval[0].isCompleted).toBe(true);
      // completedAt이 설정되었는지 확인
      expect(updatedEval[0].completedAt).toBeDefined();
      expect(updatedEval[0].completedAt).not.toBeNull();

      console.log('\n✅ 1차 하향평가 제출 성공');
    });

    it('완료된 1차 하향평가는 다시 제출할 수 없어야 한다', async () => {
      const evaluations = await dataSource.query(
        `SELECT de.id, de."employeeId", de."evaluatorId", de."periodId", de."wbsId"
         FROM downward_evaluation de
         WHERE de."evaluationType" = 'primary'
         AND de."isCompleted" = true
         AND de."deletedAt" IS NULL
         LIMIT 1`,
      );

      if (!evaluations || evaluations.length === 0) {
        console.log('완료된 1차 평가가 없어서 테스트 스킵');
        return;
      }

      const evaluation = evaluations[0];

      // When - 완료된 평가를 다시 제출 시도 (409 Conflict 예상)
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluation.employeeId}/period/${evaluation.periodId}/wbs/${evaluation.wbsId}/primary/submit`,
        )
        .send({ evaluatorId: evaluation.evaluatorId })
        .expect(HttpStatus.CONFLICT);

      console.log('\n✅ 완료된 평가 재제출 방지 성공');
    });
  });

  describe('2차 하향평가 제출', () => {
    it('미완료 2차 하향평가를 제출할 수 있어야 한다', async () => {
      const evaluation = await getIncompleteSecondaryEvaluation();

      if (!evaluation) {
        console.log('미완료 2차 평가가 없어서 테스트 스킵');
        return;
      }

      // When - 제출 요청
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluation.employeeId}/period/${evaluation.periodId}/wbs/${evaluation.wbsId}/secondary/submit`,
        )
        .send({ evaluatorId: evaluation.evaluatorId })
        .expect(HttpStatus.OK);

      // Then - DB에서 직접 확인
      const updatedEval = await dataSource.query(
        `SELECT "isCompleted", "completedAt"
         FROM downward_evaluation
         WHERE id = $1`,
        [evaluation.id],
      );

      // isCompleted가 true로 변경되었는지 확인
      expect(updatedEval[0].isCompleted).toBe(true);
      // completedAt이 설정되었는지 확인
      expect(updatedEval[0].completedAt).toBeDefined();
      expect(updatedEval[0].completedAt).not.toBeNull();

      console.log('\n✅ 2차 하향평가 제출 성공');
    });
  });

  describe('실패 시나리오', () => {
    it('존재하지 않는 평가를 제출할 수 없어야 한다', async () => {
      // 평가라인 매핑이 있는 조합 찾기
      const mappings = await dataSource.query(
        `SELECT elm."employeeId", elm."evaluatorId", elm."wbsItemId", ewa."periodId"
         FROM evaluation_line_mappings elm
         INNER JOIN evaluation_lines el ON el.id = elm."evaluationLineId"
         INNER JOIN evaluation_wbs_assignment ewa 
           ON ewa."employeeId" = elm."employeeId"
           AND ewa."wbsItemId" = elm."wbsItemId"
         LEFT JOIN downward_evaluation de 
           ON de."employeeId" = elm."employeeId"
           AND de."evaluatorId" = elm."evaluatorId"
           AND de."periodId" = ewa."periodId"
           AND de."wbsId" = elm."wbsItemId"
           AND de."evaluationType" = 'primary'
           AND de."deletedAt" IS NULL
         WHERE el."evaluatorType" = 'primary'
         AND elm."deletedAt" IS NULL
         AND el."deletedAt" IS NULL
         AND ewa."deletedAt" IS NULL
         AND de.id IS NULL
         LIMIT 1`,
      );

      if (!mappings || mappings.length === 0) {
        console.log('평가가 없는 매핑을 찾을 수 없어서 테스트 스킵');
        return;
      }

      const mapping = mappings[0];

      // When - 존재하지 않는 평가 제출 시도
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${mapping.employeeId}/period/${mapping.periodId}/wbs/${mapping.wbsItemId}/primary/submit`,
        )
        .send({ evaluatorId: mapping.evaluatorId })
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 평가 제출 방지 성공');
    });

    it('잘못된 evaluatorId로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluation = await getIncompletePrimaryEvaluation();

      if (!evaluation) {
        console.log('미완료 평가가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluation.employeeId}/period/${evaluation.periodId}/wbs/${evaluation.wbsId}/primary/submit`,
        )
        .send({ evaluatorId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluatorId 테스트 성공');
    });
  });
});
