import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * GET /admin/dashboard/:evaluationPeriodId/employees/status
 * 성능 테스트
 *
 * 평가기간 내 모든 직원의 평가 현황을 조회하는 엔드포인트의 성능을 측정합니다.
 */
describe('GET /admin/dashboard/:evaluationPeriodId/employees/status - 성능 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;

  let evaluationPeriodId: string;
  let departments: any[] = [];

  // 성능 테스트 설정
  const PERFORMANCE_CONFIG = {
    ACCEPTABLE_RESPONSE_TIME_MS: 3000, // 3초 이내 (대량 직원 조회)
    EMPLOYEE_COUNTS: [100, 200, 300], // 테스트할 직원 수
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);

    await 테스트_데이터를_생성한다();
  }, 600000);

  afterAll(async () => {
    await testSuite.closeApp();
  });

  /**
   * 테스트 데이터 생성 (기본 환경만)
   */
  async function 테스트_데이터를_생성한다() {
    const startTime = Date.now();
    console.log('\n🚀 성능 테스트를 위한 기본 환경 생성 시작...');

    // 1. 완전한 테스트 환경 생성
    const { departments: depts, periods } =
      await testContextService.완전한_테스트환경을_생성한다();

    evaluationPeriodId = periods[0].id;
    departments = depts;

    console.log(`✅ 기본 환경 생성 완료`);
    console.log(`   - 부서: ${departments.length}개`);
    console.log(`   - 평가기간: ${evaluationPeriodId}`);

    const totalTime = Date.now() - startTime;
    console.log(`\n🎉 기본 환경 생성 완료!`);
    console.log(`   총 소요 시간: ${(totalTime / 1000).toFixed(2)}초`);
  }

  /**
   * 대량 직원 생성 및 평가기간 등록 (배치 INSERT)
   */
  async function 대량_직원을_생성하고_등록한다(employeeCount: number) {
    console.log(`\n📊 ${employeeCount}명의 직원 생성 및 등록 중...`);
    const startTime = Date.now();

    // 1. 직원 배치 생성
    const employeeValues: string[] = [];
    for (let i = 0; i < employeeCount; i++) {
      const deptIndex = i % departments.length;
      employeeValues.push(
        `(gen_random_uuid(), 'PERF-EMP-${String(i + 1).padStart(4, '0')}', '성능테스트_직원_${i + 1}', 'perf.employee${i + 1}@example.com', '${departments[deptIndex].id}', '재직중', 'EXT-EMP-${String(i + 1).padStart(4, '0')}', NOW(), NOW(), 1, NOW(), NOW())`,
      );
    }

    const employeeInsertResult = await dataSource.manager.query(
      `INSERT INTO employee (id, "employeeNumber", name, email, "departmentId", status, "externalId", "externalCreatedAt", "externalUpdatedAt", version, "createdAt", "updatedAt")
       VALUES ${employeeValues.join(', ')}
       RETURNING id`,
    );
    const employeeIds = employeeInsertResult.map((r: any) => r.id);

    console.log(`   ✅ 직원 ${employeeCount}명 생성 완료`);

    // 2. 평가기간에 직원 등록 (배치 INSERT)
    const mappingValues: string[] = [];
    for (const employeeId of employeeIds) {
      mappingValues.push(
        `(gen_random_uuid(), '${evaluationPeriodId}', '${employeeId}', false, NOW(), NOW(), 1)`,
      );
    }

    await dataSource.manager.query(
      `INSERT INTO evaluation_period_employee_mapping (id, "evaluationPeriodId", "employeeId", "isExcluded", "createdAt", "updatedAt", version)
       VALUES ${mappingValues.join(', ')}`,
    );

    const totalTime = Date.now() - startTime;
    console.log(
      `   ✅ ${employeeCount}명 평가기간 등록 완료 (${(totalTime / 1000).toFixed(2)}초)`,
    );

    return employeeIds;
  }

  /**
   * 직원 정리
   */
  async function 직원을_정리한다() {
    await dataSource.manager.query(
      `DELETE FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 
         AND "employeeId" IN (
           SELECT id FROM employee WHERE "employeeNumber" LIKE 'PERF-EMP-%'
         )`,
      [evaluationPeriodId],
    );

    await dataSource.manager.query(
      `DELETE FROM employee WHERE "employeeNumber" LIKE 'PERF-EMP-%'`,
    );
  }

  describe('직원 수별 성능 측정', () => {
    const performanceResults: Array<{
      employeeCount: number;
      avgTime: number;
      minTime: number;
      maxTime: number;
      throughput: number;
    }> = [];

    // 100명, 200명, 300명 각각 테스트
    PERFORMANCE_CONFIG.EMPLOYEE_COUNTS.forEach((employeeCount) => {
      it(`${employeeCount}명의 직원 현황 조회 성능 측정`, async () => {
        // 직원 생성 및 등록
        await 대량_직원을_생성하고_등록한다(employeeCount);

        console.log(`\n🔍 ${employeeCount}명 직원 성능 측정 시작...`);
        console.log(
          `   목표: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms 이내 응답`,
        );

        const responseTimes: number[] = [];
        const iterations = 5;

        // 여러 번 반복 조회하여 평균 성능 측정
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();

          const response = await testSuite
            .request()
            .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`);

          if (response.status !== 200) {
            console.error(`\n❌ 조회 실패 (반복 ${i + 1}):`, {
              status: response.status,
              body: response.body,
            });
          }

          expect(response.status).toBe(200);

          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          // 응답 데이터 검증
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBe(employeeCount);
        }

        // 성능 통계 계산
        const avgTime =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minTime = Math.min(...responseTimes);
        const maxTime = Math.max(...responseTimes);
        const throughput = employeeCount / (avgTime / 1000); // 초당 처리 직원 수

        console.log(`\n📊 성능 측정 결과 (${employeeCount}명):`);
        console.log(`   - 평균 응답 시간: ${avgTime.toFixed(2)}ms`);
        console.log(`   - 최소 응답 시간: ${minTime}ms`);
        console.log(`   - 최대 응답 시간: ${maxTime}ms`);
        console.log(`   - 처리량: ${throughput.toFixed(0)} 직원/초`);
        console.log(
          `   - 직원당 평균 시간: ${(avgTime / employeeCount).toFixed(2)}ms`,
        );
        console.log(`   - 반복 횟수: ${iterations}회`);

        // 결과 저장
        performanceResults.push({
          employeeCount,
          avgTime,
          minTime,
          maxTime,
          throughput,
        });

        // 평균 응답 시간이 목표 이내인지 검증
        expect(avgTime).toBeLessThan(
          PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
        );

        // 직원 정리
        await 직원을_정리한다();
      });
    });

    // 모든 테스트 완료 후 비교 결과 출력
    afterAll(() => {
      if (performanceResults.length > 0) {
        console.log('\n\n═══════════════════════════════════════════');
        console.log('📊 직원 수별 성능 비교 결과');
        console.log('═══════════════════════════════════════════\n');
        console.log(
          '직원 수 | 평균 시간 | 최소 시간 | 최대 시간 | 처리량(직원/초)',
        );
        console.log(
          '--------|-----------|-----------|-----------|------------------',
        );
        performanceResults.forEach((result) => {
          console.log(
            `${String(result.employeeCount).padStart(6, ' ')}명 | ${result.avgTime.toFixed(2).padStart(8, ' ')}ms | ${String(result.minTime).padStart(8, ' ')}ms | ${String(result.maxTime).padStart(8, ' ')}ms | ${result.throughput.toFixed(0).padStart(15, ' ')}`,
          );
        });
        console.log('═══════════════════════════════════════════\n');
      }
    });
  });

  describe('추가 성능 테스트 (100명 기준)', () => {
    const TEST_EMPLOYEE_COUNT = 100;

    beforeAll(async () => {
      await 대량_직원을_생성하고_등록한다(TEST_EMPLOYEE_COUNT);
    });

    afterAll(async () => {
      await 직원을_정리한다();
    });

    it('연속 조회 시 캐싱 효과 및 안정성 검증', async () => {
      console.log(`\n🔄 연속 조회 성능 측정 (${TEST_EMPLOYEE_COUNT}명)...`);

      const responseTimes: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await testSuite
          .request()
          .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
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

    it('병렬 조회 시 성능 검증', async () => {
      console.log(`\n⚡ 병렬 조회 성능 측정 (${TEST_EMPLOYEE_COUNT}명)...`);

      const parallelCount = 5;
      const startTime = Date.now();

      const promises = Array(parallelCount)
        .fill(null)
        .map(() =>
          testSuite
            .request()
            .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
            .expect(200),
        );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / parallelCount;

      console.log(`   - 총 소요 시간: ${totalTime}ms`);
      console.log(`   - 요청당 평균 시간: ${avgTimePerRequest.toFixed(2)}ms`);
      console.log(`   - 동시 요청 수: ${parallelCount}개`);

      // 모든 응답 검증
      results.forEach((response) => {
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(TEST_EMPLOYEE_COUNT);
      });

      // 병렬 처리가 효율적인지 검증
      expect(avgTimePerRequest).toBeLessThan(
        PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS,
      );
    });

    it('조회된 데이터가 모두 정확해야 함', async () => {
      console.log(`\n🔍 데이터 정합성 검증 (${TEST_EMPLOYEE_COUNT}명)...`);

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .expect(200);

      const employees = response.body;

      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBe(TEST_EMPLOYEE_COUNT);

      console.log(`   - 조회된 직원 수: ${employees.length}명`);

      // 첫 10명만 상세 검증 (성능 고려)
      const sampleEmployees = employees.slice(0, 10);
      sampleEmployees.forEach((employee: any) => {
        // 기본 필드 검증
        expect(employee).toHaveProperty('employeeId');
        expect(employee).toHaveProperty('employee');
        expect(employee.employee).toHaveProperty('name');
        expect(employee.employee).toHaveProperty('employeeNumber');

        // 평가 현황 필드 검증
        expect(employee).toHaveProperty('evaluationCriteria');
        expect(employee).toHaveProperty('wbsCriteria');
        expect(employee).toHaveProperty('evaluationLine');
      });

      console.log(
        `✅ 데이터 정합성 검증 완료 (샘플 ${sampleEmployees.length}명)`,
      );
    });

    it('대량 조회 시 메모리 누수가 없어야 함', async () => {
      console.log(`\n💾 메모리 사용량 모니터링 (${TEST_EMPLOYEE_COUNT}명)...`);

      const initialMemory = process.memoryUsage();
      console.log(
        `   초기 메모리: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      );

      // 반복 조회로 메모리 누수 검증
      const iterations = 20;
      for (let i = 0; i < iterations; i++) {
        await testSuite
          .request()
          .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
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

      // 메모리 증가량이 과도하지 않은지 검증 (250MB 이하)
      // 가비지 컬렉션으로 메모리가 감소할 수도 있음
      expect(Math.abs(memoryIncrease)).toBeLessThan(250);
    });
  });
});
