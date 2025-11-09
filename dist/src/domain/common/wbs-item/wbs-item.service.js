"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsItemService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const wbs_item_entity_1 = require("./wbs-item.entity");
const wbs_item_types_1 = require("./wbs-item.types");
let WbsItemService = class WbsItemService {
    wbsItemRepository;
    transactionManager;
    constructor(wbsItemRepository, transactionManager) {
        this.wbsItemRepository = wbsItemRepository;
        this.transactionManager = transactionManager;
    }
    async 생성한다(data, createdBy) {
        const existingWbsItem = await this.wbsItemRepository.findOne({
            where: {
                wbsCode: data.wbsCode,
                projectId: data.projectId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (existingWbsItem) {
            throw new Error(`프로젝트 내 WBS 코드 ${data.wbsCode}는 이미 사용 중입니다.`);
        }
        if (data.parentWbsId) {
            const parentWbs = await this.wbsItemRepository.findOne({
                where: { id: data.parentWbsId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!parentWbs) {
                throw new Error(`상위 WBS 항목 ID ${data.parentWbsId}를 찾을 수 없습니다.`);
            }
            if (parentWbs.projectId !== data.projectId) {
                throw new Error('상위 WBS 항목과 프로젝트가 일치하지 않습니다.');
            }
            if (data.level !== parentWbs.level + 1) {
                throw new Error(`WBS 레벨은 상위 항목 레벨(${parentWbs.level}) + 1이어야 합니다.`);
            }
        }
        else {
            if (data.level !== 1) {
                throw new Error('최상위 WBS 항목의 레벨은 1이어야 합니다.');
            }
        }
        const wbsItem = wbs_item_entity_1.WbsItem.생성한다(data, createdBy);
        const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
        return savedWbsItem.DTO로_변환한다();
    }
    async 수정한다(id, data, updatedBy) {
        const wbsItem = await this.wbsItemRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!wbsItem) {
            throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
        }
        if (data.wbsCode && data.wbsCode !== wbsItem.wbsCode) {
            const existingWbsItem = await this.wbsItemRepository.findOne({
                where: {
                    wbsCode: data.wbsCode,
                    projectId: data.projectId || wbsItem.projectId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (existingWbsItem && existingWbsItem.id !== id) {
                throw new Error(`프로젝트 내 WBS 코드 ${data.wbsCode}는 이미 사용 중입니다.`);
            }
        }
        if (data.parentWbsId !== undefined) {
            if (data.parentWbsId) {
                const parentWbs = await this.wbsItemRepository.findOne({
                    where: { id: data.parentWbsId, deletedAt: (0, typeorm_2.IsNull)() },
                });
                if (!parentWbs) {
                    throw new Error(`상위 WBS 항목 ID ${data.parentWbsId}를 찾을 수 없습니다.`);
                }
                if (parentWbs.projectId !== (data.projectId || wbsItem.projectId)) {
                    throw new Error('상위 WBS 항목과 프로젝트가 일치하지 않습니다.');
                }
                if (data.parentWbsId === id) {
                    throw new Error('자기 자신을 상위 WBS 항목으로 설정할 수 없습니다.');
                }
                const descendants = await this.하위_WBS_조회한다(id);
                if (descendants.some((desc) => desc.id === data.parentWbsId)) {
                    throw new Error('순환 참조가 발생합니다. 하위 WBS 항목을 상위로 설정할 수 없습니다.');
                }
            }
        }
        if (data.progressPercentage !== undefined) {
            if (data.progressPercentage < 0 || data.progressPercentage > 100) {
                throw new Error('진행률은 0-100 범위여야 합니다.');
            }
        }
        wbsItem.업데이트한다(data, updatedBy);
        const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
        return savedWbsItem.DTO로_변환한다();
    }
    async 삭제한다(id, deletedBy) {
        const wbsItem = await this.wbsItemRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!wbsItem) {
            throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
        }
        const childrenCount = await this.wbsItemRepository.count({
            where: { parentWbsId: id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (childrenCount > 0) {
            throw new Error('하위 WBS 항목이 있는 경우 삭제할 수 없습니다. 먼저 하위 항목을 삭제하세요.');
        }
        wbsItem.삭제한다(deletedBy);
        await this.wbsItemRepository.save(wbsItem);
    }
    async ID로_조회한다(id, manager) {
        const repository = this.transactionManager.getRepository(wbs_item_entity_1.WbsItem, this.wbsItemRepository, manager);
        const wbsItem = await repository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return wbsItem ? wbsItem.DTO로_변환한다() : null;
    }
    async WBS코드로_조회한다(wbsCode, projectId) {
        const wbsItem = await this.wbsItemRepository.findOne({
            where: { wbsCode, projectId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return wbsItem ? wbsItem.DTO로_변환한다() : null;
    }
    async 필터_조회한다(filter) {
        const queryBuilder = this.wbsItemRepository.createQueryBuilder('wbsItem');
        queryBuilder.where('wbsItem.deletedAt IS NULL');
        if (filter.status) {
            queryBuilder.andWhere('wbsItem.status = :status', {
                status: filter.status,
            });
        }
        if (filter.assignedToId) {
            queryBuilder.andWhere('wbsItem.assignedToId = :assignedToId', {
                assignedToId: filter.assignedToId,
            });
        }
        if (filter.projectId) {
            queryBuilder.andWhere('wbsItem.projectId = :projectId', {
                projectId: filter.projectId,
            });
        }
        if (filter.parentWbsId) {
            queryBuilder.andWhere('wbsItem.parentWbsId = :parentWbsId', {
                parentWbsId: filter.parentWbsId,
            });
        }
        if (filter.level) {
            queryBuilder.andWhere('wbsItem.level = :level', {
                level: filter.level,
            });
        }
        if (filter.startDateFrom) {
            queryBuilder.andWhere('wbsItem.startDate >= :startDateFrom', {
                startDateFrom: filter.startDateFrom,
            });
        }
        if (filter.startDateTo) {
            queryBuilder.andWhere('wbsItem.startDate <= :startDateTo', {
                startDateTo: filter.startDateTo,
            });
        }
        if (filter.endDateFrom) {
            queryBuilder.andWhere('wbsItem.endDate >= :endDateFrom', {
                endDateFrom: filter.endDateFrom,
            });
        }
        if (filter.endDateTo) {
            queryBuilder.andWhere('wbsItem.endDate <= :endDateTo', {
                endDateTo: filter.endDateTo,
            });
        }
        if (filter.progressMin !== undefined) {
            queryBuilder.andWhere('wbsItem.progressPercentage >= :progressMin', {
                progressMin: filter.progressMin,
            });
        }
        if (filter.progressMax !== undefined) {
            queryBuilder.andWhere('wbsItem.progressPercentage <= :progressMax', {
                progressMax: filter.progressMax,
            });
        }
        const wbsItems = await queryBuilder.getMany();
        return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 프로젝트별_조회한다(projectId) {
        const wbsItems = await this.wbsItemRepository.find({
            where: { projectId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { level: 'ASC', wbsCode: 'ASC' },
        });
        return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 담당자별_조회한다(assignedToId) {
        const wbsItems = await this.wbsItemRepository.find({
            where: { assignedToId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { startDate: 'ASC' },
        });
        return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 하위_WBS_조회한다(parentWbsId) {
        const wbsItems = await this.wbsItemRepository.find({
            where: { parentWbsId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { wbsCode: 'ASC' },
        });
        return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async WBS_트리_조회한다(projectId) {
        const allWbsItems = await this.프로젝트별_조회한다(projectId);
        const rootItems = allWbsItems.filter((item) => !item.parentWbsId);
        const buildTree = (parentId, depth = 0) => {
            const children = allWbsItems.filter((item) => item.parentWbsId === parentId);
            return children.map((wbsItem) => {
                const childNodes = buildTree(wbsItem.id, depth + 1);
                return {
                    wbsItem,
                    children: childNodes,
                    depth,
                    hasChildren: childNodes.length > 0,
                };
            });
        };
        return buildTree(null);
    }
    async 존재하는가(id) {
        const count = await this.wbsItemRepository.count({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async WBS코드가_존재하는가(wbsCode, projectId, excludeId) {
        const queryBuilder = this.wbsItemRepository.createQueryBuilder('wbsItem');
        queryBuilder.where('wbsItem.wbsCode = :wbsCode', { wbsCode });
        queryBuilder.andWhere('wbsItem.projectId = :projectId', { projectId });
        queryBuilder.andWhere('wbsItem.deletedAt IS NULL');
        if (excludeId) {
            queryBuilder.andWhere('wbsItem.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        return count > 0;
    }
    async 상태_변경한다(id, status, updatedBy) {
        const wbsItem = await this.wbsItemRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!wbsItem) {
            throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
        }
        wbsItem.status = status;
        if (status === wbs_item_types_1.WbsItemStatus.COMPLETED) {
            wbsItem.progressPercentage = 100;
        }
        wbsItem.수정자를_설정한다(updatedBy);
        const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
        return savedWbsItem.DTO로_변환한다();
    }
    async 진행률_업데이트한다(id, progressPercentage, updatedBy) {
        if (progressPercentage < 0 || progressPercentage > 100) {
            throw new Error('진행률은 0-100 범위여야 합니다.');
        }
        const wbsItem = await this.wbsItemRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!wbsItem) {
            throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
        }
        wbsItem.progressPercentage = progressPercentage;
        if (progressPercentage === 100 &&
            wbsItem.status !== wbs_item_types_1.WbsItemStatus.COMPLETED) {
            wbsItem.status = wbs_item_types_1.WbsItemStatus.COMPLETED;
        }
        else if (progressPercentage > 0 &&
            progressPercentage < 100 &&
            wbsItem.status === wbs_item_types_1.WbsItemStatus.PENDING) {
            wbsItem.status = wbs_item_types_1.WbsItemStatus.IN_PROGRESS;
        }
        wbsItem.수정자를_설정한다(updatedBy);
        const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
        return savedWbsItem.DTO로_변환한다();
    }
};
exports.WbsItemService = WbsItemService;
exports.WbsItemService = WbsItemService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], WbsItemService);
//# sourceMappingURL=wbs-item.service.js.map