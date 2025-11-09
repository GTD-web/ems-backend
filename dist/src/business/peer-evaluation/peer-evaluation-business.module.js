"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_context_module_1 = require("../../context/performance-evaluation-context/performance-evaluation-context.module");
const peer_evaluation_business_service_1 = require("./peer-evaluation-business.service");
let PeerEvaluationBusinessModule = class PeerEvaluationBusinessModule {
};
exports.PeerEvaluationBusinessModule = PeerEvaluationBusinessModule;
exports.PeerEvaluationBusinessModule = PeerEvaluationBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [performance_evaluation_context_module_1.PerformanceEvaluationContextModule],
        providers: [peer_evaluation_business_service_1.PeerEvaluationBusinessService],
        exports: [peer_evaluation_business_service_1.PeerEvaluationBusinessService],
    })
], PeerEvaluationBusinessModule);
//# sourceMappingURL=peer-evaluation-business.module.js.map