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
var ResetAllEvaluationLinesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetAllEvaluationLinesHandler = exports.ResetAllEvaluationLinesCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_mapping_service_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
class ResetAllEvaluationLinesCommand {
    deletedBy;
    constructor(deletedBy) {
        this.deletedBy = deletedBy;
    }
}
exports.ResetAllEvaluationLinesCommand = ResetAllEvaluationLinesCommand;
let ResetAllEvaluationLinesHandler = ResetAllEvaluationLinesHandler_1 = class ResetAllEvaluationLinesHandler {
    dataSource;
    evaluationLineMappingService;
    downwardEvaluationService;
    peerEvaluationService;
    peerEvaluationQuestionMappingService;
    logger = new common_1.Logger(ResetAllEvaluationLinesHandler_1.name);
    constructor(dataSource, evaluationLineMappingService, downwardEvaluationService, peerEvaluationService, peerEvaluationQuestionMappingService) {
        this.dataSource = dataSource;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.downwardEvaluationService = downwardEvaluationService;
        this.peerEvaluationService = peerEvaluationService;
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
    }
    async execute(command) {
        const { deletedBy } = command;
        this.logger.log(`모든 평가라인 리셋 시작 - 삭제자: ${deletedBy}`);
        return await this.dataSource.transaction(async (manager) => {
            const deletedCounts = {
                peerEvaluationQuestionMappings: 0,
                peerEvaluations: 0,
                downwardEvaluations: 0,
                evaluationLineMappings: 0,
            };
            this.logger.log('1단계: 모든 동료평가 질문 매핑 삭제 시작');
            const allPeerEvaluations = await this.peerEvaluationService.필터_조회한다({});
            for (const peerEval of allPeerEvaluations) {
                const mappings = await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(peerEval.id);
                if (mappings.length > 0) {
                    await this.peerEvaluationQuestionMappingService.동료평가의_질문매핑을_전체삭제한다(peerEval.id, deletedBy);
                    deletedCounts.peerEvaluationQuestionMappings += mappings.length;
                }
            }
            this.logger.log('2단계: 모든 동료평가 삭제 시작');
            for (const peerEval of allPeerEvaluations) {
                await this.peerEvaluationService.삭제한다(peerEval.id, deletedBy);
                deletedCounts.peerEvaluations++;
            }
            this.logger.log('3단계: 모든 하향평가 삭제 시작');
            const allDownwardEvaluations = await this.downwardEvaluationService.필터_조회한다({});
            for (const downwardEval of allDownwardEvaluations) {
                await this.downwardEvaluationService.삭제한다(downwardEval.id, deletedBy);
                deletedCounts.downwardEvaluations++;
            }
            this.logger.log('4단계: 모든 평가라인 매핑 삭제 시작');
            deletedCounts.evaluationLineMappings =
                await this.evaluationLineMappingService.모든_평가라인을_삭제한다(deletedBy, manager);
            this.logger.log('모든 평가라인 리셋 완료', {
                deletedCounts,
            });
            return {
                deletedCounts,
                message: '모든 평가라인 데이터가 성공적으로 리셋되었습니다.',
            };
        });
    }
};
exports.ResetAllEvaluationLinesHandler = ResetAllEvaluationLinesHandler;
exports.ResetAllEvaluationLinesHandler = ResetAllEvaluationLinesHandler = ResetAllEvaluationLinesHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(ResetAllEvaluationLinesCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        downward_evaluation_service_1.DownwardEvaluationService,
        peer_evaluation_service_1.PeerEvaluationService,
        peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService])
], ResetAllEvaluationLinesHandler);
//# sourceMappingURL=reset-all-evaluation-lines.handler.js.map