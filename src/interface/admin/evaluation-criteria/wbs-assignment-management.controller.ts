import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WbsAssignmentBusinessService } from '../../../business/wbs-assignment/wbs-assignment-business.service';
import { WbsAssignmentListResult } from '../../../context/evaluation-criteria-management-context/handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';
import type { AuthenticatedUser } from '../../decorators';
import { CurrentUser } from '../../decorators';
import {
  BulkCreateWbsAssignments,
  CancelWbsAssignment,
  CancelWbsAssignmentByWbs,
  ChangeWbsAssignmentOrder,
  ChangeWbsAssignmentOrderByWbs,
  CreateAndAssignWbs,
  CreateWbsAssignment,
  GetEmployeeWbsAssignments,
  GetProjectWbsAssignments,
  GetUnassignedWbsItems,
  GetWbsAssignmentDetail,
  GetWbsAssignmentList,
  GetWbsItemAssignments,
  ResetEmployeeWbsAssignments,
  ResetPeriodWbsAssignments,
  ResetProjectWbsAssignments,
  UpdateWbsItemTitle,
} from './decorators/wbs-assignment-api.decorators';
import {
  BulkCreateWbsAssignmentDto,
  CancelWbsAssignmentByWbsDto,
  ChangeWbsAssignmentOrderByWbsDto,
  ChangeWbsAssignmentOrderQueryDto,
  CreateAndAssignWbsDto,
  CreateWbsAssignmentDto,
  EmployeeWbsAssignmentsResponseDto,
  GetUnassignedWbsItemsDto,
  ProjectWbsAssignmentsResponseDto,
  UnassignedWbsItemsResponseDto,
  UpdateWbsItemTitleDto,
  WbsAssignmentDetailResponseDto,
  WbsAssignmentFilterDto,
  WbsItemAssignmentsResponseDto
} from './dto/wbs-assignment.dto';

/**
 * WBS 할당 관리 컨트롤러
 *
 * 평가기간에 직원을 WBS 항목에 할당하는 기능을 제공합니다.
 */
@ApiTags('B-2. 관리자 - 평가 설정 - WBS 할당')
@ApiBearerAuth('Bearer')
@Controller('admin/evaluation-criteria/wbs-assignments')
export class WbsAssignmentManagementController {
  constructor(
    private readonly wbsAssignmentBusinessService: WbsAssignmentBusinessService,
  ) {}

  /**
   * WBS 할당 생성
   */
  @CreateWbsAssignment()
  async createWbsAssignment(
    @Body() createDto: CreateWbsAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const assignedBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS를_할당한다({
      employeeId: createDto.employeeId,
      wbsItemId: createDto.wbsItemId,
      projectId: createDto.projectId,
      periodId: createDto.periodId,
      assignedBy: assignedBy,
    });
  }

