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
var Phase5DeliverableGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase5DeliverableGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faker_1 = require("@faker-js/faker");
const deliverable_entity_1 = require("../../../domain/core/deliverable/deliverable.entity");
const deliverable_types_1 = require("../../../domain/core/deliverable/deliverable.types");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase5DeliverableGenerator = Phase5DeliverableGenerator_1 = class Phase5DeliverableGenerator {
    deliverableRepository;
    logger = new common_1.Logger(Phase5DeliverableGenerator_1.name);
    constructor(deliverableRepository) {
        this.deliverableRepository = deliverableRepository;
    }
    async generate(config, phase1Result, phase2Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 5: 산출물 생성');
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const wbsIds = phase1Result.generatedIds.wbsIds;
        const employeeIds = phase1Result.generatedIds.employeeIds;
        const deliverables = await this.생성_산출물들(wbsIds, employeeIds, dist, systemAdminId);
        this.logger.log(`생성 완료: Deliverable ${deliverables.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 5 완료 (${duration}ms)`);
        return {
            phase: 'Phase5',
            entityCounts: {
                Deliverable: deliverables.length,
            },
            generatedIds: {
                deliverableIds: deliverables.map((d) => d.id),
            },
            duration,
        };
    }
    async 생성_산출물들(wbsIds, employeeIds, dist, systemAdminId) {
        const deliverables = [];
        const deliverableTypes = [
            deliverable_types_1.DeliverableType.DOCUMENT,
            deliverable_types_1.DeliverableType.CODE,
            deliverable_types_1.DeliverableType.DESIGN,
            deliverable_types_1.DeliverableType.REPORT,
            deliverable_types_1.DeliverableType.PRESENTATION,
            deliverable_types_1.DeliverableType.OTHER,
        ];
        for (const wbsId of wbsIds) {
            const deliverableCountChoice = utils_1.ProbabilityUtil.selectByProbability(dist.deliverablePerWbs);
            let deliverableCount = 0;
            switch (deliverableCountChoice) {
                case 'none':
                    deliverableCount = 0;
                    break;
                case 'one':
                    deliverableCount = 1;
                    break;
                case 'twoToThree':
                    deliverableCount = utils_1.ProbabilityUtil.randomInt(2, 3);
                    break;
                case 'fourOrMore':
                    deliverableCount = utils_1.ProbabilityUtil.randomInt(4, 6);
                    break;
            }
            for (let i = 0; i < deliverableCount; i++) {
                const randomEmployee = employeeIds[Math.floor(Math.random() * employeeIds.length)];
                const typeChoice = utils_1.ProbabilityUtil.selectByProbability(dist.deliverableType);
                const deliverable = new deliverable_entity_1.Deliverable({
                    name: faker_1.faker.commerce.productName(),
                    description: faker_1.faker.lorem.sentence(),
                    type: deliverableTypes[Math.floor(Math.random() * deliverableTypes.length)],
                    filePath: typeChoice === 'url'
                        ? faker_1.faker.internet.url()
                        : `/nas/project/${faker_1.faker.string.uuid()}/file.pdf`,
                    employeeId: randomEmployee,
                    wbsItemId: wbsId,
                    mappedBy: systemAdminId,
                    mappedDate: new Date(),
                    isActive: true,
                    createdBy: systemAdminId,
                });
                deliverables.push(deliverable);
            }
        }
        return await this.배치로_저장한다(this.deliverableRepository, deliverables, '산출물');
    }
    async 배치로_저장한다(repository, entities, entityName) {
        const saved = [];
        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
            const batch = entities.slice(i, i + BATCH_SIZE);
            const result = await repository.save(batch);
            saved.push(...result);
            this.logger.log(`${entityName} 저장 진행: ${Math.min(i + BATCH_SIZE, entities.length)}/${entities.length}`);
        }
        return saved;
    }
};
exports.Phase5DeliverableGenerator = Phase5DeliverableGenerator;
exports.Phase5DeliverableGenerator = Phase5DeliverableGenerator = Phase5DeliverableGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(deliverable_entity_1.Deliverable)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], Phase5DeliverableGenerator);
//# sourceMappingURL=phase5-deliverable.generator.js.map