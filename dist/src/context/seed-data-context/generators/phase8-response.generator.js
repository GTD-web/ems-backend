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
var Phase8ResponseGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase8ResponseGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faker_1 = require("@faker-js/faker");
const evaluation_response_entity_1 = require("../../../domain/sub/evaluation-response/evaluation-response.entity");
const evaluation_response_types_1 = require("../../../domain/sub/evaluation-response/evaluation-response.types");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase8ResponseGenerator = Phase8ResponseGenerator_1 = class Phase8ResponseGenerator {
    evaluationResponseRepository;
    logger = new common_1.Logger(Phase8ResponseGenerator_1.name);
    constructor(evaluationResponseRepository) {
        this.evaluationResponseRepository = evaluationResponseRepository;
    }
    async generate(config, phase1Result, phase6Result, phase7Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 8: 응답 생성');
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const questionIds = (phase6Result.generatedIds?.questionIds ||
            []);
        const selfEvaluationIds = (phase7Result.generatedIds?.selfEvaluationIds ||
            []);
        const responses = await this.생성_평가응답들(questionIds, selfEvaluationIds, dist, systemAdminId);
        this.logger.log(`생성 완료: EvaluationResponse ${responses.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 8 완료 (${duration}ms)`);
        return {
            phase: 'Phase8',
            entityCounts: {
                EvaluationResponse: responses.length,
            },
            generatedIds: {
                responseIds: responses.map((r) => r.id),
            },
            duration,
        };
    }
    async 생성_평가응답들(questionIds, evaluationIds, dist, systemAdminId) {
        const responses = [];
        for (let i = 0; i < Math.min(10, evaluationIds.length); i++) {
            const evaluationId = evaluationIds[i];
            const questionCount = utils_1.ProbabilityUtil.randomInt(1, Math.min(3, questionIds.length));
            const selectedQuestions = this.랜덤_선택(questionIds, questionCount);
            for (const questionId of selectedQuestions) {
                const shouldRespond = Math.random() < dist.evaluationResponseRatio.hasResponse;
                if (shouldRespond) {
                    const response = new evaluation_response_entity_1.EvaluationResponse();
                    response.questionId = questionId;
                    response.evaluationId = evaluationId;
                    response.evaluationType = evaluation_response_types_1.EvaluationResponseType.SELF;
                    response.score = utils_1.ScoreGeneratorUtil.generateNormalScore(dist.scoreGeneration.min, dist.scoreGeneration.max, dist.scoreGeneration.mean, dist.scoreGeneration.stdDev);
                    response.answer = faker_1.faker.lorem.paragraph();
                    response.createdBy = systemAdminId;
                    responses.push(response);
                }
            }
        }
        return await this.배치로_저장한다(this.evaluationResponseRepository, responses, '평가 응답');
    }
    랜덤_선택(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
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
exports.Phase8ResponseGenerator = Phase8ResponseGenerator;
exports.Phase8ResponseGenerator = Phase8ResponseGenerator = Phase8ResponseGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_response_entity_1.EvaluationResponse)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], Phase8ResponseGenerator);
//# sourceMappingURL=phase8-response.generator.js.map