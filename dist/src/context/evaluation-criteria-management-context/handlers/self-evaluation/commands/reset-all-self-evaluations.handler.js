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
var ResetAllSelfEvaluationsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetAllSelfEvaluationsHandler = exports.ResetAllSelfEvaluationsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
class ResetAllSelfEvaluationsCommand {
    deletedBy;
    constructor(deletedBy) {
        this.deletedBy = deletedBy;
    }
}
exports.ResetAllSelfEvaluationsCommand = ResetAllSelfEvaluationsCommand;
let ResetAllSelfEvaluationsHandler = ResetAllSelfEvaluationsHandler_1 = class ResetAllSelfEvaluationsHandler {
    dataSource;
    selfEvaluationService;
    downwardEvaluationService;
    logger = new common_1.Logger(ResetAllSelfEvaluationsHandler_1.name);
    constructor(dataSource, selfEvaluationService, downwardEvaluationService) {
        this.dataSource = dataSource;
        this.selfEvaluationService = selfEvaluationService;
        this.downwardEvaluationService = downwardEvaluationService;
    }
    async execute(command) {
        const { deletedBy } = command;
        this.logger.log(`모든 자기평가 리셋 시작 - 삭제자: ${deletedBy}`);
        return await this.dataSource.transaction(async (manager) => {
            const deletedCounts = {
                downwardEvaluations: 0,
                selfEvaluations: 0,
            };
            this.logger.log('1단계: 모든 자기평가 조회 시작');
            const allSelfEvaluations = await this.selfEvaluationService.필터_조회한다({});
            this.logger.log(`조회된 자기평가 개수: ${allSelfEvaluations.length}개`);
            this.logger.log('2단계: 자기평가에 연결된 하향평가 삭제 시작');
            for (const selfEval of allSelfEvaluations) {
                const downwardEvaluations = await this.downwardEvaluationService.필터_조회한다({
                    selfEvaluationId: selfEval.id,
                });
                for (const downwardEval of downwardEvaluations) {
                    await this.downwardEvaluationService.삭제한다(downwardEval.id, deletedBy);
                    deletedCounts.downwardEvaluations++;
                }
            }
            this.logger.log(`하향평가 삭제 완료: ${deletedCounts.downwardEvaluations}개`);
            this.logger.log('3단계: 모든 자기평가 삭제 시작');
            for (const selfEval of allSelfEvaluations) {
                await this.selfEvaluationService.삭제한다(selfEval.id, deletedBy);
                deletedCounts.selfEvaluations++;
            }
            this.logger.log(`자기평가 삭제 완료: ${deletedCounts.selfEvaluations}개`);
            const message = `모든 자기평가 리셋 완료 - 자기평가 ${deletedCounts.selfEvaluations}개, 하향평가 ${deletedCounts.downwardEvaluations}개 삭제`;
            this.logger.log(message);
            return {
                deletedCounts,
                message,
            };
        });
    }
};
exports.ResetAllSelfEvaluationsHandler = ResetAllSelfEvaluationsHandler;
exports.ResetAllSelfEvaluationsHandler = ResetAllSelfEvaluationsHandler = ResetAllSelfEvaluationsHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(ResetAllSelfEvaluationsCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        downward_evaluation_service_1.DownwardEvaluationService])
], ResetAllSelfEvaluationsHandler);
//# sourceMappingURL=reset-all-self-evaluations.handler.js.map