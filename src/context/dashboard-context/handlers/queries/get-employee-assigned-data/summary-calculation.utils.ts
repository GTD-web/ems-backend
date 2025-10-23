import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import {
  가중치_기반_자기평가_점수를_계산한다,
  자기평가_등급을_조회한다,
} from '../get-employee-evaluation-period-status/self-evaluation.utils';
import {
  가중치_기반_1차_하향평가_점수를_계산한다,
  가중치_기반_2차_하향평가_점수를_계산한다,
  하향평가_등급을_조회한다,
} from '../get-employee-evaluation-period-status/downward-evaluation-score.utils';

/**
 * 자기평가 점수/등급 계산
 */
export async function calculateSelfEvaluationScore(
  evaluationPeriodId: string,
  employeeId: string,
  completedSelfEvaluations: number,
  selfEvaluationRepository: Repository<WbsSelfEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<{
  totalScore: number | null;
  grade: string | null;
}> {
  let selfEvaluationScore: number | null = null;
  let selfEvaluationGrade: string | null = null;

  const totalSelfEvaluations = await selfEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      deletedAt: null as any,
    },
  });

  if (
    totalSelfEvaluations > 0 &&
    completedSelfEvaluations === totalSelfEvaluations
  ) {
    selfEvaluationScore = await 가중치_기반_자기평가_점수를_계산한다(
      evaluationPeriodId,
      employeeId,
      selfEvaluationRepository,
      wbsAssignmentRepository,
      evaluationPeriodRepository,
    );

    if (selfEvaluationScore !== null) {
      selfEvaluationGrade = await 자기평가_등급을_조회한다(
        evaluationPeriodId,
        selfEvaluationScore,
        evaluationPeriodRepository,
      );
    }
  }

  return {
    totalScore: selfEvaluationScore,
    grade: selfEvaluationGrade,
  };
}

/**
 * 1차 하향평가 점수/등급 계산
 */
export async function calculatePrimaryDownwardEvaluationScore(
  evaluationPeriodId: string,
  employeeId: string,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<{
  totalScore: number | null;
  grade: string | null;
}> {
  let primaryDownwardScore: number | null = null;
  let primaryDownwardGrade: string | null = null;

  // 1차 평가자 조회
  const primaryEvaluatorMapping = await evaluationLineMappingRepository
    .createQueryBuilder('mapping')
    .leftJoin(
      EvaluationLine,
      'line',
      'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
    )
    .where('mapping.employeeId = :employeeId', { employeeId })
    .andWhere('line.evaluatorType = :evaluatorType', {
      evaluatorType: EvaluatorType.PRIMARY,
    })
    .andWhere('mapping.deletedAt IS NULL')
    .getOne();

  if (primaryEvaluatorMapping) {
    const primaryEvaluatorId = primaryEvaluatorMapping.evaluatorId;

    // 1차 평가자에게 할당된 WBS 목록 조회 (wbsItemId 포함)
    const primaryAssignedMappings = await evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .select(['mapping.id', 'mapping.wbsItemId'])
      .leftJoin(
        EvaluationLine,
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.evaluatorId = :evaluatorId', {
        evaluatorId: primaryEvaluatorId,
      })
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: EvaluatorType.PRIMARY,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('mapping.wbsItemId IS NOT NULL') // wbsItemId가 있는 것만 조회
      .getRawMany();

    const primaryAssignedCount = primaryAssignedMappings.length;

    // 할당된 WBS ID 목록 추출
    const primaryAssignedWbsIds = primaryAssignedMappings.map(
      (m) => m.mapping_wbsItemId,
    );

    // 할당된 WBS에 대한 완료된 평가 수 조회
    let primaryCompletedCount = 0;
    if (primaryAssignedWbsIds.length > 0) {
      primaryCompletedCount = await downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.evaluatorId = :evaluatorId', {
          evaluatorId: primaryEvaluatorId,
        })
        .andWhere('eval.wbsId IN (:...wbsIds)', {
          wbsIds: primaryAssignedWbsIds,
        })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: DownwardEvaluationType.PRIMARY,
        })
        .andWhere('eval.isCompleted = :isCompleted', { isCompleted: true })
        .andWhere('eval.deletedAt IS NULL')
        .getCount();
    }

    // 모든 WBS가 완료되면 점수/등급 계산
    if (
      primaryAssignedCount > 0 &&
      primaryCompletedCount === primaryAssignedCount
    ) {
      primaryDownwardScore = await 가중치_기반_1차_하향평가_점수를_계산한다(
        evaluationPeriodId,
        employeeId,
        primaryEvaluatorId,
        downwardEvaluationRepository,
        wbsAssignmentRepository,
      );

      if (primaryDownwardScore !== null) {
        primaryDownwardGrade = await 하향평가_등급을_조회한다(
          evaluationPeriodId,
          primaryDownwardScore,
          evaluationPeriodRepository,
        );
      }
    }
  }

  return {
    totalScore: primaryDownwardScore,
    grade: primaryDownwardGrade,
  };
}

