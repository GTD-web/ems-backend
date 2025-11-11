import { Repository } from 'typeorm';
import { Deliverable } from './deliverable.entity';
import type { CreateDeliverableData, UpdateDeliverableData, DeliverableFilter } from './deliverable.types';
export declare class DeliverableService {
    private readonly deliverableRepository;
    private readonly logger;
    constructor(deliverableRepository: Repository<Deliverable>);
    생성한다(createData: CreateDeliverableData): Promise<Deliverable>;
    수정한다(id: string, updateData: UpdateDeliverableData, updatedBy: string): Promise<Deliverable>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    조회한다(id: string): Promise<Deliverable | null>;
    필터_조회한다(filter: DeliverableFilter): Promise<Deliverable[]>;
    private 중복_검사를_수행한다;
    private 유효성을_검사한다;
    private 이름_유효성을_검사한다;
    직원별_조회한다(employeeId: string): Promise<Deliverable[]>;
    WBS항목별_조회한다(wbsItemId: string): Promise<Deliverable[]>;
    매핑한다(id: string, employeeId: string, wbsItemId: string, mappedBy: string): Promise<Deliverable>;
    매핑을_해제한다(id: string, unmappedBy: string): Promise<Deliverable>;
    활성화한다(id: string, activatedBy: string): Promise<Deliverable>;
    비활성화한다(id: string, deactivatedBy: string): Promise<Deliverable>;
}
