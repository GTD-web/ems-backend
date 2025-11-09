import { BaseEntity } from '@libs/database/base/base.entity';
import { IDeliverable } from './interfaces/deliverable.interface';
import { DeliverableType } from './deliverable.types';
import type { DeliverableDto, CreateDeliverableData } from './deliverable.types';
export declare class Deliverable extends BaseEntity<DeliverableDto> implements IDeliverable {
    name: string;
    description?: string;
    type: DeliverableType;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    mappedDate?: Date;
    mappedBy?: string;
    isActive: boolean;
    constructor(data?: CreateDeliverableData);
    산출물을_수정한다(name?: string, description?: string, type?: DeliverableType, filePath?: string, employeeId?: string, wbsItemId?: string, updatedBy?: string): void;
    직원에게_할당되었는가(employeeId: string): boolean;
    WBS항목에_연결되었는가(wbsItemId: string): boolean;
    활성화한다(activatedBy?: string): void;
    비활성화한다(deactivatedBy?: string): void;
    매핑한다(employeeId: string, wbsItemId: string, mappedBy: string): void;
    매핑을_해제한다(unmappedBy?: string): void;
    삭제한다(): void;
    DTO로_변환한다(): DeliverableDto;
}
