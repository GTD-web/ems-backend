import { Controller, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import {
  UpdateEvaluationEditableStatusBodyDto,
  UpdateEvaluationEditableStatusQueryDto,
  EvaluationEditableStatusResponseDto,
} from './dto/evaluation-editable-status.dto';
import { UpdateEvaluationEditableStatus } from './decorators/evaluation-editable-status-api.decorators';

/**
 * 평가 수정 가능 상태 관리 컨트롤러
 *
 * 평가 수정 가능 상태를 관리하기 위한 API 엔드포인트를 제공합니다.
 */
@ApiTags('C-0. 관리자 - 성과평가')
@Controller('admin/performance-evaluation/evaluation-editable-status')
export class EvaluationEditableStatusManagementController {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  /**
   * 평가 수정 가능 상태 변경
   *
   * 특정 직원의 평가 수정 가능 상태를 변경합니다.
   *
   * @param mappingId - 평가기간-직원 맵핑 ID
   * @param query - 평가 타입 쿼리 파라미터
   * @param body - 평가 수정 가능 상태 변경 요청 DTO
   * @returns 변경된 맵핑 정보
   */
  @UpdateEvaluationEditableStatus()
  async updateEvaluationEditableStatus(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @Query() query: UpdateEvaluationEditableStatusQueryDto,
    @Body() body: UpdateEvaluationEditableStatusBodyDto,
  ): Promise<EvaluationEditableStatusResponseDto> {
    const result =
      await this.performanceEvaluationService.평가_수정_가능_상태를_변경한다(
        mappingId,
        query.evaluationType,
        body.isEditable,
        body.updatedBy,
      );

    return {
      id: result.id,
      evaluationPeriodId: result.evaluationPeriodId,
      employeeId: result.employeeId,
      isSelfEvaluationEditable: result.isSelfEvaluationEditable,
      isPrimaryEvaluationEditable: result.isPrimaryEvaluationEditable,
      isSecondaryEvaluationEditable: result.isSecondaryEvaluationEditable,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
