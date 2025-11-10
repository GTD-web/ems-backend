import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';

/**
 * 모든 산출물 삭제 커맨드
 */
export class DeleteAllDeliverablesCommand {
  constructor(public readonly deletedBy: string) {}
}

/**
 * 모든 산출물 삭제 결과
 */
export interface DeleteAllDeliverablesResult {
  successCount: number;
  failedCount: number;
  failedIds: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * 모든 산출물 삭제 핸들러
 */
@Injectable()
@CommandHandler(DeleteAllDeliverablesCommand)
export class DeleteAllDeliverablesHandler
  implements
    ICommandHandler<DeleteAllDeliverablesCommand, DeleteAllDeliverablesResult>
{
  private readonly logger = new Logger(DeleteAllDeliverablesHandler.name);

  constructor(
    private readonly deliverableService: DeliverableService,
    @InjectRepository(Deliverable)
    private readonly deliverableRepository: Repository<Deliverable>,
  ) {}

  async execute(
    command: DeleteAllDeliverablesCommand,
  ): Promise<DeleteAllDeliverablesResult> {
    this.logger.log('모든 산출물 삭제 시작');

    const result: DeleteAllDeliverablesResult = {
      successCount: 0,
      failedCount: 0,
      failedIds: [],
    };

    try {
      // 삭제되지 않은 모든 산출물 조회
      const allDeliverables = await this.deliverableRepository.find({
        where: {
          deletedAt: IsNull(),
        },
      });

      this.logger.log(`조회된 산출물 개수: ${allDeliverables.length}`);

      if (allDeliverables.length === 0) {
        this.logger.log('삭제할 산출물이 없습니다.');
        return result;
      }

      // 각 산출물 삭제 처리
      for (const deliverable of allDeliverables) {
        try {
          await this.deliverableService.삭제한다(
            deliverable.id,
            command.deletedBy,
          );
          result.successCount++;
        } catch (error) {
          this.logger.error(
            `산출물 삭제 실패 - ID: ${deliverable.id}`,
            error.stack,
          );
          result.failedCount++;
          result.failedIds.push({
            id: deliverable.id,
            error: error.message || 'Deletion failed',
          });
        }
      }

      this.logger.log(
        `모든 산출물 삭제 완료 - 성공: ${result.successCount}, 실패: ${result.failedCount}`,
      );
    } catch (error) {
      this.logger.error('모든 산출물 삭제 중 오류 발생', error.stack);
      throw error;
    }

    return result;
  }
}


