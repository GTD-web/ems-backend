import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';

/**
 * 직원의 전체 WBS 자기평가 내용 초기화 커맨드
 */
export class ClearAllWbsSelfEvaluationsByEmployeePeriodCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly clearedBy?: string,
  ) {}
}

/**
 * 초기화된 WBS 자기평가 상세 정보
 */
export interface ClearedWbsSelfEvaluationDetail {
  id: string;
  wbsItemId: string;
  selfEvaluationContent: string;
  selfEvaluationScore: number;
  performanceResult?: string;
}

/**
 * 직원의 전체 WBS 자기평가 내용 초기화 응답
 */
export interface ClearAllWbsSelfEvaluationsResponse {
  employeeId: string;
  periodId: string;
  clearedCount: number;
  clearedEvaluations: ClearedWbsSelfEvaluationDetail[];
}

/**
 * 직원의 전체 WBS 자기평가 내용 초기화 핸들러
 * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가 내용을 초기화합니다.
 */
@Injectable()
@CommandHandler(ClearAllWbsSelfEvaluationsByEmployeePeriodCommand)
export class ClearAllWbsSelfEvaluationsByEmployeePeriodHandler
  implements
    ICommandHandler<
      ClearAllWbsSelfEvaluationsByEmployeePeriodCommand,
      ClearAllWbsSelfEvaluationsResponse
    >
{
  private readonly logger = new Logger(
    ClearAllWbsSelfEvaluationsByEmployeePeriodHandler.name,
  );

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ClearAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ): Promise<ClearAllWbsSelfEvaluationsResponse> {
    this.logger.log(
      `직원의 전체 WBS 자기평가 내용 초기화: 직원=${command.employeeId}, 평가기간=${command.periodId}`,
    );

    return this.transactionManager.executeTransaction(async (manager) => {
      const repository = manager.getRepository(WbsSelfEvaluation);

      // 해당 직원의 평가기간에 속한 모든 자기평가 조회
      const evaluations = await repository.find({
        where: {
          employeeId: command.employeeId,
          periodId: command.periodId,
        },
      });

      if (evaluations.length === 0) {
        this.logger.warn(
          `내용 초기화할 자기평가가 없습니다: 직원=${command.employeeId}, 평가기간=${command.periodId}`,
        );
        return {
          employeeId: command.employeeId,
          periodId: command.periodId,
          clearedCount: 0,
          clearedEvaluations: [],
        };
      }

      const clearedEvaluations: ClearedWbsSelfEvaluationDetail[] = [];

      // 각 평가의 내용을 초기화
      for (const evaluation of evaluations) {
        evaluation.자가평가_내용을_초기화한다(command.clearedBy);
        await repository.save(evaluation);

        clearedEvaluations.push({
          id: evaluation.id,
          wbsItemId: evaluation.wbsItemId,
          selfEvaluationContent: evaluation.selfEvaluationContent,
          selfEvaluationScore: evaluation.selfEvaluationScore,
          performanceResult: evaluation.performanceResult,
        });
      }

      this.logger.log(
        `직원의 전체 WBS 자기평가 내용 초기화 완료: ${clearedEvaluations.length}개`,
      );

      return {
        employeeId: command.employeeId,
        periodId: command.periodId,
        clearedCount: clearedEvaluations.length,
        clearedEvaluations,
      };
    });
  }
}
