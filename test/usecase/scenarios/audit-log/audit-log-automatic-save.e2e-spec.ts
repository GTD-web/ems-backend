import { BaseE2ETest } from '../../../base-e2e.spec';
import { AuditLogScenario } from './audit-log.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { WbsSelfEvaluationScenario } from '../performance-evaluation/wbs-self-evaluation/wbs-self-evaluation.scenario';

/**
 * 감사로그 자동 저장 E2E 테스트
 *
 * 각 API 요청이 들어올 때 자동으로 감사로그가 저장되는지 검증합니다.
 */
describe('감사로그 자동 저장 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let auditLogScenario: AuditLogScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    auditLogScenario = new AuditLogScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '감사로그 자동 저장 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '감사로그 자동 저장 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 프로젝트 할당
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      projectId: projectIds[0],
    });

    // WBS 할당
    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
    });
  });

  describe('GET 요청 감사로그 자동 저장', () => {
    it.skip('대시보드 직원 현황 조회 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // GET 요청은 감사로그에서 제외되므로 스킵
      // When
      const result =
        await auditLogScenario.대시보드API를_호출하고_감사로그를_검증한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
          apiType: 'employee-status',
        });

      // Then
      expect(result.response).toBeDefined();
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('GET');
      expect(result.auditLog.responseStatusCode).toBe(200);
    });

    it.skip('대시보드 할당 데이터 조회 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // GET 요청은 감사로그에서 제외되므로 스킵
      // When
      const result =
        await auditLogScenario.대시보드API를_호출하고_감사로그를_검증한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
          apiType: 'assigned-data',
        });

      // Then
      expect(result.response).toBeDefined();
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('GET');
      expect(result.auditLog.responseStatusCode).toBe(200);
    });

    it.skip('대시보드 전체 직원 현황 조회 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // GET 요청은 감사로그에서 제외되므로 스킵
      // When
      const result =
        await auditLogScenario.대시보드API를_호출하고_감사로그를_검증한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
          apiType: 'employees-status',
        });

      // Then
      expect(result.response).toBeDefined();
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('GET');
      expect(result.auditLog.responseStatusCode).toBe(200);
    });

    it.skip('감사로그 목록 조회 API 호출 시 쿼리 파라미터가 올바르게 저장된다', async () => {
      // GET 요청은 감사로그에서 제외되므로 스킵
      // When
      const result =
        await auditLogScenario.API요청을_전송하고_감사로그를_검증한다({
          method: 'GET',
          url: '/admin/audit-logs?page=1&limit=10&userId=test-user-id',
          expectedRequestMethod: 'GET',
          expectedRequestUrl: '/admin/audit-logs',
          expectedStatusCode: 200,
        });

      // Then
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestQuery).toBeDefined();
      // 쿼리 파라미터는 문자열로 저장되므로 확인
      if (result.auditLog.requestQuery) {
        expect(result.auditLog.requestQuery.page).toBeDefined();
        expect(result.auditLog.requestQuery.limit).toBeDefined();
      }
    });
  });

  describe('POST 요청 감사로그 자동 저장', () => {
    it('WBS 자기평가 저장 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // When
      const result =
        await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      // Then
      expect(result.response).toBeDefined();
      expect(result.response.id).toBeDefined();
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('POST');
      expect(result.auditLog.responseStatusCode).toBe(200);
      expect(result.auditLog.requestBody).toBeDefined();
      expect(result.auditLog.requestBody.selfEvaluationContent).toBe(
        '자기평가 내용입니다.',
      );
      expect(result.auditLog.requestBody.selfEvaluationScore).toBe(85);
    });

    it('평가기간 생성 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // Given - 고유한 이름과 날짜로 평가기간 생성 (기존 기간과 겹치지 않도록)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() + 1); // 1년 후
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      const uniqueName = `감사로그 테스트용 평가기간 ${Date.now()}`;

      const createData = {
        name: uniqueName,
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: '감사로그 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S+', minRange: 95, maxRange: 100 },
          { grade: 'S', minRange: 90, maxRange: 94 },
        ],
      };

      // When
      const result =
        await auditLogScenario.평가기간API를_호출하고_감사로그를_검증한다({
          method: 'POST',
          url: '/admin/evaluation-periods',
          body: createData,
          expectedStatusCode: 201,
        });

      // Then
      expect(result.response).toBeDefined();
      expect(result.response.id).toBeDefined();
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('POST');
      expect(result.auditLog.responseStatusCode).toBe(201);
    });
  });

  describe('PATCH 요청 감사로그 자동 저장', () => {
    it('WBS 자기평가 제출 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // Given - 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      // When - 자기평가 제출
      const result =
        await auditLogScenario.API요청을_전송하고_감사로그를_검증한다({
          method: 'PATCH',
          url: `/admin/performance-evaluation/wbs-self-evaluations/${저장결과.id}/submit-to-evaluator`,
          expectedRequestMethod: 'PATCH',
          expectedRequestUrl: `/admin/performance-evaluation/wbs-self-evaluations/${저장결과.id}/submit-to-evaluator`,
          expectedStatusCode: 200,
        });

      // Then
      expect(result.response).toBeDefined();
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('PATCH');
      expect(result.auditLog.responseStatusCode).toBe(200);
    });
  });

  describe('DELETE 요청 감사로그 자동 저장', () => {
    it('평가기간 삭제 API 호출 시 감사로그가 자동으로 저장된다', async () => {
      // Given - 고유한 이름과 날짜로 평가기간 생성 (기존 기간과 겹치지 않도록)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() + 1); // 1년 후
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      const uniqueName = `삭제 테스트용 평가기간 ${Date.now()}`;

      const createData = {
        name: uniqueName,
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: '삭제 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [{ grade: 'S+', minRange: 95, maxRange: 100 }],
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const deletePeriodId = createResponse.body.id;

      // When - 평가기간 삭제
      const result =
        await auditLogScenario.평가기간API를_호출하고_감사로그를_검증한다({
          method: 'DELETE',
          url: `/admin/evaluation-periods/${deletePeriodId}`,
          expectedStatusCode: 200,
        });

      // Then
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.requestMethod).toBe('DELETE');
      expect(result.auditLog.responseStatusCode).toBe(200);
    });
  });

  describe('에러 응답 감사로그 자동 저장', () => {
    it.skip('존재하지 않는 리소스 조회 시 에러 응답도 감사로그에 저장된다', async () => {
      // GET 요청은 감사로그에서 제외되므로 스킵
      // When - 잘못된 UUID 형식으로 조회 (ParseUUID 데코레이터가 400 에러 반환)
      // 00000000-0000-0000-0000-000000000999는 유효한 UUID 형식이 아니므로 ParseUUID 데코레이터가 BadRequestException을 던짐
      const result =
        await auditLogScenario.에러응답API를_호출하고_감사로그를_검증한다({
          method: 'GET',
          url: `/admin/dashboard/00000000-0000-0000-0000-000000000999/employees/${employeeIds[0]}/status`,
          expectedStatusCode: 400, // ParseUUID 데코레이터가 잘못된 UUID 형식으로 인해 400 에러 반환
          expectedErrorMessage: '올바른 UUID 형식이어야 합니다',
        });

      // Then
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.responseStatusCode).toBe(400);
      expect(result.auditLog.responseBody).toBeDefined();
      expect(result.auditLog.responseBody.message).toContain(
        '올바른 UUID 형식이어야 합니다',
      );
    });

    it('잘못된 요청 시 에러 응답도 감사로그에 저장된다', async () => {
      // When
      const result =
        await auditLogScenario.에러응답API를_호출하고_감사로그를_검증한다({
          method: 'POST',
          url: `/admin/performance-evaluation/wbs-self-evaluations/employee/00000000-0000-0000-0000-000000000999/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
          body: {
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          },
          expectedStatusCode: 400,
        });

      // Then
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.responseStatusCode).toBe(400);
    });
  });

  describe('감사로그 조회 기능', () => {
    it('감사로그 목록을 조회할 수 있다', async () => {
      // Given - POST 요청으로 감사로그 생성
      await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      // When
      const result = await auditLogScenario.감사로그목록을_조회한다({
        page: 1,
        limit: 10,
      });

      // Then
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('사용자 ID로 감사로그를 필터링할 수 있다', async () => {
      // Given - POST 요청으로 감사로그 생성
      await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      // When
      const auditLogs = await auditLogScenario.감사로그목록을_조회한다({
        page: 1,
        limit: 10,
      });

      if (auditLogs.items.length > 0) {
        const userId = auditLogs.items[0].userId;
        const filteredResult = await auditLogScenario.감사로그목록을_조회한다({
          page: 1,
          limit: 10,
          userId,
        });

        // Then
        expect(filteredResult.items.length).toBeGreaterThan(0);
        filteredResult.items.forEach((log: any) => {
          expect(log.userId).toBe(userId);
        });
      }
    });

    it('HTTP 메서드로 감사로그를 필터링할 수 있다', async () => {
      // Given - POST 요청 전송
      await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
      });

      // When
      const result = await auditLogScenario.감사로그목록을_조회한다({
        page: 1,
        limit: 10,
        requestMethod: 'POST',
      });

      // Then
      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((log: any) => {
        expect(log.requestMethod).toBe('POST');
      });
    });

    it('감사로그 상세 정보를 조회할 수 있다', async () => {
      // Given - POST 요청으로 감사로그 생성
      const result =
        await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      // When
      const detail = await auditLogScenario.감사로그상세를_조회한다(
        result.auditLog.id,
      );

      // Then
      expect(detail).toBeDefined();
      expect(detail.id).toBe(result.auditLog.id);
      expect(detail.requestMethod).toBe('POST');
      expect(detail.requestUrl).toBeDefined();
      expect(detail.responseStatusCode).toBe(200);
      expect(detail.requestId).toBeDefined();
      expect(detail.requestIp).toBeDefined();
      expect(detail.requestStartTime).toBeDefined();
      expect(detail.requestEndTime).toBeDefined();
      expect(detail.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('감사로그 메타데이터 검증', () => {
    it('요청 ID가 자동으로 생성된다', async () => {
      // When - POST 요청으로 감사로그 생성
      const result1 =
        await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용 1',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과 1',
        });

      const result2 =
        await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[1] || wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용 2',
          selfEvaluationScore: 90,
          performanceResult: '성과 결과 2',
        });

      // Then
      expect(result1.auditLog.requestId).toBeDefined();
      expect(result2.auditLog.requestId).toBeDefined();
      expect(result1.auditLog.requestId).not.toBe(result2.auditLog.requestId);
    });

    it('요청 시간과 지속 시간이 올바르게 기록된다', async () => {
      // When - POST 요청으로 감사로그 생성
      const result =
        await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      // Then
      expect(result.auditLog.requestStartTime).toBeDefined();
      expect(result.auditLog.requestEndTime).toBeDefined();
      expect(result.auditLog.duration).toBeGreaterThanOrEqual(0);
      expect(
        new Date(result.auditLog.requestEndTime).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(result.auditLog.requestStartTime).getTime(),
      );
    });

    it('IP 주소가 올바르게 기록된다', async () => {
      // When - POST 요청으로 감사로그 생성
      const result =
        await auditLogScenario.WBS자기평가API를_호출하고_감사로그를_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      // Then
      expect(result.auditLog.requestIp).toBeDefined();
      // IPv4, IPv6, 또는 IPv4-mapped IPv6 형식 (::ffff:127.0.0.1) 허용
      expect(result.auditLog.requestIp).toMatch(
        /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::ffff:(\d{1,3}\.){3}\d{1,3}$/,
      );
    });
  });
});
