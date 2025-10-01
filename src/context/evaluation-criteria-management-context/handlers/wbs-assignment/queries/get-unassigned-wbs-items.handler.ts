import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

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

  async execute(query: GetUnassignedWbsItemsQuery): Promise<string[]> {
    const { projectId, periodId, employeeId } = query;

    // 프로젝트의 모든 WBS 항목 조회
    const allWbsItems = await this.wbsItemRepository.find({
      where: {
        projectId,
        deletedAt: IsNull(),
      },
      select: ['id'],
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

    const assignedWbsItemIds = assignedWbsItems.map((a) => a.wbsItemId);
    const allWbsItemIds = allWbsItems.map((item) => item.id);

    // 할당되지 않은 WBS 항목 ID 반환
    return allWbsItemIds.filter((id) => !assignedWbsItemIds.includes(id));
  }
}
