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
import { EmployeeEvaluationPeriodStatusDto } from '../../../interfaces/dashboard-context.interface';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';

// 유틸 함수 import
import {
  평가항목_상태를_계산한다,
  WBS평가기준_상태를_계산한다,
} from './evaluation-criteria.utils';
import {
  평가라인_지정_여부를_확인한다,
  평가라인_상태를_계산한다,
} from './evaluation-line.utils';
import {
  성과입력_상태를_조회한다,
  성과입력_상태를_계산한다,
} from './performance-input.utils';
import {
  자기평가_진행_상태를_조회한다,
  자기평가_상태를_계산한다,
} from './self-evaluation.utils';
import { 하향평가_상태를_조회한다 } from './downward-evaluation.utils';
import {
  동료평가_상태를_조회한다,
  동료평가_상태를_계산한다,
} from './peer-evaluation.utils';
import {
  최종평가를_조회한다,
  최종평가_상태를_계산한다,
} from './final-evaluation.utils';

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
    public readonly includeUnregistered: boolean = false,
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
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
  ) {}

  async execute(
    query: GetEmployeeEvaluationPeriodStatusQuery,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null> {
    const { evaluationPeriodId, employeeId, includeUnregistered } = query;

    this.logger.debug(
      `직원의 평가기간 현황 조회 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      // 1. 맵핑 정보 조회 (LEFT JOIN으로 평가기간과 직원 정보 함께 조회)
      const queryBuilder = this.mappingRepository
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
          'period.criteriaSettingEnabled AS period_criteriasettingenabled',
          'period.selfEvaluationSettingEnabled AS period_selfevaluationsettingenabled',
          'period.finalEvaluationSettingEnabled AS period_finalevaluationsettingenabled',
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
        .andWhere('mapping.employeeId = :employeeId', { employeeId });
      // 등록 해제된 직원도 조회하도록 조건 제거
      // .andWhere('mapping.deletedAt IS NULL')

      // includeUnregistered가 true면 소프트 삭제된 엔티티도 포함
      if (includeUnregistered) {
        queryBuilder.withDeleted();
      }

      const result = await queryBuilder.getRawOne();

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
      const evaluationCriteriaStatus = 평가항목_상태를_계산한다(
        projectCount,
        wbsCount,
      );

      // 5. 할당된 WBS 목록 조회
      const assignedWbsList = await this.wbsAssignmentRepository.find({
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          deletedAt: IsNull(),
        },
        select: ['wbsItemId'],
      });

      // 6. 평가기준이 있는 WBS 수 조회 (고유한 WBS 개수)
      let wbsWithCriteriaCount = 0;
      if (assignedWbsList.length > 0) {
        const wbsItemIds = assignedWbsList.map((wbs) => wbs.wbsItemId);
        const distinctWbsIdsWithCriteria = await this.wbsCriteriaRepository
          .createQueryBuilder('criteria')
          .select('DISTINCT criteria.wbsItemId', 'wbsItemId')
          .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
          .andWhere('criteria.deletedAt IS NULL')
          .getRawMany();
        wbsWithCriteriaCount = distinctWbsIdsWithCriteria.length;
      }

      // 7. WBS 평가기준 상태 계산
      const wbsCriteriaStatus = WBS평가기준_상태를_계산한다(
        wbsCount,
        wbsWithCriteriaCount,
      );

      // 8. 평가라인 지정 상태 확인
      const { hasPrimaryEvaluator, hasSecondaryEvaluator } =
        await 평가라인_지정_여부를_확인한다(
          evaluationPeriodId,
          employeeId,
          this.evaluationLineRepository,
          this.evaluationLineMappingRepository,
        );

      // 9. 평가라인 상태 계산
      const evaluationLineStatus = 평가라인_상태를_계산한다(
        hasPrimaryEvaluator,
        hasSecondaryEvaluator,
      );

      // 10. 성과 입력 상태 조회
      const { totalWbsCount: perfTotalWbsCount, inputCompletedCount } =
        await 성과입력_상태를_조회한다(
          evaluationPeriodId,
          employeeId,
          this.wbsSelfEvaluationRepository,
        );

      // 11. 성과 입력 상태 계산
      const performanceInputStatus = 성과입력_상태를_계산한다(
        perfTotalWbsCount,
        inputCompletedCount,
      );

      // 12. 자기평가 진행 상태 조회
      const { totalMappingCount, completedMappingCount, totalScore, grade } =
        await 자기평가_진행_상태를_조회한다(
          evaluationPeriodId,
          employeeId,
          this.wbsSelfEvaluationRepository,
          this.wbsAssignmentRepository,
          this.periodRepository,
        );

      // 13. 자기평가 상태 계산
      const selfEvaluationStatus = 자기평가_상태를_계산한다(
        totalMappingCount,
        completedMappingCount,
      );

      // 14. 하향평가 상태 조회
      const { primary, secondary } = await 하향평가_상태를_조회한다(
        evaluationPeriodId,
        employeeId,
        this.evaluationLineRepository,
        this.evaluationLineMappingRepository,
        this.downwardEvaluationRepository,
        this.wbsAssignmentRepository,
        this.periodRepository,
        this.employeeRepository,
      );

      // 15. 동료평가 상태 조회
      const { totalRequestCount, completedRequestCount } =
        await 동료평가_상태를_조회한다(
          evaluationPeriodId,
          employeeId,
          this.peerEvaluationRepository,
        );

      // 16. 동료평가 상태 계산
      const peerEvaluationStatus = 동료평가_상태를_계산한다(
        totalRequestCount,
        completedRequestCount,
      );

      // 17. 최종평가 조회
      const finalEvaluation = await 최종평가를_조회한다(
        evaluationPeriodId,
        employeeId,
        this.finalEvaluationRepository,
      );

      // 18. 최종평가 상태 계산
      const finalEvaluationStatus = 최종평가_상태를_계산한다(finalEvaluation);

      // 19. 단계별 확인 상태 조회
      const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
        result.mapping_id,
      );

      // 20. DTO로 변환
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
              // 수정 가능 상태 정보를 evaluationPeriod 안에 포함
              editableStatus: {
                isSelfEvaluationEditable: isSelfEvaluationEditable,
                isPrimaryEvaluationEditable: isPrimaryEvaluationEditable,
                isSecondaryEvaluationEditable: isSecondaryEvaluationEditable,
              },
              // 수동 설정 상태 정보를 evaluationPeriod 안에 포함
              manualSettings: {
                criteriaSettingEnabled:
                  result.period_criteriasettingenabled || false,
                selfEvaluationSettingEnabled:
                  result.period_selfevaluationsettingenabled || false,
                finalEvaluationSettingEnabled:
                  result.period_finalevaluationsettingenabled || false,
              },
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

        // 성과 입력 정보
        performanceInput: {
          status: performanceInputStatus,
          totalWbsCount: perfTotalWbsCount,
          inputCompletedCount,
        },

        // 자기평가 진행 정보
        selfEvaluation: {
          status: selfEvaluationStatus,
          totalMappingCount,
          completedMappingCount,
          isEditable: isSelfEvaluationEditable,
          totalScore,
          grade,
        },

        // 하향평가 진행 정보
        downwardEvaluation: {
          primary: {
            evaluator: primary.evaluator,
            status: primary.status,
            assignedWbsCount: primary.assignedWbsCount,
            completedEvaluationCount: primary.completedEvaluationCount,
            isEditable: isPrimaryEvaluationEditable,
            totalScore: primary.totalScore,
            grade: primary.grade,
          },
          secondary: {
            evaluators: secondary.evaluators,
            isEditable: isSecondaryEvaluationEditable,
            totalScore: secondary.totalScore,
            grade: secondary.grade,
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

        // 단계별 확인 상태 정보
        stepApproval: {
          criteriaSettingStatus:
            stepApproval?.criteriaSettingStatus ?? 'pending',
          criteriaSettingApprovedBy:
            stepApproval?.criteriaSettingApprovedBy ?? null,
          criteriaSettingApprovedAt:
            stepApproval?.criteriaSettingApprovedAt ?? null,
          selfEvaluationStatus: stepApproval?.selfEvaluationStatus ?? 'pending',
          selfEvaluationApprovedBy:
            stepApproval?.selfEvaluationApprovedBy ?? null,
          selfEvaluationApprovedAt:
            stepApproval?.selfEvaluationApprovedAt ?? null,
          primaryEvaluationStatus:
            stepApproval?.primaryEvaluationStatus ?? 'pending',
          primaryEvaluationApprovedBy:
            stepApproval?.primaryEvaluationApprovedBy ?? null,
          primaryEvaluationApprovedAt:
            stepApproval?.primaryEvaluationApprovedAt ?? null,
          secondaryEvaluationStatus:
            stepApproval?.secondaryEvaluationStatus ?? 'pending',
          secondaryEvaluationApprovedBy:
            stepApproval?.secondaryEvaluationApprovedBy ?? null,
          secondaryEvaluationApprovedAt:
            stepApproval?.secondaryEvaluationApprovedAt ?? null,
        },
      };

      const secondaryLog =
        secondary.evaluators.length > 0
          ? secondary.evaluators
              .map(
                (s) =>
                  `평가자${s.evaluator.id}: ${s.completedEvaluationCount}/${s.assignedWbsCount} (${s.status})`,
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
          `성과입력: ${inputCompletedCount}/${perfTotalWbsCount} (${performanceInputStatus}), ` +
          `자기평가: ${completedMappingCount}/${totalMappingCount} (${selfEvaluationStatus}, 총점: ${totalScore?.toFixed(2) ?? 'N/A'}, 등급: ${grade ?? 'N/A'}, 수정가능: ${isSelfEvaluationEditable}), ` +
          `1차하향평가(${primary.evaluator?.id ?? 'N/A'}): ${primary.completedEvaluationCount}/${primary.assignedWbsCount} (${primary.status}, 총점: ${primary.totalScore?.toFixed(2) ?? 'N/A'}, 등급: ${primary.grade ?? 'N/A'}, 수정가능: ${isPrimaryEvaluationEditable}), ` +
          `2차하향평가: [${secondaryLog}] (총점: ${secondary.totalScore?.toFixed(2) ?? 'N/A'}, 등급: ${secondary.grade ?? 'N/A'}, 수정가능: ${isSecondaryEvaluationEditable}), ` +
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
}
