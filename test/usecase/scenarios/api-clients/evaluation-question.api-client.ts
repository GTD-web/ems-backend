import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 평가 질문 API 클라이언트
 * 
 * 평가 질문 관련 HTTP 요청을 캡슐화합니다.
 */
export class EvaluationQuestionApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // ==================== 질문 그룹 관리 ====================

  /**
   * 질문 그룹 생성
   */
  async createQuestionGroup(data: {
    name: string;
    isDefault?: boolean;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/evaluation-questions/question-groups')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 질문 그룹 수정
   */
  async updateQuestionGroup(id: string, data: {
    name?: string;
    isDefault?: boolean;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/evaluation-questions/question-groups/${id}`)
      .send(data)
      .expect(200);

    return response.body;
  }

  /**
   * 질문 그룹 삭제
   */
  async deleteQuestionGroup(id: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/performance-evaluation/evaluation-questions/question-groups/${id}`)
      .expect(204);
  }

  /**
   * 질문 그룹 목록 조회
   */
  async getQuestionGroups(): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get('/admin/performance-evaluation/evaluation-questions/question-groups')
      .expect(200);

    return response.body;
  }

  /**
   * 질문 그룹 조회
   */
  async getQuestionGroup(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/evaluation-questions/question-groups/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * 기본 질문 그룹 조회
   */
  async getDefaultQuestionGroup(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/performance-evaluation/evaluation-questions/question-groups/default')
      .expect(200);

    return response.body;
  }

  // ==================== 평가 질문 관리 ====================

  /**
   * 평가 질문 생성
   */
  async createEvaluationQuestion(data: {
    text: string;
    minScore?: number;
    maxScore?: number;
    groupId?: string;
    displayOrder?: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/evaluation-questions')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 평가 질문 수정
   */
  async updateEvaluationQuestion(id: string, data: {
    text?: string;
    minScore?: number;
    maxScore?: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/evaluation-questions/${id}`)
      .send(data)
      .expect(200);

    return response.body;
  }

  /**
   * 평가 질문 삭제
   */
  async deleteEvaluationQuestion(id: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/performance-evaluation/evaluation-questions/${id}`)
      .expect(204);
  }

  /**
   * 평가 질문 조회
   */
  async getEvaluationQuestion(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/evaluation-questions/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가 질문 목록 조회
   */
  async getEvaluationQuestions(): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get('/admin/performance-evaluation/evaluation-questions')
      .expect(200);

    return response.body;
  }

  /**
   * 평가 질문 복사
   */
  async copyEvaluationQuestion(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/performance-evaluation/evaluation-questions/${id}/copy`)
      .expect(201);

    return response.body;
  }

  // ==================== 질문-그룹 매핑 관리 ====================

  /**
   * 그룹에 질문 추가
   */
  async addQuestionToGroup(data: {
    groupId: string;
    questionId: string;
    displayOrder?: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/evaluation-questions/question-group-mappings')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 그룹에 여러 질문 추가
   */
  async addMultipleQuestionsToGroup(data: {
    groupId: string;
    questionIds: string[];
    startDisplayOrder?: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/evaluation-questions/question-group-mappings/batch')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 그룹 내 질문 순서 재정의
   */
  async reorderGroupQuestions(data: {
    groupId: string;
    questionIds: string[];
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch('/admin/performance-evaluation/evaluation-questions/question-group-mappings/reorder')
      .send(data)
      .expect(200);

    return response.body;
  }

  /**
   * 그룹에서 질문 제거
   */
  async removeQuestionFromGroup(mappingId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/performance-evaluation/evaluation-questions/question-group-mappings/${mappingId}`)
      .expect(204);
  }

  /**
   * 질문 순서 위로 이동
   */
  async moveQuestionUp(mappingId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/evaluation-questions/question-group-mappings/${mappingId}/up`)
      .expect(200);

    return response.body;
  }

  /**
   * 질문 순서 아래로 이동
   */
  async moveQuestionDown(mappingId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/evaluation-questions/question-group-mappings/${mappingId}/down`)
      .expect(200);

    return response.body;
  }

  /**
   * 그룹의 질문 목록 조회
   */
  async getGroupQuestions(groupId: string): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/evaluation-questions/question-groups/${groupId}/questions`)
      .expect(200);

    return response.body;
  }

  /**
   * 질문이 속한 그룹 목록 조회
   */
  async getQuestionGroupsByQuestion(questionId: string): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/evaluation-questions/questions/${questionId}/groups`)
      .expect(200);

    return response.body;
  }
}
