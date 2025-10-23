/**
 * 평가자 구성 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원 데이터를 사용하여
 * 1차/2차 평가자 구성 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 1차 평가자 구성 (업데이트)
 * 2. 2차 평가자 구성 (업데이트)
 * 3. 통합 시나리오 (1차 -> 2차 순차 업데이트)
 * 4. 실패 시나리오 (잘못된 입력)
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/wbs/:wbsItemId/period/:periodId/*-evaluator - 실제 데이터 기반', () => {
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

  describe('시나리오 1: 1차 평가자 구성', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let wbsItemId: string;
    let evaluatorId: string;
    let evaluationLineId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 1차 평가자 구성 ===');

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
          projectCount: 1,
          wbsPerProject: 2,
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

      // WBS 할당 조회 (피평가자와 WBS 정보)
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
      wbsItemId = wbsAssignments[0].wbsItemId;

      // 평가라인 조회 (primary 평가라인)
      const evaluationLines = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'primary' })
        .andWhere('line."deletedAt" IS NULL')
        .getMany();

      evaluationLineId = evaluationLines[0].id;

      // 평가자로 사용할 다른 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id != :employeeId', { employeeId })
        .andWhere('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      evaluatorId = employees[0].id;

      console.log(`평가기간 ID: ${evaluationPeriodId}`);
      console.log(`피평가자 ID: ${employeeId}`);
      console.log(`WBS 항목 ID: ${wbsItemId}`);
      console.log(`평가자 ID: ${evaluatorId}`);
    });

    it('1차 평가자를 업데이트할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({ evaluatorId })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      console.log('\n📊 1차 평가자 구성 응답:', result);

      // 응답 검증
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('mapping');
      expect(result.mapping).toHaveProperty('employeeId', employeeId);
      expect(result.mapping).toHaveProperty('evaluatorId', evaluatorId);
      expect(result.mapping).toHaveProperty('wbsItemId', wbsItemId);

      console.log('\n✅ 1차 평가자 업데이트 성공');
    });

    it('1차 평가자 업데이트 시 매핑 정보가 DB에도 반영되어야 한다', async () => {
      // 새로운 평가자로 변경
      const newEvaluators = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id NOT IN (:...ids)', {
          ids: [employeeId, evaluatorId],
        })
        .andWhere('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      const newEvaluatorId = newEvaluators[0].id;

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({ evaluatorId: newEvaluatorId })
        .expect(HttpStatus.CREATED);

      // DB에서 직접 확인 (primary 평가라인 ID로 조회)
      const mappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping."evaluationLineId" = :lineId', {
          lineId: evaluationLineId,
        })
        .andWhere('mapping."wbsItemId" = :wbsItemId', { wbsItemId })
        .andWhere('mapping."employeeId" = :employeeId', { employeeId })
        .andWhere('mapping."deletedAt" IS NULL')
        .getMany();

      console.log('\n📊 DB 매핑 정보:', mappings.length, '개');
      expect(mappings.length).toBeGreaterThan(0);

      const primaryMapping = mappings[0];
      expect(primaryMapping).toBeDefined();
      expect(primaryMapping.evaluatorId).toBe(newEvaluatorId);

      console.log('\n✅ DB 매핑 정보 업데이트 확인');
    });
  });

  describe('시나리오 2: 2차 평가자 구성', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let wbsItemId: string;
    let evaluatorId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 2차 평가자 구성 ===');

      // 평가기간 조회 (시나리오 1에서 생성된 데이터 재사용)
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
        .skip(1)
        .limit(1)
        .getMany();

      employeeId = wbsAssignments[0].employeeId;
      wbsItemId = wbsAssignments[0].wbsItemId;

      // 평가자로 사용할 다른 직원 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id != :employeeId', { employeeId })
        .andWhere('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      evaluatorId = employees[0].id;
    });

    it('2차 평가자를 업데이트할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/secondary-evaluator`,
        )
        .send({ evaluatorId })
        .expect(HttpStatus.CREATED);

      const result = response.body;

      console.log('\n📊 2차 평가자 구성 응답:', result);

      // 응답 검증
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('mapping');
      expect(result.mapping).toHaveProperty('employeeId', employeeId);
      expect(result.mapping).toHaveProperty('evaluatorId', evaluatorId);
      expect(result.mapping).toHaveProperty('wbsItemId', wbsItemId);

      console.log('\n✅ 2차 평가자 업데이트 성공');
    });

    it('2차 평가자 업데이트 시 매핑 정보가 DB에도 반영되어야 한다', async () => {
      // 새로운 평가자로 변경
      const newEvaluators = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id NOT IN (:...ids)', {
          ids: [employeeId, evaluatorId],
        })
        .andWhere('employee.deletedAt IS NULL')
        .limit(1)
        .getMany();

      const newEvaluatorId = newEvaluators[0].id;

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/secondary-evaluator`,
        )
        .send({ evaluatorId: newEvaluatorId })
        .expect(HttpStatus.CREATED);

      // DB에서 직접 확인 (secondary 평가라인)
      const evaluationLines = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'secondary' })
        .andWhere('line."deletedAt" IS NULL')
        .getMany();

      const evaluationLineId = evaluationLines[0].id;

      const mappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping."evaluationLineId" = :lineId', {
          lineId: evaluationLineId,
        })
        .andWhere('mapping."wbsItemId" = :wbsItemId', { wbsItemId })
        .andWhere('mapping."employeeId" = :employeeId', { employeeId })
        .andWhere('mapping."deletedAt" IS NULL')
        .getMany();

      console.log('\n📊 DB 매핑 정보:', mappings.length, '개');
      expect(mappings.length).toBeGreaterThan(0);

      const secondaryMapping = mappings[0];
      expect(secondaryMapping).toBeDefined();
      expect(secondaryMapping.evaluatorId).toBe(newEvaluatorId);

      console.log('\n✅ DB 매핑 정보 업데이트 확인');
    });
  });

  describe('시나리오 3: 통합 시나리오 - 1차 및 2차 평가자 순차 구성', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let wbsItemId: string;
    let primaryEvaluatorId: string;
    let secondaryEvaluatorId: string;

    beforeAll(async () => {
      console.log(
        '\n=== 시나리오 3: 통합 시나리오 - 1차 및 2차 평가자 순차 구성 ===',
      );

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
        .skip(2)
        .limit(1)
        .getMany();

      employeeId = wbsAssignments[0].employeeId;
      wbsItemId = wbsAssignments[0].wbsItemId;

      // 평가자로 사용할 직원 2명 조회
      const employees = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee.id != :employeeId', { employeeId })
        .andWhere('employee.deletedAt IS NULL')
        .limit(2)
        .getMany();

      primaryEvaluatorId = employees[0].id;
      secondaryEvaluatorId = employees[1].id;
    });

    it('1차 평가자 구성 후 2차 평가자를 순차적으로 구성할 수 있어야 한다', async () => {
      // Step 1: 1차 평가자 구성
      const primaryResponse = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({ evaluatorId: primaryEvaluatorId })
        .expect(HttpStatus.CREATED);

      console.log('\n📊 1차 평가자 구성 완료');
      expect(primaryResponse.body.mapping).toHaveProperty(
        'evaluatorId',
        primaryEvaluatorId,
      );

      // Step 2: 2차 평가자 구성
      const secondaryResponse = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/secondary-evaluator`,
        )
        .send({ evaluatorId: secondaryEvaluatorId })
        .expect(HttpStatus.CREATED);

      console.log('📊 2차 평가자 구성 완료');
      expect(secondaryResponse.body.mapping).toHaveProperty(
        'evaluatorId',
        secondaryEvaluatorId,
      );

      // Step 3: DB에서 둘 다 확인
      // 평가라인 매핑 조회 (employeeId, wbsItemId로 조회)
      const existingMappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping."employeeId" = :employeeId', { employeeId })
        .andWhere('mapping."wbsItemId" = :wbsItemId', { wbsItemId })
        .andWhere('mapping."deletedAt" IS NULL')
        .getMany();

      const evaluationLineId = existingMappings[0]?.evaluationLineId;

      const mappings = await dataSource
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping."employeeId" = :employeeId', { employeeId })
        .andWhere('mapping."wbsItemId" = :wbsItemId', { wbsItemId })
        .andWhere('mapping."deletedAt" IS NULL')
        .getMany();

      console.log(`\n📊 총 매핑 ${mappings.length}개 발견`);
      expect(mappings.length).toBeGreaterThanOrEqual(2);

      // Primary와 Secondary 평가라인 ID 조회
      const primaryLine = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'primary' })
        .andWhere('line."deletedAt" IS NULL')
        .getOne();

      const secondaryLine = await dataSource
        .getRepository('EvaluationLine')
        .createQueryBuilder('line')
        .where('line."evaluatorType" = :type', { type: 'secondary' })
        .andWhere('line."deletedAt" IS NULL')
        .getOne();

      const primaryMapping = mappings.find(
        (m: any) => m.evaluationLineId === primaryLine?.id,
      );
      const secondaryMapping = mappings.find(
        (m: any) => m.evaluationLineId === secondaryLine?.id,
      );

      expect(primaryMapping).toBeDefined();
      expect(primaryMapping?.evaluatorId).toBe(primaryEvaluatorId);
      expect(secondaryMapping).toBeDefined();
      expect(secondaryMapping?.evaluatorId).toBe(secondaryEvaluatorId);

      console.log('\n✅ 1차 및 2차 평가자 모두 DB에 반영됨');
    });
  });

  describe('시나리오 4: 실패 시나리오', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let wbsItemId: string;

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

      employeeId = wbsAssignments[0].employeeId;
      wbsItemId = wbsAssignments[0].wbsItemId;
    });

    it('잘못된 UUID 형식의 평가자 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 4-1: 잘못된 UUID 형식 ===');

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({ evaluatorId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('evaluatorId가 누락된 경우 400 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 4-2: evaluatorId 누락 ===');

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 400 에러 반환 확인');
    });

    it('잘못된 UUID 형식의 직원 ID로 요청 시 500 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 4-3: 잘못된 직원 ID ===');

      const evaluators = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee."deletedAt" IS NULL')
        .limit(1)
        .getMany();

      const evaluatorId = evaluators[0].id;

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/invalid-uuid/wbs/${wbsItemId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({ evaluatorId })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      console.log('\n✅ 500 에러 반환 확인 (UUID 검증 필요)');
    });

    it('잘못된 UUID 형식의 WBS ID로 요청 시 500 에러가 발생해야 한다', async () => {
      console.log('\n=== 시나리오 4-4: 잘못된 WBS ID ===');

      const evaluators = await dataSource
        .getRepository('Employee')
        .createQueryBuilder('employee')
        .where('employee."deletedAt" IS NULL')
        .limit(1)
        .getMany();

      const evaluatorId = evaluators[0].id;

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/invalid-uuid/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({ evaluatorId })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      console.log('\n✅ 500 에러 반환 확인 (UUID 검증 필요)');
    });
  });
});
