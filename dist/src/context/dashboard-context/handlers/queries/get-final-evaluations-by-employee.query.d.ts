import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '../../../../domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '../../../../domain/common/employee/employee.entity';
import { EvaluationPeriod } from '../../../../domain/core/evaluation-period/evaluation-period.entity';
export interface FinalEvaluationByEmployeeResult {
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
export declare class GetFinalEvaluationsByEmployeeQuery {
    readonly employeeId: string;
    readonly startDate?: Date | undefined;
    readonly endDate?: Date | undefined;
    constructor(employeeId: string, startDate?: Date | undefined, endDate?: Date | undefined);
}
export declare class GetFinalEvaluationsByEmployeeHandler implements IQueryHandler<GetFinalEvaluationsByEmployeeQuery, FinalEvaluationByEmployeeResult[]> {
    private readonly finalEvaluationRepository;
    private readonly employeeRepository;
    private readonly evaluationPeriodRepository;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>, employeeRepository: Repository<Employee>, evaluationPeriodRepository: Repository<EvaluationPeriod>);
    execute(query: GetFinalEvaluationsByEmployeeQuery): Promise<FinalEvaluationByEmployeeResult[]>;
}
