"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthContextModule = void 0;
const common_1 = require("@nestjs/common");
const common_domain_module_1 = require("../../domain/common/common-domain.module");
const auth_service_1 = require("./auth.service");
const handlers_1 = require("./handlers");
let AuthContextModule = class AuthContextModule {
};
exports.AuthContextModule = AuthContextModule;
exports.AuthContextModule = AuthContextModule = __decorate([
    (0, common_1.Module)({
        imports: [common_domain_module_1.CommonDomainModule],
        providers: [
            auth_service_1.AuthService,
            handlers_1.VerifyAndSyncUserHandler,
            handlers_1.GetUserWithRolesHandler,
            handlers_1.LoginHandler,
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthContextModule);
//# sourceMappingURL=auth-context.module.js.map