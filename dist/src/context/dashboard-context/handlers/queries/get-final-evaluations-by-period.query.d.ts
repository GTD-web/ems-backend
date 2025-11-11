import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '../../../../domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '../../../../domain/common/employee/employee.entity';
import { EvaluationPeriodEmployeeMapping } from '../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriod } from '../../../../domain/core/evaluation-period/evaluation-period.entity';
export interface FinalEvaluationByPeriodResult {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    employeeEmail: string;
    departmentName: string | null;
    rankName: string | null;
    periodId: string;
    periodName: string;
    periodStartDate: Date;
    periodEndDate: Date | null;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments: string | null;
    isConfirmed: boolean;
    confirmedAt: Date | null;
    confirmedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class GetFinalEvaluationsByPeriodQuery {
    readonly evaluationPeriodId: string;
    constructor(evaluationPeriodId: string);
}
export declare class GetFinalEvaluationsByPeriodHandler implements IQueryHandler<GetFinalEvaluationsByPeriodQuery, FinalEvaluationByPeriodResult[]> {
    private readonly finalEvaluationRepository;
    private readonly employeeRepository;
    private readonly mappingRepository;
    private readonly evaluationPeriodRepository;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>, employeeRepository: Repository<Employee>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, evaluationPeriodRepository: Repository<EvaluationPeriod>);
    execute(query: GetFinalEvaluationsByPeriodQuery): Promise<FinalEvaluationByPeriodResult[]>;
}
