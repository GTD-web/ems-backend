import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { WbsSelfEvaluationMappingService } from '@domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationMapping } from '@/domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.entity';
import { WbsSelfEvaluationDto } from '@/domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { WbsSelfEvaluationMappingDto } from '@/domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.types';

/**
 * WBS 자기평가 생성 커맨드
 */
export class CreateWbsSelfEvaluationCommand {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly selfEvaluationContent: string,
    public readonly selfEvaluationScore: number,
    public readonly additionalComments?: string,
    public readonly createdBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateWbsSelfEvaluationCommand)
export class CreateWbsSelfEvaluationHandler
  implements ICommandHandler<CreateWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(CreateWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly wbsSelfEvaluationMappingService: WbsSelfEvaluationMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: CreateWbsSelfEvaluationCommand): Promise<{
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
      createdBy,
    } = command;

    this.logger.log('WBS 자기평가 생성 핸들러 실행', {
      periodId,
      employeeId,
      wbsItemId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 1. 먼저 매핑이 존재하는지 확인
      const existingMappings =
        await this.wbsSelfEvaluationMappingService.필터_조회한다({
          periodId,
          employeeId,
          wbsItemId,
        });

      let mapping: WbsSelfEvaluationMapping;
      if (existingMappings.length > 0) {
        mapping = existingMappings[0];
      } else {
        // 2. 매핑이 없으면 새로 생성
        mapping = await this.wbsSelfEvaluationMappingService.생성한다({
          periodId,
          employeeId,
          wbsItemId,
          assignedBy: createdBy,
        });
      }

      // 3. 자가평가 생성 (간소화된 데이터만)
      const evaluation = await this.wbsSelfEvaluationService.생성한다({
        selfEvaluationContent,
        selfEvaluationScore,
        additionalComments,
        createdBy,
      });

      // 4. 매핑에 자가평가 ID 연결
      await this.wbsSelfEvaluationMappingService.자가평가_ID를_설정한다(
        mapping.id,
        evaluation.id,
        createdBy,
      );

      this.logger.log('WBS 자기평가 생성 완료', {
        evaluationId: evaluation.id,
        mappingId: mapping.id,
      });
      // 매핑과 자기평가 정보를 반환
      return {
        evaluation: evaluation.DTO로_변환한다(),
        evaluationMapping: mapping.DTO로_변환한다(),
      };
    });
  }
}
