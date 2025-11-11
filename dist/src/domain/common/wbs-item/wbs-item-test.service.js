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
exports.WbsItemTestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_item_entity_1 = require("./wbs-item.entity");
const wbs_item_types_1 = require("./wbs-item.types");
let WbsItemTestService = class WbsItemTestService {
    wbsItemRepository;
    constructor(wbsItemRepository) {
        this.wbsItemRepository = wbsItemRepository;
    }
    async 테스트용_목데이터를_생성한다(projectId) {
        await this.테스트_데이터를_정리한다();
        const testWbsItems = [
            {
                wbsCode: '1.0',
                title: '프로젝트 기획 및 설계',
                status: wbs_item_types_1.WbsItemStatus.COMPLETED,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-02-28'),
                progressPercentage: 100,
                assignedToId: undefined,
                projectId,
                parentWbsId: undefined,
                level: 1,
            },
            {
                wbsCode: '2.0',
                title: '시스템 개발',
                status: wbs_item_types_1.WbsItemStatus.IN_PROGRESS,
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-08-31'),
                progressPercentage: 65,
                assignedToId: undefined,
                projectId,
                parentWbsId: undefined,
                level: 1,
            },
            {
                wbsCode: '3.0',
                title: '테스트 및 검증',
                status: wbs_item_types_1.WbsItemStatus.PENDING,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-10-31'),
                progressPercentage: 0,
                assignedToId: undefined,
                projectId,
                parentWbsId: undefined,
                level: 1,
            },
            {
                wbsCode: '4.0',
                title: '배포 및 운영',
                status: wbs_item_types_1.WbsItemStatus.PENDING,
                startDate: new Date('2024-11-01'),
                endDate: new Date('2024-12-31'),
                progressPercentage: 0,
                assignedToId: undefined,
                projectId,
                parentWbsId: undefined,
                level: 1,
            },
        ];
        const wbsItems = testWbsItems.map((wbs) => {
            const wbsItem = new wbs_item_entity_1.WbsItem(wbs.wbsCode, wbs.title, wbs.status, wbs.startDate, wbs.endDate, wbs.progressPercentage, wbs.assignedToId, wbs.projectId, wbs.parentWbsId, wbs.level);
            return wbsItem;
        });
        const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
        const systemDevWbs = savedWbsItems.find((item) => item.wbsCode === '2.0');
        if (systemDevWbs) {
            const subWbsItems = [
                {
                    wbsCode: '2.1',
                    title: '백엔드 API 개발',
                    status: wbs_item_types_1.WbsItemStatus.COMPLETED,
                    startDate: new Date('2024-03-01'),
                    endDate: new Date('2024-05-31'),
                    progressPercentage: 100,
                    assignedToId: undefined,
                    projectId,
                    parentWbsId: systemDevWbs.id,
                    level: 2,
                },
                {
                    wbsCode: '2.2',
                    title: '프론트엔드 개발',
                    status: wbs_item_types_1.WbsItemStatus.IN_PROGRESS,
                    startDate: new Date('2024-04-01'),
                    endDate: new Date('2024-07-31'),
                    progressPercentage: 75,
                    assignedToId: undefined,
                    projectId,
                    parentWbsId: systemDevWbs.id,
                    level: 2,
                },
                {
                    wbsCode: '2.3',
                    title: '데이터베이스 설계 및 구축',
                    status: wbs_item_types_1.WbsItemStatus.COMPLETED,
                    startDate: new Date('2024-03-15'),
                    endDate: new Date('2024-04-30'),
                    progressPercentage: 100,
                    assignedToId: undefined,
                    projectId,
                    parentWbsId: systemDevWbs.id,
                    level: 2,
                },
                {
                    wbsCode: '2.4',
                    title: '시스템 통합',
                    status: wbs_item_types_1.WbsItemStatus.IN_PROGRESS,
                    startDate: new Date('2024-08-01'),
                    endDate: new Date('2024-08-31'),
                    progressPercentage: 30,
                    assignedToId: undefined,
                    projectId,
                    parentWbsId: systemDevWbs.id,
                    level: 2,
                },
            ];
            const subWbsEntities = subWbsItems.map((sub) => {
                return new wbs_item_entity_1.WbsItem(sub.wbsCode, sub.title, sub.status, sub.startDate, sub.endDate, sub.progressPercentage, sub.assignedToId, sub.projectId, sub.parentWbsId, sub.level);
            });
            const savedSubWbsItems = await this.wbsItemRepository.save(subWbsEntities);
            savedWbsItems.push(...savedSubWbsItems);
            const backendWbs = savedSubWbsItems.find((item) => item.wbsCode === '2.1');
            if (backendWbs) {
                const backendSubItems = [
                    {
                        wbsCode: '2.1.1',
                        title: '사용자 인증 API',
                        status: wbs_item_types_1.WbsItemStatus.COMPLETED,
                        startDate: new Date('2024-03-01'),
                        endDate: new Date('2024-03-31'),
                        progressPercentage: 100,
                        assignedToId: undefined,
                        projectId,
                        parentWbsId: backendWbs.id,
                        level: 3,
                    },
                    {
                        wbsCode: '2.1.2',
                        title: '평가 관리 API',
                        status: wbs_item_types_1.WbsItemStatus.COMPLETED,
                        startDate: new Date('2024-04-01'),
                        endDate: new Date('2024-04-30'),
                        progressPercentage: 100,
                        assignedToId: undefined,
                        projectId,
                        parentWbsId: backendWbs.id,
                        level: 3,
                    },
                    {
                        wbsCode: '2.1.3',
                        title: '보고서 생성 API',
                        status: wbs_item_types_1.WbsItemStatus.COMPLETED,
                        startDate: new Date('2024-05-01'),
                        endDate: new Date('2024-05-31'),
                        progressPercentage: 100,
                        assignedToId: undefined,
                        projectId,
                        parentWbsId: backendWbs.id,
                        level: 3,
                    },
                ];
                const backendSubEntities = backendSubItems.map((sub) => {
                    return new wbs_item_entity_1.WbsItem(sub.wbsCode, sub.title, sub.status, sub.startDate, sub.endDate, sub.progressPercentage, sub.assignedToId, sub.projectId, sub.parentWbsId, sub.level);
                });
                const savedBackendSubItems = await this.wbsItemRepository.save(backendSubEntities);
                savedWbsItems.push(...savedBackendSubItems);
            }
        }
        return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 특정_WBS_테스트데이터를_생성한다(wbsData) {
        const wbsItem = new wbs_item_entity_1.WbsItem(wbsData.wbsCode, wbsData.title, wbsData.status || wbs_item_types_1.WbsItemStatus.PENDING, wbsData.startDate, wbsData.endDate, wbsData.progressPercentage, wbsData.assignedToId, wbsData.projectId, wbsData.parentWbsId, wbsData.level || 1);
        const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
        return savedWbsItem.DTO로_변환한다();
    }
    async 랜덤_테스트데이터를_생성한다(projectId, count = 10) {
        const wbsItems = [];
        const statuses = [
            wbs_item_types_1.WbsItemStatus.PENDING,
            wbs_item_types_1.WbsItemStatus.IN_PROGRESS,
            wbs_item_types_1.WbsItemStatus.COMPLETED,
            wbs_item_types_1.WbsItemStatus.CANCELLED,
            wbs_item_types_1.WbsItemStatus.ON_HOLD,
        ];
        const wbsTypes = [
            '분석',
            '설계',
            '개발',
            '테스트',
            '검토',
            '배포',
            '문서화',
            '통합',
        ];
        for (let i = 0; i < count; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
            const startYear = 2024;
            const startMonth = Math.floor(Math.random() * 12);
            const startDay = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 3) + 1;
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(startYear, startMonth + duration, startDay);
            const wbsItem = new wbs_item_entity_1.WbsItem(`TEST${String(i + 1).padStart(3, '0')}`, `테스트${wbsType}작업${i + 1}`, status, startDate, endDate, Math.floor(Math.random() * 101), undefined, projectId, undefined, 1);
            wbsItems.push(wbsItem);
        }
        const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
        return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 테스트_데이터를_정리한다() {
        const result = await this.wbsItemRepository
            .createQueryBuilder()
            .delete()
            .where('wbsCode LIKE :pattern1 OR wbsCode LIKE :pattern2 OR title LIKE :pattern3', {
            pattern1: 'TEST%',
            pattern2: '테스트%',
            pattern3: '테스트%',
        })
            .execute();
        return result.affected || 0;
    }
    async 모든_테스트데이터를_삭제한다() {
        const result = await this.wbsItemRepository
            .createQueryBuilder()
            .delete()
            .execute();
        return result.affected || 0;
    }
    async 상태별_WBS_테스트데이터를_생성한다(projectId, status, count = 5) {
        const wbsItems = [];
        const wbsTypes = [
            '분석',
            '설계',
            '개발',
            '테스트',
            '검토',
            '배포',
            '문서화',
            '통합',
        ];
        for (let i = 0; i < count; i++) {
            const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
            const startYear = 2024;
            const startMonth = Math.floor(Math.random() * 12);
            const startDay = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 3) + 1;
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(startYear, startMonth + duration, startDay);
            let progressPercentage = 0;
            if (status === wbs_item_types_1.WbsItemStatus.COMPLETED) {
                progressPercentage = 100;
            }
            else if (status === wbs_item_types_1.WbsItemStatus.IN_PROGRESS) {
                progressPercentage = Math.floor(Math.random() * 80) + 10;
            }
            else if (status === wbs_item_types_1.WbsItemStatus.ON_HOLD) {
                progressPercentage = Math.floor(Math.random() * 50) + 10;
            }
            const wbsItem = new wbs_item_entity_1.WbsItem(`${status.slice(0, 3).toUpperCase()}${String(i + 1).padStart(3, '0')}`, `${status}${wbsType}작업${i + 1}`, status, startDate, endDate, progressPercentage, undefined, projectId, undefined, 1);
            wbsItems.push(wbsItem);
        }
        const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
        return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 담당자별_WBS_테스트데이터를_생성한다(projectId, assignedToId, count = 3) {
        const wbsItems = [];
        const wbsTypes = [
            '분석',
            '설계',
            '개발',
            '테스트',
            '검토',
            '배포',
            '문서화',
            '통합',
        ];
        const statuses = [
            wbs_item_types_1.WbsItemStatus.PENDING,
            wbs_item_types_1.WbsItemStatus.IN_PROGRESS,
            wbs_item_types_1.WbsItemStatus.COMPLETED,
        ];
        for (let i = 0; i < count; i++) {
            const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const startYear = 2024;
            const startMonth = Math.floor(Math.random() * 12);
            const startDay = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 3) + 1;
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(startYear, startMonth + duration, startDay);
            let progressPercentage = 0;
            if (status === wbs_item_types_1.WbsItemStatus.COMPLETED) {
                progressPercentage = 100;
            }
            else if (status === wbs_item_types_1.WbsItemStatus.IN_PROGRESS) {
                progressPercentage = Math.floor(Math.random() * 80) + 10;
            }
            const wbsItem = new wbs_item_entity_1.WbsItem(`${assignedToId.slice(-3).toUpperCase()}${String(i + 1).padStart(3, '0')}`, `${assignedToId}담당${wbsType}작업${i + 1}`, status, startDate, endDate, progressPercentage, assignedToId, projectId, undefined, 1);
            wbsItems.push(wbsItem);
        }
        const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
        return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
    async 계층구조_WBS_테스트데이터를_생성한다(projectId, maxLevel = 3, itemsPerLevel = 2) {
        const allWbsItems = [];
        const wbsTypes = [
            '분석',
            '설계',
            '개발',
            '테스트',
            '검토',
            '배포',
            '문서화',
            '통합',
        ];
        for (let i = 0; i < itemsPerLevel; i++) {
            const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
            const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            const endDate = new Date(2024, Math.floor(Math.random() * 12) + 3, Math.floor(Math.random() * 28) + 1);
            const wbsItem = new wbs_item_entity_1.WbsItem(`${i + 1}.0`, `1단계${wbsType}작업${i + 1}`, wbs_item_types_1.WbsItemStatus.IN_PROGRESS, startDate, endDate, Math.floor(Math.random() * 80) + 10, undefined, projectId, undefined, 1);
            allWbsItems.push(wbsItem);
        }
        const savedLevel1Items = await this.wbsItemRepository.save(allWbsItems);
        allWbsItems.length = 0;
        allWbsItems.push(...savedLevel1Items);
        for (let level = 2; level <= maxLevel; level++) {
            const parentItems = allWbsItems.filter((item) => item.level === level - 1);
            const newLevelItems = [];
            for (const parentItem of parentItems) {
                for (let j = 0; j < itemsPerLevel; j++) {
                    const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
                    const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                    const endDate = new Date(2024, Math.floor(Math.random() * 12) + 2, Math.floor(Math.random() * 28) + 1);
                    const wbsItem = new wbs_item_entity_1.WbsItem(`${parentItem.wbsCode}.${j + 1}`, `${level}단계${wbsType}작업${j + 1}`, wbs_item_types_1.WbsItemStatus.PENDING, startDate, endDate, Math.floor(Math.random() * 50), undefined, projectId, parentItem.id, level);
                    newLevelItems.push(wbsItem);
                }
            }
            const savedLevelItems = await this.wbsItemRepository.save(newLevelItems);
            allWbsItems.push(...savedLevelItems);
        }
        return allWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
    }
};
exports.WbsItemTestService = WbsItemTestService;
exports.WbsItemTestService = WbsItemTestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WbsItemTestService);
//# sourceMappingURL=wbs-item-test.service.js.map