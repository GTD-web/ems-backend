import { Controller, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StepApprovalContextService } from '@context/step-approval-context';
import { UpdateStepApprovalDto } from './dto/update-step-approval.dto';
import { UpdateStepApproval } from './decorators/step-approval-api.decorators';
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
  ) {}

  /**
   * 단계 승인 상태를 변경한다
   */
  @UpdateStepApproval()
  async updateStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
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
}
