import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';

/**
 * 산출물 데이터
 */
export interface BulkDeliverableData {
  name: string;
  type: DeliverableType;
  employeeId: string;
  wbsItemId: string;
  description?: string;
  filePath?: string;
}

/**
 * 산출물 벌크 생성 커맨드
 */
export class BulkCreateDeliverablesCommand {
  constructor(
    public readonly deliverables: BulkDeliverableData[],
    public readonly createdBy: string,
  ) {}
}

/**
 * 산출물 벌크 생성 핸들러
 */
@Injectable()
@CommandHandler(BulkCreateDeliverablesCommand)
export class BulkCreateDeliverablesHandler
  implements ICommandHandler<BulkCreateDeliverablesCommand, string[]>
{
  private readonly logger = new Logger(BulkCreateDeliverablesHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(command: BulkCreateDeliverablesCommand): Promise<string[]> {
    this.logger.log(
      `산출물 벌크 생성 시작 - 개수: ${command.deliverables.length}`,
    );

    const createdIds: string[] = [];

    for (const data of command.deliverables) {
      try {
        const deliverable = await this.deliverableService.생성한다({
          name: data.name,
          type: data.type,
          description: data.description,
          filePath: data.filePath,
          employeeId: data.employeeId,
          wbsItemId: data.wbsItemId,
          createdBy: command.createdBy,
        });

        createdIds.push(deliverable.id);
      } catch (error) {
        this.logger.error(`산출물 생성 실패 - 이름: ${data.name}`, error.stack);
        // 개별 실패는 로그만 남기고 계속 진행
      }
    }

    this.logger.log(
      `산출물 벌크 생성 완료 - 성공: ${createdIds.length}/${command.deliverables.length}`,
    );
    return createdIds;
  }
}

