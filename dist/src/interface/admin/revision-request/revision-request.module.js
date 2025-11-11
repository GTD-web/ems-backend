"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionRequestModule = void 0;
const common_1 = require("@nestjs/common");
const revision_request_controller_1 = require("./revision-request.controller");
const revision_request_context_1 = require("../../../context/revision-request-context");
const revision_request_business_module_1 = require("../../../business/revision-request/revision-request-business.module");
let RevisionRequestModule = class RevisionRequestModule {
};
exports.RevisionRequestModule = RevisionRequestModule;
exports.RevisionRequestModule = RevisionRequestModule = __decorate([
    (0, common_1.Module)({
        imports: [
            revision_request_context_1.RevisionRequestContextModule,
            revision_request_business_module_1.RevisionRequestBusinessModule,
        ],
        controllers: [revision_request_controller_1.RevisionRequestController],
    })
], RevisionRequestModule);
//# sourceMappingURL=revision-request.module.js.map