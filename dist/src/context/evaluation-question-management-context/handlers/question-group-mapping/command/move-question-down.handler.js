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
var MoveQuestionDownHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveQuestionDownHandler = exports.MoveQuestionDownCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_mapping_entity_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.entity");
class MoveQuestionDownCommand {
    mappingId;
    updatedBy;
    constructor(mappingId, updatedBy) {
        this.mappingId = mappingId;
        this.updatedBy = updatedBy;
    }
}
exports.MoveQuestionDownCommand = MoveQuestionDownCommand;
let MoveQuestionDownHandler = MoveQuestionDownHandler_1 = class MoveQuestionDownHandler {
    questionGroupMappingRepository;
    logger = new common_1.Logger(MoveQuestionDownHandler_1.name);
    constructor(questionGroupMappingRepository) {
        this.questionGroupMappingRepository = questionGroupMappingRepository;
    }
    async execute(command) {
        this.logger.log('질문 순서 아래로 이동 시작', command);
        const { mappingId, updatedBy } = command;
        const currentMapping = await this.questionGroupMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.id = :mappingId', { mappingId })
            .andWhere('mapping.deletedAt IS NULL')
            .getOne();
        if (!currentMapping) {
            throw new common_1.NotFoundException(`질문-그룹 매핑을 찾을 수 없습니다. (id: ${mappingId})`);
        }
        const nextMapping = await this.questionGroupMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.groupId = :groupId', { groupId: currentMapping.groupId })
            .andWhere('mapping.displayOrder > :currentOrder', {
            currentOrder: currentMapping.displayOrder,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .orderBy('mapping.displayOrder', 'ASC')
            .getOne();
        if (!nextMapping) {
            throw new common_1.BadRequestException('이미 마지막 위치입니다.');
        }
        const currentOrder = currentMapping.displayOrder;
        const nextOrder = nextMapping.displayOrder;
        currentMapping.표시순서변경한다(nextOrder, updatedBy);
        nextMapping.표시순서변경한다(currentOrder, updatedBy);
        await this.questionGroupMappingRepository.save([
            currentMapping,
            nextMapping,
        ]);
        this.logger.log(`질문 순서 아래로 이동 완료 - 매핑 ID: ${mappingId}, ${currentOrder} -> ${nextOrder}`);
    }
};
exports.MoveQuestionDownHandler = MoveQuestionDownHandler;
exports.MoveQuestionDownHandler = MoveQuestionDownHandler = MoveQuestionDownHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(MoveQuestionDownCommand),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MoveQuestionDownHandler);
//# sourceMappingURL=move-question-down.handler.js.map