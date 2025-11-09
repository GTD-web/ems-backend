import { Controller, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../../../context/dashboard-context/dashboard.service';
import { ParseUUID } from '../../decorators/parse-uuid.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator';
import { EvaluationPeriodService } from '../../../domain/core/evaluation-period/evaluation-period.service';
import { EmployeeSyncService } from '../../../context/organization-management-context/employee-sync.service';
import { GetAllEmployeesEvaluationPeriodStatusQueryDto } from './dto/get-all-employees-evaluation-period-status-query.dto';
import {
  GetEmployeeEvaluationPeriodStatus,
  GetAllEmployeesEvaluationPeriodStatus,
  GetMyEvaluationTargetsStatus,
  GetEmployeeAssignedData,
  GetMyAssignedData,
  GetEvaluatorAssignedEmployeesData,
  GetFinalEvaluationsByPeriod,
  GetFinalEvaluationsByEmployee,
  GetAllEmployeesFinalEvaluations,
  GetEmployeeCompleteStatus,
} from './decorators/dashboard-api.decorators';
import { EmployeeEvaluationPeriodStatusResponseDto } from './dto/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from './dto/my-evaluation-targets-status.dto';
import {
  EmployeeAssignedDataResponseDto,
  EvaluatorAssignedEmployeesDataResponseDto,
} from './dto/employee-assigned-data.dto';
import { DashboardFinalEvaluationsByPeriodResponseDto } from './dto/final-evaluation-list.dto';
import {
  EmployeeFinalEvaluationListResponseDto,
  GetEmployeeFinalEvaluationsQueryDto,
} from './dto/employee-final-evaluation-list.dto';
import {
  AllEmployeesFinalEvaluationsResponseDto,
  GetAllEmployeesFinalEvaluationsQueryDto,
} from './dto/all-employees-final-evaluations.dto';
import { EmployeeCompleteStatusResponseDto } from './dto/employee-complete-status.dto';

/**
 * 관리자용 대시보드 컨트롤러
 *
 * 평가 관련 대시보드 정보 조회 기능을 제공합니다.
 * 직원별 평가기간 현황, 평가 진행 상태 등의 정보를 제공합니다.
 */
@ApiTags('A-0-2. 관리자 - 대시보드')
@ApiBearerAuth('Bearer')
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
    @Query() queryDto: GetAllEmployeesEvaluationPeriodStatusQueryDto,
  ): Promise<EmployeeEvaluationPeriodStatusResponseDto[]> {
    return await this.dashboardService.평가기간의_모든_피평가자_현황을_조회한다(
      evaluationPeriodId,
      queryDto.includeUnregistered,
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
   * 현재 로그인한 사용자의 할당된 정보를 조회합니다.
   * 피평가자는 상위 평가자의 하향평가를 볼 수 없습니다.
   */
  @GetMyAssignedData()
  async getMyAssignedData(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeAssignedDataResponseDto> {
    const data = await this.dashboardService.사용자_할당_정보를_조회한다(
      evaluationPeriodId,
      user.id, // JWT에서 추출한 현재 로그인 사용자의 ID
    );

    // 피평가자는 상위 평가자의 하향평가를 볼 수 없음
    return this.하향평가_정보를_제거한다(data);
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

  /**
   * 하향평가 정보를 제거합니다.
   * 피평가자가 자신의 할당 정보를 조회할 때 사용됩니다.
   */
  private 하향평가_정보를_제거한다(
    data: EmployeeAssignedDataResponseDto,
  ): EmployeeAssignedDataResponseDto {
    // 각 프로젝트의 WBS에서 하향평가 정보 제거
    const projectsWithoutDownwardEvaluation = data.projects.map((project) => ({
      ...project,
      wbsList: project.wbsList.map((wbs) => ({
        ...wbs,
        primaryDownwardEvaluation: null,
        secondaryDownwardEvaluation: null,
      })),
    }));

    // summary에서 하향평가 정보 제거
    const summaryWithoutDownwardEvaluation = {
      ...data.summary,
      primaryDownwardEvaluation: {
        totalScore: null,
        grade: null,
        isSubmitted: false,
      },
      secondaryDownwardEvaluation: {
        totalScore: null,
        grade: null,
        isSubmitted: false,
        evaluators: [],
      },
    };

    return {
      ...data,
      projects: projectsWithoutDownwardEvaluation,
      summary: summaryWithoutDownwardEvaluation,
    };
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
  ): Promise<DashboardFinalEvaluationsByPeriodResponseDto> {
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
   * 전체 직원별 최종평가 목록을 조회합니다.
   * (주의: 이 메서드는 getFinalEvaluationsByEmployee보다 먼저 정의되어야 합니다)
   */
  @GetAllEmployeesFinalEvaluations()
  async getAllEmployeesFinalEvaluations(
    @Query() queryDto: GetAllEmployeesFinalEvaluationsQueryDto,
  ): Promise<AllEmployeesFinalEvaluationsResponseDto> {
    const results =
      await this.dashboardService.전체_직원별_최종평가_목록을_조회한다(
        queryDto.startDate,
        queryDto.endDate,
      );

    // 1. 평가기간 추출 및 중복 제거 (시작일 내림차순)
    const periodMap = new Map<
      string,
      {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date | null;
      }
    >();

    for (const result of results) {
      if (!periodMap.has(result.periodId)) {
        periodMap.set(result.periodId, {
          id: result.periodId,
          name: result.periodName,
          startDate: result.periodStartDate,
          endDate: result.periodEndDate,
        });
      }
    }

    const evaluationPeriods = Array.from(periodMap.values()).sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    );

    // 2. 직원별로 그룹화
    const employeeMap = new Map<
      string,
      {
        employee: {
          id: string;
          name: string;
          employeeNumber: string;
          email: string;
          departmentName: string | null;
          rankName: string | null;
        };
        finalEvaluationsByPeriod: Map<
          string,
          {
            id: string;
            evaluationGrade: string;
            jobGrade: string;
            jobDetailedGrade: string;
            finalComments: string | null;
            isConfirmed: boolean;
            confirmedAt: Date | null;
            confirmedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
          }
        >;
      }
    >();

    for (const result of results) {
      if (!employeeMap.has(result.employeeId)) {
        employeeMap.set(result.employeeId, {
          employee: {
            id: result.employeeId,
            name: result.employeeName,
            employeeNumber: result.employeeNumber,
            email: result.employeeEmail,
            departmentName: result.departmentName,
            rankName: result.rankName,
          },
          finalEvaluationsByPeriod: new Map(),
        });
      }

      employeeMap
        .get(result.employeeId)!
        .finalEvaluationsByPeriod.set(result.periodId, {
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
        });
    }

    // 3. 직원별 최종평가 배열 생성 (평가기간 순서에 맞춰서)
    const employees = Array.from(employeeMap.values())
      .map((data) => ({
        employee: data.employee,
        finalEvaluations: evaluationPeriods.map((period) => {
          const evaluation = data.finalEvaluationsByPeriod.get(period.id);
          return evaluation || null;
        }),
      }))
      .sort((a, b) =>
        a.employee.employeeNumber.localeCompare(b.employee.employeeNumber),
      );

    return {
      evaluationPeriods,
      employees,
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

  /**
   * 직원의 평가 현황 및 할당 데이터를 통합 조회합니다.
   */
  @GetEmployeeCompleteStatus()
  async getEmployeeCompleteStatus(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EmployeeCompleteStatusResponseDto> {
    // 기존 두 메서드를 병렬로 호출
    const [statusData, assignedData] = await Promise.all([
      this.dashboardService.직원의_평가기간_현황을_조회한다(
        evaluationPeriodId,
        employeeId,
      ),
      this.dashboardService.사용자_할당_정보를_조회한다(
        evaluationPeriodId,
        employeeId,
      ),
    ]);

    // 데이터가 없는 경우 처리
    if (!statusData || !assignedData) {
      throw new NotFoundException(
        `직원을 찾을 수 없습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId})`,
      );
    }

    // 데이터 매핑 및 통합
    return {
      evaluationPeriod: assignedData.evaluationPeriod,
      employee: assignedData.employee,
      isEvaluationTarget: statusData.isEvaluationTarget,
      exclusionInfo: statusData.exclusionInfo,
      evaluationLine: {
        status: statusData.evaluationLine.status,
        hasPrimaryEvaluator: statusData.evaluationLine.hasPrimaryEvaluator,
        hasSecondaryEvaluator: statusData.evaluationLine.hasSecondaryEvaluator,
        primaryEvaluator: statusData.downwardEvaluation.primary.evaluator,
        secondaryEvaluators:
          statusData.downwardEvaluation.secondary.evaluators.map(
            (e) => e.evaluator,
          ),
      },
      wbsCriteria: {
        status: statusData.wbsCriteria.status,
        totalWbsCount: statusData.evaluationCriteria.assignedWbsCount,
        wbsWithCriteriaCount: statusData.wbsCriteria.wbsWithCriteriaCount,
      },
      performance: {
        status: statusData.performanceInput.status,
        totalWbsCount: statusData.performanceInput.totalWbsCount,
        completedCount: statusData.performanceInput.inputCompletedCount,
      },
      selfEvaluation: {
        status: statusData.selfEvaluation.status,
        totalCount: statusData.selfEvaluation.totalMappingCount,
        completedCount: statusData.selfEvaluation.completedMappingCount,
        totalScore: statusData.selfEvaluation.totalScore,
        grade: statusData.selfEvaluation.grade,
      },
      primaryDownwardEvaluation: {
        status: statusData.downwardEvaluation.primary.status,
        totalWbsCount: statusData.downwardEvaluation.primary.assignedWbsCount,
        completedCount:
          statusData.downwardEvaluation.primary.completedEvaluationCount,
        isSubmitted: statusData.downwardEvaluation.primary.isSubmitted,
        totalScore: statusData.downwardEvaluation.primary.totalScore,
        grade: statusData.downwardEvaluation.primary.grade,
      },
      secondaryDownwardEvaluation: {
        status:
          statusData.downwardEvaluation.secondary.evaluators[0]?.status ||
          'none',
        totalWbsCount:
          statusData.downwardEvaluation.secondary.evaluators[0]
            ?.assignedWbsCount || 0,
        completedCount:
          statusData.downwardEvaluation.secondary.evaluators[0]
            ?.completedEvaluationCount || 0,
        isSubmitted: statusData.downwardEvaluation.secondary.isSubmitted,
        totalScore: statusData.downwardEvaluation.secondary.totalScore,
        grade: statusData.downwardEvaluation.secondary.grade,
      },
      peerEvaluation: statusData.peerEvaluation,
      finalEvaluation: statusData.finalEvaluation,
      projects: {
        totalCount: assignedData.summary.totalProjects,
        items: assignedData.projects,
      },
    };
  }
}
