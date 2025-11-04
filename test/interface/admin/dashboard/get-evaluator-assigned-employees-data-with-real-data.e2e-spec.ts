import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /admin/dashboard/:evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data - 담당자의 피평가자 할당 정보 조회 테스트', () => {
  let testSuite: BaseE2ETest;

  // 테스트 데이터 저장용
  let evaluationPeriodId: string;
  let evaluatorId: string;
  let employeeId: string;
  let allEmployeeIds: string[] = [];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 테스트 데이터 생성', () => {
    it('✅ 평가기간 및 평가자-피평가자 관계 데이터 생성', async () => {
      console.log('\n📊 평가 데이터 생성 중...\n');

      const response = await testSuite
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

      expect(response.body.success).toBe(true);

      // 평가기간 ID 추출
      const period = response.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );
      evaluationPeriodId = period.generatedIds.periodIds[0];

      // 직원 ID 추출
      const phase1 = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      allEmployeeIds = phase1.generatedIds.employeeIds;

      console.log('✅ 평가기간 생성 완료');
      console.log(`  - 평가기간 ID: ${evaluationPeriodId.substring(0, 8)}...`);
      console.log(`  - 직원 수: ${allEmployeeIds.length}명`);

      // 평가자-피평가자 관계 조회
      const statusResponse = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .expect(HttpStatus.OK);

      console.log('\n🔍 평가 현황 데이터 확인 중...');
      console.log(`전체 직원 수: ${statusResponse.body.length}명`);

      // 1차 평가자가 있는 직원 찾기
      let foundRelation = false;
      for (const employeeData of statusResponse.body) {
        const primaryEvaluator = employeeData.downwardEvaluation?.primary;

        console.log(
          `\n  직원: ${employeeData.employee?.name} (${employeeData.employee?.id?.substring(0, 8)}...)`,
        );
        console.log(
          `  1차 평가자 데이터:`,
          JSON.stringify(primaryEvaluator, null, 2),
        );

        if (primaryEvaluator) {
          console.log(`  1차 평가자 ID: ${primaryEvaluator.evaluatorId}`);
          console.log(`  1차 평가자 정보:`, primaryEvaluator.evaluator);
          console.log(`  1차 평가 상태: ${primaryEvaluator.status}`);
          console.log(
            `  1차 평가 할당 WBS: ${primaryEvaluator.assignedWbsCount}`,
          );
        }

        if (
          primaryEvaluator?.evaluator &&
          primaryEvaluator.evaluator.id &&
          primaryEvaluator.evaluator.id !== 'N/A'
        ) {
          evaluatorId = primaryEvaluator.evaluator.id;
          employeeId = employeeData.employee.id;
          foundRelation = true;
          console.log('\n✅ 평가자-피평가자 관계 발견:');
          console.log(`  - 평가자 ID: ${evaluatorId.substring(0, 8)}...`);
          console.log(`  - 평가자명: ${primaryEvaluator.evaluator.name}`);
          console.log(`  - 피평가자 ID: ${employeeId.substring(0, 8)}...`);
          console.log(`  - 피평가자명: ${employeeData.employee.name}`);
          break;
        }
      }

      expect(foundRelation).toBe(true);
    });
  });

  describe('시나리오 2: 기본 조회 기능', () => {
    it('✅ 담당자의 피평가자 할당 정보 조회', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 담당자의 피평가자 할당 정보:');
      console.log(`  - 평가기간: ${response.body.evaluationPeriod.name}`);
      console.log(`  - 평가자: ${response.body.evaluator.name}`);
      console.log(`  - 피평가자: ${response.body.evaluatee.employee.name}`);
      console.log(
        `  - 프로젝트 수: ${response.body.evaluatee.projects.length}`,
      );

      // 총 WBS 수 계산
      const totalWbs = response.body.evaluatee.projects.reduce(
        (sum, project) => sum + project.wbsList.length,
        0,
      );
      console.log(`  - WBS 수: ${totalWbs}`);

      // 평가기간 정보 검증 (모든 필드)
      expect(response.body.evaluationPeriod).toMatchObject({
        id: evaluationPeriodId,
        name: expect.any(String),
        startDate: expect.any(String),
        status: expect.any(String),
        criteriaSettingEnabled: expect.any(Boolean),
        selfEvaluationSettingEnabled: expect.any(Boolean),
        finalEvaluationSettingEnabled: expect.any(Boolean),
        maxSelfEvaluationRate: expect.any(Number),
      });
      // endDate, description은 optional이므로 있으면 검증
      if (response.body.evaluationPeriod.endDate) {
        expect(response.body.evaluationPeriod.endDate).toEqual(
          expect.any(String),
        );
      }
      if (response.body.evaluationPeriod.description) {
        expect(response.body.evaluationPeriod.description).toEqual(
          expect.any(String),
        );
      }

      // 평가자 정보 검증 (모든 필드)
      expect(response.body.evaluator).toMatchObject({
        id: evaluatorId,
        name: expect.any(String),
        employeeNumber: expect.any(String),
        email: expect.any(String),
        status: expect.any(String),
      });
      // phoneNumber, departmentId는 optional이므로 있으면 검증
      expect(response.body.evaluator).toHaveProperty('phoneNumber');
      expect(response.body.evaluator).toHaveProperty('departmentId');

      // 피평가자 정보 검증 (모든 필드)
      expect(response.body.evaluatee.employee).toMatchObject({
        id: employeeId,
        name: expect.any(String),
        employeeNumber: expect.any(String),
        email: expect.any(String),
        status: expect.any(String),
      });
      // phoneNumber, departmentId는 optional이므로 있으면 검증
      expect(response.body.evaluatee.employee).toHaveProperty('phoneNumber');
      expect(response.body.evaluatee.employee).toHaveProperty('departmentId');

      // 프로젝트 목록 검증
      expect(response.body.evaluatee.projects).toBeInstanceOf(Array);
      expect(response.body.evaluatee.projects.length).toBeGreaterThan(0);

      for (const project of response.body.evaluatee.projects) {
        expect(project).toMatchObject({
          projectId: expect.any(String),
          projectName: expect.any(String),
          projectCode: expect.any(String),
          assignedAt: expect.any(String),
          projectManager: {
            id: expect.any(String),
            name: expect.any(String),
          },
          wbsList: expect.any(Array),
        });

        console.log(`\n  📁 프로젝트: ${project.projectName}`);
        console.log(`    - WBS 수: ${project.wbsList.length}`);

        // WBS 목록 검증
        for (const wbs of project.wbsList) {
          expect(wbs).toMatchObject({
            wbsId: expect.any(String),
            wbsName: expect.any(String),
            wbsCode: expect.any(String),
            weight: expect.any(Number),
            assignedAt: expect.any(String),
            criteria: expect.any(Array),
          });

          console.log(`      - ${wbs.wbsName} (${wbs.wbsCode})`);

          // 성과 정보가 있으면 검증
          if (wbs.performance) {
            expect(wbs.performance).toMatchObject({
              performanceResult: expect.any(String),
              isCompleted: expect.any(Boolean),
              completedAt: expect.any(String),
            });
          }

          // 자기평가 정보가 있으면 검증
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation).toMatchObject({
              selfEvaluationId: expect.any(String),
              evaluationContent: expect.any(String),
              score: expect.any(Number),
              isCompleted: expect.any(Boolean),
              isEditable: expect.any(Boolean),
              submittedAt: expect.any(String),
              submittedToEvaluator: expect.any(Boolean),
              submittedToManager: expect.any(Boolean),
            });
            // 제출 상태에 따라 submittedToEvaluatorAt, submittedToManagerAt 검증
            if (wbs.selfEvaluation.submittedToEvaluator) {
              expect(wbs.selfEvaluation.submittedToEvaluatorAt).toBeDefined();
            }
            if (wbs.selfEvaluation.submittedToManager) {
              expect(wbs.selfEvaluation.submittedToManagerAt).toBeDefined();
            }
          }

          // 1차 하향평가 정보가 있으면 검증 (모든 필드)
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation).toMatchObject({
              evaluatorName: expect.any(String),
              score: expect.any(Number),
              isCompleted: expect.any(Boolean),
              isEditable: expect.any(Boolean),
            });
            // submittedAt은 isCompleted가 true일 때만 있음
            if (wbs.primaryDownwardEvaluation.isCompleted) {
              expect(wbs.primaryDownwardEvaluation).toHaveProperty(
                'submittedAt',
              );
            }
          }

          // 2차 하향평가 정보가 있으면 검증 (모든 필드)
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation).toMatchObject({
              evaluatorName: expect.any(String),
              score: expect.any(Number),
              isCompleted: expect.any(Boolean),
              isEditable: expect.any(Boolean),
            });
            // submittedAt은 isCompleted가 true일 때만 있음
            if (wbs.secondaryDownwardEvaluation.isCompleted) {
              expect(wbs.secondaryDownwardEvaluation).toHaveProperty(
                'submittedAt',
              );
            }
          }
        }
      }

      // Summary 정보 검증 (모든 필드)
      expect(response.body.evaluatee.summary).toMatchObject({
        totalProjects: expect.any(Number),
        totalWbs: expect.any(Number),
        completedPerformances: expect.any(Number),
        completedSelfEvaluations: expect.any(Number),
      });

      // 자기평가 점수/등급 및 제출 상태 (완료된 경우만 있음)
      if (response.body.evaluatee.summary.selfEvaluation) {
        expect(response.body.evaluatee.summary.selfEvaluation).toMatchObject({
          totalScore: expect.any(Number),
          grade: expect.any(String),
          totalSelfEvaluations: expect.any(Number),
          submittedToEvaluatorCount: expect.any(Number),
          submittedToManagerCount: expect.any(Number),
          isSubmittedToEvaluator: expect.any(Boolean),
          isSubmittedToManager: expect.any(Boolean),
        });
        console.log(
          `\n  📊 자기평가: ${response.body.evaluatee.summary.selfEvaluation.totalScore}점 (${response.body.evaluatee.summary.selfEvaluation.grade}등급)`,
        );
        console.log(
          `  제출 상태: 1차 평가자에게 ${response.body.evaluatee.summary.selfEvaluation.submittedToEvaluatorCount}/${response.body.evaluatee.summary.selfEvaluation.totalSelfEvaluations} 제출`,
        );
        console.log(
          `  관리자에게 ${response.body.evaluatee.summary.selfEvaluation.submittedToManagerCount}/${response.body.evaluatee.summary.selfEvaluation.totalSelfEvaluations} 제출`,
        );
      }

      // 1차 하향평가 점수/등급 (완료된 경우만 있음)
      if (response.body.evaluatee.summary.primaryDownwardEvaluation) {
        expect(
          response.body.evaluatee.summary.primaryDownwardEvaluation,
        ).toMatchObject({
          totalScore: expect.any(Number),
          grade: expect.any(String),
        });
        console.log(
          `  📊 1차 하향평가: ${response.body.evaluatee.summary.primaryDownwardEvaluation.totalScore}점 (${response.body.evaluatee.summary.primaryDownwardEvaluation.grade}등급)`,
        );
      }

      // 2차 하향평가 점수/등급 (완료된 경우만 있음)
      if (response.body.evaluatee.summary.secondaryDownwardEvaluation) {
        expect(
          response.body.evaluatee.summary.secondaryDownwardEvaluation,
        ).toMatchObject({
          totalScore: expect.any(Number),
          grade: expect.any(String),
        });
        console.log(
          `  📊 2차 하향평가: ${response.body.evaluatee.summary.secondaryDownwardEvaluation.totalScore}점 (${response.body.evaluatee.summary.secondaryDownwardEvaluation.grade}등급)`,
        );
      }

      console.log('\n✅ 응답 구조 검증 완료 (모든 필드 검증됨)');
    });

    it('✅ WBS별 평가기준 확인', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 WBS별 평가기준 확인:');

      let totalCriteria = 0;
      for (const project of response.body.evaluatee.projects) {
        for (const wbs of project.wbsList) {
          expect(wbs.criteria).toBeInstanceOf(Array);

          if (wbs.criteria.length > 0) {
            console.log(`  - ${wbs.wbsName}: ${wbs.criteria.length}개 기준`);
            totalCriteria += wbs.criteria.length;

            for (const criterion of wbs.criteria) {
              expect(criterion).toMatchObject({
                criterionId: expect.any(String),
                criteria: expect.any(String),
              });
            }
          }
        }
      }

      console.log(`\n  총 평가기준: ${totalCriteria}개`);
      console.log('✅ 평가기준 검증 완료');
    });

    it('✅ WBS별 가중치 확인', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 WBS별 가중치 확인:');

      let totalWeight = 0;
      const weights: number[] = [];

      for (const project of response.body.evaluatee.projects) {
        console.log(`\n  프로젝트: ${project.projectName}`);
        for (const wbs of project.wbsList) {
          expect(wbs.weight).toBeGreaterThanOrEqual(0);
          expect(wbs.weight).toBeLessThanOrEqual(100);

          console.log(`    - ${wbs.wbsName}: ${wbs.weight}%`);
          totalWeight += wbs.weight;
          weights.push(wbs.weight);
        }
      }

      console.log(`\n  총 가중치: ${totalWeight}%`);
      console.log(
        `  평균 가중치: ${(totalWeight / weights.length).toFixed(2)}%`,
      );
      console.log('✅ 가중치 검증 완료');
    });

    it('✅ 성과 및 자기평가 완료 현황 확인', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 완료 현황:');

      // WBS 수와 완료 현황 계산
      let totalWbs = 0;
      let completedPerformances = 0;
      let completedSelfEvaluations = 0;

      for (const project of response.body.evaluatee.projects) {
        for (const wbs of project.wbsList) {
          totalWbs++;
          if (wbs.performance?.isCompleted) {
            completedPerformances++;
          }
          if (wbs.selfEvaluation?.isCompleted) {
            completedSelfEvaluations++;
          }
        }
      }

      console.log(`  - 총 WBS 수: ${totalWbs}`);
      console.log(`  - 완료된 성과: ${completedPerformances}/${totalWbs}`);
      console.log(
        `  - 완료된 자기평가: ${completedSelfEvaluations}/${totalWbs}`,
      );

      const performanceRate = (completedPerformances / totalWbs) * 100;
      const selfEvalRate = (completedSelfEvaluations / totalWbs) * 100;

      console.log(`  - 성과 완료율: ${performanceRate.toFixed(1)}%`);
      console.log(`  - 자기평가 완료율: ${selfEvalRate.toFixed(1)}%`);

      // full 시나리오이므로 100% 완료되어야 함
      expect(completedPerformances).toBe(totalWbs);
      expect(completedSelfEvaluations).toBe(totalWbs);

      console.log('✅ 완료 현황 검증 완료 (100% 완료)');
    });

    it('✅ 하향평가 정보 확인', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 하향평가 정보:');

      let primaryCount = 0;
      let secondaryCount = 0;

      for (const project of response.body.evaluatee.projects) {
        for (const wbs of project.wbsList) {
          if (wbs.primaryDownwardEvaluation) {
            primaryCount++;
            console.log(
              `  1차 평가 - ${wbs.wbsName}: ${wbs.primaryDownwardEvaluation.score}점 (${wbs.primaryDownwardEvaluation.evaluatorName})`,
            );
          }
          if (wbs.secondaryDownwardEvaluation) {
            secondaryCount++;
            console.log(
              `  2차 평가 - ${wbs.wbsName}: ${wbs.secondaryDownwardEvaluation.score}점 (${wbs.secondaryDownwardEvaluation.evaluatorName})`,
            );
          }
        }
      }

      console.log(`\n  - 1차 하향평가 완료: ${primaryCount}개`);
      console.log(`  - 2차 하향평가 완료: ${secondaryCount}개`);

      // full 시나리오이므로 하향평가도 있어야 함
      expect(primaryCount).toBeGreaterThan(0);

      console.log('✅ 하향평가 정보 검증 완료');
    });
  });

  describe('시나리오 3: 에러 케이스', () => {
    it('❌ 존재하지 않는 평가기간 ID로 조회 시 404 에러', async () => {
      const invalidPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${invalidPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n❌ 존재하지 않는 평가기간:');
      console.log(`  - 상태 코드: ${response.status}`);
      console.log(`  - 에러 메시지: ${response.body.message}`);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });

    it('❌ 존재하지 않는 평가자 ID로 조회 시 404 에러', async () => {
      const invalidEvaluatorId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${invalidEvaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n❌ 존재하지 않는 평가자:');
      console.log(`  - 상태 코드: ${response.status}`);
      console.log(`  - 에러 메시지: ${response.body.message}`);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });

    it('❌ 존재하지 않는 피평가자 ID로 조회 시 404 에러', async () => {
      const invalidEmployeeId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${invalidEmployeeId}/assigned-data`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n❌ 존재하지 않는 피평가자:');
      console.log(`  - 상태 코드: ${response.status}`);
      console.log(`  - 에러 메시지: ${response.body.message}`);

      expect(response.body.message).toContain('평가기간에 등록되지 않은 직원');
    });

    it('❌ 잘못된 UUID 형식 (평가기간) - 400 에러', async () => {
      await testSuite
        .request()
        .get(
          `/admin/dashboard/invalid-uuid/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 UUID 형식 (평가기간): 400 Bad Request');
    });

    it('❌ 잘못된 UUID 형식 (평가자) - 400 에러', async () => {
      await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/invalid-uuid/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 UUID 형식 (평가자): 400 Bad Request');
    });

    it('❌ 잘못된 UUID 형식 (피평가자) - 400 에러', async () => {
      await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/invalid-uuid/assigned-data`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n❌ 잘못된 UUID 형식 (피평가자): 400 Bad Request');
    });

    it('❌ 평가자가 담당하지 않는 피평가자 조회 시 404 에러', async () => {
      // 실제로 평가자와 관계가 없는 직원 찾기
      // 먼저 평가자가 담당하는 모든 피평가자 조회
      const evaluatorMappingsResponse = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
        )
        .expect(HttpStatus.OK);

      const assignedEmployeeIds = evaluatorMappingsResponse.body.map(
        (emp: any) => emp.employeeId,
      );

      console.log('\n🔍 평가자가 담당하는 피평가자들:');
      assignedEmployeeIds.forEach((id: string) => {
        console.log(`  - ${id.substring(0, 8)}...`);
      });

      // 평가자가 담당하지 않는 직원 찾기
      const otherEmployeeId = allEmployeeIds.find(
        (id) => !assignedEmployeeIds.includes(id) && id !== evaluatorId,
      );

      console.log(
        `\n🔍 선택된 다른 직원: ${otherEmployeeId?.substring(0, 8)}...`,
      );

      if (otherEmployeeId) {
        const response = await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${otherEmployeeId}/assigned-data`,
          )
          .expect(HttpStatus.NOT_FOUND);

        console.log('\n❌ 담당하지 않는 피평가자:');
        console.log(`  - 상태 코드: ${response.status}`);
        console.log(`  - 에러 메시지: ${response.body.message}`);

        expect(response.body.message).toContain(
          '평가자가 해당 피평가자를 담당하지 않습니다',
        );
      } else {
        console.log('\n⚠️ 평가자가 담당하지 않는 직원을 찾을 수 없습니다.');
        console.log('모든 직원이 평가자의 담당 대상이거나, 평가자 본인입니다.');
      }
    });
  });

  describe('시나리오 4: 데이터 일관성 검증', () => {
    it('✅ 동일 직원의 일반 조회와 평가자별 조회 데이터 비교', async () => {
      // 일반 직원 할당 정보 조회
      const generalResponse = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      // 평가자별 조회
      const evaluatorResponse = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 데이터 일관성 비교:');

      // 일반 조회 통계 계산
      const generalProjects = generalResponse.body.projects?.length || 0;
      const generalWbs =
        generalResponse.body.projects?.reduce(
          (sum, p) => sum + (p.wbsList?.length || 0),
          0,
        ) || 0;

      // 평가자 조회 통계 계산
      const evaluatorProjects =
        evaluatorResponse.body.evaluatee.projects?.length || 0;
      const evaluatorWbs =
        evaluatorResponse.body.evaluatee.projects?.reduce(
          (sum, p) => sum + (p.wbsList?.length || 0),
          0,
        ) || 0;

      console.log(
        `  일반 조회 - 프로젝트: ${generalProjects}, WBS: ${generalWbs}`,
      );
      console.log(
        `  평가자 조회 - 프로젝트: ${evaluatorProjects}, WBS: ${evaluatorWbs}`,
      );

      // 피평가자 정보는 동일해야 함
      expect(generalResponse.body.employee.id).toBe(
        evaluatorResponse.body.evaluatee.employee.id,
      );
      expect(generalResponse.body.employee.name).toBe(
        evaluatorResponse.body.evaluatee.employee.name,
      );

      // 평가기간 정보는 동일해야 함
      expect(generalResponse.body.evaluationPeriod.id).toBe(
        evaluatorResponse.body.evaluationPeriod.id,
      );

      console.log('✅ 데이터 일관성 확인 완료');
    });

    it('✅ 프로젝트 매니저 정보 검증', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      console.log('\n📊 프로젝트 매니저 정보:');

      for (const project of response.body.evaluatee.projects) {
        expect(project.projectManager).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
        });

        console.log(
          `  - ${project.projectName}: PM ${project.projectManager.name}`,
        );
      }

      console.log('✅ 프로젝트 매니저 정보 검증 완료');
    });
  });

  describe('시나리오 5: 성능 테스트', () => {
    it('✅ 응답 속도 측정', async () => {
      const iterations = 3;
      const times: number[] = [];

      console.log('\n📊 응답 속도 측정:');

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
          )
          .expect(HttpStatus.OK);

        const duration = Date.now() - start;
        times.push(duration);
        console.log(`  - 시도 ${i + 1}: ${duration}ms`);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`  - 평균 응답 시간: ${avgTime.toFixed(1)}ms`);

      // 성능 기준: 평균 500ms 이내
      expect(avgTime).toBeLessThan(500);

      console.log('✅ 성능 테스트 통과');
    });
  });
});
