import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
export declare class GetWbsAssignmentDetailQuery {
    readonly employeeId: string;
    readonly wbsItemId: string;
    readonly projectId: string;
    readonly periodId: string;
    constructor(employeeId: string, wbsItemId: string, projectId: string, periodId: string);
}
export interface WbsAssignmentDetailResult {
    id: string;
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | undefined;
    updatedBy: string | undefined;
    employee: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    department: {
        id: string;
        name: string;
        code: string;
    } | null;
    project: {
        id: string;
        name: string;
        code: string;
        status: string;
        startDate: Date;
        endDate: Date;
    } | null;
    wbsItem: {
        id: string;
        wbsCode: string;
        title: string;
        status: string;
        level: number;
        startDate: Date;
        endDate: Date;
        progressPercentage: string;
    } | null;
    period: {
        id: string;
        name: string;
        startDate: Date;
        status: string;
    } | null;
    assignedByEmployee: {
        id: string;
        name: string;
        employeeNumber: string;
    } | null;
}
export declare class GetWbsAssignmentDetailHandler implements IQueryHandler<GetWbsAssignmentDetailQuery> {
    private readonly wbsAssignmentRepository;
    constructor(wbsAssignmentRepository: Repository<EvaluationWbsAssignment>);
    execute(query: GetWbsAssignmentDetailQuery): Promise<WbsAssignmentDetailResult | null>;
}
