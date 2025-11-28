import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import type { DepartmentHierarchyDto } from '../interfaces/organization-management-context.interface';
import { Repository } from 'typeorm';
import { Department } from '../../../domain/common/department/department.entity';
export declare class GetDepartmentHierarchyQuery implements IQuery {
}
export declare class GetDepartmentHierarchyQueryHandler implements IQueryHandler<GetDepartmentHierarchyQuery> {
    private readonly departmentService;
    private readonly departmentRepository;
    constructor(departmentService: DepartmentService, departmentRepository: Repository<Department>);
    execute(query: GetDepartmentHierarchyQuery): Promise<DepartmentHierarchyDto[]>;
    private calculateHierarchyInfo;
}
