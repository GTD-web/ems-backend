import { DeliverableBusinessService } from '@business/deliverable/deliverable-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { BulkCreateDeliverablesDto, BulkCreateResultDto, BulkDeleteDeliverablesDto, BulkDeleteResultDto, CreateDeliverableDto, DeliverableListResponseDto, DeliverableResponseDto, GetDeliverablesQueryDto, UpdateDeliverableDto } from './dto/deliverable.dto';
export declare class UserDeliverableManagementController {
    private readonly deliverableBusinessService;
    constructor(deliverableBusinessService: DeliverableBusinessService);
    createDeliverable(dto: CreateDeliverableDto, user: AuthenticatedUser): Promise<DeliverableResponseDto>;
    bulkCreateDeliverables(dto: BulkCreateDeliverablesDto, user: AuthenticatedUser): Promise<BulkCreateResultDto>;
    bulkDeleteDeliverables(dto: BulkDeleteDeliverablesDto, user: AuthenticatedUser): Promise<BulkDeleteResultDto>;
    updateDeliverable(id: string, dto: UpdateDeliverableDto, user: AuthenticatedUser): Promise<DeliverableResponseDto>;
    deleteDeliverable(id: string, user: AuthenticatedUser): Promise<void>;
    getEmployeeDeliverables(employeeId: string, query: GetDeliverablesQueryDto): Promise<DeliverableListResponseDto>;
    getDeliverableDetail(id: string): Promise<DeliverableResponseDto>;
    private toResponseDto;
}
