import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import type { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { PaginationQueryDto } from '@interface/common/dto/evaluation-period/evaluation-management.dto';
export declare class UserEvaluationPeriodManagementController {
    private readonly evaluationPeriodManagementService;
    constructor(evaluationPeriodManagementService: EvaluationPeriodManagementContextService);
    getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]>;
    getEvaluationPeriods(query: PaginationQueryDto): Promise<{
        items: EvaluationPeriodDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEvaluationPeriodDetail(periodId: string): Promise<EvaluationPeriodDto | null>;
}
