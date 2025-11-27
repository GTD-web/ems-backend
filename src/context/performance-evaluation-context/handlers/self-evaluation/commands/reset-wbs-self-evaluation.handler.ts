import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';

/**
 * 단일 WBS 자기평가 초기화 커맨드 (1차 평가자 → 관리자 제출 취소)
 */
export class ResetWbsSelfEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 단일 WBS 자기평가 초기화 핸들러 (1차 평가자 → 관리자 제출 취소)
 * 특정 WBS 자기평가의 관리자 제출 상태를 초기화합니다.
 */
@Injectable()
@CommandHandler(ResetWbsSelfEvaluationCommand)
export class ResetWbsSelfEvaluationHandler
  implements ICommandHandler<ResetWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(ResetWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
  ) {}

  async execute(
    command: ResetWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, resetBy } = command;

    this.logger.log('WBS 자기평가 초기화 시작', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 조회 검증
      const evaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new BadRequestException('존재하지 않는 자기평가입니다.');
      }

      // 이미 관리자에게 미제출 상태면 에러
      if (!evaluation.일차평가자가_관리자에게_제출했는가()) {
        throw new BadRequestException(
          '이미 관리자에게 미제출 상태인 자기평가입니다.',
        );
      }

      // 1. 1차 평가자 → 관리자 제출 상태 초기화
      const updatedEvaluation = await this.wbsSelfEvaluationService.수정한다(
        evaluationId,
        { submittedToManager: false },
        resetBy,
      );

      // 2. 승인 상태 초기화 (approved → pending)
      this.logger.debug('승인 상태 초기화 시작');

      // evaluationPeriodEmployeeMapping 조회
      const mapping = await this.mappingRepository.findOne({
        where: {
          evaluationPeriodId: evaluation.periodId,
          employeeId: evaluation.employeeId,
          deletedAt: IsNull(),
        },
      });

      if (mapping) {
        this.logger.debug('Mapping 조회 성공', {
          mappingId: mapping.id,
        });

        // EmployeeEvaluationStepApproval 조회
        const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
          mapping.id,
        );

        if (stepApproval) {
          this.logger.debug('승인 레코드 조회 성공', {
            approvalId: stepApproval.id,
            currentStatus: stepApproval.selfEvaluationStatus,
          });

          // approved 상태인 경우 pending으로 변경
          if (stepApproval.selfEvaluationStatus === StepApprovalStatus.APPROVED) {
            this.stepApprovalService.단계_상태를_변경한다(
              stepApproval,
              'self',
              StepApprovalStatus.PENDING,
              resetBy,
            );

            await this.stepApprovalService.저장한다(stepApproval);

            this.logger.debug('승인 상태 변경 완료', {
              approvalId: stepApproval.id,
              oldStatus: StepApprovalStatus.APPROVED,
              newStatus: StepApprovalStatus.PENDING,
            });
          } else {
            this.logger.debug(
              `승인 상태가 approved가 아니므로 스킵 (현재: ${stepApproval.selfEvaluationStatus})`,
            );
          }
        } else {
          this.logger.debug('승인 레코드를 찾을 수 없음');
        }
      } else {
        this.logger.debug('Mapping을 찾을 수 없음');
      }

      this.logger.log('WBS 자기평가 초기화 완료', { evaluationId });

      return updatedEvaluation.DTO로_변환한다();
    });
  }
}
