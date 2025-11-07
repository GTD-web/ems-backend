import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@interface/guards/jwt-auth.guard';
import { RolesGuard } from '@interface/guards/roles.guard';
import { Roles } from '@interface/decorators/roles.decorator';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { GetEvaluationActivityLogListQueryDto } from './dto/get-evaluation-activity-log-list-query.dto';
import {
  EvaluationActivityLogResponseDto,
  EvaluationActivityLogListResponseDto,
} from './dto/evaluation-activity-log-response.dto';

/**
 * 평가 활동 내역 관리 컨트롤러
 * 평가기간 피평가자 기준 활동 내역 조회 기능을 제공합니다.
 */
@ApiTags('A-0-6. 관리자 - 평가 활동 내역')
@ApiBearerAuth('Bearer')
@Controller('admin/evaluation-activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EvaluationActivityLogController {
  constructor(
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  @Get('periods/:periodId/employees/:employeeId')
  @ApiOperation({
    summary: '평가기간 피평가자 기준 활동 내역 조회',
    description:
      '특정 평가기간의 특정 피평가자에 대한 모든 활동 내역을 조회합니다.',
  })
  @ApiParam({
    name: 'periodId',
    description: '평가 기간 ID',
    type: String,
    example: 'period-123',
  })
  @ApiParam({
    name: 'employeeId',
    description: '피평가자 ID',
    type: String,
    example: 'employee-456',
  })
  @ApiResponse({
    status: 200,
    description: '활동 내역 목록 조회 성공',
    type: EvaluationActivityLogListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getEvaluationActivityLogs(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query() query: GetEvaluationActivityLogListQueryDto,
  ): Promise<EvaluationActivityLogListResponseDto> {
    const result =
      await this.activityLogContextService.평가기간_피평가자_활동내역을_조회한다({
        periodId,
        employeeId,
        activityType: query.activityType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        page: query.page || 1,
        limit: query.limit || 20,
      });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}

