import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { PerformanceEvaluationService } from '../../../context/performance-evaluation-context/performance-evaluation.service';
import {
  GetDownwardEvaluationDetailQuery,
  GetDownwardEvaluationListQuery,
} from '../../../context/performance-evaluation-context/handlers/downward-evaluation';
import {
  UpsertPrimaryDownwardEvaluation,
  UpsertSecondaryDownwardEvaluation,
  SubmitPrimaryDownwardEvaluation,
  SubmitSecondaryDownwardEvaluation,
  SubmitDownwardEvaluation,
  GetEvaluatorDownwardEvaluations,
  GetDownwardEvaluationDetail,
} from './decorators/downward-evaluation-api.decorators';
import {
  CreatePrimaryDownwardEvaluationBodyDto,
  CreateSecondaryDownwardEvaluationBodyDto,
  SubmitDownwardEvaluationDto,
  DownwardEvaluationFilterDto,
  DownwardEvaluationResponseDto,
  DownwardEvaluationListResponseDto,
  DownwardEvaluationDetailResponseDto,
} from './dto/downward-evaluation.dto';
import { ParseUUID } from '@interface/decorators';

/**
 * 하향평가 관리 컨트롤러
 *
 * 하향평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-2. 관리자 - 성과평가 - 하향평가')
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
  ): Promise<DownwardEvaluationResponseDto> {
    const actionBy = dto.createdBy || uuidv4();
    const evaluatorId = dto.evaluatorId || uuidv4(); // TODO: 추후 요청자 ID로 변경
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
  ): Promise<DownwardEvaluationResponseDto> {
    const actionBy = dto.createdBy || uuidv4();
    const evaluatorId = dto.evaluatorId || uuidv4(); // TODO: 추후 요청자 ID로 변경
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
  ): Promise<void> {
    const evaluatorId = submitDto.evaluatorId || uuidv4(); // TODO: 실제 사용자 ID로 변경
    const submittedBy = submitDto.submittedBy || '시스템'; // TODO: 실제 사용자 ID로 변경
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
  ): Promise<void> {
    const evaluatorId = submitDto.evaluatorId || uuidv4(); // TODO: 실제 사용자 ID로 변경
    const submittedBy = submitDto.submittedBy || '시스템'; // TODO: 실제 사용자 ID로 변경
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
    @Body() submitDto: SubmitDownwardEvaluationDto,
  ): Promise<void> {
    const submittedBy = submitDto.submittedBy || '시스템'; // TODO: 실제 사용자 ID로 변경
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
