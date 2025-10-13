import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { PeerEvaluationBusinessService } from '@/business/peer-evaluation/peer-evaluation-business.service';
import {
  UpsertPeerEvaluation,
  SubmitPeerEvaluation,
  GetEvaluatorPeerEvaluations,
  GetPeerEvaluationDetail,
} from './decorators/peer-evaluation-api.decorators';
import {
  CreatePeerEvaluationBodyDto,
  SubmitPeerEvaluationDto,
  PeerEvaluationFilterDto,
  PeerEvaluationResponseDto,
  PeerEvaluationListResponseDto,
  PeerEvaluationDetailResponseDto,
} from './dto/peer-evaluation.dto';

/**
 * 동료평가 관리 컨트롤러
 *
 * 동료평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-3. 관리자 - 성과평가 - 동료평가')
@Controller('admin/performance-evaluation/peer-evaluations')
export class PeerEvaluationManagementController {
  constructor(
    private readonly peerEvaluationBusinessService: PeerEvaluationBusinessService,
  ) {}

  /**
   * 동료평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertPeerEvaluation()
  async upsertPeerEvaluation(
    @Param('evaluateeId') evaluateeId: string,
    @Param('periodId') periodId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreatePeerEvaluationBodyDto,
  ): Promise<PeerEvaluationResponseDto> {
    const actionBy = dto.createdBy || uuidv4();
    const evaluatorId = dto.evaluatorId || uuidv4(); // TODO: 추후 요청자 ID로 변경

    const evaluationId =
      await this.peerEvaluationBusinessService.동료평가를_저장한다({
        evaluatorId,
        evaluateeId,
        periodId,
        projectId,
        peerEvaluationContent: dto.peerEvaluationContent,
        peerEvaluationScore: dto.peerEvaluationScore,
        actionBy,
      });

    return {
      id: evaluationId,
      message: '동료평가가 성공적으로 저장되었습니다.',
    };
  }

  /**
   * 동료평가 제출
   */
  @SubmitPeerEvaluation()
  async submitPeerEvaluation(
    @Param('id') id: string,
    @Body() submitDto: SubmitPeerEvaluationDto,
  ): Promise<void> {
    const submittedBy = submitDto.submittedBy || 'admin'; // TODO: 실제 사용자 ID로 변경

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
    @Param('evaluatorId') evaluatorId: string,
    @Query() filter: PeerEvaluationFilterDto,
  ): Promise<PeerEvaluationListResponseDto> {
    return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
      evaluatorId,
      evaluateeId: filter.evaluateeId,
      periodId: filter.periodId,
      projectId: filter.projectId,
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
    @Param('id') id: string,
  ): Promise<PeerEvaluationDetailResponseDto> {
    return await this.peerEvaluationBusinessService.동료평가_상세정보를_조회한다(
      {
        evaluationId: id,
      },
    );
  }
}
