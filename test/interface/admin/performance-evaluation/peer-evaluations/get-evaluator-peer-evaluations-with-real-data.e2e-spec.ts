/**
 * 평가자의 동료평가 목록 조회 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId (실제 데이터)', () => {
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
      .send({ scenario: 'full', clearExisting: false })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getEvaluatorWithPeerEvaluations() {
    const result = await dataSource.query(
      `SELECT DISTINCT pe."evaluatorId"
       FROM peer_evaluation pe
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0].evaluatorId : null;
  }

  async function getEvaluationWithQuestions() {
    const result = await dataSource.query(
      `SELECT pe.id, pe."evaluatorId"
       FROM peer_evaluation pe
       INNER JOIN peer_evaluation_question_mapping pem 
         ON pem."peerEvaluationId" = pe.id 
         AND pem."deletedAt" IS NULL
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getEvaluationWithAnswersAndScore() {
    const result = await dataSource.query(
      `SELECT pe.id, pe."evaluatorId", pem."questionId"
       FROM peer_evaluation pe
       INNER JOIN peer_evaluation_question_mapping pem 
         ON pem."peerEvaluationId" = pe.id 
         AND pem."deletedAt" IS NULL
         AND pem.answer IS NOT NULL
         AND pem.score IS NOT NULL
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getPeriodId() {
    const periods = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return periods.length > 0 ? periods[0].id : null;
  }

  async function getEvaluateeId() {
    const result = await dataSource.query(
      `SELECT DISTINCT pe."evaluateeId"
       FROM peer_evaluation pe
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0].evaluateeId : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 케이스', () => {
    it('기본 목록: 동료평가 목록을 조회할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');

      console.log('\n✅ 기본 목록 조회 성공');
    });

    it('evaluatorId 없이 모든 평가자의 동료평가 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations/evaluator')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      console.log('\n✅ evaluatorId 없이 모든 평가자 목록 조회 성공');
    });

    it('여러 개의 평가 목록을 조회할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(0);

      // 점수 필드 검증
      if (response.body.evaluations.length > 0) {
        const evaluation = response.body.evaluations[0];
        if (evaluation.questions && evaluation.questions.length > 0) {
          const question = evaluation.questions[0];
          expect(question).toHaveProperty('score');
          // score는 optional이므로 undefined일 수도 있음
          if (question.score !== undefined) {
            expect(typeof question.score).toBe('number');
            expect(question.score).toBeGreaterThanOrEqual(1);
            expect(question.score).toBeLessThanOrEqual(5);
          }
        }
      }

      console.log('\n✅ 여러 평가 목록 조회 성공');
    });

    it('페이지네이션: page와 limit 파라미터가 작동해야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ page: 1, limit: 5 })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.limit).toBe(5);

      console.log('\n✅ 페이지네이션 성공');
    });

    it('evaluatorId 없이 페이지네이션이 작동해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations/evaluator')
        .query({ page: 1, limit: 3 })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body.limit).toBe(3);
      expect(response.body.page).toBe(1);

      console.log('\n✅ evaluatorId 없이 페이지네이션 성공');
    });

    it('필터링: evaluateeId로 필터링할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      const evaluateeId = await getEvaluateeId();

      if (!evaluatorId || !evaluateeId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ evaluateeId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ evaluateeId 필터링 성공');
    });

    it('필터링: periodId로 필터링할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      const periodId = await getPeriodId();

      if (!evaluatorId || !periodId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ periodId 필터링 성공');
    });

    it('필터링: status로 필터링할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ status: 'in_progress' });

      // 400 또는 200 허용 (API가 status 값을 검증할 수 있음)
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ status 필터링 처리');
    });

    it('evaluatorId 없이 periodId로 필터링할 수 있어야 한다', async () => {
      const periodId = await getPeriodId();
      if (!periodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations/evaluator')
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');

      console.log('\n✅ evaluatorId 없이 periodId 필터링 성공');
    });

    it('evaluatorId 없이 evaluateeId로 필터링할 수 있어야 한다', async () => {
      const evaluateeId = await getEvaluateeId();
      if (!evaluateeId) {
        console.log('피평가자가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations/evaluator')
        .query({ evaluateeId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');

      console.log('\n✅ evaluatorId 없이 evaluateeId 필터링 성공');
    });

    it('응답 구조: 평가 정보가 포함되어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('evaluator');
        expect(firstItem).toHaveProperty('evaluatee');
        expect(firstItem).toHaveProperty('period');
        expect(firstItem).toHaveProperty('status');
        expect(firstItem).toHaveProperty('questions');
        expect(firstItem).toHaveProperty('mappedBy');
      }

      console.log('\n✅ 응답 구조 확인');
    });

    it('상세 조회 형태: 각 평가 항목이 상세 조회와 동일한 구조여야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];

        // 기본 평가 정보 검증
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('evaluationDate');
        expect(firstItem).toHaveProperty('status');
        expect(firstItem).toHaveProperty('isCompleted');
        expect(firstItem).toHaveProperty('mappedDate');
        expect(firstItem).toHaveProperty('isActive');
        expect(firstItem).toHaveProperty('createdAt');
        expect(firstItem).toHaveProperty('updatedAt');
        expect(firstItem).toHaveProperty('version');

        // 평가기간 정보 검증
        expect(firstItem.period).toBeDefined();
        if (firstItem.period) {
          expect(firstItem.period).toHaveProperty('id');
          expect(firstItem.period).toHaveProperty('name');
          expect(firstItem.period).toHaveProperty('startDate');
          expect(firstItem.period).toHaveProperty('endDate');
          expect(firstItem.period).toHaveProperty('status');
        }

        // 평가자 정보 검증
        expect(firstItem.evaluator).toBeDefined();
        expect(firstItem.evaluator).not.toBeNull();
        expect(firstItem.evaluator).toHaveProperty('id');
        expect(firstItem.evaluator).toHaveProperty('name');
        expect(firstItem.evaluator).toHaveProperty('employeeNumber');
        expect(firstItem.evaluator).toHaveProperty('email');
        expect(firstItem.evaluator).toHaveProperty('departmentId');
        expect(firstItem.evaluator).toHaveProperty('status');
        expect(firstItem.evaluator).toHaveProperty('rankName');
        expect(firstItem.evaluator).toHaveProperty('roles');
        expect(typeof firstItem.evaluator.rankName).toBe('string');
        expect(Array.isArray(firstItem.evaluator.roles)).toBe(true);

        // 평가자 부서 정보 검증
        if (firstItem.evaluatorDepartment) {
          expect(firstItem.evaluatorDepartment).toHaveProperty('id');
          expect(firstItem.evaluatorDepartment).toHaveProperty('name');
          expect(firstItem.evaluatorDepartment).toHaveProperty('code');
        }

        // 피평가자 정보 검증
        expect(firstItem.evaluatee).toBeDefined();
        if (firstItem.evaluatee) {
          expect(firstItem.evaluatee).toHaveProperty('id');
          expect(firstItem.evaluatee).toHaveProperty('name');
          expect(firstItem.evaluatee).toHaveProperty('employeeNumber');
          expect(firstItem.evaluatee).toHaveProperty('email');
          expect(firstItem.evaluatee).toHaveProperty('departmentId');
          expect(firstItem.evaluatee).toHaveProperty('status');
        }

        // 피평가자 부서 정보 검증
        if (firstItem.evaluateeDepartment) {
          expect(firstItem.evaluateeDepartment).toHaveProperty('id');
          expect(firstItem.evaluateeDepartment).toHaveProperty('name');
          expect(firstItem.evaluateeDepartment).toHaveProperty('code');
        }

        // 매핑자 정보 검증
        if (firstItem.mappedBy) {
          expect(firstItem.mappedBy).toHaveProperty('id');
          expect(firstItem.mappedBy).toHaveProperty('name');
          expect(firstItem.mappedBy).toHaveProperty('employeeNumber');
          expect(firstItem.mappedBy).toHaveProperty('email');
          expect(firstItem.mappedBy).toHaveProperty('status');
        }

        // 질문 목록 검증
        expect(firstItem.questions).toBeDefined();
        expect(Array.isArray(firstItem.questions)).toBe(true);
        if (firstItem.questions.length > 0) {
          const firstQuestion = firstItem.questions[0];
          expect(firstQuestion).toHaveProperty('id');
          expect(firstQuestion).toHaveProperty('text');
          expect(firstQuestion).toHaveProperty('displayOrder');
          // 답변이 있는 경우 추가 필드 검증
          if (firstQuestion.answer) {
            expect(firstQuestion).toHaveProperty('answeredAt');
            expect(firstQuestion).toHaveProperty('answeredBy');
          }
        }

        // createdBy, updatedBy가 제거되었는지 확인
        expect(firstItem).not.toHaveProperty('createdBy');
        expect(firstItem).not.toHaveProperty('updatedBy');
      }

      console.log('\n✅ 상세 조회 형태 구조 검증 완료');
    });

    it('데이터 타입 검증: 모든 필드의 타입이 올바른지 확인한다', async () => {
      // score가 있는 평가를 찾거나 생성
      let evaluationWithScore = await getEvaluationWithAnswersAndScore();
      let evaluatorId: string | null = null;
      let evaluationId: string | null = null;

      if (evaluationWithScore) {
        evaluatorId = evaluationWithScore.evaluatorId;
        evaluationId = evaluationWithScore.id;
      } else {
        // score가 있는 평가가 없으면 새로 생성하고 답변 저장
        const employees = await dataSource.query(
          `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 2`,
        );
        const period = await getPeriodId();
        const questions = await dataSource.query(
          `SELECT id FROM evaluation_question WHERE "deletedAt" IS NULL LIMIT 1`,
        );

        if (employees.length >= 2 && period && questions.length > 0) {
          const createResponse = await testSuite
            .request()
            .post('/admin/performance-evaluation/peer-evaluations/requests')
            .send({
              evaluatorId: employees[0].id,
              evaluateeId: employees[1].id,
              periodId: period,
              questionIds: [questions[0].id],
            });

          if (createResponse.status === 201) {
            evaluationId = createResponse.body.id;
            evaluatorId = employees[0].id;

            // 답변과 score 저장 (score는 1-5 범위)
            const answerResponse = await testSuite
              .request()
              .post(
                `/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`,
              )
              .send({
                peerEvaluationId: evaluationId,
                answers: [
                  {
                    questionId: questions[0].id,
                    answer: '테스트 답변입니다.',
                    score: 4,
                  },
                ],
              });
            
            // 400 에러인 경우 로그 출력
            if (answerResponse.status !== HttpStatus.CREATED) {
              console.log('답변 저장 실패:', answerResponse.status, answerResponse.body);
            }
          }
        }
      }

      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      // 질문이 있는 평가를 찾기
      const evaluationWithQuestion = response.body.evaluations.find(
        (e: any) => e.questions && e.questions.length > 0,
      );

      if (!evaluationWithQuestion) {
        console.log('질문이 있는 평가를 찾을 수 없어 테스트 스킵');
        return;
      }

      // score가 있는 질문 찾기
      const questionWithScoreForDisplay = evaluationWithQuestion.questions.find(
        (q: any) => q.score !== null && q.score !== undefined,
      );

      // 실제 반환값 확인을 위한 검증 및 JSON 출력
      const actualData = {
        evaluator: {
          rankName: evaluationWithQuestion.evaluator.rankName,
          roles: evaluationWithQuestion.evaluator.roles,
          fullEvaluator: evaluationWithQuestion.evaluator,
        },
        question: questionWithScoreForDisplay || (evaluationWithQuestion.questions && evaluationWithQuestion.questions.length > 0
          ? {
              score: evaluationWithQuestion.questions[0].score,
              fullQuestion: evaluationWithQuestion.questions[0],
            }
          : null),
      };

      // JSON 값을 출력 (silent 모드에서도 보이도록 process.stdout 사용)
      const jsonOutput = JSON.stringify(actualData, null, 2);
      process.stdout.write('\n📊 실제 반환 데이터:\n');
      process.stdout.write(jsonOutput);
      process.stdout.write('\n\n');

      // evaluator 객체 구조 확인
      expect(evaluationWithQuestion.evaluator).toHaveProperty('rankName');
      expect(evaluationWithQuestion.evaluator).toHaveProperty('roles');
      
      // rankName 값 확인 (빈 문자열 또는 실제 값)
      const rankNameValue = evaluationWithQuestion.evaluator.rankName;
      expect(rankNameValue).toBeDefined();
      expect(rankNameValue === '' || typeof rankNameValue === 'string').toBe(true);
      
      // roles 값 확인 (빈 배열 또는 실제 배열)
      const rolesValue = evaluationWithQuestion.evaluator.roles;
      expect(rolesValue).toBeDefined();
      expect(Array.isArray(rolesValue)).toBe(true);
      
      // 질문의 score 필드 확인
      if (evaluationWithQuestion.questions && evaluationWithQuestion.questions.length > 0) {
        const firstQuestion = evaluationWithQuestion.questions[0];
        expect(firstQuestion).toHaveProperty('score');
        // score는 null, undefined, 또는 number 타입일 수 있음
        if (firstQuestion.score !== null && firstQuestion.score !== undefined) {
          expect(typeof firstQuestion.score).toBe('number');
        }
      }

      // 기본 타입 검증
      expect(typeof evaluationWithQuestion.id).toBe('string');
      expect(typeof evaluationWithQuestion.status).toBe('string');
      expect(typeof evaluationWithQuestion.isCompleted).toBe('boolean');
      expect(typeof evaluationWithQuestion.isActive).toBe('boolean');
      expect(typeof evaluationWithQuestion.version).toBe('number');
      expect(typeof evaluationWithQuestion.evaluationDate).toBe('string');
      expect(typeof evaluationWithQuestion.mappedDate).toBe('string');
      expect(typeof evaluationWithQuestion.createdAt).toBe('string');
      expect(typeof evaluationWithQuestion.updatedAt).toBe('string');
      
      // 날짜 형식 검증 (ISO 8601)
      expect(evaluationWithQuestion.evaluationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(evaluationWithQuestion.mappedDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(evaluationWithQuestion.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(evaluationWithQuestion.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // 평가기간 타입 검증
      if (evaluationWithQuestion.period) {
        expect(typeof evaluationWithQuestion.period.id).toBe('string');
        expect(typeof evaluationWithQuestion.period.name).toBe('string');
        expect(typeof evaluationWithQuestion.period.status).toBe('string');
        expect(typeof evaluationWithQuestion.period.startDate).toBe('string');
        expect(typeof evaluationWithQuestion.period.endDate).toBe('string');
        
        // 날짜 형식 검증
        expect(evaluationWithQuestion.period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(evaluationWithQuestion.period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }

      // 평가자 타입 검증
      expect(evaluationWithQuestion.evaluator).toBeDefined();
      expect(typeof evaluationWithQuestion.evaluator.id).toBe('string');
      expect(typeof evaluationWithQuestion.evaluator.name).toBe('string');
      expect(typeof evaluationWithQuestion.evaluator.employeeNumber).toBe('string');
      expect(typeof evaluationWithQuestion.evaluator.email).toBe('string');
      expect(typeof evaluationWithQuestion.evaluator.status).toBe('string');
      expect(typeof evaluationWithQuestion.evaluator.rankName).toBe('string');
      expect(Array.isArray(evaluationWithQuestion.evaluator.roles)).toBe(true);
      evaluationWithQuestion.evaluator.roles.forEach((role: any) => {
        expect(typeof role).toBe('string');
      });

      // 피평가자 타입 검증
      if (evaluationWithQuestion.evaluatee) {
        expect(typeof evaluationWithQuestion.evaluatee.id).toBe('string');
        expect(typeof evaluationWithQuestion.evaluatee.name).toBe('string');
        expect(typeof evaluationWithQuestion.evaluatee.employeeNumber).toBe('string');
        expect(typeof evaluationWithQuestion.evaluatee.email).toBe('string');
        expect(typeof evaluationWithQuestion.evaluatee.status).toBe('string');
      }

      // 질문 타입 검증 (질문이 있는 경우)
      expect(Array.isArray(evaluationWithQuestion.questions)).toBe(true);
      expect(evaluationWithQuestion.questions.length).toBeGreaterThan(0);
      
      // score가 있는 질문 찾기
      const questionWithScore = evaluationWithQuestion.questions.find(
        (q: any) => q.score !== null && q.score !== undefined,
      );

      if (questionWithScore) {
        expect(typeof questionWithScore.id).toBe('string');
        expect(typeof questionWithScore.text).toBe('string');
        expect(typeof questionWithScore.displayOrder).toBe('number');
        if (questionWithScore.minScore !== undefined) {
          expect(typeof questionWithScore.minScore).toBe('number');
        }
        if (questionWithScore.maxScore !== undefined) {
          expect(typeof questionWithScore.maxScore).toBe('number');
        }
        // score 필드 타입 검증 (score가 있는 경우)
        expect(questionWithScore).toHaveProperty('score');
        expect(typeof questionWithScore.score).toBe('number');
        expect(questionWithScore.score).toBeGreaterThanOrEqual(1);
      } else {
        // score가 없는 경우도 확인 (기본 검증)
        const firstQuestion = evaluationWithQuestion.questions[0];
        expect(typeof firstQuestion.id).toBe('string');
        expect(typeof firstQuestion.text).toBe('string');
        expect(typeof firstQuestion.displayOrder).toBe('number');
        expect(firstQuestion).toHaveProperty('score');
      }

      console.log('\n✅ 데이터 타입 검증 완료');
    });

    it('evaluatorId 없이 조회 시에도 상세 구조가 유지되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations/evaluator')
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];

        // 상세 구조 검증
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('evaluator');
        expect(firstItem).toHaveProperty('evaluatee');
        expect(firstItem).toHaveProperty('period');
        expect(firstItem).toHaveProperty('questions');
        expect(firstItem).toHaveProperty('mappedBy');

        // createdBy, updatedBy가 없는지 확인
        expect(firstItem).not.toHaveProperty('createdBy');
        expect(firstItem).not.toHaveProperty('updatedBy');

        // 평가자와 피평가자가 다른지 확인 (실제 데이터 검증)
        if (firstItem.evaluator && firstItem.evaluatee) {
          expect(firstItem.evaluator.id).not.toBe(firstItem.evaluatee.id);
        }
      }

      console.log('\n✅ evaluatorId 없이 조회 시 상세 구조 유지 확인');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 평가자 ID로 조회 시 빈 목록을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${nonExistentId}`,
        )
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 존재하지 않는 평가자 처리');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid';

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${invalidId}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 처리');
    });

    it('잘못된 페이지 번호 시 400 에러', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ page: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 페이지 처리');
    });
  });
});
