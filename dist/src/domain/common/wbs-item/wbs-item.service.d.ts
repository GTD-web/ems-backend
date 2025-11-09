import { Repository, EntityManager } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsItem } from './wbs-item.entity';
import { CreateWbsItemDto, UpdateWbsItemDto, WbsItemDto, WbsItemFilter, WbsItemStatus, WbsTreeNode } from './wbs-item.types';
export declare class WbsItemService {
    private readonly wbsItemRepository;
    private readonly transactionManager;
    constructor(wbsItemRepository: Repository<WbsItem>, transactionManager: TransactionManagerService);
    생성한다(data: CreateWbsItemDto, createdBy: string): Promise<WbsItemDto>;
    수정한다(id: string, data: UpdateWbsItemDto, updatedBy: string): Promise<WbsItemDto>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    ID로_조회한다(id: string, manager?: EntityManager): Promise<WbsItemDto | null>;
    WBS코드로_조회한다(wbsCode: string, projectId: string): Promise<WbsItemDto | null>;
    필터_조회한다(filter: WbsItemFilter): Promise<WbsItemDto[]>;
    프로젝트별_조회한다(projectId: string): Promise<WbsItemDto[]>;
    담당자별_조회한다(assignedToId: string): Promise<WbsItemDto[]>;
    하위_WBS_조회한다(parentWbsId: string): Promise<WbsItemDto[]>;
    WBS_트리_조회한다(projectId: string): Promise<WbsTreeNode[]>;
    존재하는가(id: string): Promise<boolean>;
    WBS코드가_존재하는가(wbsCode: string, projectId: string, excludeId?: string): Promise<boolean>;
    상태_변경한다(id: string, status: WbsItemStatus, updatedBy: string): Promise<WbsItemDto>;
    진행률_업데이트한다(id: string, progressPercentage: number, updatedBy: string): Promise<WbsItemDto>;
}
