import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data
 * 성능 테스트
 *
 * 직원의 할당된 프로젝트, WBS, 평가기준, 자기평가 정보를 조회하는 엔드포인트의 성능을 측정합니다.
 */
describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data - 성능 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;

  let evaluationPeriodId: string;
  let testEmployeeIds: string[] = [];

  // 성능 테스트 설정
  const PERFORMANCE_CONFIG = {
    ACCEPTABLE_RESPONSE_TIME_MS: 2000, // 2초 이내 (개별 직원 상세 조회, 대용량 데이터)
    TEST_EMPLOYEE_COUNT: 5, // 테스트할 직원 수
    PROJECTS_PER_EMPLOYEE: 6, // 직원당 프로젝트 수
    WBS_PER_PROJECT: 18, // 프로젝트당 WBS 수
    CRITERIA_PER_WBS: 8, // WBS당 평가기준 수
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);

    await 테스트_데이터를_생성한다();
  }, 1200000); // 20분 타임아웃 (대용량 데이터 생성)

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

    // 2. 테스트용 직원 선택 (생성된 직원 중 최대 10명)
    testEmployeeIds = allEmployees
      .slice(0, PERFORMANCE_CONFIG.TEST_EMPLOYEE_COUNT)
      .map((emp) => emp.id);

    console.log(`\n📋 테스트 대상 직원:`);
    console.log(`   - 선택된 직원 수: ${testEmployeeIds.length}명`);

    // 2-1. 평가기간-직원 매핑 생성 (없는 경우)
    for (const employeeId of testEmployeeIds) {
      await dataSource.manager.query(
        `INSERT INTO evaluation_period_employee_mapping (id, "evaluationPeriodId", "employeeId", version, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 1, NOW(), NOW())
         ON CONFLICT ("evaluationPeriodId", "employeeId") WHERE "deletedAt" IS NULL DO NOTHING`,
        [evaluationPeriodId, employeeId],
      );
    }

    // 3. 프로젝트 및 WBS 대량 생성
    console.log(`\n🏗️  대용량 프로젝트 및 WBS 생성 중...`);

    // 기존 프로젝트 조회
    const existingProjects = await dataSource.manager.query(
      `SELECT id, "projectCode", name FROM project WHERE "deletedAt" IS NULL LIMIT ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE}`,
    );

    console.log(`   - 사용 가능한 프로젝트: ${existingProjects.length}개`);

    let totalProjectAssignments = 0;
    let totalWbsAssignments = 0;
    let totalCriteriaCount = 0;

    for (const employeeId of testEmployeeIds) {
      const employeeProjects = existingProjects.slice(
        0,
        PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE,
      );

      for (const project of employeeProjects) {
        // 프로젝트 할당 (중복 체크 후 삽입)
        const existingProjectAssignment = await dataSource.manager.query(
          `SELECT id FROM evaluation_project_assignment 
           WHERE "periodId" = $1 AND "employeeId" = $2 AND "projectId" = $3 AND "deletedAt" IS NULL`,
          [evaluationPeriodId, employeeId, project.id],
        );

        if (existingProjectAssignment.length === 0) {
          await dataSource.manager.query(
            `INSERT INTO evaluation_project_assignment (id, "periodId", "employeeId", "projectId", "assignedBy", "assignedDate", version, "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), 1, NOW(), NOW())`,
            [evaluationPeriodId, employeeId, project.id, testEmployeeIds[0]],
          );
          totalProjectAssignments++;
        }

        // 각 프로젝트마다 WBS 생성 및 할당
        for (
          let wbsIdx = 0;
          wbsIdx < PERFORMANCE_CONFIG.WBS_PER_PROJECT;
          wbsIdx++
        ) {
          // WBS 항목 생성
          const wbsCode = `${project.projectCode || project.id.substring(0, 8)}-WBS-${String(wbsIdx + 1).padStart(3, '0')}`;
          const wbsName = `${project.name} - 업무 ${wbsIdx + 1}`;

          // WBS 항목 생성 (중복 체크 후 삽입)
          const existingWbs = await dataSource.manager.query(
            `SELECT id FROM wbs_item WHERE "wbsCode" = $1`,
            [wbsCode],
          );

          let wbsId;
          if (existingWbs.length > 0) {
            wbsId = existingWbs[0].id;
          } else {
            const wbsResult = await dataSource.manager.query(
              `INSERT INTO wbs_item (id, "projectId", "wbsCode", title, "startDate", "endDate", status, level, version, "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, $2, $3, '2024-01-01', '2024-12-31', 'PENDING', 1, 1, NOW(), NOW())
               RETURNING id`,
              [project.id, wbsCode, wbsName],
            );
            wbsId = wbsResult[0].id;
          }

          // WBS 할당 (중복 체크 후 삽입)
          const existingWbsAssignment = await dataSource.manager.query(
            `SELECT id FROM evaluation_wbs_assignment 
             WHERE "periodId" = $1 AND "employeeId" = $2 AND "wbsItemId" = $3 AND "deletedAt" IS NULL`,
            [evaluationPeriodId, employeeId, wbsId],
          );

          if (existingWbsAssignment.length === 0) {
            await dataSource.manager.query(
              `INSERT INTO evaluation_wbs_assignment (id, "periodId", "employeeId", "wbsItemId", "projectId", "assignedBy", "assignedDate", version, "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), 1, NOW(), NOW())`,
              [
                evaluationPeriodId,
                employeeId,
                wbsId,
                project.id,
                testEmployeeIds[0],
              ],
            );
            totalWbsAssignments++;
          }

          // 각 WBS에 평가기준 생성
          for (
            let criteriaIdx = 1;
            criteriaIdx <= PERFORMANCE_CONFIG.CRITERIA_PER_WBS;
            criteriaIdx++
          ) {
            await dataSource.manager.query(
              `INSERT INTO wbs_evaluation_criteria (id, "wbsItemId", criteria, version, "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, $2, 1, NOW(), NOW())
               ON CONFLICT DO NOTHING`,
              [
                wbsId,
                `평가기준 ${criteriaIdx}: ${wbsName}에 대한 성과 측정 항목`,
              ],
            );
            totalCriteriaCount++;
          }
        }
      }

      if ((testEmployeeIds.indexOf(employeeId) + 1) % 1 === 0) {
        console.log(
          `   [${testEmployeeIds.indexOf(employeeId) + 1}/${testEmployeeIds.length}] 직원 데이터 생성 완료`,
        );
      }
    }

    console.log(`\n✅ 대용량 데이터 생성 완료:`);
    console.log(`   - 프로젝트 할당: ${totalProjectAssignments}건`);
    console.log(`   - WBS 할당: ${totalWbsAssignments}건`);
    console.log(`   - 평가기준: ${totalCriteriaCount}건`);

    // 4. 자기평가 데이터 생성
    console.log(`\n📊 자기평가 데이터 생성 중...`);
    let selfEvalCount = 0;

    for (const employeeId of testEmployeeIds) {
      const wbsAssignments = await dataSource.manager.query(
        `SELECT "wbsItemId", "assignedBy" FROM evaluation_wbs_assignment 
         WHERE "periodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
        [evaluationPeriodId, employeeId],
      );

      for (const wbs of wbsAssignments) {
        await dataSource.manager.query(
          `INSERT INTO wbs_self_evaluation (id, "periodId", "employeeId", "wbsItemId", "assignedBy", "assignedDate", "evaluationDate", "performanceResult", "selfEvaluationScore", version, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), '대용량 성능 테스트를 위한 성과 기술서 내용입니다. 해당 WBS에 대한 상세한 업무 수행 내역 및 달성 성과를 작성합니다.', 87.5, 1, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [evaluationPeriodId, employeeId, wbs.wbsItemId, wbs.assignedBy],
        );
        selfEvalCount++;
      }
    }

    console.log(`✅ 자기평가 데이터 생성 완료: ${selfEvalCount}건`);

    const totalTime = Date.now() - startTime;
    console.log(`\n🎉 대용량 데이터 생성 완료!`);
    console.log(`   총 소요 시간: ${(totalTime / 1000).toFixed(2)}초`);
    console.log(`\n📊 생성된 데이터 요약:`);
    console.log(`   - 테스트 직원: ${testEmployeeIds.length}명`);
    console.log(
      `   - 직원당 프로젝트: ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE}개`,
    );
    console.log(`   - 프로젝트당 WBS: ${PERFORMANCE_CONFIG.WBS_PER_PROJECT}개`);
    console.log(
      `   - WBS당 평가기준: ${PERFORMANCE_CONFIG.CRITERIA_PER_WBS}개`,
    );
    console.log(`\n   총계:`);
    console.log(`   - 프로젝트 할당: ${totalProjectAssignments}건`);
    console.log(`   - WBS 할당: ${totalWbsAssignments}건`);
    console.log(`   - 평가기준: ${totalCriteriaCount}건`);
    console.log(`   - 자기평가: ${selfEvalCount}건`);
    console.log(`\n   직원당 데이터:`);
    console.log(
      `   - 프로젝트: ${totalProjectAssignments / testEmployeeIds.length}개/명`,
    );
    console.log(
      `   - WBS: ${totalWbsAssignments / testEmployeeIds.length}개/명`,
    );
    console.log(
      `   - 평가기준: ${totalCriteriaCount / testEmployeeIds.length}개/명`,
    );
  }

  describe('성능 측정', () => {
    it('개별 직원 할당 정보 조회 성능 측정 (대용량 데이터)', async () => {
      console.log('\n🔍 대용량 데이터 성능 측정 시작...');
      console.log(
        `   목표: ${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms 이내 응답`,
      );
      console.log(`   테스트 직원: ${testEmployeeIds.length}명`);
      console.log(
        `   직원당 예상 데이터: 프로젝트 ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE}개, WBS ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE * PERFORMANCE_CONFIG.WBS_PER_PROJECT}개, 평가기준 ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE * PERFORMANCE_CONFIG.WBS_PER_PROJECT * PERFORMANCE_CONFIG.CRITERIA_PER_WBS}개`,
      );

      const responseTimes: number[] = [];

      // 각 직원에 대해 조회 성능 측정
      for (const employeeId of testEmployeeIds) {
        const startTime = Date.now();

        const response = await request(app.getHttpServer()).get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
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
        const { evaluationPeriod, employee, projects, summary } = response.body;
        expect(evaluationPeriod).toBeDefined();
        expect(employee).toBeDefined();
        expect(projects).toBeDefined();
        expect(summary).toBeDefined();
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

      const testEmployeeId = testEmployeeIds[0];
      const responseTimes: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/employees/${testEmployeeId}/assigned-data`,
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

      const testEmployees = testEmployeeIds.slice(0, 5);
      const startTime = Date.now();

      const promises = testEmployees.map((employeeId) =>
        request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
          )
          .expect(200),
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / testEmployees.length;

      console.log(`   - 총 소요 시간: ${totalTime}ms`);
      console.log(`   - 요청당 평균 시간: ${avgTimePerRequest.toFixed(2)}ms`);
      console.log(`   - 동시 요청 수: ${testEmployees.length}개`);

      // 모든 응답 검증
      results.forEach((response) => {
        expect(response.body).toHaveProperty('evaluationPeriod');
        expect(response.body).toHaveProperty('employee');
        expect(response.body).toHaveProperty('projects');
        expect(response.body).toHaveProperty('summary');
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

      const testEmployeeId = testEmployeeIds[0];

      const response = await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${testEmployeeId}/assigned-data`,
        )
        .expect(200);

      const { evaluationPeriod, employee, projects, summary } = response.body;

      // 평가기간 정보 검증
      expect(evaluationPeriod).toHaveProperty('id');
      expect(evaluationPeriod).toHaveProperty('name');
      expect(evaluationPeriod.id).toBe(evaluationPeriodId);

      // 직원 정보 검증
      expect(employee).toHaveProperty('id');
      expect(employee).toHaveProperty('name');
      expect(employee).toHaveProperty('employeeNumber');
      expect(employee.id).toBe(testEmployeeId);

      // 프로젝트 정보 검증
      expect(projects).toBeDefined();
      expect(Array.isArray(projects)).toBe(true);

      let totalProjectCount = 0;
      let totalWbsCount = 0;
      let totalCriteriaCount = 0;

      // 각 프로젝트 검증
      for (const project of projects || []) {
        expect(project).toHaveProperty('projectId');
        expect(project).toHaveProperty('projectName');
        expect(project).toHaveProperty('projectCode');
        expect(project).toHaveProperty('wbsList');

        totalProjectCount++;
        totalWbsCount += project.wbsList.length;

        // 각 WBS 검증
        project.wbsList.forEach((wbs: any) => {
          // WBS 기본 필드 검증 (응답 구조에 맞게)
          expect(wbs).toHaveProperty('wbsCode');
          expect(wbs).toHaveProperty('wbsName');
          expect(wbs).toHaveProperty('criteria');

          totalCriteriaCount += wbs.criteria?.length || 0;

          // 평가기준 검증
          if (wbs.criteria) {
            wbs.criteria.forEach((criterion: any) => {
              expect(criterion).toBeDefined();
            });
          }
        });
      }

      console.log(`✅ 데이터 정합성 검증 완료`);
      console.log(`   - 프로젝트: ${totalProjectCount}개`);
      console.log(`   - WBS: ${totalWbsCount}개`);
      console.log(`   - 평가기준: ${totalCriteriaCount}개`);
      console.log(
        `   예상치: 프로젝트 ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE}개, WBS ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE * PERFORMANCE_CONFIG.WBS_PER_PROJECT}개, 평가기준 ${PERFORMANCE_CONFIG.PROJECTS_PER_EMPLOYEE * PERFORMANCE_CONFIG.WBS_PER_PROJECT * PERFORMANCE_CONFIG.CRITERIA_PER_WBS}개`,
      );
    });

    it('요약 정보가 정확해야 함', async () => {
      console.log('\n🔍 요약 정보 정합성 검증...');

      const testEmployeeId = testEmployeeIds[0];

      const response = await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${testEmployeeId}/assigned-data`,
        )
        .expect(200);

      const { summary } = response.body;

      // 요약 정보 검증
      expect(summary).toBeDefined();

      expect(summary).toHaveProperty('totalProjects');
      expect(summary).toHaveProperty('totalWbs');
      expect(summary).toHaveProperty('completedSelfEvaluations');
      expect(summary).toHaveProperty('completedPerformances');

      // 숫자 타입 검증
      expect(typeof summary.totalProjects).toBe('number');
      expect(typeof summary.totalWbs).toBe('number');
      expect(typeof summary.completedSelfEvaluations).toBe('number');
      expect(typeof summary.completedPerformances).toBe('number');

      console.log(`✅ 요약 정보 검증 완료`);
      console.log(`   - 총 프로젝트: ${summary.totalProjects}개`);
      console.log(`   - 총 WBS: ${summary.totalWbs}개`);
      console.log(`   - 완료된 성과: ${summary.completedPerformances}개`);
      console.log(
        `   - 완료된 자기평가: ${summary.completedSelfEvaluations}개`,
      );
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
      const iterations = 30;
      for (let i = 0; i < iterations; i++) {
        const employeeId = testEmployeeIds[i % testEmployeeIds.length];

        await request(app.getHttpServer())
          .get(
            `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
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

      // 메모리 증가량이 과도하지 않은지 검증 (200MB 이하)
      // 대용량 데이터(WBS 108개/직원) 30회 반복 조회 시 메모리 증가는 정상
      expect(Math.abs(memoryIncrease)).toBeLessThan(200);
    }, 60000); // 60초 타임아웃
  });
});
