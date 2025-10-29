import { Injectable, Logger } from '@nestjs/common';
import { EvaluationPeriodManagementContextService } from '../../context/evaluation-period-management-context/evaluation-period-management.service';
import { CreateEvaluationPeriodMinimalDto } from '../../context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import { CreateEvaluationPeriodWithTargetsResult } from '../../context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period-with-auto-targets.handler';
import { RegisterWithAutoEvaluatorResult } from '../../context/evaluation-period-management-context/handlers/evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';
import { EvaluationPeriodPhase } from '../../domain/core/evaluation-period/evaluation-period.types';
import type { EvaluationPeriodDto } from '../../domain/core/evaluation-period/evaluation-period.types';

/**
 * 평가기간 비즈니스 서비스
 * 
 * 평가기간 관련 비즈니스 로직의 오케스트레이션을 담당합니다.
 * 실제 비즈니스 로직은 각 Context의 핸들러에서 처리됩니다.
 */
@Injectable()
export class EvaluationPeriodBusinessService {
  private readonly logger = new Logger(EvaluationPeriodBusinessService.name);

  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
  ) {}

  /**
   * 평가기간을 생성하고 평가 대상자 및 1차 평가자를 자동 할당한다 (오케스트레이션만)
   */
  async 평가기간을_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ): Promise<CreateEvaluationPeriodWithTargetsResult> {
    const result = await this.evaluationPeriodManagementService
      .평가기간을_대상자와_함께_생성한다(createData, createdBy);

    return result;
  }

  /**
   * 평가 대상자를 대량 등록하고 1차 평가자를 자동 할당한다 (오케스트레이션만)
   */
  async 평가대상자를_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
    createdBy: string,
  ): Promise<RegisterWithAutoEvaluatorResult[]> {
    this.logger.log(
      `평가 대상자 대량 등록 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}명`,
    );

    const results: RegisterWithAutoEvaluatorResult[] = [];

    for (const employeeId of employeeIds) {
      try {
        const result = await this.evaluationPeriodManagementService
          .평가대상자를_자동평가자와_함께_등록한다(evaluationPeriodId, employeeId, createdBy);
        results.push(result);
      } catch (error) {
        this.logger.warn(
          `직원 등록 실패 - 직원: ${employeeId}`,
          error.message,
        );
        // 실패한 경우에도 빈 결과를 추가하여 인덱스 일치 유지
        results.push({
          mapping: null as any, // 실제로는 에러 상황이므로 null 처리
          primaryEvaluatorAssigned: false,
          primaryEvaluatorId: null,
          warning: `등록 실패: ${error.message}`,
        });
      }
    }

    const successCount = results.filter(r => r.primaryEvaluatorAssigned).length;
    const warningCount = results.filter(r => r.warning).length;

    this.logger.log(
      `평가 대상자 대량 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, ` +
      `총 직원: ${employeeIds.length}명, 성공: ${successCount}명, 경고: ${warningCount}개`,
    );

    return results;
  }

  /**
   * 평가기간의 단계를 변경한다
   */
  async 단계_변경한다(
    periodId: string,
    targetPhase: EvaluationPeriodPhase,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    this.logger.log(
      `평가기간 단계 변경 비즈니스 로직 시작 - 평가기간: ${periodId}, 대상 단계: ${targetPhase}`,
    );

    const result = await this.evaluationPeriodManagementService.단계_변경한다(
      periodId,
      targetPhase,
      changedBy,
    );

    this.logger.log(
      `평가기간 단계 변경 완료 - 평가기간: ${periodId}, 변경된 단계: ${result.currentPhase}`,
    );

    return result;
  }
}
