import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { DownwardEvaluationMappingService } from '@domain/core/downward-evaluation-mapping/downward-evaluation-mapping.service';
import { DownwardEvaluationMapping } from '@domain/core/downward-evaluation-mapping/downward-evaluation-mapping.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 Upsert 커맨드
 */
export class UpsertDownwardEvaluationCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly selfEvaluationId?: string,
    public readonly evaluationType: string = 'primary',
    public readonly downwardEvaluationContent?: string,
    public readonly downwardEvaluationScore?: number,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * 하향평가 Upsert 핸들러
 * 기존 하향평가가 있으면 수정, 없으면 생성합니다.
 */
@Injectable()
@CommandHandler(UpsertDownwardEvaluationCommand)
export class UpsertDownwardEvaluationHandler
  implements ICommandHandler<UpsertDownwardEvaluationCommand>
{
  private readonly logger = new Logger(UpsertDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly downwardEvaluationMappingService: DownwardEvaluationMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpsertDownwardEvaluationCommand): Promise<string> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      selfEvaluationId,
      evaluationType,
      downwardEvaluationContent,
      downwardEvaluationScore,
      actionBy,
    } = command;

    this.logger.log('하향평가 Upsert 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      evaluationType,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 기존 매핑 조회 (evaluateeId, evaluatorId, periodId, projectId로 찾기)
      const existingMappings =
        await this.downwardEvaluationMappingService.필터_조회한다({
          employeeId: evaluateeId,
          evaluatorId,
          periodId,
          projectId,
        });

      // 해당 evaluationType의 매핑 찾기
      let existingMapping: DownwardEvaluationMapping | null = null;
      if (existingMappings.length > 0) {
        for (const mapping of existingMappings) {
          const evaluation = await this.downwardEvaluationService.조회한다(
            mapping.downwardEvaluationId,
          );
          if (evaluation && evaluation.evaluationType === evaluationType) {
            existingMapping = mapping;
            break;
          }
        }
      }

      if (existingMapping) {
        // 기존 하향평가 수정
        this.logger.log('기존 하향평가 수정', {
          evaluationId: existingMapping.downwardEvaluationId,
        });

        await this.downwardEvaluationService.수정한다(
          existingMapping.downwardEvaluationId,
          {
            downwardEvaluationContent,
            downwardEvaluationScore,
          },
          actionBy,
        );

        // 자기평가 ID가 변경된 경우 매핑 업데이트
        if (
          selfEvaluationId &&
          existingMapping.selfEvaluationId !== selfEvaluationId
        ) {
          await this.downwardEvaluationMappingService.수정한다(
            existingMapping.id,
            { selfEvaluationId },
            actionBy,
          );
        }

        return existingMapping.downwardEvaluationId;
      } else {
        // 새로운 하향평가 생성
        this.logger.log('새로운 하향평가 생성', {
          evaluatorId,
          evaluateeId,
          evaluationType,
        });

        const evaluation = await this.downwardEvaluationService.생성한다({
          downwardEvaluationContent,
          downwardEvaluationScore,
          evaluationDate: new Date(),
          evaluationType: evaluationType as DownwardEvaluationType,
          isCompleted: false,
          createdBy: actionBy,
        });

        // 하향평가 매핑 생성
        await this.downwardEvaluationMappingService.생성한다({
          employeeId: evaluateeId,
          evaluatorId,
          projectId,
          periodId,
          downwardEvaluationId: evaluation.id,
          selfEvaluationId,
          mappedBy: actionBy,
        });

        this.logger.log('하향평가 생성 완료', { evaluationId: evaluation.id });
        return evaluation.id;
      }
    });
  }
}
