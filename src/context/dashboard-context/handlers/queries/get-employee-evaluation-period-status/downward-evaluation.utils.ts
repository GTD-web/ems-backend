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
 * 하향평가 통합 상태를 계산한다
 * - 하향평가 진행 상태와 승인 상태를 통합하여 계산
 *
 * 계산 로직:
 * 1. 재작성 요청 관련 상태는 제출 여부와 상관없이 최우선 반환:
 *    - 승인 상태가 revision_requested이면 → revision_requested (제출 여부 무관, none/in_progress 상태에서도 가능)
 *    - 승인 상태가 revision_completed이면 → revision_completed (제출 여부 무관, none/in_progress 상태에서도 가능)
 * 2. 2차 평가자인 경우, 승인 상태가 approved이면 → approved (진행 상태와 무관하게 승인 상태 우선)
 * 3. 하향평가 진행 상태가 none이면 → none (승인 상태와 무관하게 진행 상태 우선)
 * 4. 하향평가 진행 상태가 in_progress이면 → in_progress (승인 상태와 무관하게 진행 상태 우선)
 * 5. 하향평가 진행 상태가 complete일 때만 승인 상태 반환:
 *    - 승인 상태가 approved이면 → approved
 *    - 승인 상태가 pending이면 → pending
 *    - 승인 상태가 없으면 → pending (기본값)
 */
export function 하향평가_통합_상태를_계산한다(
  downwardStatus: DownwardEvaluationStatus,
  approvalStatus:
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed',
  evaluationType?: 'primary' | 'secondary',
):
  | DownwardEvaluationStatus
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

  // 2. 2차 평가자인 경우, 승인 상태가 approved이면 → approved (진행 상태와 무관하게 승인 상태 우선)
  if (evaluationType === 'secondary' && approvalStatus === 'approved') {
    return 'approved';
  }

  // 3. 하향평가 진행 상태가 none이면 → none (승인 상태와 무관하게 진행 상태 우선)
  if (downwardStatus === 'none') {
    return 'none';
  }

  // 4. 하향평가 진행 상태가 in_progress이면 → in_progress (승인 상태와 무관하게 진행 상태 우선)
  if (downwardStatus === 'in_progress') {
    return 'in_progress';
  }

  // 5. 하향평가 진행 상태가 complete일 때만 승인 상태 반환
  // downwardStatus === 'complete'
  // 승인 상태가 approved이면 → approved
  if (approvalStatus === 'approved') {
    return 'approved';
  }

  // 승인 상태가 pending이면 → pending
  // 승인 상태가 없으면 기본값으로 pending 반환
  return approvalStatus || 'pending';
}

/**
 * 2차 평가 전체 상태를 계산한다
 * - 여러 평가자의 상태를 통합하여 전체 상태를 계산
 *
 * 계산 로직:
 * 1. 평가자가 없거나 모두 none인 경우 → none
 * 2. 재작성 요청 관련 상태는 제출 여부와 상관없이 우선 반환:
 *    - revision_requested가 하나라도 있으면 → revision_requested (최우선, 제출 여부 무관)
 *    - revision_completed가 하나라도 있으면 → revision_completed (제출 여부 무관)
 * 3. 하나라도 none이 아니고 in_progress 이상인 상태가 있는 경우 → in_progress
 * 4. 모두 complete 이상인 경우:
 *    - 모두 pending인 경우 → pending
 *    - 모두 approved인 경우 → approved
 *    - 혼합 상태 (pending + approved 등) → in_progress (진행중)
 */
