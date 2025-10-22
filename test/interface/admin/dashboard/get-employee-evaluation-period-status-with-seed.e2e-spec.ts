import { INestApplication, HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status - 시드 데이터 기반 하향평가 점수/등급 테스트', () => {
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

  describe('시드 데이터 생성 및 하향평가 점수/등급 테스트', () => {
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

      // 시드 데이터 생성 (full 시나리오, 모든 평가 100% 완료)
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 2,
            employeeCount: 10,
            projectCount: 10, // 프로젝트 수 증가
            wbsPerProject: 15, // WBS 수 증가
          },
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            // 모든 평가를 100% 완료 상태로 설정
            selfEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            secondaryDownwardEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            peerEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
            },
            finalEvaluationProgress: {
              completed: 1.0,
              notStarted: 0.0,
              inProgress: 0.0,
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

      // 시드 데이터 상태 조회
      const statusResponse = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(HttpStatus.OK);

      console.log('시드 데이터 현재 상태:', statusResponse.body);

      // 평가기간 조회 (데이터베이스에서)
      const periodRepo = dataSource.getRepository('EvaluationPeriod');
      const periods = await periodRepo.find({
        where: { deletedAt: null as any },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (periods.length === 0) {
        throw new Error('평가기간을 찾을 수 없습니다.');
      }

      evaluationPeriodId = periods[0].id;
      console.log('\n평가기간 확인:', {
        id: evaluationPeriodId,
        name: periods[0].name,
      });

      // 평가 대상 직원 조회 (데이터베이스에서)
      const employeeRepo = dataSource.getRepository('Employee');
      const employees = await employeeRepo.find({
        where: {
          deletedAt: null as any,
          status: '재직중',
        },
        take: 1,
      });

      if (employees.length === 0) {
        throw new Error('재직 중인 직원을 찾을 수 없습니다.');
      }

      employeeId = employees[0].id;
      console.log('\n평가 대상 직원 확인:', {
        id: employeeId,
        name: employees[0].name,
        employeeNumber: employees[0].employeeNumber,
        status: employees[0].status,
      });

      // WBS 할당 및 가중치 확인
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
      wbsAssignments.forEach((wa: any, idx: number) => {
        console.log(`  ${idx + 1}. ${wa.wbsCode} - ${wa.title}`);
        console.log(`     가중치: ${wa.weight}%`);
        console.log(`     자기평가 점수: ${wa.selfEvaluationScore || 'N/A'}`);
        console.log(`     완료 여부: ${wa.isCompleted || false}`);
      });

      console.log('\n===== 데이터 생성 및 확인 완료 =====\n');
    });

    it('대시보드 현황 조회 시 자기평가 점수와 등급이 반환되어야 한다', async () => {
      console.log('===== 2. 대시보드 현황 조회 테스트 =====');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      const status = response.body;

      console.log('대시보드 응답 데이터:');
      console.log('  평가기간:', status.evaluationPeriod?.name);
      console.log('  직원:', status.employee?.name);
      console.log('  평가 대상:', status.isEvaluationTarget);

      // 자기평가 정보 확인
      console.log('\n자기평가 정보:');
      console.log('  상태:', status.selfEvaluation.status);
      console.log(
        `  진행: ${status.selfEvaluation.completedMappingCount}/${status.selfEvaluation.totalMappingCount}`,
      );
      console.log('  총점:', status.selfEvaluation.totalScore);
      console.log('  등급:', status.selfEvaluation.grade);
      console.log(
        '  전체 selfEvaluation 객체:',
        JSON.stringify(status.selfEvaluation, null, 2),
      );

      // 자기평가 검증
      expect(status.selfEvaluation).toBeDefined();
      expect(status.selfEvaluation.status).toBeDefined();

      if (
        status.selfEvaluation.status === 'complete' &&
        status.selfEvaluation.totalMappingCount > 0
      ) {
        console.log('  ✓ 자기평가 완료 상태 - 점수/등급 검증');
        expect(status.selfEvaluation.totalScore).not.toBeNull();
        expect(typeof status.selfEvaluation.totalScore).toBe('number');
        expect(status.selfEvaluation.totalScore).toBeGreaterThanOrEqual(0);
        expect(status.selfEvaluation.totalScore).toBeLessThanOrEqual(100);
        expect(status.selfEvaluation.grade).not.toBeNull();
        expect(typeof status.selfEvaluation.grade).toBe('string');
        console.log('  ✓ 자기평가 점수/등급 검증 통과');
      } else {
        console.log('  ℹ 자기평가 미완료 상태 - 점수/등급 null 확인');
        expect(status.selfEvaluation.totalScore).toBeNull();
        expect(status.selfEvaluation.grade).toBeNull();
      }

      // 1차 하향평가 정보 확인
      console.log('\n1차 하향평가 정보:');
      console.log(
        '  평가자 ID:',
        status.downwardEvaluation.primary.evaluatorId,
      );
      console.log('  상태:', status.downwardEvaluation.primary.status);
      console.log(
        `  진행: ${status.downwardEvaluation.primary.completedEvaluationCount}/${status.downwardEvaluation.primary.assignedWbsCount}`,
      );
      console.log('  총점:', status.downwardEvaluation.primary.totalScore);
      console.log('  등급:', status.downwardEvaluation.primary.grade);

      // 1차 하향평가 검증
      expect(status.downwardEvaluation.primary).toBeDefined();
      expect(status.downwardEvaluation.primary.status).toBeDefined();

      if (
        status.downwardEvaluation.primary.status === 'complete' &&
        status.downwardEvaluation.primary.assignedWbsCount > 0
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
        console.log('  ✓ 1차 하향평가 점수/등급 검증 통과');
      } else {
        console.log('  ℹ 1차 하향평가 미완료 상태 - 점수/등급 null 확인');
        expect(status.downwardEvaluation.primary.totalScore).toBeNull();
        expect(status.downwardEvaluation.primary.grade).toBeNull();
      }

      // 2차 하향평가 정보 확인
      console.log('\n2차 하향평가 정보:');
      console.log(
        '  평가자 수:',
        status.downwardEvaluation.secondary.evaluators.length,
      );
      status.downwardEvaluation.secondary.evaluators.forEach(
        (evaluator: any, idx: number) => {
          console.log(`  평가자 ${idx + 1}:`);
          console.log('    ID:', evaluator.evaluatorId);
          console.log('    상태:', evaluator.status);
          console.log(
            `    진행: ${evaluator.completedEvaluationCount}/${evaluator.assignedWbsCount}`,
          );
        },
      );
      console.log('  총점:', status.downwardEvaluation.secondary.totalScore);
      console.log('  등급:', status.downwardEvaluation.secondary.grade);

      // 2차 하향평가 검증
      expect(status.downwardEvaluation.secondary).toBeDefined();
      expect(status.downwardEvaluation.secondary.evaluators).toBeDefined();
      expect(
        Array.isArray(status.downwardEvaluation.secondary.evaluators),
      ).toBe(true);

      // 모든 2차 평가자의 평가가 완료되었는지 확인
      const allSecondaryCompleted =
        status.downwardEvaluation.secondary.evaluators.length > 0 &&
        status.downwardEvaluation.secondary.evaluators.every(
          (evaluator: any) =>
            evaluator.status === 'complete' &&
            evaluator.assignedWbsCount > 0 &&
            evaluator.completedEvaluationCount === evaluator.assignedWbsCount,
        );

      if (allSecondaryCompleted) {
        console.log('  ✓ 2차 하향평가 완료 상태 - 점수/등급 검증');
        expect(status.downwardEvaluation.secondary.totalScore).not.toBeNull();
        expect(typeof status.downwardEvaluation.secondary.totalScore).toBe(
          'number',
        );
        expect(
          status.downwardEvaluation.secondary.totalScore,
        ).toBeGreaterThanOrEqual(0);
        expect(
          status.downwardEvaluation.secondary.totalScore,
        ).toBeLessThanOrEqual(100);
        expect(status.downwardEvaluation.secondary.grade).not.toBeNull();
        expect(typeof status.downwardEvaluation.secondary.grade).toBe('string');
        console.log('  ✓ 2차 하향평가 점수/등급 검증 통과');
      } else {
        console.log('  ℹ 2차 하향평가 미완료 상태 - 점수/등급 null 확인');
        expect(status.downwardEvaluation.secondary.totalScore).toBeNull();
        expect(status.downwardEvaluation.secondary.grade).toBeNull();
      }

      console.log('\n===== 테스트 완료 =====');
    });

    it('응답 데이터 구조가 올바른지 확인한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/status`,
        )
        .expect(HttpStatus.OK);

      const status = response.body;

      // 기본 구조 검증
      expect(status).toHaveProperty('mappingId');
      expect(status).toHaveProperty('evaluationPeriodId');
      expect(status).toHaveProperty('employeeId');
      expect(status).toHaveProperty('isEvaluationTarget');
      expect(status).toHaveProperty('evaluationPeriod');
      expect(status).toHaveProperty('employee');
      expect(status).toHaveProperty('exclusionInfo');
      expect(status).toHaveProperty('evaluationCriteria');
      expect(status).toHaveProperty('wbsCriteria');
      expect(status).toHaveProperty('evaluationLine');
      expect(status).toHaveProperty('performanceInput');
      expect(status).toHaveProperty('selfEvaluation');
      expect(status).toHaveProperty('downwardEvaluation');
      expect(status).toHaveProperty('peerEvaluation');
      expect(status).toHaveProperty('finalEvaluation');

      // 자기평가 구조 검증
      expect(status.selfEvaluation).toHaveProperty('status');
      expect(status.selfEvaluation).toHaveProperty('totalMappingCount');
      expect(status.selfEvaluation).toHaveProperty('completedMappingCount');
      expect(status.selfEvaluation).toHaveProperty('isEditable');
      expect(status.selfEvaluation).toHaveProperty('totalScore');
      expect(status.selfEvaluation).toHaveProperty('grade');

      // 1차 하향평가 구조 검증
      expect(status.downwardEvaluation.primary).toHaveProperty('evaluatorId');
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

      // 2차 하향평가 구조 검증
      expect(status.downwardEvaluation.secondary).toHaveProperty('evaluators');
      expect(status.downwardEvaluation.secondary).toHaveProperty('isEditable');
      expect(status.downwardEvaluation.secondary).toHaveProperty('totalScore');
      expect(status.downwardEvaluation.secondary).toHaveProperty('grade');
      expect(
        Array.isArray(status.downwardEvaluation.secondary.evaluators),
      ).toBe(true);

      console.log('✓ 응답 데이터 구조 검증 완료');
    });
  });
});
