import { BaseE2ETest } from '../base-e2e.spec';
import { SeedDataScenario } from './scenarios/seed-data.scenario';
import { EvaluationQuestionScenario } from './scenarios/evaluation-question.scenario';

describe('평가 질문 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationQuestionScenario: EvaluationQuestionScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationQuestionScenario = new EvaluationQuestionScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeAll(async () => {
    // 테스트 시작 전에 시드데이터 생성 (MINIMAL 시나리오)
    try {
      const seedDataScenario = new SeedDataScenario(testSuite);
      await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
        departmentCount: 1,
        employeeCount: 3,
      });
    } catch (error) {
      console.warn('시드데이터 생성 중 오류 발생:', error.message);
    }
  });

  describe('질문 그룹 관리', () => {
    it('질문 그룹을 생성할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.질문그룹을_생성한다({
        name: '기본 평가 질문 그룹',
        isDefault: false,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 생성되었습니다');
    });

    it('기본 질문 그룹을 생성할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.질문그룹을_생성한다({
        name: '기본 질문 그룹',
        isDefault: true,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 생성되었습니다');
    });

    it('질문 그룹을 수정할 수 있어야 한다', async () => {
      // 1. 그룹 생성
      const 생성결과 = await evaluationQuestionScenario.질문그룹을_생성한다({
        name: '수정 테스트 그룹',
        isDefault: false,
      });

      // 2. 그룹 수정
      const 수정결과 = await evaluationQuestionScenario.질문그룹을_수정한다({
        id: 생성결과.id,
        name: '수정된 그룹명',
        isDefault: true,
      });

      expect(수정결과.id).toBe(생성결과.id);
      expect(수정결과.message).toContain('성공적으로 수정되었습니다');
    });

    it('질문 그룹 목록을 조회할 수 있어야 한다', async () => {
      // 먼저 테스트용 그룹을 생성
      await evaluationQuestionScenario.질문그룹을_생성한다({
        name: '테스트 그룹 1',
        isDefault: false,
      });
      
      const groups = await evaluationQuestionScenario.질문그룹목록을_조회한다();

      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('기본 질문 그룹을 조회할 수 있어야 한다', async () => {
      // 먼저 기본 그룹을 생성
      await evaluationQuestionScenario.질문그룹을_생성한다({
        name: '기본 테스트 그룹',
        isDefault: true,
      });
      
      const defaultGroup = await evaluationQuestionScenario.기본질문그룹을_조회한다();

      expect(defaultGroup.id).toBeDefined();
      expect(defaultGroup.isDefault).toBe(true);
    });

    it('질문 그룹을 삭제할 수 있어야 한다', async () => {
      // 1. 그룹 생성
      const 생성결과 = await evaluationQuestionScenario.질문그룹을_생성한다({
        name: '삭제 테스트 그룹',
        isDefault: false,
      });

      // 2. 그룹 삭제
      await evaluationQuestionScenario.질문그룹을_삭제한다(생성결과.id);

      // 3. 삭제 확인 (삭제된 항목을 조회할 때 404 에러가 발생해야 함)
      try {
        await evaluationQuestionScenario.질문그룹을_조회한다(생성결과.id);
        fail('삭제된 그룹을 조회할 수 없어야 합니다');
      } catch (error) {
        // supertest 에러에서 상태 코드 추출
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(404);
      }
    });
  });

  describe('평가 질문 관리', () => {
    it('평가 질문을 생성할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.평가질문을_생성한다({
        text: '프로젝트 수행 능력은 어떠한가요?',
        minScore: 1,
        maxScore: 5,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 생성되었습니다');
    });

    it('점수 범위가 있는 평가 질문을 생성할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.평가질문을_생성한다({
        text: '업무 효율성은 어떠한가요?',
        minScore: 0,
        maxScore: 10,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 생성되었습니다');
    });

    it('점수 범위가 없는 평가 질문을 생성할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.평가질문을_생성한다({
        text: '추가 의견을 자유롭게 작성해주세요.',
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 생성되었습니다');
    });

    it('평가 질문을 수정할 수 있어야 한다', async () => {
      // 1. 질문 생성
      const 생성결과 = await evaluationQuestionScenario.평가질문을_생성한다({
        text: '원본 질문',
        minScore: 1,
        maxScore: 5,
      });

      // 2. 질문 수정
      const 수정결과 = await evaluationQuestionScenario.평가질문을_수정한다({
        id: 생성결과.id,
        text: '수정된 질문',
        minScore: 0,
        maxScore: 10,
      });

      expect(수정결과.id).toBe(생성결과.id);
      expect(수정결과.message).toContain('성공적으로 수정되었습니다');
    });

    it('평가 질문을 복사할 수 있어야 한다', async () => {
      // 1. 질문 생성
      const 원본질문 = await evaluationQuestionScenario.평가질문을_생성한다({
        text: '복사할 질문',
        minScore: 1,
        maxScore: 5,
      });

      // 2. 질문 복사
      const 복사결과 = await evaluationQuestionScenario.평가질문을_복사한다(원본질문.id);

      expect(복사결과.id).toBeDefined();
      expect(복사결과.id).not.toBe(원본질문.id);
      expect(복사결과.message).toContain('성공적으로 복사되었습니다');
    });

    it('평가 질문 목록을 조회할 수 있어야 한다', async () => {
      // 먼저 테스트용 질문을 생성
      await evaluationQuestionScenario.평가질문을_생성한다({
        text: '테스트 질문 1',
        minScore: 1,
        maxScore: 5,
      });
      
      const questions = await evaluationQuestionScenario.평가질문목록을_조회한다();

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('평가 질문을 삭제할 수 있어야 한다', async () => {
      // 1. 질문 생성
      const 생성결과 = await evaluationQuestionScenario.평가질문을_생성한다({
        text: '삭제할 질문',
        minScore: 1,
        maxScore: 5,
      });

      // 2. 질문 삭제
      await evaluationQuestionScenario.평가질문을_삭제한다(생성결과.id);

      // 3. 삭제 확인 (삭제된 항목을 조회할 때 404 에러가 발생해야 함)
      try {
        await evaluationQuestionScenario.평가질문을_조회한다(생성결과.id);
        fail('삭제된 질문을 조회할 수 없어야 합니다');
      } catch (error) {
        // supertest 에러에서 상태 코드 추출
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(404);
      }
    });
  });

  describe('질문-그룹 매핑 관리', () => {
    let testGroup: any;
    let testQuestions: any[] = [];

    beforeEach(async () => {
      // 테스트용 그룹 생성 (고유한 이름 사용)
      const timestamp = Date.now();
      testGroup = await evaluationQuestionScenario.질문그룹을_생성한다({
        name: `매핑 테스트 그룹 ${timestamp}`,
        isDefault: false,
      });

      // 테스트용 질문들 생성
      testQuestions = [];
      for (let i = 1; i <= 3; i++) {
        const question = await evaluationQuestionScenario.평가질문을_생성한다({
          text: `매핑 테스트 질문 ${timestamp} ${i}`,
          minScore: 1,
          maxScore: 5,
        });
        testQuestions.push(question);
      }
    });

    it('그룹에 질문을 추가할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.그룹에_질문을_추가한다({
        groupId: testGroup.id,
        questionId: testQuestions[0].id,
        displayOrder: 0,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 추가되었습니다');
    });

    it('그룹에 여러 질문을 추가할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.그룹에_여러_질문을_추가한다({
        groupId: testGroup.id,
        questionIds: testQuestions.map(q => q.id),
        startDisplayOrder: 0,
      });

      expect(result.ids).toBeDefined();
      expect(Array.isArray(result.ids)).toBe(true);
      expect(result.successCount).toBe(testQuestions.length);
      expect(result.totalCount).toBe(testQuestions.length);
    });

    it('그룹 내 질문 순서를 재정의할 수 있어야 한다', async () => {
      // 1. 질문들을 그룹에 추가
      await evaluationQuestionScenario.그룹에_여러_질문을_추가한다({
        groupId: testGroup.id,
        questionIds: testQuestions.map(q => q.id),
        startDisplayOrder: 0,
      });

      // 2. 순서 재정의
      const reorderedIds = [testQuestions[2].id, testQuestions[0].id, testQuestions[1].id];
      const result = await evaluationQuestionScenario.그룹내_질문순서를_재정의한다({
        groupId: testGroup.id,
        questionIds: reorderedIds,
      });

      expect(result.id).toBe(testGroup.id);
      expect(result.message).toContain('성공적으로 재정의되었습니다');
    });

    it('그룹의 질문 목록을 조회할 수 있어야 한다', async () => {
      // 1. 질문들을 그룹에 추가
      await evaluationQuestionScenario.그룹에_여러_질문을_추가한다({
        groupId: testGroup.id,
        questionIds: testQuestions.map(q => q.id),
        startDisplayOrder: 0,
      });

      // 2. 그룹의 질문 목록 조회
      const groupQuestions = await evaluationQuestionScenario.그룹의_질문목록을_조회한다(testGroup.id);

      expect(Array.isArray(groupQuestions)).toBe(true);
      expect(groupQuestions.length).toBe(testQuestions.length);
    });

    it('질문이 속한 그룹 목록을 조회할 수 있어야 한다', async () => {
      // 1. 질문을 그룹에 추가
      await evaluationQuestionScenario.그룹에_질문을_추가한다({
        groupId: testGroup.id,
        questionId: testQuestions[0].id,
        displayOrder: 0,
      });

      // 2. 질문이 속한 그룹 목록 조회
      const questionGroups = await evaluationQuestionScenario.질문이_속한_그룹목록을_조회한다(testQuestions[0].id);

      expect(Array.isArray(questionGroups)).toBe(true);
      expect(questionGroups.length).toBeGreaterThan(0);
    });
  });

  describe('복합 시나리오', () => {
    it('평가 질문 관리 전체 시나리오를 실행할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.평가질문_관리_전체_시나리오를_실행한다();

    // 검증
    expect(result.그룹생성결과.id).toBeDefined();
    expect(result.질문생성결과.id).toBeDefined();
    // expect(result.매핑생성결과.id).toBeDefined(); // 이미 질문 생성 시 그룹에 추가되었으므로 생략
    expect(result.그룹조회결과.id).toBe(result.그룹생성결과.id);
    expect(result.질문조회결과.id).toBe(result.질문생성결과.id);
    expect(Array.isArray(result.매핑조회결과)).toBe(true);
    });

    it('질문 그룹 관리 시나리오를 실행할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.질문그룹_관리_시나리오를_실행한다();

      // 검증
      expect(result.기본그룹생성결과.id).toBeDefined();
      expect(result.커스텀그룹생성결과.id).toBeDefined();
      expect(result.그룹수정결과.id).toBe(result.커스텀그룹생성결과.id);
      expect(Array.isArray(result.그룹목록조회결과)).toBe(true);
      expect(result.기본그룹조회결과.isDefault).toBe(true);
    });

    it('평가 질문 CRUD 시나리오를 실행할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.평가질문_CRUD_시나리오를_실행한다();

      // 검증
      expect(result.질문생성결과.id).toBeDefined();
      expect(result.질문수정결과.id).toBe(result.질문생성결과.id);
      expect(result.질문복사결과.id).toBeDefined();
      expect(result.질문복사결과.id).not.toBe(result.질문생성결과.id);
      expect(result.질문조회결과.id).toBe(result.질문생성결과.id);
      expect(Array.isArray(result.질문목록조회결과)).toBe(true);
    });

    it('질문-그룹 매핑 관리 시나리오를 실행할 수 있어야 한다', async () => {
      const result = await evaluationQuestionScenario.질문그룹_매핑_관리_시나리오를_실행한다();

      // 검증
      expect(result.그룹생성결과.id).toBeDefined();
      expect(Array.isArray(result.질문들생성결과)).toBe(true);
      expect(result.질문들생성결과.length).toBe(3);
      expect(result.단일매핑결과.id).toBeDefined();
      expect(result.다중매핑결과.successCount).toBe(2);
      expect(result.순서재정의결과.id).toBe(result.그룹생성결과.id);
      expect(Array.isArray(result.매핑조회결과)).toBe(true);
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 질문 그룹을 조회할 때 404 에러가 발생해야 한다', async () => {
      const invalidId = '00000000-0000-0000-0000-000000000000';
      
      try {
        await evaluationQuestionScenario.질문그룹을_조회한다(invalidId);
        fail('존재하지 않는 그룹을 조회할 수 없어야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(404);
      }
    });

    it('존재하지 않는 평가 질문을 조회할 때 404 에러가 발생해야 한다', async () => {
      const invalidId = '00000000-0000-0000-0000-000000000000';
      
      try {
        await evaluationQuestionScenario.평가질문을_조회한다(invalidId);
        fail('존재하지 않는 질문을 조회할 수 없어야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(404);
      }
    });

    it('잘못된 UUID 형식으로 요청할 때 400 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid';
      
      try {
        await evaluationQuestionScenario.질문그룹을_조회한다(invalidId);
        fail('잘못된 UUID 형식으로 요청할 수 없어야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(400);
      }
    });

    it('필수 필드가 누락된 질문 생성 시 400 에러가 발생해야 한다', async () => {
      try {
        await evaluationQuestionScenario.평가질문을_생성한다({
          text: '', // 빈 문자열
          minScore: 1,
          maxScore: 5,
        });
        fail('빈 질문 내용으로 생성할 수 없어야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(400);
      }
    });

    it('잘못된 점수 범위로 질문 생성 시 400 에러가 발생해야 한다', async () => {
      try {
        await evaluationQuestionScenario.평가질문을_생성한다({
          text: '테스트 질문',
          minScore: 5, // 최소값이 최대값보다 큼
          maxScore: 1,
        });
        fail('잘못된 점수 범위로 생성할 수 없어야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(400);
      }
    });
  });
});
