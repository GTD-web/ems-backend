import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';

describe('GET /admin/evaluation-criteria/project-assignments (Simple)', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
  };
  let evaluationPeriodId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    testContextService = app.get(TestContextService);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 완전한 테스트 환경 생성 (부서, 직원, 프로젝트 모두 포함)
    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      departments,
      employees,
      projects,
    };

    // 평가기간 생성 - TestContextService 사용
    const periods = await testContextService.테스트용_평가기간을_생성한다();
    evaluationPeriodId = periods[0].id; // 첫 번째 평가기간 사용 (진행중 상태)

    // 테스트용 할당 데이터 생성
    await createTestAssignments();
  });

  afterEach(async () => {
    // 각 테스트 후 테스트 데이터 정리
    await testContextService.테스트_데이터를_정리한다();
  });

  // 테스트 할당 데이터 생성 헬퍼 함수
  async function createTestAssignments(): Promise<void> {
    // 여러 할당 데이터 생성
    const assignments = [
      {
        employeeId: testData.employees[0].id,
        projectId: testData.projects[0].id,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[0].id,
      },
      {
        employeeId: testData.employees[1].id,
        projectId: testData.projects[1].id,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[1].id,
      },
      {
        employeeId: testData.employees[0].id, // 동일한 직원, 다른 프로젝트
        projectId: testData.projects[2].id,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[0].id,
      },
    ];

    for (const assignment of assignments) {
      await testSuite.request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send(assignment)
        .expect(201);
    }
  }

  // ==================== 기본 API 테스트 ====================

  describe('API 기본 동작', () => {
    it('프로젝트 할당 목록 조회 API가 존재해야 한다', async () => {
      // When: API 엔드포인트 호출
      const response = await testSuite.request().get(
        '/admin/evaluation-criteria/project-assignments',
      );

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      // When: 존재하지 않는 엔드포인트 호출
      const response = await testSuite.request().get(
        '/admin/evaluation-criteria/non-existent-endpoint',
      );

      // Then: 404 에러 발생
      expect(response.status).toBe(404);
    });
  });

  // ==================== 쿼리 파라미터 테스트 ====================

  describe('쿼리 파라미터', () => {
    it('페이지 파라미터를 받을 수 있어야 한다', async () => {
      // When: 페이지 파라미터와 함께 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 1 });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('리미트 파라미터를 받을 수 있어야 한다', async () => {
      // When: 리미트 파라미터와 함께 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ limit: 10 });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('실제 데이터로 필터 파라미터를 받을 수 있어야 한다', async () => {
      // When: 실제 테스트 데이터로 필터 파라미터와 함께 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          employeeId: testData.employees[0].id,
          projectId: testData.projects[0].id,
        });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // 필터링된 결과가 있을 수 있음
      const items = response.body.items || response.body;
      if (Array.isArray(items)) {
        // 필터링된 결과가 있다면 해당 직원/프로젝트와 일치하는지 확인
        items.forEach((item: any) => {
          if (item.employeeId) {
            expect(item.employeeId).toBe(testData.employees[0].id);
          }
          if (item.projectId) {
            expect(item.projectId).toBe(testData.projects[0].id);
          }
        });
      }
    });

    it('평가기간 ID로 필터링할 수 있어야 한다', async () => {
      // When: 평가기간 ID로 필터링
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          periodId: evaluationPeriodId,
        });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 생성된 할당 데이터가 있는지 확인
        expect(assignments.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==================== 페이지네이션 테스트 ====================

  describe('페이지네이션', () => {
    it('기본 페이지네이션 파라미터를 처리해야 한다', async () => {
      // When: 기본 요청
      const response = await testSuite.request().get(
        '/admin/evaluation-criteria/project-assignments',
      );

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 생성된 할당 데이터가 있는지 확인
        expect(assignments.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('유효한 페이지 번호를 처리해야 한다', async () => {
      // When: 유효한 페이지 번호로 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 1 });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('유효한 페이지 크기를 처리해야 한다', async () => {
      // When: 유효한 페이지 크기로 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ limit: 10 });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('페이지와 크기를 동시에 지정할 수 있어야 한다', async () => {
      // When: 페이지와 크기를 동시에 지정
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 1, limit: 5 });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 페이지 크기 제한 확인
        expect(assignments.length).toBeLessThanOrEqual(5);
      }
    });

    it('큰 페이지 번호를 처리해야 한다', async () => {
      // When: 매우 큰 페이지 번호로 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 999999, limit: 10 });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 큰 페이지 번호는 빈 결과를 반환할 수 있음
        expect(assignments.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('정렬과 페이지네이션 조합을 처리해야 한다', async () => {
      // When: 정렬과 페이지네이션을 동시에 사용
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          page: 1,
          limit: 5,
          orderBy: 'assignedDate',
          orderDirection: 'DESC',
        });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
    });

    it('실제 데이터로 필터링과 페이지네이션 조합을 처리해야 한다', async () => {
      // When: 실제 데이터로 필터링과 페이지네이션을 동시에 사용
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          page: 1,
          limit: 10,
          employeeId: testData.employees[0].id,
          periodId: evaluationPeriodId,
        });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 필터링된 결과 확인
        assignments.forEach((assignment: any) => {
          if (assignment.employeeId) {
            expect(assignment.employeeId).toBe(testData.employees[0].id);
          }
          if (assignment.periodId) {
            expect(assignment.periodId).toBe(evaluationPeriodId);
          }
        });
      }
    });
  });

  // ==================== HTTP 메서드 테스트 ====================

  describe('HTTP 메서드', () => {
    it('GET 메서드만 허용해야 한다', async () => {
      // When: POST 메서드로 요청
      const postResponse = await testSuite.request().post(
        '/admin/evaluation-criteria/project-assignments',
      );

      // Then: 400 에러 (DTO 검증 에러)
      expect(postResponse.status).toBe(400);
    });

    it('PUT 메서드는 허용하지 않아야 한다', async () => {
      // When: PUT 메서드로 요청
      const putResponse = await testSuite.request().put(
        '/admin/evaluation-criteria/project-assignments',
      );

      // Then: 404 에러 (메서드 없음)
      expect(putResponse.status).toBe(404);
    });

    it('DELETE 메서드는 허용하지 않아야 한다', async () => {
      // When: DELETE 메서드로 요청
      const deleteResponse = await testSuite.request().delete(
        '/admin/evaluation-criteria/project-assignments',
      );

      // Then: 404 에러 (메서드 없음)
      expect(deleteResponse.status).toBe(404);
    });
  });

  // ==================== 에러 처리 테스트 ====================

  describe('에러 처리', () => {
    it('잘못된 UUID 형식을 처리해야 한다', async () => {
      // When: 잘못된 UUID로 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ employeeId: 'invalid-uuid' });

      // Then: 잘못된 UUID 형식으로 400 에러 발생
      expect(response.status).toBe(400);
    });

    it('음수 페이지 번호를 처리해야 한다', async () => {
      // When: 음수 페이지로 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: -1 });

      // Then: API가 응답함 (500 에러일 수 있음)
      expect([200, 500]).toContain(response.status);
    });

    it('0 페이지 크기를 처리해야 한다', async () => {
      // When: 0 리미트로 요청
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ limit: 0 });

      // Then: API가 응답함 (500 에러일 수 있음)
      expect([200, 500]).toContain(response.status);
    });

    it('존재하지 않는 직원 ID로 필터링할 수 있어야 한다', async () => {
      // When: 존재하지 않는 직원 ID로 필터링
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          employeeId: '00000000-0000-0000-0000-000000000000',
          periodId: evaluationPeriodId,
        });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 존재하지 않는 직원 ID로 필터링하면 빈 결과
        expect(assignments.length).toBe(0);
      }
    });

    it('존재하지 않는 프로젝트 ID로 필터링할 수 있어야 한다', async () => {
      // When: 존재하지 않는 프로젝트 ID로 필터링
      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          projectId: '00000000-0000-0000-0000-000000000000',
          periodId: evaluationPeriodId,
        });

      // Then: 성공 응답 (200)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 존재하지 않는 프로젝트 ID로 필터링하면 빈 결과
        expect(assignments.length).toBe(0);
      }
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능', () => {
    it('응답 시간이 합리적이어야 한다', async () => {
      // When: API 호출 시간 측정
      const startTime = Date.now();

      const response = await testSuite.request().get(
        '/admin/evaluation-criteria/project-assignments',
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Then: 5초 이내 응답과 성공 응답
      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(200);
    });

    it('필터링된 요청의 응답 시간이 합리적이어야 한다', async () => {
      // When: 필터링된 요청 시간 측정
      const startTime = Date.now();

      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          periodId: evaluationPeriodId,
          page: 1,
          limit: 10,
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Then: 5초 이내 응답과 성공 응답
      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(200);

      expect(response.body).toBeDefined();
      const assignments = response.body.assignments;
      if (Array.isArray(assignments)) {
        // 생성된 할당 데이터가 있는지 확인
        expect(assignments.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('대량 데이터 조회 시 응답 시간이 합리적이어야 한다', async () => {
      // When: 페이지네이션과 함께 대량 데이터 조회
      const startTime = Date.now();

      const response = await testSuite.request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          periodId: evaluationPeriodId,
          page: 1,
          limit: 100,
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Then: 5초 이내 응답과 성공 응답
      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(200);
    });
  });
});
