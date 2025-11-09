"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationRevisionRequestModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_revision_request_entity_1 = require("./evaluation-revision-request.entity");
const evaluation_revision_request_recipient_entity_1 = require("./evaluation-revision-request-recipient.entity");
const evaluation_revision_request_service_1 = require("./evaluation-revision-request.service");
let EvaluationRevisionRequestModule = class EvaluationRevisionRequestModule {
};
exports.EvaluationRevisionRequestModule = EvaluationRevisionRequestModule;
exports.EvaluationRevisionRequestModule = EvaluationRevisionRequestModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                evaluation_revision_request_entity_1.EvaluationRevisionRequest,
                evaluation_revision_request_recipient_entity_1.EvaluationRevisionRequestRecipient,
            ]),
        ],
        providers: [evaluation_revision_request_service_1.EvaluationRevisionRequestService],
        exports: [evaluation_revision_request_service_1.EvaluationRevisionRequestService],
    })
], EvaluationRevisionRequestModule);
//# sourceMappingURL=evaluation-revision-request.module.js.map