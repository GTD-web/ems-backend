import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
export declare class GetEvaluatorsByPeriodQuery {
    readonly periodId: string;
    readonly type: 'primary' | 'secondary' | 'all';
    constructor(periodId: string, type: 'primary' | 'secondary' | 'all');
}
export interface EvaluatorInfo {
    evaluatorId: string;
    evaluatorName: string;
    departmentName: string;
    evaluatorType: 'primary' | 'secondary';
    evaluateeCount: number;
}
export interface EvaluatorsByPeriodResult {
    periodId: string;
    type: 'primary' | 'secondary' | 'all';
    evaluators: EvaluatorInfo[];
}
export declare class GetEvaluatorsByPeriodHandler implements IQueryHandler<GetEvaluatorsByPeriodQuery, EvaluatorsByPeriodResult> {
    private readonly evaluationLineMappingRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationWbsAssignmentRepository;
    private readonly employeeRepository;
    private readonly departmentRepository;
    private readonly logger;
    constructor(evaluationLineMappingRepository: Repository<EvaluationLineMapping>, evaluationLineRepository: Repository<EvaluationLine>, evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>, employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>);
    execute(query: GetEvaluatorsByPeriodQuery): Promise<EvaluatorsByPeriodResult>;
}
export declare class GetPrimaryEvaluatorsByPeriodQuery extends GetEvaluatorsByPeriodQuery {
    constructor(periodId: string);
}
export declare class GetPrimaryEvaluatorsByPeriodHandler extends GetEvaluatorsByPeriodHandler {
}
export interface PrimaryEvaluatorInfo extends EvaluatorInfo {
}
export interface PrimaryEvaluatorsByPeriodResult extends EvaluatorsByPeriodResult {
}
