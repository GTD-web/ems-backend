import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import type { DepartmentDto } from '../../../domain/common/department/department.types';
export declare class GetSubDepartmentsQuery implements IQuery {
    readonly departmentId: string;
    constructor(departmentId: string);
}
export declare class GetSubDepartmentsQueryHandler implements IQueryHandler<GetSubDepartmentsQuery> {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    execute(query: GetSubDepartmentsQuery): Promise<DepartmentDto[]>;
}
