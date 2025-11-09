import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import type { DepartmentDto } from '../../../domain/common/department/department.types';
export declare class GetAllDepartmentsQuery implements IQuery {
}
export declare class GetAllDepartmentsQueryHandler implements IQueryHandler<GetAllDepartmentsQuery> {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    execute(query: GetAllDepartmentsQuery): Promise<DepartmentDto[]>;
}
