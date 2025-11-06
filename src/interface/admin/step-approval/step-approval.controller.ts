import { Controller, Body, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StepApprovalContextService } from '@context/step-approval-context';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { UpdateStepApprovalDto } from './dto/update-step-approval.dto';
import { UpdateSecondaryStepApprovalDto } from './dto/update-secondary-step-approval.dto';
import { StepApprovalEnumsResponseDto } from './dto/step-approval-enums.dto';
import {
  UpdateStepApproval,
  UpdateCriteriaStepApproval,
  UpdateSelfStepApproval,
  UpdatePrimaryStepApproval,
  UpdateSecondaryStepApproval,
} from './decorators/step-approval-api.decorators';
import { GetStepApprovalEnums } from './decorators/step-approval-enums-api.decorators';
import { StepTypeEnum, StepApprovalStatusEnum } from './dto/update-step-approval.dto';
import { CurrentUser } from '@interface/decorators/current-user.decorator';

/**
 * 단계 승인 컨트롤러
 * 평가 단계별 승인 상태 관리 API를 제공합니다.
 */
@ApiTags('A-0-3. 관리자 - 단계 승인')
@ApiBearerAuth('Bearer')
@Controller('admin/step-approvals')
export class StepApprovalController {
  constructor(
    private readonly stepApprovalContextService: StepApprovalContextService,
    private readonly wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService,
  ) {}

  /**
   * 단계 승인 Enum 목록을 조회한다
   */
  @GetStepApprovalEnums()
  async getStepApprovalEnums(): Promise<StepApprovalEnumsResponseDto> {
    return {
      steps: Object.values(StepTypeEnum),
      statuses: Object.values(StepApprovalStatusEnum),
    };
  }

  /**
   * 단계 승인 상태를 변경한다 (Deprecated)
   * @deprecated 단계별 엔드포인트를 사용하세요. updateCriteriaStepApproval, updateSelfStepApproval, updatePrimaryStepApproval, updateSecondaryStepApproval
   */
  @UpdateStepApproval()
  async updateStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto & { step: StepTypeEnum },
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    await this.stepApprovalContextService.단계별_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      step: dto.step as any,
      status: dto.status as any,
      revisionComment: dto.revisionComment,
      updatedBy,
    });
  }

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다
   */
  @UpdateCriteriaStepApproval()
  async updateCriteriaStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: dto.status as any,
      revisionComment: dto.revisionComment,
      updatedBy,
    });
  }

  /**
   * 자기평가 단계 승인 상태를 변경한다
   * 재작성 요청 생성 시 제출 상태 초기화를 함께 처리합니다.
   */
  @UpdateSelfStepApproval()
  async updateSelfStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    // 재작성 요청 생성 시 제출 상태 초기화를 함께 처리
    if (dto.status === StepApprovalStatusEnum.REVISION_REQUESTED) {
      if (!dto.revisionComment || dto.revisionComment.trim() === '') {
        throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
      }

      // 비즈니스 서비스를 통해 제출 상태 초기화 및 재작성 요청 생성
      await this.wbsSelfEvaluationBusinessService.자기평가_재작성요청_생성_및_제출상태_초기화(
        evaluationPeriodId,
        employeeId,
        dto.revisionComment,
        updatedBy,
      );
    } else {
      // 재작성 요청이 아닌 경우 기존 로직대로 처리
      await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: dto.status as any,
        revisionComment: dto.revisionComment,
        updatedBy,
      });
    }
  }

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다
   */
  @UpdatePrimaryStepApproval()
  async updatePrimaryStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: dto.status as any,
      revisionComment: dto.revisionComment,
      updatedBy,
    });
  }

  /**
   * 2차 하향평가 단계 승인 상태를 평가자별로 변경한다
   */
  @UpdateSecondaryStepApproval()
  async updateSecondaryStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('evaluatorId', ParseUUIDPipe) evaluatorId: string,
    @Body() dto: UpdateSecondaryStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      evaluatorId,
      status: dto.status as any,
      revisionComment: dto.revisionComment,
      updatedBy,
    });
  }
}

