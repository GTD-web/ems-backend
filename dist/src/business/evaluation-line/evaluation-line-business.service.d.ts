import { CommandBus } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
export declare class EvaluationLineBusinessService {
    private readonly evaluationCriteriaManagementService;
    private readonly commandBus;
    private readonly logger;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, commandBus: CommandBus);
    일차_평가자를_구성한다(employeeId: string, periodId: string, evaluatorId: string, createdBy: string): Promise<{
        message: string;
        createdLines: number;
        createdMappings: number;
        mapping: {
            id: string;
            employeeId: string;
            evaluatorId: string;
            wbsItemId: string | null;
            evaluationLineId: string;
        };
    }>;
    이차_평가자를_구성한다(employeeId: string, wbsItemId: string, periodId: string, evaluatorId: string, createdBy: string): Promise<{
        message: string;
        createdLines: number;
        createdMappings: number;
        mapping: {
            id: string;
            employeeId: string;
            evaluatorId: string;
            wbsItemId: string;
            evaluationLineId: string;
        };
    }>;
    여러_피평가자의_일차_평가자를_일괄_구성한다(periodId: string, assignments: Array<{
        employeeId: string;
        evaluatorId: string;
    }>, createdBy: string): Promise<{
        periodId: string;
        totalCount: number;
        successCount: number;
        failureCount: number;
        createdLines: number;
        createdMappings: number;
        results: Array<{
            employeeId: string;
            evaluatorId: string;
            status: 'success' | 'error';
            message?: string;
            mapping?: {
                id: string;
                employeeId: string;
                evaluatorId: string;
                wbsItemId: string | null;
                evaluationLineId: string;
            };
            error?: string;
        }>;
    }>;
    여러_피평가자의_이차_평가자를_일괄_구성한다(periodId: string, assignments: Array<{
        employeeId: string;
        wbsItemId: string;
        evaluatorId: string;
    }>, createdBy: string): Promise<{
        periodId: string;
        totalCount: number;
        successCount: number;
        failureCount: number;
        createdLines: number;
        createdMappings: number;
        results: Array<{
            employeeId: string;
            wbsItemId: string;
            evaluatorId: string;
            status: 'success' | 'error';
            message?: string;
            mapping?: {
                id: string;
                employeeId: string;
                evaluatorId: string;
                wbsItemId: string;
                evaluationLineId: string;
            };
            error?: string;
        }>;
    }>;
}
