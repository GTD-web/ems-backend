import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { DeliverableValidationException } from '@domain/core/deliverable/deliverable.exceptions';

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

  constructor(
    private readonly deliverableService: DeliverableService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  async execute(command: CreateDeliverableCommand): Promise<Deliverable> {
    this.logger.log(
      `산출물 생성 시작 - 이름: ${command.name}, 직원: ${command.employeeId}`,
    );

    // 직원 존재 여부 검증
    const employee = await this.employeeRepository.findOne({
      where: { id: command.employeeId, deletedAt: IsNull() },
    });
    if (!employee) {
      throw new DeliverableValidationException(
        `직원 ID ${command.employeeId}에 해당하는 직원을 찾을 수 없습니다.`,
      );
    }

    // WBS 항목 존재 여부 검증
    const wbsItem = await this.wbsItemRepository.findOne({
      where: { id: command.wbsItemId, deletedAt: IsNull() },
    });
    if (!wbsItem) {
      throw new DeliverableValidationException(
        `WBS 항목 ID ${command.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`,
      );
    }

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
