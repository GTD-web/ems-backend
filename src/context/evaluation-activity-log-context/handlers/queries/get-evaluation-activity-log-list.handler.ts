import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import type { GetEvaluationActivityLogListResult } from '../../interfaces/evaluation-activity-log-context.interface';

/**
 * 평가 활동 내역 목록 조회 Query
 */
export class 평가활동내역목록을조회한다 {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly activityType?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * 평가 활동 내역 목록 조회 Handler
 *
 * 평가기간 피평가자 기준 활동 내역을 조회합니다.
 */
@Injectable()
@QueryHandler(평가활동내역목록을조회한다)
export class GetEvaluationActivityLogListHandler
  implements
    IQueryHandler<
      평가활동내역목록을조회한다,
      GetEvaluationActivityLogListResult
    >
{
  private readonly logger = new Logger(
    GetEvaluationActivityLogListHandler.name,
  );

  constructor(
    private readonly activityLogService: EvaluationActivityLogService,
  ) {}

  async execute(
    query: 평가활동내역목록을조회한다,
  ): Promise<GetEvaluationActivityLogListResult> {
    this.logger.log('평가기간 피평가자 활동 내역 조회 시작', {
      periodId: query.periodId,
      employeeId: query.employeeId,
    });

    return await this.activityLogService.평가기간_피평가자_활동내역을_조회한다({
      periodId: query.periodId,
      employeeId: query.employeeId,
      activityType: query.activityType,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
