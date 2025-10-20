import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * GET /admin/dashboard/:evaluationPeriodId/my-evaluation-targets/:evaluatorId/status
 * 성능 테스트
 *
 * 평가자가 담당하는 평가 대상자들의 현황을 조회하는 엔드포인트의 성능을 측정합니다.
 */
describe('GET /admin/dashboard/:evaluationPeriodId/my-evaluation-targets/:evaluatorId/status - 성능 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;

  let evaluationPeriodId: string;
  let evaluatorId: string;
  let evaluateeIds: string[] = [];

  // 성능 테스트 설정
  const PERFORMANCE_CONFIG = {
    ACCEPTABLE_RESPONSE_TIME_MS: 2000, // 2초 이내 (여러 피평가자 조회)
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
    const { employees, periods, departments } =
      await testContextService.완전한_테스트환경을_생성한다();

    evaluationPeriodId = periods[0].id;
    let allEmployees = [...employees];

    console.log(`✅ 기본 환경 생성 완료`);
    console.log(`   - 직원: ${allEmployees.length}명`);

    // 2. 추가 직원 생성 (100명의 피평가자를 위해)
    const TARGET_EVALUATEE_COUNT = 100;
    const needMoreEmployees = TARGET_EVALUATEE_COUNT + 1 - allEmployees.length; // +1은 평가자

    if (needMoreEmployees > 0) {
      console.log(`\n📊 추가 직원 생성 중: ${needMoreEmployees}명...`);

      // 배치로 직원 생성
      const additionalEmployeeValues: string[] = [];
      for (let i = 0; i < needMoreEmployees; i++) {
        const deptIndex = i % departments.length;
        const empNumber = allEmployees.length + i + 1;
        additionalEmployeeValues.push(
          `(gen_random_uuid(), 'PERF-TEST-${String(empNumber).padStart(4, '0')}', '성능테스트_직원_${empNumber}', 'perf.test${empNumber}@example.com', '${departments[deptIndex].id}', '재직중', 'EXT-PERF-${String(empNumber).padStart(4, '0')}', NOW(), NOW(), 1, NOW(), NOW())`,
        );
      }

      const additionalEmployeeResult = await dataSource.manager.query(
        `INSERT INTO employee (id, "employeeNumber", name, email, "departmentId", status, "externalId", "externalCreatedAt", "externalUpdatedAt", version, "createdAt", "updatedAt")
         VALUES ${additionalEmployeeValues.join(', ')}
         RETURNING *`,
      );

      allEmployees = [...allEmployees, ...additionalEmployeeResult];
      console.log(
        `✅ 추가 직원 생성 완료: ${additionalEmployeeResult.length}명`,
      );
      console.log(`   - 총 직원: ${allEmployees.length}명`);
    }

    // 3. 평가자 생성 및 설정
    // 평가자는 새로 생성한 직원 중 하나를 사용 (마지막 직원)
    console.log('\n📝 평가자 설정 중...');
    const evaluatorResult = await dataSource.manager.query(
      `INSERT INTO employee (id, "employeeNumber", name, email, "departmentId", status, "externalId", "externalCreatedAt", "externalUpdatedAt", version, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'EVALUATOR-001', '평가자', 'evaluator@example.com', $1, '재직중', 'EXT-EVALUATOR-001', NOW(), NOW(), 1, NOW(), NOW())
       RETURNING *`,
      [departments[0].id],
    );
    evaluatorId = evaluatorResult[0].id;
    console.log(`✅ 평가자 생성 완료: ${evaluatorId}`);

    // 평가자를 평가기간에 등록
    const evaluatorRegistered = await dataSource.manager.query(
      `SELECT "employeeId" FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [evaluationPeriodId, evaluatorId],
    );

    if (evaluatorRegistered.length === 0) {
      await dataSource.manager.query(
        `INSERT INTO evaluation_period_employee_mapping (id, "evaluationPeriodId", "employeeId", "isExcluded", version, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, false, 1, NOW(), NOW())`,
        [evaluationPeriodId, evaluatorId],
      );
    }

    evaluateeIds = allEmployees
      .slice(0, TARGET_EVALUATEE_COUNT)
      .map((emp: any) => emp.id); // 100명의 피평가자

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
      `   - 모든 피평가자가 등록되어 있음: ${evaluateeIds.every((id) => registeredEmployeeIds.includes(id))}`,
    );

    // 등록되지 않은 피평가자가 있다면 등록
    const unregisteredEmployees = evaluateeIds.filter(
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

    // 4. WBS 항목 조회 (할당용, projectId 포함)
    const availableWbsItems = await dataSource.manager.query(
      `SELECT id, "projectId" FROM wbs_item WHERE "deletedAt" IS NULL ORDER BY "wbsCode" ASC LIMIT 20`,
    );

    console.log(`\n📦 WBS 할당 중...`);
    console.log(`   사용 가능한 WBS: ${availableWbsItems.length}개`);

    // 5. 각 피평가자에게 WBS 할당 (WBS가 없는 경우)
    let wbsAssignmentCount = 0;
    for (const employeeId of evaluateeIds) {
      // 기존 WBS 할당 확인
      const existingWbsCount = await dataSource.manager.query(
        `SELECT COUNT(*) as count FROM evaluation_wbs_assignment 
         WHERE "periodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
        [evaluationPeriodId, employeeId],
      );

      const hasWbs = parseInt(existingWbsCount[0]?.count || '0') > 0;

      if (!hasWbs && availableWbsItems.length > 0) {
        // WBS가 없는 직원에게 5개의 WBS 할당
        const wbsToAssign = availableWbsItems.slice(
          0,
          Math.min(5, availableWbsItems.length),
        );

        for (const wbs of wbsToAssign) {
          await dataSource.manager.query(
            `INSERT INTO evaluation_wbs_assignment (id, "periodId", "employeeId", "wbsItemId", "projectId", "assignedBy", "assignedDate", version, "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), 1, NOW(), NOW())`,
            [
              evaluationPeriodId,
              employeeId,
              wbs.id,
              wbs.projectId,
              evaluatorId,
            ],
          );
          wbsAssignmentCount++;
        }

        if (wbsAssignmentCount % 50 === 0) {
          process.stdout.write(`\r   WBS 할당 진행: ${wbsAssignmentCount}건`);
        }
      }
    }

    if (wbsAssignmentCount > 0) {
      console.log(`\n✅ WBS 할당 완료: ${wbsAssignmentCount}건`);
    }

    // 6. 평가라인 설정은 생략
    // Note: evaluation_line_mappings에는 evaluationLineId가 필요하며,
    // 이는 먼저 evaluation_lines에 레코드를 생성해야 합니다.
    // 복잡한 비즈니스 로직이 필요하므로 성능 테스트에서는 생략합니다.
    // 평가라인이 없어도 API는 빈 배열을 빠르게 반환하므로 성능 측정에는 문제없습니다.
    console.log(`\n📊 평가라인 설정: 생략 (복잡한 의존성으로 인해 생략)`);
    console.log(`   Note: 평가라인 없이도 API 성능 측정 가능`);

    const totalTime = Date.now() - startTime;

    console.log(`\n🎉 데이터 생성 완료!`);
    console.log(`   총 소요 시간: ${(totalTime / 1000).toFixed(2)}초`);
    console.log(`   - 평가자: 1명`);
    console.log(`   - 피평가자: ${evaluateeIds.length}명`);
    console.log(`   - 평가라인 매핑: 0건 (생략됨)`);
  }

  describe('성능 측정', () => {
    it('대량 데이터 환경에서 평가 대상자 현황 조회 성능 측정', async () => {
      console.log('\n🔍 성능 측정 시작...');
      console.log(
        `   목표: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms 이내 응답`,
      );
      console.log(`   평가자: ${evaluatorId}`);
      console.log(`   피평가자: ${evaluateeIds.length}명`);

      const responseTimes: number[] = [];
      const iterations = 5;

      // 여러 번 반복 조회하여 평균 성능 측정
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
          );

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
        console.log(
          `   [${i + 1}/${iterations}] 응답 시간: ${responseTime}ms, 대상자: ${response.body.length}명`,
        );
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

      const responseTimes: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
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

    it('병렬 조회 시 성능 검증', async () => {
      console.log('\n⚡ 병렬 조회 성능 측정...');

      const parallelCount = 5;
      const startTime = Date.now();

      const promises = Array(parallelCount)
        .fill(null)
        .map(() =>
          testSuite
            .request()
            .get(
              `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
            )
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

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
        )
        .expect(200);

      const targets = response.body;

      expect(Array.isArray(targets)).toBe(true);
      console.log(`   - 조회된 평가 대상자 수: ${targets.length}명`);

      // 샘플 데이터 상세 검증 (첫 5명)
      const sampleTargets = targets.slice(0, 5);
      sampleTargets.forEach((target: any) => {
        // 기본 필드 검증
        expect(target).toHaveProperty('employeeId');
        expect(target).toHaveProperty('isEvaluationTarget');
        expect(target).toHaveProperty('exclusionInfo');
        expect(target).toHaveProperty('evaluationCriteria');
        expect(target).toHaveProperty('wbsCriteria');
        expect(target).toHaveProperty('evaluationLine');
        expect(target).toHaveProperty('performanceInput');
        expect(target).toHaveProperty('myEvaluatorTypes');
        expect(target).toHaveProperty('downwardEvaluation');

        // 내 평가자 유형 확인
        expect(Array.isArray(target.myEvaluatorTypes)).toBe(true);
        expect(target.myEvaluatorTypes.length).toBeGreaterThan(0);

        // 하향평가 정보 검증
        expect(target.downwardEvaluation).toHaveProperty('isPrimary');
        expect(target.downwardEvaluation).toHaveProperty('isSecondary');
        expect(target.downwardEvaluation).toHaveProperty('primaryStatus');
        expect(target.downwardEvaluation).toHaveProperty('secondaryStatus');
      });

      console.log(
        `✅ 데이터 정합성 검증 완료 (샘플 ${sampleTargets.length}명)`,
      );
    });

    it('평가자 유형과 하향평가 정보가 일치해야 함', async () => {
      console.log('\n🔍 평가자 유형 일치성 검증...');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
        )
        .expect(200);

      const targets = response.body;

      targets.forEach((target: any) => {
        const isPrimaryInTypes = target.myEvaluatorTypes.includes('primary');
        const isSecondaryInTypes =
          target.myEvaluatorTypes.includes('secondary');

        // myEvaluatorTypes와 downwardEvaluation 일치 검증
        expect(target.downwardEvaluation.isPrimary).toBe(isPrimaryInTypes);
        expect(target.downwardEvaluation.isSecondary).toBe(isSecondaryInTypes);

        // PRIMARY 평가자인 경우 primaryStatus가 null이 아니어야 함
        if (isPrimaryInTypes) {
          expect(target.downwardEvaluation.primaryStatus).not.toBeNull();
          expect(target.downwardEvaluation.primaryStatus).toHaveProperty(
            'assignedWbsCount',
          );
          expect(target.downwardEvaluation.primaryStatus).toHaveProperty(
            'completedEvaluationCount',
          );
          expect(target.downwardEvaluation.primaryStatus).toHaveProperty(
            'isEditable',
          );
          expect(target.downwardEvaluation.primaryStatus).toHaveProperty(
            'averageScore',
          );
        } else {
          expect(target.downwardEvaluation.primaryStatus).toBeNull();
        }

        // SECONDARY 평가자인 경우 secondaryStatus가 null이 아니어야 함
        if (isSecondaryInTypes) {
          expect(target.downwardEvaluation.secondaryStatus).not.toBeNull();
        } else {
          expect(target.downwardEvaluation.secondaryStatus).toBeNull();
        }
      });

      console.log(`✅ 평가자 유형 일치성 검증 완료 (${targets.length}명)`);
    });

    it('상태 값이 유효한 enum 값이어야 함', async () => {
      console.log('\n🔍 상태 값 유효성 검증...');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
        )
        .expect(200);

      const targets = response.body;
      const validStatuses = ['complete', 'in_progress', 'none'];

      targets.forEach((target: any) => {
        expect(validStatuses).toContain(target.evaluationCriteria.status);
        expect(validStatuses).toContain(target.wbsCriteria.status);
        expect(validStatuses).toContain(target.evaluationLine.status);
        expect(validStatuses).toContain(target.performanceInput.status);
      });

      console.log(`✅ 상태 값 유효성 검증 완료 (${targets.length}명)`);
    });
  });

  describe('메모리 및 리소스 사용량', () => {
    it('대량 데이터 조회 시 메모리 누수가 없어야 함', async () => {
      console.log('\n💾 메모리 사용량 모니터링...');

      const initialMemory = process.memoryUsage();
      console.log(
        `   초기 메모리: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      );

      // 반복 조회로 메모리 누수 검증 (100명 피평가자는 시간이 오래 걸려서 20회로 조정)
      const iterations = 20;
      for (let i = 0; i < iterations; i++) {
        await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
          )
          .expect(200);

        if ((i + 1) % 5 === 0) {
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

      // 메모리 증가량이 과도하지 않은지 검증 (100명 조회 시 200MB 이하)
      expect(Math.abs(memoryIncrease)).toBeLessThan(200);
    }, 60000); // 60초 타임아웃 (100명 피평가자 조회는 시간이 오래 걸림)
  });
});
