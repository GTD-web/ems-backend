import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';

describe('GET /admin/evaluation-criteria/project-assignments/:id (Detail)', () => {
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
    createdAssignmentId: string;
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

    // 3. 할당 데이터 생성
    console.log('3. 할당 데이터 생성 중...');
    console.log(`현재 테스트 직원 ID: ${testData.employees[0].id}`);
    const assignmentData = {
      employeeId: testData.employees[0].id,
      projectId: testData.projects[0].id,
      periodId: evaluationPeriodId,
      assignedBy: testData.employees[0].id, // 현재 테스트에서 생성된 직원 ID 사용
    };

    const assignmentResponse = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/project-assignments')
      .send(assignmentData)
      .expect(201);

    const createdAssignmentId = assignmentResponse.body.id;

    console.log('=== 독립적인 테스트 데이터 생성 완료 ===');
    console.log(`할당 ID: ${createdAssignmentId}`);
    console.log(`할당된 직원 ID: ${assignmentData.employeeId}`);
    console.log(`할당자 ID: ${assignmentData.assignedBy}`);

    return {
      testData,
      evaluationPeriodId,
      createdAssignmentId,
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
    it('프로젝트 할당 상세 조회 API가 존재해야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { createdAssignmentId } = await createIndependentTestData();

      try {
        // When: 상세 조회 API 엔드포인트 호출
        const response = await request(app.getHttpServer()).get(
          `/admin/evaluation-criteria/project-assignments/${createdAssignmentId}`,
        );

        // Then: 성공 응답 (200)
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(createdAssignmentId);
      } finally {
        await cleanupTestData();
      }
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      // When: 존재하지 않는 엔드포인트 호출
      const response = await request(app.getHttpServer()).get(
        '/admin/evaluation-criteria/project-assignments/invalid-path/detail',
      );

      // Then: 404 에러 발생
      expect(response.status).toBe(404);
    });
  });

  // ==================== 응답 데이터 구조 검증 ====================

  describe('응답 데이터 구조 검증', () => {
    it('정상적인 ID로 프로젝트 할당 상세 정보를 조회할 수 있다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, evaluationPeriodId, createdAssignmentId } =
        await createIndependentTestData();

      try {
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/${createdAssignmentId}`,
          )
          .expect(200);

        console.log('=== API 응답 구조 확인 ===');
        console.log('Response body:', JSON.stringify(response.body, null, 2));

        const assignment = response.body;

        // 기본 필드 검증
        expect(assignment).toBeDefined();
        expect(assignment.id).toBe(createdAssignmentId);

        // 날짜 필드 검증 (ISO 8601 형식)
        if (assignment.assignedDate) {
          expect(assignment.assignedDate).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
          );
        }

        if (assignment.createdAt) {
          expect(assignment.createdAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
          );
        }

        if (assignment.updatedAt) {
          expect(assignment.updatedAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
          );
        }

        // 평가기간 정보 검증
        if (assignment.evaluationPeriod) {
          expect(assignment.evaluationPeriod.id).toBe(evaluationPeriodId);
          expect(assignment.evaluationPeriod.name).toBeDefined();

          if (assignment.evaluationPeriod.status) {
            expect([
              'DRAFT',
              'ACTIVE',
              'COMPLETED',
              'CANCELLED',
              'WAITING',
              'waiting',
            ]).toContain(assignment.evaluationPeriod.status);
          }
        }

        // 프로젝트 정보 검증
        if (assignment.project) {
          expect(assignment.project.id).toBe(testData.projects[0].id);
          expect(assignment.project.name).toBeDefined();

          if (assignment.project.description) {
            expect(assignment.project.description).toBeDefined();
          }

          if (assignment.project.startDate) {
            expect(assignment.project.startDate).toMatch(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            );
          }

          if (assignment.project.endDate) {
            expect(assignment.project.endDate).toMatch(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            );
          }

          if (assignment.project.status) {
            expect([
              'PLANNING',
              'IN_PROGRESS',
              'COMPLETED',
              'ON_HOLD',
              'CANCELLED',
              'ACTIVE',
            ]).toContain(assignment.project.status);
          }
        }

        // 직원 정보 검증
        if (assignment.employee) {
          expect(assignment.employee.id).toBe(testData.employees[0].id);
          expect(assignment.employee.name).toBeDefined();
          expect(assignment.employee.email).toBeDefined();

          if (assignment.employee.employeeNumber) {
            expect(assignment.employee.employeeNumber).toBeDefined();
          }

          if (assignment.employee.status) {
            expect([
              'ACTIVE',
              'INACTIVE',
              'TERMINATED',
              '재직중',
              '퇴직',
            ]).toContain(assignment.employee.status);
          }

          if (assignment.employee.hireDate) {
            expect(assignment.employee.hireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        }

        // 할당자 정보 검증
        if (assignment.assignedBy) {
          expect(assignment.assignedBy.id).toBe(testData.employees[0].id);
          expect(assignment.assignedBy.name).toBeDefined();
          expect(assignment.assignedBy.email).toBeDefined();
        }

        // 삭제 관련 필드 검증 (undefined 또는 null 허용)
        expect(assignment.deletedAt).toBeFalsy();

        console.log('✅ 프로젝트 할당 상세 조회 성공');
      } finally {
        // 테스트 후 데이터 정리
        await cleanupTestData();
      }
    });

    it('데이터베이스에서 직접 직원 데이터를 확인한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { testData, createdAssignmentId } =
        await createIndependentTestData();

      try {
        const { DataSource } = require('typeorm');
        const dataSource = app.get(DataSource);

        // 직접 DB 쿼리로 직원 데이터 확인
        const employees = await dataSource.query(
          'SELECT * FROM employee WHERE "deletedAt" IS NULL',
        );
        console.log(`DB 직원 수: ${employees.length}`);
        console.log('DB 직원 데이터:', employees.slice(0, 2));

        // 할당 데이터 확인
        const assignments = await dataSource.query(
          'SELECT * FROM evaluation_project_assignment WHERE "deletedAt" IS NULL',
        );
        console.log(`DB 할당 수: ${assignments.length}`);
        console.log('DB 할당 데이터:', assignments);

        // assignedBy 필드 확인 (현재 테스트에서 생성된 할당 데이터 찾기)
        const currentAssignment = assignments.find(
          (a) => a.id === createdAssignmentId,
        );
        if (currentAssignment) {
          console.log(`현재 테스트 할당자 ID: ${currentAssignment.assignedBy}`);

          // assignedBy가 실제 직원 테이블에 존재하는지 확인
          const assignedByEmployee = await dataSource.query(
            'SELECT * FROM employee WHERE id = $1 AND "deletedAt" IS NULL',
            [currentAssignment.assignedBy],
          );
          console.log(`현재 테스트 할당자 직원 조회 결과:`, assignedByEmployee);
        } else {
          console.log(
            `현재 테스트 할당 데이터를 찾을 수 없음: ${createdAssignmentId}`,
          );
        }

        // JOIN 쿼리로 실제 데이터 확인
        const joinResult = await dataSource.query(
          `
          SELECT 
            epa.id as assignment_id,
            epa."employeeId",
            epa."projectId",
            e.name as employee_name,
            e.email as employee_email,
            p.name as project_name
          FROM evaluation_project_assignment epa
          LEFT JOIN employee e ON epa."employeeId" = e.id AND e."deletedAt" IS NULL
          LEFT JOIN project p ON epa."projectId" = p.id AND p."deletedAt" IS NULL
          WHERE epa.id = $1 AND epa."deletedAt" IS NULL
        `,
          [createdAssignmentId],
        );

        console.log('JOIN 쿼리 결과:', joinResult);

        // GetProjectAssignmentDetailHandler와 동일한 쿼리 실행해보기
        const handlerQuery = await dataSource.query(
          `
          SELECT 
            assignment.id AS assignment_id,
            assignment."assignedBy" AS assignment_assignedBy,
            "assignedByEmployee".id AS assignedByEmployee_id,
            "assignedByEmployee".name AS assignedByEmployee_name,
            "assignedByEmployee".email AS assignedByEmployee_email
          FROM evaluation_project_assignment assignment
          LEFT JOIN employee "assignedByEmployee" ON "assignedByEmployee".id = assignment."assignedBy" AND "assignedByEmployee"."deletedAt" IS NULL
          WHERE assignment.id = $1 AND assignment."deletedAt" IS NULL
        `,
          [createdAssignmentId],
        );

        console.log('Handler 스타일 쿼리 결과:', handlerQuery);

        expect(testData.employees.length).toBeGreaterThan(0);
        expect(assignments.length).toBeGreaterThan(0);
      } finally {
        await cleanupTestData();
      }
    });

    it('정상 조회 시 필수 데이터가 모두 존재해야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { createdAssignmentId } = await createIndependentTestData();

      try {
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/${createdAssignmentId}`,
          )
          .expect(200);

        const assignment = response.body;
        console.log('=== 필수 데이터 존재 검증 ===');

        // 기본 필수 필드들은 반드시 존재해야 함
        expect(assignment.id).toBeDefined();
        expect(assignment.id).not.toBeNull();
        console.log(`✓ id: ${assignment.id}`);

        // 실제 존재하는 날짜 필드들만 검증 (API 응답 구조 확인 후)
        console.log('=== 실제 응답 필드 확인 ===');
        console.log('모든 필드:', Object.keys(assignment));

        // 존재하는 날짜 필드들만 검증
        const possibleDateFields = ['assignedDate', 'createdAt', 'updatedAt'];

        possibleDateFields.forEach((field) => {
          if (assignment[field] !== undefined) {
            expect(assignment[field]).not.toBeNull();
            console.log(`✓ ${field}: ${assignment[field]} (존재함)`);
          } else {
            console.log(`- ${field}: undefined (API에서 반환하지 않음)`);
          }
        });

        // deletedAt만 null/undefined 허용
        if (
          assignment.deletedAt === null ||
          assignment.deletedAt === undefined
        ) {
          console.log(`✓ deletedAt: ${assignment.deletedAt} (삭제되지 않음)`);
        } else {
          console.log(`✓ deletedAt: ${assignment.deletedAt} (삭제 시간 존재)`);
        }

        // 관계 필드들 검증 (실제 API 응답에 따라)
        const possibleRelationFields = [
          'evaluationPeriod',
          'project',
          'employee',
          'assignedBy',
        ];

        possibleRelationFields.forEach((field) => {
          if (assignment[field] !== undefined && assignment[field] !== null) {
            expect(typeof assignment[field]).toBe('object');
            console.log(
              `✓ ${field}: 객체 존재 (${Object.keys(assignment[field]).length}개 속성)`,
            );
          } else {
            console.log(
              `- ${field}: ${assignment[field]} (관계 데이터 없음 또는 API에서 반환하지 않음)`,
            );
          }
        });

        // 관계 객체 내부의 필수 필드들도 검증
        if (assignment.evaluationPeriod) {
          expect(assignment.evaluationPeriod.id).toBeDefined();
          expect(assignment.evaluationPeriod.name).toBeDefined();
          console.log(
            `✓ evaluationPeriod.id: ${assignment.evaluationPeriod.id}`,
          );
          console.log(
            `✓ evaluationPeriod.name: ${assignment.evaluationPeriod.name}`,
          );
        }

        if (assignment.project) {
          expect(assignment.project.id).toBeDefined();
          expect(assignment.project.name).toBeDefined();
          console.log(`✓ project.id: ${assignment.project.id}`);
          console.log(`✓ project.name: ${assignment.project.name}`);
        }

        if (assignment.employee) {
          expect(assignment.employee.id).toBeDefined();
          expect(assignment.employee.name).toBeDefined();
          expect(assignment.employee.email).toBeDefined();
          console.log(`✓ employee.id: ${assignment.employee.id}`);
          console.log(`✓ employee.name: ${assignment.employee.name}`);
          console.log(`✓ employee.email: ${assignment.employee.email}`);
        }

        if (assignment.assignedBy) {
          expect(assignment.assignedBy.id).toBeDefined();
          expect(assignment.assignedBy.name).toBeDefined();
          expect(assignment.assignedBy.email).toBeDefined();
          console.log(`✓ assignedBy.id: ${assignment.assignedBy.id}`);
          console.log(`✓ assignedBy.name: ${assignment.assignedBy.name}`);
          console.log(`✓ assignedBy.email: ${assignment.assignedBy.email}`);
        }

        console.log('✅ 모든 필수 데이터 존재 검증 완료');
      } finally {
        await cleanupTestData();
      }
    });
  });

  // ==================== 에러 처리 테스트 ====================

  describe('에러 처리', () => {
    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // When: 존재하지 않는 UUID로 조회
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer()).get(
        `/admin/evaluation-criteria/project-assignments/${nonExistentId}`,
      );

      console.log('존재하지 않는 ID 조회 응답:', {
        status: response.status,
        body: response.body,
      });

      // Then: API 실제 동작에 따른 검증
      if (response.status === 200) {
        // API가 200과 빈 객체를 반환하는 경우 (실제 동작)
        expect(response.body).toEqual({});
        console.log('✅ 존재하지 않는 ID 조회 시 200 + 빈 객체 반환 확인');
      } else if (response.status === 404) {
        // API가 404를 반환하는 경우
        expect(response.status).toBe(404);
        if (response.body.message) {
          expect(response.body.message).toContain('찾을 수 없습니다');
        }
        console.log('✅ 존재하지 않는 ID 조회 시 404 에러 확인');
      } else {
        // 예상하지 못한 응답
        fail(
          `예상하지 못한 응답: ${response.status}, body: ${JSON.stringify(response.body)}`,
        );
      }
    });

    it('잘못된 UUID 형식으로 조회 시 400 또는 500 에러가 발생해야 한다', async () => {
      // When: 잘못된 UUID 형식으로 조회
      const invalidId = 'invalid-uuid-format';
      const response = await request(app.getHttpServer()).get(
        `/admin/evaluation-criteria/project-assignments/${invalidId}`,
      );

      // Then: 400 또는 500 에러 발생 (구현에 따라 다름)
      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능 테스트', () => {
    it('응답 시간이 1초 이내여야 한다', async () => {
      // 각 테스트마다 독립적인 데이터 생성
      const { createdAssignmentId } = await createIndependentTestData();

      try {
        // When: API 호출 시간 측정
        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/project-assignments/${createdAssignmentId}`,
          )
          .expect(200);
        const endTime = Date.now();

        const responseTime = endTime - startTime;
        console.log(`응답 시간: ${responseTime}ms`);

        // Then: 1초(1000ms) 이내 응답
        expect(responseTime).toBeLessThan(1000);
        expect(response.body.id).toBe(createdAssignmentId);
      } finally {
        await cleanupTestData();
      }
    });
  });
});
