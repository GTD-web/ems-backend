/**
 * 대시보드 자기평가 제출 상태 조회 E2E 테스트
 *
 * 대시보드 조회 시 1차 평가자와 피평가자 간의 제출 상태가 올바르게 조회되는지 검증합니다.
 *
 * 테스트 전략:
 * 1. 시드 데이터 생성
 * 2. 자기평가 생성 및 제출
 * 3. 대시보드 조회 API 호출
 * 4. isSubmittedToEvaluator 상태 검증
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { Repository } from 'typeorm';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status - 자기평가 제출 상태 조회', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('자기평가 제출 상태 조회', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let evaluationIds: string[] = [];

    beforeAll(async () => {
      // 1. 기존 데이터 정리
      console.log('기존 시드 데이터 정리 중...');
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

      // 2. 시드 데이터 생성
      console.log('시드 데이터 생성 중...');
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 10,
            projectCount: 3,
            wbsPerProject: 3,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // 자기평가는 미제출 상태로 생성
            selfEvaluationProgress: {
              notStarted: 0.0,
              inProgress: 1.0, // 작성은 되어있지만 제출 안된 상태
              completed: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              notStarted: 1.0,
              inProgress: 0.0,
              completed: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              notStarted: 1.0,
              inProgress: 0.0,
              completed: 0.0,
            },
            peerEvaluationProgress: {
              notStarted: 1.0,
              inProgress: 0.0,
              completed: 0.0,
            },
            finalEvaluationProgress: {
              notStarted: 1.0,
              inProgress: 0.0,
              completed: 0.0,
            },
          },
        })
        .expect(HttpStatus.CREATED);

      console.log('시드 데이터 생성 완료');

      // 3. 생성된 평가기간과 직원 조회 (데이터베이스에서)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .find({
          where: { deletedAt: null as any },
          order: { createdAt: 'DESC' },
          take: 1,
        });

      if (evaluationPeriods.length === 0) {
        throw new Error('평가기간을 찾을 수 없습니다.');
      }

      evaluationPeriodId = evaluationPeriods[0].id;
      console.log('평가기간 ID:', evaluationPeriodId);

      // 평가 대상 직원 조회 (데이터베이스에서)
      const employees = await dataSource
        .getRepository('Employee')
        .find({
          where: {
            deletedAt: null as any,
            status: '재직중',
          },
          take: 1,
        });

      if (employees.length === 0) {
        throw new Error('재직 중인 직원을 찾을 수 없습니다.');
      }

      employeeId = employees[0].id;
      console.log('직원 ID:', employeeId);

      // 4. 해당 직원의 자기평가 조회 및 내용/점수 추가
      const evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        },
      });

      evaluationIds = evaluations.map((e) => e.id);
      console.log('자기평가 ID:', evaluationIds);

      // 자기평가에 내용과 점수 추가 (제출 가능하도록)
      for (const evaluation of evaluations) {
        evaluation.selfEvaluationContent = '자기평가 내용';
        evaluation.selfEvaluationScore = 100;
        evaluation.performanceResult = '성과 결과';
        await wbsSelfEvaluationRepository.save(evaluation);
      }
    });

    it('모든 자기평가가 1차 평가자에게 제출되지 않은 경우 isSubmittedToEvaluator가 false여야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.selfEvaluation).toBeDefined();
      expect(response.body.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(response.body.selfEvaluation.totalMappingCount).toBeGreaterThan(0);
      expect(response.body.selfEvaluation.completedMappingCount).toBe(0);
    });

    it('일부 자기평가만 1차 평가자에게 제출된 경우 isSubmittedToEvaluator가 false여야 한다', async () => {
      // Given - 첫 번째 자기평가만 1차 평가자에게 제출
      if (evaluationIds.length === 0) {
        throw new Error('자기평가가 없습니다.');
      }

      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${evaluationIds[0]}/submit-to-evaluator`,
        )
        .expect(HttpStatus.OK);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(response.body.selfEvaluation.totalMappingCount).toBeGreaterThan(0);
    });

    it('모든 자기평가가 1차 평가자에게 제출된 경우 isSubmittedToEvaluator가 true여야 한다', async () => {
      // Given - 나머지 자기평가도 1차 평가자에게 제출
      for (let i = 1; i < evaluationIds.length; i++) {
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationIds[i]}/submit-to-evaluator`,
          )
          .expect(HttpStatus.OK);
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(response.body.selfEvaluation.totalMappingCount).toBe(evaluationIds.length);
      expect(response.body.selfEvaluation.completedMappingCount).toBe(0); // 관리자에게는 아직 제출 안함
    });

    it('1차 평가자에게 제출 후 관리자에게도 제출한 경우 상태가 올바르게 조회되어야 한다', async () => {
      // Given - 모든 자기평가를 1차 평가자에게 먼저 제출 (이전 테스트에서 이미 제출됨)
      // 그 다음 관리자에게 제출
      for (const evaluationId of evaluationIds) {
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
          )
          .expect(HttpStatus.OK);
      }

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(response.body.selfEvaluation.totalMappingCount).toBe(evaluationIds.length);
      expect(response.body.selfEvaluation.completedMappingCount).toBe(evaluationIds.length); // 관리자에게 모두 제출됨
      expect(response.body.selfEvaluation.totalScore).not.toBeNull(); // 점수 계산됨
      // 등급은 평가기간에 등급 구간이 설정되어야 계산됨 (설정되지 않으면 null일 수 있음)
    });
  });
});

