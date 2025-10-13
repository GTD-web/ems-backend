import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import {
  BulkCreateWbsAssignments,
  CancelWbsAssignment,
  ChangeWbsAssignmentOrder,
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
} from './decorators/wbs-assignment-api.decorators';
import {
  BulkCreateWbsAssignmentDto,
  ChangeWbsAssignmentOrderBodyDto,
  ChangeWbsAssignmentOrderQueryDto,
  CreateWbsAssignmentDto,
  EmployeeWbsAssignmentsResponseDto,
  ProjectWbsAssignmentsResponseDto,
  ResetWbsAssignmentsDto,
  UnassignedWbsItemsResponseDto,
  WbsAssignmentFilterDto,
  WbsItemAssignmentsResponseDto,
} from './dto/wbs-assignment.dto';
import { WbsAssignmentListResult } from '../../../context/evaluation-criteria-management-context/handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';

/**
 * WBS 할당 관리 컨트롤러
 *
 * 평가기간에 직원을 WBS 항목에 할당하는 기능을 제공합니다.
 */
@ApiTags('B-2. 관리자 - 평가 설정 - WBS 할당')
@Controller('admin/evaluation-criteria/wbs-assignments')
export class WbsAssignmentManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  /**
   * WBS 할당 생성
   */
  @CreateWbsAssignment()
  async createWbsAssignment(
    @Body() createDto: CreateWbsAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any> {
    const assignedBy = createDto.assignedBy || uuidv4(); // DTO에서 받은 UUID 또는 임시 UUID 사용
    return await this.evaluationCriteriaManagementService.WBS를_할당한다(
      {
        employeeId: createDto.employeeId,
        wbsItemId: createDto.wbsItemId,
        projectId: createDto.projectId,
        periodId: createDto.periodId,
        assignedBy: assignedBy,
      },
      assignedBy,
    );
  }

  /**
   * WBS 할당 취소
   */
  @CancelWbsAssignment()
  async cancelWbsAssignment(
    @Param('id') id: string,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<void> {
    const cancelledBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.WBS_할당을_취소한다(
      id,
      cancelledBy,
    );
  }

  /**
   * WBS 할당 목록 조회
   */
  @GetWbsAssignmentList()
  async getWbsAssignmentList(
    @Query() filter: WbsAssignmentFilterDto,
  ): Promise<WbsAssignmentListResult> {
    return await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
      {
        periodId: filter.periodId,
        employeeId: filter.employeeId,
        wbsItemId: filter.wbsItemId,
        projectId: filter.projectId,
      },
      filter.page,
      filter.limit,
      filter.orderBy,
      filter.orderDirection,
    );
  }

  /**
   * WBS 할당 상세 조회
   */
  @GetWbsAssignmentDetail()
  async getWbsAssignmentDetail(@Param('id') id: string): Promise<any> {
    return await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
      id,
    );
  }

  /**
   * 특정 평가기간에 직원에게 할당된 WBS 조회
   */
  @GetEmployeeWbsAssignments()
  async getEmployeeWbsAssignments(
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
  ): Promise<EmployeeWbsAssignmentsResponseDto> {
    const wbsAssignments =
      await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(
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
    @Param('projectId') projectId: string,
    @Param('periodId') periodId: string,
  ): Promise<ProjectWbsAssignmentsResponseDto> {
    const wbsAssignments =
      await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
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
    @Param('wbsItemId') wbsItemId: string,
    @Param('periodId') periodId: string,
  ): Promise<WbsItemAssignmentsResponseDto> {
    const wbsAssignments =
      await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
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
    @Query('projectId') projectId: string,
    @Query('periodId') periodId: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<UnassignedWbsItemsResponseDto> {
    const wbsItemIds =
      await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
        projectId,
        periodId,
        employeeId,
      );
    return { wbsItemIds };
  }

  /**
   * WBS 대량 할당
   */
  @BulkCreateWbsAssignments()
  async bulkCreateWbsAssignments(
    @Body() bulkCreateDto: BulkCreateWbsAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any[]> {
    // 각 할당에서 assignedBy를 추출 (첫 번째 할당의 assignedBy 사용, 없으면 임시 UUID 생성)
    const assignedBy = bulkCreateDto.assignments[0]?.assignedBy || uuidv4();

    return await this.evaluationCriteriaManagementService.WBS를_대량으로_할당한다(
      bulkCreateDto.assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        wbsItemId: assignment.wbsItemId,
        projectId: assignment.projectId,
        periodId: assignment.periodId,
        assignedBy,
      })),
      assignedBy,
    );
  }

  /**
   * 평가기간의 WBS 할당 초기화
   */
  @ResetPeriodWbsAssignments()
  async resetPeriodWbsAssignments(
    @Param('periodId') periodId: string,
    @Body() resetDto: ResetWbsAssignmentsDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<void> {
    const resetBy = resetDto.resetBy || 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.평가기간의_WBS_할당을_초기화한다(
      periodId,
      resetBy,
    );
  }

  /**
   * 프로젝트의 WBS 할당 초기화
   */
  @ResetProjectWbsAssignments()
  async resetProjectWbsAssignments(
    @Param('projectId') projectId: string,
    @Param('periodId') periodId: string,
    @Body() resetDto: ResetWbsAssignmentsDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<void> {
    const resetBy = resetDto.resetBy || 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.프로젝트의_WBS_할당을_초기화한다(
      projectId,
      periodId,
      resetBy,
    );
  }

  /**
   * 직원의 WBS 할당 초기화
   */
  @ResetEmployeeWbsAssignments()
  async resetEmployeeWbsAssignments(
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
    @Body() resetDto: ResetWbsAssignmentsDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<void> {
    const resetBy = resetDto.resetBy || 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.직원의_WBS_할당을_초기화한다(
      employeeId,
      periodId,
      resetBy,
    );
  }

  /**
   * WBS 할당 순서 변경
   */
  @ChangeWbsAssignmentOrder()
  async changeWbsAssignmentOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: ChangeWbsAssignmentOrderQueryDto,
    @Body() bodyDto: ChangeWbsAssignmentOrderBodyDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any> {
    const updatedBy = bodyDto.updatedBy || 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.WBS_할당_순서를_변경한다(
      id,
      queryDto.direction,
      updatedBy,
    );
  }
}
