import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { WbsSelfEvaluationMappingService } from '@domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.service';
import { WbsSelfEvaluationMapping } from '@domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { WbsSelfEvaluationMappingDto } from '@domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.types';

/**
 * WBS 자기평가 Upsert 커맨드
 */
export class UpsertWbsSelfEvaluationCommand {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly selfEvaluationContent: string,
    public readonly selfEvaluationScore: number,
    public readonly additionalComments?: string,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 Upsert 핸들러
 * 기존 자기평가가 있으면 수정, 없으면 생성합니다.
 */
@Injectable()
@CommandHandler(UpsertWbsSelfEvaluationCommand)
export class UpsertWbsSelfEvaluationHandler
  implements ICommandHandler<UpsertWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(UpsertWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly wbsSelfEvaluationMappingService: WbsSelfEvaluationMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpsertWbsSelfEvaluationCommand): Promise<{
    evaluation: WbsSelfEvaluationDto;
    evaluationMapping: WbsSelfEvaluationMappingDto;
  }> {
    const {
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      additionalComments,
      actionBy,
    } = command;

    this.logger.log('WBS 자기평가 Upsert 핸들러 실행', {
      periodId,
      employeeId,
      wbsItemId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 기존 매핑 조회
      const existingMappings =
        await this.wbsSelfEvaluationMappingService.필터_조회한다({
          periodId,
          employeeId,
          wbsItemId,
        });

      let mapping: WbsSelfEvaluationMapping;
      let evaluation;

      if (existingMappings.length > 0) {
        mapping = existingMappings[0];

        // 매핑에 연결된 자기평가가 있는지 확인
        if (mapping.selfEvaluationId) {
          // 기존 자기평가 수정
          this.logger.log('기존 자기평가 수정', {
            evaluationId: mapping.selfEvaluationId,
          });

          evaluation = await this.wbsSelfEvaluationService.수정한다(
            mapping.selfEvaluationId,
            {
              selfEvaluationContent,
              selfEvaluationScore,
              additionalComments,
            },
            actionBy,
          );
        } else {
          // 새로운 자기평가 생성 후 매핑에 연결
          this.logger.log('새로운 자기평가 생성 (매핑 존재)', {
            mappingId: mapping.id,
          });

          evaluation = await this.wbsSelfEvaluationService.생성한다({
            selfEvaluationContent,
            selfEvaluationScore,
            additionalComments,
            createdBy: actionBy,
          });

          // 매핑에 자기평가 ID 연결
          await this.wbsSelfEvaluationMappingService.자가평가_ID를_설정한다(
            mapping.id,
            evaluation.id,
            actionBy,
          );
        }
      } else {
        // 새로운 매핑 생성
        this.logger.log('새로운 매핑 및 자기평가 생성', {
          employeeId,
          wbsItemId,
        });

        mapping = await this.wbsSelfEvaluationMappingService.생성한다({
          periodId,
          employeeId,
          wbsItemId,
          assignedBy: actionBy,
        });

        // 새로운 자기평가 생성
        evaluation = await this.wbsSelfEvaluationService.생성한다({
          selfEvaluationContent,
          selfEvaluationScore,
          additionalComments,
          createdBy: actionBy,
        });

        // 매핑에 자기평가 ID 연결
        await this.wbsSelfEvaluationMappingService.자가평가_ID를_설정한다(
          mapping.id,
          evaluation.id,
          actionBy,
        );
      }

      this.logger.log('WBS 자기평가 저장 완료', {
        evaluationId: evaluation.id,
        mappingId: mapping.id,
      });

      return {
        evaluation: evaluation.DTO로_변환한다(),
        evaluationMapping: mapping.DTO로_변환한다(),
      };
    });
  }
}
