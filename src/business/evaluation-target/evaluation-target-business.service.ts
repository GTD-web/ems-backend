import { Injectable, Logger } from '@nestjs/common';
import { EvaluationPeriodManagementContextService } from '../../context/evaluation-period-management-context/evaluation-period-management.service';
import { RegisterWithAutoEvaluatorResult } from '../../context/evaluation-period-management-context/handlers/evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';
import { EvaluationLineMappingService } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';

/**
 * 평가 대상 비즈니스 서비스
 *
 * 평가 대상자 관련 비즈니스 로직의 오케스트레이션을 담당합니다.
 * - 평가 대상자 등록 시 1차 평가자 자동 할당
 * - 평가 대상자 대량 등록 시 1차 평가자 자동 할당
 * - 평가 대상자 등록 해제 시 평가라인 매핑 삭제
 */
@Injectable()
export class EvaluationTargetBusinessService {
  private readonly logger = new Logger(EvaluationTargetBusinessService.name);

  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
  ) {}

  /**
   * 평가 대상자를 등록하고 1차 평가자를 자동 할당한다
   */
  async 평가대상자를_등록한다(
    evaluationPeriodId: string,
    employeeId: string,
    createdBy: string,
  ): Promise<RegisterWithAutoEvaluatorResult> {
    this.logger.log(
      `평가 대상자 등록 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    const result =
      await this.evaluationPeriodManagementService.평가대상자를_자동평가자와_함께_등록한다(
        evaluationPeriodId,
        employeeId,
        createdBy,
      );

    this.logger.log(
      `평가 대상자 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, ` +
        `1차 평가자 할당: ${result.primaryEvaluatorAssigned ? '성공' : '실패'}`,
    );

    return result;
  }

  /**
   * 평가 대상자를 대량 등록하고 1차 평가자를 자동 할당한다
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
        const result =
          await this.evaluationPeriodManagementService.평가대상자를_자동평가자와_함께_등록한다(
            evaluationPeriodId,
            employeeId,
            createdBy,
          );
        results.push(result);
      } catch (error) {
        this.logger.warn(`직원 등록 실패 - 직원: ${employeeId}`, error.message);
        // 실패한 경우에도 빈 결과를 추가하여 인덱스 일치 유지
        results.push({
          mapping: null as any, // 실제로는 에러 상황이므로 null 처리
          primaryEvaluatorAssigned: false,
          primaryEvaluatorId: null,
          warning: `등록 실패: ${error.message}`,
        });
      }
    }

    const successCount = results.filter(
      (r) => r.primaryEvaluatorAssigned,
    ).length;
    const warningCount = results.filter((r) => r.warning).length;

    this.logger.log(
      `평가 대상자 대량 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, ` +
        `총 직원: ${employeeIds.length}명, 성공: ${successCount}명, 경고: ${warningCount}개`,
    );

    return results;
  }

  /**
   * 평가 대상자 등록을 해제하고 관련 평가라인 매핑도 함께 삭제한다
   */
  async 평가대상자_등록_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
    deletedBy: string,
  ): Promise<boolean> {
    this.logger.log(
      `평가 대상자 등록 해제 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      // 1. 평가 대상자 등록 해제
      const result =
        await this.evaluationPeriodManagementService.평가대상자_등록_해제한다(
          evaluationPeriodId,
          employeeId,
        );

      if (!result) {
        this.logger.warn(
          `평가 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        );
        return false;
      }

      // 2. 해당 직원의 모든 평가라인 매핑 삭제 (1차, 2차 평가자 모두)
      try {
        const mappings = await this.evaluationLineMappingService.필터_조회한다({
          evaluationPeriodId,
          employeeId,
        });

        let deletedMappingCount = 0;
        for (const mapping of mappings) {
          const mappingId = mapping.DTO로_변환한다().id;
          await this.evaluationLineMappingService.삭제한다(
            mappingId,
            deletedBy,
          );
          deletedMappingCount++;
        }

        this.logger.log(
          `평가라인 매핑 삭제 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, ` +
            `삭제된 매핑 수: ${deletedMappingCount}`,
        );
      } catch (error) {
        // 평가라인 매핑 삭제 실패는 경고로 처리하고 평가 대상자 등록 해제는 성공으로 간주
        this.logger.warn(
          `평가라인 매핑 삭제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
          error.message,
        );
      }

      this.logger.log(
        `평가 대상자 등록 해제 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `평가 대상자 등록 해제 비즈니스 로직 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