  /**
   * WBS 할당 취소 (Deprecated)
   * @deprecated WBS ID 기반 엔드포인트를 사용하세요. cancelWbsAssignmentByWbs
   */
  @CancelWbsAssignment()
  async cancelWbsAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const cancelledBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_할당을_취소한다({
      assignmentId: id,
      cancelledBy,
    });
  }

  /**
   * WBS 할당 취소 (WBS ID 기반)
   */
  @CancelWbsAssignmentByWbs()
  async cancelWbsAssignmentByWbs(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Body() bodyDto: CancelWbsAssignmentByWbsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const cancelledBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_할당을_WBS_ID로_취소한다({
      employeeId: bodyDto.employeeId,
      wbsItemId: wbsItemId,
      projectId: bodyDto.projectId,
      periodId: bodyDto.periodId,
      cancelledBy,
    });
  }

  /**
   * WBS 할당 목록 조회
   */
  @GetWbsAssignmentList()
  async getWbsAssignmentList(
    @Query() filter: WbsAssignmentFilterDto,
  ): Promise<WbsAssignmentListResult> {
    return await this.wbsAssignmentBusinessService.WBS_할당_목록을_조회한다({
      periodId: filter.periodId,
      employeeId: filter.employeeId,
      wbsItemId: filter.wbsItemId,
      projectId: filter.projectId,
      page: filter.page,
      limit: filter.limit,
      orderBy: filter.orderBy,
      orderDirection: filter.orderDirection,
    });
  }

  /**
   * 특정 평가기간에 직원에게 할당된 WBS 조회
   */
  @GetEmployeeWbsAssignments()
  async getEmployeeWbsAssignments(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<EmployeeWbsAssignmentsResponseDto> {
    const wbsAssignments =
      await this.wbsAssignmentBusinessService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(
        employeeId,
        periodId,
      );
    return { wbsAssignments };
  }

  /**
   * 특정 평가기간에 프로젝트의 WBS 할당 조회
   */
  @GetProjectWbsAssignments()
  async getProjectWbsAssignments(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<ProjectWbsAssignmentsResponseDto> {
    const wbsAssignments =
      await this.wbsAssignmentBusinessService.특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
        projectId,
        periodId,
      );
    return { wbsAssignments };
  }

  /**
   * 특정 평가기간에 WBS 항목에 할당된 직원 조회
   */
  @GetWbsItemAssignments()
  async getWbsItemAssignments(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<WbsItemAssignmentsResponseDto> {
    const wbsAssignments =
      await this.wbsAssignmentBusinessService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
        wbsItemId,
        periodId,
      );
    return { wbsAssignments };
  }

  /**
   * 특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목 목록 조회
   */
  @GetUnassignedWbsItems()
  async getUnassignedWbsItems(
    @Query() queryDto: GetUnassignedWbsItemsDto,
  ): Promise<UnassignedWbsItemsResponseDto> {
    const wbsItems =
      await this.wbsAssignmentBusinessService.특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
        queryDto.projectId,
        queryDto.periodId,
        queryDto.employeeId,
      );
    return { wbsItems };
  }

  /**
   * WBS 할당 상세 조회
   */
  @GetWbsAssignmentDetail()
  async getWbsAssignmentDetail(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @Query('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<WbsAssignmentDetailResponseDto> {
    const result =
      await this.wbsAssignmentBusinessService.WBS_할당_상세를_조회한다(
        employeeId,
        wbsItemId,
        projectId,
        periodId,
      );

    if (!result) {
      throw new NotFoundException('WBS 할당을 찾을 수 없습니다.');
    }

    return result;
  }

  /**
   * WBS 대량 할당
   */
  @BulkCreateWbsAssignments()
  async bulkCreateWbsAssignments(
    @Body() bulkCreateDto: BulkCreateWbsAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any[]> {
    const assignedBy = user.id;

    return await this.wbsAssignmentBusinessService.WBS를_대량으로_할당한다({
      assignments: bulkCreateDto.assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        wbsItemId: assignment.wbsItemId,
        projectId: assignment.projectId,
        periodId: assignment.periodId,
        assignedBy,
      })),
      assignedBy,
    });
  }

  /**
   * 평가기간의 WBS 할당 초기화
   */
  @ResetPeriodWbsAssignments()
  async resetPeriodWbsAssignments(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const resetBy = user.id;
    return await this.wbsAssignmentBusinessService.평가기간의_WBS_할당을_초기화한다(
      {
        periodId,
        resetBy,
      },
    );
  }

  /**
   * 프로젝트의 WBS 할당 초기화
   */
  @ResetProjectWbsAssignments()
  async resetProjectWbsAssignments(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const resetBy = user.id;
    return await this.wbsAssignmentBusinessService.프로젝트의_WBS_할당을_초기화한다(
      {
        projectId,
        periodId,
        resetBy,
      },
    );
  }

  /**
   * 직원의 WBS 할당 초기화
   */
  @ResetEmployeeWbsAssignments()
  async resetEmployeeWbsAssignments(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const resetBy = user.id;
    return await this.wbsAssignmentBusinessService.직원의_WBS_할당을_초기화한다(
      {
        employeeId,
        periodId,
        resetBy,
      },
    );
  }

  /**
   * WBS 할당 순서 변경 (Deprecated)
   * @deprecated WBS ID 기반 엔드포인트를 사용하세요. changeWbsAssignmentOrderByWbs
   */
  @ChangeWbsAssignmentOrder()
  async changeWbsAssignmentOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: ChangeWbsAssignmentOrderQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const updatedBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_할당_순서를_변경한다({
      assignmentId: id,
      direction: queryDto.direction,
      updatedBy,
    });
  }

  /**
   * WBS 할당 순서 변경 (WBS ID 기반)
   */
  @ChangeWbsAssignmentOrderByWbs()
  async changeWbsAssignmentOrderByWbs(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Body() bodyDto: ChangeWbsAssignmentOrderByWbsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const updatedBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_할당_순서를_WBS_ID로_변경한다({
      employeeId: bodyDto.employeeId,
      wbsItemId: wbsItemId,
      projectId: bodyDto.projectId,
      periodId: bodyDto.periodId,
      direction: bodyDto.direction,
      updatedBy,
    });
  }

  /**
   * WBS 생성하면서 할당
   */
  @CreateAndAssignWbs()
  async createAndAssignWbs(
    @Body() createDto: CreateAndAssignWbsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const createdBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS를_생성하고_할당한다({
      title: createDto.title,
      projectId: createDto.projectId,
      employeeId: createDto.employeeId,
      periodId: createDto.periodId,
      createdBy: createdBy,
    });
  }

  /**
   * WBS 항목 이름 수정
   */
  @UpdateWbsItemTitle()
  async updateWbsItemTitle(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Body() updateDto: UpdateWbsItemTitleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const updatedBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_항목_이름을_수정한다({
      wbsItemId: wbsItemId,
      title: updateDto.title,
      updatedBy: updatedBy,
    });
  }
}
