/**
 * 사용자 할당 정보 조회 - 점수/등급 계산 검증 E2E 테스트
 *
 * 이 테스트는 평가 완료 상태에 따라 점수와 등급이 올바르게 계산되는지 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 자기평가만 100% 완료 → 자기평가 점수/등급만 계산됨
 * 2. 자기평가 + 1차 하향평가 100% 완료 → 두 평가 모두 점수/등급 계산됨
 * 3. 모든 평가 100% 완료 → 자기평가, 1차, 2차 하향평가 모두 점수/등급 계산됨
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data - 점수/등급 계산 검증', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 자기평가만 100% 완료', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 자기평가만 100% 완료 ===');

      // 기존 데이터 정리
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

      // 시드 데이터 생성: 자기평가만 100% 완료
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 5,
            projectCount: 2,
            wbsPerProject: 3,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            selfEvaluationProgress: {
              completed: 1.0, // 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 0.0, // 0% 완료
              notStarted: 1.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 0.0, // 0% 완료
              notStarted: 1.0,
              inProgress: 0.0,
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
        .expect(201);

      console.log('시드 데이터 생성 완료');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // WBS가 할당된 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('e')
        .innerJoin('evaluation_wbs_assignment', 'a', 'a.employeeId = e.id')
        .where('e.status = :status', { status: '재직중' })
        .andWhere('a.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('a.deletedAt IS NULL')
        .groupBy('e.id')
        .select(['e.id', 'e.name', 'e.employeeNumber'])
        .getRawMany();

      employeeId = employees[0].e_id;
      console.log(
        `테스트 대상: ${employees[0].e_name} (${employees[0].e_employeeNumber})`,
      );
    });

    it('자기평가 점수와 등급이 계산되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { summary } = response.body;

      console.log('\n📊 Summary 결과:');
      console.log('총 WBS 수:', summary.totalWbs);
      console.log('완료된 자기평가 수:', summary.completedSelfEvaluations);
      console.log('\n자기평가:');
      console.log('  점수:', summary.selfEvaluation.totalScore);
      console.log('  등급:', summary.selfEvaluation.grade);
      console.log('\n1차 하향평가:');
      console.log('  점수:', summary.primaryDownwardEvaluation.totalScore);
      console.log('  등급:', summary.primaryDownwardEvaluation.grade);
      console.log('\n2차 하향평가:');
      console.log('  점수:', summary.secondaryDownwardEvaluation.totalScore);
      console.log('  등급:', summary.secondaryDownwardEvaluation.grade);

      // 자기평가가 완료되었으므로 점수/등급이 있어야 함
      expect(summary.selfEvaluation.totalScore).not.toBeNull();
      expect(summary.selfEvaluation.grade).not.toBeNull();
      expect(typeof summary.selfEvaluation.totalScore).toBe('number');
      expect(typeof summary.selfEvaluation.grade).toBe('string');
      expect(summary.selfEvaluation.totalScore).toBeGreaterThanOrEqual(0);
      expect(summary.selfEvaluation.totalScore).toBeLessThanOrEqual(100);

      // 하향평가는 미완료이므로 null이어야 함
      expect(summary.primaryDownwardEvaluation.totalScore).toBeNull();
      expect(summary.primaryDownwardEvaluation.grade).toBeNull();
      expect(summary.secondaryDownwardEvaluation.totalScore).toBeNull();
      expect(summary.secondaryDownwardEvaluation.grade).toBeNull();

      console.log('\n✅ 자기평가만 점수/등급 계산됨 (예상대로)');
    });

    it('프로젝트 매니저(PM) 정보가 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { projects } = response.body;

      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);

      // 프로젝트들의 PM 정보 확인
      let projectsWithPM = 0;
      let projectsWithoutPM = 0;

      for (const project of projects) {
        expect(project).toHaveProperty('projectManager');

        if (project.projectManager) {
          expect(project.projectManager).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
          });
          projectsWithPM++;
        } else {
          expect(project.projectManager).toBeNull();
          projectsWithoutPM++;
        }
      }

      console.log('\n=== 프로젝트 매니저 정보 (시나리오 1) ===');
      console.log('총 프로젝트 수:', projects.length);
      console.log('PM이 할당된 프로젝트:', projectsWithPM);
      console.log('PM이 없는 프로젝트:', projectsWithoutPM);

      // PM 정보가 있는 경우, 구조가 올바른지 이미 검증됨
      // 확률적으로 PM이 없을 수도 있음
    });
  });

  describe('시나리오 2: 자기평가 + 1차 하향평가 100% 완료', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 자기평가 + 1차 하향평가 100% 완료 ===');

      // 기존 데이터 정리
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

      // 시드 데이터 생성: 자기평가 + 1차 하향평가 100% 완료
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 5,
            projectCount: 2,
            wbsPerProject: 3,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            selfEvaluationProgress: {
              completed: 1.0, // 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 1.0, // 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 0.0, // 0% 완료
              notStarted: 1.0,
              inProgress: 0.0,
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
        .expect(201);

      console.log('시드 데이터 생성 완료');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // WBS가 할당된 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('e')
        .innerJoin('evaluation_wbs_assignment', 'a', 'a.employeeId = e.id')
        .where('e.status = :status', { status: '재직중' })
        .andWhere('a.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('a.deletedAt IS NULL')
        .groupBy('e.id')
        .select(['e.id', 'e.name', 'e.employeeNumber'])
        .getRawMany();

      employeeId = employees[0].e_id;
      console.log(
        `테스트 대상: ${employees[0].e_name} (${employees[0].e_employeeNumber})`,
      );
    });

    it('자기평가와 1차 하향평가 점수/등급이 모두 계산되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { summary } = response.body;

      console.log('\n📊 Summary 결과:');
      console.log('총 WBS 수:', summary.totalWbs);
      console.log('완료된 자기평가 수:', summary.completedSelfEvaluations);
      console.log('\n자기평가:');
      console.log('  점수:', summary.selfEvaluation.totalScore);
      console.log('  등급:', summary.selfEvaluation.grade);
      console.log('\n1차 하향평가:');
      console.log('  점수:', summary.primaryDownwardEvaluation.totalScore);
      console.log('  등급:', summary.primaryDownwardEvaluation.grade);
      console.log('\n2차 하향평가:');
      console.log('  점수:', summary.secondaryDownwardEvaluation.totalScore);
      console.log('  등급:', summary.secondaryDownwardEvaluation.grade);

      // 자기평가 점수/등급 검증
      expect(summary.selfEvaluation.totalScore).not.toBeNull();
      expect(summary.selfEvaluation.grade).not.toBeNull();
      expect(typeof summary.selfEvaluation.totalScore).toBe('number');
      expect(typeof summary.selfEvaluation.grade).toBe('string');
      expect(summary.selfEvaluation.totalScore).toBeGreaterThanOrEqual(0);
      expect(summary.selfEvaluation.totalScore).toBeLessThanOrEqual(100);

      // 1차 하향평가 점수/등급 검증
      expect(summary.primaryDownwardEvaluation.totalScore).not.toBeNull();
      expect(summary.primaryDownwardEvaluation.grade).not.toBeNull();
      expect(typeof summary.primaryDownwardEvaluation.totalScore).toBe(
        'number',
      );
      expect(typeof summary.primaryDownwardEvaluation.grade).toBe('string');
      expect(
        summary.primaryDownwardEvaluation.totalScore,
      ).toBeGreaterThanOrEqual(0);
      expect(summary.primaryDownwardEvaluation.totalScore).toBeLessThanOrEqual(
        100,
      );

      // 2차 하향평가는 미완료이므로 null
      expect(summary.secondaryDownwardEvaluation.totalScore).toBeNull();
      expect(summary.secondaryDownwardEvaluation.grade).toBeNull();

      console.log('\n✅ 자기평가 + 1차 하향평가 점수/등급 계산됨 (예상대로)');
    });

    it('프로젝트 매니저(PM) 정보가 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { projects } = response.body;

      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);

      // 프로젝트들의 PM 정보 확인
      let projectsWithPM = 0;
      let projectsWithoutPM = 0;

      for (const project of projects) {
        expect(project).toHaveProperty('projectManager');

        if (project.projectManager) {
          expect(project.projectManager).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
          });
          projectsWithPM++;
        } else {
          expect(project.projectManager).toBeNull();
          projectsWithoutPM++;
        }
      }

      console.log('\n=== 프로젝트 매니저 정보 (시나리오 2) ===');
      console.log('총 프로젝트 수:', projects.length);
      console.log('PM이 할당된 프로젝트:', projectsWithPM);
      console.log('PM이 없는 프로젝트:', projectsWithoutPM);

      // PM 정보가 있는 경우, 구조가 올바른지 이미 검증됨
      // 확률적으로 PM이 없을 수도 있음
    });
  });

  describe('시나리오 3: 모든 평가 100% 완료', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 모든 평가 100% 완료 ===');

      // 기존 데이터 정리
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

      // 시드 데이터 생성: 모든 평가 100% 완료
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 5,
            projectCount: 2,
            wbsPerProject: 3,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // 모든 직원에게 1차, 2차 평가자 할당
            evaluationLineMappingTypes: {
              primaryOnly: 0.0,
              primaryAndSecondary: 1.0, // 모든 직원에게 1,2차 평가자 할당
              withAdditional: 0.0,
            },
            selfEvaluationProgress: {
              completed: 1.0, // 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 1.0, // 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 1.0, // 100% 완료
              notStarted: 0.0,
              inProgress: 0.0,
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
        .expect(201);

      console.log('시드 데이터 생성 완료');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // WBS가 할당된 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('e')
        .innerJoin('evaluation_wbs_assignment', 'a', 'a.employeeId = e.id')
        .where('e.status = :status', { status: '재직중' })
        .andWhere('a.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('a.deletedAt IS NULL')
        .groupBy('e.id')
        .select(['e.id', 'e.name', 'e.employeeNumber'])
        .getRawMany();

      employeeId = employees[0].e_id;
      console.log(
        `테스트 대상: ${employees[0].e_name} (${employees[0].e_employeeNumber})`,
      );
    });

    it('자기평가, 1차, 2차 하향평가 점수/등급이 모두 계산되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { summary } = response.body;

      console.log('\n📊 Summary 결과:');
      console.log('총 WBS 수:', summary.totalWbs);
      console.log('완료된 자기평가 수:', summary.completedSelfEvaluations);
      console.log('\n자기평가:');
      console.log('  점수:', summary.selfEvaluation.totalScore);
      console.log('  등급:', summary.selfEvaluation.grade);
      console.log('\n1차 하향평가:');
      console.log('  점수:', summary.primaryDownwardEvaluation.totalScore);
      console.log('  등급:', summary.primaryDownwardEvaluation.grade);
      console.log('\n2차 하향평가:');
      console.log('  점수:', summary.secondaryDownwardEvaluation.totalScore);
      console.log('  등급:', summary.secondaryDownwardEvaluation.grade);

      // 자기평가 점수/등급 검증
      expect(summary.selfEvaluation.totalScore).not.toBeNull();
      expect(summary.selfEvaluation.grade).not.toBeNull();
      expect(typeof summary.selfEvaluation.totalScore).toBe('number');
      expect(typeof summary.selfEvaluation.grade).toBe('string');
      expect(summary.selfEvaluation.totalScore).toBeGreaterThanOrEqual(0);
      expect(summary.selfEvaluation.totalScore).toBeLessThanOrEqual(100);

      // 1차 하향평가 점수/등급 검증
      expect(summary.primaryDownwardEvaluation.totalScore).not.toBeNull();
      expect(summary.primaryDownwardEvaluation.grade).not.toBeNull();
      expect(typeof summary.primaryDownwardEvaluation.totalScore).toBe(
        'number',
      );
      expect(typeof summary.primaryDownwardEvaluation.grade).toBe('string');
      expect(
        summary.primaryDownwardEvaluation.totalScore,
      ).toBeGreaterThanOrEqual(0);
      expect(summary.primaryDownwardEvaluation.totalScore).toBeLessThanOrEqual(
        100,
      );

      // 2차 하향평가 점수/등급 검증
      expect(summary.secondaryDownwardEvaluation.totalScore).not.toBeNull();
      expect(summary.secondaryDownwardEvaluation.grade).not.toBeNull();
      expect(typeof summary.secondaryDownwardEvaluation.totalScore).toBe(
        'number',
      );
      expect(typeof summary.secondaryDownwardEvaluation.grade).toBe('string');
      expect(
        summary.secondaryDownwardEvaluation.totalScore,
      ).toBeGreaterThanOrEqual(0);
      expect(
        summary.secondaryDownwardEvaluation.totalScore,
      ).toBeLessThanOrEqual(100);

      console.log('\n✅ 모든 평가의 점수/등급 계산됨 (예상대로)');
    });

    it('점수 범위와 등급 매핑이 올바른지 확인한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { summary } = response.body;

      // 등급 범위 검증 (S, A, B, C, D, F)
      const validGrades = ['S', 'A', 'B', 'C', 'D', 'F'];

      expect(validGrades).toContain(summary.selfEvaluation.grade);
      expect(validGrades).toContain(summary.primaryDownwardEvaluation.grade);
      expect(validGrades).toContain(summary.secondaryDownwardEvaluation.grade);

      console.log('\n📋 등급 매핑 검증:');
      console.log(
        `  자기평가: ${summary.selfEvaluation.totalScore} → ${summary.selfEvaluation.grade}`,
      );
      console.log(
        `  1차 하향평가: ${summary.primaryDownwardEvaluation.totalScore} → ${summary.primaryDownwardEvaluation.grade}`,
      );
      console.log(
        `  2차 하향평가: ${summary.secondaryDownwardEvaluation.totalScore} → ${summary.secondaryDownwardEvaluation.grade}`,
      );
      console.log('\n✅ 모든 등급이 유효한 범위 내에 있음');
    });

    it('프로젝트 매니저(PM) 정보가 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { projects } = response.body;

      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);

      // 프로젝트들의 PM 정보 확인
      let projectsWithPM = 0;
      let projectsWithoutPM = 0;

      for (const project of projects) {
        expect(project).toHaveProperty('projectManager');

        if (project.projectManager) {
          expect(project.projectManager).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
          });
          projectsWithPM++;
        } else {
          expect(project.projectManager).toBeNull();
          projectsWithoutPM++;
        }
      }

      console.log('\n=== 프로젝트 매니저 정보 (시나리오 3) ===');
      console.log('총 프로젝트 수:', projects.length);
      console.log('PM이 할당된 프로젝트:', projectsWithPM);
      console.log('PM이 없는 프로젝트:', projectsWithoutPM);

      // PM 정보가 있는 경우, 구조가 올바른지 이미 검증됨
      // 확률적으로 PM이 없을 수도 있음
    });
  });
});
