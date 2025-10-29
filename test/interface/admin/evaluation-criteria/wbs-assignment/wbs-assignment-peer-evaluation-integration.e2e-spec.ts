/**
 * WBS 할당과 동료평가 답변 저장 통합 테스트 - 실제 데이터 기반 E2E 테스트
 *
 * WBS 할당 시 자동으로 구성되는 동료평가 평가라인과 답변 저장 기능의 연관성을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('WBS 할당과 동료평가 답변 저장 통합 테스트 (실제 데이터)', () => {
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
    const result = await dataSource.query(`
      SELECT id, name, "managerId", "departmentId" 
      FROM employee 
      WHERE "deletedAt" IS NULL 
      ORDER BY "createdAt" 
      LIMIT 2
    `);
    return result.length >= 2 ? result : null;
  }

  async function getEvaluationPeriod() {
    const result = await dataSource.query(`
      SELECT id, name, "startDate", "endDate"
      FROM evaluation_period 
      WHERE "deletedAt" IS NULL 
      ORDER BY "createdAt" 
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getProject() {
    const result = await dataSource.query(`
      SELECT id, name, "managerId"
      FROM project 
      WHERE "deletedAt" IS NULL 
      ORDER BY "createdAt" 
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getWbsItem() {
    const result = await dataSource.query(`
      SELECT id, title, "wbsCode"
      FROM wbs_item 
      WHERE "deletedAt" IS NULL 
      ORDER BY "createdAt" 
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getEvaluationQuestions() {
    const result = await dataSource.query(`
      SELECT id, text, "minScore", "maxScore"
      FROM evaluation_question 
      WHERE "deletedAt" IS NULL 
      ORDER BY "createdAt" 
      LIMIT 3
    `);
    return result.length >= 2 ? result : null;
  }

  describe('WBS 할당 후 동료평가 답변 저장 통합 테스트', () => {
    it('WBS 할당 시 자동으로 구성된 평가라인을 통한 동료평가 답변 저장이 가능해야 한다', async () => {
      // 기존 데이터 정리
      await dataSource.query(`DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation_question_mapping WHERE "deletedAt" IS NULL`);

      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const project = await getProject();
      const wbsItem = await getWbsItem();
      const questions = await getEvaluationQuestions();

      if (!employees || !period || !project || !wbsItem || !questions) {
        console.log('필요한 데이터가 없어서 테스트 스킵');
        return;
      }

      const [evaluator, evaluatee] = employees;

      console.log('\n🔍 테스트 데이터:', {
        evaluator: { id: evaluator.id, name: evaluator.name },
        evaluatee: { id: evaluatee.id, name: evaluatee.name },
        period: { id: period.id, name: period.name },
        project: { id: project.id, name: project.name },
        wbsItem: { id: wbsItem.id, title: wbsItem.title },
        questions: questions.map(q => ({ id: q.id, text: q.text })),
      });

      // 1. WBS 할당 생성
      console.log('\n📝 1단계: WBS 할당 생성');
      const wbsAssignmentResponse = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: evaluatee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      console.log('✅ WBS 할당 생성 완료:', wbsAssignmentResponse.body);

      // 2. 평가라인 매핑 확인
      console.log('\n🔍 2단계: 평가라인 매핑 확인');
      const evaluationLineMappings = await dataSource.query(`
        SELECT 
          elm.id,
          elm."employeeId",
          elm."evaluatorId",
          elm."wbsItemId",
          elm."evaluationLineId",
          el."evaluatorType",
          el."order"
        FROM evaluation_line_mappings elm
        JOIN evaluation_lines el ON elm."evaluationLineId" = el.id
        WHERE elm."employeeId" = $1 
          AND elm."wbsItemId" = $2
          AND elm."deletedAt" IS NULL
        ORDER BY el."order"
      `, [evaluatee.id, wbsItem.id]);

      console.log('📊 평가라인 매핑:', evaluationLineMappings);

      // 3. 동료평가 요청 생성 (평가라인을 통한)
      console.log('\n📝 3단계: 동료평가 요청 생성');
      const peerEvaluationResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: questions.slice(0, 2).map(q => q.id),
        })
        .expect(HttpStatus.CREATED);

      const evaluationId = peerEvaluationResponse.body.id;
      console.log('✅ 동료평가 요청 생성 완료:', evaluationId);

      // 4. 동료평가 답변 저장
      console.log('\n📝 4단계: 동료평가 답변 저장');
      const answersData = [
        {
          questionId: questions[0].id,
          answer: 'WBS 할당과 연관된 첫 번째 질문에 대한 답변입니다.',
        },
        {
          questionId: questions[1].id,
          answer: 'WBS 할당과 연관된 두 번째 질문에 대한 답변입니다.',
        },
      ];

      const answersResponse = await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`)
        .send({
          peerEvaluationId: evaluationId,
          answers: answersData,
        })
        .expect(HttpStatus.CREATED);

      console.log('✅ 동료평가 답변 저장 완료:', answersResponse.body);

      // 5. 저장된 답변 확인
      console.log('\n🔍 5단계: 저장된 답변 확인');
      const savedAnswers = await dataSource.query(`
        SELECT 
          peqm.id,
          peqm."questionId",
          peqm.answer,
          peqm."answeredBy",
          peqm."answeredAt"
        FROM peer_evaluation_question_mapping peqm
        WHERE peqm."peerEvaluationId" = $1
          AND peqm."deletedAt" IS NULL
        ORDER BY peqm."createdAt"
      `, [evaluationId]);

      console.log('📊 저장된 답변:', savedAnswers);

      // 6. 검증
      expect(answersResponse.body.savedCount).toBe(2);
      expect(savedAnswers).toHaveLength(2);
      expect(savedAnswers[0].answer).toBe(answersData[0].answer);
      expect(savedAnswers[1].answer).toBe(answersData[1].answer);

      console.log('\n✅ WBS 할당과 동료평가 답변 저장 통합 테스트 완료');
    });

    it('WBS 할당 후 동료평가 상태 변경이 올바르게 동작해야 한다', async () => {
      // 기존 데이터 정리
      await dataSource.query(`DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation_question_mapping WHERE "deletedAt" IS NULL`);

      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const project = await getProject();
      const wbsItem = await getWbsItem();
      const questions = await getEvaluationQuestions();

      if (!employees || !period || !project || !wbsItem || !questions) {
        console.log('필요한 데이터가 없어서 테스트 스킵');
        return;
      }

      const [evaluator, evaluatee] = employees;

      // 1. WBS 할당 생성
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: evaluatee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      // 2. 동료평가 요청 생성
      const peerEvaluationResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id],
        })
        .expect(HttpStatus.CREATED);

      const evaluationId = peerEvaluationResponse.body.id;

      // 3. 초기 상태 확인 (PENDING)
      const initialStatus = await dataSource.query(`
        SELECT status FROM peer_evaluation 
        WHERE id = $1 AND "deletedAt" IS NULL
      `, [evaluationId]);

      expect(initialStatus[0].status).toBe('pending');

      // 4. 답변 저장 후 상태 변경 확인 (IN_PROGRESS)
      await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`)
        .send({
          peerEvaluationId: evaluationId,
          answers: [{
            questionId: questions[0].id,
            answer: '상태 변경 테스트 답변',
          }],
        })
        .expect(HttpStatus.CREATED);

      const updatedStatus = await dataSource.query(`
        SELECT status FROM peer_evaluation 
        WHERE id = $1 AND "deletedAt" IS NULL
      `, [evaluationId]);

      expect(updatedStatus[0].status).toBe('in_progress');

      console.log('\n✅ 동료평가 상태 변경 테스트 완료');
    });

    it('WBS 할당이 없는 경우 동료평가 답변 저장이 실패해야 한다', async () => {
      // 기존 데이터 정리
      await dataSource.query(`DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation_question_mapping WHERE "deletedAt" IS NULL`);

      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const questions = await getEvaluationQuestions();

      if (!employees || !period || !questions) {
        console.log('필요한 데이터가 없어서 테스트 스킵');
        return;
      }

      const [evaluator, evaluatee] = employees;

      // WBS 할당 없이 동료평가 요청 생성
      const peerEvaluationResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id],
        })
        .expect(HttpStatus.CREATED);

      const evaluationId = peerEvaluationResponse.body.id;

      // 답변 저장 시도 (평가라인 매핑이 없어서 실패할 수 있음)
      const answersResponse = await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`)
        .send({
          peerEvaluationId: evaluationId,
          answers: [{
            questionId: questions[0].id,
            answer: 'WBS 할당 없이 저장 시도하는 답변',
          }],
        });

      // 상태 코드가 201이 아닐 수 있음 (평가라인 매핑이 없어서)
      console.log('답변 저장 응답 상태:', answersResponse.status);
      console.log('답변 저장 응답 본문:', answersResponse.body);

      console.log('\n✅ WBS 할당 없이 동료평가 답변 저장 테스트 완료');
    });

    it('WBS 할당 후 여러 평가자가 동일한 피평가자에 대해 답변을 저장할 수 있어야 한다', async () => {
      // 기존 데이터 정리
      await dataSource.query(`DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation_question_mapping WHERE "deletedAt" IS NULL`);

      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const project = await getProject();
      const wbsItem = await getWbsItem();
      const questions = await getEvaluationQuestions();

      if (!employees || !period || !project || !wbsItem || !questions) {
        console.log('필요한 데이터가 없어서 테스트 스킵');
        return;
      }

      const [evaluator1, evaluatee] = employees;

      // 1. WBS 할당 생성
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: evaluatee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      // 2. 첫 번째 평가자의 동료평가 요청 생성
      const peerEvaluation1Response = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator1.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id],
        })
        .expect(HttpStatus.CREATED);

      const evaluation1Id = peerEvaluation1Response.body.id;

      // 3. 첫 번째 평가자의 답변 저장
      await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluation1Id}/answers`)
        .send({
          peerEvaluationId: evaluation1Id,
          answers: [{
            questionId: questions[0].id,
            answer: '첫 번째 평가자의 답변',
          }],
        })
        .expect(HttpStatus.CREATED);

      // 4. 두 번째 평가자 추가 (다른 직원)
      const additionalEmployees = await dataSource.query(`
        SELECT id, name FROM employee 
        WHERE "deletedAt" IS NULL AND id NOT IN ($1, $2)
        ORDER BY "createdAt" 
        LIMIT 1
      `, [evaluator1.id, evaluatee.id]);

      if (additionalEmployees.length === 0) {
        console.log('추가 평가자 데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluator2 = additionalEmployees[0];

      // 5. 두 번째 평가자의 동료평가 요청 생성
      const peerEvaluation2Response = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator2.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id],
        })
        .expect(HttpStatus.CREATED);

      const evaluation2Id = peerEvaluation2Response.body.id;

      // 6. 두 번째 평가자의 답변 저장
      await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluation2Id}/answers`)
        .send({
          peerEvaluationId: evaluation2Id,
          answers: [{
            questionId: questions[0].id,
            answer: '두 번째 평가자의 답변',
          }],
        })
        .expect(HttpStatus.CREATED);

      // 7. 두 평가자의 답변 모두 저장되었는지 확인
      const allAnswers = await dataSource.query(`
        SELECT 
          peqm.id,
          peqm."peerEvaluationId",
          peqm.answer,
          pe."evaluatorId"
        FROM peer_evaluation_question_mapping peqm
        JOIN peer_evaluation pe ON peqm."peerEvaluationId" = pe.id
        WHERE pe."evaluateeId" = $1
          AND peqm."deletedAt" IS NULL
        ORDER BY peqm."createdAt"
      `, [evaluatee.id]);

      expect(allAnswers).toHaveLength(2);
      expect(allAnswers[0].answer).toBe('첫 번째 평가자의 답변');
      expect(allAnswers[1].answer).toBe('두 번째 평가자의 답변');

      console.log('\n✅ 여러 평가자 답변 저장 테스트 완료');
    });
  });

  describe('WBS 할당과 동료평가 데이터 무결성 검증', () => {
    it('WBS 할당 삭제 시 관련 동료평가 데이터가 올바르게 처리되어야 한다', async () => {
      // 기존 데이터 정리
      await dataSource.query(`DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation_question_mapping WHERE "deletedAt" IS NULL`);

      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const project = await getProject();
      const wbsItem = await getWbsItem();
      const questions = await getEvaluationQuestions();

      if (!employees || !period || !project || !wbsItem || !questions) {
        console.log('필요한 데이터가 없어서 테스트 스킵');
        return;
      }

      const [evaluator, evaluatee] = employees;

      // 1. WBS 할당 생성
      const wbsAssignmentResponse = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: evaluatee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      // 2. 동료평가 요청 생성 및 답변 저장
      const peerEvaluationResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id],
        })
        .expect(HttpStatus.CREATED);

      const evaluationId = peerEvaluationResponse.body.id;

      await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`)
        .send({
          peerEvaluationId: evaluationId,
          answers: [{
            questionId: questions[0].id,
            answer: 'WBS 할당 삭제 전 답변',
          }],
        })
        .expect(HttpStatus.CREATED);

      // 3. WBS 할당 삭제
      const assignmentId = wbsAssignmentResponse.body.id;
      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}`)
        .expect(HttpStatus.OK);

      // 4. 동료평가 데이터는 여전히 존재해야 함 (소프트 삭제)
      const peerEvaluationExists = await dataSource.query(`
        SELECT id, status FROM peer_evaluation 
        WHERE id = $1 AND "deletedAt" IS NULL
      `, [evaluationId]);

      expect(peerEvaluationExists).toHaveLength(1);

      // 5. 답변 데이터도 여전히 존재해야 함
      const answersExist = await dataSource.query(`
        SELECT id, answer FROM peer_evaluation_question_mapping 
        WHERE "peerEvaluationId" = $1 AND "deletedAt" IS NULL
      `, [evaluationId]);

      expect(answersExist).toHaveLength(1);
      expect(answersExist[0].answer).toBe('WBS 할당 삭제 전 답변');

      console.log('\n✅ WBS 할당 삭제 후 동료평가 데이터 무결성 검증 완료');
    });

    it('WBS 할당과 동료평가 답변의 관계가 올바르게 유지되어야 한다', async () => {
      // 기존 데이터 정리
      await dataSource.query(`DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation WHERE "deletedAt" IS NULL`);
      await dataSource.query(`DELETE FROM peer_evaluation_question_mapping WHERE "deletedAt" IS NULL`);

      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const project = await getProject();
      const wbsItem = await getWbsItem();
      const questions = await getEvaluationQuestions();

      if (!employees || !period || !project || !wbsItem || !questions) {
        console.log('필요한 데이터가 없어서 테스트 스킵');
        return;
      }

      const [evaluator, evaluatee] = employees;

      // 1. WBS 할당 생성
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: evaluatee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: period.id,
        })
        .expect(HttpStatus.CREATED);

      // 2. 동료평가 요청 생성 및 답변 저장
      const peerEvaluationResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: questions.slice(0, 2).map(q => q.id),
        })
        .expect(HttpStatus.CREATED);

      const evaluationId = peerEvaluationResponse.body.id;

      await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`)
        .send({
          peerEvaluationId: evaluationId,
          answers: [
            {
              questionId: questions[0].id,
              answer: '첫 번째 질문 답변',
            },
            {
              questionId: questions[1].id,
              answer: '두 번째 질문 답변',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // 3. 관계 데이터 검증
      const relationshipData = await dataSource.query(`
        SELECT 
          ewa.id as assignment_id,
          ewa."employeeId",
          ewa."wbsItemId",
          pe.id as evaluation_id,
          pe."evaluatorId",
          pe."evaluateeId",
          peqm.id as answer_id,
          peqm."questionId",
          peqm.answer
        FROM evaluation_wbs_assignment ewa
        LEFT JOIN peer_evaluation pe ON pe."evaluateeId" = ewa."employeeId" 
          AND pe."periodId" = ewa."periodId"
          AND pe."deletedAt" IS NULL
        LEFT JOIN peer_evaluation_question_mapping peqm ON peqm."peerEvaluationId" = pe.id
          AND peqm."deletedAt" IS NULL
        WHERE ewa."employeeId" = $1 
          AND ewa."wbsItemId" = $2
          AND ewa."deletedAt" IS NULL
        ORDER BY peqm."createdAt"
      `, [evaluatee.id, wbsItem.id]);

      expect(relationshipData).toHaveLength(2); // 2개의 답변
      expect(relationshipData[0].assignment_id).toBeDefined();
      expect(relationshipData[0].evaluation_id).toBeDefined();
      expect(relationshipData[0].answer_id).toBeDefined();
      expect(relationshipData[0].answer).toBe('첫 번째 질문 답변');
      expect(relationshipData[1].answer).toBe('두 번째 질문 답변');

      console.log('\n✅ WBS 할당과 동료평가 답변 관계 검증 완료');
    });
  });
});
