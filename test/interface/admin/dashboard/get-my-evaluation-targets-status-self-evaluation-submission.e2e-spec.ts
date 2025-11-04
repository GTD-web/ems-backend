/**
 * 대시보드 내가 담당하는 평가 대상자 현황 자기평가 제출 상태 조회 E2E 테스트
 *
 * 내가 담당하는 평가 대상자 현황 조회 시 각 피평가자의 자기평가 제출 상태가 올바르게 조회되는지 검증합니다.
 *
 * 테스트 전략:
 * 1. 시드 데이터 생성
 * 2. 자기평가 생성 및 제출
 * 3. 내가 담당하는 평가 대상자 현황 조회 API 호출
 * 4. selfEvaluation 제출 상태 검증
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { Repository } from 'typeorm';
import { DashboardApiClient } from '../../../usecase/scenarios/api-clients/dashboard.api-client';

describe('GET /admin/dashboard/:evaluationPeriodId/my-evaluation-targets/:evaluatorId/status - 자기평가 제출 상태 조회', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  let dashboardApiClient: DashboardApiClient;

  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;

  let evaluationPeriodId: string;
  let evaluatorId: string;
  let employeeId: string;
  let evaluationIds: string[] = [];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
    dashboardApiClient = new DashboardApiClient(testSuite);

    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);

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

    // 2. 시드 데이터 생성 (full 시나리오)
    console.log('시드 데이터 생성 중...');
    await testSuite
      .request()
      .post('/admin/seed/generate')
      .send({
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 1,
          employeeCount: 2,
          projectCount: 1,
          wbsPerProject: 2,
        },
        evaluationConfig: {
          periodCount: 1,
        },
        stateDistribution: {
          selfEvaluationProgress: {
            completed: 0.0, // 초기에는 모두 미완료 상태로 생성
            notStarted: 1.0,
            inProgress: 0.0,
          },
          primaryDownwardEvaluationProgress: {
            completed: 0.0,
            notStarted: 1.0,
          },
          secondaryDownwardEvaluationProgress: {
            completed: 0.0,
            notStarted: 1.0,
          },
          peerEvaluationProgress: {
            completed: 0.0,
            notStarted: 1.0,
          },
          finalEvaluationProgress: {
            completed: 0.0,
            notStarted: 1.0,
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

    // 평가자 조회 (EvaluationLineMapping에서)
    const lineMappings = await dataSource
      .getRepository('EvaluationLineMapping')
      .find({
        where: {
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: null as any,
        },
        take: 1,
      });

    if (lineMappings.length === 0) {
      throw new Error('평가자를 찾을 수 없습니다.');
    }

    evaluatorId = lineMappings[0].evaluatorId;
    console.log('평가자 ID:', evaluatorId);

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

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('자기평가 제출 상태 조회 (내가 담당하는 평가 대상자)', () => {
    it('모든 자기평가가 1차 평가자에게 제출되지 않은 경우 isSubmittedToEvaluator가 false여야 한다', async () => {
      // When
      const response = await dashboardApiClient.getEvaluatorTargetsStatus({
        periodId: evaluationPeriodId,
        evaluatorId: evaluatorId,
      });

      // Then
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      const target = response.find((t: any) => t.employeeId === employeeId);
      expect(target).toBeDefined();
      expect(target?.selfEvaluation).toBeDefined();
      expect(target?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target?.selfEvaluation.totalSelfEvaluations).toBe(
        evaluationIds.length,
      );
      expect(target?.selfEvaluation.submittedToEvaluatorCount).toBe(0);
      expect(target?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target?.selfEvaluation.isSubmittedToManager).toBe(false);
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
      const response = await dashboardApiClient.getEvaluatorTargetsStatus({
        periodId: evaluationPeriodId,
        evaluatorId: evaluatorId,
      });

      // Then
      expect(response).toBeDefined();
      const target = response.find((t: any) => t.employeeId === employeeId);
      expect(target?.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(target?.selfEvaluation.totalSelfEvaluations).toBe(
        evaluationIds.length,
      );
      expect(target?.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      expect(target?.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(target?.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('모든 자기평가가 1차 평가자에게 제출된 경우 isSubmittedToEvaluator가 true여야 한다', async () => {
      // Given - 모든 자기평가를 1차 평가자에게 제출
      for (const evaluationId of evaluationIds) {
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit-to-evaluator`,
          )
          .expect(HttpStatus.OK);
      }

      // When
      const response = await dashboardApiClient.getEvaluatorTargetsStatus({
        periodId: evaluationPeriodId,
        evaluatorId: evaluatorId,
      });

      // Then
      expect(response).toBeDefined();
      const target = response.find((t: any) => t.employeeId === employeeId);
      expect(target?.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(target?.selfEvaluation.totalSelfEvaluations).toBe(
        evaluationIds.length,
      );
      expect(target?.selfEvaluation.submittedToEvaluatorCount).toBe(
        evaluationIds.length,
      );
      expect(target?.selfEvaluation.submittedToManagerCount).toBe(0); // 관리자에게는 아직 제출 안함
      expect(target?.selfEvaluation.isSubmittedToManager).toBe(false);
    });

    it('여러 피평가자의 자기평가 제출 상태가 올바르게 구분되어야 한다', async () => {
      // Given - 기존 데이터 정리 후 새로 생성
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

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 1,
            employeeCount: 2,
            projectCount: 1,
            wbsPerProject: 2,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            selfEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
            },
            peerEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
            },
            finalEvaluationProgress: {
              completed: 0.0,
              notStarted: 1.0,
            },
          },
        })
        .expect(HttpStatus.CREATED);

      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .find({
          where: { deletedAt: null as any },
          order: { createdAt: 'DESC' },
          take: 1,
        });
      const newEvaluationPeriodId = evaluationPeriods[0].id;

      const employees = await dataSource
        .getRepository('Employee')
        .find({
          where: {
            deletedAt: null as any,
            status: '재직중',
          },
          take: 2,
        });

      const employee1Id = employees[0].id;
      const employee2Id = employees[1].id;

      // 평가자 조회 (employee1의 평가자 찾기)
      const lineMappings1 = await dataSource
        .getRepository('EvaluationLineMapping')
        .find({
          where: {
            evaluationPeriodId: newEvaluationPeriodId,
            employeeId: employee1Id,
            deletedAt: null as any,
          },
          take: 1,
        });

      if (lineMappings1.length === 0) {
        throw new Error('employee1의 평가자를 찾을 수 없습니다.');
      }

      const newEvaluatorId = lineMappings1[0].evaluatorId;

      // employee2도 같은 평가자에게 평가받도록 확인
      const lineMappings2 = await dataSource
        .getRepository('EvaluationLineMapping')
        .find({
          where: {
            evaluationPeriodId: newEvaluationPeriodId,
            employeeId: employee2Id,
            evaluatorId: newEvaluatorId,
            deletedAt: null as any,
          },
        });

      // employee2가 같은 평가자에게 평가받지 않으면, 평가 라인 매핑 생성
      if (lineMappings2.length === 0) {
        // 평가 라인 조회
        const evaluationLines = await dataSource
          .getRepository('EvaluationLine')
          .find({
            where: {
              deletedAt: null as any,
            },
            take: 1,
          });

        if (evaluationLines.length === 0) {
          throw new Error('평가 라인을 찾을 수 없습니다.');
        }

        const evaluationLineId = evaluationLines[0].id;

        // employee2에 대한 평가 라인 매핑 생성
        const lineMapping = dataSource
          .getRepository('EvaluationLineMapping')
          .create({
            evaluationLineId: evaluationLineId,
            evaluationPeriodId: newEvaluationPeriodId,
            employeeId: employee2Id,
            evaluatorId: newEvaluatorId,
            createdBy: '00000000-0000-0000-0000-000000000001',
          });
        await dataSource
          .getRepository('EvaluationLineMapping')
          .save(lineMapping);
      }

      // 각 직원의 자기평가 조회 및 내용/점수 추가
      const evaluations1 = await wbsSelfEvaluationRepository.find({
        where: {
          periodId: newEvaluationPeriodId,
          employeeId: employee1Id,
        },
      });

      const evaluations2 = await wbsSelfEvaluationRepository.find({
        where: {
          periodId: newEvaluationPeriodId,
          employeeId: employee2Id,
        },
      });

      for (const evaluation of [...evaluations1, ...evaluations2]) {
        evaluation.selfEvaluationContent = '자기평가 내용';
        evaluation.selfEvaluationScore = 100;
        evaluation.performanceResult = '성과 결과';
        await wbsSelfEvaluationRepository.save(evaluation);
      }

      // employee1의 모든 자기평가를 1차 평가자에게 제출
      for (const evaluation of evaluations1) {
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluation.id}/submit-to-evaluator`,
          )
          .expect(HttpStatus.OK);
      }

      // employee2는 일부만 제출
      if (evaluations2.length > 0) {
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluations2[0].id}/submit-to-evaluator`,
          )
          .expect(HttpStatus.OK);
      }

      // When
      const response = await dashboardApiClient.getEvaluatorTargetsStatus({
        periodId: newEvaluationPeriodId,
        evaluatorId: newEvaluatorId,
      });

      // Then
      expect(response).toBeDefined();
      const target1 = response.find((t: any) => t.employeeId === employee1Id);
      expect(target1).toBeDefined();
      expect(target1?.selfEvaluation).toBeDefined();
      if (target1?.selfEvaluation) {
        expect(target1.selfEvaluation.isSubmittedToEvaluator).toBe(true);
        expect(target1.selfEvaluation.submittedToEvaluatorCount).toBe(
          evaluations1.length,
        );
      }

      const target2 = response.find((t: any) => t.employeeId === employee2Id);
      expect(target2).toBeDefined();
      expect(target2?.selfEvaluation).toBeDefined();
      if (target2?.selfEvaluation) {
        expect(target2.selfEvaluation.isSubmittedToEvaluator).toBe(false);
        expect(target2.selfEvaluation.submittedToEvaluatorCount).toBe(1);
      }
    });
  });
});

