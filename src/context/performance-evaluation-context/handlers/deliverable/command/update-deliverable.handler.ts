import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  DeliverableNotFoundException,
  DeliverableValidationException,
} from '@domain/core/deliverable/deliverable.exceptions';

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

  constructor(
    private readonly deliverableService: DeliverableService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  async execute(command: UpdateDeliverableCommand): Promise<Deliverable> {
    this.logger.log(`산출물 수정 시작 - ID: ${command.id}`);

    // 산출물 존재 여부 확인 (404 에러를 명확히 반환)
    const deliverable = await this.deliverableService.조회한다(command.id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(command.id);
    }

    // employeeId 변경 시 존재 여부 검증
    if (command.employeeId !== undefined) {
      const employee = await this.employeeRepository.findOne({
        where: { id: command.employeeId, deletedAt: IsNull() },
      });
      if (!employee) {
        throw new DeliverableValidationException(
          `직원 ID ${command.employeeId}에 해당하는 직원을 찾을 수 없습니다.`,
        );
      }
    }

    // wbsItemId 변경 시 존재 여부 검증
    if (command.wbsItemId !== undefined) {
      const wbsItem = await this.wbsItemRepository.findOne({
        where: { id: command.wbsItemId, deletedAt: IsNull() },
      });
      if (!wbsItem) {
        throw new DeliverableValidationException(
          `WBS 항목 ID ${command.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`,
        );
      }
    }

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
