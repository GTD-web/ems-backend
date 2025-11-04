import { Logger } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { SelfEvaluationStatus } from '../../../interfaces/dashboard-context.interface';

const logger = new Logger('SelfEvaluationUtils');

/**
 * 자기평가 진행 상태를 조회한다
 * 평가기간과 직원에 해당하는 WBS 자기평가의 전체 수와 완료된 수, 가중치 기반 총점을 조회
 */
export async function 자기평가_진행_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  periodRepository: Repository<EvaluationPeriod>,
): Promise<{
  totalMappingCount: number;
  completedMappingCount: number;
  submittedToEvaluatorCount: number;
  isSubmittedToEvaluator: boolean;
  totalScore: number | null;
  grade: string | null;
}> {
  // 전체 WBS 자기평가 수 조회
  const totalMappingCount = await wbsSelfEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      deletedAt: IsNull(),
    },
  });

  // 관리자에게 제출된 WBS 자기평가 수 조회
  const completedMappingCount = await wbsSelfEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      submittedToManager: true,
      deletedAt: IsNull(),
    },
  });

  // 1차 평가자에게 제출된 WBS 자기평가 수 조회
  const submittedToEvaluatorCount = await wbsSelfEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      submittedToEvaluator: true,
      deletedAt: IsNull(),
    },
  });

  // 모든 자기평가가 1차 평가자에게 제출되었는지 확인
  const isSubmittedToEvaluator =
    totalMappingCount > 0 &&
    submittedToEvaluatorCount === totalMappingCount;

  // 가중치 기반 자기평가 총점 및 등급 계산
  let totalScore: number | null = null;
  let grade: string | null = null;

  // 모든 WBS가 완료된 경우에만 점수와 등급을 계산
  if (totalMappingCount > 0 && completedMappingCount === totalMappingCount) {
    totalScore = await 가중치_기반_자기평가_점수를_계산한다(
      evaluationPeriodId,
      employeeId,
      wbsSelfEvaluationRepository,
      wbsAssignmentRepository,
      periodRepository,
    );

    // 총점이 계산되었으면 등급 조회
    if (totalScore !== null) {
      grade = await 자기평가_등급을_조회한다(
        evaluationPeriodId,
        totalScore,
        periodRepository,
      );
    }
  }

  return {
    totalMappingCount,
    completedMappingCount,
    submittedToEvaluatorCount,
    isSubmittedToEvaluator,
    totalScore,
    grade,
  };
}

/**
 * 자기평가 상태를 계산한다
 * - 모든 WBS 자기평가가 완료됨: complete (완료)
 * - 매핑이 있지만 일부만 완료되거나 모두 미완료: in_progress (입력중)
 * - 매핑이 없음: none (미존재)
 */
export function 자기평가_상태를_계산한다(
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
 * 가중치 기반 자기평가 점수를 계산한다
 * 계산식: Σ(WBS 가중치 × 자기평가 점수 / maxSelfEvaluationRate × 100)
 */
export async function 가중치_기반_자기평가_점수를_계산한다(
  evaluationPeriodId: string,
  employeeId: string,
  wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  periodRepository: Repository<EvaluationPeriod>,
): Promise<number | null> {
  try {
    // 평가기간 정보 조회 (maxSelfEvaluationRate 필요)
    const period = await periodRepository.findOne({
      where: {
        id: evaluationPeriodId,
        deletedAt: IsNull(),
      },
    });

    if (!period) {
      logger.warn(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
      return null;
    }

    const maxSelfEvaluationRate = period.maxSelfEvaluationRate;

    // 관리자에게 제출된 WBS 자기평가 목록 조회
    const selfEvaluations = await wbsSelfEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        submittedToManager: true,
        deletedAt: IsNull(),
      },
    });

    if (selfEvaluations.length === 0) {
      return null;
    }

    // WBS 할당 정보 조회 (가중치 포함)
    const wbsItemIds = selfEvaluations.map((se) => se.wbsItemId);
    const wbsAssignments = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('assignment.deletedAt IS NULL')
      .getMany();

    // WBS별 가중치 맵 생성
    const weightMap = new Map<string, number>();
    wbsAssignments.forEach((assignment) => {
      weightMap.set(assignment.wbsItemId, assignment.weight);
    });

    // 가중치 기반 점수 계산
    let totalWeightedScore = 0;
    let totalWeight = 0;

    selfEvaluations.forEach((evaluation) => {
      const weight = weightMap.get(evaluation.wbsItemId) || 0;
      const score = evaluation.selfEvaluationScore || 0;

      // 정규화: (score / maxSelfEvaluationRate) × 100
      const normalizedScore = (score / maxSelfEvaluationRate) * 100;

      // 가중치 적용: weight × normalizedScore
      totalWeightedScore += (weight / 100) * normalizedScore;
      totalWeight += weight;
    });

    // 가중치 합이 100이 아닌 경우 정규화
    if (totalWeight === 0) {
      return null;
    }

    // 최종 점수 (0-100 범위)
    const finalScore = totalWeightedScore;

    logger.log(
      `가중치 기반 자기평가 점수 계산 완료: ${finalScore.toFixed(2)} (직원: ${employeeId}, 평가기간: ${evaluationPeriodId})`,
    );

    return Math.round(finalScore * 100) / 100; // 소수점 2자리로 반올림
  } catch (error) {
    logger.error(
      `가중치 기반 자기평가 점수 계산 실패: ${error.message}`,
      error.stack,
    );
    return null;
  }
}

/**
 * 평가기간의 등급 구간을 이용하여 점수에 해당하는 등급을 조회한다
 */
export async function 자기평가_등급을_조회한다(
  evaluationPeriodId: string,
  totalScore: number,
  periodRepository: Repository<EvaluationPeriod>,
): Promise<string | null> {
  try {
    // 평가기간 정보 조회
    const period = await periodRepository.findOne({
      where: {
        id: evaluationPeriodId,
        deletedAt: IsNull(),
      },
    });

    if (!period) {
      logger.warn(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
      return null;
    }

    // 등급 구간이 설정되어 있지 않은 경우
    if (!period.등급구간_설정됨()) {
      logger.warn(
        `평가기간에 등급 구간이 설정되지 않았습니다: ${evaluationPeriodId}`,
      );
      return null;
    }

    // 점수로 등급 조회
    const gradeMapping = period.점수로_등급_조회한다(totalScore);

    if (!gradeMapping) {
      logger.warn(
        `점수에 해당하는 등급을 찾을 수 없습니다: ${totalScore} (평가기간: ${evaluationPeriodId})`,
      );
      return null;
    }

    logger.log(
      `자기평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${evaluationPeriodId})`,
    );

    return gradeMapping.finalGrade;
  } catch (error) {
    logger.error(`자기평가 등급 조회 실패: ${error.message}`, error.stack);
    return null;
  }
}
