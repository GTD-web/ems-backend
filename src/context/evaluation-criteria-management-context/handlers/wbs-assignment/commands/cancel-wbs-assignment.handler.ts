import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';

/**
 * WBS 할당 취소 커맨드
 */
export class CancelWbsAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * WBS 할당 취소 핸들러
 *
 * 비즈니스 규칙:
 * - 할당이 존재하지 않을 경우 멱등성을 보장하기 위해 조용히 성공 처리
 * - 이미 삭제된 할당을 다시 삭제해도 에러를 발생시키지 않음
 */
@CommandHandler(CancelWbsAssignmentCommand)
@Injectable()
export class CancelWbsAssignmentHandler
  implements ICommandHandler<CancelWbsAssignmentCommand>
{
  private readonly logger = new Logger(CancelWbsAssignmentHandler.name);

  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(command: CancelWbsAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;

    // 1. 컨텍스트 레벨에서 할당 존재 여부 확인
    const assignment = await this.wbsAssignmentService.ID로_조회한다(id);

    // 2. 할당이 없으면 멱등성 보장을 위해 조용히 성공 처리
    if (!assignment) {
      this.logger.log(
        `WBS 할당을 찾을 수 없습니다. 이미 삭제된 것으로 간주합니다. - ID: ${id}`,
      );
      return; // 성공으로 처리
    }

    // 3. 할당이 존재하면 삭제 수행 (도메인 서비스에서는 에러를 던지지 않음)
    const employeeId = assignment.employeeId;
    const periodId = assignment.periodId;
    
    await this.wbsAssignmentService.삭제한다(id, cancelledBy);

    this.logger.log(`WBS 할당 취소 완료 - ID: ${id}`);
    
    // 4. 가중치 재계산
    await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(
      employeeId,
      periodId,
    );
  }
}
