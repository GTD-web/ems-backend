import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import type { DepartmentDto } from '../../../domain/common/department/department.types';
export declare class GetParentDepartmentQuery implements IQuery {
    readonly departmentId: string;
    constructor(departmentId: string);
}
export declare class GetParentDepartmentQueryHandler implements IQueryHandler<GetParentDepartmentQuery> {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    execute(query: GetParentDepartmentQuery): Promise<DepartmentDto | null>;
}
