import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

/**
 * 할당되지 않은 WBS 항목 조회 쿼리
 */
export class GetUnassignedWbsItemsQuery {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
    public readonly employeeId?: string,
  ) {}
}

/**
 * 할당되지 않은 WBS 항목 조회 핸들러
 */
@QueryHandler(GetUnassignedWbsItemsQuery)
@Injectable()
export class GetUnassignedWbsItemsHandler
  implements IQueryHandler<GetUnassignedWbsItemsQuery>
{
  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  async execute(query: GetUnassignedWbsItemsQuery): Promise<WbsItemDto[]> {
    const { projectId, periodId, employeeId } = query;

    // 프로젝트의 모든 WBS 항목 조회 (전체 정보)
    const allWbsItems = await this.wbsItemRepository.find({
      where: {
        projectId,
        deletedAt: IsNull(),
      },
      order: {
        wbsCode: 'ASC',
      },
    });

    // 할당된 WBS 항목 조회
    const whereCondition: any = {
      projectId,
      periodId,
      deletedAt: IsNull(),
    };

    if (employeeId) {
      whereCondition.employeeId = employeeId;
    }

    const assignedWbsItems = await this.wbsAssignmentRepository.find({
      where: whereCondition,
      select: ['wbsItemId'],
    });

    const assignedWbsItemIds = new Set(
      assignedWbsItems.map((a) => a.wbsItemId),
    );

    // 할당되지 않은 WBS 항목 전체 정보 반환
    return allWbsItems
      .filter((item) => !assignedWbsItemIds.has(item.id))
      .map((item) => item.DTO로_변환한다());
  }
}
