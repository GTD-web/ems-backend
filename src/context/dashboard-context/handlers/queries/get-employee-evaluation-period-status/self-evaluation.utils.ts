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
  submittedToManagerCount: number;
  isSubmittedToManager: boolean;
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
    totalMappingCount > 0 && submittedToEvaluatorCount === totalMappingCount;

  // 관리자에게 제출된 WBS 자기평가 수는 completedMappingCount와 동일
  const submittedToManagerCount = completedMappingCount;

  // 모든 자기평가가 관리자에게 제출되었는지 확인
  const isSubmittedToManager =
    totalMappingCount > 0 && submittedToManagerCount === totalMappingCount;

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
    submittedToManagerCount,
    isSubmittedToManager,
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
 * 자기평가 통합 상태를 계산한다
 * - 자기평가 진행 상태와 승인 상태를 통합하여 계산
 *
 * 계산 로직:
 * 1. 재작성 요청 관련 상태는 제출 여부와 상관없이 최우선 반환:
 *    - 승인 상태가 revision_requested이면 → revision_requested (제출 여부 무관, none/in_progress 상태에서도 가능)
 *    - 승인 상태가 revision_completed이면 → revision_completed (제출 여부 무관, none/in_progress 상태에서도 가능)
 * 2. 자기평가 진행 상태가 none이면 → none
 * 3. 자기평가 진행 상태가 in_progress이면 → in_progress
 * 4. 자기평가 진행 상태가 complete이고 승인 상태가 pending이면 → pending
 * 5. 자기평가 진행 상태가 complete이고 승인 상태가 approved이면 → approved
 */
export function 자기평가_통합_상태를_계산한다(
  selfEvaluationStatus: SelfEvaluationStatus,
  approvalStatus:
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed',
):
  | SelfEvaluationStatus
  | 'pending'
  | 'approved'
  | 'revision_requested'
  | 'revision_completed' {
  // 1. 재작성 요청 관련 상태는 제출 여부와 상관없이 최우선 반환
  // none이나 in_progress 상태에서도 재작성 요청이 있을 수 있음
  if (approvalStatus === 'revision_requested') {
    return 'revision_requested';
  }
  if (approvalStatus === 'revision_completed') {
    return 'revision_completed';
  }

  // 2. 자기평가 진행 상태가 none이면 → none
  if (selfEvaluationStatus === 'none') {
    return 'none';
  }

  // 3. 자기평가 진행 상태가 in_progress이면 → in_progress
  if (selfEvaluationStatus === 'in_progress') {
    return 'in_progress';
  }

  // 4. 자기평가 진행 상태가 complete이면 승인 상태 반환 (pending, approved 등)
  // selfEvaluationStatus === 'complete'
  return approvalStatus;
}

/**
 * 가중치 기반 자기평가 점수를 계산한다
 * 계산식: Σ(WBS 가중치 × 자기평가 점수)
 * 최대 점수: 평가기간의 maxSelfEvaluationRate
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

      // 가중치 적용: (weight / 100) × score
      // 점수는 0 ~ maxSelfEvaluationRate 범위를 유지
      totalWeightedScore += (weight / 100) * score;
      totalWeight += weight;
    });

    // 가중치 합이 100이 아닌 경우 정규화
    if (totalWeight === 0) {
      return null;
    }

    // 최종 점수 (0 ~ maxSelfEvaluationRate 범위)
    const finalScore = totalWeightedScore;

    // 소수점일 때는 내림을 통해 정수로 변환
    const integerScore = Math.floor(finalScore);

    logger.log(
      `가중치 기반 자기평가 점수 계산 완료: ${integerScore} (원본: ${finalScore.toFixed(2)}, 최대값: ${maxSelfEvaluationRate}) (직원: ${employeeId}, 평가기간: ${evaluationPeriodId})`,
    );

    return integerScore;
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
