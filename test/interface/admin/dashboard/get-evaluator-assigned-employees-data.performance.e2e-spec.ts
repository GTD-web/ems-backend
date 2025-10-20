import { INestApplication } from '@nestjs/common';
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
  let dataSource: any;
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
    dataSource = (testSuite as any).dataSource;
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

    // 2. 이미 평가기간에 등록된 직원들 사용
    // 완전한_테스트환경에서 반환된 직원들은 이미 평가기간에 등록되어 있음
    evaluatorId = allEmployees[0].id; // 첫 번째 직원이 평가자
    employeeIds = allEmployees.slice(1).map((emp: any) => emp.id); // 나머지가 피평가자

    // 실제로 평가기간에 등록되어 있는지 확인
    const registeredEmployees = await dataSource.manager.query(
      `SELECT "employeeId" FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 
         AND "deletedAt" IS NULL`,
      [evaluationPeriodId],
    );
    const registeredEmployeeIds = registeredEmployees.map(
      (r: any) => r.employeeId,
    );

    console.log(`\n📋 평가기간 등록 확인:`);
    console.log(`   - 평가기간: ${evaluationPeriodId}`);
    console.log(`   - 등록된 직원 수: ${registeredEmployeeIds.length}`);
    console.log(
      `   - 평가자가 등록되어 있음: ${registeredEmployeeIds.includes(evaluatorId)}`,
    );
    console.log(
      `   - 모든 피평가자가 등록되어 있음: ${employeeIds.every((id) => registeredEmployeeIds.includes(id))}`,
    );

    // 등록되지 않은 피평가자가 있다면 등록
    const unregisteredEmployees = employeeIds.filter(
      (id) => !registeredEmployeeIds.includes(id),
    );
    if (unregisteredEmployees.length > 0) {
      console.log(
        `\n⚠️ 등록되지 않은 피평가자 발견: ${unregisteredEmployees.length}명`,
      );
      for (const empId of unregisteredEmployees) {
        await dataSource.manager.query(
          `INSERT INTO evaluation_period_employee_mapping (id, "evaluationPeriodId", "employeeId", "isExcluded", version, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, false, 1, NOW(), NOW())`,
          [evaluationPeriodId, empId],
        );
      }
      console.log(`✅ 피평가자 등록 완료`);
    }

    console.log(`\n📊 평가라인 설정 중...`);
    console.log(`   평가자: ${evaluatorId}`);
    console.log(`   피평가자: ${employeeIds.length}명`);

    // 3. 각 피평가자에 대해 평가라인 설정
    let mappingCount = 0;
    for (const employeeId of employeeIds) {
      // 해당 직원의 할당된 WBS 목록 조회
      const wbsAssignments = await dataSource.manager.query(
        `SELECT DISTINCT "wbsItemId" 
         FROM evaluation_wbs_assignment 
         WHERE "periodId" = $1 
           AND "employeeId" = $2 
           AND "deletedAt" IS NULL`,
        [evaluationPeriodId, employeeId],
      );

      // 각 WBS에 대해 1차 평가자로 설정
      for (const assignment of wbsAssignments) {
        try {
          await testSuite
            .request()
            .post(
              `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${assignment.wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
            )
            .send({ evaluatorId })
            .expect((res) => {
              // 201 (생성) 허용
              if (res.status !== 201) {
                throw new Error(`Expected 201, got ${res.status}`);
              }
            });

          mappingCount++;

          // 진행 상황 표시
          if (mappingCount % 5 === 0) {
            process.stdout.write(`\r   진행: ${mappingCount}건`);
          }
        } catch (error) {
          console.warn(
            `\n   경고: 평가라인 설정 실패 (employeeId: ${employeeId}, wbsItemId: ${assignment.wbsItemId}):`,
            (error as any).message,
          );
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ 평가라인 설정 완료: ${mappingCount}건`);

    // 4. 매핑이 제대로 저장되었는지 확인
    const savedMappings = await dataSource.manager.query(
      `SELECT * FROM evaluation_line_mappings 
       WHERE "evaluatorId" = $1 
         AND "employeeId" = ANY($2::uuid[]) 
         AND "deletedAt" IS NULL
       LIMIT 1`,
      [evaluatorId, employeeIds],
    );
    console.log(
      `\n🔍 저장된 평가라인 매핑: ${savedMappings.length > 0 ? '존재' : '없음'}`,
    );

    if (savedMappings.length > 0) {
      console.log(`   - 샘플 매핑 (평가자: ${evaluatorId}):`, {
        employeeId: savedMappings[0].employeeId,
        wbsItemId: savedMappings[0].wbsItemId,
      });
    }

    console.log(`\n🎉 데이터 생성 완료!`);
    console.log(`   총 소요 시간: ${(totalTime / 1000).toFixed(2)}초`);
    console.log(`   - 평가자: 1명`);
    console.log(`   - 피평가자: ${employeeIds.length}명`);
    console.log(`   - 평가라인 매핑: ${mappingCount}건`);
  }

  describe('성능 측정', () => {
    it('대량 데이터 환경에서 단일 피평가자 조회 성능 측정', async () => {
      console.log('\n🔍 성능 측정 시작...');
      console.log(
        `   목표: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms 이내 응답`,
      );
      console.log(`   평가자: ${evaluatorId}`);
      console.log(`   피평가자: ${employeeIds.join(', ')}`);

      const responseTimes: number[] = [];

      // 각 피평가자에 대해 조회 성능 측정
      for (const employeeId of employeeIds) {
        const startTime = Date.now();

        const response = await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
          );

        if (response.status !== 200) {
          console.error(`\n❌ 조회 실패 (employeeId: ${employeeId}):`, {
            status: response.status,
            body: response.body,
          });
        }

        expect(response.status).toBe(200);

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

        await testSuite
          .request()
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
        testSuite
          .request()
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

      const response = await testSuite
        .request()
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
      expect(evaluatee).toHaveProperty('employee');
      expect(evaluatee.employee).toHaveProperty('id');
      expect(evaluatee.employee).toHaveProperty('name');
      expect(evaluatee).toHaveProperty('projects');
      expect(evaluatee.employee.id).toBe(testEmployeeId);

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

        await testSuite
          .request()
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
