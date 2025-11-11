import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';

export interface ResetAllEvaluationLinesResult {
  deletedCounts: {
    peerEvaluationQuestionMappings: number;
    peerEvaluations: number;
    downwardEvaluations: number;
    evaluationLineMappings: number;
  };
  message: string;
}

/**
 * 모든 평가라인 리셋 커맨드
 */
export class ResetAllEvaluationLinesCommand {
  constructor(public readonly deletedBy: string) {}
}

/**
 * 모든 평가라인 리셋 핸들러
 *
 * 모든 평가라인 매핑 및 관련 평가 데이터를 삭제합니다:
 * - 동료평가 질문 매핑
 * - 동료평가
 * - 하향평가
 * - 평가라인 매핑
 *
 * 모든 삭제는 하나의 트랜잭션으로 처리되어 원자성을 보장합니다.
 */
@CommandHandler(ResetAllEvaluationLinesCommand)
@Injectable()
export class ResetAllEvaluationLinesHandler
  implements ICommandHandler<ResetAllEvaluationLinesCommand>
{
  private readonly logger = new Logger(ResetAllEvaluationLinesHandler.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
  ) {}

  async execute(
    command: ResetAllEvaluationLinesCommand,
  ): Promise<ResetAllEvaluationLinesResult> {
    const { deletedBy } = command;

    this.logger.log(`모든 평가라인 리셋 시작 - 삭제자: ${deletedBy}`);

    return await this.dataSource.transaction(async (manager) => {
      const deletedCounts = {
        peerEvaluationQuestionMappings: 0,
        peerEvaluations: 0,
        downwardEvaluations: 0,
        evaluationLineMappings: 0,
      };

      // 1. 모든 동료평가 질문 매핑 삭제
      this.logger.log('1단계: 모든 동료평가 질문 매핑 삭제 시작');
      const allPeerEvaluations =
        await this.peerEvaluationService.필터_조회한다({});
      for (const peerEval of allPeerEvaluations) {
        const mappings =
          await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(
            peerEval.id,
          );
        if (mappings.length > 0) {
          await this.peerEvaluationQuestionMappingService.동료평가의_질문매핑을_전체삭제한다(
            peerEval.id,
            deletedBy,
          );
          deletedCounts.peerEvaluationQuestionMappings += mappings.length;
        }
      }

      // 2. 모든 동료평가 삭제
      this.logger.log('2단계: 모든 동료평가 삭제 시작');
      for (const peerEval of allPeerEvaluations) {
        await this.peerEvaluationService.삭제한다(peerEval.id, deletedBy);
        deletedCounts.peerEvaluations++;
      }

      // 3. 모든 하향평가 삭제
      this.logger.log('3단계: 모든 하향평가 삭제 시작');
      const allDownwardEvaluations =
        await this.downwardEvaluationService.필터_조회한다({});
      for (const downwardEval of allDownwardEvaluations) {
        await this.downwardEvaluationService.삭제한다(
          downwardEval.id,
          deletedBy,
        );
        deletedCounts.downwardEvaluations++;
      }

      // 4. 모든 평가라인 매핑 삭제
      this.logger.log('4단계: 모든 평가라인 매핑 삭제 시작');
      deletedCounts.evaluationLineMappings =
        await this.evaluationLineMappingService.모든_평가라인을_삭제한다(
          deletedBy,
          manager,
        );

      this.logger.log('모든 평가라인 리셋 완료', {
        deletedCounts,
      });

      return {
        deletedCounts,
        message: '모든 평가라인 데이터가 성공적으로 리셋되었습니다.',
      };
    });
  }
}

