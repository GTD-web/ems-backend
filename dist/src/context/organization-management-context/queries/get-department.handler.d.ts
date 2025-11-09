import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import type { DepartmentDto } from '../../../domain/common/department/department.types';
export declare class GetDepartmentQuery implements IQuery {
    readonly departmentId: string;
    constructor(departmentId: string);
}
export declare class GetDepartmentQueryHandler implements IQueryHandler<GetDepartmentQuery> {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    execute(query: GetDepartmentQuery): Promise<DepartmentDto | null>;
}
