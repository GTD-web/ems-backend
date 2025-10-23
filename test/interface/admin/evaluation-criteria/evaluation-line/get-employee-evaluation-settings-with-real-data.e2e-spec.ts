/**
 * 직원 평가설정 통합 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여
 * 직원의 평가설정(프로젝트 할당, WBS 할당, 평가라인 매핑)을
 * 통합 조회하는 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 전체 설정 조회 (프로젝트 + WBS + 평가라인)
 * 2. 부분 설정 조회 (프로젝트만, WBS만)
 * 3. 빈 설정 조회 (할당 없음)
 * 4. 여러 할당이 있는 경우
 * 5. 실패 시나리오
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/period/:periodId/settings - 실제 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 전체 설정 조회 (프로젝트 + WBS + 평가라인)', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 전체 설정 조회 ===');

      // 기존 데이터 정리
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

      // 실제 데이터 기반 시드 데이터 생성
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_setup',
          clearExisting: false,
          projectCount: 2,
          wbsPerProject: 3,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            evaluationLineMappingTypes: {
              primaryOnly: 0.3,
              primaryAndSecondary: 0.7,
              withAdditional: 0.0,
            },
          },
        })
        .expect(201);

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // WBS 할당이 있는 직원 조회
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .limit(1)
        .getMany();

      employeeId = wbsAssignments[0].employeeId;
      console.log(`테스트 직원 ID: ${employeeId}`);
      console.log(`평가기간 ID: ${evaluationPeriodId}`);
    });

    it('전체 설정 정보를 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 구조:');
      console.log('  employeeId:', result.employeeId);
      console.log('  periodId:', result.periodId);
      console.log(
        '  projectAssignments:',
        result.projectAssignments?.length || 0,
      );
      console.log('  wbsAssignments:', result.wbsAssignments?.length || 0);
      console.log(
        '  evaluationLineMappings:',
        result.evaluationLineMappings?.length || 0,
      );

      // 기본 구조 검증
      expect(result).toHaveProperty('employeeId');
      expect(result).toHaveProperty('periodId');
      expect(result).toHaveProperty('projectAssignments');
      expect(result).toHaveProperty('wbsAssignments');
      expect(result).toHaveProperty('evaluationLineMappings');

      expect(result.employeeId).toBe(employeeId);
      expect(result.periodId).toBe(evaluationPeriodId);

      // 배열 검증
      expect(Array.isArray(result.projectAssignments)).toBe(true);
      expect(Array.isArray(result.wbsAssignments)).toBe(true);
      expect(Array.isArray(result.evaluationLineMappings)).toBe(true);

      console.log('\n✅ 전체 설정 조회 성공');
    });

    it('프로젝트 할당 정보가 올바르게 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.projectAssignments.length > 0) {
        const projectAssignment = result.projectAssignments[0];

        console.log('\n📝 프로젝트 할당 정보:');
        console.log('  ID:', projectAssignment.id);
        console.log('  periodId:', projectAssignment.periodId);
        console.log('  employeeId:', projectAssignment.employeeId);
        console.log('  projectId:', projectAssignment.projectId);

        // 필수 필드 검증
        expect(projectAssignment).toHaveProperty('id');
        expect(projectAssignment).toHaveProperty('periodId');
        expect(projectAssignment).toHaveProperty('employeeId');
        expect(projectAssignment).toHaveProperty('projectId');
        expect(projectAssignment).toHaveProperty('assignedDate');
        expect(projectAssignment).toHaveProperty('assignedBy');
        expect(projectAssignment).toHaveProperty('displayOrder');
        expect(projectAssignment).toHaveProperty('createdAt');
        expect(projectAssignment).toHaveProperty('updatedAt');
        expect(projectAssignment).toHaveProperty('version');

        // 값 검증
        expect(projectAssignment.periodId).toBe(evaluationPeriodId);
        expect(projectAssignment.employeeId).toBe(employeeId);
        expect(typeof projectAssignment.id).toBe('string');
        expect(typeof projectAssignment.projectId).toBe('string');

        console.log('\n✅ 프로젝트 할당 정보 검증 완료');
      }
    });

    it('WBS 할당 정보가 올바르게 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(result.wbsAssignments.length).toBeGreaterThan(0);

      const wbsAssignment = result.wbsAssignments[0];

      console.log('\n📝 WBS 할당 정보:');
      console.log('  ID:', wbsAssignment.id);
      console.log('  wbsItemId:', wbsAssignment.wbsItemId);
      console.log('  projectId:', wbsAssignment.projectId);

      // 필수 필드 검증
      expect(wbsAssignment).toHaveProperty('id');
      expect(wbsAssignment).toHaveProperty('periodId');
      expect(wbsAssignment).toHaveProperty('employeeId');
      expect(wbsAssignment).toHaveProperty('projectId');
      expect(wbsAssignment).toHaveProperty('wbsItemId');
      expect(wbsAssignment).toHaveProperty('assignedDate');
      expect(wbsAssignment).toHaveProperty('assignedBy');
      expect(wbsAssignment).toHaveProperty('displayOrder');
      expect(wbsAssignment).toHaveProperty('createdAt');
      expect(wbsAssignment).toHaveProperty('updatedAt');
      expect(wbsAssignment).toHaveProperty('version');

      // 값 검증
      expect(wbsAssignment.periodId).toBe(evaluationPeriodId);
      expect(wbsAssignment.employeeId).toBe(employeeId);

      console.log('\n✅ WBS 할당 정보 검증 완료');
    });

    it('평가라인 매핑 정보가 올바르게 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.evaluationLineMappings.length > 0) {
        const mapping = result.evaluationLineMappings[0];

        console.log('\n📝 평가라인 매핑 정보:');
        console.log('  ID:', mapping.id);
        console.log('  evaluationLineId:', mapping.evaluationLineId);
        console.log('  evaluatorId:', mapping.evaluatorId);

        // 필수 필드 검증
        expect(mapping).toHaveProperty('id');
        expect(mapping).toHaveProperty('employeeId');
        expect(mapping).toHaveProperty('evaluatorId');
        expect(mapping).toHaveProperty('evaluationLineId');
        expect(mapping).toHaveProperty('createdAt');
        expect(mapping).toHaveProperty('updatedAt');

        // 값 검증
        expect(mapping.employeeId).toBe(employeeId);

        console.log('\n✅ 평가라인 매핑 정보 검증 완료');
      }
    });
  });

  describe('시나리오 2: 빈 설정 조회', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 빈 설정 조회 ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // 할당이 없는 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .andWhere(
          `NOT EXISTS (
            SELECT 1 FROM evaluation_wbs_assignment 
            WHERE "employeeId" = employee.id 
            AND "periodId" = :periodId 
            AND "deletedAt" IS NULL
          )`,
          { periodId: evaluationPeriodId },
        )
        .limit(1)
        .getMany();

      if (employees.length > 0) {
        employeeId = employees[0].id;
        console.log(`할당 없는 직원 ID: ${employeeId}`);
      } else {
        // 할당 없는 직원이 없으면 새로 생성
        const newEmployee = await dataSource.manager.query(
          `INSERT INTO employee 
          (id, name, "departmentId", "employeeNumber", email, version, "createdAt", "updatedAt")
          SELECT gen_random_uuid(), '테스트직원', id, 'TEST999', 'test@test.com', 1, NOW(), NOW()
          FROM department
          WHERE "deletedAt" IS NULL
          LIMIT 1
          RETURNING id`,
        );
        employeeId = newEmployee[0].id;
        console.log(`새로운 테스트 직원 생성: ${employeeId}`);
      }
    });

    it('할당이 없는 경우 빈 배열들을 반환해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 빈 설정 조회 결과:');
      console.log('  employeeId:', result.employeeId);
      console.log('  periodId:', result.periodId);
      console.log('  projectAssignments:', result.projectAssignments.length);
      console.log('  wbsAssignments:', result.wbsAssignments.length);
      console.log(
        '  evaluationLineMappings:',
        result.evaluationLineMappings.length,
      );

      expect(result.employeeId).toBe(employeeId);
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(result.projectAssignments).toEqual([]);
      expect(result.wbsAssignments).toEqual([]);
      expect(result.evaluationLineMappings).toEqual([]);

      console.log('\n✅ 빈 배열 반환 확인');
    });
  });

  describe('시나리오 3: 여러 할당이 있는 경우', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 여러 할당이 있는 경우 ===');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // 여러 WBS 할당이 있는 직원 조회
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .select('assignment.employeeId')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .groupBy('assignment.employeeId')
        .having('COUNT(assignment.id) >= 2')
        .limit(1)
        .getRawMany();

      if (wbsAssignments.length > 0) {
        employeeId = wbsAssignments[0].assignment_employeeId;
      } else {
        // 첫 번째 직원 사용
        const assignments = await dataSource
          .getRepository('EvaluationWbsAssignment')
          .createQueryBuilder('assignment')
          .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
          })
          .andWhere('assignment.deletedAt IS NULL')
          .limit(1)
          .getMany();
        employeeId = assignments[0].employeeId;
      }

      console.log(`여러 할당이 있는 직원 ID: ${employeeId}`);
    });

    it('여러 WBS 할당이 모두 반환되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 여러 할당 조회 결과:');
      console.log('  projectAssignments:', result.projectAssignments.length);
      console.log('  wbsAssignments:', result.wbsAssignments.length);
      console.log(
        '  evaluationLineMappings:',
        result.evaluationLineMappings.length,
      );

      // 모든 WBS 할당이 동일한 직원과 평가기간을 가져야 함
      result.wbsAssignments.forEach((assignment: any) => {
        expect(assignment.employeeId).toBe(employeeId);
        expect(assignment.periodId).toBe(evaluationPeriodId);
      });

      console.log('\n✅ 여러 할당 검증 완료');
    });
  });

  describe('시나리오 4: 타임스탬프 및 필수 필드 검증', () => {
    let evaluationPeriodId: string;
    let employeeId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 4: 타임스탬프 및 필수 필드 검증 ===');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;

      // WBS 할당이 있는 직원 조회
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .limit(1)
        .getMany();

      employeeId = wbsAssignments[0].employeeId;
    });

    it('타임스탬프 필드들이 올바른 형식이어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 타임스탬프 검증:');

      // 프로젝트 할당 타임스탬프 검증
      result.projectAssignments.forEach((assignment: any) => {
        expect(new Date(assignment.assignedDate).toString()).not.toBe(
          'Invalid Date',
        );
        expect(new Date(assignment.createdAt).toString()).not.toBe(
          'Invalid Date',
        );
        expect(new Date(assignment.updatedAt).toString()).not.toBe(
          'Invalid Date',
        );
      });

      // WBS 할당 타임스탬프 검증
      result.wbsAssignments.forEach((assignment: any) => {
        expect(new Date(assignment.assignedDate).toString()).not.toBe(
          'Invalid Date',
        );
        expect(new Date(assignment.createdAt).toString()).not.toBe(
          'Invalid Date',
        );
        expect(new Date(assignment.updatedAt).toString()).not.toBe(
          'Invalid Date',
        );
      });

      // 평가라인 매핑 타임스탬프 검증
      result.evaluationLineMappings.forEach((mapping: any) => {
        expect(new Date(mapping.createdAt).toString()).not.toBe('Invalid Date');
        expect(new Date(mapping.updatedAt).toString()).not.toBe('Invalid Date');
      });

      console.log('  ✓ 모든 타임스탬프가 유효함');
      console.log('\n✅ 타임스탬프 검증 완료');
    });

    it('모든 필수 필드가 존재해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 필수 필드 검증:');

      // 최상위 필수 필드
      expect(result).toHaveProperty('employeeId');
      expect(result).toHaveProperty('periodId');
      expect(result).toHaveProperty('projectAssignments');
      expect(result).toHaveProperty('wbsAssignments');
      expect(result).toHaveProperty('evaluationLineMappings');

      console.log('  ✓ 최상위 필드 존재');

      // 배열 필드 타입 검증
      expect(Array.isArray(result.projectAssignments)).toBe(true);
      expect(Array.isArray(result.wbsAssignments)).toBe(true);
      expect(Array.isArray(result.evaluationLineMappings)).toBe(true);

      console.log('  ✓ 배열 타입 정상');
      console.log('\n✅ 필수 필드 검증 완료');
    });
  });

  describe('시나리오 5: 실패 시나리오', () => {
    it('존재하지 않는 직원 ID로 조회 시 빈 배열들을 반환해야 한다', async () => {
      console.log('\n=== 시나리오 5-1: 존재하지 않는 직원 ID ===');

      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      const evaluationPeriodId = evaluationPeriods[0].id;

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${nonExistentEmployeeId}/period/${evaluationPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 결과:');
      console.log('  employeeId:', result.employeeId);
      console.log('  projectAssignments:', result.projectAssignments.length);
      console.log('  wbsAssignments:', result.wbsAssignments.length);
      console.log(
        '  evaluationLineMappings:',
        result.evaluationLineMappings.length,
      );

      expect(result.employeeId).toBe(nonExistentEmployeeId);
      expect(result.projectAssignments).toEqual([]);
      expect(result.wbsAssignments).toEqual([]);
      expect(result.evaluationLineMappings).toEqual([]);

      console.log('\n✅ 빈 배열 반환 확인');
    });

    it('존재하지 않는 평가기간 ID로 조회 시 빈 배열들을 반환해야 한다', async () => {
      console.log('\n=== 시나리오 5-2: 존재하지 않는 평가기간 ID ===');

      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      const employeeId = employees[0].id;

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${nonExistentPeriodId}/settings`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 결과:');
      console.log('  periodId:', result.periodId);
      console.log('  projectAssignments:', result.projectAssignments.length);

      expect(result.periodId).toBe(nonExistentPeriodId);
      expect(result.projectAssignments).toEqual([]);
      expect(result.wbsAssignments).toEqual([]);
      expect(result.evaluationLineMappings).toEqual([]);

      console.log('\n✅ 빈 배열 반환 확인');
    });

    it('잘못된 UUID 형식의 직원 ID로 조회 시 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 5-3: 잘못된 UUID 형식 (직원) ===');

      const invalidUuid = 'invalid-uuid';

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      const evaluationPeriodId = evaluationPeriods[0].id;

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${invalidUuid}/period/${evaluationPeriodId}/settings`,
        );

      console.log('\n📊 응답 상태:', response.status);
      expect([400, 500]).toContain(response.status);

      console.log('\n✅ 에러 응답 확인');
    });

    it('잘못된 UUID 형식의 평가기간 ID로 조회 시 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 5-4: 잘못된 UUID 형식 (평가기간) ===');

      const invalidUuid = 'invalid-uuid';

      // 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      const employeeId = employees[0].id;

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${invalidUuid}/settings`,
        );

      console.log('\n📊 응답 상태:', response.status);
      expect([400, 500]).toContain(response.status);

      console.log('\n✅ 에러 응답 확인');
    });
  });
});
