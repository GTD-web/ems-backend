import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { PerformanceEvaluationService } from '../../../context/performance-evaluation-context/performance-evaluation.service';
import {
  UpsertWbsSelfEvaluation,
  SubmitWbsSelfEvaluation,
  GetEmployeeSelfEvaluations,
  GetWbsSelfEvaluationDetail,
} from './decorators/wbs-self-evaluation-api.decorators';
import {
  CreateWbsSelfEvaluationBodyDto,
  SubmitWbsSelfEvaluationDto,
  WbsSelfEvaluationFilterDto,
  WbsSelfEvaluationResponseDto,
  WbsSelfEvaluationDetailResponseDto,
  EmployeeSelfEvaluationsResponseDto,
} from './dto/wbs-self-evaluation.dto';

/**
 * WBS 자기평가 관리 컨트롤러
 *
 * WBS 자기평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-1. 관리자 - 성과평가 - WBS 자기평가')
@Controller('admin/performance-evaluation/wbs-self-evaluations')
export class WbsSelfEvaluationManagementController {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  /**
   * WBS 자기평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertWbsSelfEvaluation()
  async upsertWbsSelfEvaluation(
    @Param('employeeId') employeeId: string,
    @Param('wbsItemId') wbsItemId: string,
    @Param('periodId') periodId: string,
    @Body() dto: CreateWbsSelfEvaluationBodyDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<WbsSelfEvaluationResponseDto> {
    const actionBy = dto.createdBy || uuidv4(); // DTO에서 받은 UUID 또는 임시 UUID 사용
    return await this.performanceEvaluationService.WBS자기평가를_저장한다({
      employeeId,
      wbsItemId,
      periodId,
      selfEvaluationContent: dto.selfEvaluationContent,
      selfEvaluationScore: dto.selfEvaluationScore,
      actionBy,
    });
  }

  /**
   * WBS 자기평가 제출
   */
  @SubmitWbsSelfEvaluation()
  async submitWbsSelfEvaluation(
    @Param('id') id: string,
    @Body() submitDto: SubmitWbsSelfEvaluationDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<WbsSelfEvaluationResponseDto> {
    const submittedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.performanceEvaluationService.WBS자기평가를_제출한다({
      evaluationId: id,
      submittedBy,
    });
  }

  /**
   * 직원의 자기평가 목록 조회
   */
  @GetEmployeeSelfEvaluations()
  async getEmployeeSelfEvaluations(
    @Param('employeeId') employeeId: string,
    @Query() filter: WbsSelfEvaluationFilterDto,
  ): Promise<EmployeeSelfEvaluationsResponseDto> {
    return await this.performanceEvaluationService.직원의_자기평가_목록을_조회한다(
      {
        employeeId,
        periodId: filter.periodId,
        projectId: filter.projectId,
        page: filter.page || 1,
        limit: filter.limit || 10,
      },
    );
  }

  /**
   * WBS 자기평가 상세정보 조회
   */
  @GetWbsSelfEvaluationDetail()
  async getWbsSelfEvaluationDetail(
    @Param('id') id: string,
  ): Promise<WbsSelfEvaluationDetailResponseDto> {
    return await this.performanceEvaluationService.WBS자기평가_상세정보를_조회한다(
      {
        evaluationId: id,
      },
    );
  }
}