/**
 * 2차 하향평가 점수/등급 계산
 */
export async function calculateSecondaryDownwardEvaluationScore(
  evaluationPeriodId: string,
  employeeId: string,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<{
  totalScore: number | null;
  grade: string | null;
}> {
  let secondaryDownwardScore: number | null = null;
  let secondaryDownwardGrade: string | null = null;

  // 2차 평가자들 조회
  const secondaryEvaluatorMappings = await evaluationLineMappingRepository
    .createQueryBuilder('mapping')
    .leftJoin(
      EvaluationLine,
      'line',
      'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
    )
    .where('mapping.employeeId = :employeeId', { employeeId })
    .andWhere('line.evaluatorType = :evaluatorType', {
      evaluatorType: EvaluatorType.SECONDARY,
    })
    .andWhere('mapping.deletedAt IS NULL')
    .getMany();

  if (secondaryEvaluatorMappings.length > 0) {
    // 중복 제거: 한 평가자가 여러 WBS를 평가할 수 있음
    const secondaryEvaluatorIds = [
      ...new Set(secondaryEvaluatorMappings.map((m) => m.evaluatorId)),
    ];

    // 각 2차 평가자별 할당된 WBS 수와 완료된 평가 수 조회
    const evaluatorStats = await Promise.all(
      secondaryEvaluatorIds.map(async (evaluatorId) => {
        // 할당된 WBS 목록 조회 (wbsItemId 포함)
        const assignedMappings = await evaluationLineMappingRepository
          .createQueryBuilder('mapping')
          .select(['mapping.id', 'mapping.wbsItemId'])
          .leftJoin(
            EvaluationLine,
            'line',
            'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
          )
          .where('mapping.employeeId = :employeeId', { employeeId })
          .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
          .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: EvaluatorType.SECONDARY,
          })
          .andWhere('mapping.deletedAt IS NULL')
          .andWhere('mapping.wbsItemId IS NOT NULL') // wbsItemId가 있는 것만 조회
          .getRawMany();

        const assignedCount = assignedMappings.length;

        // 할당된 WBS ID 목록 추출
        const assignedWbsIds = assignedMappings.map((m) => m.mapping_wbsItemId);

        // 할당된 WBS에 대한 완료된 평가 수 조회
        let completedCount = 0;
        if (assignedWbsIds.length > 0) {
          completedCount = await downwardEvaluationRepository
            .createQueryBuilder('eval')
            .where('eval.periodId = :periodId', {
              periodId: evaluationPeriodId,
            })
            .andWhere('eval.employeeId = :employeeId', { employeeId })
            .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
            .andWhere('eval.wbsId IN (:...wbsIds)', { wbsIds: assignedWbsIds })
            .andWhere('eval.evaluationType = :evaluationType', {
              evaluationType: DownwardEvaluationType.SECONDARY,
            })
            .andWhere('eval.isCompleted = :isCompleted', { isCompleted: true })
            .andWhere('eval.deletedAt IS NULL')
            .getCount();
        }

        return { evaluatorId, assignedCount, completedCount };
      }),
    );

    // 모든 평가자가 할당된 모든 WBS를 완료했는지 확인
    const allCompleted = evaluatorStats.every(
      (stat) =>
        stat.assignedCount > 0 && stat.completedCount === stat.assignedCount,
    );

    // 최소 한 명의 평가자가 할당되어 있고 모두 완료한 경우 점수 계산
    if (evaluatorStats.length > 0 && allCompleted) {
      secondaryDownwardScore = await 가중치_기반_2차_하향평가_점수를_계산한다(
        evaluationPeriodId,
        employeeId,
        secondaryEvaluatorIds,
        downwardEvaluationRepository,
        wbsAssignmentRepository,
      );

      if (secondaryDownwardScore !== null) {
        secondaryDownwardGrade = await 하향평가_등급을_조회한다(
          evaluationPeriodId,
          secondaryDownwardScore,
          evaluationPeriodRepository,
        );
      }
    }
  }

  return {
    totalScore: secondaryDownwardScore,
    grade: secondaryDownwardGrade,
  };
}
