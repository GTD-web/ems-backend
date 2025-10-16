import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';

/**
 * 프로젝트별 WBS 자기평가 내용 초기화 커맨드
 */
export class ClearWbsSelfEvaluationsByProjectCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly clearedBy?: string,
  ) {}
}

/**
 * 초기화된 WBS 자기평가 상세 정보 (프로젝트별)
 */
export interface ClearedWbsSelfEvaluationByProjectDetail {
  id: string;
  wbsItemId: string;
  selfEvaluationContent: string;
  selfEvaluationScore: number;
  performanceResult?: string;
}

/**
 * 프로젝트별 WBS 자기평가 내용 초기화 응답
 */
export interface ClearWbsSelfEvaluationsByProjectResponse {
  employeeId: string;
  periodId: string;
  projectId: string;
  clearedCount: number;
  clearedEvaluations: ClearedWbsSelfEvaluationByProjectDetail[];
}

/**
 * 프로젝트별 WBS 자기평가 내용 초기화 핸들러
 * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가 내용을 초기화합니다.
 */
@Injectable()
@CommandHandler(ClearWbsSelfEvaluationsByProjectCommand)
export class ClearWbsSelfEvaluationsByProjectHandler
  implements
    ICommandHandler<
      ClearWbsSelfEvaluationsByProjectCommand,
      ClearWbsSelfEvaluationsByProjectResponse
    >
{
  private readonly logger = new Logger(
    ClearWbsSelfEvaluationsByProjectHandler.name,
  );

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ClearWbsSelfEvaluationsByProjectCommand,
  ): Promise<ClearWbsSelfEvaluationsByProjectResponse> {
    this.logger.log(
      `프로젝트별 WBS 자기평가 내용 초기화: 직원=${command.employeeId}, 평가기간=${command.periodId}, 프로젝트=${command.projectId}`,
    );

    return this.transactionManager.executeTransaction(async (manager) => {
      const repository = manager.getRepository(WbsSelfEvaluation);

      // 1. 프로젝트의 WBS 항목 ID 목록 조회
      const wbsAssignments =
        await this.evaluationWbsAssignmentService.프로젝트_WBS별_조회한다(
          command.periodId,
          command.projectId,
          manager,
        );

      const wbsItemIds = wbsAssignments.map(
        (assignment) => assignment.wbsItemId,
      );

      if (wbsItemIds.length === 0) {
        this.logger.warn(
          `프로젝트에 할당된 WBS 항목이 없습니다: 프로젝트=${command.projectId}`,
        );
        return {
          employeeId: command.employeeId,
          periodId: command.periodId,
          projectId: command.projectId,
          clearedCount: 0,
          clearedEvaluations: [],
        };
      }

      // 2. 해당 직원의 평가기간 + 프로젝트 WBS 항목에 속한 모든 자기평가 조회
      const evaluations = await repository
        .createQueryBuilder('evaluation')
        .where('evaluation.employeeId = :employeeId', {
          employeeId: command.employeeId,
        })
        .andWhere('evaluation.periodId = :periodId', {
          periodId: command.periodId,
        })
        .andWhere('evaluation.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
        .getMany();

      if (evaluations.length === 0) {
        this.logger.warn(
          `내용 초기화할 자기평가가 없습니다: 직원=${command.employeeId}, 평가기간=${command.periodId}, 프로젝트=${command.projectId}`,
        );
        return {
          employeeId: command.employeeId,
          periodId: command.periodId,
          projectId: command.projectId,
          clearedCount: 0,
          clearedEvaluations: [],
        };
      }

      const clearedEvaluations: ClearedWbsSelfEvaluationByProjectDetail[] = [];

      // 3. 각 평가의 내용을 초기화
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
        `프로젝트별 WBS 자기평가 내용 초기화 완료: ${clearedEvaluations.length}개`,
      );

      return {
        employeeId: command.employeeId,
        periodId: command.periodId,
        projectId: command.projectId,
        clearedCount: clearedEvaluations.length,
        clearedEvaluations,
      };
    });
  }
}
