import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

/**
 * 산출물 수정 커맨드
 */
export class UpdateDeliverableCommand {
  constructor(
    public readonly id: string,
    public readonly updatedBy: string,
    public readonly name?: string,
    public readonly type?: DeliverableType,
    public readonly description?: string,
    public readonly filePath?: string,
    public readonly employeeId?: string,
    public readonly wbsItemId?: string,
    public readonly isActive?: boolean,
  ) {}
}

/**
 * 산출물 수정 핸들러
 */
@Injectable()
@CommandHandler(UpdateDeliverableCommand)
export class UpdateDeliverableHandler
  implements ICommandHandler<UpdateDeliverableCommand, Deliverable>
{
  private readonly logger = new Logger(UpdateDeliverableHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(command: UpdateDeliverableCommand): Promise<Deliverable> {
    this.logger.log(`산출물 수정 시작 - ID: ${command.id}`);

    const updatedDeliverable = await this.deliverableService.수정한다(
      command.id,
      {
        name: command.name,
        type: command.type,
        description: command.description,
        filePath: command.filePath,
        employeeId: command.employeeId,
        wbsItemId: command.wbsItemId,
        isActive: command.isActive,
      },
      command.updatedBy,
    );

    this.logger.log(`산출물 수정 완료 - ID: ${command.id}`);

    return updatedDeliverable;
  }
}
