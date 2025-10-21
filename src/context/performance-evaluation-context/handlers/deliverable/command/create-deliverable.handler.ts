import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

/**
 * 산출물 생성 커맨드
 */
export class CreateDeliverableCommand {
  constructor(
    public readonly name: string,
    public readonly type: DeliverableType,
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly description?: string,
    public readonly filePath?: string,
    public readonly createdBy?: string,
  ) {}
}

/**
 * 산출물 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateDeliverableCommand)
export class CreateDeliverableHandler
  implements ICommandHandler<CreateDeliverableCommand, Deliverable>
{
  private readonly logger = new Logger(CreateDeliverableHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(command: CreateDeliverableCommand): Promise<Deliverable> {
    this.logger.log(
      `산출물 생성 시작 - 이름: ${command.name}, 직원: ${command.employeeId}`,
    );

    const deliverable = await this.deliverableService.생성한다({
      name: command.name,
      type: command.type,
      description: command.description,
      filePath: command.filePath,
      employeeId: command.employeeId,
      wbsItemId: command.wbsItemId,
      createdBy: command.createdBy || command.employeeId,
    });

    this.logger.log(`산출물 생성 완료 - ID: ${deliverable.id}`);
    return deliverable;
  }
}
