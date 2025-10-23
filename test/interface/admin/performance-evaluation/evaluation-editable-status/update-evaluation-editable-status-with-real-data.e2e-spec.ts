/**
 * 평가 수정 가능 상태 변경 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오의 평가기간-직원 매핑 데이터를 활용하여
 * 평가 수정 가능 상태를 변경하는 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/performance-evaluation/evaluation-editable-status/:mappingId (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 시드 데이터 초기화
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

    // full 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'full',
        clearExisting: false,
      })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getEvaluationMapping() {
    const mappings = await dataSource.query(
      `SELECT id, "evaluationPeriodId", "employeeId", 
              "isSelfEvaluationEditable", "isPrimaryEvaluationEditable", "isSecondaryEvaluationEditable"
       FROM evaluation_period_employee_mapping
       WHERE "deletedAt" IS NULL
       LIMIT 1`,
    );
    return mappings.length > 0 ? mappings[0] : null;
  }

  async function getEmployeeId() {
    const employees = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return employees.length > 0 ? employees[0].id : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('평가 수정 가능 상태 변경 성공 시나리오', () => {
    it('자기평가 수정 가능 상태를 false로 변경할 수 있어야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({ updatedBy })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSelfEvaluationEditable).toBe(false);

      console.log('\n✅ 자기평가 수정 가능 상태 변경 성공');
    });

    it('자기평가 수정 가능 상태를 true로 변경할 수 있어야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'true' })
        .send({ updatedBy })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSelfEvaluationEditable).toBe(true);

      console.log('\n✅ 자기평가 수정 가능 상태 변경 성공 (true)');
    });

    it('1차평가 수정 가능 상태를 true로 변경할 수 있어야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'primary', isEditable: 'true' })
        .send({ updatedBy })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isPrimaryEvaluationEditable).toBe(true);

      console.log('\n✅ 1차평가 수정 가능 상태 변경 성공');
    });

    it('1차평가 수정 가능 상태를 false로 변경할 수 있어야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'primary', isEditable: 'false' })
        .send({ updatedBy })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isPrimaryEvaluationEditable).toBe(false);

      console.log('\n✅ 1차평가 수정 가능 상태 변경 성공 (false)');
    });

    it('2차평가 수정 가능 상태를 true로 변경할 수 있어야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'secondary', isEditable: 'true' })
        .send({ updatedBy })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSecondaryEvaluationEditable).toBe(true);

      console.log('\n✅ 2차평가 수정 가능 상태 변경 성공');
    });

    it('2차평가 수정 가능 상태를 false로 변경할 수 있어야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'secondary', isEditable: 'false' })
        .send({ updatedBy })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSecondaryEvaluationEditable).toBe(false);

      console.log('\n✅ 2차평가 수정 가능 상태 변경 성공 (false)');
    });
  });

  describe('실패 시나리오', () => {
    it('존재하지 않는 매핑 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updatedBy = await getEmployeeId();

      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${nonExistentId}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({ updatedBy })
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 매핑 처리 성공');
    });

    it('잘못된 평가 타입으로 요청 시 400 에러가 발생해야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'invalid', isEditable: 'false' })
        .send({ updatedBy })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 평가 타입 처리 성공');
    });

    it('잘못된 isEditable 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const mapping = await getEvaluationMapping();
      if (!mapping) {
        console.log('매핑 데이터가 없어서 테스트 스킵');
        return;
      }

      const updatedBy = await getEmployeeId();

      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'invalid' })
        .send({ updatedBy })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 isEditable 값 처리 성공');
    });

    it('잘못된 UUID 형식의 매핑 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const updatedBy = await getEmployeeId();

      await testSuite
        .request()
        .patch(
          '/admin/performance-evaluation/evaluation-editable-status/invalid-uuid',
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({ updatedBy })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 처리 성공');
    });
  });
});
