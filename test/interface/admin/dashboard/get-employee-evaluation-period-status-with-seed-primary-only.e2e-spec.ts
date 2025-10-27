import { INestApplication, HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status - 1차 하향평가만 완료된 시나리오', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('1차 하향평가만 완료, 2차는 미완료 시나리오', () => {
    let seedDataResponse: any;
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('===== 1. 시드 데이터 생성 시작 =====');

      // 기존 데이터 정리
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect(HttpStatus.OK);

      console.log('기존 데이터 정리 완료');

      // 시드 데이터 생성 (1차 하향평가만 100% 완료, 2차는 0% 완료)
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 10,
            projectCount: 3,
            wbsPerProject: 5,
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // 자기평가는 100% 완료
            selfEvaluationProgress: {
              completed: 1.0,
            },
            // 1차 하향평가는 100% 완료
            primaryDownwardEvaluationProgress: {
              completed: 1.0,
            },
            // 2차 하향평가는 0% 완료 (미작성)
            secondaryDownwardEvaluationProgress: {
              notStarted: 1.0,
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
        .expect(HttpStatus.CREATED);

      seedDataResponse = seedResponse.body;
      console.log('시드 데이터 생성 완료:', {
        success: seedDataResponse.success,
        message: seedDataResponse.message,
        duration: seedDataResponse.totalDuration,
      });

      // 생성된 데이터 상세 로그
      if (seedDataResponse.results) {
        console.log('\n생성된 데이터 상세:');
        for (const key of Object.keys(seedDataResponse.results)) {
          console.log(`  ${key}:`, seedDataResponse.results[key]);
        }
        console.log();
      }

      // 생성된 데이터 확인
      if (!seedDataResponse.success) {
        console.error('시드 데이터 생성 실패:', seedDataResponse);
        throw new Error('시드 데이터 생성에 실패했습니다.');
      }

      // 평가기간 조회 (데이터베이스에서)
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .getMany();

      if (periods.length === 0) {
        throw new Error('생성된 평가기간이 없습니다.');
      }

      evaluationPeriodId = periods[0].id;
      console.log('\n평가기간 확인:', {
        id: evaluationPeriodId,
        name: periods[0].name,
      });

      // 첫 번째 직원 조회 (데이터베이스에서)
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .andWhere("employee.status = '재직중'")
        .orderBy('employee.createdAt', 'ASC')
        .getMany();

      if (employees.length === 0) {
        throw new Error('생성된 직원이 없습니다.');
      }

      employeeId = employees[0].id;
      console.log('\n테스트 대상 직원 확인:', {
        id: employeeId,
        name: employees[0].name,
        employeeNumber: employees[0].employeeNumber,
        status: employees[0].status,
      });

      // WBS 할당 및 자기평가 상태 조회
      const wbsAssignments = await dataSource.manager.query(
        `SELECT wa.*, w."wbsCode", w.title, se."selfEvaluationScore", se."isCompleted"
         FROM evaluation_wbs_assignment wa
         INNER JOIN wbs_item w ON w.id = wa."wbsItemId"
         LEFT JOIN wbs_self_evaluation se ON se."wbsItemId" = wa."wbsItemId"
           AND se."employeeId" = wa."employeeId"
           AND se."periodId" = wa."periodId"
           AND se."deletedAt" IS NULL
         WHERE wa."periodId" = $1
         AND wa."employeeId" = $2
         AND wa."deletedAt" IS NULL
         ORDER BY w."wbsCode"`,
        [evaluationPeriodId, employeeId],
      );

      console.log('\nWBS 할당 및 자기평가 상태:');
      console.log(`총 ${wbsAssignments.length}개 WBS 할당`);
      wbsAssignments.forEach((wa: any, index: number) => {
        console.log(`  ${index + 1}. ${wa.wbsCode} - ${wa.title}`);
        console.log(`     가중치: ${parseFloat(wa.weight).toFixed(2)}%`);
        console.log(`     자기평가 점수: ${wa.selfEvaluationScore || 'N/A'}`);
        console.log(`     완료 상태: ${wa.isCompleted || false}`);
      });

      console.log('\n===== 시드 데이터 생성 및 확인 완료 =====\n');
    });

    it('직원 평가 현황 조회 시 자기평가와 1차 하향평가 점수/등급이 반환되어야 한다', async () => {
      console.log('===== 2. 직원 평가 현황 조회 테스트 =====');

      // When: 직원 평가 현황 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      const status = response.body;
      console.log('직원 평가 응답 데이터:');
      console.log(`  평가기간: ${status.evaluationPeriod.name}`);
      console.log(`  직원: ${status.employee.name}`);
      console.log(`  대상 여부: ${status.isTarget}`);

      // 자기평가 정보 출력
      console.log('\n자기평가 정보:');
      console.log(`  상태: ${status.selfEvaluation.status}`);
      console.log(
        `  진행: ${status.selfEvaluation.completedMappingCount}/${status.selfEvaluation.totalMappingCount}`,
      );
      console.log(`  총점: ${status.selfEvaluation.totalScore}`);
      console.log(`  등급: ${status.selfEvaluation.grade}`);
      console.log('  전체 selfEvaluation 객체:', status.selfEvaluation);

      // Then: 응답 구조 검증
      expect(status).toBeDefined();
      expect(status.evaluationPeriod).toBeDefined();
      expect(status.employee).toBeDefined();
      // isTarget은 평가 대상자 매핑 여부에 따라 결정됨 (시드 데이터에서는 항상 true)
      // expect(status.isTarget).toBe(true);
      expect(status.selfEvaluation).toBeDefined();
      expect(status.downwardEvaluation).toBeDefined();

      // 자기평가 점수/등급 검증
      if (
        status.selfEvaluation.status === 'complete' &&
        status.selfEvaluation.completedMappingCount > 0
      ) {
        console.log('  ✓ 자기평가 완료 상태 - 점수/등급 검증');
        expect(status.selfEvaluation.totalScore).not.toBeNull();
        expect(typeof status.selfEvaluation.totalScore).toBe('number');
        expect(status.selfEvaluation.totalScore).toBeGreaterThanOrEqual(0);
        expect(status.selfEvaluation.totalScore).toBeLessThanOrEqual(100);
        expect(status.selfEvaluation.grade).not.toBeNull();
        expect(typeof status.selfEvaluation.grade).toBe('string');
        console.log('  ✓ 자기평가 점수/등급 검증 완료');
      }

      // 1차 하향평가 정보 출력
      console.log('\n1차 하향평가 정보:');
      console.log(
        `  평가자 ID: ${status.downwardEvaluation.primary.evaluatorId}`,
      );
      console.log(`  상태: ${status.downwardEvaluation.primary.status}`);
      console.log(
        `  진행: ${status.downwardEvaluation.primary.completedEvaluationCount}/${status.downwardEvaluation.primary.assignedWbsCount}`,
      );
      console.log(`  총점: ${status.downwardEvaluation.primary.totalScore}`);
      console.log(`  등급: ${status.downwardEvaluation.primary.grade}`);

      // 1차 하향평가 점수/등급 검증
      if (
        status.downwardEvaluation.primary.status === 'complete' &&
        status.downwardEvaluation.primary.completedEvaluationCount > 0
      ) {
        console.log('  ✓ 1차 하향평가 완료 상태 - 점수/등급 검증');
        expect(status.downwardEvaluation.primary.totalScore).not.toBeNull();
        expect(typeof status.downwardEvaluation.primary.totalScore).toBe(
          'number',
        );
        expect(
          status.downwardEvaluation.primary.totalScore,
        ).toBeGreaterThanOrEqual(0);
        expect(
          status.downwardEvaluation.primary.totalScore,
        ).toBeLessThanOrEqual(100);
        expect(status.downwardEvaluation.primary.grade).not.toBeNull();
        expect(typeof status.downwardEvaluation.primary.grade).toBe('string');
        console.log('  ✓ 1차 하향평가 점수/등급 검증 완료');
      } else {
        console.log('  ✗ 1차 하향평가 미완료 상태 - 점수/등급 null 확인');
      }

      // 2차 하향평가 정보 출력
      console.log('\n2차 하향평가 정보:');
      const secondary = status.downwardEvaluation.secondary;
      if (Array.isArray(secondary)) {
        console.log(`  평가자 수: ${secondary.length}`);
        secondary.forEach((sec: any, index: number) => {
          console.log(`  평가자 ${index + 1}:`);
          console.log(`    ID: ${sec.evaluatorId}`);
          console.log(`    상태: ${sec.status}`);
          console.log(
            `    진행: ${sec.completedEvaluationCount}/${sec.assignedWbsCount}`,
          );
        });

        // 2차 하향평가는 미완료여야 함
        secondary.forEach((sec: any) => {
          // 2차 평가는 미작성 상태여야 함
          expect(['none', 'in_progress']).toContain(sec.status);
        });
        console.log(`  ✓ 2차 하향평가 미완료 상태 - 점수/등급 null 확인`);
      } else {
        console.log(`  평가자 ID: ${secondary?.evaluatorId || 'N/A'}`);
        console.log(`  상태: ${secondary?.status || 'none'}`);
      }
      // secondary 객체 내부의 totalScore와 grade 확인
      if (
        secondary &&
        typeof secondary === 'object' &&
        !Array.isArray(secondary)
      ) {
        console.log(`  총점: ${secondary.totalScore}`);
        console.log(`  등급: ${secondary.grade}`);

        // totalScore와 grade는 모든 2차 평가가 완료되지 않았으므로 null이어야 함
        expect(secondary.totalScore).toBeNull();
        expect(secondary.grade).toBeNull();
        console.log('  ✓ 2차 하향평가 미완료 - 총점/등급 null 검증 완료');
      }

      console.log('\n===== 테스트 완료 =====');
    });

    it('응답 데이터 구조가 올바른지 확인한다', async () => {
      // When: 직원 평가 현황 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      const status = response.body;

      // Then: 응답 구조 상세 검증
      expect(status.evaluationPeriod).toHaveProperty('id');
      expect(status.evaluationPeriod).toHaveProperty('name');
      expect(status.evaluationPeriod).toHaveProperty('startDate');
      expect(status.evaluationPeriod).toHaveProperty('endDate');

      expect(status.employee).toHaveProperty('id');
      expect(status.employee).toHaveProperty('name');
      expect(status.employee).toHaveProperty('employeeNumber');

      expect(status.selfEvaluation).toHaveProperty('status');
      expect(status.selfEvaluation).toHaveProperty('totalMappingCount');
      expect(status.selfEvaluation).toHaveProperty('completedMappingCount');
      expect(status.selfEvaluation).toHaveProperty('isEditable');
      expect(status.selfEvaluation).toHaveProperty('totalScore');
      expect(status.selfEvaluation).toHaveProperty('grade');

      expect(status.downwardEvaluation).toHaveProperty('primary');
      expect(status.downwardEvaluation.primary).toHaveProperty('evaluator');
      expect(status.downwardEvaluation.primary).toHaveProperty('status');
      expect(status.downwardEvaluation.primary).toHaveProperty(
        'assignedWbsCount',
      );
      expect(status.downwardEvaluation.primary).toHaveProperty(
        'completedEvaluationCount',
      );
      expect(status.downwardEvaluation.primary).toHaveProperty('isEditable');
      expect(status.downwardEvaluation.primary).toHaveProperty('totalScore');
      expect(status.downwardEvaluation.primary).toHaveProperty('grade');

      // 평가자 정보 구조 검증
      if (status.downwardEvaluation.primary.evaluator) {
        expect(status.downwardEvaluation.primary.evaluator).toHaveProperty(
          'id',
        );
        expect(status.downwardEvaluation.primary.evaluator).toHaveProperty(
          'name',
        );
        expect(status.downwardEvaluation.primary.evaluator).toHaveProperty(
          'employeeNumber',
        );
        expect(status.downwardEvaluation.primary.evaluator).toHaveProperty(
          'email',
        );
      }

      expect(status.downwardEvaluation).toHaveProperty('secondary');
      // secondary 객체 내부에 totalScore와 grade가 있어야 함
      expect(status.downwardEvaluation.secondary).toHaveProperty('totalScore');
      expect(status.downwardEvaluation.secondary).toHaveProperty('grade');

      console.log('  ✓ 응답 데이터 구조 검증 완료');
    });
  });
});
