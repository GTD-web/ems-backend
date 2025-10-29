import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsItemService } from '../../../../../domain/common/wbs-item/wbs-item.service';
import { WbsItemStatus } from '../../../../../domain/common/wbs-item/wbs-item.types';
import type { WbsItemDto } from '../../../../../domain/common/wbs-item/wbs-item.types';

/**
 * WBS 항목 생성 커맨드
 */
export class CreateWbsItemCommand {
  constructor(
    public readonly data: {
      wbsCode: string;
      title: string;
      status: WbsItemStatus;
      level: number;
      assignedToId?: string;
      projectId: string;
      parentWbsId?: string;
      startDate?: Date;
      endDate?: Date;
      progressPercentage?: number;
    },
    public readonly createdBy: string,
  ) {}
}

/**
 * WBS 항목 생성 결과
 */
export interface CreateWbsItemResult {
  wbsItem: WbsItemDto;
}

/**
 * WBS 항목 생성 커맨드 핸들러
 */
@CommandHandler(CreateWbsItemCommand)
export class CreateWbsItemHandler
  implements ICommandHandler<CreateWbsItemCommand, CreateWbsItemResult>
{
  private readonly logger = new Logger(CreateWbsItemHandler.name);

  constructor(private readonly wbsItemService: WbsItemService) {}

  async execute(
    command: CreateWbsItemCommand,
  ): Promise<CreateWbsItemResult> {
    const { data, createdBy } = command;

    this.logger.log('WBS 항목 생성 시작', {
      wbsCode: data.wbsCode,
      title: data.title,
      projectId: data.projectId,
    });

    try {
      const wbsItem = await this.wbsItemService.생성한다(data, createdBy);

      this.logger.log('WBS 항목 생성 완료', {
        wbsItemId: wbsItem.id,
        wbsCode: wbsItem.wbsCode,
      });

      return {
        wbsItem,
      };
    } catch (error) {
      this.logger.error('WBS 항목 생성 실패', {
        error: error.message,
        wbsCode: data.wbsCode,
        projectId: data.projectId,
      });
      throw error;
    }
  }
}
