import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';

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
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(query: GetUnassignedWbsItemsQuery): Promise<string[]> {
    const { projectId, periodId, employeeId } = query;
    const assignments = await this.wbsAssignmentService.필터_조회한다({
      projectId,
      periodId,
      employeeId,
    });
    const assignedWbsItemIds = assignments.map((a) => a.wbsItemId);

    // TODO: 실제 WbsItem 서비스에서 프로젝트의 전체 WBS 항목 목록을 조회하고
    // 할당된 WBS 항목 ID를 제외해야 함
    return assignedWbsItemIds; // 임시로 할당된 WBS 항목 ID 반환
  }
}
