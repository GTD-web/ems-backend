import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../../../context/dashboard-context/dashboard.service';
import { ParseUUID } from '../../decorators/parse-uuid.decorator';
import {
  GetEmployeeEvaluationPeriodStatus,
  GetAllEmployeesEvaluationPeriodStatus,
  GetMyEvaluationTargetsStatus,
  GetEmployeeAssignedData,
} from './decorators/dashboard-api.decorators';
import { EmployeeEvaluationPeriodStatusResponseDto } from './dto/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from './dto/my-evaluation-targets-status.dto';
import { EmployeeAssignedDataResponseDto } from './dto/employee-assigned-data.dto';

/**
 * 관리자용 대시보드 컨트롤러
 *
 * 평가 관련 대시보드 정보 조회 기능을 제공합니다.
 * 직원별 평가기간 현황, 평가 진행 상태 등의 정보를 제공합니다.
 */
@ApiTags('A-0. 관리자 - 대시보드')
@Controller('admin/dashboard')
// @UseGuards(AdminGuard) // TODO: 관리자 권한 가드 추가
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ==================== GET: 조회 ====================

  /**
   * 평가기간의 모든 직원 현황을 조회합니다.
   */
  @GetAllEmployeesEvaluationPeriodStatus()
  async getAllEmployeesEvaluationPeriodStatus(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<EmployeeEvaluationPeriodStatusResponseDto[]> {
    return await this.dashboardService.평가기간의_모든_피평가자_현황을_조회한다(
      evaluationPeriodId,
    );
  }

  /**
   * 내가 담당하는 평가 대상자 현황을 조회합니다.
   */
  @GetMyEvaluationTargetsStatus()
  async getMyEvaluationTargetsStatus(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('evaluatorId') evaluatorId: string,
  ): Promise<MyEvaluationTargetStatusResponseDto[]> {
    return await this.dashboardService.내가_담당하는_평가대상자_현황을_조회한다(
      evaluationPeriodId,
      evaluatorId,
    );
  }

  /**
   * 직원의 평가기간 현황을 조회합니다.
   */
  @GetEmployeeEvaluationPeriodStatus()
  async getEmployeeEvaluationPeriodStatus(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EmployeeEvaluationPeriodStatusResponseDto | null> {
    return await this.dashboardService.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );
  }

  /**
   * 사용자의 할당된 프로젝트, WBS, 평가기준, 성과, 자기평가 정보를 조회합니다.
   */
  @GetEmployeeAssignedData()
  async getEmployeeAssignedData(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EmployeeAssignedDataResponseDto> {
    return await this.dashboardService.사용자_할당_정보를_조회한다(
      evaluationPeriodId,
      employeeId,
    );
  }
}
