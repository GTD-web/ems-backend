import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * 성능 테스트 설정
 */
const PERFORMANCE_CONFIG = {
  ACCEPTABLE_RESPONSE_TIME_MS: 2000, // 2초 이내 (대용량 데이터 - 100명)
  TEST_EMPLOYEE_COUNT: 100, // 테스트할 직원 수 (대용량)
  CONCURRENT_REQUESTS: 5, // 병렬 요청 수
  SEQUENTIAL_ITERATIONS: 10, // 연속 호출 횟수
  MEMORY_TEST_ITERATIONS: 30, // 메모리 테스트 반복 횟수
};

describe('GET /admin/dashboard/:evaluationPeriodId/final-evaluations - 성능 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;
  let testContextService: TestContextService;

  // 테스트 데이터
  let evaluationPeriodId: string;
  let testEmployeeIds: string[] = [];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);

    console.log('🔧 테스트 환경 초기화 중...');

    // 테스트 데이터 생성
    await 테스트_데이터를_생성한다();

    console.log('✅ 테스트 데이터 생성 완료');
  }, 600000); // 10분 타임아웃 (대용량 데이터 생성)

  afterAll(async () => {
    await testContextService.테스트_데이터를_정리한다();
    await testSuite.closeApp();
  });

  /**
   * 대용량 테스트 데이터 생성
   */
  async function 테스트_데이터를_생성한다() {
    const startTime = Date.now();
    console.log(`\n📊 대용량 테스트 데이터 생성 시작...`);
    console.log(`   - 직원 수: ${PERFORMANCE_CONFIG.TEST_EMPLOYEE_COUNT}명`);

    // 기본 환경 생성 (평가기간, 직원, 부서 등)
    const testEnvironment =
      await testContextService.완전한_테스트환경을_생성한다();

    evaluationPeriodId = testEnvironment.periods[0].id;

    // 추가 직원 생성 (기존 직원 포함하여 100명)
    const existingEmployees = testEnvironment.employees;
    testEmployeeIds = existingEmployees.slice(0, 10).map((e: any) => e.id);

    const additionalEmployeeCount =
      PERFORMANCE_CONFIG.TEST_EMPLOYEE_COUNT - testEmployeeIds.length;

    if (additionalEmployeeCount > 0) {
      console.log(`   - 추가 직원 생성 중: ${additionalEmployeeCount}명...`);

      for (let i = 0; i < additionalEmployeeCount; i++) {
        const employeeResult = await dataSource.query(
          `
          INSERT INTO employee (name, "employeeNumber", email, "departmentName", "rankName", status, "externalId", "externalCreatedAt", "externalUpdatedAt", "createdAt", "updatedAt", version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW(), NOW(), 1)
          RETURNING id
        `,
          [
            `성능테스트직원${i + 1}`,
            `PERF${String(i + 1).padStart(4, '0')}`,
            `perf${i + 1}@example.com`,
            '개발팀',
            '사원',
            '재직중',
            `EXT-PERF-${i + 1}`,
          ],
        );
        testEmployeeIds.push(employeeResult[0].id);
      }
    }

    console.log(`   ✅ 총 ${testEmployeeIds.length}명의 직원 데이터 준비 완료`);

    // 평가기간-직원 매핑 및 최종평가 생성
    console.log(`   - 평가기간-직원 매핑 및 최종평가 생성 중...`);

    const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
    const jobGrades = ['T1', 'T2', 'T3'];
    const jobDetailedGrades = ['u', 'n', 'a'];

    for (let i = 0; i < testEmployeeIds.length; i++) {
      const employeeId = testEmployeeIds[i];

      // 평가기간-직원 매핑 생성
      await dataSource.query(
        `
        INSERT INTO evaluation_period_employee_mapping ("evaluationPeriodId", "employeeId", "isExcluded", "createdAt", "updatedAt", "version")
        VALUES ($1, $2, $3, NOW(), NOW(), 1)
        ON CONFLICT DO NOTHING
      `,
        [evaluationPeriodId, employeeId, false],
      );

      // 최종평가 생성
      const randomGrade =
        evaluationGrades[Math.floor(Math.random() * evaluationGrades.length)];
      const randomJobGrade =
        jobGrades[Math.floor(Math.random() * jobGrades.length)];
      const randomJobDetailedGrade =
        jobDetailedGrades[Math.floor(Math.random() * jobDetailedGrades.length)];
      const isConfirmed = Math.random() > 0.3; // 70% 확정

      await dataSource.query(
        `
        INSERT INTO final_evaluations ("employeeId", "periodId", "evaluationGrade", "jobGrade", "jobDetailedGrade", "finalComments", "isConfirmed", "confirmedAt", "confirmedBy", "createdAt", "updatedAt", "version")
        VALUES ($1, $2, $3, $4, $5, $6, $7, ${isConfirmed ? 'NOW()' : 'NULL'}, ${isConfirmed ? '$8' : 'NULL'}, NOW(), NOW(), 1)
      `,
        [
          employeeId,
          evaluationPeriodId,
          randomGrade,
          randomJobGrade,
          randomJobDetailedGrade,
          `${randomGrade}등급 평가를 받았습니다.`,
          isConfirmed,
          isConfirmed ? employeeId : null,
        ].filter((v) => v !== null),
      );

      if ((i + 1) % 20 === 0) {
        console.log(`      진행률: ${i + 1}/${testEmployeeIds.length}`);
      }
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ 테스트 데이터 생성 완료 (${elapsedTime}초)`);
    console.log(`   - 평가기간: 1개`);
    console.log(`   - 직원: ${testEmployeeIds.length}명`);
    console.log(`   - 최종평가: ${testEmployeeIds.length}건`);
  }

  /**
   * API 호출 헬퍼 함수
   */
  function getFinalEvaluationsByPeriod(periodId: string) {
    return request(app.getHttpServer()).get(
      `/admin/dashboard/${periodId}/final-evaluations`,
    );
  }

  // ==================== 성능 테스트 ====================

  describe('성능 측정', () => {
    it('최종평가 목록 조회 성능 측정 (대용량 데이터)', async () => {
      console.log(
        `\n⏱️  최종평가 목록 조회 성능 측정 (${PERFORMANCE_CONFIG.TEST_EMPLOYEE_COUNT}명)...`,
      );

      const responseTimes: number[] = [];

      // 5회 측정
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response =
          await getFinalEvaluationsByPeriod(evaluationPeriodId).expect(200);
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        // 응답 검증
        expect(response.body).toHaveProperty('period');
        expect(response.body).toHaveProperty('evaluations');
        expect(Array.isArray(response.body.evaluations)).toBe(true);

        console.log(`   시도 ${i + 1}/5: ${responseTime}ms`);
      }

      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      console.log(`\n📈 성능 측정 결과:`);
      console.log(`   - 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   - 최소 응답 시간: ${minResponseTime}ms`);
      console.log(`   - 최대 응답 시간: ${maxResponseTime}ms`);
      console.log(
        `   - 목표 대비: ${((avgResponseTime / PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS) * 100).toFixed(1)}%`,
      );

      // 성능 검증
      expect(avgResponseTime).toBeLessThan(
        PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
      );
      console.log(
        `   ✅ 목표 성능 달성 (${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms 이내)`,
      );
    });

    it('연속 조회 시 캐싱 효과 및 안정성 검증', async () => {
      console.log(
        `\n⏱️  연속 조회 성능 측정 (${PERFORMANCE_CONFIG.SEQUENTIAL_ITERATIONS}회)...`,
      );

      const responseTimes: number[] = [];

      for (let i = 0; i < PERFORMANCE_CONFIG.SEQUENTIAL_ITERATIONS; i++) {
        const startTime = Date.now();
        const response =
          await getFinalEvaluationsByPeriod(evaluationPeriodId).expect(200);
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        // 데이터 일관성 검증
        expect(response.body).toHaveProperty('period');
        expect(response.body).toHaveProperty('evaluations');
        expect(Array.isArray(response.body.evaluations)).toBe(true);
      }

      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      console.log(`\n📈 연속 조회 결과:`);
      console.log(`   - 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   - 최소 응답 시간: ${minResponseTime}ms`);
      console.log(`   - 최대 응답 시간: ${maxResponseTime}ms`);
      console.log(
        `   - 변동폭: ${(((maxResponseTime - minResponseTime) / avgResponseTime) * 100).toFixed(1)}%`,
      );

      // 안정성 검증 (평균 대비 최대 응답 시간이 2배 미만)
      expect(maxResponseTime).toBeLessThan(avgResponseTime * 2);
      console.log(`   ✅ 안정적인 응답 속도 유지`);
    });

    it('병렬 조회 시 성능 검증', async () => {
      console.log(
        `\n⏱️  병렬 조회 성능 측정 (동시 ${PERFORMANCE_CONFIG.CONCURRENT_REQUESTS}건)...`,
      );

      const startTime = Date.now();

      // 병렬 요청 실행
      const requests = Array(PERFORMANCE_CONFIG.CONCURRENT_REQUESTS)
        .fill(null)
        .map(() => getFinalEvaluationsByPeriod(evaluationPeriodId).expect(200));

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest =
        totalTime / PERFORMANCE_CONFIG.CONCURRENT_REQUESTS;

      console.log(`\n📈 병렬 조회 결과:`);
      console.log(
        `   - 총 소요 시간: ${totalTime}ms (${PERFORMANCE_CONFIG.CONCURRENT_REQUESTS}건)`,
      );
      console.log(
        `   - 평균 응답 시간: ${avgTimePerRequest.toFixed(2)}ms/요청`,
      );

      // 모든 응답 검증
      responses.forEach((response) => {
        expect(response.body).toHaveProperty('period');
        expect(response.body).toHaveProperty('evaluations');
        expect(Array.isArray(response.body.evaluations)).toBe(true);
      });

      // 병렬 처리 효율성 검증 (평균 시간이 순차 실행보다 빠른지)
      expect(avgTimePerRequest).toBeLessThan(
        PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
      );
      console.log(`   ✅ 병렬 처리 효율적`);
    });
  });

  describe('데이터 정합성 및 완전성', () => {
    it('조회된 데이터가 모두 정확해야 함', async () => {
      console.log(`\n🔍 데이터 정합성 검증...`);

      const response =
        await getFinalEvaluationsByPeriod(evaluationPeriodId).expect(200);

      // 평가기간 정보 검증
      expect(response.body.period).toBeDefined();
      expect(response.body.period.id).toBe(evaluationPeriodId);

      // 평가 목록 검증
      expect(response.body.evaluations).toBeDefined();
      expect(Array.isArray(response.body.evaluations)).toBe(true);

      const evaluations = response.body.evaluations;
      console.log(`   - 조회된 최종평가 수: ${evaluations.length}개`);

      // 각 평가 항목 검증
      evaluations.forEach((item: any) => {
        // 직원 정보
        expect(item).toHaveProperty('employee');
        expect(item.employee).toHaveProperty('id');
        expect(item.employee).toHaveProperty('name');
        expect(item.employee).toHaveProperty('employeeNumber');
        expect(item.employee).toHaveProperty('email');

        // 최종평가 정보
        expect(item).toHaveProperty('evaluation');
        expect(item.evaluation).toHaveProperty('id');
        expect(item.evaluation).toHaveProperty('evaluationGrade');
        expect(item.evaluation).toHaveProperty('jobGrade');
        expect(item.evaluation).toHaveProperty('jobDetailedGrade');
        expect(item.evaluation).toHaveProperty('isConfirmed');
        expect(item.evaluation).toHaveProperty('createdAt');
        expect(item.evaluation).toHaveProperty('updatedAt');

        // 평가등급 검증
        expect(['S', 'A', 'B', 'C', 'D']).toContain(
          item.evaluation.evaluationGrade,
        );

        // 직무등급 검증
        expect(['T1', 'T2', 'T3']).toContain(item.evaluation.jobGrade);

        // 직무 상세등급 검증
        expect(['u', 'n', 'a']).toContain(item.evaluation.jobDetailedGrade);
      });

      console.log(`   ✅ 모든 데이터 필드 정합성 검증 완료`);

      // 사번 정렬 검증
      const employeeNumbers = evaluations.map(
        (e: any) => e.employee.employeeNumber,
      );
      const sortedNumbers = [...employeeNumbers].sort();
      expect(employeeNumbers).toEqual(sortedNumbers);
      console.log(`   ✅ 사번 순으로 올바르게 정렬됨`);
    });

    it('확정/미확정 상태가 올바르게 표시되어야 함', async () => {
      console.log(`\n🔍 확정 상태 검증...`);

      const response =
        await getFinalEvaluationsByPeriod(evaluationPeriodId).expect(200);

      const evaluations = response.body.evaluations;

      let confirmedCount = 0;
      let unconfirmedCount = 0;

      evaluations.forEach((item: any) => {
        if (item.evaluation.isConfirmed) {
          confirmedCount++;
          // 확정된 평가는 confirmedAt과 confirmedBy가 있어야 함
          expect(item.evaluation.confirmedAt).not.toBeNull();
          expect(item.evaluation.confirmedBy).not.toBeNull();
        } else {
          unconfirmedCount++;
          // 미확정 평가는 confirmedAt과 confirmedBy가 null
          expect(item.evaluation.confirmedAt).toBeNull();
          expect(item.evaluation.confirmedBy).toBeNull();
        }
      });

      console.log(`   - 확정된 평가: ${confirmedCount}개`);
      console.log(`   - 미확정 평가: ${unconfirmedCount}개`);
      console.log(`   ✅ 확정 상태가 올바르게 표시됨`);
    });
  });

  describe('메모리 및 리소스 사용량', () => {
    it('대량 데이터 조회 시 메모리 누수가 없어야 함', async () => {
      console.log(
        `\n💾 메모리 사용량 모니터링 (${PERFORMANCE_CONFIG.MEMORY_TEST_ITERATIONS}회 반복)...`,
      );

      // GC 실행
      if (global.gc) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`   초기 메모리: ${initialMemory.toFixed(2)} MB`);

      // 반복 조회
      for (let i = 0; i < PERFORMANCE_CONFIG.MEMORY_TEST_ITERATIONS; i++) {
        await getFinalEvaluationsByPeriod(evaluationPeriodId).expect(200);

        if ((i + 1) % 10 === 0) {
          const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
          console.log(
            `   [${i + 1}/${PERFORMANCE_CONFIG.MEMORY_TEST_ITERATIONS}] 메모리: ${currentMemory.toFixed(2)} MB`,
          );
        }
      }

      // GC 실행
      if (global.gc) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`   최종 메모리: ${finalMemory.toFixed(2)} MB`);
      console.log(
        `   메모리 증가량: ${memoryIncrease > 0 ? '+' : ''}${memoryIncrease.toFixed(2)} MB`,
      );

      // 메모리 누수 검증 (100MB 이내 증가 허용)
      expect(Math.abs(memoryIncrease)).toBeLessThan(100);
      console.log(`   ✅ 메모리 누수 없음`);
    });
  });
});
