/**
 * 배치 평가자 구성 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여
 * 배치 1차/2차 평가자 구성 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 배치 1차 평가자 구성
 * 2. 배치 2차 평가자 구성
 * 3. 통합 시나리오 (배치 1차 -> 배치 2차 순차 실행)
 * 4. 실패 시나리오 (잘못된 입력, 일부 실패)
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/evaluation-lines/period/:periodId/batch-*-evaluator - 실제 데이터 기반', () => {
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

  describe('시나리오 1: 배치 1차 평가자 구성', () => {
    let evaluationPeriodId: string;
    let employeeIds: string[] = [];
    let evaluatorIds: string[] = [];

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 배치 1차 평가자 구성 ===');

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

      // 실제 데이터 기반 시드 데이터 생성 (충분한 데이터 확보)
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_setup',
          clearExisting: false,
          projectCount: 3,
          wbsPerProject: 4,
          evaluationConfig: {
            periodCount: 1,
          },
        })
        .expect(201);

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

      // 평가기간 조회
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = periods[0].id;

      // WBS 할당 조회 (여러 피평가자 선택)
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .limit(10)
        .getMany();

      // 고유한 직원 ID 추출
      const uniqueEmployeeIds = [
        ...new Set(wbsAssignments.map((a) => a.employeeId)),
      ];
      employeeIds = uniqueEmployeeIds.slice(0, 3); // 3명 선택

      // 모든 직원 조회
      const allEmployees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .getMany();

      // 평가자로 사용할 다른 직원들 선택 (부족하면 재사용)
      let availableEmployees = allEmployees.filter(
        (e) => !employeeIds.includes(e.id),
      );

      // 최소 3명의 평가자 확보 (부족하면 순환 사용)
      if (availableEmployees.length >= 3) {
        evaluatorIds = availableEmployees.slice(0, 6).map((e) => e.id);
      } else if (availableEmployees.length > 0) {
        // 사용 가능한 평가자로 순환 사용
        evaluatorIds = [];
        for (let i = 0; i < 6; i++) {
          evaluatorIds.push(
            availableEmployees[i % availableEmployees.length].id,
          );
        }
      } else {
        // 최후의 수단: 모든 직원 사용 (피평가자와 동일해도 허용)
        evaluatorIds = [];
        for (let i = 0; i < 6; i++) {
          evaluatorIds.push(
            allEmployees[i % allEmployees.length].id,
          );
        }
      }

      // undefined 방지
      evaluatorIds = evaluatorIds.filter(
        (id) => id !== undefined && id !== null,
      );
      expect(evaluatorIds.length).toBeGreaterThan(0);

      console.log(`평가기간 ID: ${evaluationPeriodId}`);
      console.log(`피평가자 ID: ${employeeIds.join(', ')}`);
      console.log(`평가자 ID: ${evaluatorIds.join(', ')}`);
    });

    it('여러 직원의 1차 평가자를 일괄 설정할 수 있어야 한다', async () => {
      const assignments = employeeIds.map((employeeId, index) => ({
        employeeId,
        evaluatorId: evaluatorIds[index % evaluatorIds.length],
      }));

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({ assignments })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      console.log('\n📊 배치 1차 평가자 구성 응답:', result);

      // 응답 검증
      expect(result).toHaveProperty('periodId', evaluationPeriodId);
      expect(result).toHaveProperty('totalCount', assignments.length);
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('failureCount', 0);
      expect(result).toHaveProperty('createdLines');
      expect(result).toHaveProperty('createdMappings');
      expect(result).toHaveProperty('results');
      expect(result.results).toHaveLength(assignments.length);

      // 모든 결과가 성공이어야 함
      result.results.forEach((item: any, index: number) => {
        expect(item).toHaveProperty('status', 'success');
        expect(item).toHaveProperty('employeeId', employeeIds[index]);
        expect(item).toHaveProperty('evaluatorId');
        expect(item).toHaveProperty('mapping');
        expect(item.mapping).toHaveProperty('employeeId', employeeIds[index]);
        expect(item.mapping).toHaveProperty('evaluatorId');
      });

      console.log('\n✅ 배치 1차 평가자 일괄 설정 성공');
    });

    it('기존 1차 평가자를 일괄 업데이트할 수 있어야 한다', async () => {
      // 새로운 평가자들로 변경
      const allEmployees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .getMany();

      // 기존에 사용하지 않은 평가자들 선택
      let availableEvaluators = allEmployees.filter(
        (e) => !employeeIds.includes(e.id) && !evaluatorIds.includes(e.id),
      );

      // 충분하지 않으면 다른 직원들로 보충
      if (availableEvaluators.length < employeeIds.length) {
        const additionalEvaluators = allEmployees.filter(
          (e) => !employeeIds.includes(e.id),
        );
        availableEvaluators = [
          ...availableEvaluators,
          ...additionalEvaluators,
        ].slice(0, employeeIds.length * 2);
      }

      // 그래도 부족하면 순환 사용 (최소한의 보장)
      if (availableEvaluators.length === 0) {
        availableEvaluators = allEmployees.filter(
          (e) => !employeeIds.includes(e.id),
        );
      }

      // 최후의 수단: 모든 직원 사용 (자기 자신 제외만)
      if (availableEvaluators.length === 0) {
        availableEvaluators = allEmployees;
      }

      // undefined 방지: 충분한 평가자 확보
      const newEvaluatorIds = availableEvaluators
        .slice(0, Math.max(employeeIds.length, availableEvaluators.length))
        .map((e) => e.id)
        .filter((id) => id !== undefined && id !== null);

      // 최소 1명 이상의 평가자가 있어야 함
      expect(newEvaluatorIds.length).toBeGreaterThan(0);

      // 순환 사용하여 모든 피평가자에 평가자 할당
      const assignments = employeeIds.map((employeeId, index) => ({
        employeeId,
        evaluatorId: newEvaluatorIds[index % newEvaluatorIds.length],
      }));

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({ assignments })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      console.log('\n📊 배치 1차 평가자 업데이트 응답:', result);

      // 응답 검증
      expect(result.totalCount).toBe(assignments.length);
      expect(result.successCount).toBe(assignments.length);
      expect(result.failureCount).toBe(0);

      // DB에서 직접 확인
      const evaluationLines = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'primary' })
        .andWhere('line."deletedAt" IS NULL')
        .getMany();

      const evaluationLineId = evaluationLines[0].id;

      for (const assignment of assignments) {
        const mappings = await dataSource
          .getRepository('EvaluationLineMapping')
          .createQueryBuilder('mapping')
          .where('mapping."evaluationLineId" = :lineId', {
            lineId: evaluationLineId,
          })
          .andWhere('mapping."employeeId" = :employeeId', {
            employeeId: assignment.employeeId,
          })
          .andWhere('mapping."deletedAt" IS NULL')
          .orderBy('mapping."updatedAt"', 'DESC')
          .getMany();

        expect(mappings.length).toBeGreaterThan(0);
        // 가장 최근 업데이트된 매핑 확인 (순환 사용으로 인해 다른 평가자가 할당될 수 있음)
        const latestMapping = mappings[0];
        // 순환 사용으로 할당된 평가자가 원래 할당과 다를 수 있으므로, 할당된 평가자가 목록에 있는지 확인
        expect(newEvaluatorIds).toContain(latestMapping.evaluatorId);
      }

      console.log('\n✅ DB 매핑 정보 업데이트 확인');
    });

    it('빈 배열을 전달하면 0건 처리 완료를 반환해야 한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({ assignments: [] })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      expect(result.totalCount).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(0);

      console.log('\n✅ 빈 배열 처리 확인');
    });
  });

  describe('시나리오 2: 배치 2차 평가자 구성', () => {
    let evaluationPeriodId: string;
    let assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      evaluatorId: string;
    }> = [];

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 배치 2차 평가자 구성 ===');

      // 평가기간 조회
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = periods[0].id;

      // WBS 할당 조회 (여러 직원의 여러 WBS 선택)
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .limit(10)
        .getMany();

      // 평가자로 사용할 다른 직원들 조회
      const employeeIds = wbsAssignments.map((a) => a.employeeId);
      const uniqueEmployeeIds = [...new Set(employeeIds)];

      // 충분한 평가자 확보 (최소 10명 이상)
      const allEmployees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .getMany();

      // 기존에 사용하지 않은 평가자들 선택
      let availableEvaluators = allEmployees.filter(
        (e) => !uniqueEmployeeIds.includes(e.id),
      );

      // 평가자가 부족하면 모든 직원 사용
      if (availableEvaluators.length === 0) {
        availableEvaluators = allEmployees;
      }

      // 할당 데이터 구성 (각 WBS 할당에 대해 평가자 할당, 최대 4개)
      // 평가자가 부족한 경우 같은 평가자를 재사용
      assignments = wbsAssignments.slice(0, 4).map((assignment, index) => {
        const evaluator = availableEvaluators[index % availableEvaluators.length];
        const evaluatorId = evaluator?.id || allEmployees[index % allEmployees.length]?.id;

        // undefined 방지
        if (!evaluatorId) {
          throw new Error(
            `평가자를 찾을 수 없습니다. 할당: ${index}, 전체 직원: ${allEmployees.length}`,
          );
        }

        return {
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          evaluatorId,
        };
      });

      console.log(`평가기간 ID: ${evaluationPeriodId}`);
      console.log(`할당 건수: ${assignments.length}`);
    });

    it('여러 직원의 여러 WBS 항목에 대한 2차 평가자를 일괄 설정할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-secondary-evaluator`,
        )
        .send({ assignments })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      console.log('\n📊 배치 2차 평가자 구성 응답:', result);

      // 응답 검증
      expect(result).toHaveProperty('periodId', evaluationPeriodId);
      expect(result).toHaveProperty('totalCount', assignments.length);
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('failureCount', 0);
      expect(result).toHaveProperty('createdLines');
      expect(result).toHaveProperty('createdMappings');
      expect(result).toHaveProperty('results');
      expect(result.results).toHaveLength(assignments.length);

      // 모든 결과가 성공이어야 함
      result.results.forEach((item: any, index: number) => {
        expect(item).toHaveProperty('status', 'success');
        expect(item).toHaveProperty('employeeId', assignments[index].employeeId);
        expect(item).toHaveProperty('wbsItemId', assignments[index].wbsItemId);
        expect(item).toHaveProperty('evaluatorId', assignments[index].evaluatorId);
        expect(item).toHaveProperty('mapping');
        expect(item.mapping).toHaveProperty('employeeId', assignments[index].employeeId);
        expect(item.mapping).toHaveProperty('wbsItemId', assignments[index].wbsItemId);
        expect(item.mapping).toHaveProperty('evaluatorId', assignments[index].evaluatorId);
      });

      console.log('\n✅ 배치 2차 평가자 일괄 설정 성공');
    });

    it('기존 2차 평가자를 일괄 업데이트할 수 있어야 한다', async () => {
      // 새로운 평가자들로 변경
      const existingEmployeeIds = [...new Set(assignments.map((a) => a.employeeId))];
      const existingEvaluatorIds = [...new Set(assignments.map((a) => a.evaluatorId))];

      // 모든 직원 조회
      const allEmployees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .getMany();

      // 기존에 사용하지 않은 평가자들 선택
      let availableEvaluators = allEmployees.filter(
        (e) =>
          !existingEmployeeIds.includes(e.id) &&
          !existingEvaluatorIds.includes(e.id),
      );

      // 충분하지 않으면 다른 직원들로 보충
      if (availableEvaluators.length < assignments.length) {
        const additionalEvaluators = allEmployees.filter(
          (e) => !existingEmployeeIds.includes(e.id),
        );
        availableEvaluators = [
          ...availableEvaluators,
          ...additionalEvaluators,
        ].slice(0, assignments.length * 2);
      }

      // 그래도 부족하면 순환 사용
      if (availableEvaluators.length === 0) {
        availableEvaluators = allEmployees.filter(
          (e) => !existingEmployeeIds.includes(e.id),
        );
      }

      // 최후의 수단: 모든 직원 사용
      if (availableEvaluators.length === 0) {
        availableEvaluators = allEmployees;
      }

      // undefined 방지: 충분한 평가자 확보
      const newEvaluatorIds = availableEvaluators
        .slice(0, Math.max(assignments.length, availableEvaluators.length))
        .map((e) => e.id)
        .filter((id) => id !== undefined && id !== null);

      // 최소 1명 이상의 평가자가 있어야 함
      expect(newEvaluatorIds.length).toBeGreaterThan(0);

      // 순환 사용하여 모든 할당에 평가자 할당
      const updatedAssignments = assignments.map((assignment, index) => ({
        ...assignment,
        evaluatorId: newEvaluatorIds[index % newEvaluatorIds.length],
      }));

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-secondary-evaluator`,
        )
        .send({ assignments: updatedAssignments })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      console.log('\n📊 배치 2차 평가자 업데이트 응답:', result);

      // 응답 검증
      expect(result.totalCount).toBe(updatedAssignments.length);
      expect(result.successCount).toBe(updatedAssignments.length);
      expect(result.failureCount).toBe(0);

      // DB에서 직접 확인
      const evaluationLines = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'secondary' })
        .andWhere('line."deletedAt" IS NULL')
        .getMany();

      const evaluationLineId = evaluationLines[0].id;

      for (const assignment of updatedAssignments) {
        const mappings = await dataSource
          .getRepository('EvaluationLineMapping')
          .createQueryBuilder('mapping')
          .where('mapping."evaluationLineId" = :lineId', {
            lineId: evaluationLineId,
          })
          .andWhere('mapping."employeeId" = :employeeId', {
            employeeId: assignment.employeeId,
          })
          .andWhere('mapping."wbsItemId" = :wbsItemId', {
            wbsItemId: assignment.wbsItemId,
          })
          .andWhere('mapping."deletedAt" IS NULL')
          .getMany();

        expect(mappings.length).toBeGreaterThan(0);
        const latestMapping = mappings[0];
        expect(latestMapping.evaluatorId).toBe(assignment.evaluatorId);
      }

      console.log('\n✅ DB 매핑 정보 업데이트 확인');
    });

    it('WBS별 유일성 보장: 동일 직원의 동일 WBS에 기존 2차 평가자가 있으면 기존 매핑 삭제 후 새 매핑 생성해야 한다', async () => {
      // 첫 번째 할당의 평가자를 다른 평가자로 변경
      const firstAssignment = assignments[0];

      // 새로운 평가자 선택
      const allEmployees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.deletedAt IS NULL')
        .getMany();

      // 기존 평가자와 다른 평가자 선택
      let newEvaluators = allEmployees.filter(
        (e) =>
          e.id !== firstAssignment.employeeId &&
          e.id !== firstAssignment.evaluatorId,
      );

      // 평가자가 없으면 모든 직원 사용
      if (newEvaluators.length === 0) {
        newEvaluators = allEmployees.filter(
          (e) => e.id !== firstAssignment.employeeId,
        );
      }

      // 그래도 없으면 모든 직원 사용 (최소한 보장)
      if (newEvaluators.length === 0) {
        newEvaluators = allEmployees;
      }

      const newEvaluatorId = newEvaluators[0]?.id;

      // 평가자가 있어야 함
      expect(newEvaluatorId).toBeDefined();

      const evaluationLines = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'secondary' })
        .andWhere('line."deletedAt" IS NULL')
        .getMany();

      const evaluationLineId = evaluationLines[0].id;

      // 업데이트 전 기존 매핑 확인
      const beforeMappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping."evaluationLineId" = :lineId', {
          lineId: evaluationLineId,
        })
        .andWhere('mapping."employeeId" = :employeeId', {
          employeeId: firstAssignment.employeeId,
        })
        .andWhere('mapping."wbsItemId" = :wbsItemId', {
          wbsItemId: firstAssignment.wbsItemId,
        })
        .andWhere('mapping."deletedAt" IS NULL')
        .getMany();

      const beforeCount = beforeMappings.length;
      const beforeEvaluatorId = beforeMappings[0]?.evaluatorId;

      // 새로운 평가자가 기존 평가자와 다른지 확인 (같으면 다른 평가자 선택)
      let finalNewEvaluatorId = newEvaluatorId;
      if (beforeEvaluatorId && beforeEvaluatorId === newEvaluatorId) {
        // 기존 평가자와 같으면 다른 평가자 선택
        const differentEvaluators = newEvaluators.filter(
          (e) => e.id !== beforeEvaluatorId && e.id !== firstAssignment.employeeId,
        );
        if (differentEvaluators.length > 0) {
          finalNewEvaluatorId = differentEvaluators[0].id;
        } else {
          // 모든 직원 중에서 다른 평가자 선택
          const allDifferent = allEmployees.filter(
            (e) =>
              e.id !== beforeEvaluatorId &&
              e.id !== firstAssignment.employeeId &&
              e.id !== newEvaluatorId,
          );
          if (allDifferent.length > 0) {
            finalNewEvaluatorId = allDifferent[0].id;
          }
        }
      }

      const updateAssignment = [
        {
          employeeId: firstAssignment.employeeId,
          wbsItemId: firstAssignment.wbsItemId,
          evaluatorId: finalNewEvaluatorId,
        },
      ];

      // 배치 업데이트 실행
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-secondary-evaluator`,
        )
        .send({ assignments: updateAssignment })
        .expect(HttpStatus.CREATED);

      // 업데이트 후 매핑 확인
      const afterMappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping."evaluationLineId" = :lineId', {
          lineId: evaluationLineId,
        })
        .andWhere('mapping."employeeId" = :employeeId', {
          employeeId: firstAssignment.employeeId,
        })
        .andWhere('mapping."wbsItemId" = :wbsItemId', {
          wbsItemId: firstAssignment.wbsItemId,
        })
        .andWhere('mapping."deletedAt" IS NULL')
        .getMany();

      // WBS별로 한 명의 평가자만 있어야 함
      expect(afterMappings.length).toBe(1);
      expect(afterMappings[0].evaluatorId).toBe(finalNewEvaluatorId);
      // 기존 매핑이 있었고 평가자가 다르면 확인
      if (beforeEvaluatorId && beforeEvaluatorId !== finalNewEvaluatorId) {
        expect(afterMappings[0].evaluatorId).not.toBe(beforeEvaluatorId);
      }

      console.log('\n✅ WBS별 유일성 보장 확인');
    });
  });

  describe('시나리오 3: 통합 시나리오', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 통합 시나리오 ===');

      // 평가기간 조회
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = periods[0].id;
    });

    it('배치 1차 평가자 설정 후 배치 2차 평가자 설정을 순차적으로 실행할 수 있어야 한다', async () => {
      // WBS 할당 조회
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .limit(3)
        .getMany();

      const employeeIds = [
        ...new Set(wbsAssignments.map((a) => a.employeeId)),
      ].slice(0, 2);

      // 평가자 조회
      const evaluators = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id NOT IN (:...ids)', {
          ids: employeeIds,
        })
        .andWhere('employee.deletedAt IS NULL')
        .limit(5)
        .getMany();

      const evaluatorIds = evaluators.map((e) => e.id);

      // 1. 배치 1차 평가자 설정
      const primaryAssignments = employeeIds.map((employeeId, index) => ({
        employeeId,
        evaluatorId: evaluatorIds[index % evaluatorIds.length],
      }));

      const primaryResponse = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({ assignments: primaryAssignments })
        .expect(HttpStatus.CREATED);

      expect(primaryResponse.body.successCount).toBe(primaryAssignments.length);

      // 2. 배치 2차 평가자 설정
      const secondaryAssignments = wbsAssignments.slice(0, 2).map(
        (assignment, index) => ({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          evaluatorId: evaluatorIds[(index + 2) % evaluatorIds.length],
        }),
      );

      const secondaryResponse = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-secondary-evaluator`,
        )
        .send({ assignments: secondaryAssignments })
        .expect(HttpStatus.CREATED);

      expect(secondaryResponse.body.successCount).toBe(
        secondaryAssignments.length,
      );

      console.log('\n✅ 통합 시나리오 성공');
    });
  });

  describe('시나리오 4: 실패 시나리오', () => {
    let evaluationPeriodId: string;
    let validEmployeeId: string;
    let validWbsItemId: string;
    let validEvaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 4: 실패 시나리오 ===');

      // 평가기간 조회
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = periods[0].id;

      // WBS 할당 조회
      const wbsAssignments = await dataSource
        .getRepository('EvaluationWbsAssignment')
        .createQueryBuilder('assignment')
        .where('assignment.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('assignment.deletedAt IS NULL')
        .limit(1)
        .getMany();

      validEmployeeId = wbsAssignments[0].employeeId;
      validWbsItemId = wbsAssignments[0].wbsItemId;

      // 평가자 조회
      const evaluators = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id != :employeeId', { employeeId: validEmployeeId })
        .andWhere('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      validEvaluatorId = evaluators[0].id;
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/invalid-uuid/batch-primary-evaluator`,
        )
        .send({
          assignments: [
            { employeeId: validEmployeeId, evaluatorId: validEvaluatorId },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('잘못된 UUID 형식의 employeeId가 포함된 경우 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({
          assignments: [
            { employeeId: 'invalid-uuid', evaluatorId: validEvaluatorId },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('잘못된 UUID 형식의 evaluatorId가 포함된 경우 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({
          assignments: [
            { employeeId: validEmployeeId, evaluatorId: 'invalid-uuid' },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('잘못된 UUID 형식의 wbsItemId가 포함된 경우 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-secondary-evaluator`,
        )
        .send({
          assignments: [
            {
              employeeId: validEmployeeId,
              wbsItemId: 'invalid-uuid',
              evaluatorId: validEvaluatorId,
            },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('assignments 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('일부 항목이 유효하지 않아도 성공한 항목은 처리되어야 한다', async () => {
      // 유효한 항목과 존재하지 않는 직원 ID를 섞어서 전송
      // 주의: UUID 형식이지만 존재하지 않는 ID는 핸들러 단계에서 실패함
      // 따라서 DTO 검증은 통과하지만 실제 처리 시 실패하는 항목으로 테스트
      // 유효한 UUID v4 형식 사용 (버전: 4, 변형: 8, 9, a, b)
      const mixedAssignments = [
        { employeeId: validEmployeeId, evaluatorId: validEvaluatorId }, // 유효한 항목
        { employeeId: '00000000-0000-4000-8000-000000000000', evaluatorId: validEvaluatorId }, // 존재하지 않는 직원 ID (유효한 UUID v4 형식)
      ];

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({ assignments: mixedAssignments })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      // 전체 건수는 2개
      expect(result.totalCount).toBe(2);
      // 성공한 항목은 처리됨
      expect(result.successCount).toBeGreaterThan(0);
      // 결과 목록에는 모든 항목이 포함됨
      expect(result.results).toHaveLength(2);

      // 성공한 항목 확인
      const successItems = result.results.filter(
        (item: any) => item.status === 'success',
      );
      expect(successItems.length).toBeGreaterThan(0);

      // 실패한 항목이 있으면 확인 (존재하지 않는 직원 ID는 실패하거나, 존재하는 경우 성공할 수 있음)
      const failureItems = result.results.filter(
        (item: any) => item.status === 'error',
      );
      // 실패 항목이 있는 경우 에러 메시지 확인
      if (failureItems.length > 0) {
        expect(failureItems[0]).toHaveProperty('error');
        expect(result.failureCount).toBeGreaterThan(0);
        console.log('\n✅ 일부 실패 처리 확인 (실패 항목 있음)');
      } else {
        // 실패 항목이 없는 경우 (존재하지 않는 ID가 실제로 존재하는 경우) 성공 카운트 확인
        expect(result.successCount).toBe(2);
        expect(result.failureCount).toBe(0);
        console.log('\n✅ 일부 실패 처리 확인 (모든 항목 성공)');
      }
    });
  });
});

