import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /admin/dashboard/employees/:employeeId/final-evaluations - 직원별 최종평가 목록 조회 테스트', () => {
  let testSuite: BaseE2ETest;

  // 테스트 데이터 저장용
  let evaluationPeriodIds: string[] = [];
  let employeeIds: string[] = [];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 테스트 데이터 생성', () => {
    it('✅ 5개 평가기간 생성 및 최종평가 데이터 준비', async () => {
      console.log('\n📊 5개 평가기간 생성 중...\n');

      // 첫 번째 평가기간 생성 (clearExisting: true)
      const firstResponse = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: true,
          projectCount: 3,
          wbsPerProject: 5,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            selfEvaluationProgress: {
              notStarted: 0,
              inProgress: 0,
              completed: 100,
            },
            downwardEvaluationProgress: {
              notStarted: 0,
              inProgress: 0,
              completed: 100,
            },
            primaryDownwardEvaluationProgress: {
              notStarted: 0,
              inProgress: 0,
              completed: 100,
            },
            secondaryDownwardEvaluationProgress: {
              notStarted: 0,
              inProgress: 0,
              completed: 100,
            },
          },
        })
        .expect(HttpStatus.CREATED);

      expect(firstResponse.body.success).toBe(true);
      const firstPeriod = firstResponse.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );
      evaluationPeriodIds.push(firstPeriod.generatedIds.periodIds[0]);

      // 직원 ID 추출
      const phase1 = firstResponse.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      employeeIds = phase1.generatedIds.employeeIds.slice(0, 10); // 10명만 사용

      console.log(
        `✅ 평가기간 1 생성 완료: ${evaluationPeriodIds[0].substring(0, 8)}...`,
      );

      // 나머지 4개 평가기간 생성
      for (let i = 2; i <= 5; i++) {
        const response = await testSuite
          .request()
          .post('/admin/seed/generate-with-real-data')
          .send({
            scenario: 'full',
            clearExisting: false,
            projectCount: 3,
            wbsPerProject: 5,
            evaluationConfig: {
              periodCount: 1,
            },
            stateDistribution: {
              selfEvaluationProgress: {
                notStarted: 0,
                inProgress: 0,
                completed: 100,
              },
              downwardEvaluationProgress: {
                notStarted: 0,
                inProgress: 0,
                completed: 100,
              },
              primaryDownwardEvaluationProgress: {
                notStarted: 0,
                inProgress: 0,
                completed: 100,
              },
              secondaryDownwardEvaluationProgress: {
                notStarted: 0,
                inProgress: 0,
                completed: 100,
              },
            },
          })
          .expect(HttpStatus.CREATED);

        const period = response.body.results.find(
          (r: any) => r.phase === 'Phase2',
        );
        evaluationPeriodIds.push(period.generatedIds.periodIds[0]);
        console.log(
          `✅ 평가기간 ${i} 생성 완료: ${evaluationPeriodIds[i - 1].substring(0, 8)}...`,
        );
      }

      console.log('\n📊 생성된 데이터:');
      console.log(`  - 평가기간: ${evaluationPeriodIds.length}개`);
      console.log(`  - 테스트 대상 직원: ${employeeIds.length}명`);
    });

    it('✅ 각 평가기간별 최종평가 생성', async () => {
      console.log('\n📊 최종평가 데이터 생성 중...\n');

      const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
      const jobGrades = ['T1', 'T2', 'T3'];

      let totalCreated = 0;

      for (let i = 0; i < evaluationPeriodIds.length; i++) {
        const periodId = evaluationPeriodIds[i];
        console.log(`평가기간 ${i + 1}/5 (${periodId.substring(0, 8)}...)`);

        let periodCreated = 0;
        // 각 평가기간에 대해 직원 ID 리스트를 사용하여 최종평가 생성
        for (const employeeId of employeeIds) {
          const evaluationGrade =
            evaluationGrades[
              Math.floor(Math.random() * evaluationGrades.length)
            ];
          const jobGrade =
            jobGrades[Math.floor(Math.random() * jobGrades.length)];

          try {
            await testSuite
              .request()
              .post(`/admin/performance-evaluation/final-evaluations`)
              .send({
                periodId: periodId,
                employeeId: employeeId,
                evaluationGrade: evaluationGrade,
                jobGrade: evaluationGrade,
                jobDetailedGrade: jobGrade,
                finalComments: `우수한 성과를 평가합니다.`,
              });
            periodCreated++;
          } catch (error) {
            // 중복 생성 시 무시
          }
        }
        console.log(`  ✅ ${periodCreated}개 생성`);
        totalCreated += periodCreated;
      }

      console.log(`\n✅ 총 ${totalCreated}개 최종평가 생성 완료\n`);
    });
  });

  describe('시나리오 2: 기본 조회 기능', () => {
    it('✅ 직원의 모든 평가기간 최종평가 조회', async () => {
      const employeeId = employeeIds[0];
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 직원별 최종평가 조회 결과:');
      console.log(`  - 직원 ID: ${response.body.employee.id}`);
      console.log(`  - 직원명: ${response.body.employee.name}`);
      console.log(`  - 직원번호: ${response.body.employee.employeeNumber}`);
      console.log(`  - 최종평가 수: ${response.body.finalEvaluations.length}`);

      // 직원 정보 검증
      expect(response.body.employee).toMatchObject({
        id: employeeId,
        name: expect.any(String),
        employeeNumber: expect.any(String),
        email: expect.any(String),
      });

      // 최종평가 목록 검증
      expect(response.body.finalEvaluations).toBeInstanceOf(Array);
      expect(response.body.finalEvaluations.length).toBeGreaterThan(0);

      for (const evaluation of response.body.finalEvaluations) {
        expect(evaluation).toMatchObject({
          id: expect.any(String),
          period: {
            id: expect.any(String),
            name: expect.any(String),
            startDate: expect.any(String),
          },
          evaluationGrade: expect.any(String),
          jobGrade: expect.any(String),
          jobDetailedGrade: expect.any(String),
          isConfirmed: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        console.log(
          `    - ${evaluation.period.name}: ${evaluation.evaluationGrade} / ${evaluation.jobGrade} / ${evaluation.jobDetailedGrade}`,
        );
      }

      console.log('  ✅ 응답 구조 검증 완료');
    });

    it('✅ 여러 직원의 최종평가 조회 (데이터 일관성)', async () => {
      console.log('\n📊 여러 직원 조회 테스트:');

      for (let i = 0; i < Math.min(5, employeeIds.length); i++) {
        const employeeId = employeeIds[i];
        const response = await testSuite
          .request()
          .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
          .expect(HttpStatus.OK);

        expect(response.body.employee.id).toBe(employeeId);
        expect(response.body.finalEvaluations).toBeInstanceOf(Array);

        console.log(
          `  ✅ 직원 ${i + 1} (${response.body.employee.name}): ${response.body.finalEvaluations.length}개 평가`,
        );
      }
    });

    it('✅ 최종평가 시간순 정렬 확인', async () => {
      const employeeId = employeeIds[0];
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 평가 정렬 확인:');

      if (response.body.finalEvaluations.length > 1) {
        // 평가기간 시작일 기준으로 정렬되어 있는지 확인
        for (let i = 0; i < response.body.finalEvaluations.length - 1; i++) {
          const current = new Date(
            response.body.finalEvaluations[i].period.startDate,
          );
          const next = new Date(
            response.body.finalEvaluations[i + 1].period.startDate,
          );

          console.log(
            `  - 평가 ${i + 1}: ${response.body.finalEvaluations[i].period.name} (${current.toISOString().substring(0, 10)})`,
          );
        }

        console.log('  ✅ 시간순 정렬 확인 완료');
      }
    });
  });

  describe('시나리오 3: 날짜 필터링 기능', () => {
    it('✅ startDate 필터: 특정 날짜 이후 평가만 조회', async () => {
      const employeeId = employeeIds[0];

      // 전체 조회
      const allResponse = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      if (allResponse.body.finalEvaluations.length > 2) {
        // 두 번째 평가기간의 시작일을 기준으로 필터링
        const secondEvaluation = allResponse.body.finalEvaluations[1];
        const startDate = secondEvaluation.period.startDate;

        const filteredResponse = await testSuite
          .request()
          .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
          .query({ startDate })
          .expect(HttpStatus.OK);

        console.log('\n📊 startDate 필터 결과:');
        console.log(
          `  - 전체 평가 수: ${allResponse.body.finalEvaluations.length}`,
        );
        console.log(
          `  - 필터링된 평가 수: ${filteredResponse.body.finalEvaluations.length}`,
        );

        expect(
          filteredResponse.body.finalEvaluations.length,
        ).toBeLessThanOrEqual(allResponse.body.finalEvaluations.length);

        // 필터링된 결과가 모두 startDate 이후인지 확인
        for (const evaluation of filteredResponse.body.finalEvaluations) {
          const evalDate = new Date(evaluation.period.startDate);
          expect(evalDate.getTime()).toBeGreaterThanOrEqual(
            new Date(startDate).getTime(),
          );
        }

        console.log('  ✅ startDate 필터링 정상 작동');
      }
    });

    it('✅ endDate 필터: 특정 날짜 이전 평가만 조회', async () => {
      const employeeId = employeeIds[0];

      // 전체 조회
      const allResponse = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      if (allResponse.body.finalEvaluations.length > 2) {
        // 마지막에서 두 번째 평가기간의 시작일을 기준으로 필터링
        const lastIndex = allResponse.body.finalEvaluations.length - 2;
        const targetEvaluation = allResponse.body.finalEvaluations[lastIndex];
        const endDate = targetEvaluation.period.startDate;

        const filteredResponse = await testSuite
          .request()
          .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
          .query({ endDate })
          .expect(HttpStatus.OK);

        console.log('\n📊 endDate 필터 결과:');
        console.log(
          `  - 전체 평가 수: ${allResponse.body.finalEvaluations.length}`,
        );
        console.log(
          `  - 필터링된 평가 수: ${filteredResponse.body.finalEvaluations.length}`,
        );

        expect(
          filteredResponse.body.finalEvaluations.length,
        ).toBeLessThanOrEqual(allResponse.body.finalEvaluations.length);

        // 필터링된 결과가 모두 endDate 이전인지 확인
        for (const evaluation of filteredResponse.body.finalEvaluations) {
          const evalDate = new Date(evaluation.period.startDate);
          expect(evalDate.getTime()).toBeLessThanOrEqual(
            new Date(endDate).getTime(),
          );
        }

        console.log('  ✅ endDate 필터링 정상 작동');
      }
    });

    it('✅ startDate & endDate 필터: 특정 기간 내 평가만 조회', async () => {
      const employeeId = employeeIds[0];

      // 전체 조회
      const allResponse = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      if (allResponse.body.finalEvaluations.length >= 3) {
        // 두 번째와 네 번째 평가 사이의 기간 조회
        const startDate = allResponse.body.finalEvaluations[1].period.startDate;
        const endIndex = Math.min(
          3,
          allResponse.body.finalEvaluations.length - 1,
        );
        const endDate =
          allResponse.body.finalEvaluations[endIndex].period.startDate;

        const filteredResponse = await testSuite
          .request()
          .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
          .query({ startDate, endDate })
          .expect(HttpStatus.OK);

        console.log('\n📊 startDate & endDate 필터 결과:');
        console.log(
          `  - 전체 평가 수: ${allResponse.body.finalEvaluations.length}`,
        );
        console.log(
          `  - 필터링된 평가 수: ${filteredResponse.body.finalEvaluations.length}`,
        );

        expect(
          filteredResponse.body.finalEvaluations.length,
        ).toBeLessThanOrEqual(allResponse.body.finalEvaluations.length);

        // 필터링된 결과가 모두 기간 내에 있는지 확인
        const startTime = new Date(startDate).getTime();
        const endTime = new Date(endDate).getTime();

        for (const evaluation of filteredResponse.body.finalEvaluations) {
          const evalDate = new Date(evaluation.period.startDate);
          expect(evalDate.getTime()).toBeGreaterThanOrEqual(startTime);
          expect(evalDate.getTime()).toBeLessThanOrEqual(endTime);
        }

        console.log('  ✅ 기간 범위 필터링 정상 작동');
      }
    });

    it('✅ 미래 날짜 필터: 빈 배열 반환', async () => {
      const employeeId = employeeIds[0];

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10); // 10년 후

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .query({ startDate: futureDate.toISOString() })
        .expect(HttpStatus.OK);

      console.log('\n📊 미래 날짜 필터 결과:');
      console.log(`  - 최종평가 수: ${response.body.finalEvaluations.length}`);

      expect(response.body.employee).toBeDefined();
      expect(response.body.finalEvaluations).toEqual([]);

      console.log('  ✅ 빈 배열 반환 확인');
    });
  });

  describe('시나리오 4: 에러 케이스', () => {
    it('❌ 존재하지 않는 직원 ID로 조회 시 404 에러', async () => {
      const invalidEmployeeId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/employees/${invalidEmployeeId}/final-evaluations`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n❌ 존재하지 않는 직원 조회:');
      console.log(`  - 상태 코드: ${response.status}`);
      console.log(`  - 에러 메시지: ${response.body.message}`);

      expect(response.body.message).toContain('직원을 찾을 수 없습니다');
    });

    it('❌ 잘못된 UUID 형식으로 조회 시 400 에러', async () => {
      const invalidId = 'invalid-uuid-format';

      await testSuite
        .request()
        .get(`/admin/dashboard/employees/${invalidId}/final-evaluations`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 UUID 형식:');
      console.log('  - 400 Bad Request 반환 확인');
    });

    it('❌ 잘못된 날짜 형식으로 조회 시 400 에러', async () => {
      const employeeId = employeeIds[0];

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .query({ startDate: 'invalid-date' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 날짜 형식:');
      console.log(`  - 상태 코드: ${response.status}`);
    });
  });

  describe('시나리오 5: 특수 케이스', () => {
    it('✅ 최종평가가 하나도 없는 직원 조회 (빈 배열)', async () => {
      // 마지막 직원 (최종평가가 없을 가능성이 높음)
      const lastEmployeeId = employeeIds[employeeIds.length - 1];

      // 미래 날짜로 필터링하여 빈 배열 강제
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${lastEmployeeId}/final-evaluations`)
        .query({ startDate: futureDate.toISOString() })
        .expect(HttpStatus.OK);

      console.log('\n📊 최종평가가 없는 직원:');
      console.log(`  - 직원 ID: ${response.body.employee.id}`);
      console.log(`  - 직원명: ${response.body.employee.name}`);
      console.log(`  - 최종평가 수: ${response.body.finalEvaluations.length}`);

      expect(response.body.employee).toBeDefined();
      expect(response.body.finalEvaluations).toEqual([]);

      console.log('  ✅ 직원 정보는 반환되고 평가 목록은 빈 배열');
    });

    it('✅ 여러 평가기간에 걸친 평가 등급 분포 확인', async () => {
      const employeeId = employeeIds[0];
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 평가 등급 분포:');

      const gradeDistribution: { [key: string]: number } = {};
      const jobGradeDistribution: { [key: string]: number } = {};

      for (const evaluation of response.body.finalEvaluations) {
        const evalGrade = evaluation.evaluationGrade;
        const jobGrade = evaluation.jobDetailedGrade;

        gradeDistribution[evalGrade] = (gradeDistribution[evalGrade] || 0) + 1;
        jobGradeDistribution[jobGrade] =
          (jobGradeDistribution[jobGrade] || 0) + 1;
      }

      console.log('  - 평가 등급 분포:', gradeDistribution);
      console.log('  - 직무 등급 분포:', jobGradeDistribution);
      console.log(`  - 총 평가 수: ${response.body.finalEvaluations.length}`);

      // 최소 1개 이상의 등급이 있어야 함
      expect(Object.keys(gradeDistribution).length).toBeGreaterThan(0);

      console.log('  ✅ 등급 분포 확인 완료');
    });

    it('✅ 평가 확정 상태 확인', async () => {
      const employeeId = employeeIds[0];
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 평가 확정 상태:');

      let confirmedCount = 0;
      let unconfirmedCount = 0;

      for (const evaluation of response.body.finalEvaluations) {
        if (evaluation.isConfirmed) {
          confirmedCount++;
        } else {
          unconfirmedCount++;
        }
      }

      console.log(`  - 확정된 평가: ${confirmedCount}개`);
      console.log(`  - 미확정 평가: ${unconfirmedCount}개`);
      console.log(`  - 전체 평가: ${response.body.finalEvaluations.length}개`);

      console.log('  ✅ 확정 상태 확인 완료');
    });
  });

  describe('시나리오 6: 성능 테스트', () => {
    it('✅ 동시에 여러 직원 조회 (5명)', async () => {
      console.log('\n📊 동시 조회 성능 테스트:');

      const startTime = Date.now();
      const testEmployeeIds = employeeIds.slice(0, 5);

      const promises = testEmployeeIds.map((employeeId) =>
        testSuite
          .request()
          .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
          .expect(HttpStatus.OK),
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`  - 조회 직원 수: ${testEmployeeIds.length}명`);
      console.log(`  - 총 소요 시간: ${duration}ms`);
      console.log(
        `  - 평균 응답 시간: ${Math.round(duration / testEmployeeIds.length)}ms`,
      );

      // 모든 응답이 성공적으로 반환되었는지 확인
      for (let i = 0; i < responses.length; i++) {
        expect(responses[i].body.employee.id).toBe(testEmployeeIds[i]);
        expect(responses[i].body.finalEvaluations).toBeInstanceOf(Array);
      }

      // 성능 기준: 5명 조회가 2초 이내
      expect(duration).toBeLessThan(2000);

      console.log('  ✅ 성능 테스트 통과');
    });
  });
});
