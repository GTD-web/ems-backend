import { Repository } from 'typeorm';
import { WbsItem } from './wbs-item.entity';
import { WbsItemDto, WbsItemStatus } from './wbs-item.types';
export declare class WbsItemTestService {
    private readonly wbsItemRepository;
    constructor(wbsItemRepository: Repository<WbsItem>);
    테스트용_목데이터를_생성한다(projectId: string): Promise<WbsItemDto[]>;
    특정_WBS_테스트데이터를_생성한다(wbsData: {
        wbsCode: string;
        title: string;
        status?: WbsItemStatus;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
        assignedToId?: string;
        projectId: string;
        parentWbsId?: string;
        level?: number;
    }): Promise<WbsItemDto>;
    랜덤_테스트데이터를_생성한다(projectId: string, count?: number): Promise<WbsItemDto[]>;
    테스트_데이터를_정리한다(): Promise<number>;
    모든_테스트데이터를_삭제한다(): Promise<number>;
    상태별_WBS_테스트데이터를_생성한다(projectId: string, status: WbsItemStatus, count?: number): Promise<WbsItemDto[]>;
    담당자별_WBS_테스트데이터를_생성한다(projectId: string, assignedToId: string, count?: number): Promise<WbsItemDto[]>;
    계층구조_WBS_테스트데이터를_생성한다(projectId: string, maxLevel?: number, itemsPerLevel?: number): Promise<WbsItemDto[]>;
}
