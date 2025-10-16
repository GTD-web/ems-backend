import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { EvaluationResponseService } from '@domain/sub/evaluation-response/evaluation-response.service';
import { EvaluationResponseType } from '@domain/sub/evaluation-response/evaluation-response.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 동료평가 제출 커맨드
 */
export class SubmitPeerEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 동료평가 제출 핸들러
 */
@Injectable()
@CommandHandler(SubmitPeerEvaluationCommand)
export class SubmitPeerEvaluationHandler
  implements ICommandHandler<SubmitPeerEvaluationCommand>
{
  private readonly logger = new Logger(SubmitPeerEvaluationHandler.name);

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
    private readonly evaluationResponseService: EvaluationResponseService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: SubmitPeerEvaluationCommand): Promise<void> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('동료평가 제출 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 1. 동료평가 조회 및 상태 검증
      const evaluation =
        await this.peerEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new BadRequestException('존재하지 않는 동료평가입니다.');
      }

      // 2. 이미 완료된 평가인지 확인
      if (evaluation.완료되었는가()) {
        throw new BadRequestException('이미 완료된 동료평가입니다.');
      }

      // 3. 매핑된 질문 목록 조회
      const mappedQuestions =
        await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(
          evaluationId,
        );

      this.logger.log(`매핑된 질문 수: ${mappedQuestions.length}`, {
        evaluationId,
      });

      // 4. 질문이 없으면 제출 불가
      if (mappedQuestions.length === 0) {
        throw new BadRequestException(
          '제출할 질문이 없습니다. 평가 질문을 먼저 추가해주세요.',
        );
      }

      // 5. 모든 질문에 대한 응답 조회
      const responses =
        await this.evaluationResponseService.평가유형조합조회한다(
          evaluationId,
          EvaluationResponseType.PEER,
        );

      // 6. 응답이 있는 질문 ID 집합 생성
      const answeredQuestionIds = new Set(
        responses
          .filter((response) => {
            // answer와 score 둘 다 있어야 응답한 것으로 간주
            return (
              response.answer !== null &&
              response.answer !== undefined &&
              response.answer.trim() !== '' &&
              response.score !== null &&
              response.score !== undefined
            );
          })
          .map((response) => response.questionId),
      );

      this.logger.log(
        `응답한 질문 수: ${answeredQuestionIds.size} / ${mappedQuestions.length}`,
        { evaluationId },
      );

      // 7. 미응답 질문 확인
      const unansweredQuestions = mappedQuestions.filter(
        (mapping) => !answeredQuestionIds.has(mapping.questionId),
      );

      if (unansweredQuestions.length > 0) {
        const unansweredQuestionIds = unansweredQuestions
          .map((q) => q.questionId)
          .join(', ');

        this.logger.warn(
          `미응답 질문 발견 - 질문 ID: ${unansweredQuestionIds}`,
          { evaluationId },
        );

        throw new BadRequestException(
          `모든 질문에 응답해야 제출할 수 있습니다. 미응답 질문: ${unansweredQuestions.length}개`,
        );
      }

      // 8. 검증 통과 - 동료평가 완료 처리
      await this.peerEvaluationService.수정한다(
        evaluationId,
        { isCompleted: true },
        submittedBy,
      );

      this.logger.log('동료평가 제출 완료 - 모든 질문 응답 확인됨', {
        evaluationId,
        mappedQuestions: mappedQuestions.length,
        answeredQuestions: answeredQuestionIds.size,
      });
    });
  }
}
