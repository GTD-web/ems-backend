import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { DepartmentHierarchyWithEmployeesDto } from '../interfaces/organization-management-context.interface';
import { Repository } from 'typeorm';
import { Department } from '../../../domain/common/department/department.entity';
export declare class GetDepartmentHierarchyWithEmployeesQuery implements IQuery {
}
export declare class GetDepartmentHierarchyWithEmployeesQueryHandler implements IQueryHandler<GetDepartmentHierarchyWithEmployeesQuery> {
    private readonly departmentService;
    private readonly employeeService;
    private readonly departmentRepository;
    constructor(departmentService: DepartmentService, employeeService: EmployeeService, departmentRepository: Repository<Department>);
    execute(query: GetDepartmentHierarchyWithEmployeesQuery): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    private calculateHierarchyInfo;
}
