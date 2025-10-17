import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * GET /admin/dashboard/:evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data
 * 성능 테스트
 *
 * 평가자가 담당하는 피평가자의 할당 정보를 조회하는 엔드포인트의 성능을 측정합니다.
 */
describe('GET /admin/dashboard/:evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data - 성능 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let testContextService: TestContextService;

  let evaluationPeriodId: string;
  let evaluatorId: string;
  let employeeIds: string[] = [];

  // 성능 테스트 설정
  const PERFORMANCE_CONFIG = {
    ACCEPTABLE_RESPONSE_TIME_MS: 1500, // 1.5초 이내
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    testContextService = app.get(TestContextService);

    await 테스트_데이터를_생성한다();
  }, 600000);

  afterAll(async () => {
    await testSuite.closeApp();
  });

  /**
   * 테스트 데이터 생성 (TestContextService 사용)
   */
  async function 테스트_데이터를_생성한다() {
    const startTime = Date.now();
    console.log('\n🚀 성능 테스트를 위한 데이터 생성 시작...');

    // 1. 완전한 테스트 환경 생성
    const { employees, periods } =
      await testContextService.완전한_테스트환경을_생성한다();

    evaluationPeriodId = periods[0].id;
    const allEmployees = employees;

    console.log(`✅ 기본 환경 생성 완료`);
    console.log(`   - 직원: ${allEmployees.length}명`);

    // 2. 평가자로 첫 번째 직원 선택
    evaluatorId = allEmployees[0].id;
    // 평가자를 제외한 나머지 직원들이 피평가자
    employeeIds = allEmployees.slice(1).map((emp: any) => emp.id);

    const totalTime = Date.now() - startTime;
    console.log(`\n🎉 데이터 생성 완료!`);
    console.log(`   총 소요 시간: ${(totalTime / 1000).toFixed(2)}초`);
    console.log(`   - 평가자: 1명 (${evaluatorId})`);
    console.log(`   - 피평가자: ${employeeIds.length}명`);
    console.log('\n📝 참고: 완전한_테스트환경에서 기본 평가라인이 자동 설정됨');
  }

  describe('성능 측정', () => {
    it('대량 데이터 환경에서 단일 피평가자 조회 성능 측정', async () => {
      console.log('\n🔍 성능 측정 시작...');
      console.log(
        `   목표: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms 이내 응답`,
      );

      const responseTimes: number[] = [];

      // 각 피평가자에 대해 조회 성능 측정
      for (const employeeId of employeeIds) {
        const startTime = Date.now();

        const response = await request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
          )
          .expect(200);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        // 응답 데이터 검증
        const { evaluationPeriod, evaluator, evaluatee } = response.body;
        expect(evaluationPeriod).toBeDefined();
        expect(evaluator).toBeDefined();
        expect(evaluatee).toBeDefined();
        expect(evaluatee.projects).toBeDefined();
      }

      // 성능 통계 계산
      const avgTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);

      console.log(`\n📊 성능 측정 결과:`);
      console.log(`   - 평균 응답 시간: ${avgTime.toFixed(2)}ms`);
      console.log(`   - 최소 응답 시간: ${minTime}ms`);
      console.log(`   - 최대 응답 시간: ${maxTime}ms`);
      console.log(
        `   - 목표 시간: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms`,
      );

      // 평균 응답 시간이 목표 이내인지 검증
      expect(avgTime).toBeLessThan(
        PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
      );
    });

    it('연속 조회 시 캐싱 효과 및 안정성 검증', async () => {
      console.log('\n🔄 연속 조회 성능 측정...');

      const testEmployeeId = employeeIds[0];
      const responseTimes: number[] = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${testEmployeeId}/assigned-data`,
          )
          .expect(200);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const avgTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      console.log(`   - 평균 응답 시간: ${avgTime.toFixed(2)}ms`);
      console.log(
        `   - 응답 시간들: [${responseTimes.map((t) => t.toFixed(0)).join(', ')}]ms`,
      );

      // 연속 조회도 목표 시간 이내
      expect(avgTime).toBeLessThan(
        PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
      );
    });

    it('다양한 직원 동시 조회 시 성능 검증', async () => {
      console.log('\n⚡ 병렬 조회 성능 측정...');

      const testEmployeeIds = employeeIds.slice(0, 5);
      const startTime = Date.now();

      const promises = testEmployeeIds.map((employeeId) =>
        request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
          )
          .expect(200),
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / testEmployeeIds.length;

      console.log(`   - 총 소요 시간: ${totalTime}ms`);
      console.log(`   - 요청당 평균 시간: ${avgTimePerRequest.toFixed(2)}ms`);
      console.log(`   - 동시 요청 수: ${testEmployeeIds.length}개`);
      console.log(
        `   - 예상 순차 처리 시간: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS * testEmployeeIds.length}ms (참고용)`,
      );

      // 모든 응답 검증
      results.forEach((response) => {
        expect(response.body).toHaveProperty('evaluationPeriod');
        expect(response.body).toHaveProperty('evaluator');
        expect(response.body).toHaveProperty('evaluatee');
      });

      // 병렬 처리가 효율적인지 검증
      expect(avgTimePerRequest).toBeLessThan(
        PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
      );
    });
  });

  describe('데이터 정합성 및 완전성', () => {
    it('조회된 데이터가 모두 정확해야 함', async () => {
      console.log('\n🔍 데이터 정합성 검증...');

      const testEmployeeId = employeeIds[0];

      const response = await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${testEmployeeId}/assigned-data`,
        )
        .expect(200);

      const { evaluationPeriod, evaluator, evaluatee } = response.body;

      // 평가기간 정보 검증
      expect(evaluationPeriod).toHaveProperty('id');
      expect(evaluationPeriod).toHaveProperty('name');
      expect(evaluationPeriod.id).toBe(evaluationPeriodId);

      // 평가자 정보 검증
      expect(evaluator).toHaveProperty('id');
      expect(evaluator).toHaveProperty('name');
      expect(evaluator).toHaveProperty('employeeNumber');
      expect(evaluator.id).toBe(evaluatorId);

      // 피평가자 정보 검증
      expect(evaluatee).toHaveProperty('id');
      expect(evaluatee).toHaveProperty('name');
      expect(evaluatee).toHaveProperty('projects');
      expect(evaluatee.id).toBe(testEmployeeId);

      let totalProjectCount = 0;
      let totalWbsCount = 0;
      let totalCriteriaCount = 0;

      // 각 프로젝트 검증
      for (const project of evaluatee.projects || []) {
        expect(project).toHaveProperty('projectId');
        expect(project).toHaveProperty('projectName');
        expect(project).toHaveProperty('projectCode');
        expect(project).toHaveProperty('wbsList');

        totalProjectCount++;
        totalWbsCount += project.wbsList.length;

        // 각 WBS 검증
        project.wbsList.forEach((wbs: any) => {
          expect(wbs).toHaveProperty('wbsId');
          expect(wbs).toHaveProperty('wbsName');
          expect(wbs).toHaveProperty('criteria');

          totalCriteriaCount += wbs.criteria.length;

          // 평가기준 검증
          wbs.criteria.forEach((criterion: any) => {
            expect(criterion).toHaveProperty('id');
            expect(criterion).toHaveProperty('criteria');
          });
        });
      }

      console.log(`✅ 데이터 정합성 검증 완료`);
      console.log(`   - 프로젝트: ${totalProjectCount}개`);
      console.log(`   - WBS: ${totalWbsCount}개`);
      console.log(`   - 평가기준: ${totalCriteriaCount}개`);
    });
  });

  describe('메모리 및 리소스 사용량', () => {
    it('대량 데이터 조회 시 메모리 누수가 없어야 함', async () => {
      console.log('\n💾 메모리 사용량 모니터링...');

      const initialMemory = process.memoryUsage();
      console.log(
        `   초기 메모리: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      );

      // 반복 조회로 메모리 누수 검증
      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        const employeeId = employeeIds[i % employeeIds.length];

        await request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
          )
          .expect(200);

        if ((i + 1) % 10 === 0) {
          const currentMemory = process.memoryUsage();
          console.log(
            `   [${i + 1}/${iterations}] 메모리: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          );
        }
      }

      // 가비지 컬렉션 강제 실행 (--expose-gc 필요)
      if (global.gc) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      console.log(
        `   최종 메모리: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(`   메모리 증가량: ${memoryIncrease.toFixed(2)} MB`);

      // 메모리 증가량이 과도하지 않은지 검증 (50MB 이하)
      expect(Math.abs(memoryIncrease)).toBeLessThan(50);
    });
  });
});
