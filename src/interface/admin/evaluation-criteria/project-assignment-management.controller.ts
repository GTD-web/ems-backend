import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import {
  CreateProjectAssignmentDto,
  UpdateProjectAssignmentDto,
  BulkCreateProjectAssignmentDto,
  ProjectAssignmentFilterDto,
  ProjectAssignmentResponseDto,
  ProjectAssignmentListResponseDto,
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
  @Post()
  @ApiOperation({
    summary: '프로젝트 할당 생성',
    description: '특정 직원을 특정 평가기간의 프로젝트에 할당합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '프로젝트 할당이 성공적으로 생성되었습니다.',
    type: ProjectAssignmentResponseDto,
  })
  async createProjectAssignment(
    @Body() createDto: CreateProjectAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any> {
    const assignedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.프로젝트를_할당한다(
      { ...createDto, assignedBy },
      assignedBy,
    );
  }

  /**
   * 프로젝트 할당 수정
   */
  @Put(':id')
  @ApiOperation({
    summary: '프로젝트 할당 수정',
    description: '기존 프로젝트 할당의 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로젝트 할당이 성공적으로 수정되었습니다.',
    type: ProjectAssignmentResponseDto,
  })
  async updateProjectAssignment(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationCriteriaManagementService.프로젝트_할당을_수정한다(
      id,
      updateDto as any,
      updatedBy,
    );
  }

  /**
   * 프로젝트 할당 취소
   */
  @Delete(':id')
  @ApiOperation({
    summary: '프로젝트 할당 취소',
    description: '기존 프로젝트 할당을 취소합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로젝트 할당이 성공적으로 취소되었습니다.',
  })
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
  @Get()
  @ApiOperation({
    summary: '프로젝트 할당 목록 조회',
    description: '필터 조건에 맞는 프로젝트 할당 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로젝트 할당 목록이 성공적으로 조회되었습니다.',
    type: ProjectAssignmentListResponseDto,
  })
  async getProjectAssignmentList(
    @Query() filter: ProjectAssignmentFilterDto,
  ): Promise<any> {
    return await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다(
      filter,
    );
  }

  /**
   * 프로젝트 할당 상세 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: '프로젝트 할당 상세 조회',
    description: '특정 프로젝트 할당의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로젝트 할당 상세 정보가 성공적으로 조회되었습니다.',
    type: ProjectAssignmentResponseDto,
  })
  async getProjectAssignmentDetail(@Param('id') id: string): Promise<any> {
    return await this.evaluationCriteriaManagementService.프로젝트_할당_상세를_조회한다(
      id,
    );
  }

  /**
   * 특정 평가기간에 직원에게 할당된 프로젝트 조회
   */
  @Get('employees/:employeeId/periods/:periodId')
  @ApiOperation({
    summary: '직원의 프로젝트 할당 조회',
    description:
      '특정 평가기간에 특정 직원에게 할당된 모든 프로젝트를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '직원의 프로젝트 할당 목록이 성공적으로 조회되었습니다.',
    type: [ProjectAssignmentResponseDto],
  })
  async getEmployeeProjectAssignments(
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
  ): Promise<any[]> {
    return await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(
      employeeId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트에 할당된 직원 조회
   */
  @Get('projects/:projectId/periods/:periodId')
  @ApiOperation({
    summary: '프로젝트에 할당된 직원 조회',
    description:
      '특정 평가기간에 특정 프로젝트에 할당된 모든 직원을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로젝트에 할당된 직원 목록이 성공적으로 조회되었습니다.',
    type: [ProjectAssignmentResponseDto],
  })
  async getProjectAssignedEmployees(
    @Param('projectId') projectId: string,
    @Param('periodId') periodId: string,
  ): Promise<any[]> {
    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에_할당된_직원을_조회한다(
      projectId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트가 할당되지 않은 직원 목록 조회
   */
  @Get('unassigned-employees')
  @ApiOperation({
    summary: '할당되지 않은 직원 목록 조회',
    description:
      '특정 평가기간에 프로젝트가 할당되지 않은 직원 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '할당되지 않은 직원 목록이 성공적으로 조회되었습니다.',
    type: [String],
  })
  async getUnassignedEmployees(
    @Query('periodId') periodId: string,
    @Query('projectId') projectId?: string,
  ): Promise<string[]> {
    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(
      periodId,
      projectId,
    );
  }

  /**
   * 프로젝트 대량 할당
   */
  @Post('bulk')
  @ApiOperation({
    summary: '프로젝트 대량 할당',
    description: '여러 직원에게 여러 프로젝트를 한 번에 할당합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '프로젝트 대량 할당이 성공적으로 완료되었습니다.',
    type: [ProjectAssignmentResponseDto],
  })
  async bulkCreateProjectAssignments(
    @Body() bulkCreateDto: BulkCreateProjectAssignmentDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<any[]> {
    const assignedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const assignmentsWithAssignedBy = bulkCreateDto.assignments.map(
      (assignment) => ({
        ...assignment,
        assignedBy,
      }),
    );

    return await this.evaluationCriteriaManagementService.프로젝트를_대량으로_할당한다(
      assignmentsWithAssignedBy,
      assignedBy,
    );
  }
}
