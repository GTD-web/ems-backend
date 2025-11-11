"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const peer_evaluation_entity_1 = require("./peer-evaluation.entity");
const peer_evaluation_service_1 = require("./peer-evaluation.service");
let PeerEvaluationModule = class PeerEvaluationModule {
};
exports.PeerEvaluationModule = PeerEvaluationModule;
exports.PeerEvaluationModule = PeerEvaluationModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([peer_evaluation_entity_1.PeerEvaluation])],
        providers: [peer_evaluation_service_1.PeerEvaluationService],
        exports: [peer_evaluation_service_1.PeerEvaluationService],
    })
], PeerEvaluationModule);
//# sourceMappingURL=peer-evaluation.module.js.map