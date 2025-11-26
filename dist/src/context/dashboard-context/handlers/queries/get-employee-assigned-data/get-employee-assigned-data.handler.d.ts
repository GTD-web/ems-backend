import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { ProjectSecondaryEvaluator } from '@domain/common/project/project-secondary-evaluator.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { EmployeeAssignedDataResult } from './types';
export declare class GetEmployeeAssignedDataQuery {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    constructor(evaluationPeriodId: string, employeeId: string);
}
export declare class GetEmployeeAssignedDataHandler implements IQueryHandler<GetEmployeeAssignedDataQuery, EmployeeAssignedDataResult> {
    private readonly evaluationPeriodRepository;
    private readonly employeeRepository;
    private readonly departmentRepository;
    private readonly mappingRepository;
    private readonly projectAssignmentRepository;
    private readonly projectSecondaryEvaluatorRepository;
    private readonly wbsAssignmentRepository;
    private readonly wbsItemRepository;
    private readonly criteriaRepository;
    private readonly selfEvaluationRepository;
    private readonly downwardEvaluationRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationLineMappingRepository;
    private readonly deliverableRepository;
    private readonly logger;
    constructor(evaluationPeriodRepository: Repository<EvaluationPeriod>, employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, projectAssignmentRepository: Repository<EvaluationProjectAssignment>, projectSecondaryEvaluatorRepository: Repository<ProjectSecondaryEvaluator>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsItemRepository: Repository<WbsItem>, criteriaRepository: Repository<WbsEvaluationCriteria>, selfEvaluationRepository: Repository<WbsSelfEvaluation>, downwardEvaluationRepository: Repository<DownwardEvaluation>, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, deliverableRepository: Repository<Deliverable>);
    execute(query: GetEmployeeAssignedDataQuery): Promise<EmployeeAssignedDataResult>;
}
