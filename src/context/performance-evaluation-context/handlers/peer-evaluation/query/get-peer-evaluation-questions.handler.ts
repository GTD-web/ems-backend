import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { EvaluationQuestionService } from '@domain/sub/evaluation-question/evaluation-question.service';

/**
 * 동료평가 질문 목록 조회 쿼리
 */
export class GetPeerEvaluationQuestionsQuery {
  constructor(public readonly peerEvaluationId: string) {}
}

/**
 * 동료평가 질문 상세 정보
 */
export interface PeerEvaluationQuestionDetail {
  /** 매핑 ID */
  mappingId: string;
  /** 질문 ID */
  questionId: string;
  /** 질문 내용 */
  questionText: string;
  /** 질문 그룹 ID */
  questionGroupId?: string;
  /** 표시 순서 */
  displayOrder: number;
  /** 매핑 생성일 */
  createdAt: Date;
}

/**
 * 동료평가 질문 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetPeerEvaluationQuestionsQuery)
export class GetPeerEvaluationQuestionsHandler
  implements
    IQueryHandler<
      GetPeerEvaluationQuestionsQuery,
      PeerEvaluationQuestionDetail[]
    >
{
  private readonly logger = new Logger(GetPeerEvaluationQuestionsHandler.name);

  constructor(
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(
    query: GetPeerEvaluationQuestionsQuery,
  ): Promise<PeerEvaluationQuestionDetail[]> {
    this.logger.log(
      `동료평가 질문 목록 조회 - peerEvaluationId: ${query.peerEvaluationId}`,
    );

    try {
      // 1. 매핑 정보 조회
      const mappings =
        await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(
          query.peerEvaluationId,
        );

      if (mappings.length === 0) {
        this.logger.log('동료평가에 할당된 질문이 없습니다.');
        return [];
      }

      // 2. 질문 상세 정보 조회
      const result: PeerEvaluationQuestionDetail[] = [];
      for (const mapping of mappings) {
        const question = await this.evaluationQuestionService.ID로조회한다(
          mapping.questionId,
        );

        if (question) {
          result.push({
            mappingId: mapping.id,
            questionId: question.id,
            questionText: question.text,
            questionGroupId: mapping.questionGroupId,
            displayOrder: mapping.displayOrder,
            createdAt: mapping.createdAt,
          });
        }
      }

      this.logger.log(
        `동료평가 질문 목록 조회 완료 - 질문 수: ${result.length}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `동료평가 질문 목록 조회 실패 - peerEvaluationId: ${query.peerEvaluationId}`,
        error.stack,
      );
      throw error;
    }
  }
}
