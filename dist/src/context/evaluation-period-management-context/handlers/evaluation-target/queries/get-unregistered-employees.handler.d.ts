import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
export declare class GetUnregisteredEmployeesQuery {
    readonly evaluationPeriodId: string;
    constructor(evaluationPeriodId: string);
}
export interface UnregisteredEmployeeInfoDto {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    status: string;
    departmentId?: string;
    departmentName?: string;
    rankName?: string;
}
export declare class GetUnregisteredEmployeesHandler implements IQueryHandler<GetUnregisteredEmployeesQuery, {
    evaluationPeriodId: string;
    employees: UnregisteredEmployeeInfoDto[];
}> {
    private readonly mappingRepository;
    private readonly employeeRepository;
    constructor(mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, employeeRepository: Repository<Employee>);
    execute(query: GetUnregisteredEmployeesQuery): Promise<{
        evaluationPeriodId: string;
        employees: UnregisteredEmployeeInfoDto[];
    }>;
}
