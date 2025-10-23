import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import { ParseUUID, CurrentUser } from '@interface/decorators';
import type { AuthenticatedUser } from '@interface/decorators';
import {
  RequestPeerEvaluation,
  RequestPeerEvaluationToMultipleEvaluators,
  RequestMultiplePeerEvaluations,
  SubmitPeerEvaluation,
  GetEvaluatorPeerEvaluations,
  GetPeerEvaluationDetail,
  GetEvaluatorAssignedEvaluatees,
  CancelPeerEvaluation,
  CancelPeerEvaluationsByPeriod,
} from './decorators/peer-evaluation-api.decorators';
import {
  RequestPeerEvaluationDto,
  RequestPeerEvaluationToMultipleEvaluatorsDto,
  RequestMultiplePeerEvaluationsDto,
  CreatePeerEvaluationBodyDto,
  PeerEvaluationFilterDto,
  PeerEvaluationResponseDto,
  BulkPeerEvaluationRequestResponseDto,
  PeerEvaluationListResponseDto,
  GetEvaluatorAssignedEvaluateesQueryDto,
  AssignedEvaluateeDto,
} from './dto/peer-evaluation.dto';

/**
 * 동료평가 관리 컨트롤러
 *
 * 동료평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-5. 관리자 - 성과평가 - 동료평가')
@ApiBearerAuth('Bearer')
@Controller('admin/performance-evaluation/peer-evaluations')
export class PeerEvaluationManagementController {
  constructor(
    private readonly peerEvaluationBusinessService: PeerEvaluationBusinessService,
  ) {}

  /**
   * 동료평가 요청(할당)
   */
  @RequestPeerEvaluation()
  async requestPeerEvaluation(
    @Body() dto: RequestPeerEvaluationDto,
  ): Promise<PeerEvaluationResponseDto> {
    const requestedBy = dto.requestedBy || uuidv4(); // TODO: 추후 요청자 ID로 변경

    const evaluationId =
      await this.peerEvaluationBusinessService.동료평가를_요청한다({
        evaluatorId: dto.evaluatorId,
        evaluateeId: dto.evaluateeId,
        periodId: dto.periodId,
        requestDeadline: dto.requestDeadline,
        questionIds: dto.questionIds,
        requestedBy,
      });

    return {
      id: evaluationId,
      message: '동료평가가 성공적으로 요청되었습니다.',
    };
  }

  /**
   * 한 명의 피평가자를 여러 평가자에게 요청
   */
  @RequestPeerEvaluationToMultipleEvaluators()
  async requestPeerEvaluationToMultipleEvaluators(
    @Body() dto: RequestPeerEvaluationToMultipleEvaluatorsDto,
  ): Promise<BulkPeerEvaluationRequestResponseDto> {
    const requestedBy = dto.requestedBy || uuidv4(); // TODO: 추후 요청자 ID로 변경

    const result =
      await this.peerEvaluationBusinessService.여러_평가자에게_동료평가를_요청한다(
        {
          evaluatorIds: dto.evaluatorIds,
          evaluateeId: dto.evaluateeId,
          periodId: dto.periodId,
          requestDeadline: dto.requestDeadline,
          questionIds: dto.questionIds,
          requestedBy,
        },
      );

    return {
      results: result.results,
      summary: result.summary,
      message:
        result.summary.failed > 0
          ? `${result.summary.total}건 중 ${result.summary.success}건의 동료평가 요청이 생성되었습니다. (실패: ${result.summary.failed}건)`
          : `${result.summary.success}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
      // 하위 호환성을 위한 필드
      ids: result.results.filter((r) => r.success).map((r) => r.evaluationId!),
      count: result.summary.success,
    };
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청
   */
  @RequestMultiplePeerEvaluations()
  async requestMultiplePeerEvaluations(
    @Body() dto: RequestMultiplePeerEvaluationsDto,
  ): Promise<BulkPeerEvaluationRequestResponseDto> {
    const requestedBy = dto.requestedBy || uuidv4(); // TODO: 추후 요청자 ID로 변경

    const result =
      await this.peerEvaluationBusinessService.여러_피평가자에_대한_동료평가를_요청한다(
        {
          evaluatorId: dto.evaluatorId,
          evaluateeIds: dto.evaluateeIds,
          periodId: dto.periodId,
          requestDeadline: dto.requestDeadline,
          questionIds: dto.questionIds,
          requestedBy,
        },
      );

    return {
      results: result.results,
      summary: result.summary,
      message:
        result.summary.failed > 0
          ? `${result.summary.total}건 중 ${result.summary.success}건의 동료평가 요청이 생성되었습니다. (실패: ${result.summary.failed}건)`
          : `${result.summary.success}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
      // 하위 호환성을 위한 필드
      ids: result.results.filter((r) => r.success).map((r) => r.evaluationId!),
      count: result.summary.success,
    };
  }

  /**
   * 동료평가 제출
   */
  @SubmitPeerEvaluation()
  async submitPeerEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const submittedBy = user.id;

    await this.peerEvaluationBusinessService.동료평가를_제출한다({
      evaluationId: id,
      submittedBy,
    });
  }

  /**
   * 평가자의 동료평가 목록 조회
   */
  @GetEvaluatorPeerEvaluations()
  async getEvaluatorPeerEvaluations(
    @ParseUUID('evaluatorId') evaluatorId: string,
    @Query() filter: PeerEvaluationFilterDto,
  ): Promise<PeerEvaluationListResponseDto> {
    return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
      evaluatorId,
      evaluateeId: filter.evaluateeId,
      periodId: filter.periodId,
      status: filter.status,
      page: filter.page || 1,
      limit: filter.limit || 10,
    });
  }

  /**
   * 동료평가 상세정보 조회
   */
  @GetPeerEvaluationDetail()
  async getPeerEvaluationDetail(
    @ParseUUID('id') id: string,
  ): Promise<PeerEvaluationDetailResult> {
    return await this.peerEvaluationBusinessService.동료평가_상세정보를_조회한다(
      {
        evaluationId: id,
      },
    );
  }

  /**
   * 평가자에게 할당된 피평가자 목록 조회
   */
  @GetEvaluatorAssignedEvaluatees()
  async getEvaluatorAssignedEvaluatees(
    @ParseUUID('evaluatorId') evaluatorId: string,
    @Query() query: GetEvaluatorAssignedEvaluateesQueryDto,
  ): Promise<AssignedEvaluateeDto[]> {
    return await this.peerEvaluationBusinessService.평가자에게_할당된_피평가자_목록을_조회한다(
      {
        evaluatorId,
        periodId: query.periodId,
        includeCompleted: query.includeCompleted,
      },
    );
  }

  /**
   * 동료평가 요청 취소
   */
  @CancelPeerEvaluation()
  async cancelPeerEvaluation(@Param('id') id: string): Promise<void> {
    const cancelledBy = uuidv4(); // TODO: 추후 요청자 ID로 변경

    await this.peerEvaluationBusinessService.동료평가_요청을_취소한다({
      evaluationId: id,
      cancelledBy,
    });
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가 요청 취소
   */
  @CancelPeerEvaluationsByPeriod()
  async cancelPeerEvaluationsByPeriod(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
  ): Promise<{ message: string; cancelledCount: number }> {
    const cancelledBy = uuidv4(); // TODO: 추후 요청자 ID로 변경

    const result =
      await this.peerEvaluationBusinessService.피평가자의_동료평가_요청을_일괄_취소한다(
        {
          evaluateeId,
          periodId,
          cancelledBy,
        },
      );

    return {
      message: '동료평가 요청들이 성공적으로 취소되었습니다.',
      cancelledCount: result.cancelledCount,
    };
  }
}
