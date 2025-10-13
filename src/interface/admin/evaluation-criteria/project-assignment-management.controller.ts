import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { ParseId } from '../../decorators/parse-uuid.decorator';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import {
  BulkCreateProjectAssignments,
  CancelProjectAssignment,
  ChangeProjectAssignmentOrder,
  CreateProjectAssignment,
  GetEmployeeProjectAssignments,
  GetProjectAssignedEmployees,
  GetProjectAssignmentDetail,
  GetProjectAssignmentList,
  GetUnassignedEmployees,
} from './decorators/project-assignment-api.decorators';
import {
  BulkCreateProjectAssignmentDto,
  ChangeProjectAssignmentOrderDto,
  CreateProjectAssignmentDto,
  EmployeeProjectsResponseDto,
  ProjectAssignmentFilterDto,
  ProjectAssignmentResponseDto,
  ProjectEmployeesResponseDto,
  UnassignedEmployeesResponseDto,
} from './dto/project-assignment.dto';

/**
 * 프로젝트 할당 관리 컨트롤러
 *
 * 평가기간에 직원을 프로젝트에 할당하는 기능을 제공합니다.
 */
@ApiTags('B-1. 관리자 - 평가 설정 - 프로젝트 할당')
@Controller('admin/evaluation-criteria/project-assignments')
export class ProjectAssignmentManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  /**
   * 프로젝트 할당 생성
   */
  @CreateProjectAssignment()
  async createProjectAssignment(
    @Body() createDto: CreateProjectAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any> {
    const assignedBy = createDto.assignedBy || uuidv4(); // DTO에서 받은 UUID 또는 임시 UUID 사용
    return await this.evaluationCriteriaManagementService.프로젝트를_할당한다(
      {
        employeeId: createDto.employeeId,
        projectId: createDto.projectId,
        periodId: createDto.periodId,
        assignedBy: assignedBy,
      },
      assignedBy,
    );
  }

  /**
   * 프로젝트 할당 취소
   */
  @CancelProjectAssignment()
  async cancelProjectAssignment(
    @Param('id') id: string,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<void> {
    const cancelledBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.프로젝트_할당을_취소한다(
      id,
      cancelledBy,
    );
  }

  /**
   * 프로젝트 할당 목록 조회
   */
  @GetProjectAssignmentList()
  async getProjectAssignmentList(
    @Query() filter: ProjectAssignmentFilterDto,
  ): Promise<any> {
    return await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다(
      {
        periodId: filter.periodId,
        employeeId: filter.employeeId,
        projectId: filter.projectId,
        page: filter.page,
        limit: filter.limit,
        orderBy: filter.orderBy,
        orderDirection: filter.orderDirection,
      },
    );
  }

  /**
   * 특정 평가기간에 직원에게 할당된 프로젝트 조회
   * 주의: 구체적인 경로를 :id 경로보다 먼저 정의해야 함
   */
  @GetEmployeeProjectAssignments()
  async getEmployeeProjectAssignments(
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
  ): Promise<EmployeeProjectsResponseDto> {
    return await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(
      employeeId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트에 할당된 직원 조회
   * 주의: 구체적인 경로를 :id 경로보다 먼저 정의해야 함
   */
  @GetProjectAssignedEmployees()
  async getProjectAssignedEmployees(
    @Param('projectId') projectId: string,
    @Param('periodId') periodId: string,
  ): Promise<ProjectEmployeesResponseDto> {
    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에_할당된_직원을_조회한다(
      projectId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트가 할당되지 않은 직원 목록 조회
   * 주의: 구체적인 경로를 :id 경로보다 먼저 정의해야 함
   */
  @GetUnassignedEmployees()
  async getUnassignedEmployees(
    @Query('periodId') periodId: string,
    @Query('projectId') projectId?: string,
  ): Promise<UnassignedEmployeesResponseDto> {
    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(
      periodId,
      projectId,
    );
  }

  /**
   * 프로젝트 할당 상세 조회
   * 주의: 파라미터 경로(:id)는 구체적인 경로들 뒤에 배치해야 함
   */
  @GetProjectAssignmentDetail()
  async getProjectAssignmentDetail(@Param('id') id: string): Promise<any> {
    return await this.evaluationCriteriaManagementService.프로젝트_할당_상세를_조회한다(
      id,
    );
  }

  /**
   * 프로젝트 대량 할당
   */
  @BulkCreateProjectAssignments()
  async bulkCreateProjectAssignments(
    @Body() bulkCreateDto: BulkCreateProjectAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any[]> {
    // 각 할당에서 assignedBy를 추출 (첫 번째 할당의 assignedBy 사용, 없으면 임시 UUID 생성)
    const assignedBy = bulkCreateDto.assignments[0]?.assignedBy || uuidv4();

    return await this.evaluationCriteriaManagementService.프로젝트를_대량으로_할당한다(
      bulkCreateDto.assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        periodId: assignment.periodId,
        assignedBy,
      })),
      assignedBy,
    );
  }

  /**
   * 프로젝트 할당 순서 변경
   */
  @ChangeProjectAssignmentOrder()
  async changeProjectAssignmentOrder(
    @ParseId() id: string,
    @Body() changeOrderDto: ChangeProjectAssignmentOrderDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<ProjectAssignmentResponseDto> {
    const updatedBy = changeOrderDto.updatedBy || 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.프로젝트_할당_순서를_변경한다(
      id,
      changeOrderDto.direction,
      updatedBy,
    );
  }
}
