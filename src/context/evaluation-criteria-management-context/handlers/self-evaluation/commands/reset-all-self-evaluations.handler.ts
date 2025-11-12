import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';

/**
 * 모든 자기평가 리셋 결과 타입
 */
export interface ResetAllSelfEvaluationsResult {
  deletedCounts: {
    downwardEvaluations: number;
    selfEvaluations: number;
  };
  message: string;
}

/**
 * 모든 자기평가 리셋 커맨드
 */
export class ResetAllSelfEvaluationsCommand {
  constructor(public readonly deletedBy: string) {}
}

/**
 * 모든 자기평가 리셋 핸들러
 *
 * 모든 자기평가 및 관련 하향평가 데이터를 삭제합니다:
 * - 하향평가 (자기평가에 연결된)
 * - 자기평가
 *
 * 모든 삭제는 하나의 트랜잭션으로 처리되어 원자성을 보장합니다.
 */
@CommandHandler(ResetAllSelfEvaluationsCommand)
@Injectable()
export class ResetAllSelfEvaluationsHandler
  implements ICommandHandler<ResetAllSelfEvaluationsCommand>
{
  private readonly logger = new Logger(ResetAllSelfEvaluationsHandler.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly selfEvaluationService: WbsSelfEvaluationService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
  ) {}

  async execute(
    command: ResetAllSelfEvaluationsCommand,
  ): Promise<ResetAllSelfEvaluationsResult> {
    const { deletedBy } = command;

    this.logger.log(`모든 자기평가 리셋 시작 - 삭제자: ${deletedBy}`);

    return await this.dataSource.transaction(async (manager) => {
      const deletedCounts = {
        downwardEvaluations: 0,
        selfEvaluations: 0,
      };

      // 1. 모든 자기평가 조회
      this.logger.log('1단계: 모든 자기평가 조회 시작');
      const allSelfEvaluations = await this.selfEvaluationService.필터_조회한다(
        {},
      );
      this.logger.log(
        `조회된 자기평가 개수: ${allSelfEvaluations.length}개`,
      );

      // 2. 각 자기평가에 연결된 하향평가 삭제
      this.logger.log('2단계: 자기평가에 연결된 하향평가 삭제 시작');
      for (const selfEval of allSelfEvaluations) {
        // 해당 자기평가에 연결된 하향평가 조회
        const downwardEvaluations =
          await this.downwardEvaluationService.필터_조회한다({
            selfEvaluationId: selfEval.id,
          });

        // 하향평가 삭제
        for (const downwardEval of downwardEvaluations) {
          await this.downwardEvaluationService.삭제한다(
            downwardEval.id,
            deletedBy,
          );
          deletedCounts.downwardEvaluations++;
        }
      }
      this.logger.log(
        `하향평가 삭제 완료: ${deletedCounts.downwardEvaluations}개`,
      );

      // 3. 모든 자기평가 삭제
      this.logger.log('3단계: 모든 자기평가 삭제 시작');
      for (const selfEval of allSelfEvaluations) {
        await this.selfEvaluationService.삭제한다(selfEval.id, deletedBy);
        deletedCounts.selfEvaluations++;
      }
      this.logger.log(
        `자기평가 삭제 완료: ${deletedCounts.selfEvaluations}개`,
      );

      const message = `모든 자기평가 리셋 완료 - 자기평가 ${deletedCounts.selfEvaluations}개, 하향평가 ${deletedCounts.downwardEvaluations}개 삭제`;
      this.logger.log(message);

      return {
        deletedCounts,
        message,
      };
    });
  }
}

