/**
 * 프로젝트 할당 순서 변경 (PATCH) - 실제 데이터 기반 E2E 테스트
 *
 * 현재 구현된 API: PATCH /admin/evaluation-criteria/project-assignments/:id/order?direction=up|down
 * - 단일 할당의 순서를 인접 항목과 교환 (상대적 순서 변경)
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-criteria/project-assignments/:id/order (실제 데이터)', () => {
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

  async function getAssignmentWithOrder() {
    // 'waiting' 또는 'in-progress' 상태의 평가기간 할당만 조회
    const result = await dataSource.query(
      `SELECT pa.id, pa."displayOrder" 
       FROM evaluation_project_assignment pa
       JOIN evaluation_period ep ON ep.id = pa."periodId"
       WHERE pa."deletedAt" IS NULL 
         AND ep."deletedAt" IS NULL
         AND ep.status IN ('waiting', 'in-progress')
       ORDER BY pa."displayOrder" ASC 
       LIMIT 3`,
    );
    return result.length >= 2 ? result : null;
  }

  describe('API 기본 동작', () => {
    it('순서 변경 API가 존재해야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length < 2) {
        console.log('데이터가 부족해서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[1].id}/order`,
        )
        .query({ direction: 'up' })
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(assignments[1].id);

      console.log('\n✅ API 존재 확인 성공');
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}/invalid-order`,
        );

      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ 잘못된 경로 404 에러 성공');
    });
  });

  describe('정상 순서 변경', () => {
    it('중간 항목을 위로 이동할 수 있어야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length < 2) {
        console.log('데이터가 부족해서 테스트 스킵');
        return;
      }

      // 두 번째 항목을 위로 이동
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[1].id}/order`,
        )
        .query({ direction: 'up' })
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(assignments[1].id);

      console.log('\n✅ 위로 이동 성공');
    });

    it('중간 항목을 아래로 이동할 수 있어야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length < 2) {
        console.log('데이터가 부족해서 테스트 스킵');
        return;
      }

      // 첫 번째 항목을 아래로 이동
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}/order`,
        )
        .query({ direction: 'down' })
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(assignments[0].id);

      console.log('\n✅ 아래로 이동 성공');
    });

    it('첫 번째 항목을 위로 이동 시도해도 에러가 발생하지 않아야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}/order`,
        )
        .query({ direction: 'up' })
        .expect(HttpStatus.OK);

      console.log('\n✅ 첫 번째 항목 위로 이동 처리 성공');
    });

    it('마지막 항목을 아래로 이동 시도해도 에러가 발생하지 않아야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const lastAssignment = assignments[assignments.length - 1];

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${lastAssignment.id}/order`,
        )
        .query({ direction: 'down' })
        .expect(HttpStatus.OK);

      console.log('\n✅ 마지막 항목 아래로 이동 처리 성공');
    });
  });

  describe('유효성 검증', () => {
    it('direction 파라미터 누락 시 400 에러가 발생해야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}/order`,
        );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBeDefined();

      console.log('\n✅ direction 누락 400 에러 성공');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .patch(
          '/admin/evaluation-criteria/project-assignments/invalid-uuid/order',
        )
        .query({ direction: 'up' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 잘못된 UUID 400 에러 성공');
    });

    it('잘못된 direction 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}/order`,
        )
        .query({ direction: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 잘못된 direction 400 에러 성공');
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 할당 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${nonExistentId}/order`,
        )
        .query({ direction: 'up' })
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 ID 에러 성공');
    });

    it('삭제된 할당의 순서를 변경하려고 하면 에러가 발생해야 한다', async () => {
      // 먼저 할당을 생성하고 삭제
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 할당 삭제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}`,
        );

      // 삭제된 할당의 순서 변경 시도
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[0].id}/order`,
        )
        .query({ direction: 'up' })
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 삭제된 할당 에러 성공');
    });
  });

  describe('성능 테스트', () => {
    it('응답 시간이 2초 이내여야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length < 2) {
        console.log('데이터가 부족해서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignments[1].id}/order`,
        )
        .query({ direction: 'up' });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);

      console.log(`\n✅ 응답 시간: ${responseTime}ms`);
    });
  });

  describe('순서 변경 로직 검증', () => {
    it('연속된 up/down 이동으로 원래 위치로 돌아와야 한다', async () => {
      const assignments = await getAssignmentWithOrder();

      if (!assignments || assignments.length < 3) {
        console.log('데이터가 부족해서 테스트 스킵');
        return;
      }

      // 중간 항목 선택 (인덱스 1)
      const targetId = assignments[1].id;
      const expectedNeighborAbove = assignments[0].id;
      const expectedNeighborBelow = assignments[2].id;

      // 위로 이동
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${targetId}/order`,
        )
        .query({ direction: 'up' });

      // 다시 아래로 이동
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/project-assignments/${targetId}/order`,
        )
        .query({ direction: 'down' });

      // 최종 순서 확인 - 원래 위치로 돌아왔는지
      // 같은 employeeId, periodId의 할당만 조회
      const firstAssignment = await dataSource.query(
        `SELECT "employeeId", "periodId" FROM evaluation_project_assignment WHERE id = $1`,
        [targetId],
      );

      if (firstAssignment.length === 0) {
        console.log('대상 할당을 찾을 수 없어 테스트 스킵');
        return;
      }

      const finalAssignments = await dataSource.query(
        `SELECT id, "displayOrder" FROM evaluation_project_assignment 
         WHERE "deletedAt" IS NULL 
           AND "employeeId" = $1
           AND "periodId" = $2
         ORDER BY "displayOrder" ASC`,
        [firstAssignment[0].employeeId, firstAssignment[0].periodId],
      );

      // 원래 순서가 유지되었는지 확인 (ID 기준)
      const finalIds = finalAssignments.map((a: any) => a.id);
      const indexOfTarget = finalIds.indexOf(targetId);

      // targetId가 여전히 인덱스 1에 있는지 확인
      expect(indexOfTarget).toBe(1);

      console.log('\n✅ 연속 이동 후 원위치 복귀 성공');
    });
  });
});
