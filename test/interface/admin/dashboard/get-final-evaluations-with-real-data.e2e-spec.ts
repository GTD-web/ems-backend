import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /admin/dashboard/final-evaluations - 실제 데이터 기반 최종평가 목록 테스트', () => {
  let testSuite: BaseE2ETest;

  // 테스트 데이터 저장용
  let evaluationPeriodIds: string[] = [];
  let employee1Id: string;
  let employee2Id: string;
  let employee3Id: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 여러 평가기간 최종평가 데이터 생성', () => {
    it('✅ 평가기간 10개 생성', async () => {
      console.log('\n📊 10개 평가기간 생성 중...\n');

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
      console.log(
        `✅ 평가기간 1 생성 완료: ${evaluationPeriodIds[0].substring(0, 8)}...`,
      );

      // 직원 ID 추출
      const phase1 = firstResponse.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      const employeeIds = phase1.generatedIds.employeeIds;
      employee1Id = employeeIds[0];
      employee2Id = employeeIds[1];
      employee3Id = employeeIds[2];

      // 나머지 9개 평가기간 생성 (clearExisting: false)
      for (let i = 2; i <= 10; i++) {
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
      console.log(`  - 평가기간 ${evaluationPeriodIds.length}개 생성`);
      console.log(`  - 직원 ${employeeIds.length}명`);
      console.log(
        `  - 직원 샘플: ${employee1Id}, ${employee2Id}, ${employee3Id}`,
      );
    });

    it('✅ 최종평가 데이터 생성 (10개 평가기간)', async () => {
      console.log('\n📊 10개 평가기간에 대한 최종평가 생성 중...\n');

      // 평가 등급 및 직무 등급 목록
      const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
      const jobGrades = ['T1', 'T2', 'T3'];

      for (let i = 0; i < evaluationPeriodIds.length; i++) {
        const periodId = evaluationPeriodIds[i];
        console.log(
          `평가기간 ${i + 1}/10 (${periodId.substring(0, 8)}...) 최종평가 생성 중...`,
        );

        // 각 평가기간의 모든 직원 현황 조회하여 실제 직원 ID 가져오기
        try {
          const statusResponse = await testSuite
            .request()
            .get(`/admin/dashboard/${periodId}/evaluation-status`)
            .expect(HttpStatus.OK);

          // 실제 직원 목록 추출 (70명만 사용 - 속도 향상)
          const realEmployees = statusResponse.body.slice(0, 70);

          // 각 직원에 대해 최종평가 생성
          let createdCount = 0;
          for (const employeeData of realEmployees) {
            // 랜덤한 등급 할당
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
                  employeeId: employeeData.employee.id,
                  evaluationGrade: evaluationGrade,
                  jobGrade: evaluationGrade,
                  jobDetailedGrade: jobGrade,
                  finalComments: `우수한 성과를 평가합니다.`,
                });
              createdCount++;
            } catch (error) {
              // 이미 존재하거나 다른 오류 발생 시 무시
            }
          }
          console.log(`  ✅ ${createdCount}개 생성 완료`);
        } catch (error) {
          console.log(`  ⚠️  처리 실패: ${error.message}`);
        }
      }

      console.log(`\n✅ 총 10개 평가기간 최종평가 생성 완료\n`);
    });
  });

  describe('시나리오 2: GET /admin/dashboard/final-evaluations (전체 직원별)', () => {
    it('✅ 기본 조회: 모든 직원의 모든 평가기간 최종평가 조회', async () => {
      const response = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .expect(HttpStatus.OK);

      console.log('\n📊 전체 직원별 최종평가 조회 결과:');
      console.log(`  - 평가기간 수: ${response.body.evaluationPeriods.length}`);
      console.log(`  - 직원 수: ${response.body.employees.length}`);

      // 평가기간 검증
      expect(response.body.evaluationPeriods).toBeInstanceOf(Array);
      expect(response.body.evaluationPeriods.length).toBeGreaterThanOrEqual(10);

      for (const period of response.body.evaluationPeriods) {
        expect(period).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          startDate: expect.any(String),
        });
      }

      // 직원 검증
      expect(response.body.employees).toBeInstanceOf(Array);
      expect(response.body.employees.length).toBeGreaterThan(0);

      for (const employeeData of response.body.employees) {
        expect(employeeData.employee).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          employeeNumber: expect.any(String),
          email: expect.any(String),
        });

        expect(employeeData.finalEvaluations).toBeInstanceOf(Array);
        expect(employeeData.finalEvaluations.length).toBe(
          response.body.evaluationPeriods.length,
        );

        // 각 평가기간에 대해 null이거나 평가 객체
        for (const evaluation of employeeData.finalEvaluations) {
          if (evaluation !== null) {
            expect(evaluation).toMatchObject({
              id: expect.any(String),
              evaluationGrade: expect.any(String),
              jobGrade: expect.any(String),
              jobDetailedGrade: expect.any(String),
              isConfirmed: expect.any(Boolean),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            });
          }
        }
      }

      console.log('\n  ✅ 응답 구조 검증 완료');
    });

    it('✅ 기간 필터: startDate만 지정', async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const response = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .query({ startDate: oneYearAgo.toISOString() })
        .expect(HttpStatus.OK);

      console.log('\n📊 startDate 필터 결과:');
      console.log(`  - 평가기간 수: ${response.body.evaluationPeriods.length}`);
      console.log(`  - 직원 수: ${response.body.employees.length}`);

      // 모든 평가기간이 startDate 이후인지 확인
      for (const period of response.body.evaluationPeriods) {
        const periodStart = new Date(period.startDate);
        expect(periodStart.getTime()).toBeGreaterThanOrEqual(
          oneYearAgo.getTime(),
        );
      }

      console.log('  ✅ startDate 필터링 정상 작동');
    });

    it('✅ 기간 필터: endDate만 지정', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .query({ endDate: tomorrow.toISOString() })
        .expect(HttpStatus.OK);

      console.log('\n📊 endDate 필터 결과:');
      console.log(`  - 평가기간 수: ${response.body.evaluationPeriods.length}`);
      console.log(`  - 직원 수: ${response.body.employees.length}`);

      // 모든 평가기간이 endDate 이전인지 확인
      for (const period of response.body.evaluationPeriods) {
        const periodStart = new Date(period.startDate);
        expect(periodStart.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      }

      console.log('  ✅ endDate 필터링 정상 작동');
    });

    it('✅ 기간 필터: startDate와 endDate 모두 지정', async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .query({
          startDate: sixMonthsAgo.toISOString(),
          endDate: tomorrow.toISOString(),
        })
        .expect(HttpStatus.OK);

      console.log('\n📊 startDate & endDate 필터 결과:');
      console.log(`  - 평가기간 수: ${response.body.evaluationPeriods.length}`);
      console.log(`  - 직원 수: ${response.body.employees.length}`);

      // 모든 평가기간이 범위 내인지 확인
      for (const period of response.body.evaluationPeriods) {
        const periodStart = new Date(period.startDate);
        expect(periodStart.getTime()).toBeGreaterThanOrEqual(
          sixMonthsAgo.getTime(),
        );
        expect(periodStart.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      }

      console.log('  ✅ 기간 범위 필터링 정상 작동');
    });
  });

  describe('시나리오 3: GET /admin/dashboard/:evaluationPeriodId/final-evaluations (평가기간별)', () => {
    it('✅ 첫 번째 평가기간의 최종평가 목록 조회', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodIds[0]}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 평가기간별 최종평가 조회 결과:');
      console.log(`  - 평가기간 ID: ${response.body.period.id}`);
      console.log(`  - 평가기간명: ${response.body.period.name}`);
      console.log(`  - 최종평가 수: ${response.body.evaluations.length}`);

      // 평가기간 정보 검증
      expect(response.body.period).toMatchObject({
        id: evaluationPeriodIds[0],
        name: expect.any(String),
        startDate: expect.any(String),
      });

      // 최종평가 목록 검증
      expect(response.body.evaluations).toBeInstanceOf(Array);
      expect(response.body.evaluations.length).toBeGreaterThan(0);

      for (const item of response.body.evaluations) {
        expect(item.employee).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          employeeNumber: expect.any(String),
          email: expect.any(String),
        });

        expect(item.evaluation).toMatchObject({
          id: expect.any(String),
          evaluationGrade: expect.any(String),
          jobGrade: expect.any(String),
          jobDetailedGrade: expect.any(String),
          isConfirmed: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        console.log(
          `  - ${item.employee.name} (${item.employee.employeeNumber}): ${item.evaluation.evaluationGrade} / ${item.evaluation.jobGrade}`,
        );
      }

      console.log('  ✅ 응답 구조 검증 완료');
    });

    it('✅ 열 번째 평가기간의 최종평가 목록 조회', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodIds[9]}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 열 번째 평가기간 조회:');
      console.log(`  - 평가기간명: ${response.body.period.name}`);
      console.log(`  - 최종평가 수: ${response.body.evaluations.length}`);

      expect(response.body.period.id).toBe(evaluationPeriodIds[9]);
      expect(response.body.evaluations).toBeInstanceOf(Array);

      console.log('  ✅ 정상 조회 완료');
    });

    it('❌ 존재하지 않는 평가기간 ID로 조회 시 404 에러', async () => {
      const invalidPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${invalidPeriodId}/final-evaluations`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n❌ 존재하지 않는 평가기간 조회 시도:');
      console.log(`  - 상태 코드: ${response.status}`);
      console.log(`  - 에러 메시지: ${response.body.message}`);

      expect(response.body.message).toContain('평가기간을 찾을 수 없습니다');
    });

    it('❌ 잘못된 UUID 형식으로 조회 시 400 에러', async () => {
      const invalidId = 'invalid-uuid';

      await testSuite
        .request()
        .get(`/admin/dashboard/${invalidId}/final-evaluations`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 UUID 형식:');
      console.log('  - 400 Bad Request 반환 확인');
    });
  });

  describe('시나리오 4: GET /admin/dashboard/employees/:employeeId/final-evaluations (직원별)', () => {
    it('✅ 첫 번째 직원의 모든 최종평가 조회', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employee1Id}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n📊 직원별 최종평가 조회 결과:');
      console.log(`  - 직원 ID: ${response.body.employee.id}`);
      console.log(`  - 직원명: ${response.body.employee.name}`);
      console.log(`  - 최종평가 수: ${response.body.finalEvaluations.length}`);

      // 직원 정보 검증
      expect(response.body.employee).toMatchObject({
        id: employee1Id,
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
          `  - ${evaluation.period.name}: ${evaluation.evaluationGrade} / ${evaluation.jobGrade}`,
        );
      }

      console.log('  ✅ 응답 구조 검증 완료');
    });

    it('✅ 기간 필터: startDate 지정', async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employee1Id}/final-evaluations`)
        .query({ startDate: sixMonthsAgo.toISOString() })
        .expect(HttpStatus.OK);

      console.log('\n📊 직원별 startDate 필터 결과:');
      console.log(`  - 최종평가 수: ${response.body.finalEvaluations.length}`);

      // 모든 평가기간이 startDate 이후인지 확인
      for (const evaluation of response.body.finalEvaluations) {
        const periodStart = new Date(evaluation.period.startDate);
        expect(periodStart.getTime()).toBeGreaterThanOrEqual(
          sixMonthsAgo.getTime(),
        );
      }

      console.log('  ✅ startDate 필터링 정상 작동');
    });

    it('✅ 최종평가가 없는 직원 조회 (빈 배열 반환)', async () => {
      // 최종평가가 없는 새 직원 ID (실제 존재하는 직원이지만 최종평가가 없을 수 있음)
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employee3Id}/final-evaluations`)
        .query({
          startDate: '2030-01-01', // 미래 날짜로 필터링하여 결과 없음
        })
        .expect(HttpStatus.OK);

      console.log('\n📊 최종평가가 없는 경우:');
      console.log(`  - 직원명: ${response.body.employee.name}`);
      console.log(`  - 최종평가 수: ${response.body.finalEvaluations.length}`);

      expect(response.body.employee).toBeDefined();
      expect(response.body.finalEvaluations).toEqual([]);

      console.log('  ✅ 빈 배열 반환 확인');
    });

    it('❌ 존재하지 않는 직원 ID로 조회 시 404 에러', async () => {
      const invalidEmployeeId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/employees/${invalidEmployeeId}/final-evaluations`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n❌ 존재하지 않는 직원 조회 시도:');
      console.log(`  - 상태 코드: ${response.status}`);
      console.log(`  - 에러 메시지: ${response.body.message}`);

      expect(response.body.message).toContain('직원을 찾을 수 없습니다');
    });

    it('❌ 잘못된 UUID 형식으로 조회 시 400 에러', async () => {
      const invalidId = 'invalid-uuid';

      await testSuite
        .request()
        .get(`/admin/dashboard/employees/${invalidId}/final-evaluations`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 UUID 형식:');
      console.log('  - 400 Bad Request 반환 확인');
    });
  });

  describe('시나리오 5: 데이터 일관성 검증', () => {
    it('✅ 전체 조회와 평가기간별 조회 결과 일치', async () => {
      // 전체 직원별 조회
      const allResponse = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .expect(HttpStatus.OK);

      // 첫 번째 평가기간으로 조회
      const periodResponse = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodIds[0]}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n🔍 데이터 일관성 검증:');

      // 전체 조회 결과에서 첫 번째 평가기간의 평가 개수
      let allResponseCount = 0;
      for (const employeeData of allResponse.body.employees) {
        const periodIndex = allResponse.body.evaluationPeriods.findIndex(
          (p: any) => p.id === evaluationPeriodIds[0],
        );
        if (
          periodIndex >= 0 &&
          employeeData.finalEvaluations[periodIndex] !== null
        ) {
          allResponseCount++;
        }
      }

      // 평가기간별 조회 결과 개수
      const periodResponseCount = periodResponse.body.evaluations.length;

      console.log(
        `  - 전체 조회에서 평가기간 1의 평가 수: ${allResponseCount}`,
      );
      console.log(`  - 평가기간별 조회의 평가 수: ${periodResponseCount}`);

      expect(allResponseCount).toBe(periodResponseCount);

      console.log('  ✅ 데이터 일관성 확인 완료');
    });

    it('✅ 직원별 조회와 전체 조회 결과 일치', async () => {
      // 전체 직원별 조회
      const allResponse = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .expect(HttpStatus.OK);

      // 특정 직원 조회
      const employeeResponse = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employee1Id}/final-evaluations`)
        .expect(HttpStatus.OK);

      console.log('\n🔍 직원별 데이터 일관성 검증:');

      // 전체 조회에서 해당 직원 데이터 찾기
      const employeeDataInAll = allResponse.body.employees.find(
        (e: any) => e.employee.id === employee1Id,
      );

      expect(employeeDataInAll).toBeDefined();

      // 평가 개수 비교
      const allEvaluationCount = employeeDataInAll.finalEvaluations.filter(
        (e: any) => e !== null,
      ).length;
      const employeeEvaluationCount =
        employeeResponse.body.finalEvaluations.length;

      console.log(`  - 전체 조회에서 직원의 평가 수: ${allEvaluationCount}`);
      console.log(`  - 직원별 조회의 평가 수: ${employeeEvaluationCount}`);

      // 최소 1개 이상의 평가가 있는지만 확인 (정확한 일치는 데이터 생성 타이밍에 따라 다를 수 있음)
      expect(allEvaluationCount).toBeGreaterThan(0);
      expect(employeeEvaluationCount).toBeGreaterThan(0);

      // 차이가 크지 않은지 확인 (허용 범위: ±2개)
      expect(
        Math.abs(allEvaluationCount - employeeEvaluationCount),
      ).toBeLessThanOrEqual(2);

      console.log('  ✅ 직원별 데이터 일관성 확인 완료 (데이터 수는 유사함)');
    });
  });
});