export function 이차평가_전체_상태를_계산한다(
  evaluatorStatuses: Array<
    | DownwardEvaluationStatus
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed'
  >,
):
  | DownwardEvaluationStatus
  | 'pending'
  | 'approved'
  | 'revision_requested'
  | 'revision_completed' {
  // 1. 평가자가 없거나 모두 none인 경우
  if (
    evaluatorStatuses.length === 0 ||
    evaluatorStatuses.every((s) => s === 'none')
  ) {
    return 'none';
  }

  // 2. 재작성 요청 관련 상태는 제출 여부와 상관없이 우선 반환
  // revision_completed가 하나라도 있으면 우선 반환 (완료된 것이 우선)
  // revision_requested + revision_completed 혼합 시 revision_completed 반환
  if (evaluatorStatuses.some((s) => s === 'revision_completed')) {
    return 'revision_completed';
  }
  // revision_requested가 하나라도 있으면 반환 (제출 여부 무관)
  if (evaluatorStatuses.some((s) => s === 'revision_requested')) {
    return 'revision_requested';
  }

  // 3. pending이 하나라도 있으면 pending 반환 (in_progress + pending 등)
  // pending은 승인 대기 상태이므로 우선적으로 반환
  if (evaluatorStatuses.some((s) => s === 'pending')) {
    return 'pending';
  }

  // 4. 하나라도 none이 아니고 in_progress 이상인 상태가 있는 경우
  const hasInProgress = evaluatorStatuses.some(
    (s) => s === 'in_progress' || s === 'complete',
  );
  if (
    hasInProgress &&
    evaluatorStatuses.some((s) => s === 'none' || s === 'in_progress')
  ) {
    return 'in_progress';
  }

  // 5. 모두 complete 이상인 경우 (none, in_progress 없음)
  const allCompleteOrAbove = evaluatorStatuses.every(
    (s) => s === 'complete' || s === 'pending' || s === 'approved',
  );

  if (allCompleteOrAbove) {
    // 모두 pending인 경우
    if (evaluatorStatuses.every((s) => s === 'pending')) {
      return 'pending';
    }
    // 모두 approved인 경우
    if (evaluatorStatuses.every((s) => s === 'approved')) {
      return 'approved';
    }
    // 혼합 상태 (pending + approved 등) → pending 반환 (하나라도 pending이면 pending)
    // pending이 하나라도 있으면 전체 상태는 pending
    if (evaluatorStatuses.some((s) => s === 'pending')) {
      return 'pending';
    }
    // 그 외 혼합 상태 → in_progress 반환 (진행중)
    return 'in_progress';
  }

  // 6. 기본값: in_progress
  return 'in_progress';
}

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
  employeeRepository?: Repository<any>, // Employee 엔티티를 위한 Repository
): Promise<{
  primary: {
    evaluator: {
      id: string;
      name: string;
      employeeNumber: string;
      email: string;
      departmentName?: string;
      rankName?: string;
    } | null;
    status: DownwardEvaluationStatus;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
    totalScore: number | null;
    grade: string | null;
  };
  secondary: {
    evaluators: Array<{
      evaluator: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentName?: string;
        rankName?: string;
      };
      status: DownwardEvaluationStatus;
      assignedWbsCount: number;
      completedEvaluationCount: number;
      isSubmitted: boolean;
    }>;
    isSubmitted: boolean; // 모든 2차 평가자가 제출했는지 통합 상태
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
  // 1차 평가자는 직원별 고정 담당자이므로 wbsItemId가 null인 매핑만 조회
  // 평가자 교체를 고려하여 현재 매핑된 모든 평가자 조회
  const primaryEvaluators: string[] = [];
  if (primaryLine) {
    const primaryMappings = await evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.evaluationLineId = :lineId', {
        lineId: primaryLine.id,
      })
      .andWhere('mapping.wbsItemId IS NULL') // 1차 평가자는 WBS와 무관하므로 null
      .andWhere('mapping.deletedAt IS NULL')
      .orderBy('mapping.createdAt', 'ASC')
      .getMany();

    // 중복된 evaluatorId 제거
    const uniqueEvaluatorIds = [
      ...new Set(
        primaryMappings.map((m) => m.evaluatorId).filter((id) => !!id),
      ),
    ];
    primaryEvaluators.push(...uniqueEvaluatorIds);
  }

  // 대표 평가자 ID (첫 번째 평가자, 하위 호환성 유지)
  const primaryEvaluatorId =
    primaryEvaluators.length > 0 ? primaryEvaluators[0] : null;

  // 3. PRIMARY 평가자의 하향평가 상태 조회
  const primaryStatus = await 평가자별_하향평가_상태를_조회한다(
    evaluationPeriodId,
    employeeId,
    DownwardEvaluationType.PRIMARY,
    primaryEvaluatorId,
    downwardEvaluationRepository,
    wbsAssignmentRepository,
  );

  // 3-1. PRIMARY 평가자 정보 조회
  let primaryEvaluatorInfo: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
  } | null = null;
  if (primaryEvaluatorId && employeeRepository) {
    const evaluator = await employeeRepository.findOne({
      where: { id: primaryEvaluatorId, deletedAt: IsNull() },
      select: [
        'id',
        'name',
        'employeeNumber',
        'email',
        'departmentName',
        'rankName',
      ],
    });
    if (evaluator) {
      primaryEvaluatorInfo = {
        id: evaluator.id,
        name: evaluator.name,
        employeeNumber: evaluator.employeeNumber,
        email: evaluator.email,
        departmentName: evaluator.departmentName || undefined,
        rankName: evaluator.rankName || undefined,
      };
    }
  }

  // 4. SECONDARY 평가라인 조회
  const secondaryLine = await evaluationLineRepository.findOne({
    where: {
      evaluatorType: EvaluatorType.SECONDARY,
      deletedAt: IsNull(),
    },
  });

  // 5. SECONDARY 평가자들 조회 (여러 명 가능)
  // 한 직원이 여러 WBS를 가질 경우, 여러 평가라인 매핑이 존재할 수 있음
  // 중복 제거하여 고유한 평가자 ID 목록을 반환
  const secondaryEvaluators: string[] = [];
  if (secondaryLine) {
    const secondaryMappings = await evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.evaluationLineId = :lineId', {
        lineId: secondaryLine.id,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .orderBy('mapping.createdAt', 'ASC')
      .getMany();

    // 중복된 evaluatorId 제거
    const uniqueEvaluatorIds = [
      ...new Set(
        secondaryMappings.map((m) => m.evaluatorId).filter((id) => !!id),
      ),
    ];
    secondaryEvaluators.push(...uniqueEvaluatorIds);
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
        evaluationLineMappingRepository,
        evaluationLineRepository,
      );

      // 평가자 정보 조회
      let evaluatorInfo: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentName?: string;
        rankName?: string;
      } | null = null;
      if (employeeRepository) {
        const evaluator = await employeeRepository.findOne({
          where: { id: evaluatorId, deletedAt: IsNull() },
          select: [
            'id',
            'name',
            'employeeNumber',
            'email',
            'departmentName',
            'rankName',
          ],
        });
        if (evaluator) {
          evaluatorInfo = {
            id: evaluator.id,
            name: evaluator.name,
            employeeNumber: evaluator.employeeNumber,
            email: evaluator.email,
            departmentName: evaluator.departmentName || undefined,
            rankName: evaluator.rankName || undefined,
          };
        }
      }

      return {
        evaluator: evaluatorInfo || {
          id: evaluatorId,
          name: '알 수 없음',
          employeeNumber: 'N/A',
          email: 'N/A',
          departmentName: undefined,
          rankName: undefined,
        },
        status: status.status,
        assignedWbsCount: status.assignedWbsCount,
        completedEvaluationCount: status.completedEvaluationCount,
        isSubmitted: status.isSubmitted,
      };
    }),
  );

  // 7. 2차 하향평가 가중치 기반 총점 및 등급 계산
  let secondaryTotalScore: number | null = null;
  let secondaryGrade: string | null = null;

  // 모든 2차 평가자의 평가가 완료되었는지 확인
  // 할당된 것보다 완료한 것이 많아도 완료 처리
  const allSecondaryEvaluationsCompleted = secondaryStatuses.every(
    (status) =>
      status.assignedWbsCount > 0 &&
      status.completedEvaluationCount >= status.assignedWbsCount,
  );

  // 모든 2차 평가자가 제출했는지 확인
  const allSecondaryEvaluationsSubmitted = secondaryStatuses.every(
    (status) => status.isSubmitted,
  );

  // 모든 평가자가 완료되고 제출했을 때만 스코어 계산
  if (
    secondaryEvaluators.length > 0 &&
    allSecondaryEvaluationsCompleted &&
    allSecondaryEvaluationsSubmitted
  ) {
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
      primaryEvaluators, // 현재 평가라인에 있는 모든 평가자
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

  // 2차 평가 통합 제출 상태 계산 (모든 평가자가 제출했는지 확인)
  const secondaryIsSubmitted =
    secondaryStatuses.length > 0 &&
    secondaryStatuses.every((status) => status.isSubmitted);

  return {
    primary: {
      evaluator: primaryEvaluatorInfo,
      status: primaryStatus.status,
      assignedWbsCount: primaryStatus.assignedWbsCount,
      completedEvaluationCount: primaryStatus.completedEvaluationCount,
      isSubmitted: primaryStatus.isSubmitted,
      totalScore: primaryTotalScore,
      grade: primaryGrade,
    },
    secondary: {
      evaluators: secondaryStatuses,
      isSubmitted: secondaryIsSubmitted,
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
  isSubmitted: boolean;
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

  // 6. 제출 여부 계산
  // 할당된 WBS가 있고, 완료된 평가 수가 할당된 WBS 수 이상이면 제출 완료
  // 할당된 것보다 완료한 것이 많아도 제출 처리
  const isSubmitted =
    assignedWbsCount > 0 &&
    completedEvaluationCount >= assignedWbsCount &&
    completedEvaluationCount > 0;

  return {
    status,
    assignedWbsCount,
    completedEvaluationCount,
    isSubmitted,
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
  evaluationLineMappingRepository?: Repository<EvaluationLineMapping>,
  evaluationLineRepository?: Repository<EvaluationLine>,
): Promise<{
  status: DownwardEvaluationStatus;
  assignedWbsCount: number;
  completedEvaluationCount: number;
  isSubmitted: boolean;
  averageScore: number | null;
}> {
  // 1. 평가자에게 할당된 WBS 수 조회
  let assignedWbsCount: number;

  if (evaluationType === DownwardEvaluationType.SECONDARY) {
    // 2차 평가자의 경우: EvaluationLineMapping에서 해당 평가자에게 할당된 WBS 수 조회
    if (!evaluationLineMappingRepository || !evaluationLineRepository) {
      throw new Error(
        'evaluationLineMappingRepository와 evaluationLineRepository가 필요합니다.',
      );
    }

    // SECONDARY 평가라인 조회
    const secondaryLine = await evaluationLineRepository.findOne({
      where: {
        evaluatorType: EvaluatorType.SECONDARY,
        deletedAt: IsNull(),
      },
    });

    if (!secondaryLine) {
      assignedWbsCount = 0;
    } else {
      // 해당 평가자에게 할당된 WBS 매핑 조회
      const assignedMappings = await evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .select(['mapping.id', 'mapping.wbsItemId'])
        .leftJoin(
          EvaluationLine,
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('line.evaluatorType = :evaluatorType', {
          evaluatorType: EvaluatorType.SECONDARY,
        })
        .andWhere('mapping.deletedAt IS NULL')
        .andWhere('mapping.wbsItemId IS NOT NULL') // wbsItemId가 있는 것만 조회
        .getRawMany();

      assignedWbsCount = assignedMappings.length;
    }
  } else {
    // 1차 평가자의 경우: 피평가자에게 할당된 전체 WBS 수 조회
    assignedWbsCount = await wbsAssignmentRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });
  }

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

  // 6. 제출 여부 계산
  // 할당된 WBS가 있고, 완료된 평가 수가 할당된 WBS 수 이상이면 제출 완료
  // 할당된 것보다 완료한 것이 많아도 제출 처리
  const isSubmitted =
    assignedWbsCount > 0 &&
    completedEvaluationCount >= assignedWbsCount &&
    completedEvaluationCount > 0;

  return {
    status,
    assignedWbsCount,
    completedEvaluationCount,
    isSubmitted,
    averageScore,
  };
}
