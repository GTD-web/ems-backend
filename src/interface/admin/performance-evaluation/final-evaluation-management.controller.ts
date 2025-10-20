import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceEvaluationService } from '../../../context/performance-evaluation-context/performance-evaluation.service';
import { ParseUUID, CurrentUser } from '@interface/decorators';
import type { AuthenticatedUser } from '@interface/decorators';
import {
  UpsertFinalEvaluation,
  ConfirmFinalEvaluation,
  CancelConfirmationFinalEvaluation,
  GetFinalEvaluation,
  GetFinalEvaluationList,
  GetFinalEvaluationByEmployeePeriod,
} from './decorators/final-evaluation-api.decorators';
import {
  UpsertFinalEvaluationBodyDto,
  FinalEvaluationFilterDto,
  FinalEvaluationResponseDto,
  FinalEvaluationDetailDto,
  FinalEvaluationListResponseDto,
} from './dto/final-evaluation.dto';
import {
  GetFinalEvaluationQuery,
  GetFinalEvaluationListQuery,
  GetFinalEvaluationByEmployeePeriodQuery,
} from '../../../context/performance-evaluation-context/handlers/final-evaluation';

/**
 * 최종평가 관리 컨트롤러
 *
 * 최종평가의 저장(생성/수정), 확정, 조회 기능을 제공합니다.
 */
@ApiTags('C-5. 관리자 - 성과평가 - 최종평가')
@ApiBearerAuth('Bearer')
@Controller('admin/performance-evaluation/final-evaluations')
export class FinalEvaluationManagementController {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  /**
   * 최종평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertFinalEvaluation()
  async upsertFinalEvaluation(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @Body() dto: UpsertFinalEvaluationBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FinalEvaluationResponseDto> {
    const actionBy = user.id;

    const evaluationId =
      await this.performanceEvaluationService.최종평가를_저장한다(
        employeeId,
        periodId,
        dto.evaluationGrade,
        dto.jobGrade,
        dto.jobDetailedGrade,
        dto.finalComments,
        actionBy,
      );

    return {
      id: evaluationId,
      message: '최종평가가 성공적으로 저장되었습니다.',
    };
  }

  /**
   * 최종평가 확정
   */
  @ConfirmFinalEvaluation()
  async confirmFinalEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.performanceEvaluationService.최종평가를_확정한다(id, user.id);

    return {
      message: '최종평가가 성공적으로 확정되었습니다.',
    };
  }

  /**
   * 최종평가 확정 취소
   */
  @CancelConfirmationFinalEvaluation()
  async cancelConfirmationFinalEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.performanceEvaluationService.최종평가_확정을_취소한다(
      id,
      user.id,
    );

    return {
      message: '최종평가 확정이 성공적으로 취소되었습니다.',
    };
  }

  /**
   * 최종평가 단일 조회
   */
  @GetFinalEvaluation()
  async getFinalEvaluation(
    @ParseUUID('id') id: string,
  ): Promise<FinalEvaluationDetailDto> {
    const query = new GetFinalEvaluationQuery(id);
    return await this.performanceEvaluationService.최종평가를_조회한다(query);
  }

  /**
   * 최종평가 목록 조회
   */
  @GetFinalEvaluationList()
  async getFinalEvaluationList(
    @Query() filter: FinalEvaluationFilterDto,
  ): Promise<FinalEvaluationListResponseDto> {
    const query = new GetFinalEvaluationListQuery(
      filter.employeeId,
      filter.periodId,
      filter.evaluationGrade,
      filter.jobGrade,
      filter.jobDetailedGrade,
      filter.confirmedOnly,
      filter.page || 1,
      filter.limit || 10,
    );

    return await this.performanceEvaluationService.최종평가_목록을_조회한다(
      query,
    );
  }

  /**
   * 직원-평가기간별 최종평가 조회
   */
  @GetFinalEvaluationByEmployeePeriod()
  async getFinalEvaluationByEmployeePeriod(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
  ): Promise<FinalEvaluationDetailDto | null> {
    const query = new GetFinalEvaluationByEmployeePeriodQuery(
      employeeId,
      periodId,
    );

    return await this.performanceEvaluationService.직원_평가기간별_최종평가를_조회한다(
      query,
    );
  }
}
