import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';

describe('GET /admin/evaluation-criteria/project-assignments/employees/:employeeId/periods/:periodId (직원 프로젝트 할당 목록)', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let testContextService: TestContextService;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    testContextService = app.get(TestContextService);
  });

  afterAll(async () => {
    // 모든 테스트 완료 후 데이터 정리
    console.log('=== 전체 테스트 완료 후 데이터 정리 ===');
    if (testContextService) {
      await testContextService.모든_테스트데이터를_삭제한다();
    }
    await testSuite.closeApp();
  });

  // 각 테스트마다 독립적인 테스트 데이터 생성 헬퍼 함수
  async function createIndependentTestData(): Promise<{
    testData: {
      departments: DepartmentDto[];
      employees: EmployeeDto[];
      projects: ProjectDto[];
    };
    evaluationPeriodId: string;
    createdAssignmentIds: string[];
  }> {
    console.log('=== 독립적인 테스트 데이터 생성 시작 ===');

    // 먼저 기존 데이터 정리
    await cleanupTestData();

    // 1. 완전한 테스트 환경 생성 (중복 방지를 위해 한 번에 생성)
    console.log('1. 완전한 테스트 환경 생성 중...');
    const testEnvironment =
      await testContextService.완전한_테스트환경을_생성한다();

    const testData = {
      departments: testEnvironment.departments,
      employees: testEnvironment.employees,
      projects: testEnvironment.projects,
    };

    console.log(
      `테스트 환경 생성 완료 - 부서: ${testData.departments.length}, 직원: ${testData.employees.length}, 프로젝트: ${testData.projects.length}`,
    );

    // 2. 평가기간 생성 (고유한 날짜 범위로)
    console.log('2. 평가기간 생성 중...');
    const timestamp = Date.now();
    const uniqueId = Math.floor(Math.random() * 10000); // 0~9999 랜덤 숫자
    const year = 2030 + Math.floor(uniqueId % 50); // 2030~2079 사이의 연도
    const month = Math.floor((uniqueId % 12) + 1)
      .toString()
      .padStart(2, '0'); // 01~12 월
    const day = Math.floor((uniqueId % 28) + 1)
      .toString()
      .padStart(2, '0'); // 01~28 일
    const evaluationPeriodData = {
      name: `테스트 평가기간 ${timestamp}-${uniqueId}`,
      startDate: `${year}-${month}-${day}`,
      peerEvaluationDeadline: `${year}-${month}-${Math.min(
        parseInt(day) + 20,
        28,
      )
        .toString()
        .padStart(2, '0')}`, // 20일 후 (최대 28일)
      description: `독립적인 테스트용 평가기간 ${timestamp}-${uniqueId}`,
      maxSelfEvaluationRate: 120,
    };

    const evaluationPeriodResponse = await request(app.getHttpServer())
      .post('/admin/evaluation-periods')
      .send(evaluationPeriodData)
      .expect(201);

    const evaluationPeriodId = evaluationPeriodResponse.body.id;

    // 3. 여러 프로젝트 할당 데이터 생성 (한 직원에게 여러 프로젝트 할당)
    console.log('3. 여러 프로젝트 할당 데이터 생성 중...');
    const targetEmployee = testData.employees[0];
    const assignedBy = targetEmployee.id;
    const createdAssignmentIds: string[] = [];

    // 첫 번째 프로젝트 할당
    const assignment1Data = {
      employeeId: targetEmployee.id,
      projectId: testData.projects[0].id,
      periodId: evaluationPeriodId,
      assignedBy: assignedBy,
    };

    const assignment1Response = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/project-assignments')
      .send(assignment1Data)
      .expect(201);

    createdAssignmentIds.push(assignment1Response.body.id);

    // 두 번째 프로젝트 할당 (프로젝트가 2개 이상 있는 경우)
    if (testData.projects.length > 1) {
      const assignment2Data = {
        employeeId: targetEmployee.id,
        projectId: testData.projects[1].id,
        periodId: evaluationPeriodId,
        assignedBy: assignedBy,
      };

      const assignment2Response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/project-assignments')
        .send(assignment2Data)
        .expect(201);

      createdAssignmentIds.push(assignment2Response.body.id);
    }

    console.log('=== 독립적인 테스트 데이터 생성 완료 ===');
    console.log(`할당 ID들: ${createdAssignmentIds.join(', ')}`);
    console.log(`대상 직원 ID: ${targetEmployee.id}`);
    console.log(`평가기간 ID: ${evaluationPeriodId}`);

    return {
      testData,
      evaluationPeriodId,
      createdAssignmentIds,
    };
  }

  // 테스트 데이터 정리 헬퍼 함수
  async function cleanupTestData(): Promise<void> {
    try {
      await testContextService.모든_테스트데이터를_삭제한다();
      console.log('테스트 데이터 정리 완료');
    } catch (error) {
      console.warn('테스트 데이터 정리 중 오류:', error.message);
      // 개별적으로 정리 시도
      const { DataSource } = require('typeorm');
      const dataSource = app.get(DataSource);

      try {
        // 할당 관련 데이터 정리
        await dataSource.query(
          'DELETE FROM evaluation_project_assignment WHERE "deletedAt" IS NULL',
        );
        await dataSource.query(
          'DELETE FROM evaluation_period WHERE "deletedAt" IS NULL',
        );
        console.log('개별 테스트 데이터 정리 완료');
      } catch (cleanupError) {
        console.warn('개별 데이터 정리도 실패:', cleanupError.message);
      }
    }
  }

  // ==================== 기본 API 테스트 ====================

  describe('API 기본 동작', () => {
    it('직원 프로젝트 할당 목록 조회 API가 존재해야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId } =
        await createIndependentTestData();

      try {
        // When: 직원 프로젝트 할당 목록 조회 API 엔드포인트 호출
        const response = await request(app.getHttpServer()).get(
          `/admin/evaluation-criteria/project-assignments/employees/${testData.employees[0].id}/periods/${evaluationPeriodId}`,
        );

        // Then: 성공 응답 (200)
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.projects).toBeDefined();
        expect(Array.isArray(response.body.projects)).toBe(true);
      } finally {
        await cleanupTestData();
      }
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      // When: 존재하지 않는 엔드포인트 호출
      const response = await request(app.getHttpServer()).get(
        '/admin/evaluation-criteria/project-assignments/employees/invalid-path',
      );

      // Then: 404 에러 발생
      expect(response.status).toBe(404);
    });
  });

  // ==================== 응답 데이터 구조 검증 ====================

  describe('응답 데이터 구조 검증', () => {
    it('정상적인 직원 ID와 평가기간 ID로 할당된 프로젝트 목록을 조회할 수 있다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId } =
        await createIndependentTestData();

      try {
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/employees/${testData.employees[0].id}/periods/${evaluationPeriodId}`,
          )
          .expect(200);

        console.log('=== API 응답 구조 확인 ===');
        console.log('Response body:', JSON.stringify(response.body, null, 2));

        const result = response.body;

        // 기본 응답 구조 검증
        expect(result).toBeDefined();
        expect(result.projects).toBeDefined();
        expect(Array.isArray(result.projects)).toBe(true);

        console.log(`할당된 프로젝트 수: ${result.projects.length}`);

        // 프로젝트가 할당된 경우 구조 검증
        if (result.projects.length > 0) {
          const project = result.projects[0];

          // 프로젝트 기본 필드 검증
          expect(project.id).toBeDefined();
          expect(project.name).toBeDefined();
          expect(project.projectCode).toBeDefined();
          expect(project.status).toBeDefined();

          console.log(`✓ 프로젝트 ID: ${project.id}`);
          console.log(`✓ 프로젝트명: ${project.name}`);
          console.log(`✓ 프로젝트 코드: ${project.projectCode}`);
          console.log(`✓ 상태: ${project.status}`);

          // 날짜 필드 검증 (선택적 필드)
          if (project.startDate) {
            expect(project.startDate).toMatch(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
            );
            console.log(`✓ 시작일: ${project.startDate}`);
          }

          if (project.endDate) {
            expect(project.endDate).toMatch(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
            );
            console.log(`✓ 종료일: ${project.endDate}`);
          }

          // 상태 값 검증
          if (project.status) {
            expect([
              'PLANNING',
              'IN_PROGRESS',
              'COMPLETED',
              'ON_HOLD',
              'CANCELLED',
              'ACTIVE',
            ]).toContain(project.status);
          }

          // 설명 필드 검증 (선택적)
          if (project.description) {
            expect(typeof project.description).toBe('string');
            console.log(`✓ 설명: ${project.description}`);
          }
        }

        console.log('✅ 직원 프로젝트 할당 목록 조회 성공');
      } finally {
        // 테스트 후 데이터 정리
        await cleanupTestData();
      }
    });

    it('여러 프로젝트가 할당된 직원의 경우 모든 프로젝트가 반환되어야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId, createdAssignmentIds } =
        await createIndependentTestData();

      try {
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/employees/${testData.employees[0].id}/periods/${evaluationPeriodId}`,
          )
          .expect(200);

        const result = response.body;

        console.log('=== 여러 프로젝트 할당 검증 ===');
        console.log(`생성된 할당 수: ${createdAssignmentIds.length}`);
        console.log(`응답된 프로젝트 수: ${result.projects.length}`);

        // 할당된 프로젝트 수만큼 반환되어야 함
        expect(result.projects.length).toBe(createdAssignmentIds.length);

        // 각 프로젝트가 고유해야 함
        const projectIds = result.projects.map((p) => p.id);
        const uniqueProjectIds = [...new Set(projectIds)];
        expect(uniqueProjectIds.length).toBe(projectIds.length);

        console.log('✅ 여러 프로젝트 할당 검증 완료');
      } finally {
        await cleanupTestData();
      }
    });

    it('프로젝트가 할당되지 않은 직원의 경우 빈 배열이 반환되어야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId } =
        await createIndependentTestData();

      try {
        // 할당되지 않은 다른 직원 사용 (두 번째 직원)
        const unassignedEmployee = testData.employees[1];

        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/employees/${unassignedEmployee.id}/periods/${evaluationPeriodId}`,
          )
          .expect(200);

        const result = response.body;

        console.log('=== 할당되지 않은 직원 검증 ===');
        console.log(`응답된 프로젝트 수: ${result.projects.length}`);

        // 빈 배열이 반환되어야 함
        expect(result.projects).toBeDefined();
        expect(Array.isArray(result.projects)).toBe(true);
        expect(result.projects.length).toBe(0);

        console.log('✅ 할당되지 않은 직원 검증 완료');
      } finally {
        await cleanupTestData();
      }
    });

    it('정상 조회 시 필수 데이터가 모두 존재해야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId } =
        await createIndependentTestData();

      try {
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/employees/${testData.employees[0].id}/periods/${evaluationPeriodId}`,
          )
          .expect(200);

        const result = response.body;
        console.log('=== 필수 데이터 존재 검증 ===');

        // 기본 응답 구조 검증
        expect(result).toBeDefined();
        expect(result.projects).toBeDefined();
        expect(Array.isArray(result.projects)).toBe(true);
        console.log(`✓ projects 배열 존재: ${result.projects.length}개`);

        // 프로젝트가 있는 경우 필수 필드 검증
        if (result.projects.length > 0) {
          result.projects.forEach((project, index) => {
            console.log(`=== 프로젝트 ${index + 1} 검증 ===`);

            // 필수 필드들은 반드시 존재해야 함
            expect(project.id).toBeDefined();
            expect(project.id).not.toBeNull();
            console.log(`✓ id: ${project.id}`);

            expect(project.name).toBeDefined();
            expect(project.name).not.toBeNull();
            console.log(`✓ name: ${project.name}`);

            expect(project.projectCode).toBeDefined();
            expect(project.projectCode).not.toBeNull();
            console.log(`✓ projectCode: ${project.projectCode}`);

            expect(project.status).toBeDefined();
            expect(project.status).not.toBeNull();
            console.log(`✓ status: ${project.status}`);

            // 선택적 필드들 검증
            const optionalFields = ['startDate', 'endDate', 'description'];
            optionalFields.forEach((field) => {
              if (project[field] !== undefined && project[field] !== null) {
                console.log(`✓ ${field}: ${project[field]} (존재함)`);
              } else {
                console.log(`- ${field}: ${project[field]} (선택적 필드)`);
              }
            });
          });
        }

        console.log('✅ 모든 필수 데이터 존재 검증 완료');
      } finally {
        await cleanupTestData();
      }
    });
  });

  // ==================== 에러 처리 테스트 ====================

  describe('에러 처리', () => {
    it('존재하지 않는 직원 ID로 조회 시 적절한 응답이 반환되어야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { evaluationPeriodId } = await createIndependentTestData();

      try {
        // When: 존재하지 않는 직원 UUID로 조회
        const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer()).get(
          `/admin/evaluation-criteria/project-assignments/employees/${nonExistentEmployeeId}/periods/${evaluationPeriodId}`,
        );

        console.log('존재하지 않는 직원 ID 조회 응답:', {
          status: response.status,
          body: response.body,
        });

        // Then: API 실제 동작에 따른 검증
        if (response.status === 200) {
          // API가 200과 빈 프로젝트 배열을 반환하는 경우 (실제 동작)
          expect(response.body.projects).toBeDefined();
          expect(Array.isArray(response.body.projects)).toBe(true);
          expect(response.body.projects.length).toBe(0);
          console.log(
            '✅ 존재하지 않는 직원 ID 조회 시 200 + 빈 배열 반환 확인',
          );
        } else if (response.status === 404) {
          // API가 404를 반환하는 경우
          expect(response.status).toBe(404);
          if (response.body.message) {
            expect(response.body.message).toContain('찾을 수 없습니다');
          }
          console.log('✅ 존재하지 않는 직원 ID 조회 시 404 에러 확인');
        } else {
          // 예상하지 못한 응답
          fail(
            `예상하지 못한 응답: ${response.status}, body: ${JSON.stringify(response.body)}`,
          );
        }
      } finally {
        await cleanupTestData();
      }
    });

    it('존재하지 않는 평가기간 ID로 조회 시 적절한 응답이 반환되어야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData } = await createIndependentTestData();

      try {
        // When: 존재하지 않는 평가기간 UUID로 조회
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer()).get(
          `/admin/evaluation-criteria/project-assignments/employees/${testData.employees[0].id}/periods/${nonExistentPeriodId}`,
        );

        console.log('존재하지 않는 평가기간 ID 조회 응답:', {
          status: response.status,
          body: response.body,
        });

        // Then: API 실제 동작에 따른 검증
        if (response.status === 200) {
          // API가 200과 빈 프로젝트 배열을 반환하는 경우
          expect(response.body.projects).toBeDefined();
          expect(Array.isArray(response.body.projects)).toBe(true);
          expect(response.body.projects.length).toBe(0);
          console.log(
            '✅ 존재하지 않는 평가기간 ID 조회 시 200 + 빈 배열 반환 확인',
          );
        } else if (response.status === 404) {
          // API가 404를 반환하는 경우
          expect(response.status).toBe(404);
          console.log('✅ 존재하지 않는 평가기간 ID 조회 시 404 에러 확인');
        } else {
          // 예상하지 못한 응답
          fail(
            `예상하지 못한 응답: ${response.status}, body: ${JSON.stringify(response.body)}`,
          );
        }
      } finally {
        await cleanupTestData();
      }
    });

    it('잘못된 UUID 형식으로 조회 시 400 또는 500 에러가 발생해야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { evaluationPeriodId } = await createIndependentTestData();

      try {
        // When: 잘못된 UUID 형식으로 조회
        const invalidEmployeeId = 'invalid-uuid-format';
        const response = await request(app.getHttpServer()).get(
          `/admin/evaluation-criteria/project-assignments/employees/${invalidEmployeeId}/periods/${evaluationPeriodId}`,
        );

        // Then: 400 또는 500 에러 발생 (구현에 따라 다름)
        expect([400, 500]).toContain(response.status);
      } finally {
        await cleanupTestData();
      }
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능 테스트', () => {
    it('응답 시간이 1초 이내여야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId } =
        await createIndependentTestData();

      try {
        // When: API 호출 시간 측정
        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/employees/${testData.employees[0].id}/periods/${evaluationPeriodId}`,
          )
          .expect(200);
        const endTime = Date.now();

        const responseTime = endTime - startTime;
        console.log(`응답 시간: ${responseTime}ms`);

        // Then: 1초(1000ms) 이내 응답
        expect(responseTime).toBeLessThan(1000);
        expect(response.body.projects).toBeDefined();
      } finally {
        await cleanupTestData();
      }
    });

    it('대량의 프로젝트 할당이 있어도 성능이 유지되어야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId } =
        await createIndependentTestData();

      try {
        // 추가 프로젝트 할당 생성 (성능 테스트용)
        const targetEmployee = testData.employees[0];
        const assignedBy = targetEmployee.id;

        // 가능한 모든 프로젝트에 할당
        for (let i = 2; i < testData.projects.length && i < 5; i++) {
          const assignmentData = {
            employeeId: targetEmployee.id,
            projectId: testData.projects[i].id,
            periodId: evaluationPeriodId,
            assignedBy: assignedBy,
          };

          await request(app.getHttpServer())
            .post('/admin/evaluation-criteria/project-assignments')
            .send(assignmentData)
            .expect(201);
        }

        // When: API 호출 시간 측정
        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/employees/${targetEmployee.id}/periods/${evaluationPeriodId}`,
          )
          .expect(200);
        const endTime = Date.now();

        const responseTime = endTime - startTime;
        console.log(`대량 데이터 응답 시간: ${responseTime}ms`);
        console.log(`반환된 프로젝트 수: ${response.body.projects.length}`);

        // Then: 1.5초(1500ms) 이내 응답 (대량 데이터 고려)
        expect(responseTime).toBeLessThan(1500);
        expect(response.body.projects.length).toBeGreaterThan(0);
      } finally {
        await cleanupTestData();
      }
    });
  });
});
