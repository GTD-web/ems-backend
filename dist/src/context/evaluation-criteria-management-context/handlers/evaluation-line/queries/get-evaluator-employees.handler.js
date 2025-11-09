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
exports.GetEvaluatorEmployeesHandler = exports.GetEvaluatorEmployeesQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
class GetEvaluatorEmployeesQuery {
    evaluationPeriodId;
    evaluatorId;
    constructor(evaluationPeriodId, evaluatorId) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.evaluatorId = evaluatorId;
    }
}
exports.GetEvaluatorEmployeesQuery = GetEvaluatorEmployeesQuery;
let GetEvaluatorEmployeesHandler = class GetEvaluatorEmployeesHandler {
    evaluationLineMappingRepository;
    constructor(evaluationLineMappingRepository) {
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
    }
    async execute(query) {
        const mappings = await this.evaluationLineMappingRepository.find({
            where: {
                evaluationPeriodId: query.evaluationPeriodId,
                evaluatorId: query.evaluatorId
            },
            order: { createdAt: 'DESC' },
        });
        const employeeMap = new Map();
        mappings.forEach((mapping) => {
            const dto = mapping.DTO로_변환한다();
            const key = `${dto.employeeId}-${dto.wbsItemId || 'no-wbs'}`;
            if (!employeeMap.has(key)) {
                employeeMap.set(key, {
                    employeeId: dto.employeeId,
                    wbsItemId: dto.wbsItemId,
                    evaluationLineId: dto.evaluationLineId,
                    createdBy: dto.createdBy,
                    updatedBy: dto.updatedBy,
                    createdAt: dto.createdAt,
                    updatedAt: dto.updatedAt,
                });
            }
        });
        return {
            evaluatorId: query.evaluatorId,
            employees: Array.from(employeeMap.values()),
        };
    }
};
exports.GetEvaluatorEmployeesHandler = GetEvaluatorEmployeesHandler;
exports.GetEvaluatorEmployeesHandler = GetEvaluatorEmployeesHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetEvaluatorEmployeesQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetEvaluatorEmployeesHandler);
//# sourceMappingURL=get-evaluator-employees.handler.js.map