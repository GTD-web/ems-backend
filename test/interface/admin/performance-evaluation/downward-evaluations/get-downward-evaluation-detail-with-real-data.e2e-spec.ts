/**
 * 하향평가 상세 조회 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오에서 생성된 하향평가 상세 정보를 조회하는 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/downward-evaluations/:id - 상세 조회 (실제 데이터)', () => {
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

  async function getExistingEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT id, "employeeId", "evaluatorId", "periodId", "wbsId", "evaluationType", "isCompleted"
       FROM downward_evaluation
       WHERE "deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async function getPrimaryEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT id
       FROM downward_evaluation
       WHERE "evaluationType" = 'primary' AND "deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async function getSecondaryEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT id
       FROM downward_evaluation
       WHERE "evaluationType" = 'secondary' AND "deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async function getCompletedEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT id
       FROM downward_evaluation
       WHERE "isCompleted" = true AND "deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async function getIncompleteEvaluation() {
    const evaluations = await dataSource.query(
      `SELECT id
       FROM downward_evaluation
       WHERE "isCompleted" = false AND "deletedAt" IS NULL
       LIMIT 1`,
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 시나리오', () => {
    it('하향평가 ID로 상세정보를 조회할 수 있어야 한다', async () => {
      const evaluation = await getExistingEvaluation();

      if (!evaluation) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      console.log(`\n평가 ID: ${evaluation.id}`);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${evaluation.id}`,
        )
        .expect(HttpStatus.OK);

      // Then - 모든 필드 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(evaluation.id);

      // 관련 엔티티 객체 검증
      expect(response.body).toHaveProperty('employee');
      expect(response.body.employee).not.toBeNull();
      expect(response.body.employee.id).toBe(evaluation.employeeId);
      expect(response.body.employee.name).toBeDefined();
      expect(response.body.employee.employeeNumber).toBeDefined();
      expect(response.body.employee.email).toBeDefined();
      expect(response.body.employee.departmentId).toBeDefined();
      expect(response.body.employee.status).toBeDefined();

      expect(response.body).toHaveProperty('evaluator');
      expect(response.body.evaluator).not.toBeNull();
      expect(response.body.evaluator.id).toBe(evaluation.evaluatorId);
      expect(response.body.evaluator.name).toBeDefined();
      expect(response.body.evaluator.employeeNumber).toBeDefined();

      expect(response.body).toHaveProperty('wbsItem');
      expect(response.body.wbsItem).not.toBeNull();
      expect(response.body.wbsItem.id).toBe(evaluation.wbsId);
      expect(response.body.wbsItem.title).toBeDefined();

      expect(response.body).toHaveProperty('period');
      expect(response.body.period).not.toBeNull();
      expect(response.body.period.id).toBe(evaluation.periodId);
      expect(response.body.period.name).toBeDefined();

      expect(response.body).toHaveProperty('evaluationDate');
      expect(response.body.evaluationDate).toBeDefined();

      expect(response.body).toHaveProperty('evaluationType');
      expect(response.body.evaluationType).toBe(evaluation.evaluationType);
      expect(['primary', 'secondary']).toContain(response.body.evaluationType);

      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body.isCompleted).toBe(evaluation.isCompleted);

      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.createdAt).toBeDefined();

      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.updatedAt).toBeDefined();

      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('number');

      console.log('\n✅ 하향평가 상세정보 조회 성공');
    });

    it('1차 하향평가의 상세정보를 조회할 수 있어야 한다', async () => {
      const evaluation = await getPrimaryEvaluation();

      if (!evaluation) {
        console.log('1차 하향평가가 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${evaluation.id}`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationType).toBe('primary');

      console.log('\n✅ 1차 하향평가 상세 조회 성공');
    });

    it('2차 하향평가의 상세정보를 조회할 수 있어야 한다', async () => {
      const evaluation = await getSecondaryEvaluation();

      if (!evaluation) {
        console.log('2차 하향평가가 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${evaluation.id}`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluationType).toBe('secondary');

      console.log('\n✅ 2차 하향평가 상세 조회 성공');
    });

    it('완료된 평가는 completedAt과 평가 내용이 포함되어야 한다', async () => {
      const evaluation = await getCompletedEvaluation();

      if (!evaluation) {
        console.log('완료된 평가가 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${evaluation.id}`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.isCompleted).toBe(true);
      expect(response.body.completedAt).toBeDefined();
      expect(response.body.completedAt).not.toBeNull();

      // 완료된 평가는 점수와 내용이 있어야 함
      expect(response.body).toHaveProperty('downwardEvaluationScore');
      expect(response.body).toHaveProperty('downwardEvaluationContent');

      console.log('\n✅ 완료 평가 상태 검증 성공');
      console.log(`   - 평가 점수: ${response.body.downwardEvaluationScore}`);
    });

    it('미완료 평가는 completedAt이 null이어야 한다', async () => {
      const evaluation = await getIncompleteEvaluation();

      if (!evaluation) {
        console.log('미완료 평가가 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${evaluation.id}`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.isCompleted).toBe(false);
      expect(response.body.completedAt).toBeNull();

      console.log('\n✅ 미완료 평가 상태 검증 성공');
    });

    it('타임스탬프 필드들이 올바르게 반환되어야 한다', async () => {
      const evaluation = await getExistingEvaluation();

      if (!evaluation) {
        console.log('평가가 없어서 테스트 스킵');
        return;
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${evaluation.id}`,
        )
        .expect(HttpStatus.OK);

      // Then - 날짜 형식 검증
      expect(response.body.evaluationDate).toBeDefined();
      expect(new Date(response.body.evaluationDate).toString()).not.toBe(
        'Invalid Date',
      );

      expect(response.body.createdAt).toBeDefined();
      expect(new Date(response.body.createdAt).toString()).not.toBe(
        'Invalid Date',
      );

      expect(response.body.updatedAt).toBeDefined();
      expect(new Date(response.body.updatedAt).toString()).not.toBe(
        'Invalid Date',
      );

      console.log('\n✅ 타임스탬프 필드 검증 성공');
    });
  });

  describe('실패 시나리오', () => {
    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/${nonExistentId}`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 ID 테스트 성공');
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .get(
          '/admin/performance-evaluation/downward-evaluations/invalid-uuid',
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 테스트 성공');
    });
  });
});

