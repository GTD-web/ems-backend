import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import type { DepartmentHierarchyDto } from '../interfaces/organization-management-context.interface';
export declare class GetDepartmentHierarchyQuery implements IQuery {
}
export declare class GetDepartmentHierarchyQueryHandler implements IQueryHandler<GetDepartmentHierarchyQuery> {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    execute(query: GetDepartmentHierarchyQuery): Promise<DepartmentHierarchyDto[]>;
    private calculateHierarchyInfo;
}
