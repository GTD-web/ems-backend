import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import {
  CreateWbsEvaluationCriteria,
  DeleteWbsEvaluationCriteria,
  DeleteWbsItemEvaluationCriteria,
  GetWbsEvaluationCriteriaDetail,
  GetWbsEvaluationCriteriaList,
  GetWbsItemEvaluationCriteria,
  UpdateWbsEvaluationCriteria,
} from './decorators/wbs-evaluation-criteria-api.decorators';
import {
  CreateWbsEvaluationCriteriaDto,
  UpdateWbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaFilterDto,
  WbsItemEvaluationCriteriaResponseDto,
} from './dto/wbs-evaluation-criteria.dto';

/**
 * WBS 평가기준 관리 컨트롤러
 *
 * WBS 평가기준 생성, 조회, 수정, 삭제 기능을 제공합니다.
 */
@ApiTags('B-3. 관리자 - 평가 설정 - WBS 평가기준')
@Controller('admin/evaluation-criteria/wbs-evaluation-criteria')
export class WbsEvaluationCriteriaManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  /**
   * WBS 평가기준 목록 조회
   */
  @GetWbsEvaluationCriteriaList()
  async getWbsEvaluationCriteriaList(
    @Query() filter: WbsEvaluationCriteriaFilterDto,
  ): Promise<WbsEvaluationCriteriaDto[]> {
    return await this.evaluationCriteriaManagementService.WBS_평가기준_목록을_조회한다(
      {
        wbsItemId: filter.wbsItemId,
        criteriaSearch: filter.criteriaSearch,
        criteriaExact: filter.criteriaExact,
      },
    );
  }

  /**
   * WBS 평가기준 상세 조회
   */
  @GetWbsEvaluationCriteriaDetail()
  async getWbsEvaluationCriteriaDetail(
    @Param('id') id: string,
  ): Promise<WbsEvaluationCriteriaDto | null> {
    return await this.evaluationCriteriaManagementService.WBS_평가기준_상세를_조회한다(
      id,
    );
  }

  /**
   * WBS 항목별 평가기준 조회
   */
  @GetWbsItemEvaluationCriteria()
  async getWbsItemEvaluationCriteria(
    @Param('wbsItemId') wbsItemId: string,
  ): Promise<WbsItemEvaluationCriteriaResponseDto> {
    const criteria =
      await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
        wbsItemId,
      );

    return {
      wbsItemId,
      criteria,
    };
  }

  /**
   * WBS 평가기준 생성
   */
  @CreateWbsEvaluationCriteria()
  async createWbsEvaluationCriteria(
    @Body() createData: CreateWbsEvaluationCriteriaDto,
  ): Promise<WbsEvaluationCriteriaDto> {
    const createdBy = 'system'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다(
      createData,
      createdBy,
    );
  }

  /**
   * WBS 평가기준 수정
   */
  @UpdateWbsEvaluationCriteria()
  async updateWbsEvaluationCriteria(
    @Param('id') id: string,
    @Body() updateData: UpdateWbsEvaluationCriteriaDto,
  ): Promise<WbsEvaluationCriteriaDto> {
    const updatedBy = 'system'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.WBS_평가기준을_수정한다(
      id,
      updateData,
      updatedBy,
    );
  }

  /**
   * WBS 평가기준 삭제
   */
  @DeleteWbsEvaluationCriteria()
  async deleteWbsEvaluationCriteria(@Param('id') id: string): Promise<void> {
    const deletedBy = 'system'; // TODO: 실제 사용자 ID로 변경
    await this.evaluationCriteriaManagementService.WBS_평가기준을_삭제한다(
      id,
      deletedBy,
    );
  }

  /**
   * WBS 항목 평가기준 전체 삭제
   */
  @DeleteWbsItemEvaluationCriteria()
  async deleteWbsItemEvaluationCriteria(
    @Param('wbsItemId') wbsItemId: string,
  ): Promise<void> {
    const deletedBy = 'system'; // TODO: 실제 사용자 ID로 변경
    await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
      wbsItemId,
      deletedBy,
    );
  }
}
