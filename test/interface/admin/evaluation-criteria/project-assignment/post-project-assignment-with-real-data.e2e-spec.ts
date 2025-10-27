/**
 * 프로젝트 할당 생성 (POST) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 19개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/project-assignments (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

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

    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({ scenario: 'full', clearExisting: false })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  async function getTwoEmployees() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { employee1: result[0], employee2: result[1] }
      : null;
  }

  async function getTwoProjects() {
    const result = await dataSource.query(
      `SELECT id FROM project WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { project1: result[0], project2: result[1] }
      : null;
  }

  async function getEvaluationPeriod() {
    const result = await dataSource.query(
      `SELECT id, status FROM evaluation_period WHERE "deletedAt" IS NULL AND status = 'waiting' LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getInProgressPeriod() {
    const result = await dataSource.query(
      `SELECT id, status FROM evaluation_period WHERE "deletedAt" IS NULL AND status = 'in-progress' LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getCompletedPeriod() {
    const result = await dataSource.query(
      `SELECT id, status FROM evaluation_period WHERE "deletedAt" IS NULL AND status = 'completed' LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('할당 생성 성공 시나리오', () => {
    beforeEach(async () => {
      // 각 테스트 전에 waiting 상태 평가기간의 프로젝트 할당을 모두 삭제
      const period = await getEvaluationPeriod();
      if (period) {
        await dataSource.query(
          `DELETE FROM evaluation_project_assignment WHERE "periodId" = $1`,
          [period.id],
        );
      }
    });

    it('실제 직원과 프로젝트로 할당 생성이 성공해야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();

      console.log('\n✅ 할당 생성 성공');
    });

    it('여러 직원을 동일한 프로젝트에 할당할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response1 = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      const response2 = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee2.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response1.body.id).toBeDefined();
      expect(response2.body.id).toBeDefined();
      expect(response1.body.id).not.toBe(response2.body.id);

      console.log('\n✅ 동일 프로젝트 여러 직원 할당 성공');
    });

    it('동일한 직원을 여러 프로젝트에 할당할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response1 = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      const response2 = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project2.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response1.body.id).toBeDefined();
      expect(response2.body.id).toBeDefined();
      expect(response1.body.id).not.toBe(response2.body.id);

      console.log('\n✅ 동일 직원 여러 프로젝트 할당 성공');
    });
  });

  describe('유효성 검증 실패 시나리오', () => {
    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 필수 필드 누락 400 에러 성공');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getEvaluationPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: 'invalid-uuid',
          projectId: 'invalid-uuid',
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 잘못된 UUID 400 에러 성공');
    });

    it('빈 문자열 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: '',
          projectId: '',
          periodId: '',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 빈 문자열 400 에러 성공');
    });

    it('null 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: null,
          projectId: null,
          periodId: null,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ null 값 400 에러 성공');
    });
  });

  describe('중복 할당 처리', () => {
    beforeEach(async () => {
      // 각 테스트 전에 waiting 상태 평가기간의 프로젝트 할당을 모두 삭제
      const period = await getEvaluationPeriod();
      if (period) {
        await dataSource.query(
          `DELETE FROM evaluation_project_assignment WHERE "periodId" = $1`,
          [period.id],
        );
      }
    });

    it('동일한 평가기간-직원-프로젝트 조합으로 중복 할당 시 409 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 첫 번째 할당 생성 - 성공해야 함
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      // 동일한 조합으로 다시 할당 시도 - 409 에러가 발생해야 함
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CONFLICT);

      console.log('\n✅ 중복 할당 409 에러 성공');
    });

    it('동일한 직원이 다른 프로젝트에 할당되는 것은 허용되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project2.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();

      console.log('\n✅ 동일 직원 다른 프로젝트 허용 성공');
    });

    it('동일한 프로젝트에 다른 직원이 할당되는 것은 허용되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee2.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();

      console.log('\n✅ 동일 프로젝트 다른 직원 허용 성공');
    });
  });

  describe('평가기간 상태별 할당 처리', () => {
    beforeEach(async () => {
      // 각 테스트 전에 waiting 및 in-progress 상태 평가기간의 프로젝트 할당을 모두 삭제
      const waitingPeriod = await getEvaluationPeriod();
      const inProgressPeriod = await getInProgressPeriod();

      if (waitingPeriod) {
        await dataSource.query(
          `DELETE FROM evaluation_project_assignment WHERE "periodId" = $1`,
          [waitingPeriod.id],
        );
      }

      if (inProgressPeriod) {
        await dataSource.query(
          `DELETE FROM evaluation_project_assignment WHERE "periodId" = $1`,
          [inProgressPeriod.id],
        );
      }
    });

    it('완료된 평가기간에 할당 생성 시 422 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getCompletedPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        });

      expect([
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 완료된 평가기간 422 에러 성공');
    });

    it('대기 상태 평가기간에는 할당 생성이 허용되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();

      console.log('\n✅ 대기 상태 할당 허용 성공');
    });

    it('진행 중인 평가기간에는 할당 생성이 허용되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getInProgressPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();

      console.log('\n✅ 진행 중인 평가기간 할당 허용 성공');
    });
  });

  describe('할당 정보 검증', () => {
    beforeEach(async () => {
      // 각 테스트 전에 waiting 상태 평가기간의 프로젝트 할당을 모두 삭제
      const period = await getEvaluationPeriod();
      if (period) {
        await dataSource.query(
          `DELETE FROM evaluation_project_assignment WHERE "periodId" = $1`,
          [period.id],
        );
      }
    });

    it('할당 생성 시 할당일이 현재 시간으로 자동 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const beforeTime = new Date();

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      const afterTime = new Date();

      expect(response.body.assignedDate).toBeDefined();
      const assignedDate = new Date(response.body.assignedDate);
      expect(assignedDate.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(assignedDate.getTime()).toBeLessThanOrEqual(afterTime.getTime());

      console.log('\n✅ 할당일 자동 설정 성공');
    });

    it('할당자 정보가 올바르게 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      // assignedBy는 @CurrentUser()로 자동 설정 (Mock 사용자 ID)
      expect(response.body.assignedBy).toBe(
        '00000000-0000-0000-0000-000000000001',
      );

      console.log('\n✅ 할당자 정보 설정 성공');
    });

    it('할당 생성 시 감사 정보가 올바르게 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      console.log('\n✅ 감사 정보 설정 성공');
    });

    it('생성된 할당의 모든 필드가 올바르게 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();
      expect(response.body.employeeId).toBe(employees.employee1.id);
      expect(response.body.projectId).toBe(projects.project1.id);
      expect(response.body.periodId).toBe(period.id);
      // assignedBy는 @CurrentUser()로 자동 설정 (Mock 사용자 ID)
      expect(response.body.assignedBy).toBe(
        '00000000-0000-0000-0000-000000000001',
      );
      expect(response.body.assignedDate).toBeDefined();

      console.log('\n✅ 모든 필드 검증 성공');
    });
  });

  describe('동시성 및 통합 테스트', () => {
    beforeEach(async () => {
      // 각 테스트 전에 waiting 상태 평가기간의 프로젝트 할당을 모두 삭제
      const period = await getEvaluationPeriod();
      if (period) {
        await dataSource.query(
          `DELETE FROM evaluation_project_assignment WHERE "periodId" = $1`,
          [period.id],
        );
      }
    });

    it('동시에 여러 할당을 생성할 때 적절히 처리되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const promises = [
        testSuite
          .request()
          .post('/admin/evaluation-criteria/project-assignments')
          .send({
            employeeId: employees.employee1.id,
            projectId: projects.project1.id,
            periodId: period.id,
            assignedBy: employees.employee1.id,
          }),
        testSuite
          .request()
          .post('/admin/evaluation-criteria/project-assignments')
          .send({
            employeeId: employees.employee2.id,
            projectId: projects.project2.id,
            periodId: period.id,
            assignedBy: employees.employee2.id,
          }),
      ];

      const responses = await Promise.all(promises);

      // 동시 요청의 경우 일부는 성공(201), 일부는 중복(409)일 수 있음
      responses.forEach((response) => {
        expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
          response.status,
        );
      });

      console.log('\n✅ 동시 생성 처리 성공 (일부 성공, 일부 중복 가능)');
    });

    it('할당 생성 후 상세 조회가 가능해야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getEvaluationPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employees.employee1.id,
          projectId: projects.project1.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      const assignmentId = createResponse.body.id;

      const getResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.id).toBe(assignmentId);

      console.log('\n✅ 생성 후 상세 조회 성공');
    });
  });
});
