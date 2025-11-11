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
exports.CreateEvaluationPeriodCommandHandler = exports.CreateEvaluationPeriodCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_exceptions_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.exceptions");
class CreateEvaluationPeriodCommand {
    createData;
    createdBy;
    constructor(createData, createdBy) {
        this.createData = createData;
        this.createdBy = createdBy;
    }
}
exports.CreateEvaluationPeriodCommand = CreateEvaluationPeriodCommand;
let CreateEvaluationPeriodCommandHandler = class CreateEvaluationPeriodCommandHandler {
    evaluationPeriodService;
    evaluationPeriodRepository;
    constructor(evaluationPeriodService, evaluationPeriodRepository) {
        this.evaluationPeriodService = evaluationPeriodService;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
    }
    async execute(command) {
        const { createData, createdBy } = command;
        const createDto = {
            name: createData.name,
            startDate: createData.startDate,
            description: createData.description,
            peerEvaluationDeadline: createData.peerEvaluationDeadline,
            maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
            gradeRanges: createData.gradeRanges,
        };
        await this.이름중복검증한다(createDto.name);
        await this.기간겹침검증한다(createDto.startDate, createDto.peerEvaluationDeadline);
        const createdPeriod = await this.evaluationPeriodService.생성한다(createDto, createdBy);
        return createdPeriod;
    }
    async 이름중복검증한다(name) {
        const count = await this.evaluationPeriodRepository
            .createQueryBuilder('period')
            .where('period.name = :name', { name })
            .getCount();
        if (count > 0) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodNameDuplicateException(name);
        }
    }
    async 기간겹침검증한다(startDate, peerEvaluationDeadline) {
        if (!peerEvaluationDeadline) {
            return;
        }
        const conflictingPeriod = await this.evaluationPeriodRepository
            .createQueryBuilder('period')
            .where('(period.startDate <= :peerEvaluationDeadline AND period.peerEvaluationDeadline >= :startDate)', { startDate, peerEvaluationDeadline })
            .getOne();
        if (conflictingPeriod) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodOverlapException(startDate, peerEvaluationDeadline, conflictingPeriod.id);
        }
    }
};
exports.CreateEvaluationPeriodCommandHandler = CreateEvaluationPeriodCommandHandler;
exports.CreateEvaluationPeriodCommandHandler = CreateEvaluationPeriodCommandHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateEvaluationPeriodCommand),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService,
        typeorm_2.Repository])
], CreateEvaluationPeriodCommandHandler);
//# sourceMappingURL=create-evaluation-period.handler.js.map