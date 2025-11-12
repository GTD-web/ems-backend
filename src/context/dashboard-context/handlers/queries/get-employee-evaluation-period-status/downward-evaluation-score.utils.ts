import { Logger } from '@nestjs/common';
import { Repository, IsNull, In } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

const logger = new Logger('DownwardEvaluationScoreUtils');

/**
 * 가중치 기반 1차 하향평가 점수를 계산한다
 * 계산식: Σ(WBS 가중치 × 하향평가 점수 / maxRate × 100)
 * 하향평가 점수 범위: 0 ~ 평가기간의 최대 달성률
 */
export async function 가중치_기반_1차_하향평가_점수를_계산한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorId: string | null,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<number | null> {
  try {
    // 평가자가 없으면 계산 불가
    if (!evaluatorId) {
      logger.warn(
        `1차 평가자가 지정되지 않았습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`,
      );
      return null;
    }

    // 완료된 1차 하향평가 목록 조회
    const downwardEvaluations = await downwardEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        deletedAt: IsNull(),
      },
    });

    // 완료된 평가만 필터링
    const completedEvaluations = downwardEvaluations.filter(
      (evaluation) =>
        evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined,
    );

    if (completedEvaluations.length === 0) {
      return null;
    }

    // WBS 할당 정보 조회 (가중치 포함)
    const wbsIds = completedEvaluations.map((de) => de.wbsId);
    const wbsAssignments = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
      .andWhere('assignment.deletedAt IS NULL')
      .getMany();

    // 평가기간의 최대 달성률 조회
    const evaluationPeriod = await evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });
    const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;

    // WBS별 가중치 맵 생성
    const weightMap = new Map<string, number>();
    wbsAssignments.forEach((assignment) => {
      weightMap.set(assignment.wbsItemId, assignment.weight);
    });

    // 가중치 기반 점수 계산
    let totalWeightedScore = 0;
    let totalWeight = 0;

    completedEvaluations.forEach((evaluation) => {
      const weight = weightMap.get(evaluation.wbsId) || 0;
      const score = evaluation.downwardEvaluationScore || 0;

      // 정규화: (score / maxRate) × 100 (하향평가는 0 ~ maxRate 범위)
      const normalizedScore = (score / maxRate) * 100;

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
      `가중치 기반 1차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (피평가자: ${employeeId}, 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId})`,
    );

    return Math.round(finalScore * 100) / 100; // 소수점 2자리로 반올림
  } catch (error) {
    logger.error(
      `가중치 기반 1차 하향평가 점수 계산 실패: ${error.message}`,
      error.stack,
    );
    return null;
  }
}

/**
 * 가중치 기반 2차 하향평가 점수를 계산한다
 * 여러 명의 2차 평가자가 있을 경우, 모든 평가자의 평가를 종합하여 계산
 * 계산식: Σ(WBS 가중치 × 모든 2차 평가자의 평균 점수 / maxRate × 100)
 */
export async function 가중치_기반_2차_하향평가_점수를_계산한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorIds: string[],
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<number | null> {
  try {
    // 평가자가 없으면 계산 불가
    if (evaluatorIds.length === 0) {
      logger.warn(
        `2차 평가자가 지정되지 않았습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`,
      );
      return null;
    }

    // 현재 평가라인에 있는 2차 평가자의 완료된 하향평가 목록만 조회
    const downwardEvaluations = await downwardEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: In(evaluatorIds),
        evaluationType: DownwardEvaluationType.SECONDARY,
        deletedAt: IsNull(),
      },
    });

    // 완료된 평가만 필터링
    const completedEvaluations = downwardEvaluations.filter(
      (evaluation) =>
        evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined,
    );

    if (completedEvaluations.length === 0) {
      return null;
    }

    // WBS 할당 정보 조회 (가중치 포함)
    const wbsIds = [...new Set(completedEvaluations.map((de) => de.wbsId))];
    const wbsAssignments = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
      .andWhere('assignment.deletedAt IS NULL')
      .getMany();

    // 평가기간의 최대 달성률 조회
    const evaluationPeriod = await evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });
    const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;

    // WBS별 가중치 맵 생성
    const weightMap = new Map<string, number>();
    wbsAssignments.forEach((assignment) => {
      weightMap.set(assignment.wbsItemId, assignment.weight);
    });

    // WBS별 평가자들의 점수를 수집
    const wbsScoresMap = new Map<string, number[]>();
    completedEvaluations.forEach((evaluation) => {
      if (!wbsScoresMap.has(evaluation.wbsId)) {
        wbsScoresMap.set(evaluation.wbsId, []);
      }
      wbsScoresMap
        .get(evaluation.wbsId)!
        .push(evaluation.downwardEvaluationScore || 0);
    });

    // 가중치 기반 점수 계산
    let totalWeightedScore = 0;
    let totalWeight = 0;

    wbsScoresMap.forEach((scores, wbsId) => {
      const weight = weightMap.get(wbsId) || 0;

      // 해당 WBS에 대한 모든 평가자의 평균 점수
      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // 정규화: (averageScore / maxRate) × 100 (하향평가는 0 ~ maxRate 범위)
      const normalizedScore = (averageScore / maxRate) * 100;

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
      `가중치 기반 2차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (피평가자: ${employeeId}, 평가자 수: ${evaluatorIds.length}, 평가기간: ${evaluationPeriodId})`,
    );

    return Math.round(finalScore * 100) / 100; // 소수점 2자리로 반올림
  } catch (error) {
    logger.error(
      `가중치 기반 2차 하향평가 점수 계산 실패: ${error.message}`,
      error.stack,
    );
    return null;
  }
}

/**
 * 평가기간의 등급 구간을 이용하여 점수에 해당하는 등급을 조회한다
 */
export async function 하향평가_등급을_조회한다(
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
      `하향평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${evaluationPeriodId})`,
    );

    return gradeMapping.finalGrade;
  } catch (error) {
    logger.error(`하향평가 등급 조회 실패: ${error.message}`, error.stack);
    return null;
  }
}
