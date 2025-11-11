import type { AuthenticatedUser } from '@interface/decorators';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { CreateDeliverableDto, UpdateDeliverableDto, BulkCreateDeliverablesDto, BulkDeleteDeliverablesDto, DeliverableResponseDto, DeliverableListResponseDto, BulkCreateResultDto, BulkDeleteResultDto, GetDeliverablesQueryDto } from './dto/deliverable.dto';
export declare class DeliverableManagementController {
    private readonly performanceEvaluationService;
    constructor(performanceEvaluationService: PerformanceEvaluationService);
    createDeliverable(dto: CreateDeliverableDto, user: AuthenticatedUser): Promise<DeliverableResponseDto>;
    bulkCreateDeliverables(dto: BulkCreateDeliverablesDto, user: AuthenticatedUser): Promise<BulkCreateResultDto>;
    bulkDeleteDeliverables(dto: BulkDeleteDeliverablesDto, user: AuthenticatedUser): Promise<BulkDeleteResultDto>;
    deleteAllDeliverables(user: AuthenticatedUser): Promise<BulkDeleteResultDto>;
    updateDeliverable(id: string, dto: UpdateDeliverableDto, user: AuthenticatedUser): Promise<DeliverableResponseDto>;
    deleteDeliverable(id: string, user: AuthenticatedUser): Promise<void>;
    getEmployeeDeliverables(employeeId: string, query: GetDeliverablesQueryDto): Promise<DeliverableListResponseDto>;
    getWbsDeliverables(wbsItemId: string, query: GetDeliverablesQueryDto): Promise<DeliverableListResponseDto>;
    getDeliverableDetail(id: string): Promise<DeliverableResponseDto>;
    private toResponseDto;
}
