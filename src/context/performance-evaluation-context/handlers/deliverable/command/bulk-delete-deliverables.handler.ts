import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';

/**
 * 산출물 벌크 삭제 커맨드
 */
export class BulkDeleteDeliverablesCommand {
  constructor(
    public readonly deliverableIds: string[],
    public readonly deletedBy: string,
  ) {}
}

/**
 * 산출물 벌크 삭제 결과
 */
export interface BulkDeleteResult {
  successCount: number;
  failedCount: number;
  failedIds: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * 산출물 벌크 삭제 핸들러
 */
@Injectable()
@CommandHandler(BulkDeleteDeliverablesCommand)
export class BulkDeleteDeliverablesHandler
  implements ICommandHandler<BulkDeleteDeliverablesCommand, BulkDeleteResult>
{
  private readonly logger = new Logger(BulkDeleteDeliverablesHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(
    command: BulkDeleteDeliverablesCommand,
  ): Promise<BulkDeleteResult> {
    this.logger.log(
      `산출물 벌크 삭제 시작 - 개수: ${command.deliverableIds.length}`,
    );

    const result: BulkDeleteResult = {
      successCount: 0,
      failedCount: 0,
      failedIds: [],
    };

    for (const id of command.deliverableIds) {
      try {
        // ID 형식 검증 (string이어야 함)
        if (!id || typeof id !== 'string') {
          throw new Error(`잘못된 ID 형식입니다: ${id}`);
        }

        await this.deliverableService.삭제한다(id, command.deletedBy);
        result.successCount++;
      } catch (error) {
        this.logger.error(`산출물 삭제 실패 - ID: ${id}`, error.stack);
        result.failedCount++;
        result.failedIds.push({
          id: String(id),
          error: error.message || 'Deletion failed',
        });
      }
    }

    this.logger.log(
      `산출물 벌크 삭제 완료 - 성공: ${result.successCount}, 실패: ${result.failedCount}`,
    );
    return result;
  }
}

