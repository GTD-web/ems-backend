import { Controller, Query, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../../../context/dashboard-context/dashboard.service';
import { ParseUUID } from '../../decorators/parse-uuid.decorator';
import { EvaluationPeriodService } from '../../../domain/core/evaluation-period/evaluation-period.service';
import { EmployeeSyncService } from '../../../domain/common/employee/employee-sync.service';
import {
  GetEmployeeEvaluationPeriodStatus,
  GetAllEmployeesEvaluationPeriodStatus,
  GetMyEvaluationTargetsStatus,
  GetEmployeeAssignedData,
  GetEvaluatorAssignedEmployeesData,
  GetFinalEvaluationsByPeriod,
  GetFinalEvaluationsByEmployee,
} from './decorators/dashboard-api.decorators';
import { EmployeeEvaluationPeriodStatusResponseDto } from './dto/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from './dto/my-evaluation-targets-status.dto';
import {
  EmployeeAssignedDataResponseDto,
  EvaluatorAssignedEmployeesDataResponseDto,
} from './dto/employee-assigned-data.dto';
import { FinalEvaluationListResponseDto } from './dto/final-evaluation-list.dto';
import {
  EmployeeFinalEvaluationListResponseDto,
  GetEmployeeFinalEvaluationsQueryDto,
} from './dto/employee-final-evaluation-list.dto';

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
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly employeeSyncService: EmployeeSyncService,
  ) {}

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

  @GetEvaluatorAssignedEmployeesData()
  async getEvaluatorAssignedEmployeesData(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('evaluatorId') evaluatorId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EvaluatorAssignedEmployeesDataResponseDto> {
    return await this.dashboardService.담당자의_피평가자_할당_정보를_조회한다(
      evaluationPeriodId,
      evaluatorId,
      employeeId,
    );
  }

  /**
   * 평가기간별 최종평가 목록을 조회합니다.
   */
  @GetFinalEvaluationsByPeriod()
  async getFinalEvaluationsByPeriod(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<FinalEvaluationListResponseDto> {
    // 평가기간 존재 여부 확인
    const period =
      await this.evaluationPeriodService.ID로_조회한다(evaluationPeriodId);
    if (!period) {
      throw new NotFoundException(
        `평가기간을 찾을 수 없습니다. (ID: ${evaluationPeriodId})`,
      );
    }

    const results =
      await this.dashboardService.평가기간별_최종평가_목록을_조회한다(
        evaluationPeriodId,
      );

    // 결과가 없는 경우 (평가기간은 존재하지만 최종평가가 없음)
    if (results.length === 0) {
      return {
        period: {
          id: period.id,
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate ?? null,
        },
        evaluations: [],
      };
    }

    // 평가기간 정보는 첫 번째 결과에서 추출 (모두 동일)
    const firstResult = results[0];
    const periodInfo = {
      id: firstResult.periodId,
      name: firstResult.periodName,
      startDate: firstResult.periodStartDate,
      endDate: firstResult.periodEndDate,
    };

    // 각 직원별 최종평가 매핑
    const evaluations = results.map((result) => ({
      employee: {
        id: result.employeeId,
        name: result.employeeName,
        employeeNumber: result.employeeNumber,
        email: result.employeeEmail,
        departmentName: result.departmentName,
        rankName: result.rankName,
      },
      evaluation: {
        id: result.id,
        evaluationGrade: result.evaluationGrade,
        jobGrade: result.jobGrade,
        jobDetailedGrade: result.jobDetailedGrade,
        finalComments: result.finalComments,
        isConfirmed: result.isConfirmed,
        confirmedAt: result.confirmedAt,
        confirmedBy: result.confirmedBy,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    }));

    return {
      period: periodInfo,
      evaluations,
    };
  }

  /**
   * 직원별 최종평가 목록을 조회합니다.
   */
  @GetFinalEvaluationsByEmployee()
  async getFinalEvaluationsByEmployee(
    @ParseUUID('employeeId') employeeId: string,
    @Query() queryDto: GetEmployeeFinalEvaluationsQueryDto,
  ): Promise<EmployeeFinalEvaluationListResponseDto> {
    // 직원 존재 여부 확인
    const employee = await this.employeeSyncService.getEmployeeById(employeeId);
    if (!employee) {
      throw new NotFoundException(
        `직원을 찾을 수 없습니다. (ID: ${employeeId})`,
      );
    }

    const results = await this.dashboardService.직원별_최종평가_목록을_조회한다(
      employeeId,
      queryDto.startDate,
      queryDto.endDate,
    );

    // 첫 번째 결과에서 직원 정보 추출
    if (results.length === 0) {
      // 직원은 존재하지만 최종평가가 없는 경우
      return {
        employee: {
          id: employee.id,
          name: employee.name,
          employeeNumber: employee.employeeNumber,
          email: employee.email,
          departmentName: employee.departmentName ?? null,
          rankName: employee.rankName ?? null,
        },
        finalEvaluations: [],
      };
    }

    const firstResult = results[0];
    const employeeInfo = {
      id: firstResult.employeeId,
      name: firstResult.employeeName,
      employeeNumber: firstResult.employeeNumber,
      email: firstResult.employeeEmail,
      departmentName: firstResult.departmentName,
      rankName: firstResult.rankName,
    };

    const finalEvaluations = results.map((result) => ({
      id: result.id,
      period: {
        id: result.periodId,
        name: result.periodName,
        startDate: result.periodStartDate,
        endDate: result.periodEndDate,
      },
      evaluationGrade: result.evaluationGrade,
      jobGrade: result.jobGrade,
      jobDetailedGrade: result.jobDetailedGrade,
      finalComments: result.finalComments,
      isConfirmed: result.isConfirmed,
      confirmedAt: result.confirmedAt,
      confirmedBy: result.confirmedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));

    return {
      employee: employeeInfo,
      finalEvaluations,
    };
  }
}
