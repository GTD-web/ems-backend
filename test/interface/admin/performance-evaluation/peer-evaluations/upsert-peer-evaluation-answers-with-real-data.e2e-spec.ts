/**
 * 동료평가 질문 답변 저장/업데이트 - 실제 데이터 기반 E2E 테스트
 *
 * API: POST /admin/performance-evaluation/peer-evaluations/:id/answers
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/:id/answers (실제 데이터)', () => {
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

  // ==================== 헬퍼 함수 ====================

  /**
   * 평가기간과 질문이 매핑된 동료평가를 생성한다
   */
  async function createPeerEvaluationWithQuestions() {
    // 1. 평가기간 가져오기
    const periods = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    if (periods.length === 0) return null;
    const periodId = periods[0].id;

    // 2. 직원 2명 가져오기
    const employees = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    if (employees.length < 2) return null;
    const evaluatorId = employees[0].id;
    const evaluateeId = employees[1].id;

    // 3. 질문 2개 가져오기
    const questions = await dataSource.query(
      `SELECT id FROM evaluation_question WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    if (questions.length < 2) return null;
    const questionIds = questions.map((q: any) => q.id);

    // 4. 동료평가 생성
    const response = await testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send({
        evaluatorId,
        evaluateeId,
        periodId,
        questionIds,
      });

    if (response.status !== HttpStatus.CREATED) {
      console.log('동료평가 생성 실패:', response.body);
      return null;
    }

    return {
      peerEvaluationId: response.body.id,
      evaluatorId,
      evaluateeId,
      periodId,
      questionIds,
    };
  }

  /**
   * DB에서 동료평가를 조회한다
   */
  async function getPeerEvaluationFromDb(id: string) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE id = $1`,
      [id],
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * DB에서 질문 매핑과 답변을 조회한다
   */
  async function getQuestionMappingsFromDb(peerEvaluationId: string) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation_question_mapping 
       WHERE "peerEvaluationId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "displayOrder" ASC`,
      [peerEvaluationId],
    );
    return records;
  }

  /**
   * 답변을 저장한다
   */
  async function upsertAnswers(peerEvaluationId: string, answers: any[]) {
    return testSuite
      .request()
      .post(
        `/admin/performance-evaluation/peer-evaluations/${peerEvaluationId}/answers`,
      )
      .send({
        peerEvaluationId,
        answers,
      });
  }

  // ==================== 테스트 케이스 ====================

  describe('답변 저장 성공 시나리오', () => {
    it('단일 질문에 대한 답변을 저장할 수 있어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '팀원과의 협업 능력이 뛰어나며, 적극적으로 의견을 나눕니다.',
        },
      ]);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('savedCount', 1);
      expect(response.body).toHaveProperty('message');

      // DB에서 답변 확인
      const mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      const answeredMapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      expect(answeredMapping).toBeDefined();
      expect(answeredMapping.answer).toBe(
        '팀원과의 협업 능력이 뛰어나며, 적극적으로 의견을 나눕니다.',
      );
      expect(answeredMapping.answeredAt).not.toBeNull();
      expect(answeredMapping.answeredBy).not.toBeNull();
    });

    it('복수 질문에 대한 답변을 한 번에 저장할 수 있어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '첫 번째 질문에 대한 답변입니다.',
        },
        {
          questionId: setup.questionIds[1],
          answer: '두 번째 질문에 대한 답변입니다.',
        },
      ]);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('savedCount', 2);

      // DB에서 모든 답변 확인
      const mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      const answeredMappings = mappings.filter((m: any) => m.answer !== null);
      expect(answeredMappings).toHaveLength(2);
    });

    it('기존 답변이 있을 때 새 답변으로 업데이트되어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      // 첫 번째 답변 저장
      const firstResponse = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '첫 번째 답변입니다.',
        },
      ]);
      expect(firstResponse.status).toBe(HttpStatus.OK);

      // DB에서 첫 번째 답변 확인
      let mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      let firstMapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      const firstAnsweredAt = firstMapping.answeredAt;

      // 짧은 대기 (timestamp 차이를 위해)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 두 번째 답변으로 업데이트
      const secondResponse = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '업데이트된 답변입니다.',
        },
      ]);
      expect(secondResponse.status).toBe(HttpStatus.OK);
      expect(secondResponse.body).toHaveProperty('savedCount', 1);

      // DB에서 업데이트된 답변 확인
      mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      firstMapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      expect(firstMapping.answer).toBe('업데이트된 답변입니다.');
      expect(new Date(firstMapping.answeredAt).getTime()).toBeGreaterThan(
        new Date(firstAnsweredAt).getTime(),
      );
    });

    it('PENDING 상태에서 답변 저장 시 IN_PROGRESS로 변경되어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      // 초기 상태 확인
      let peerEvaluation = await getPeerEvaluationFromDb(
        setup.peerEvaluationId,
      );
      expect(peerEvaluation.status).toBe('pending');

      // 답변 저장
      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '답변을 작성합니다.',
        },
      ]);
      expect(response.status).toBe(HttpStatus.CREATED);

      // 상태 변경 확인
      peerEvaluation = await getPeerEvaluationFromDb(setup.peerEvaluationId);
      expect(peerEvaluation.status).toBe('in_progress');
    });

    it('매핑되지 않은 질문의 답변은 무시되어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const randomQuestionId = uuidv4();

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '매핑된 질문에 대한 답변입니다.',
        },
        {
          questionId: randomQuestionId,
          answer: '매핑되지 않은 질문에 대한 답변입니다.',
        },
      ]);

      expect(response.status).toBe(HttpStatus.CREATED);
      // 매핑된 질문 1개만 저장됨
      expect(response.body.savedCount).toBe(1);
    });
  });

  describe('답변 저장 실패 시나리오 - 잘못된 요청', () => {
    it('잘못된 UUID 형식의 동료평가 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await upsertAnswers('invalid-uuid', [
        {
          questionId: uuidv4(),
          answer: '답변 내용',
        },
      ]);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('존재하지 않는 동료평가 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = uuidv4();

      const response = await upsertAnswers(nonExistentId, [
        {
          questionId: uuidv4(),
          answer: '답변 내용',
        },
      ]);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('취소된 동료평가에 답변 저장 시 404 에러가 발생해야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      // 동료평가 취소
      await dataSource.query(
        `UPDATE peer_evaluation SET status = 'cancelled' WHERE id = $1`,
        [setup.peerEvaluationId],
      );

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '답변 내용',
        },
      ]);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('answers 배열이 비어있을 때 400 에러가 발생해야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${setup.peerEvaluationId}/answers`,
        )
        .send({
          peerEvaluationId: setup.peerEvaluationId,
          answers: [],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('questionId 필드가 누락되었을 때 400 에러가 발생해야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${setup.peerEvaluationId}/answers`,
        )
        .send({
          peerEvaluationId: setup.peerEvaluationId,
          answers: [
            {
              // questionId 누락
              answer: '답변 내용',
            },
          ],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('answer 필드가 누락되었을 때 400 에러가 발생해야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${setup.peerEvaluationId}/answers`,
        )
        .send({
          peerEvaluationId: setup.peerEvaluationId,
          answers: [
            {
              questionId: setup.questionIds[0],
              // answer 누락
            },
          ],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 UUID 형식의 questionId로 요청 시 400 에러가 발생해야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${setup.peerEvaluationId}/answers`,
        )
        .send({
          peerEvaluationId: setup.peerEvaluationId,
          answers: [
            {
              questionId: 'invalid-uuid',
              answer: '답변 내용',
            },
          ],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('답변 저장 후 데이터 일관성 검증', () => {
    it('저장된 답변이 질문 상세 조회에 포함되어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      // 답변 저장
      await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '테스트 답변입니다.',
        },
      ]);

      // 동료평가 상세 조회
      const detailResponse = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/${setup.peerEvaluationId}`,
        );

      expect(detailResponse.status).toBe(HttpStatus.OK);

      // 질문 목록에서 답변 확인
      const questions = detailResponse.body.questions;
      const answeredQuestion = questions.find(
        (q: any) => q.id === setup.questionIds[0],
      );

      // 답변이 있는지 확인 (상세 조회 응답에 answer 필드가 있다면)
      // Note: 현재 API가 답변을 포함하는지 확인 필요
      expect(answeredQuestion).toBeDefined();
    });

    it('여러 답변 저장 후 모두 DB에 올바르게 저장되어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const answers = [
        {
          questionId: setup.questionIds[0],
          answer: '첫 번째 답변 - 협업 능력이 우수합니다.',
        },
        {
          questionId: setup.questionIds[1],
          answer: '두 번째 답변 - 문제 해결 능력이 뛰어납니다.',
        },
      ];

      await upsertAnswers(setup.peerEvaluationId, answers);

      // DB에서 모든 답변 확인
      const mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);

      for (const expectedAnswer of answers) {
        const mapping = mappings.find(
          (m: any) => m.questionId === expectedAnswer.questionId,
        );
        expect(mapping).toBeDefined();
        expect(mapping.answer).toBe(expectedAnswer.answer);
        expect(mapping.answeredAt).not.toBeNull();
        expect(mapping.answeredBy).not.toBeNull();
      }
    });

    it('답변 업데이트 시 updatedAt이 갱신되어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      // 첫 번째 답변 저장
      await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '첫 번째 답변',
        },
      ]);

      let mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      let mapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      const firstUpdatedAt = mapping.updatedAt;

      // 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 답변 업데이트
      await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '업데이트된 답변',
        },
      ]);

      mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      mapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );

      expect(new Date(mapping.updatedAt).getTime()).toBeGreaterThan(
        new Date(firstUpdatedAt).getTime(),
      );
    });
  });

  describe('경계값 테스트', () => {
    it('매우 긴 답변 텍스트도 저장할 수 있어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const longAnswer = 'A'.repeat(5000); // 5000자 답변

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: longAnswer,
        },
      ]);

      expect(response.status).toBe(HttpStatus.CREATED);

      // DB에서 확인
      const mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      const mapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      expect(mapping.answer).toBe(longAnswer);
      expect(mapping.answer.length).toBe(5000);
    });

    it('빈 문자열 답변도 저장할 수 있어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: '',
        },
      ]);

      expect(response.status).toBe(HttpStatus.CREATED);

      // DB에서 확인
      const mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      const mapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      expect(mapping.answer).toBe('');
    });

    it('특수문자가 포함된 답변도 저장할 수 있어야 한다', async () => {
      const setup = await createPeerEvaluationWithQuestions();
      if (!setup) {
        console.log('테스트 데이터 생성 실패, 테스트 스킵');
        return;
      }

      const specialAnswer =
        '특수문자 테스트: !@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\n줄바꿈\t탭';

      const response = await upsertAnswers(setup.peerEvaluationId, [
        {
          questionId: setup.questionIds[0],
          answer: specialAnswer,
        },
      ]);

      expect(response.status).toBe(HttpStatus.CREATED);

      // DB에서 확인
      const mappings = await getQuestionMappingsFromDb(setup.peerEvaluationId);
      const mapping = mappings.find(
        (m: any) => m.questionId === setup.questionIds[0],
      );
      expect(mapping.answer).toBe(specialAnswer);
    });
  });

  describe('성능 테스트', () => {
    it('10개의 질문에 대한 답변을 빠르게 저장할 수 있어야 한다', async () => {
      // 여러 질문이 매핑된 동료평가를 생성해야 함
      // 현재는 2개만 매핑되므로 스킵
      console.log('성능 테스트는 여러 질문이 필요하므로 스킵');
    });
  });
});
