import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type { EvaluationProjectAssignmentDto } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type { EvaluationWbsAssignmentDto } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
export declare class GetEmployeeEvaluationSettingsQuery {
    readonly employeeId: string;
    readonly periodId: string;
    constructor(employeeId: string, periodId: string);
}
export interface EmployeeEvaluationSettingsResult {
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLineMappings: EvaluationLineMappingDto[];
}
export declare class GetEmployeeEvaluationSettingsHandler implements IQueryHandler<GetEmployeeEvaluationSettingsQuery, EmployeeEvaluationSettingsResult> {
    private readonly evaluationProjectAssignmentRepository;
    private readonly evaluationWbsAssignmentRepository;
    private readonly evaluationLineMappingRepository;
    private readonly logger;
    constructor(evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>, evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>);
    execute(query: GetEmployeeEvaluationSettingsQuery): Promise<EmployeeEvaluationSettingsResult>;
}
