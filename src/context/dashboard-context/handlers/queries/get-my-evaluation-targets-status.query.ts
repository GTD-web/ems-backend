import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import {
  MyEvaluationTargetStatusDto,
  EvaluationCriteriaStatus,
  WbsCriteriaStatus,
  EvaluationLineStatus,
  PerformanceInputStatus,
} from '../../interfaces/dashboard-context.interface';

/**
 * 내가 담당하는 평가 대상자 현황 조회 쿼리
 */
export class GetMyEvaluationTargetsStatusQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly evaluatorId: string,
  ) {}
}

/**
 * 내가 담당하는 평가 대상자 현황 조회 핸들러
 *
 * 특정 평가기간에서 내가 평가자로 지정된 피평가자들의 현황을 조회합니다.
 */
@QueryHandler(GetMyEvaluationTargetsStatusQuery)
export class GetMyEvaluationTargetsStatusHandler
  implements IQueryHandler<GetMyEvaluationTargetsStatusQuery>
{
  private readonly logger = new Logger(
    GetMyEvaluationTargetsStatusHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly lineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly lineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  ) {}

  async execute(
    query: GetMyEvaluationTargetsStatusQuery,
  ): Promise<MyEvaluationTargetStatusDto[]> {
    const { evaluationPeriodId, evaluatorId } = query;

    this.logger.debug(
      `내가 담당하는 평가 대상자 현황 조회 시작 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    try {
      // 1. 내가 평가자로 지정된 매핑 조회 (평가라인 정보 포함)
      const myTargetMappings = await this.lineMappingRepository
        .createQueryBuilder('mapping')
        .innerJoinAndSelect('mapping.evaluationLineId', 'line')
        .where('mapping.evaluatorId = :evaluatorId', { evaluatorId })
        .getMany();

      if (myTargetMappings.length === 0) {
        this.logger.debug(
          `담당하는 평가 대상자가 없습니다 - 평가자: ${evaluatorId}`,
        );
        return [];
      }

      // 평가라인 ID별로 평가라인 정보 조회
      const evaluationLineIds = [
        ...new Set(myTargetMappings.map((m) => m.evaluationLineId)),
      ];
      const evaluationLines =
        await this.lineRepository.findByIds(evaluationLineIds);
      const lineMap = new Map(
        evaluationLines.map((line) => [line.id, line.evaluatorType]),
      );

      // 피평가자 ID 목록
      const employeeIds = [
        ...new Set(myTargetMappings.map((m) => m.employeeId)),
      ];

      // 2. 피평가자들의 평가기간 매핑 정보 조회 (해당 평가기간에 속하고 제외되지 않은 직원만)
      const employeeMappings = await this.mappingRepository
        .createQueryBuilder('mapping')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('mapping.employeeId IN (:...employeeIds)', { employeeIds })
        .andWhere('mapping.isExcluded = false')
        .getMany();

      if (employeeMappings.length === 0) {
        this.logger.debug(
          `해당 평가기간에 활성화된 평가 대상자가 없습니다 - 평가기간: ${evaluationPeriodId}`,
        );
        return [];
      }

      const activeEmployeeIds = new Set(
        employeeMappings.map((m) => m.employeeId),
      );

      // 3. 각 피평가자별로 현황 정보 조회
      const results: MyEvaluationTargetStatusDto[] = [];

      for (const mapping of employeeMappings) {
        try {
          const employeeId = mapping.employeeId;

          // 내가 담당하는 평가 유형 확인
          const myMappings = myTargetMappings.filter(
            (m) =>
              m.employeeId === employeeId &&
              activeEmployeeIds.has(m.employeeId),
          );

          const evaluatorTypes = myMappings
            .map((m) => lineMap.get(m.evaluationLineId))
            .filter((type): type is EvaluatorType => type !== undefined);

          if (evaluatorTypes.length === 0) {
            continue;
          }

          // 제외 정보
          const exclusionInfo = {
            isExcluded: mapping.isExcluded,
            excludeReason: mapping.excludeReason ?? null,
            excludedAt: mapping.excludedAt ?? null,
          };

          // 프로젝트 할당 수 조회
          const projectCount = await this.projectAssignmentRepository.count({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
          });

          // WBS 할당 수 조회
          const wbsCount = await this.wbsAssignmentRepository.count({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
          });

          // 평가항목 상태 계산
          const evaluationCriteriaStatus: EvaluationCriteriaStatus =
            this.평가항목_상태를_계산한다(projectCount, wbsCount);

          // 할당된 WBS 목록 조회
          const assignedWbsList = await this.wbsAssignmentRepository.find({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
            select: ['wbsItemId'],
          });

          // 평가기준이 있는 WBS 수 조회
          let wbsWithCriteriaCount = 0;
          if (assignedWbsList.length > 0) {
            const wbsItemIds = assignedWbsList.map((wbs) => wbs.wbsItemId);
            wbsWithCriteriaCount = await this.wbsCriteriaRepository
              .createQueryBuilder('criteria')
              .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
              .andWhere('criteria.deletedAt IS NULL')
              .getCount();
          }

          // WBS 평가기준 상태 계산
          const wbsCriteriaStatus: WbsCriteriaStatus =
            this.WBS평가기준_상태를_계산한다(wbsCount, wbsWithCriteriaCount);

          // 평가라인 지정 상태 확인
          const { hasPrimaryEvaluator, hasSecondaryEvaluator } =
            await this.평가라인_지정_여부를_확인한다(employeeId);

          // 평가라인 상태 계산
          const evaluationLineStatus: EvaluationLineStatus =
            this.평가라인_상태를_계산한다(
              hasPrimaryEvaluator,
              hasSecondaryEvaluator,
            );

          // 성과 입력 상태 조회
          const { totalWbsCount: perfTotalWbsCount, inputCompletedCount } =
            await this.성과입력_상태를_조회한다(evaluationPeriodId, employeeId);

          // 성과 입력 상태 계산
          const performanceInputStatus: PerformanceInputStatus =
            this.성과입력_상태를_계산한다(
              perfTotalWbsCount,
              inputCompletedCount,
            );

          // 내가 담당하는 하향평가 현황 조회
          const downwardEvaluationStatus =
            await this.내가_담당하는_하향평가_현황을_조회한다(
              evaluationPeriodId,
              employeeId,
              evaluatorId,
              evaluatorTypes,
            );

          results.push({
            employeeId,
            isEvaluationTarget: !mapping.isExcluded,
            exclusionInfo,
            evaluationCriteria: {
              status: evaluationCriteriaStatus,
              assignedProjectCount: projectCount,
              assignedWbsCount: wbsCount,
            },
            wbsCriteria: {
              status: wbsCriteriaStatus,
              wbsWithCriteriaCount,
            },
            evaluationLine: {
              status: evaluationLineStatus,
              hasPrimaryEvaluator,
              hasSecondaryEvaluator,
            },
            performanceInput: {
              status: performanceInputStatus,
              totalWbsCount: perfTotalWbsCount,
              inputCompletedCount,
            },
            myEvaluatorTypes: evaluatorTypes,
            downwardEvaluation: downwardEvaluationStatus,
          });
        } catch (error) {
          this.logger.error(
            `피평가자 현황 조회 실패 - 직원: ${mapping.employeeId}`,
            error.stack,
          );
          continue;
        }
      }

      this.logger.debug(
        `내가 담당하는 평가 대상자 현황 조회 완료 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}, 대상자 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `내가 담당하는 평가 대상자 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 내가 담당하는 하향평가 현황을 조회한다
   */
  private async 내가_담당하는_하향평가_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    evaluatorTypes: EvaluatorType[],
  ): Promise<{
    isPrimary: boolean;
    isSecondary: boolean;
    primaryStatus: {
      assignedWbsCount: number;
      completedEvaluationCount: number;
      isEditable: boolean;
      averageScore: number | null;
    } | null;
    secondaryStatus: {
      assignedWbsCount: number;
      completedEvaluationCount: number;
      isEditable: boolean;
      averageScore: number | null;
    } | null;
  }> {
    const isPrimary = evaluatorTypes.includes(EvaluatorType.PRIMARY);
    const isSecondary = evaluatorTypes.includes(EvaluatorType.SECONDARY);

    // 매핑 정보에서 수정 가능 여부 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        isExcluded: false,
      },
    });

    const isPrimaryEditable = mapping?.isPrimaryEvaluationEditable ?? false;
    const isSecondaryEditable = mapping?.isSecondaryEvaluationEditable ?? false;

    let primaryStatus: {
      assignedWbsCount: number;
      completedEvaluationCount: number;
      isEditable: boolean;
      averageScore: number | null;
    } | null = null;
    let secondaryStatus: {
      assignedWbsCount: number;
      completedEvaluationCount: number;
      isEditable: boolean;
      averageScore: number | null;
    } | null = null;

    if (isPrimary) {
      // 1차 평가 현황 조회
      const evaluations = await this.downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: 'primary',
        })
        .getMany();

      const assignedWbsCount = evaluations.length;
      const completedEvaluationCount = evaluations.filter(
        (e) =>
          e.downwardEvaluationScore !== null &&
          e.downwardEvaluationScore !== undefined,
      ).length;

      // 평균 점수 계산
      const scoresWithValue = evaluations
        .map((e) => e.downwardEvaluationScore)
        .filter(
          (score): score is number => score !== null && score !== undefined,
        );

      const averageScore =
        scoresWithValue.length > 0
          ? scoresWithValue.reduce((sum, score) => sum + score, 0) /
            scoresWithValue.length
          : null;

      primaryStatus = {
        assignedWbsCount,
        completedEvaluationCount,
        isEditable: isPrimaryEditable,
        averageScore,
      };
    }

    if (isSecondary) {
      // 2차 평가 현황 조회
      const evaluations = await this.downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: 'secondary',
        })
        .getMany();

      const assignedWbsCount = evaluations.length;
      const completedEvaluationCount = evaluations.filter(
        (e) =>
          e.downwardEvaluationScore !== null &&
          e.downwardEvaluationScore !== undefined,
      ).length;

      // 평균 점수 계산
      const scoresWithValue = evaluations
        .map((e) => e.downwardEvaluationScore)
        .filter(
          (score): score is number => score !== null && score !== undefined,
        );

      const averageScore =
        scoresWithValue.length > 0
          ? scoresWithValue.reduce((sum, score) => sum + score, 0) /
            scoresWithValue.length
          : null;

      secondaryStatus = {
        assignedWbsCount,
        completedEvaluationCount,
        isEditable: isSecondaryEditable,
        averageScore,
      };
    }

    return {
      isPrimary,
      isSecondary,
      primaryStatus,
      secondaryStatus,
    };
  }

  /**
   * 성과 입력 상태를 조회한다
   */
  private async 성과입력_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{ totalWbsCount: number; inputCompletedCount: number }> {
    // 전체 WBS 자기평가 수 조회
    const totalWbsCount = await this.wbsSelfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    // 성과가 입력된 WBS 수 조회
    const selfEvaluations = await this.wbsSelfEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    const inputCompletedCount = selfEvaluations.filter(
      (evaluation) =>
        evaluation.performanceResult &&
        evaluation.performanceResult.trim().length > 0,
    ).length;

    return { totalWbsCount, inputCompletedCount };
  }

  /**
   * 성과 입력 상태를 계산한다
   */
  private 성과입력_상태를_계산한다(
    totalWbsCount: number,
    inputCompletedCount: number,
  ): PerformanceInputStatus {
    if (totalWbsCount === 0) {
      return 'none';
    }

    if (inputCompletedCount === 0) {
      return 'none';
    } else if (inputCompletedCount === totalWbsCount) {
      return 'complete';
    } else {
      return 'in_progress';
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
    const primaryLine = await this.lineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.PRIMARY,
        deletedAt: IsNull(),
      },
    });

    // SECONDARY 평가라인 조회
    const secondaryLine = await this.lineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.SECONDARY,
        deletedAt: IsNull(),
      },
    });

    let hasPrimaryEvaluator = false;
    let hasSecondaryEvaluator = false;

    // PRIMARY 평가라인에 평가자가 지정되었는지 확인
    if (primaryLine) {
      const primaryMapping = await this.lineMappingRepository.findOne({
        where: {
          employeeId: employeeId,
          evaluationLineId: primaryLine.id,
          deletedAt: IsNull(),
        },
      });
      hasPrimaryEvaluator = !!primaryMapping;
    }

    // SECONDARY 평가라인에 평가자가 지정되었는지 확인
    if (secondaryLine) {
      const secondaryMapping = await this.lineMappingRepository.findOne({
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
}
