"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationQuestionMappingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const peer_evaluation_question_mapping_entity_1 = require("./peer-evaluation-question-mapping.entity");
const peer_evaluation_question_mapping_service_1 = require("./peer-evaluation-question-mapping.service");
let PeerEvaluationQuestionMappingModule = class PeerEvaluationQuestionMappingModule {
};
exports.PeerEvaluationQuestionMappingModule = PeerEvaluationQuestionMappingModule;
exports.PeerEvaluationQuestionMappingModule = PeerEvaluationQuestionMappingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping])],
        providers: [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService],
        exports: [typeorm_1.TypeOrmModule, peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService],
    })
], PeerEvaluationQuestionMappingModule);
//# sourceMappingURL=peer-evaluation-question-mapping.module.js.map