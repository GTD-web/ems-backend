import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsItemService } from '../../../../../domain/common/wbs-item/wbs-item.service';
import { WbsItemStatus } from '../../../../../domain/common/wbs-item/wbs-item.types';
import type { WbsItemDto } from '../../../../../domain/common/wbs-item/wbs-item.types';

/**
 * WBS 항목 수정 커맨드
 */
export class UpdateWbsItemCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      title?: string;
      status?: WbsItemStatus;
      startDate?: Date;
      endDate?: Date;
      progressPercentage?: number;
    },
    public readonly updatedBy: string,
  ) {}
}

/**
 * WBS 항목 수정 결과
 */
export interface UpdateWbsItemResult {
  wbsItem: WbsItemDto;
}

/**
 * WBS 항목 수정 커맨드 핸들러
 */
@CommandHandler(UpdateWbsItemCommand)
export class UpdateWbsItemHandler
  implements ICommandHandler<UpdateWbsItemCommand, UpdateWbsItemResult>
{
  private readonly logger = new Logger(UpdateWbsItemHandler.name);

  constructor(private readonly wbsItemService: WbsItemService) {}

  async execute(
    command: UpdateWbsItemCommand,
  ): Promise<UpdateWbsItemResult> {
    const { id, data, updatedBy } = command;

    this.logger.log('WBS 항목 수정 시작', {
      wbsItemId: id,
      updateData: data,
    });

    try {
      const wbsItem = await this.wbsItemService.수정한다(id, data, updatedBy);

      this.logger.log('WBS 항목 수정 완료', {
        wbsItemId: id,
        updatedFields: Object.keys(data),
      });

      return {
        wbsItem,
      };
    } catch (error) {
      this.logger.error('WBS 항목 수정 실패', {
        error: error.message,
        wbsItemId: id,
      });
      throw error;
    }
  }
}
