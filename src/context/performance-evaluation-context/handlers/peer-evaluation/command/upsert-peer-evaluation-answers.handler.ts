import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';

/**
 * 동료평가 답변 항목
 */
export interface AnswerItem {
  questionId: string;
  answer: string;
}

/**
 * 동료평가 질문 답변 저장/업데이트 커맨드
 */
export class UpsertPeerEvaluationAnswersCommand {
  constructor(
    public readonly peerEvaluationId: string,
    public readonly answers: AnswerItem[],
    public readonly answeredBy: string,
  ) {}
}

/**
 * 동료평가 질문 답변 저장/업데이트 핸들러
 *
 * 동료평가에 매핑된 질문에 대한 답변을 저장하거나 업데이트합니다.
 * - 기존 답변이 있으면 업데이트
 * - 기존 답변이 없으면 신규 저장
 */
@Injectable()
@CommandHandler(UpsertPeerEvaluationAnswersCommand)
export class UpsertPeerEvaluationAnswersHandler
  implements ICommandHandler<UpsertPeerEvaluationAnswersCommand, number>
{
  private readonly logger = new Logger(UpsertPeerEvaluationAnswersHandler.name);

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
  ) {}

  async execute(command: UpsertPeerEvaluationAnswersCommand): Promise<number> {
    this.logger.log(
      `동료평가 답변 저장 시작 - peerEvaluationId: ${command.peerEvaluationId}, 답변 개수: ${command.answers.length}`,
    );

    try {
      // 1. 동료평가 존재 확인
      const peerEvaluation = await this.peerEvaluationService.조회한다(
        command.peerEvaluationId,
      );

      if (!peerEvaluation) {
        throw new NotFoundException(
          `동료평가를 찾을 수 없습니다. (id: ${command.peerEvaluationId})`,
        );
      }

      // 2. 동료평가가 취소되었는지 확인
      if (peerEvaluation.status === 'cancelled') {
        throw new NotFoundException(
          `취소된 동료평가입니다. (id: ${command.peerEvaluationId})`,
        );
      }

      // 3. 각 질문에 대한 답변 저장/업데이트
      let savedCount = 0;

      for (const answerItem of command.answers) {
        // 해당 동료평가의 질문 매핑 조회
        const mapping =
          await this.peerEvaluationQuestionMappingService.동료평가와_질문으로_조회한다(
            command.peerEvaluationId,
            answerItem.questionId,
          );

        if (!mapping) {
          this.logger.warn(
            `질문 매핑을 찾을 수 없습니다. - peerEvaluationId: ${command.peerEvaluationId}, questionId: ${answerItem.questionId}`,
          );
          continue; // 매핑이 없는 질문은 스킵
        }

        // 답변 저장/업데이트
        mapping.답변을_저장한다(answerItem.answer, command.answeredBy);
        await this.peerEvaluationQuestionMappingService.저장한다(mapping);

        savedCount++;
      }

      // 4. 동료평가 상태를 '진행중'으로 변경 (아직 완료되지 않았으면)
      if (!peerEvaluation.완료되었는가() && peerEvaluation.대기중인가()) {
        peerEvaluation.진행중으로_변경한다(command.answeredBy);
        await this.peerEvaluationRepository.save(peerEvaluation);
      }

      this.logger.log(
        `동료평가 답변 저장 완료 - peerEvaluationId: ${command.peerEvaluationId}, 저장된 답변: ${savedCount}개`,
      );

      return savedCount;
    } catch (error) {
      this.logger.error(
        `동료평가 답변 저장 실패 - peerEvaluationId: ${command.peerEvaluationId}`,
        error.stack,
      );
      throw error;
    }
  }
}
