import { Repository, IsNull } from 'typeorm';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { DownwardEvaluationStatus } from '../../../interfaces/dashboard-context.interface';
import {
  가중치_기반_1차_하향평가_점수를_계산한다,
  가중치_기반_2차_하향평가_점수를_계산한다,
  하향평가_등급을_조회한다,
} from './downward-evaluation-score.utils';

/**
 * 하향평가 상태를 조회한다
 * 평가라인에 지정된 1차, 2차 평가자의 하향평가 상태를 조회
 */
export async function 하향평가_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluationLineRepository: Repository<EvaluationLine>,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  periodRepository: Repository<EvaluationPeriod>,
): Promise<{
  primary: {
    evaluatorId: string | null;
    status: DownwardEvaluationStatus;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    totalScore: number | null;
    grade: string | null;
  };
  secondary: {
    evaluators: Array<{
      evaluatorId: string;
      status: DownwardEvaluationStatus;
      assignedWbsCount: number;
      completedEvaluationCount: number;
    }>;
    totalScore: number | null;
    grade: string | null;
  };
}> {
  // 1. PRIMARY 평가라인 조회
  const primaryLine = await evaluationLineRepository.findOne({
    where: {
      evaluatorType: EvaluatorType.PRIMARY,
      deletedAt: IsNull(),
    },
  });

  // 2. PRIMARY 평가자 조회
  let primaryEvaluatorId: string | null = null;
  if (primaryLine) {
    const primaryMapping = await evaluationLineMappingRepository.findOne({
      where: {
        employeeId: employeeId,
        evaluationLineId: primaryLine.id,
        deletedAt: IsNull(),
      },
    });
    if (primaryMapping) {
      primaryEvaluatorId = primaryMapping.evaluatorId;
    }
  }

  // 3. PRIMARY 평가자의 하향평가 상태 조회
  const primaryStatus = await 평가자별_하향평가_상태를_조회한다(
    evaluationPeriodId,
    employeeId,
    DownwardEvaluationType.PRIMARY,
    primaryEvaluatorId,
    downwardEvaluationRepository,
    wbsAssignmentRepository,
  );

  // 4. SECONDARY 평가라인 조회
  const secondaryLine = await evaluationLineRepository.findOne({
    where: {
      evaluatorType: EvaluatorType.SECONDARY,
      deletedAt: IsNull(),
    },
  });

  // 5. SECONDARY 평가자들 조회 (여러 명 가능)
  const secondaryEvaluators: string[] = [];
  if (secondaryLine) {
    const secondaryMappings = await evaluationLineMappingRepository.find({
      where: {
        employeeId: employeeId,
        evaluationLineId: secondaryLine.id,
        deletedAt: IsNull(),
      },
    });
    secondaryEvaluators.push(
      ...secondaryMappings.map((m) => m.evaluatorId).filter((id) => !!id),
    );
  }

  // 6. 각 SECONDARY 평가자별 하향평가 상태 조회
  const secondaryStatuses = await Promise.all(
    secondaryEvaluators.map(async (evaluatorId) => {
      const status = await 특정_평가자의_하향평가_상태를_조회한다(
        evaluationPeriodId,
        employeeId,
        evaluatorId,
        DownwardEvaluationType.SECONDARY,
        downwardEvaluationRepository,
        wbsAssignmentRepository,
      );
      return {
        evaluatorId,
        status: status.status,
        assignedWbsCount: status.assignedWbsCount,
        completedEvaluationCount: status.completedEvaluationCount,
      };
    }),
  );

  // 7. 2차 하향평가 가중치 기반 총점 및 등급 계산
  let secondaryTotalScore: number | null = null;
  let secondaryGrade: string | null = null;

  // 모든 2차 평가자의 평가가 완료되었는지 확인
  const allSecondaryEvaluationsCompleted = secondaryStatuses.every(
    (status) =>
      status.assignedWbsCount > 0 &&
      status.completedEvaluationCount === status.assignedWbsCount,
  );

  if (secondaryEvaluators.length > 0 && allSecondaryEvaluationsCompleted) {
    secondaryTotalScore = await 가중치_기반_2차_하향평가_점수를_계산한다(
      evaluationPeriodId,
      employeeId,
      secondaryEvaluators,
      downwardEvaluationRepository,
      wbsAssignmentRepository,
      periodRepository,
    );

    // 총점이 계산되었으면 등급 조회
    if (secondaryTotalScore !== null) {
      secondaryGrade = await 하향평가_등급을_조회한다(
        evaluationPeriodId,
        secondaryTotalScore,
        periodRepository,
      );
    }
  }

  // 8. 1차 하향평가 가중치 기반 총점 및 등급 계산
  let primaryTotalScore: number | null = null;
  let primaryGrade: string | null = null;

  // 모든 1차 하향평가가 완료된 경우에만 점수와 등급 계산
  if (
    primaryStatus.assignedWbsCount > 0 &&
    primaryStatus.completedEvaluationCount === primaryStatus.assignedWbsCount
  ) {
    primaryTotalScore = await 가중치_기반_1차_하향평가_점수를_계산한다(
      evaluationPeriodId,
      employeeId,
      primaryEvaluatorId,
      downwardEvaluationRepository,
      wbsAssignmentRepository,
      periodRepository,
    );

    // 총점이 계산되었으면 등급 조회
    if (primaryTotalScore !== null) {
      primaryGrade = await 하향평가_등급을_조회한다(
        evaluationPeriodId,
        primaryTotalScore,
        periodRepository,
      );
    }
  }

  return {
    primary: {
      evaluatorId: primaryEvaluatorId,
      status: primaryStatus.status,
      assignedWbsCount: primaryStatus.assignedWbsCount,
      completedEvaluationCount: primaryStatus.completedEvaluationCount,
      totalScore: primaryTotalScore,
      grade: primaryGrade,
    },
    secondary: {
      evaluators: secondaryStatuses,
      totalScore: secondaryTotalScore,
      grade: secondaryGrade,
    },
  };
}

/**
 * 특정 평가자 유형의 하향평가 상태를 조회한다 (평가자 ID 불특정)
 */
export async function 평가자별_하향평가_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluationType: DownwardEvaluationType,
  evaluatorId: string | null,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
): Promise<{
  status: DownwardEvaluationStatus;
  assignedWbsCount: number;
  completedEvaluationCount: number;
  averageScore: number | null;
}> {
  // 1. 피평가자에게 할당된 WBS 수 조회 (평가해야 할 WBS 개수)
  const assignedWbsCount = await wbsAssignmentRepository.count({
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

  const downwardEvaluations = await downwardEvaluationRepository.find({
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
export async function 특정_평가자의_하향평가_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorId: string,
  evaluationType: DownwardEvaluationType,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
): Promise<{
  status: DownwardEvaluationStatus;
  assignedWbsCount: number;
  completedEvaluationCount: number;
  averageScore: number | null;
}> {
  // 1. 피평가자에게 할당된 WBS 수 조회 (평가해야 할 WBS 개수)
  const assignedWbsCount = await wbsAssignmentRepository.count({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      deletedAt: IsNull(),
    },
  });

  // 2. 특정 평가자의 하향평가들 조회
  const downwardEvaluations = await downwardEvaluationRepository.find({
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
