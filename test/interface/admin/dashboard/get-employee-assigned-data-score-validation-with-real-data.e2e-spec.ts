/**
 * 사용자 할당 정보 조회 - 실제 데이터 기반 점수/등급 계산 검증 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여 평가 완료 상태에 따라
 * 점수와 등급이 올바르게 계산되는지 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 자기평가만 100% 완료 → 자기평가 점수/등급만 계산됨
 * 2. 자기평가 + 1차 하향평가 100% 완료 → 두 평가 모두 점수/등급 계산됨
 * 3. 모든 평가 100% 완료 → 자기평가, 1차, 2차 하향평가 모두 점수/등급 계산됨
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data - 실제 데이터 기반 점수/등급 계산 검증', () => {
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

  describe('시나리오 1: 자기평가만 100% 완료 (실제 데이터 기반)', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 1: 자기평가만 100% 완료 (실제 데이터 기반) ===',
      );

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

      // 실제 데이터 기반 시드 데이터 생성: 자기평가만 100% 완료
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: true, // 기존 평가 데이터 완전 삭제 후 재생성
          projectCount: 2,
          wbsPerProject: 3,
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

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

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

    it('자기평가가 완료되어 수정 불가 상태여야 한다', async () => {
      // EvaluationPeriodEmployeeMapping 조회
      const mapping = await dataSource
        .getRepository('EvaluationPeriodEmployeeMapping')
        .createQueryBuilder('mapping')
        .where('mapping.evaluationPeriodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.deletedAt IS NULL')
        .getOne();

      expect(mapping).not.toBeNull();
      expect(mapping).toBeDefined();

      console.log('\n📝 평가 수정 가능 상태:');
      console.log('  자기평가:', mapping!.isSelfEvaluationEditable);
      console.log('  1차평가:', mapping!.isPrimaryEvaluationEditable);
      console.log('  2차평가:', mapping!.isSecondaryEvaluationEditable);

      // 자기평가만 완료되었으므로 자기평가만 수정 불가
      expect(mapping!.isSelfEvaluationEditable).toBe(false);
      // 하향평가는 미완료이므로 수정 가능
      expect(mapping!.isPrimaryEvaluationEditable).toBe(true);
      expect(mapping!.isSecondaryEvaluationEditable).toBe(true);

      console.log('\n✅ 자기평가만 수정 불가 상태로 설정됨 (예상대로)');
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

      console.log('\n=== 프로젝트 매니저 정보 (시나리오 1 - 실제 데이터) ===');
      console.log('총 프로젝트 수:', projects.length);
      console.log('PM이 할당된 프로젝트:', projectsWithPM);
      console.log('PM이 없는 프로젝트:', projectsWithoutPM);

      // PM 정보가 있는 경우, 구조가 올바른지 이미 검증됨
      // 확률적으로 PM이 없을 수도 있음
    });
  });

  describe('시나리오 2: 자기평가 + 1차 하향평가 100% 완료 (실제 데이터 기반)', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 2: 자기평가 + 1차 하향평가 100% 완료 (실제 데이터 기반) ===',
      );

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

      // 실제 데이터 기반 시드 데이터 생성: 자기평가 + 1차 하향평가 100% 완료
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: true, // 기존 평가 데이터 완전 삭제 후 재생성
          projectCount: 2,
          wbsPerProject: 3,
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

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

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

    it('자기평가와 1차평가가 완료되어 수정 불가 상태여야 한다', async () => {
      // EvaluationPeriodEmployeeMapping 조회
      const mapping = await dataSource
        .getRepository('EvaluationPeriodEmployeeMapping')
        .createQueryBuilder('mapping')
        .where('mapping.evaluationPeriodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.deletedAt IS NULL')
        .getOne();

      expect(mapping).not.toBeNull();
      expect(mapping).toBeDefined();

      console.log('\n📝 평가 수정 가능 상태:');
      console.log('  자기평가:', mapping!.isSelfEvaluationEditable);
      console.log('  1차평가:', mapping!.isPrimaryEvaluationEditable);
      console.log('  2차평가:', mapping!.isSecondaryEvaluationEditable);

      // 자기평가와 1차평가가 완료되었으므로 둘 다 수정 불가
      expect(mapping!.isSelfEvaluationEditable).toBe(false);
      expect(mapping!.isPrimaryEvaluationEditable).toBe(false);
      // 2차평가는 미완료이므로 수정 가능
      expect(mapping!.isSecondaryEvaluationEditable).toBe(true);

      console.log(
        '\n✅ 자기평가와 1차평가가 수정 불가 상태로 설정됨 (예상대로)',
      );
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

      console.log('\n=== 프로젝트 매니저 정보 (시나리오 2 - 실제 데이터) ===');
      console.log('총 프로젝트 수:', projects.length);
      console.log('PM이 할당된 프로젝트:', projectsWithPM);
      console.log('PM이 없는 프로젝트:', projectsWithoutPM);

      // PM 정보가 있는 경우, 구조가 올바른지 이미 검증됨
      // 확률적으로 PM이 없을 수도 있음
    });
  });

  describe('시나리오 3: 모든 평가 100% 완료 (실제 데이터 기반)', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 3: 모든 평가 100% 완료 (실제 데이터 기반) ===',
      );

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

      // 실제 데이터 기반 시드 데이터 생성: 모든 평가 100% 완료
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: true, // 기존 평가 데이터 완전 삭제 후 재생성
          projectCount: 2,
          wbsPerProject: 3,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // 평가 라인 매핑 설정: 모든 직원에게 1차, 2차 평가자를 모두 할당
            evaluationLineMappingTypes: {
              primaryOnly: 0.0, // 1차만: 0%
              primaryAndSecondary: 1.0, // 1,2차 모두: 100%
              withAdditional: 0.0, // 추가 평가자: 0%
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

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

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

    it('모든 평가가 완료되어 모두 수정 불가 상태여야 한다', async () => {
      // EvaluationPeriodEmployeeMapping 조회
      const mapping = await dataSource
        .getRepository('EvaluationPeriodEmployeeMapping')
        .createQueryBuilder('mapping')
        .where('mapping.evaluationPeriodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.deletedAt IS NULL')
        .getOne();

      expect(mapping).not.toBeNull();
      expect(mapping).toBeDefined();

      console.log('\n📝 평가 수정 가능 상태:');
      console.log('  자기평가:', mapping!.isSelfEvaluationEditable);
      console.log('  1차평가:', mapping!.isPrimaryEvaluationEditable);
      console.log('  2차평가:', mapping!.isSecondaryEvaluationEditable);

      // 모든 평가가 완료되었으므로 모두 수정 불가
      expect(mapping!.isSelfEvaluationEditable).toBe(false);
      expect(mapping!.isPrimaryEvaluationEditable).toBe(false);
      expect(mapping!.isSecondaryEvaluationEditable).toBe(false);

      console.log('\n✅ 모든 평가가 수정 불가 상태로 설정됨 (예상대로)');
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

      console.log('\n=== 프로젝트 매니저 정보 (시나리오 3 - 실제 데이터) ===');
      console.log('총 프로젝트 수:', projects.length);
      console.log('PM이 할당된 프로젝트:', projectsWithPM);
      console.log('PM이 없는 프로젝트:', projectsWithoutPM);

      // PM 정보가 있는 경우, 구조가 올바른지 이미 검증됨
      // 확률적으로 PM이 없을 수도 있음
    });

    it('🔍 WBS별 하향평가 정보가 포함되어야 한다 (근본 원인 확인)', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      const { projects, summary } = response.body;

      console.log('\n=== WBS별 하향평가 정보 검증 ===');
      console.log(
        '📊 Summary 1차 하향평가:',
        summary.primaryDownwardEvaluation,
      );
      console.log(
        '📊 Summary 2차 하향평가:',
        summary.secondaryDownwardEvaluation,
      );

      let totalWbs = 0;
      let wbsWithPrimaryEval = 0;
      let wbsWithSecondaryEval = 0;
      let wbsWithoutPrimaryEval = 0;
      let wbsWithoutSecondaryEval = 0;

      for (const project of projects) {
        console.log(`\n프로젝트: ${project.projectName}`);

        for (const wbs of project.wbsList) {
          totalWbs++;
          console.log(`  WBS: ${wbs.wbsName} (${wbs.wbsCode})`);
          console.log('    1차 하향평가:', wbs.primaryDownwardEvaluation);
          console.log('    2차 하향평가:', wbs.secondaryDownwardEvaluation);

          // 1차 하향평가 검증
          if (wbs.primaryDownwardEvaluation) {
            wbsWithPrimaryEval++;

            // 필수 필드 검증
            expect(wbs.primaryDownwardEvaluation).toMatchObject({
              isCompleted: expect.any(Boolean),
              isEditable: expect.any(Boolean),
            });

            // 완료된 경우 모든 필드 검증
            if (wbs.primaryDownwardEvaluation.isCompleted) {
              // evaluatorName 검증 (여러 평가자의 경우 "N명의 1차 평가자" 형식)
              expect(wbs.primaryDownwardEvaluation.evaluatorName).toBeDefined();
              expect(typeof wbs.primaryDownwardEvaluation.evaluatorName).toBe(
                'string',
              );

              // score 검증
              expect(wbs.primaryDownwardEvaluation.score).toBeDefined();
              expect(wbs.primaryDownwardEvaluation.score).not.toBeNull();
              expect(typeof wbs.primaryDownwardEvaluation.score).toBe('number');
              expect(
                wbs.primaryDownwardEvaluation.score,
              ).toBeGreaterThanOrEqual(0);
              expect(wbs.primaryDownwardEvaluation.score).toBeLessThanOrEqual(
                100,
              );

              // submittedAt 검증
              expect(wbs.primaryDownwardEvaluation.submittedAt).toBeDefined();

              console.log(
                `      ✅ 1차 평가 완료 (평가자: ${wbs.primaryDownwardEvaluation.evaluatorName}, 점수: ${wbs.primaryDownwardEvaluation.score})`,
              );
            } else {
              console.log('      ⚠️  1차 평가는 있지만 미완료');
            }
          } else {
            wbsWithoutPrimaryEval++;
            console.log('      ❌ 1차 평가 정보가 null');
          }

          // 2차 하향평가 검증
          if (wbs.secondaryDownwardEvaluation) {
            wbsWithSecondaryEval++;

            // 필수 필드 검증
            expect(wbs.secondaryDownwardEvaluation).toMatchObject({
              isCompleted: expect.any(Boolean),
              isEditable: expect.any(Boolean),
            });

            // 완료된 경우 모든 필드 검증
            if (wbs.secondaryDownwardEvaluation.isCompleted) {
              // evaluatorName 검증 (여러 평가자의 경우 "N명의 2차 평가자" 형식)
              expect(
                wbs.secondaryDownwardEvaluation.evaluatorName,
              ).toBeDefined();
              expect(typeof wbs.secondaryDownwardEvaluation.evaluatorName).toBe(
                'string',
              );

              // score 검증
              expect(wbs.secondaryDownwardEvaluation.score).toBeDefined();
              expect(wbs.secondaryDownwardEvaluation.score).not.toBeNull();
              expect(typeof wbs.secondaryDownwardEvaluation.score).toBe(
                'number',
              );
              expect(
                wbs.secondaryDownwardEvaluation.score,
              ).toBeGreaterThanOrEqual(0);
              expect(wbs.secondaryDownwardEvaluation.score).toBeLessThanOrEqual(
                100,
              );

              // submittedAt 검증
              expect(wbs.secondaryDownwardEvaluation.submittedAt).toBeDefined();

              console.log(
                `      ✅ 2차 평가 완료 (평가자: ${wbs.secondaryDownwardEvaluation.evaluatorName}, 점수: ${wbs.secondaryDownwardEvaluation.score})`,
              );
            } else {
              console.log('      ⚠️  2차 평가는 있지만 미완료');
            }
          } else {
            wbsWithoutSecondaryEval++;
            console.log('      ❌ 2차 평가 정보가 null');
          }
        }
      }

      console.log('\n📈 통계:');
      console.log('  총 WBS 수:', totalWbs);
      console.log('  1차 평가 있음:', wbsWithPrimaryEval);
      console.log('  1차 평가 없음:', wbsWithoutPrimaryEval);
      console.log('  2차 평가 있음:', wbsWithSecondaryEval);
      console.log('  2차 평가 없음:', wbsWithoutSecondaryEval);

      // Summary에는 점수가 있지만 WBS별로는 없다면 문제!
      if (
        summary.primaryDownwardEvaluation.totalScore !== null &&
        wbsWithoutPrimaryEval > 0
      ) {
        console.log(
          '\n⚠️  근본 원인 발견: Summary에는 1차 평가 점수가 있지만 일부 WBS에는 없음!',
        );
      }

      if (
        summary.secondaryDownwardEvaluation.totalScore !== null &&
        wbsWithoutSecondaryEval > 0
      ) {
        console.log(
          '\n⚠️  근본 원인 발견: Summary에는 2차 평가 점수가 있지만 일부 WBS에는 없음!',
        );
      }

      // 모든 평가가 완료되었으므로 WBS별로도 평가 정보가 있어야 함
      expect(wbsWithPrimaryEval).toBeGreaterThan(0);
      expect(wbsWithSecondaryEval).toBeGreaterThan(0);
    });
  });
});
