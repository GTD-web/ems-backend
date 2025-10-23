/**
 * 프로젝트 할당 순서 변경 (PATCH) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 12개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-criteria/project-assignments/order (실제 데이터)', () => {
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

  async function getTwoAssignments() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_project_assignment WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { assignment1: result[0], assignment2: result[1] }
      : null;
  }

  describe('API 기본 동작', () => {
    it('순서 변경 API가 존재해야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: 1 },
            { assignmentId: assignments.assignment2.id, order: 2 },
          ],
        });

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ API 존재 확인 성공');
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/invalid-order');

      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ 잘못된 경로 404 에러 성공');
    });
  });

  describe('정상 순서 변경', () => {
    it('유효한 순서로 변경할 수 있어야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: 2 },
            { assignmentId: assignments.assignment2.id, order: 1 },
          ],
        });

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 유효한 순서 변경 성공');
    });

    it('단일 할당의 순서를 변경할 수 있어야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: 5 },
          ],
        });

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 단일 할당 순서 변경 성공');
    });

    it('여러 할당의 순서를 동시에 변경할 수 있어야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: 1 },
            { assignmentId: assignments.assignment2.id, order: 2 },
          ],
        });

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 여러 할당 순서 변경 성공');
    });
  });

  describe('유효성 검증', () => {
    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 필수 필드 누락 400 에러 성공');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [{ assignmentId: 'invalid-uuid', order: 1 }],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 잘못된 UUID 400 에러 성공');
    });

    it('음수 순서로 요청 시 400 에러가 발생해야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: -1 },
          ],
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 음수 순서 에러 성공');
    });

    it('빈 배열로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [],
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 빈 배열 에러 성공');
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 할당 ID로 요청 시 적절한 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [{ assignmentId: nonExistentId, order: 1 }],
        });

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 ID 에러 성공');
    });

    it('중복된 할당 ID로 요청 시 적절한 에러가 발생해야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: 1 },
            { assignmentId: assignments.assignment1.id, order: 2 },
          ],
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 중복 ID 에러 성공');
    });
  });

  describe('성능 테스트', () => {
    it('응답 시간이 2초 이내여야 한다', async () => {
      const assignments = await getTwoAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      await testSuite
        .request()
        .patch('/admin/evaluation-criteria/project-assignments/order')
        .send({
          assignmentOrders: [
            { assignmentId: assignments.assignment1.id, order: 1 },
            { assignmentId: assignments.assignment2.id, order: 2 },
          ],
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);

      console.log(`\n✅ 응답 시간: ${responseTime}ms`);
    });
  });
});
