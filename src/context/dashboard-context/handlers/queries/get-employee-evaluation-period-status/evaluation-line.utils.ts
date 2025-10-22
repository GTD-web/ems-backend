import { Repository, IsNull } from 'typeorm';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationLineStatus } from '../../../interfaces/dashboard-context.interface';

/**
 * 평가라인 지정 여부를 확인한다
 * PRIMARY와 SECONDARY 평가라인에 평가자가 지정되었는지 확인
 */
export async function 평가라인_지정_여부를_확인한다(
  employeeId: string,
  evaluationLineRepository: Repository<EvaluationLine>,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
): Promise<{ hasPrimaryEvaluator: boolean; hasSecondaryEvaluator: boolean }> {
  // PRIMARY 평가라인 조회
  const primaryLine = await evaluationLineRepository.findOne({
    where: {
      evaluatorType: EvaluatorType.PRIMARY,
      deletedAt: IsNull(),
    },
  });

  // SECONDARY 평가라인 조회
  const secondaryLine = await evaluationLineRepository.findOne({
    where: {
      evaluatorType: EvaluatorType.SECONDARY,
      deletedAt: IsNull(),
    },
  });

  let hasPrimaryEvaluator = false;
  let hasSecondaryEvaluator = false;

  // PRIMARY 평가라인에 평가자가 지정되었는지 확인
  if (primaryLine) {
    const primaryMapping = await evaluationLineMappingRepository.findOne({
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
    const secondaryMapping = await evaluationLineMappingRepository.findOne({
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
export function 평가라인_상태를_계산한다(
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
