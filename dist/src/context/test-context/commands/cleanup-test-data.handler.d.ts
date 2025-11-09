import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DepartmentTestService } from '../../../domain/common/department/department-test.service';
import { EmployeeTestService } from '../../../domain/common/employee/employee-test.service';
import { ProjectTestService } from '../../../domain/common/project/project-test.service';
import { WbsItemTestService } from '../../../domain/common/wbs-item/wbs-item-test.service';
import { EvaluationPeriod } from '../../../domain/core/evaluation-period/evaluation-period.entity';
export interface CleanupTestDataResult {
    departments: number;
    employees: number;
    projects: number;
    wbsItems: number;
    periods: number;
}
export declare class CleanupTestDataCommand implements ICommand {
}
export declare class CleanupTestDataHandler implements ICommandHandler<CleanupTestDataCommand, CleanupTestDataResult> {
    private readonly departmentTestService;
    private readonly employeeTestService;
    private readonly projectTestService;
    private readonly wbsItemTestService;
    private readonly evaluationPeriodRepository;
    constructor(departmentTestService: DepartmentTestService, employeeTestService: EmployeeTestService, projectTestService: ProjectTestService, wbsItemTestService: WbsItemTestService, evaluationPeriodRepository: Repository<EvaluationPeriod>);
    execute(command: CleanupTestDataCommand): Promise<CleanupTestDataResult>;
    private cleanupEvaluationPeriods;
}
