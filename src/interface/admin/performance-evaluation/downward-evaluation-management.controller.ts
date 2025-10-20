import type { AuthenticatedUser } from '@interface/decorators';
import { CurrentUser, ParseUUID } from '@interface/decorators';
import { Body, Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  GetDownwardEvaluationDetailQuery,
  GetDownwardEvaluationListQuery,
} from '../../../context/performance-evaluation-context/handlers/downward-evaluation';
import { PerformanceEvaluationService } from '../../../context/performance-evaluation-context/performance-evaluation.service';
import {
  GetDownwardEvaluationDetail,
  GetEvaluatorDownwardEvaluations,
  SubmitDownwardEvaluation,
  SubmitPrimaryDownwardEvaluation,
  SubmitSecondaryDownwardEvaluation,
  UpsertPrimaryDownwardEvaluation,
  UpsertSecondaryDownwardEvaluation,
} from './decorators/downward-evaluation-api.decorators';
import {
  CreatePrimaryDownwardEvaluationBodyDto,
  CreateSecondaryDownwardEvaluationBodyDto,
  DownwardEvaluationDetailResponseDto,
  DownwardEvaluationFilterDto,
  DownwardEvaluationListResponseDto,
  DownwardEvaluationResponseDto,
  SubmitDownwardEvaluationDto,
} from './dto/downward-evaluation.dto';

/**
 * 하향평가 관리 컨트롤러
 *
 * 하향평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-2. 관리자 - 성과평가 - 하향평가')
@ApiBearerAuth('Bearer')
@Controller('admin/performance-evaluation/downward-evaluations')
export class DownwardEvaluationManagementController {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  /**
   * 1차 하향평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertPrimaryDownwardEvaluation()
  async upsertPrimaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @Body() dto: CreatePrimaryDownwardEvaluationBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DownwardEvaluationResponseDto> {
    const actionBy = user.id;
    const evaluatorId = dto.evaluatorId;
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        evaluatorId,
        evaluateeId,
        periodId,
        projectId,
        dto.selfEvaluationId,
        'primary',
        dto.downwardEvaluationContent,
        dto.downwardEvaluationScore,
        actionBy,
      );

    return {
      id: evaluationId,
      evaluatorId,
      message: '1차 하향평가가 성공적으로 저장되었습니다.',
    };
  }

  /**
   * 2차 하향평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertSecondaryDownwardEvaluation()
  async upsertSecondaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @Body() dto: CreateSecondaryDownwardEvaluationBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DownwardEvaluationResponseDto> {
    const actionBy = user.id;
    const evaluatorId = dto.evaluatorId;
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        evaluatorId,
        evaluateeId,
        periodId,
        projectId,
        dto.selfEvaluationId,
        'secondary',
        dto.downwardEvaluationContent,
        dto.downwardEvaluationScore,
        actionBy,
      );

    return {
      id: evaluationId,
      evaluatorId,
      message: '2차 하향평가가 성공적으로 저장되었습니다.',
    };
  }

  /**
   * 1차 하향평가 제출
   */
  @SubmitPrimaryDownwardEvaluation()
  async submitPrimaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const evaluatorId = submitDto.evaluatorId;
    const submittedBy = user.id;
    await this.performanceEvaluationService.일차_하향평가를_제출한다(
      evaluateeId,
      periodId,
      projectId,
      evaluatorId,
      submittedBy,
    );
  }

  /**
   * 2차 하향평가 제출
   */
  @SubmitSecondaryDownwardEvaluation()
  async submitSecondaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const evaluatorId = submitDto.evaluatorId;
    const submittedBy = user.id;
    await this.performanceEvaluationService.이차_하향평가를_제출한다(
      evaluateeId,
      periodId,
      projectId,
      evaluatorId,
      submittedBy,
    );
  }

  /**
   * 하향평가 제출 (ID로 직접)
   */
  @SubmitDownwardEvaluation()
  async submitDownwardEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const submittedBy = user.id;
    await this.performanceEvaluationService.하향평가를_제출한다(
      id,
      submittedBy,
    );
  }

  /**
   * 평가자의 하향평가 목록 조회
   */
  @GetEvaluatorDownwardEvaluations()
  async getEvaluatorDownwardEvaluations(
    @ParseUUID('evaluatorId') evaluatorId: string,
    @Query() filter: DownwardEvaluationFilterDto,
  ): Promise<DownwardEvaluationListResponseDto> {
    const query = new GetDownwardEvaluationListQuery(
      evaluatorId,
      filter.evaluateeId,
      filter.periodId,
      filter.projectId,
      filter.evaluationType,
      filter.isCompleted,
      filter.page || 1,
      filter.limit || 10,
    );
    return await this.performanceEvaluationService.하향평가_목록을_조회한다(
      query,
    );
  }

  /**
   * 하향평가 상세정보 조회
   */
  @GetDownwardEvaluationDetail()
  async getDownwardEvaluationDetail(
    @ParseUUID('id') id: string,
  ): Promise<DownwardEvaluationDetailResponseDto> {
    const query = new GetDownwardEvaluationDetailQuery(id);
    return await this.performanceEvaluationService.하향평가_상세정보를_조회한다(
      query,
    );
  }
}
