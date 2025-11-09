import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DepartmentTestService } from '../../../domain/common/department/department-test.service';
import { EmployeeTestService } from '../../../domain/common/employee/employee-test.service';
import { ProjectTestService } from '../../../domain/common/project/project-test.service';
import { WbsItemTestService } from '../../../domain/common/wbs-item/wbs-item-test.service';
import { EvaluationPeriod } from '../../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationProjectAssignment } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationLine } from '../../../domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DepartmentDto } from '../../../domain/common/department/department.types';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { ProjectDto } from '../../../domain/common/project/project.types';
import { WbsItemDto } from '../../../domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationWbsAssignmentDto } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export interface CompleteTestEnvironmentResult {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    periods: EvaluationPeriodDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
}
export declare class CreateCompleteTestEnvironmentCommand implements ICommand {
}
export declare class CreateCompleteTestEnvironmentHandler implements ICommandHandler<CreateCompleteTestEnvironmentCommand, CompleteTestEnvironmentResult> {
    private readonly departmentTestService;
    private readonly employeeTestService;
    private readonly projectTestService;
    private readonly wbsItemTestService;
    private readonly evaluationPeriodRepository;
    private readonly evaluationWbsAssignmentRepository;
    private readonly evaluationProjectAssignmentRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationLineMappingRepository;
    constructor(departmentTestService: DepartmentTestService, employeeTestService: EmployeeTestService, projectTestService: ProjectTestService, wbsItemTestService: WbsItemTestService, evaluationPeriodRepository: Repository<EvaluationPeriod>, evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>);
    execute(command: CreateCompleteTestEnvironmentCommand): Promise<CompleteTestEnvironmentResult>;
    private createEvaluationPeriods;
    private createWbsAssignments;
    private createEvaluationLines;
    private createEvaluationLineMappings;
}
