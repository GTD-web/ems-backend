import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';

/**
 * 산출물 삭제 커맨드
 */
export class DeleteDeliverableCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 산출물 삭제 핸들러
 */
@Injectable()
@CommandHandler(DeleteDeliverableCommand)
export class DeleteDeliverableHandler
  implements ICommandHandler<DeleteDeliverableCommand, void>
{
  private readonly logger = new Logger(DeleteDeliverableHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(command: DeleteDeliverableCommand): Promise<void> {
    this.logger.log(`산출물 삭제 시작 - ID: ${command.id}`);

    await this.deliverableService.삭제한다(command.id, command.deletedBy);

    this.logger.log(`산출물 삭제 완료 - ID: ${command.id}`);
  }
}

