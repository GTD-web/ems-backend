import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  DeliverableValidationException,
  DeliverableDomainException,
} from '@domain/core/deliverable/deliverable.exceptions';

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
 * 산출물 벌크 생성 결과
 */
export interface BulkCreateResult {
  successCount: number;
  failedCount: number;
  createdIds: string[];
  failedItems: Array<{
    data: Partial<BulkDeliverableData>;
    error: string;
  }>;
}

/**
 * 산출물 벌크 생성 핸들러
 */
@Injectable()
@CommandHandler(BulkCreateDeliverablesCommand)
export class BulkCreateDeliverablesHandler
  implements ICommandHandler<BulkCreateDeliverablesCommand, BulkCreateResult>
{
  private readonly logger = new Logger(BulkCreateDeliverablesHandler.name);

  constructor(
    private readonly deliverableService: DeliverableService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  async execute(
    command: BulkCreateDeliverablesCommand,
  ): Promise<BulkCreateResult> {
    this.logger.log(
      `산출물 벌크 생성 시작 - 개수: ${command.deliverables.length}`,
    );

    const result: BulkCreateResult = {
      successCount: 0,
      failedCount: 0,
      createdIds: [],
      failedItems: [],
    };

    for (const data of command.deliverables) {
      try {
        // 개별 항목 검증
        // name 필수 검증
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
          throw new DeliverableValidationException('산출물명은 필수입니다.');
        }

        // type 필수 검증 및 enum 검증
        if (!data.type || typeof data.type !== 'string') {
          throw new DeliverableValidationException('산출물 유형은 필수입니다.');
        }

        if (!Object.values(DeliverableType).includes(data.type as DeliverableType)) {
          throw new DeliverableValidationException(
            `산출물 유형이 올바르지 않습니다: ${data.type}. 허용되는 값: ${Object.values(DeliverableType).join(', ')}`,
          );
        }

        // employeeId UUID 검증
        if (!data.employeeId || typeof data.employeeId !== 'string') {
          throw new DeliverableValidationException('직원 ID는 필수입니다.');
        }

        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.employeeId)) {
          throw new DeliverableValidationException(
            `직원 ID는 올바른 UUID 형식이어야 합니다: ${data.employeeId}`,
          );
        }

        // wbsItemId UUID 검증
        if (!data.wbsItemId || typeof data.wbsItemId !== 'string') {
          throw new DeliverableValidationException('WBS 항목 ID는 필수입니다.');
        }

        if (!uuidRegex.test(data.wbsItemId)) {
          throw new DeliverableValidationException(
            `WBS 항목 ID는 올바른 UUID 형식이어야 합니다: ${data.wbsItemId}`,
          );
        }

        // 직원 존재 여부 검증
        const employee = await this.employeeRepository.findOne({
          where: { id: data.employeeId, deletedAt: IsNull() },
        });
        if (!employee) {
          throw new DeliverableValidationException(
            `직원 ID ${data.employeeId}에 해당하는 직원을 찾을 수 없습니다.`,
          );
        }

        // WBS 항목 존재 여부 검증
        const wbsItem = await this.wbsItemRepository.findOne({
          where: { id: data.wbsItemId, deletedAt: IsNull() },
        });
        if (!wbsItem) {
          throw new DeliverableValidationException(
            `WBS 항목 ID ${data.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`,
          );
        }

        const deliverable = await this.deliverableService.생성한다({
          name: data.name,
          type: data.type,
          description: data.description,
          filePath: data.filePath,
          employeeId: data.employeeId,
          wbsItemId: data.wbsItemId,
          createdBy: command.createdBy,
        });

        result.createdIds.push(deliverable.id);
        result.successCount++;
      } catch (error) {
        this.logger.error(`산출물 생성 실패 - 이름: ${data.name}`, error.stack);
        result.failedCount++;
        result.failedItems.push({
          data: {
            name: data.name,
            type: data.type,
            employeeId: data.employeeId,
            wbsItemId: data.wbsItemId,
            description: data.description,
            filePath: data.filePath,
          },
          error: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(
      `산출물 벌크 생성 완료 - 성공: ${result.successCount}, 실패: ${result.failedCount}`,
    );
    return result;
  }
}

