/**
 * 직원 조회 제외/포함 - 실제 데이터 기반 E2E 테스트
 *
 * 기본 시나리오를 사용하여 직원 조회 제외/포함 기능을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('직원 조회 제외/포함 테스트 (실제 데이터)', () => {
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

    // minimal 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'minimal',
        clearExisting: false,
      })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (minimal)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getActiveEmployee() {
    const employees = await dataSource.query(
      `SELECT id, name FROM employee WHERE "deletedAt" IS NULL AND status = '재직중' AND "isExcludedFromList" = false LIMIT 1`,
    );

    return employees.length > 0 ? employees[0] : null;
  }

  async function getMultipleActiveEmployees(count: number) {
    const employees = await dataSource.query(
      `SELECT id, name FROM employee WHERE "deletedAt" IS NULL AND status = '재직중' AND "isExcludedFromList" = false LIMIT $1`,
      [count],
    );

    return employees;
  }

  async function getExcludedEmployee() {
    const employees = await dataSource.query(
      `SELECT id, name FROM employee WHERE "deletedAt" IS NULL AND "isExcludedFromList" = true LIMIT 1`,
    );

    return employees.length > 0 ? employees[0] : null;
  }

  async function getEmployeeFromDb(employeeId: string) {
    const result = await dataSource.query(
      `SELECT * FROM employee WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [employeeId],
    );
    return result.length > 0 ? result[0] : null;
  }

  // ==================== 직원 조회 제외 테스트 ====================

  describe('PATCH /admin/employees/:id/exclude - 직원 조회 목록에서 제외', () => {
    describe('성공 시나리오', () => {
      it('정상적인 직원을 조회 목록에서 제외할 수 있어야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        const excludeReason = '퇴사 예정';

        // When
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason,
          })
          .expect(HttpStatus.OK);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(employee.id);
        expect(response.body.isExcludedFromList).toBe(true);
        expect(response.body.excludeReason).toBe(excludeReason);
        expect(response.body.excludedBy).toBe(
          '00000000-0000-0000-0000-000000000001',
        );
        expect(response.body.excludedAt).toBeDefined();

        console.log('\n✅ 직원 제외 성공');
      });

      it('제외 처리 시 DB에 정보가 저장되어야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        const excludeReason = '휴직 중';

        // When
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason,
          })
          .expect(HttpStatus.OK);

        // Then - DB에서 확인
        const dbEmployee = await getEmployeeFromDb(employee.id);
        expect(dbEmployee).toBeDefined();
        expect(dbEmployee.isExcludedFromList).toBe(true);
        expect(dbEmployee.excludeReason).toBe(excludeReason);
        expect(dbEmployee.excludedBy).toBe(
          '00000000-0000-0000-0000-000000000001',
        );
        expect(dbEmployee.excludedAt).toBeDefined();

        console.log('\n✅ DB 저장 검증 성공');
      });

      it('여러 직원을 각각 제외할 수 있어야 한다', async () => {
        const employees = await getMultipleActiveEmployees(3);

        if (employees.length < 3) {
          console.log('활성 직원이 부족해서 테스트 스킵');
          return;
        }

        // When
        const response1 = await testSuite
          .request()
          .patch(`/admin/employees/${employees[0].id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(HttpStatus.OK);

        const response2 = await testSuite
          .request()
          .patch(`/admin/employees/${employees[1].id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(HttpStatus.OK);

        const response3 = await testSuite
          .request()
          .patch(`/admin/employees/${employees[2].id}/exclude`)
          .send({
            excludeReason: '장기 출장',
          })
          .expect(HttpStatus.OK);

        // Then
        expect(response1.body.isExcludedFromList).toBe(true);
        expect(response2.body.isExcludedFromList).toBe(true);
        expect(response3.body.isExcludedFromList).toBe(true);

        console.log('\n✅ 여러 직원 제외 성공');
      });

      it('이미 제외된 직원을 다시 제외하면 정보가 업데이트되어야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        // Given - 먼저 제외
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '초기 사유',
          })
          .expect(HttpStatus.OK);

        // When - 다시 제외 (사유 변경)
        const newReason = '변경된 사유';
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: newReason,
          })
          .expect(HttpStatus.OK);

        // Then
        expect(response.body.isExcludedFromList).toBe(true);
        expect(response.body.excludeReason).toBe(newReason);

        console.log('\n✅ 제외 정보 업데이트 성공');
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 직원 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await testSuite
          .request()
          .patch(`/admin/employees/${nonExistentId}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(HttpStatus.NOT_FOUND);

        console.log('\n✅ 존재하지 않는 직원 테스트 성공');
      });

      it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .patch('/admin/employees/invalid-uuid/exclude')
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 UUID 테스트 성공');
      });

      it('excludeReason이 누락된 경우 400 에러가 발생해야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ excludeReason 누락 테스트 성공');
      });

      it('빈 문자열 excludeReason으로 요청 시 400 에러가 발생해야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '',
          })
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 빈 excludeReason 테스트 성공');
      });
    });
  });

  // ==================== 직원 조회 포함 테스트 ====================

  describe('PATCH /admin/employees/:id/include - 직원 조회 목록에 포함', () => {
    describe('성공 시나리오', () => {
      it('제외된 직원을 다시 조회 목록에 포함할 수 있어야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        // Given - 먼저 제외
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(HttpStatus.OK);

        // When - 다시 포함
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/include`)
          .send({})
          .expect(HttpStatus.OK);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(employee.id);
        expect(response.body.isExcludedFromList).toBe(false);
        expect(response.body.excludeReason).toBeNull();
        expect(response.body.excludedBy).toBeNull();
        expect(response.body.excludedAt).toBeNull();

        console.log('\n✅ 직원 포함 성공');
      });

      it('포함 처리 시 DB에서 제외 정보가 초기화되어야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        // Given - 먼저 제외
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(HttpStatus.OK);

        // When - 다시 포함
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/include`)
          .send({})
          .expect(HttpStatus.OK);

        // Then - DB에서 확인
        const dbEmployee = await getEmployeeFromDb(employee.id);
        expect(dbEmployee).toBeDefined();
        expect(dbEmployee.isExcludedFromList).toBe(false);
        expect(dbEmployee.excludeReason).toBeNull();
        expect(dbEmployee.excludedBy).toBeNull();
        expect(dbEmployee.excludedAt).toBeNull();

        console.log('\n✅ DB 초기화 검증 성공');
      });

      it('여러 제외된 직원을 각각 포함할 수 있어야 한다', async () => {
        const employees = await getMultipleActiveEmployees(2);

        if (employees.length < 2) {
          console.log('활성 직원이 부족해서 테스트 스킵');
          return;
        }

        // Given - 여러 직원 제외
        await testSuite
          .request()
          .patch(`/admin/employees/${employees[0].id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(HttpStatus.OK);

        await testSuite
          .request()
          .patch(`/admin/employees/${employees[1].id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(HttpStatus.OK);

        // When - 각각 포함
        const response1 = await testSuite
          .request()
          .patch(`/admin/employees/${employees[0].id}/include`)
          .send({})
          .expect(HttpStatus.OK);

        const response2 = await testSuite
          .request()
          .patch(`/admin/employees/${employees[1].id}/include`)
          .send({})
          .expect(HttpStatus.OK);

        // Then
        expect(response1.body.isExcludedFromList).toBe(false);
        expect(response2.body.isExcludedFromList).toBe(false);

        console.log('\n✅ 여러 직원 포함 성공');
      });

      it('제외되지 않은 직원을 포함 처리해도 정상 동작해야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        // When - 포함 처리
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/include`)
          .send({})
          .expect(HttpStatus.OK);

        // Then
        expect(response.body.isExcludedFromList).toBe(false);

        console.log('\n✅ 제외되지 않은 직원 포함 처리 성공');
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 직원 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await testSuite
          .request()
          .patch(`/admin/employees/${nonExistentId}/include`)
          .send({})
          .expect(HttpStatus.NOT_FOUND);

        console.log('\n✅ 존재하지 않는 직원 테스트 성공');
      });

      it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .patch('/admin/employees/invalid-uuid/include')
          .send({})
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 UUID 테스트 성공');
      });
    });
  });

  // ==================== 제외된 직원 목록 조회 테스트 ====================

  describe('GET /admin/employees/excluded - 제외된 직원 목록 조회', () => {
    describe('성공 시나리오', () => {
      it('제외된 직원 목록을 조회할 수 있어야 한다', async () => {
        const employees = await getMultipleActiveEmployees(2);

        if (employees.length < 2) {
          console.log('활성 직원이 부족해서 테스트 스킵');
          return;
        }

        // Given - 일부 직원 제외
        await testSuite
          .request()
          .patch(`/admin/employees/${employees[0].id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(HttpStatus.OK);

        await testSuite
          .request()
          .patch(`/admin/employees/${employees[1].id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(HttpStatus.OK);

        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/excluded')
          .expect(HttpStatus.OK);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        expect(
          response.body.every((emp: any) => emp.isExcludedFromList === true),
        ).toBe(true);

        console.log('\n✅ 제외된 직원 목록 조회 성공');
      });

      it('제외 정보가 포함되어 반환되어야 한다', async () => {
        const employee = await getActiveEmployee();

        if (!employee) {
          console.log('활성 직원이 없어서 테스트 스킵');
          return;
        }

        const excludeReason = '퇴사 예정';

        // Given
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason,
          })
          .expect(HttpStatus.OK);

        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/excluded')
          .expect(HttpStatus.OK);

        // Then
        const excludedEmployee = response.body.find(
          (e: any) => e.id === employee.id,
        );
        expect(excludedEmployee).toBeDefined();
        expect(excludedEmployee.id).toBe(employee.id);
        expect(excludedEmployee.isExcludedFromList).toBe(true);
        expect(excludedEmployee.excludeReason).toBe(excludeReason);
        expect(excludedEmployee.excludedBy).toBe(
          '00000000-0000-0000-0000-000000000001',
        );
        expect(excludedEmployee.excludedAt).toBeDefined();

        console.log('\n✅ 제외 정보 포함 검증 성공');
      });
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오', () => {
    it('직원 제외 -> 제외 목록 조회 -> 다시 포함 흐름이 정상 동작해야 한다', async () => {
      const employee = await getActiveEmployee();

      if (!employee) {
        console.log('활성 직원이 없어서 테스트 스킵');
        return;
      }

      // 1. 직원 제외
      const excludeResponse = await testSuite
        .request()
        .patch(`/admin/employees/${employee.id}/exclude`)
        .send({
          excludeReason: '퇴사 예정',
        })
        .expect(HttpStatus.OK);
      expect(excludeResponse.body.isExcludedFromList).toBe(true);

      // 2. 제외 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(HttpStatus.OK);
      const found = listResponse.body.find((e: any) => e.id === employee.id);
      expect(found).toBeDefined();

      // 3. 다시 포함
      const includeResponse = await testSuite
        .request()
        .patch(`/admin/employees/${employee.id}/include`)
        .send({})
        .expect(HttpStatus.OK);
      expect(includeResponse.body.isExcludedFromList).toBe(false);

      // 4. 제외 목록 재조회 (해당 직원은 없어야 함)
      const finalListResponse = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(HttpStatus.OK);
      const notFound = finalListResponse.body.find(
        (e: any) => e.id === employee.id,
      );
      expect(notFound).toBeUndefined();

      console.log('\n✅ 통합 시나리오 1 성공');
    });

    it('여러 직원 제외 -> 일부만 포함 흐름이 정상 동작해야 한다', async () => {
      const employees = await getMultipleActiveEmployees(3);

      if (employees.length < 3) {
        console.log('활성 직원이 부족해서 테스트 스킵');
        return;
      }

      // 1. 3명 제외
      await testSuite
        .request()
        .patch(`/admin/employees/${employees[0].id}/exclude`)
        .send({
          excludeReason: '퇴사 예정',
        })
        .expect(HttpStatus.OK);

      await testSuite
        .request()
        .patch(`/admin/employees/${employees[1].id}/exclude`)
        .send({
          excludeReason: '휴직 중',
        })
        .expect(HttpStatus.OK);

      await testSuite
        .request()
        .patch(`/admin/employees/${employees[2].id}/exclude`)
        .send({
          excludeReason: '장기 출장',
        })
        .expect(HttpStatus.OK);

      // 2. 제외 목록 조회 (3명이어야 함)
      const listResponse1 = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(HttpStatus.OK);
      const excludedIds = listResponse1.body.map((e: any) => e.id);
      expect(excludedIds).toContain(employees[0].id);
      expect(excludedIds).toContain(employees[1].id);
      expect(excludedIds).toContain(employees[2].id);

      // 3. 1명만 포함
      await testSuite
        .request()
        .patch(`/admin/employees/${employees[0].id}/include`)
        .send({})
        .expect(HttpStatus.OK);

      // 4. 제외 목록 재조회 (2명이어야 함)
      const listResponse2 = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(HttpStatus.OK);
      expect(
        listResponse2.body.find((e: any) => e.id === employees[0].id),
      ).toBeUndefined();
      expect(
        listResponse2.body.find((e: any) => e.id === employees[1].id),
      ).toBeDefined();
      expect(
        listResponse2.body.find((e: any) => e.id === employees[2].id),
      ).toBeDefined();

      console.log('\n✅ 통합 시나리오 2 성공');
    });
  });
});
