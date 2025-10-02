import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import type { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 상세정보 조회 쿼리
 */
export class GetWbsSelfEvaluationDetailQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * WBS ?�기?��? ?�세?�보 조회 ?�들??
 */
@Injectable()
@QueryHandler(GetWbsSelfEvaluationDetailQuery)
export class GetWbsSelfEvaluationDetailHandler
  implements IQueryHandler<GetWbsSelfEvaluationDetailQuery>
{
  private readonly logger = new Logger(GetWbsSelfEvaluationDetailHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
  ) {}

  async execute(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId } = query;

    this.logger.log('WBS ?�기?��? ?�세?�보 조회 ?�들???�행', { evaluationId });

    // 자기평가 상세정보 조회
    const evaluation =
      await this.wbsSelfEvaluationService.조회한다(evaluationId);

    if (!evaluation) {
      throw new Error('존재?��? ?�는 ?�기?��??�니??');
    }

    this.logger.log('WBS ?�기?��? ?�세?�보 조회 ?�료', { evaluationId });

    return evaluation.DTO로_변환한다();
  }
}

