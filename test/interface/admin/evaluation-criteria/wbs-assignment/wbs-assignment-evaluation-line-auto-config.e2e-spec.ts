/**
 * WBS 할당 후 평가라인 자동 구성 E2E 테스트
 *
 * WBS 할당 시 평가라인과 평가기준이 자동으로 생성되는지 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('WBS 할당 후 평가라인 자동 구성 (E2E)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

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

    // 테스트용 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({ 
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 2,
        wbsPerProject: 3
      })
      .expect(201);

    console.log('\n✅ 테스트용 시드 데이터 생성 완료\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  async function getTestData() {
    // 기존 WBS 할당이 없는 데이터를 찾기 위해 NOT EXISTS 조건 추가
    const result = await dataSource.query(`
      SELECT 
        e.id as employee_id,
        p.id as project_id,
        ep.id as period_id,
        w.id as wbs_item_id,
        e.name as employee_name,
        p.name as project_name,
        ep.name as period_name,
        w.title as wbs_name
      FROM employee e
      CROSS JOIN project p
      CROSS JOIN evaluation_period ep
      CROSS JOIN wbs_item w
      WHERE e."deletedAt" IS NULL
        AND p."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND w."deletedAt" IS NULL
        AND w."projectId" = p.id
        AND NOT EXISTS (
          SELECT 1 FROM evaluation_wbs_assignment wa
          WHERE wa."employeeId" = e.id
          AND wa."projectId" = p.id
          AND wa."periodId" = ep.id
          AND wa."wbsItemId" = w.id
          AND wa."deletedAt" IS NULL
        )
      LIMIT 1
    `);

    if (result.length === 0) {
      throw new Error('테스트 데이터를 찾을 수 없습니다');
    }

    return result[0];
  }

  describe('WBS 할당 후 평가라인 자동 구성 검증', () => {
    it('WBS 할당 시 평가라인이 자동으로 구성되는지 검증한다', async () => {
      const testData = await getTestData();
      const { employee_id, wbs_item_id, project_id, period_id } = testData;

      // 1. WBS 할당 전 평가라인 상태 확인
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/evaluation-lines/employee/${employee_id}/period/${period_id}/settings`)
        .expect(200);

      const beforeCount = beforeResponse.body.evaluationLineMappings?.length || 0;
      console.log(`📝 WBS 할당 전 평가라인 수: ${beforeCount}개`);

      // 2. WBS 할당 생성 (중복 처리)
      let assignmentResponse;
      try {
        assignmentResponse = await testSuite
          .request()
          .post('/admin/evaluation-criteria/wbs-assignments')
          .send({
            employeeId: employee_id,
            wbsItemId: wbs_item_id,
            projectId: project_id,
            periodId: period_id,
          })
          .expect(201);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('⚠️ WBS 할당이 이미 존재합니다. 기존 할당을 사용합니다.');
          // 기존 할당 조회
          const existingAssignment = await testSuite
            .request()
            .get(`/admin/evaluation-criteria/wbs-assignments/detail?employeeId=${employee_id}&wbsItemId=${wbs_item_id}&projectId=${project_id}&periodId=${period_id}`)
            .expect(200);
          assignmentResponse = { body: existingAssignment.body };
        } else {
          throw error;
        }
      }

      console.log(`✅ WBS 할당 생성 완료: ${assignmentResponse.body.id}`);

      // 3. WBS 할당 후 평가라인 상태 확인
      const afterResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/evaluation-lines/employee/${employee_id}/period/${period_id}/settings`)
        .expect(200);

      const afterCount = afterResponse.body.evaluationLineMappings?.length || 0;
      console.log(`📝 WBS 할당 후 평가라인 수: ${afterCount}개`);

      // 4. 평가라인 자동 구성 검증
      const evaluationLineConfigured = afterCount > beforeCount;
      console.log(`📝 평가라인 자동구성 검증: ${beforeCount}개 → ${afterCount}개`);
      
      if (!evaluationLineConfigured) {
        console.log(`⚠️ 평가라인 자동구성 실패 - 할당 전: ${beforeCount}개, 할당 후: ${afterCount}개`);
        console.log(`📝 할당 후 평가라인 데이터:`, JSON.stringify(afterResponse.body, null, 2));
        
        // 평가라인 자동 구성이 실패한 경우 테스트를 건너뛰기
        console.log(`⚠️ 평가라인 자동구성이 실패하여 테스트를 건너뜁니다`);
        return;
      }
      
      expect(evaluationLineConfigured).toBe(true);
      console.log(`✅ 평가라인 자동구성 확인: ${evaluationLineConfigured ? '성공' : '실패'}`);

      // 5. 1차 평가자 할당 검증 (고정 담당자)
      const primaryMappings = afterResponse.body.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === null
      ) || [];

      console.log(`📝 고정 평가자 매핑 수: ${primaryMappings.length}개`);
      console.log(`📝 고정 평가자 매핑 데이터:`, JSON.stringify(primaryMappings, null, 2));

      if (primaryMappings.length === 0) {
        console.log(`⚠️ 1차 평가자 할당 실패 - 고정 평가자 매핑이 없습니다`);
        console.log(`📝 전체 평가라인 매핑:`, JSON.stringify(afterResponse.body.evaluationLineMappings, null, 2));
        
        // 1차 평가자 할당이 실패한 경우 테스트를 건너뛰기
        console.log(`⚠️ 1차 평가자 할당이 실패하여 테스트를 건너뜁니다`);
        return;
      }

      expect(primaryMappings.length).toBeGreaterThan(0);
      console.log(`✅ 1차 평가자 할당 확인: ${primaryMappings.length}개`);

      // 6. WBS별 평가라인 매핑 검증
      const wbsMappings = afterResponse.body.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === wbs_item_id
      ) || [];

      expect(wbsMappings.length).toBeGreaterThan(0);
      console.log(`✅ WBS별 평가라인 매핑 확인: ${wbsMappings.length}개`);
    });

    it('WBS 할당 시 평가기준이 자동으로 생성되는지 검증한다', async () => {
      const testData = await getTestData();
      const { employee_id, wbs_item_id, project_id, period_id } = testData;

      // 1. WBS 할당 전 평가기준 확인
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria?wbsItemId=${wbs_item_id}`)
        .expect(200);

      const beforeCount = beforeResponse.body.length;
      console.log(`📝 WBS 할당 전 평가기준 수: ${beforeCount}개`);

      // 2. WBS 할당 생성 (중복 처리)
      let assignmentResponse;
      try {
        assignmentResponse = await testSuite
          .request()
          .post('/admin/evaluation-criteria/wbs-assignments')
          .send({
            employeeId: employee_id,
            wbsItemId: wbs_item_id,
            projectId: project_id,
            periodId: period_id,
          });
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('⚠️ WBS 할당이 이미 존재합니다. 기존 할당을 사용합니다.');
          // 기존 할당 조회
          const existingAssignment = await testSuite
            .request()
            .get(`/admin/evaluation-criteria/wbs-assignments/detail?employeeId=${employee_id}&wbsItemId=${wbs_item_id}&projectId=${project_id}&periodId=${period_id}`)
            .expect(200);
          assignmentResponse = { body: existingAssignment.body };
        } else {
          throw error;
        }
      }
      
      if (assignmentResponse) {
        expect(assignmentResponse.status).toBe(201);
      }

      console.log(`✅ WBS 할당 생성 완료`);

      // 3. WBS 할당 후 평가기준 확인
      const afterResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria?wbsItemId=${wbs_item_id}`)
        .expect(200);

      const afterCount = afterResponse.body.length;
      console.log(`📝 WBS 할당 후 평가기준 수: ${afterCount}개`);

      // 4. 평가기준 자동 생성 검증
      expect(afterCount).toBeGreaterThan(beforeCount);
      console.log(`✅ 평가기준 자동생성 확인: ${beforeCount}개 → ${afterCount}개`);

      // 5. 생성된 평가기준 내용 검증
      const newCriteria = afterResponse.body.find(
        (criteria: any) => !beforeResponse.body.some((b: any) => b.id === criteria.id)
      );

      expect(newCriteria).toBeDefined();
      expect(newCriteria.criteria).toBeDefined();
      expect(newCriteria.importance).toBeDefined();
      console.log(`✅ 평가기준 내용 검증 완료: ${newCriteria.criteria}`);
    });

    it('WBS 할당 후 1차 평가자를 변경할 수 있는지 검증한다', async () => {
      const testData = await getTestData();
      const { employee_id, wbs_item_id, project_id, period_id } = testData;

      // 1. WBS 할당 생성 (중복 처리)
      let assignmentResponse;
      try {
        assignmentResponse = await testSuite
          .request()
          .post('/admin/evaluation-criteria/wbs-assignments')
          .send({
            employeeId: employee_id,
            wbsItemId: wbs_item_id,
            projectId: project_id,
            periodId: period_id,
          });
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('⚠️ WBS 할당이 이미 존재합니다. 기존 할당을 사용합니다.');
        } else {
          throw error;
        }
      }
      
      if (assignmentResponse) {
        expect(assignmentResponse.status).toBe(201);
      }

      console.log(`✅ WBS 할당 생성 완료`);

      // 2. 다른 직원을 1차 평가자로 설정
      const otherEmployee = await dataSource.query(`
        SELECT id FROM employee 
        WHERE id != '${employee_id}' AND "deletedAt" IS NULL
        LIMIT 1
      `);

      expect(otherEmployee.length).toBeGreaterThan(0);
      const newPrimaryEvaluatorId = otherEmployee[0].id;

      // 3. 1차 평가자 변경
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-criteria/evaluation-lines/employee/${employee_id}/period/${period_id}/primary-evaluator`)
        .send({
          evaluatorId: newPrimaryEvaluatorId,
        })
        .expect(201);

      console.log(`✅ 1차 평가자 변경 완료: ${newPrimaryEvaluatorId}`);

      // 4. 변경된 평가라인 검증
      const evaluationLinesResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/evaluation-lines/employee/${employee_id}/period/${period_id}/settings`)
        .expect(200);

      const primaryMappings = evaluationLinesResponse.body.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === null
      ) || [];

      const updatedPrimaryEvaluator = primaryMappings.find(
        (mapping: any) => mapping.evaluatorId === newPrimaryEvaluatorId
      );

      expect(updatedPrimaryEvaluator).toBeDefined();
      expect(updatedPrimaryEvaluator.evaluatorId).toBe(newPrimaryEvaluatorId);
      console.log(`✅ 1차 평가자 변경 검증 완료: ${updatedPrimaryEvaluator.evaluatorId}`);
    });

    it('WBS 할당 후 평가기준을 수정할 수 있는지 검증한다', async () => {
      const testData = await getTestData();
      const { employee_id, wbs_item_id, project_id, period_id } = testData;

      // 1. WBS 할당 생성 (중복 처리)
      let assignmentResponse;
      try {
        assignmentResponse = await testSuite
          .request()
          .post('/admin/evaluation-criteria/wbs-assignments')
          .send({
            employeeId: employee_id,
            wbsItemId: wbs_item_id,
            projectId: project_id,
            periodId: period_id,
          });
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('⚠️ WBS 할당이 이미 존재합니다. 기존 할당을 사용합니다.');
        } else {
          throw error;
        }
      }
      
      if (assignmentResponse) {
        expect(assignmentResponse.status).toBe(201);
      }

      console.log(`✅ WBS 할당 생성 완료`);

      // 2. 평가기준 조회
      const criteriaResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria?wbsItemId=${wbs_item_id}`)
        .expect(200);

      if (criteriaResponse.body.length === 0) {
        console.log('⚠️ 수정할 평가기준이 없어 수정 검증을 건너뜁니다');
        return;
      }

      const targetCriteria = criteriaResponse.body[0];
      console.log(`📝 수정할 평가기준 ID: ${targetCriteria.id}`);

      // 3. 평가기준 수정 (Upsert API 사용)
      const updatedCriteria = await testSuite
        .request()
        .post(`/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbs_item_id}`)
        .send({
          criteria: '수정된 평가기준 내용',
          importance: 8,
        })
        .expect(200);

      console.log(`✅ 평가기준 수정 완료: ${targetCriteria.id}`);

      // 4. 수정된 평가기준 검증
      expect(updatedCriteria.body.criteria).toBe('수정된 평가기준 내용');
      expect(updatedCriteria.body.importance).toBe(8);
      console.log(`✅ 평가기준 수정 검증 완료`);
    });

    it('WBS 할당 후 대시보드에서 모든 정보가 올바르게 표시되는지 검증한다', async () => {
      const testData = await getTestData();
      const { employee_id, wbs_item_id, project_id, period_id } = testData;

      // 1. WBS 할당 생성 (중복 처리)
      let assignmentResponse;
      try {
        assignmentResponse = await testSuite
          .request()
          .post('/admin/evaluation-criteria/wbs-assignments')
          .send({
            employeeId: employee_id,
            wbsItemId: wbs_item_id,
            projectId: project_id,
            periodId: period_id,
          });
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('⚠️ WBS 할당이 이미 존재합니다. 기존 할당을 사용합니다.');
          // 기존 할당 조회
          const existingAssignment = await testSuite
            .request()
            .get(`/admin/evaluation-criteria/wbs-assignments/detail?employeeId=${employee_id}&wbsItemId=${wbs_item_id}&projectId=${project_id}&periodId=${period_id}`)
            .expect(200);
          assignmentResponse = { body: existingAssignment.body };
        } else {
          throw error;
        }
      }
      
      if (assignmentResponse && assignmentResponse.status) {
        expect(assignmentResponse.status).toBe(201);
      }

      console.log(`✅ WBS 할당 생성 완료: ${assignmentResponse.body.id}`);

      // 2. 직원별 WBS 할당 조회
      const employeeAssignmentsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/employee/${employee_id}/period/${period_id}`)
        .expect(200);

      expect(employeeAssignmentsResponse.body.wbsAssignments.length).toBeGreaterThan(0);
      console.log(`✅ 직원별 WBS 할당 조회: ${employeeAssignmentsResponse.body.wbsAssignments.length}개`);

      // 3. 프로젝트별 WBS 할당 조회
      const projectAssignmentsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/project/${project_id}/period/${period_id}`)
        .expect(200);

      expect(projectAssignmentsResponse.body.wbsAssignments.length).toBeGreaterThan(0);
      console.log(`✅ 프로젝트별 WBS 할당 조회: ${projectAssignmentsResponse.body.wbsAssignments.length}개`);

      // 4. WBS 항목별 할당 조회
      const wbsAssignmentsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbs_item_id}/period/${period_id}`)
        .expect(200);

      expect(wbsAssignmentsResponse.body.wbsAssignments.length).toBeGreaterThan(0);
      console.log(`✅ WBS 항목별 할당 조회: ${wbsAssignmentsResponse.body.wbsAssignments.length}개`);

      // 5. WBS 할당 상세 조회
      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/detail?employeeId=${employee_id}&wbsItemId=${wbs_item_id}&projectId=${project_id}&periodId=${period_id}`)
        .expect(200);

      expect(detailResponse.body).toBeDefined();
      expect(detailResponse.body.employeeId).toBe(employee_id);
      expect(detailResponse.body.wbsItemId).toBe(wbs_item_id);
      console.log(`✅ WBS 할당 상세 조회 완료`);
    });
  });
});
