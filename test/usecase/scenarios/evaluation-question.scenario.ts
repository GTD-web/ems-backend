import { BaseE2ETest } from '../../base-e2e.spec';
import { EvaluationQuestionApiClient } from './api-clients/evaluation-question.api-client';

/**
 * 평가 질문 관리 시나리오
 * 
 * 엔드포인트만을 사용하여 평가 질문 관련 기능을 테스트합니다.
 * 질문 그룹, 평가 질문, 질문-그룹 매핑을 포함한 전체 워크플로우를 테스트합니다.
 */
export class EvaluationQuestionScenario {
  private apiClient: EvaluationQuestionApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new EvaluationQuestionApiClient(testSuite);
  }

  // ==================== 질문 그룹 관리 ====================

  /**
   * 질문 그룹을 생성한다
   */
  async 질문그룹을_생성한다(config: {
    name: string;
    isDefault?: boolean;
  }): Promise<any> {
    const result = await this.apiClient.createQuestionGroup(config);
    
    expect(result.id).toBeDefined();
    expect(result.message).toContain('성공적으로 생성되었습니다');
    
    return result;
  }

  /**
   * 질문 그룹을 수정한다
   */
  async 질문그룹을_수정한다(config: {
    id: string;
    name?: string;
    isDefault?: boolean;
  }): Promise<any> {
    const result = await this.apiClient.updateQuestionGroup(config.id, {
      name: config.name,
      isDefault: config.isDefault,
    });
    
    expect(result.id).toBe(config.id);
    expect(result.message).toContain('성공적으로 수정되었습니다');
    
    return result;
  }

  /**
   * 질문 그룹을 삭제한다
   */
  async 질문그룹을_삭제한다(id: string): Promise<void> {
    await this.apiClient.deleteQuestionGroup(id);
  }

  /**
   * 질문 그룹 목록을 조회한다
   */
  async 질문그룹목록을_조회한다(): Promise<any[]> {
    const groups = await this.apiClient.getQuestionGroups();
    
    expect(Array.isArray(groups)).toBe(true);
    
    return groups;
  }

  /**
   * 질문 그룹을 조회한다
   */
  async 질문그룹을_조회한다(id: string): Promise<any> {
    const group = await this.apiClient.getQuestionGroup(id);
    
    expect(group.id).toBe(id);
    expect(group.name).toBeDefined();
    expect(group.isDefault).toBeDefined();
    expect(group.isDeletable).toBeDefined();
    
    return group;
  }

  /**
   * 기본 질문 그룹을 조회한다
   */
  async 기본질문그룹을_조회한다(): Promise<any> {
    const group = await this.apiClient.getDefaultQuestionGroup();
    
    expect(group.id).toBeDefined();
    expect(group.isDefault).toBe(true);
    
    return group;
  }

  // ==================== 평가 질문 관리 ====================

  /**
   * 평가 질문을 생성한다
   */
  async 평가질문을_생성한다(config: {
    text: string;
    minScore?: number;
    maxScore?: number;
    groupId?: string;
    displayOrder?: number;
  }): Promise<any> {
    const result = await this.apiClient.createEvaluationQuestion(config);
    
    expect(result.id).toBeDefined();
    expect(result.message).toContain('성공적으로 생성되었습니다');
    
    return result;
  }

  /**
   * 평가 질문을 수정한다
   */
  async 평가질문을_수정한다(config: {
    id: string;
    text?: string;
    minScore?: number;
    maxScore?: number;
  }): Promise<any> {
    const result = await this.apiClient.updateEvaluationQuestion(config.id, {
      text: config.text,
      minScore: config.minScore,
      maxScore: config.maxScore,
    });
    
    expect(result.id).toBe(config.id);
    expect(result.message).toContain('성공적으로 수정되었습니다');
    
    return result;
  }

  /**
   * 평가 질문을 삭제한다
   */
  async 평가질문을_삭제한다(id: string): Promise<void> {
    await this.apiClient.deleteEvaluationQuestion(id);
  }

  /**
   * 평가 질문을 조회한다
   */
  async 평가질문을_조회한다(id: string): Promise<any> {
    const question = await this.apiClient.getEvaluationQuestion(id);
    
    expect(question.id).toBe(id);
    expect(question.text).toBeDefined();
    
    return question;
  }

  /**
   * 평가 질문 목록을 조회한다
   */
  async 평가질문목록을_조회한다(): Promise<any[]> {
    const questions = await this.apiClient.getEvaluationQuestions();
    
    expect(Array.isArray(questions)).toBe(true);
    
    return questions;
  }

  /**
   * 평가 질문을 복사한다
   */
  async 평가질문을_복사한다(id: string): Promise<any> {
    const result = await this.apiClient.copyEvaluationQuestion(id);
    
    expect(result.id).toBeDefined();
    expect(result.message).toContain('성공적으로 복사되었습니다');
    
    return result;
  }

  // ==================== 질문-그룹 매핑 관리 ====================

  /**
   * 그룹에 질문을 추가한다
   */
  async 그룹에_질문을_추가한다(config: {
    groupId: string;
    questionId: string;
    displayOrder?: number;
  }): Promise<any> {
    const result = await this.apiClient.addQuestionToGroup(config);
    
    expect(result.id).toBeDefined();
    expect(result.message).toContain('성공적으로 추가되었습니다');
    
    return result;
  }

  /**
   * 그룹에 여러 질문을 추가한다
   */
  async 그룹에_여러_질문을_추가한다(config: {
    groupId: string;
    questionIds: string[];
    startDisplayOrder?: number;
  }): Promise<any> {
    const result = await this.apiClient.addMultipleQuestionsToGroup(config);
    
    expect(result.ids).toBeDefined();
    expect(Array.isArray(result.ids)).toBe(true);
    expect(result.successCount).toBe(config.questionIds.length);
    expect(result.totalCount).toBe(config.questionIds.length);
    expect(result.message).toContain('성공적으로 추가되었습니다');
    
    return result;
  }

  /**
   * 그룹 내 질문 순서를 재정의한다
   */
  async 그룹내_질문순서를_재정의한다(config: {
    groupId: string;
    questionIds: string[];
  }): Promise<any> {
    const result = await this.apiClient.reorderGroupQuestions(config);
    
    expect(result.id).toBe(config.groupId);
    expect(result.message).toContain('성공적으로 재정의되었습니다');
    
    return result;
  }

  /**
   * 그룹에서 질문을 제거한다
   */
  async 그룹에서_질문을_제거한다(mappingId: string): Promise<void> {
    await this.apiClient.removeQuestionFromGroup(mappingId);
  }

  /**
   * 질문 순서를 위로 이동한다
   */
  async 질문순서를_위로_이동한다(mappingId: string): Promise<any> {
    const result = await this.apiClient.moveQuestionUp(mappingId);
    
    expect(result.id).toBe(mappingId);
    expect(result.message).toContain('성공적으로 위로 이동되었습니다');
    
    return result;
  }

  /**
   * 질문 순서를 아래로 이동한다
   */
  async 질문순서를_아래로_이동한다(mappingId: string): Promise<any> {
    const result = await this.apiClient.moveQuestionDown(mappingId);
    
    expect(result.id).toBe(mappingId);
    expect(result.message).toContain('성공적으로 아래로 이동되었습니다');
    
    return result;
  }

  /**
   * 그룹의 질문 목록을 조회한다
   */
  async 그룹의_질문목록을_조회한다(groupId: string): Promise<any[]> {
    const questions = await this.apiClient.getGroupQuestions(groupId);
    
    expect(Array.isArray(questions)).toBe(true);
    
    return questions;
  }

  /**
   * 질문이 속한 그룹 목록을 조회한다
   */
  async 질문이_속한_그룹목록을_조회한다(questionId: string): Promise<any[]> {
    const groups = await this.apiClient.getQuestionGroupsByQuestion(questionId);
    
    expect(Array.isArray(groups)).toBe(true);
    
    return groups;
  }

  // ==================== 복합 시나리오 ====================

  /**
   * 평가 질문 관리 전체 시나리오를 실행한다
   */
  async 평가질문_관리_전체_시나리오를_실행한다(): Promise<{
    그룹생성결과: any;
    질문생성결과: any;
    그룹조회결과: any;
    질문조회결과: any;
    매핑조회결과: any[];
  }> {
    // 1. 질문 그룹 생성
    const timestamp = Date.now();
    const 그룹생성결과 = await this.질문그룹을_생성한다({
      name: `테스트 평가 질문 그룹 ${timestamp}`,
      isDefault: false,
    });

    // 2. 평가 질문 생성
    const 질문생성결과 = await this.평가질문을_생성한다({
      text: `프로젝트 수행 능력은 어떠한가요? ${timestamp}`,
      minScore: 1,
      maxScore: 5,
      groupId: 그룹생성결과.id,
      displayOrder: 0,
    });

    // 3. 질문-그룹 매핑 생성 (그룹에 질문 추가) - 이미 질문 생성 시 그룹에 추가되었으므로 생략
    // const 매핑생성결과 = await this.그룹에_질문을_추가한다({
    //   groupId: 그룹생성결과.id,
    //   questionId: 질문생성결과.id,
    //   displayOrder: 0,
    // });

    // 4. 그룹 조회
    const 그룹조회결과 = await this.질문그룹을_조회한다(그룹생성결과.id);

    // 5. 질문 조회
    const 질문조회결과 = await this.평가질문을_조회한다(질문생성결과.id);

    // 6. 그룹의 질문 목록 조회
    const 매핑조회결과 = await this.그룹의_질문목록을_조회한다(그룹생성결과.id);

    return {
      그룹생성결과,
      질문생성결과,
      // 매핑생성결과, // 이미 질문 생성 시 그룹에 추가되었으므로 생략
      그룹조회결과,
      질문조회결과,
      매핑조회결과,
    };
  }

  /**
   * 질문 그룹 관리 시나리오를 실행한다
   */
  async 질문그룹_관리_시나리오를_실행한다(): Promise<{
    기본그룹생성결과: any;
    커스텀그룹생성결과: any;
    그룹수정결과: any;
    그룹목록조회결과: any[];
    기본그룹조회결과: any;
  }> {
    // 1. 기본 그룹 생성
    const 기본그룹생성결과 = await this.질문그룹을_생성한다({
      name: '기본 평가 질문',
      isDefault: true,
    });

    // 2. 커스텀 그룹 생성
    const 커스텀그룹생성결과 = await this.질문그룹을_생성한다({
      name: '커스텀 평가 질문',
      isDefault: false,
    });

    // 3. 그룹 수정
    const 그룹수정결과 = await this.질문그룹을_수정한다({
      id: 커스텀그룹생성결과.id,
      name: '수정된 커스텀 평가 질문',
      isDefault: false,
    });

    // 4. 그룹 목록 조회
    const 그룹목록조회결과 = await this.질문그룹목록을_조회한다();

    // 5. 기본 그룹 조회
    const 기본그룹조회결과 = await this.기본질문그룹을_조회한다();

    return {
      기본그룹생성결과,
      커스텀그룹생성결과,
      그룹수정결과,
      그룹목록조회결과,
      기본그룹조회결과,
    };
  }

  /**
   * 평가 질문 CRUD 시나리오를 실행한다
   */
  async 평가질문_CRUD_시나리오를_실행한다(): Promise<{
    질문생성결과: any;
    질문수정결과: any;
    질문복사결과: any;
    질문조회결과: any;
    질문목록조회결과: any[];
  }> {
    // 1. 질문 생성
    const 질문생성결과 = await this.평가질문을_생성한다({
      text: '업무 수행 능력은 어떠한가요?',
      minScore: 1,
      maxScore: 5,
    });

    // 2. 질문 수정
    const 질문수정결과 = await this.평가질문을_수정한다({
      id: 질문생성결과.id,
      text: '수정된 업무 수행 능력은 어떠한가요?',
      minScore: 0,
      maxScore: 10,
    });

    // 3. 질문 복사
    const 질문복사결과 = await this.평가질문을_복사한다(질문생성결과.id);

    // 4. 질문 조회
    const 질문조회결과 = await this.평가질문을_조회한다(질문생성결과.id);

    // 5. 질문 목록 조회
    const 질문목록조회결과 = await this.평가질문목록을_조회한다();

    return {
      질문생성결과,
      질문수정결과,
      질문복사결과,
      질문조회결과,
      질문목록조회결과,
    };
  }

  /**
   * 질문-그룹 매핑 관리 시나리오를 실행한다
   */
  async 질문그룹_매핑_관리_시나리오를_실행한다(): Promise<{
    그룹생성결과: any;
    질문들생성결과: any[];
    단일매핑결과: any;
    다중매핑결과: any;
    순서재정의결과: any;
    매핑조회결과: any[];
  }> {
    // 1. 그룹 생성
    const timestamp = Date.now();
    const 그룹생성결과 = await this.질문그룹을_생성한다({
      name: `매핑 테스트 그룹 ${timestamp}`,
      isDefault: false,
    });

    // 2. 여러 질문 생성
    const 질문들생성결과: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const 질문생성결과 = await this.평가질문을_생성한다({
        text: `테스트 질문 ${timestamp} ${i}`,
        minScore: 1,
        maxScore: 5,
      });
      질문들생성결과.push(질문생성결과);
    }

    // 3. 단일 질문을 그룹에 추가
    const 단일매핑결과 = await this.그룹에_질문을_추가한다({
      groupId: 그룹생성결과.id,
      questionId: 질문들생성결과[0].id,
      displayOrder: 0,
    });

    // 4. 여러 질문을 그룹에 추가
    const 다중매핑결과 = await this.그룹에_여러_질문을_추가한다({
      groupId: 그룹생성결과.id,
      questionIds: 질문들생성결과.slice(1).map(q => q.id),
      startDisplayOrder: 1,
    });

    // 5. 그룹 내 질문 순서 재정의
    const 질문순서 = [질문들생성결과[2].id, 질문들생성결과[0].id, 질문들생성결과[1].id];
    const 순서재정의결과 = await this.그룹내_질문순서를_재정의한다({
      groupId: 그룹생성결과.id,
      questionIds: 질문순서,
    });

    // 6. 그룹의 질문 목록 조회
    const 매핑조회결과 = await this.그룹의_질문목록을_조회한다(그룹생성결과.id);

    return {
      그룹생성결과,
      질문들생성결과,
      단일매핑결과,
      다중매핑결과,
      순서재정의결과,
      매핑조회결과,
    };
  }
}
