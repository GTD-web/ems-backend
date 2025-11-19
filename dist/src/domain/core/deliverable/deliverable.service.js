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
var DeliverableService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverableService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deliverable_entity_1 = require("./deliverable.entity");
const deliverable_exceptions_1 = require("./deliverable.exceptions");
let DeliverableService = DeliverableService_1 = class DeliverableService {
    deliverableRepository;
    logger = new common_1.Logger(DeliverableService_1.name);
    constructor(deliverableRepository) {
        this.deliverableRepository = deliverableRepository;
    }
    async 생성한다(createData) {
        this.logger.log(`산출물 생성 시작 - 이름: ${createData.name}`);
        this.유효성을_검사한다(createData);
        try {
            const deliverable = new deliverable_entity_1.Deliverable(createData);
            const saved = await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`산출물 생성 실패 - 이름: ${createData.name}`, error.stack);
            throw error;
        }
    }
    async 수정한다(id, updateData, updatedBy) {
        this.logger.log(`산출물 수정 시작 - ID: ${id}`);
        const deliverable = await this.조회한다(id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        if (updateData.name !== undefined) {
            this.이름_유효성을_검사한다(updateData.name);
        }
        try {
            deliverable.산출물을_수정한다(updateData.name, updateData.description, updateData.type, updateData.filePath, updateData.employeeId, updateData.wbsItemId, updatedBy);
            if (updateData.isActive !== undefined) {
                if (updateData.isActive) {
                    deliverable.활성화한다(updatedBy);
                }
                else {
                    deliverable.비활성화한다(updatedBy);
                }
            }
            const saved = await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`산출물 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`산출물 삭제 시작 - ID: ${id}`);
        const deliverable = await this.조회한다(id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        try {
            deliverable.메타데이터를_업데이트한다(deletedBy);
            deliverable.삭제한다();
            await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`산출물 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 조회한다(id) {
        this.logger.debug(`산출물 조회 - ID: ${id}`);
        try {
            return await this.deliverableRepository.findOne({
                where: { id },
            });
        }
        catch (error) {
            this.logger.error(`산출물 조회 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 필터_조회한다(filter) {
        this.logger.debug(`산출물 필터 조회 - 필터: ${JSON.stringify(filter)}`);
        try {
            let queryBuilder = this.deliverableRepository.createQueryBuilder('deliverable');
            if (filter.type) {
                queryBuilder.andWhere('deliverable.type = :type', {
                    type: filter.type,
                });
            }
            if (filter.employeeId) {
                queryBuilder.andWhere('deliverable.employeeId = :employeeId', {
                    employeeId: filter.employeeId,
                });
            }
            if (filter.wbsItemId) {
                queryBuilder.andWhere('deliverable.wbsItemId = :wbsItemId', {
                    wbsItemId: filter.wbsItemId,
                });
            }
            if (filter.mappedBy) {
                queryBuilder.andWhere('deliverable.mappedBy = :mappedBy', {
                    mappedBy: filter.mappedBy,
                });
            }
            if (filter.activeOnly) {
                queryBuilder.andWhere('deliverable.isActive = :isActive', {
                    isActive: true,
                });
            }
            if (filter.inactiveOnly) {
                queryBuilder.andWhere('deliverable.isActive = :isActive', {
                    isActive: false,
                });
            }
            if (filter.mappedDateFrom) {
                queryBuilder.andWhere('deliverable.mappedDate >= :mappedDateFrom', {
                    mappedDateFrom: filter.mappedDateFrom,
                });
            }
            if (filter.mappedDateTo) {
                queryBuilder.andWhere('deliverable.mappedDate <= :mappedDateTo', {
                    mappedDateTo: filter.mappedDateTo,
                });
            }
            const orderBy = filter.orderBy || 'createdAt';
            const orderDirection = filter.orderDirection || 'DESC';
            queryBuilder.orderBy(`deliverable.${orderBy}`, orderDirection);
            if (filter.page && filter.limit) {
                const offset = (filter.page - 1) * filter.limit;
                queryBuilder.skip(offset).take(filter.limit);
            }
            return await queryBuilder.getMany();
        }
        catch (error) {
            this.logger.error(`산출물 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
    async 중복_검사를_수행한다(name) {
        const existing = await this.deliverableRepository.findOne({
            where: {
                name,
            },
        });
        if (existing) {
            throw new deliverable_exceptions_1.DeliverableDuplicateException(name);
        }
    }
    유효성을_검사한다(data) {
        if (!data.name?.trim()) {
            throw new deliverable_exceptions_1.DeliverableValidationException('산출물명은 필수입니다.');
        }
        if (!data.type) {
            throw new deliverable_exceptions_1.DeliverableValidationException('산출물 유형은 필수입니다.');
        }
        this.이름_유효성을_검사한다(data.name);
    }
    이름_유효성을_검사한다(name) {
        if (name.length < 2) {
            throw new deliverable_exceptions_1.DeliverableValidationException('산출물명은 최소 2자 이상이어야 합니다.');
        }
        if (name.length > 255) {
            throw new deliverable_exceptions_1.DeliverableValidationException('산출물명은 최대 255자까지 가능합니다.');
        }
    }
    async 직원별_조회한다(employeeId) {
        this.logger.debug(`직원별 산출물 조회 - 직원: ${employeeId}`);
        try {
            return await this.필터_조회한다({ employeeId, activeOnly: true });
        }
        catch (error) {
            this.logger.error(`직원별 산출물 조회 실패 - 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async WBS항목별_조회한다(wbsItemId) {
        this.logger.debug(`WBS 항목별 산출물 조회 - WBS: ${wbsItemId}`);
        try {
            return await this.필터_조회한다({ wbsItemId, activeOnly: true });
        }
        catch (error) {
            this.logger.error(`WBS 항목별 산출물 조회 실패 - WBS: ${wbsItemId}`, error.stack);
            throw error;
        }
    }
    async 매핑한다(id, employeeId, wbsItemId, mappedBy) {
        this.logger.log(`산출물 매핑 시작 - ID: ${id}, 직원: ${employeeId}, WBS: ${wbsItemId}`);
        const deliverable = await this.조회한다(id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        try {
            deliverable.매핑한다(employeeId, wbsItemId, mappedBy);
            const saved = await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 매핑 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`산출물 매핑 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 매핑을_해제한다(id, unmappedBy) {
        this.logger.log(`산출물 매핑 해제 시작 - ID: ${id}`);
        const deliverable = await this.조회한다(id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        try {
            deliverable.매핑을_해제한다(unmappedBy);
            const saved = await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 매핑 해제 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`산출물 매핑 해제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 활성화한다(id, activatedBy) {
        this.logger.log(`산출물 활성화 시작 - ID: ${id}`);
        const deliverable = await this.조회한다(id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        try {
            deliverable.활성화한다(activatedBy);
            const saved = await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 활성화 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`산출물 활성화 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 비활성화한다(id, deactivatedBy) {
        this.logger.log(`산출물 비활성화 시작 - ID: ${id}`);
        const deliverable = await this.조회한다(id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        try {
            deliverable.비활성화한다(deactivatedBy);
            const saved = await this.deliverableRepository.save(deliverable);
            this.logger.log(`산출물 비활성화 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`산출물 비활성화 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
};
exports.DeliverableService = DeliverableService;
exports.DeliverableService = DeliverableService = DeliverableService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(deliverable_entity_1.Deliverable)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DeliverableService);
//# sourceMappingURL=deliverable.service.js.map