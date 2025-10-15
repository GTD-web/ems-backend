import { Injectable, Logger } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import {
  EmployeeEvaluationPeriodStatusDto,
  EvaluationCriteriaStatus,
  WbsCriteriaStatus,
  EvaluationLineStatus,
  SelfEvaluationStatus,
  DownwardEvaluationStatus,
  PeerEvaluationStatus,
  FinalEvaluationStatus,
} from '../../interfaces/dashboard-context.interface';

/**
 * 직원의 평가기간 현황 조회 쿼리
 *
 * 평가기간 ID와 직원 ID로 해당 직원의 평가기간 참여 현황을 조회합니다.
 * - EvaluationPeriodEmployeeMapping 존재 여부 확인
 * - EvaluationPeriod 정보 포함
 * - Employee 정보 포함
 */
export class GetEmployeeEvaluationPeriodStatusQuery implements IQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
  ) {}
}

/**
 * 직원의 평가기간 현황 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEmployeeEvaluationPeriodStatusQuery)
export class GetEmployeeEvaluationPeriodStatusHandler
  implements IQueryHandler<GetEmployeeEvaluationPeriodStatusQuery>
{
  private readonly logger = new Logger(
    GetEmployeeEvaluationPeriodStatusHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationPeriod)
    private readonly periodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
  ) {}

  async execute(
    query: GetEmployeeEvaluationPeriodStatusQuery,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null> {
    const { evaluationPeriodId, employeeId } = query;

    this.logger.debug(
      `직원의 평가기간 현황 조회 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      // 1. 맵핑 정보 조회 (LEFT JOIN으로 평가기간과 직원 정보 함께 조회)
      const result = await this.mappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(
          EvaluationPeriod,
          'period',
          'period.id = mapping.evaluationPeriodId AND period.deletedAt IS NULL',
        )
        .leftJoin(
          Employee,
          'employee',
          'employee.id = mapping.employeeId AND employee.deletedAt IS NULL',
        )
        .select([
          // 맵핑 정보
          'mapping.id AS mapping_id',
          'mapping.evaluationPeriodId AS mapping_evaluationperiodid',
          'mapping.employeeId AS mapping_employeeid',
          'mapping.isExcluded AS mapping_isexcluded',
          'mapping.excludeReason AS mapping_excludereason',
          'mapping.excludedAt AS mapping_excludedat',
          'mapping.deletedAt AS mapping_deletedat',
          'mapping.isSelfEvaluationEditable AS mapping_isselfevaluationeditable',
          'mapping.isPrimaryEvaluationEditable AS mapping_isprimaryevaluationeditable',
          'mapping.isSecondaryEvaluationEditable AS mapping_issecondaryevaluationeditable',
          // 평가기간 정보
          'period.name AS period_name',
          'period.status AS period_status',
          'period.currentPhase AS period_currentphase',
          'period.startDate AS period_startdate',
          'period.endDate AS period_enddate',
          // 직원 정보
          'employee.name AS employee_name',
          'employee.employeeNumber AS employee_employeenumber',
          'employee.email AS employee_email',
          'employee.departmentName AS employee_departmentname',
          'employee.rankName AS employee_rankname',
        ])
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.deletedAt IS NULL')
        .getRawOne();

      if (!result) {
        this.logger.debug(
          `맵핑 정보를 찾을 수 없습니다 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        );
        return null;
      }

      // 2. 프로젝트 할당 수 조회
      const projectCount = await this.projectAssignmentRepository.count({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: IsNull(),
        },
      });

      // 3. WBS 할당 수 조회
      const wbsCount = await this.wbsAssignmentRepository.count({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: IsNull(),
        },
      });

      // 4. 평가항목 상태 계산
      const evaluationCriteriaStatus: EvaluationCriteriaStatus =
        this.평가항목_상태를_계산한다(projectCount, wbsCount);

      // 5. 할당된 WBS 목록 조회
      const assignedWbsList = await this.wbsAssignmentRepository.find({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: IsNull(),
        },
        select: ['wbsItemId'],
      });

      // 6. 평가기준이 있는 WBS 수 조회
      let wbsWithCriteriaCount = 0;
      if (assignedWbsList.length > 0) {
        const wbsItemIds = assignedWbsList.map((wbs) => wbs.wbsItemId);
        wbsWithCriteriaCount = await this.wbsCriteriaRepository
          .createQueryBuilder('criteria')
          .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
          .andWhere('criteria.deletedAt IS NULL')
          .getCount();
      }

      // 7. WBS 평가기준 상태 계산
      const wbsCriteriaStatus: WbsCriteriaStatus =
        this.WBS평가기준_상태를_계산한다(wbsCount, wbsWithCriteriaCount);

      // 8. 평가라인 지정 상태 확인
      const { hasPrimaryEvaluator, hasSecondaryEvaluator } =
        await this.평가라인_지정_여부를_확인한다(employeeId);

      // 9. 평가라인 상태 계산
      const evaluationLineStatus: EvaluationLineStatus =
        this.평가라인_상태를_계산한다(
          hasPrimaryEvaluator,
          hasSecondaryEvaluator,
        );

      // 10. 자기평가 진행 상태 조회
      const { totalMappingCount, completedMappingCount, averageScore } =
        await this.자기평가_진행_상태를_조회한다(
          evaluationPeriodId,
          employeeId,
        );

      // 11. 자기평가 상태 계산
      const selfEvaluationStatus: SelfEvaluationStatus =
        this.자기평가_상태를_계산한다(totalMappingCount, completedMappingCount);

      // 12. 하향평가 상태 조회
      const { primary, secondary } = await this.하향평가_상태를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

      // 13. 동료평가 상태 조회
      const { totalRequestCount, completedRequestCount } =
        await this.동료평가_상태를_조회한다(evaluationPeriodId, employeeId);

      // 14. 동료평가 상태 계산
      const peerEvaluationStatus: PeerEvaluationStatus =
        this.동료평가_상태를_계산한다(totalRequestCount, completedRequestCount);

      // 15. 최종평가 조회
      const finalEvaluation = await this.최종평가를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

      // 16. 최종평가 상태 계산
      const finalEvaluationStatus: FinalEvaluationStatus =
        this.최종평가_상태를_계산한다(finalEvaluation);

      // 17. DTO로 변환
      // 평가 대상 여부 계산
      const isEvaluationTarget =
        !result.mapping_isexcluded && !result.mapping_deletedat;

      // 수정 가능 여부 계산
      const isSelfEvaluationEditable =
        result.mapping_isselfevaluationeditable && isEvaluationTarget;
      const isPrimaryEvaluationEditable =
        result.mapping_isprimaryevaluationeditable && isEvaluationTarget;
      const isSecondaryEvaluationEditable =
        result.mapping_issecondaryevaluationeditable && isEvaluationTarget;

      const dto: EmployeeEvaluationPeriodStatusDto = {
        // 맵핑 기본 정보
        mappingId: result.mapping_id,
        evaluationPeriodId: result.mapping_evaluationperiodid,
        employeeId: result.mapping_employeeid,
        // 평가 대상 여부 (최상위)
        isEvaluationTarget,

        // 평가기간 정보 (오브젝트)
        evaluationPeriod: result.period_name
          ? {
              id: result.mapping_evaluationperiodid,
              name: result.period_name,
              status: result.period_status,
              currentPhase: result.period_currentphase,
              startDate: result.period_startdate,
              endDate: result.period_enddate,
            }
          : null,

        // 직원 정보 (오브젝트)
        employee: result.employee_name
          ? {
              id: result.mapping_employeeid,
              name: result.employee_name,
              employeeNumber: result.employee_employeenumber,
              email: result.employee_email,
              departmentName: result.employee_departmentname,
              rankName: result.employee_rankname,
            }
          : null,

        // 평가 대상 제외 정보 (오브젝트)
        exclusionInfo: {
          isExcluded: result.mapping_isexcluded,
          excludeReason: result.mapping_excludereason,
          excludedAt: result.mapping_excludedat,
        },

        // 평가항목 설정 정보
        evaluationCriteria: {
          status: evaluationCriteriaStatus,
          assignedProjectCount: projectCount,
          assignedWbsCount: wbsCount,
        },

        // WBS 평가기준 설정 정보
        wbsCriteria: {
          status: wbsCriteriaStatus,
          wbsWithCriteriaCount,
        },

        // 평가라인 지정 정보
        evaluationLine: {
          status: evaluationLineStatus,
          hasPrimaryEvaluator,
          hasSecondaryEvaluator,
        },

        // 자기평가 진행 정보
        selfEvaluation: {
          status: selfEvaluationStatus,
          totalMappingCount,
          completedMappingCount,
          isEditable: isSelfEvaluationEditable,
          averageScore,
        },

        // 하향평가 진행 정보
        downwardEvaluation: {
          primary: {
            ...primary,
            isEditable: isPrimaryEvaluationEditable,
          },
          secondary: {
            evaluators: secondary.evaluators,
            isEditable: isSecondaryEvaluationEditable,
            averageScore: secondary.averageScore,
          },
        },

        // 동료평가 진행 정보
        peerEvaluation: {
          status: peerEvaluationStatus,
          totalRequestCount,
          completedRequestCount,
        },

        // 최종평가 정보
        finalEvaluation: {
          status: finalEvaluationStatus,
          evaluationGrade: finalEvaluation?.evaluationGrade ?? null,
          jobGrade: finalEvaluation?.jobGrade ?? null,
          jobDetailedGrade: finalEvaluation?.jobDetailedGrade ?? null,
          isConfirmed: finalEvaluation?.isConfirmed ?? false,
          confirmedAt: finalEvaluation?.confirmedAt ?? null,
        },
      };

      const secondaryLog =
        secondary.evaluators.length > 0
          ? secondary.evaluators
              .map(
                (s) =>
                  `평가자${s.evaluatorId}: ${s.completedEvaluationCount}/${s.assignedWbsCount} (${s.status})`,
              )
              .join(', ')
          : '없음';

      const finalEvaluationLog = finalEvaluation
        ? `${finalEvaluation.evaluationGrade}/${finalEvaluation.jobGrade}${finalEvaluation.jobDetailedGrade} (확정: ${finalEvaluation.isConfirmed})`
        : '없음';

      this.logger.debug(
        `직원의 평가기간 현황 조회 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, ` +
          `프로젝트: ${projectCount}, WBS: ${wbsCount}, 평가항목상태: ${evaluationCriteriaStatus}, ` +
          `평가기준있는WBS: ${wbsWithCriteriaCount}/${wbsCount}, 평가기준상태: ${wbsCriteriaStatus}, ` +
          `PRIMARY평가자: ${hasPrimaryEvaluator}, SECONDARY평가자: ${hasSecondaryEvaluator}, 평가라인상태: ${evaluationLineStatus}, ` +
          `자기평가: ${completedMappingCount}/${totalMappingCount} (${selfEvaluationStatus}, 평균점수: ${averageScore?.toFixed(2) ?? 'N/A'}, 수정가능: ${isSelfEvaluationEditable}), ` +
          `1차하향평가(${primary.evaluatorId}): ${primary.completedEvaluationCount}/${primary.assignedWbsCount} (${primary.status}, 평균점수: ${primary.averageScore?.toFixed(2) ?? 'N/A'}, 수정가능: ${isPrimaryEvaluationEditable}), ` +
          `2차하향평가: [${secondaryLog}] (평균점수: ${secondary.averageScore?.toFixed(2) ?? 'N/A'}, 수정가능: ${isSecondaryEvaluationEditable}), ` +
          `동료평가: ${completedRequestCount}/${totalRequestCount} (${peerEvaluationStatus}), ` +
          `최종평가: ${finalEvaluationLog} (${finalEvaluationStatus})`,
      );

      return dto;
    } catch (error) {
      this.logger.error(
        `직원의 평가기간 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가항목 상태를 계산한다
   * - 프로젝트와 WBS 모두 있으면: complete (존재)
   * - 프로젝트나 WBS 중 하나만 있으면: in_progress (설정중)
   * - 둘 다 없으면: none (미존재)
   */
  private 평가항목_상태를_계산한다(
    projectCount: number,
    wbsCount: number,
  ): EvaluationCriteriaStatus {
    const hasProject = projectCount > 0;
    const hasWbs = wbsCount > 0;

    if (hasProject && hasWbs) {
      return 'complete';
    } else if (hasProject || hasWbs) {
      return 'in_progress';
    } else {
      return 'none';
    }
  }

  /**
   * WBS 평가기준 상태를 계산한다
   * - 모든 WBS에 평가기준이 있으면: complete (완료)
   * - 일부 WBS에만 평가기준이 있으면: in_progress (설정중)
   * - 평가기준이 없으면: none (미존재)
   */
  private WBS평가기준_상태를_계산한다(
    totalWbsCount: number,
    wbsWithCriteriaCount: number,
  ): WbsCriteriaStatus {
    if (totalWbsCount === 0) {
      return 'none';
    }

    if (wbsWithCriteriaCount === 0) {
      return 'none';
    } else if (wbsWithCriteriaCount === totalWbsCount) {
      return 'complete';
    } else {
      return 'in_progress';
    }
  }

  /**
   * 평가라인 지정 여부를 확인한다
   * PRIMARY와 SECONDARY 평가라인에 평가자가 지정되었는지 확인
   */
  private async 평가라인_지정_여부를_확인한다(
    employeeId: string,
  ): Promise<{ hasPrimaryEvaluator: boolean; hasSecondaryEvaluator: boolean }> {
    // PRIMARY 평가라인 조회
    const primaryLine = await this.evaluationLineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.PRIMARY,
        deletedAt: IsNull(),
      },
    });

    // SECONDARY 평가라인 조회
    const secondaryLine = await this.evaluationLineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.SECONDARY,
        deletedAt: IsNull(),
      },
    });

    let hasPrimaryEvaluator = false;
    let hasSecondaryEvaluator = false;

    // PRIMARY 평가라인에 평가자가 지정되었는지 확인
    if (primaryLine) {
      const primaryMapping = await this.evaluationLineMappingRepository.findOne(
        {
          where: {
            employeeId: employeeId,
            evaluationLineId: primaryLine.id,
            deletedAt: IsNull(),
          },
        },
      );
      hasPrimaryEvaluator = !!primaryMapping;
    }

    // SECONDARY 평가라인에 평가자가 지정되었는지 확인
    if (secondaryLine) {
      const secondaryMapping =
        await this.evaluationLineMappingRepository.findOne({
          where: {
            employeeId: employeeId,
            evaluationLineId: secondaryLine.id,
            deletedAt: IsNull(),
          },
        });
      hasSecondaryEvaluator = !!secondaryMapping;
    }

    return { hasPrimaryEvaluator, hasSecondaryEvaluator };
  }

  /**
   * 평가라인 상태를 계산한다
   * - PRIMARY와 SECONDARY 모두 평가자가 지정됨: complete (존재)
   * - 하나만 평가자가 지정됨: in_progress (설정중)
   * - 둘 다 평가자가 미지정: none (미존재)
   */
  private 평가라인_상태를_계산한다(
    hasPrimaryEvaluator: boolean,
    hasSecondaryEvaluator: boolean,
  ): EvaluationLineStatus {
    if (hasPrimaryEvaluator && hasSecondaryEvaluator) {
      return 'complete';
    } else if (hasPrimaryEvaluator || hasSecondaryEvaluator) {
      return 'in_progress';
    } else {
      return 'none';
    }
  }

  /**
   * 자기평가 진행 상태를 조회한다
   * 평가기간과 직원에 해당하는 WBS 자기평가의 전체 수와 완료된 수, 평균 점수를 조회
   */
  private async 자기평가_진행_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{
    totalMappingCount: number;
    completedMappingCount: number;
    averageScore: number | null;
  }> {
    // 전체 WBS 자기평가 수 조회
    const totalMappingCount = await this.wbsSelfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    // 완료된 WBS 자기평가 수 조회
    const completedMappingCount = await this.wbsSelfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        isCompleted: true,
        deletedAt: IsNull(),
      },
    });

    // 평균 자기평가 점수 계산
    let averageScore: number | null = null;
    if (completedMappingCount > 0) {
      const result = await this.wbsSelfEvaluationRepository
        .createQueryBuilder('selfEval')
        .select('AVG(selfEval.selfEvaluationScore)', 'avgScore')
        .where('selfEval.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('selfEval.employeeId = :employeeId', { employeeId })
        .andWhere('selfEval.isCompleted = :isCompleted', { isCompleted: true })
        .andWhere('selfEval.deletedAt IS NULL')
        .getRawOne();

      averageScore = result?.avgScore ? parseFloat(result.avgScore) : null;
    }

    return { totalMappingCount, completedMappingCount, averageScore };
  }

  /**
   * 자기평가 상태를 계산한다
   * - 모든 WBS 자기평가가 완료됨: complete (완료)
   * - 매핑이 있지만 일부만 완료되거나 모두 미완료: in_progress (입력중)
   * - 매핑이 없음: none (미존재)
   */
  private 자기평가_상태를_계산한다(
    totalMappingCount: number,
    completedMappingCount: number,
  ): SelfEvaluationStatus {
    if (totalMappingCount === 0) {
      return 'none';
    }

    if (completedMappingCount === totalMappingCount) {
      return 'complete';
    } else {
      return 'in_progress';
    }
  }

  /**
   * 하향평가 상태를 조회한다
   * 평가라인에 지정된 1차, 2차 평가자의 하향평가 상태를 조회
   */
  private async 하향평가_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{
    primary: {
      evaluatorId: string | null;
      status: DownwardEvaluationStatus;
      assignedWbsCount: number;
      completedEvaluationCount: number;
      averageScore: number | null;
    };
    secondary: {
      evaluators: Array<{
        evaluatorId: string;
        status: DownwardEvaluationStatus;
        assignedWbsCount: number;
        completedEvaluationCount: number;
      }>;
      averageScore: number | null;
    };
  }> {
    // 1. PRIMARY 평가라인 조회
    const primaryLine = await this.evaluationLineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.PRIMARY,
        deletedAt: IsNull(),
      },
    });

    // 2. PRIMARY 평가자 조회
    let primaryEvaluatorId: string | null = null;
    if (primaryLine) {
      const primaryMapping = await this.evaluationLineMappingRepository.findOne(
        {
          where: {
            employeeId: employeeId,
            evaluationLineId: primaryLine.id,
            deletedAt: IsNull(),
          },
        },
      );
      if (primaryMapping) {
        primaryEvaluatorId = primaryMapping.evaluatorId;
      }
    }

    // 3. PRIMARY 평가자의 하향평가 상태 조회
    const primaryStatus = await this.평가자별_하향평가_상태를_조회한다(
      evaluationPeriodId,
      employeeId,
      DownwardEvaluationType.PRIMARY,
      primaryEvaluatorId,
    );

    // 4. SECONDARY 평가라인 조회
    const secondaryLine = await this.evaluationLineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.SECONDARY,
        deletedAt: IsNull(),
      },
    });

    // 5. SECONDARY 평가자들 조회 (여러 명 가능)
    const secondaryEvaluators: string[] = [];
    if (secondaryLine) {
      const secondaryMappings = await this.evaluationLineMappingRepository.find(
        {
          where: {
            employeeId: employeeId,
            evaluationLineId: secondaryLine.id,
            deletedAt: IsNull(),
          },
        },
      );
      secondaryEvaluators.push(
        ...secondaryMappings.map((m) => m.evaluatorId).filter((id) => !!id),
      );
    }

    // 6. 각 SECONDARY 평가자별 하향평가 상태 조회
    const secondaryStatuses = await Promise.all(
      secondaryEvaluators.map(async (evaluatorId) => {
        const status = await this.특정_평가자의_하향평가_상태를_조회한다(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          DownwardEvaluationType.SECONDARY,
        );
        return {
          evaluatorId,
          status: status.status,
          assignedWbsCount: status.assignedWbsCount,
          completedEvaluationCount: status.completedEvaluationCount,
        };
      }),
    );

    // 7. 모든 2차평가의 전체 평균 점수 계산
    let secondaryAverageScore: number | null = null;
    if (secondaryEvaluators.length > 0) {
      // 모든 2차평가자의 완료된 하향평가 조회
      const allSecondaryEvaluations =
        await this.downwardEvaluationRepository.find({
          where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            evaluationType: DownwardEvaluationType.SECONDARY,
            deletedAt: IsNull(),
          },
        });

      // 완료된 평가 중 점수가 있는 것만 필터링
      const completedWithScore = allSecondaryEvaluations.filter(
        (evaluation) =>
          evaluation.완료되었는가() &&
          evaluation.downwardEvaluationScore !== null &&
          evaluation.downwardEvaluationScore !== undefined,
      );

      if (completedWithScore.length > 0) {
        const totalScore = completedWithScore.reduce(
          (sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0),
          0,
        );
        secondaryAverageScore = totalScore / completedWithScore.length;
      }
    }

    return {
      primary: {
        evaluatorId: primaryEvaluatorId,
        ...primaryStatus,
      },
      secondary: {
        evaluators: secondaryStatuses,
        averageScore: secondaryAverageScore,
      },
    };
  }

  /**
   * 특정 평가자 유형의 하향평가 상태를 조회한다 (평가자 ID 불특정)
   */
  private async 평가자별_하향평가_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluationType: DownwardEvaluationType,
    evaluatorId: string | null,
  ): Promise<{
    status: DownwardEvaluationStatus;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    averageScore: number | null;
  }> {
    // 1. 피평가자에게 할당된 WBS 수 조회 (평가해야 할 WBS 개수)
    const assignedWbsCount = await this.wbsAssignmentRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    // 2. 해당 평가기간, 피평가자, 평가 유형에 해당하는 하향평가들 조회
    const whereCondition: any = {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluationType: evaluationType,
      deletedAt: IsNull(),
    };

    // 평가자 ID가 있으면 조건 추가
    if (evaluatorId) {
      whereCondition.evaluatorId = evaluatorId;
    }

    const downwardEvaluations = await this.downwardEvaluationRepository.find({
      where: whereCondition,
    });

    // 3. 완료된 하향평가 개수 확인
    const completedEvaluationCount = downwardEvaluations.filter((evaluation) =>
      evaluation.완료되었는가(),
    ).length;

    // 4. 평균 하향평가 점수 계산
    let averageScore: number | null = null;
    const completedEvaluations = downwardEvaluations.filter(
      (evaluation) =>
        evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined,
    );

    if (completedEvaluations.length > 0) {
      const totalScore = completedEvaluations.reduce(
        (sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0),
        0,
      );
      averageScore = totalScore / completedEvaluations.length;
    }

    // 5. 상태 결정
    let status: DownwardEvaluationStatus;

    // 할당된 WBS가 없으면 평가할 대상이 없음
    if (assignedWbsCount === 0) {
      status = 'none';
    }
    // 하향평가가 하나도 없으면 미존재
    else if (downwardEvaluations.length === 0) {
      status = 'none';
    }
    // 할당된 WBS 수만큼 하향평가가 완료되었으면 완료
    else if (completedEvaluationCount >= assignedWbsCount) {
      status = 'complete';
    }
    // 일부만 완료되었거나, 완료된 것은 없지만 하향평가가 존재하면 입력중
    else if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
      status = 'in_progress';
    } else {
      status = 'none';
    }

    return {
      status,
      assignedWbsCount,
      completedEvaluationCount,
      averageScore,
    };
  }

  /**
   * 특정 평가자의 하향평가 상태를 조회한다
   */
  private async 특정_평가자의_하향평가_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    evaluationType: DownwardEvaluationType,
  ): Promise<{
    status: DownwardEvaluationStatus;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    averageScore: number | null;
  }> {
    // 1. 피평가자에게 할당된 WBS 수 조회 (평가해야 할 WBS 개수)
    const assignedWbsCount = await this.wbsAssignmentRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    // 2. 특정 평가자의 하향평가들 조회
    const downwardEvaluations = await this.downwardEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationType: evaluationType,
        deletedAt: IsNull(),
      },
    });

    // 3. 완료된 하향평가 개수 확인
    const completedEvaluationCount = downwardEvaluations.filter((evaluation) =>
      evaluation.완료되었는가(),
    ).length;

    // 4. 평균 하향평가 점수 계산
    let averageScore: number | null = null;
    const completedEvaluations = downwardEvaluations.filter(
      (evaluation) =>
        evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined,
    );

    if (completedEvaluations.length > 0) {
      const totalScore = completedEvaluations.reduce(
        (sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0),
        0,
      );
      averageScore = totalScore / completedEvaluations.length;
    }

    // 5. 상태 결정
    let status: DownwardEvaluationStatus;

    // 할당된 WBS가 없으면 평가할 대상이 없음
    if (assignedWbsCount === 0) {
      status = 'none';
    }
    // 하향평가가 하나도 없으면 미존재
    else if (downwardEvaluations.length === 0) {
      status = 'none';
    }
    // 할당된 WBS 수만큼 하향평가가 완료되었으면 완료
    else if (completedEvaluationCount >= assignedWbsCount) {
      status = 'complete';
    }
    // 일부만 완료되었거나, 완료된 것은 없지만 하향평가가 존재하면 입력중
    else if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
      status = 'in_progress';
    } else {
      status = 'none';
    }

    return {
      status,
      assignedWbsCount,
      completedEvaluationCount,
      averageScore,
    };
  }

  /**
   * 동료평가 상태를 조회한다
   * 평가기간과 직원(피평가자)에 해당하는 동료평가의 전체 수와 완료된 수를 조회
   */
  private async 동료평가_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{ totalRequestCount: number; completedRequestCount: number }> {
    // 활성화된 동료평가 요청 전체 수 조회 (isActive = true, deletedAt IS NULL)
    const totalRequestCount = await this.peerEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        isActive: true,
        deletedAt: IsNull(),
      },
    });

    // 완료된 동료평가 수 조회 (isCompleted = true)
    const completedRequestCount = await this.peerEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        isActive: true,
        isCompleted: true,
        deletedAt: IsNull(),
      },
    });

    return { totalRequestCount, completedRequestCount };
  }

  /**
   * 동료평가 상태를 계산한다
   * - 요청이 없으면: none (요청가능)
   * - 모든 동료평가가 완료되었으면: complete (완료)
   * - 일부만 완료되었거나 진행중: in_progress (입력중)
   */
  private 동료평가_상태를_계산한다(
    totalRequestCount: number,
    completedRequestCount: number,
  ): PeerEvaluationStatus {
    // 동료평가 요청이 없으면 요청가능
    if (totalRequestCount === 0) {
      return 'none';
    }

    // 모든 동료평가가 완료되었으면 완료
    if (completedRequestCount === totalRequestCount) {
      return 'complete';
    }

    // 일부만 완료되었거나 진행중
    return 'in_progress';
  }

  /**
   * 최종평가를 조회한다
   * 평가기간과 직원에 해당하는 최종평가를 조회
   */
  private async 최종평가를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<FinalEvaluation | null> {
    const finalEvaluation = await this.finalEvaluationRepository.findOne({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    return finalEvaluation;
  }

  /**
   * 최종평가 상태를 계산한다
   * - 최종평가가 없으면: none (미작성)
   * - 최종평가가 확정되었으면: complete (확정)
   * - 최종평가가 있지만 확정되지 않았으면: in_progress (작성중)
   */
  private 최종평가_상태를_계산한다(
    finalEvaluation: FinalEvaluation | null,
  ): FinalEvaluationStatus {
    // 최종평가가 없으면 미작성
    if (!finalEvaluation) {
      return 'none';
    }

    // 최종평가가 확정되었으면 확정
    if (finalEvaluation.isConfirmed) {
      return 'complete';
    }

    // 최종평가가 있지만 확정되지 않았으면 작성중
    return 'in_progress';
  }
}
